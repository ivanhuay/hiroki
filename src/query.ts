import type { ValidConditions } from './validator';
import { BadRequestError } from './errors.js';

export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex';

export interface HirokiFilter {
  field: string;
  op: FilterOperator;
  value: unknown;
}

export interface HirokiSort {
  field: string;
  dir: 'asc' | 'desc';
}

export interface HirokiQuery {
  where?: HirokiFilter[];
  limit?: number;
  offset?: number;
  sort?: HirokiSort[];
  select?: string[];
  populate?: string;
  conditions?: ValidConditions; // legacy escape hatch for raw DB filters
}

/** Safety caps applied during query parsing. Requests that exceed a limit throw HTTP 400. */
export interface QueryLimits {
  /** Maximum number of `where[]` filter entries per request. Default: `20`. */
  maxFilters?: number;
  /** Maximum number of values in a single `$in` or `$nin` array. Default: `100`. */
  maxInValues?: number;
  /** Maximum character length of a `$regex` value. Prevents ReDoS. Default: `200`. */
  maxRegexLength?: number;
}

const DEFAULT_LIMITS: Required<QueryLimits> = {
  maxFilters: 20,
  maxInValues: 100,
  maxRegexLength: 200,
};

const DANGEROUS_FIELDS = new Set(['__proto__', 'constructor', 'prototype']);

const OP_MAP: Record<string, FilterOperator> = {
  $eq: 'eq',
  $ne: 'ne',
  $gt: 'gt',
  $gte: 'gte',
  $lt: 'lt',
  $lte: 'lte',
  $in: 'in',
  $nin: 'nin',
  $regex: 'regex',
};

function coerceValue(value: string): string | number | boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') return num;
  return value;
}

// where[field]=value  or  where[field][$op]=value
const WHERE_PATTERN = /^where\[(\w+)\](?:\[(\$\w+)\])?$/;
// conditions[field]=value  (legacy)
const CONDITIONS_PATTERN = /^conditions\[(\w+)\]$/;

/**
 * Parse URL search params into a `HirokiQuery` AST.
 *
 * Supported params:
 * - `where[field]=value` — equality filter
 * - `where[field][$gt]=18` — operator filter (`$eq $ne $gt $gte $lt $lte $in $nin $regex`)
 * - `where[tags][$in]=a,b` — array filter (comma-separated)
 * - `sort=-name,age` — multi-field sort (`-` prefix = descending)
 * - `select=name,email` — field projection
 * - `limit=10` / `offset=5` / `skip=5` — pagination
 * - `populate=books` — relation population (passed through to adapter)
 * - `conditions={"field":"value"}` — legacy raw filter (JSON string)
 * - `conditions[field]=value` — legacy raw filter (bracket notation)
 */
export function parseHirokiQuery(searchParams: URLSearchParams, limits?: QueryLimits): HirokiQuery {
  const lim = { ...DEFAULT_LIMITS, ...limits };
  const query: HirokiQuery = {};
  const filters: HirokiFilter[] = [];
  const legacyConditions: Record<string, unknown> = {};
  let hasLegacyConditions = false;

  for (const [key, raw] of searchParams.entries()) {
    const whereMatch = key.match(WHERE_PATTERN);
    if (whereMatch) {
      const field = whereMatch[1];
      if (DANGEROUS_FIELDS.has(field)) continue;
      if (filters.length >= lim.maxFilters) {
        throw new BadRequestError(`Too many where filters (max ${lim.maxFilters})`, 'QUERY_LIMIT_EXCEEDED');
      }
      const op: FilterOperator = whereMatch[2] ? (OP_MAP[whereMatch[2]] ?? 'eq') : 'eq';

      if (op === 'regex' && raw.length > lim.maxRegexLength) {
        throw new BadRequestError(`Regex too long (max ${lim.maxRegexLength} chars)`, 'QUERY_LIMIT_EXCEEDED');
      }

      const value = op === 'in' || op === 'nin'
        ? raw.split(',').map(coerceValue)
        : coerceValue(raw);

      if ((op === 'in' || op === 'nin') && (value as unknown[]).length > lim.maxInValues) {
        throw new BadRequestError(`Too many values in ${op} filter (max ${lim.maxInValues})`, 'QUERY_LIMIT_EXCEEDED');
      }

      filters.push({ field, op, value });
      continue;
    }

    const condMatch = key.match(CONDITIONS_PATTERN);
    if (condMatch) {
      if (DANGEROUS_FIELDS.has(condMatch[1])) continue;
      legacyConditions[condMatch[1]] = coerceValue(raw);
      hasLegacyConditions = true;
      continue;
    }

    switch (key) {
      case 'limit':
        query.limit = parseInt(raw, 10);
        break;
      case 'offset':
      case 'skip':
        query.offset = parseInt(raw, 10);
        break;
      case 'sort':
        query.sort = raw.split(',').map((s) => {
          const desc = s.startsWith('-');
          return { field: desc ? s.slice(1) : s, dir: desc ? 'desc' : 'asc' } as HirokiSort;
        });
        break;
      case 'select':
        query.select = raw.split(',');
        break;
      case 'populate':
        query.populate = raw;
        break;
      case 'conditions':
        // legacy: conditions={"field":"value"} JSON string
        query.conditions = raw;
        break;
    }
  }

  if (filters.length) query.where = filters;
  if (hasLegacyConditions) query.conditions = legacyConditions;

  return query;
}
