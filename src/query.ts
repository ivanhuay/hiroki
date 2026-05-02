import type { ValidConditions } from './validator';

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

export function parseHirokiQuery(searchParams: URLSearchParams): HirokiQuery {
  const query: HirokiQuery = {};
  const filters: HirokiFilter[] = [];
  const legacyConditions: Record<string, unknown> = {};
  let hasLegacyConditions = false;

  for (const [key, raw] of searchParams.entries()) {
    const whereMatch = key.match(WHERE_PATTERN);
    if (whereMatch) {
      const field = whereMatch[1];
      if (DANGEROUS_FIELDS.has(field)) continue;
      const op: FilterOperator = whereMatch[2] ? (OP_MAP[whereMatch[2]] ?? 'eq') : 'eq';
      const value = op === 'in' || op === 'nin'
        ? raw.split(',').map(coerceValue)
        : coerceValue(raw);
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
