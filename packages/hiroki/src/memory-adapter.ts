import { DocumentNotFoundError } from './errors';
import type { HirokiAdapter, UpdateConfig } from './adapter';
import type { UpdateSet } from './model';
import type { ValidConditions } from './validator';
import type { HirokiQuery, HirokiFilter, HirokiSort } from './query';
import type { HirokiLogger } from './logger';

/**
 * Zero-dependency in-memory adapter. Useful for testing, prototyping, and
 * environments without a real database.
 *
 * @example
 * hiroki.importModel('Products', { adapter: new MemoryAdapter('Products') });
 *
 * // In tests — reset state between cases:
 * const adapter = new MemoryAdapter('Users');
 * afterEach(() => adapter.clear());
 */
export class MemoryAdapter implements HirokiAdapter {
  readonly modelName: string;
  private store: Map<string, Record<string, unknown>> = new Map();
  private nextId = 1;
  private logger?: HirokiLogger;

  constructor(modelName: string, logger?: HirokiLogger) {
    this.modelName = modelName;
    this.logger = logger;
  }

  setLogger(logger: HirokiLogger): void {
    this.logger = logger;
  }

  canHandle(resource: unknown): boolean {
    return resource === this.modelName;
  }

  async findById(id: string, query?: HirokiQuery): Promise<unknown> {
    this.logger?.debug(`[${this.modelName}] findById id=${id}`);
    const doc = this.store.get(id);
    if (!doc) throw new DocumentNotFoundError(404);
    return this._select(doc, query?.select);
  }

  async find(query: HirokiQuery): Promise<unknown[]> {
    this.logger?.debug(`[${this.modelName}] find where=${JSON.stringify(query.where)} limit=${query.limit} offset=${query.offset}`);
    let results = Array.from(this.store.values());

    if (query.where?.length) {
      results = results.filter((doc) => this._matchAll(doc, query.where!));
    }

    if (query.conditions && typeof query.conditions === 'object') {
      const cond = query.conditions as Record<string, unknown>;
      results = results.filter((doc) =>
        Object.entries(cond).every(([k, v]) => doc[k] === v)
      );
    }

    if (query.serverFilter && Object.keys(query.serverFilter).length) {
      results = results.filter((doc) => this._matchServerFilter(doc, query.serverFilter!));
    }

    if (query.sort?.length) results = this._sort(results, query.sort);
    if (query.offset) results = results.slice(query.offset);
    if (query.limit) results = results.slice(0, query.limit);
    if (query.select?.length) {
      results = results.map((doc) => this._select(doc, query.select) as Record<string, unknown>);
    }

    this.logger?.debug(`[${this.modelName}] find → ${results.length} results`);
    return results;
  }

  async count(query?: HirokiQuery): Promise<number> {
    if (!query?.where?.length && !query?.conditions) return this.store.size;
    return (await this.find(query ?? {})).length;
  }

  async distinct(field: string): Promise<unknown[]> {
    return Array.from(new Set(Array.from(this.store.values()).map((doc) => doc[field])));
  }

  async create(data: Record<string, unknown>): Promise<unknown> {
    const id = String(this.nextId++);
    const doc = { ...data, id };
    this.store.set(id, doc);
    this.logger?.debug(`[${this.modelName}] create → id=${id}`);
    return doc;
  }

  async updateById(id: string, set: UpdateSet, _config?: UpdateConfig): Promise<unknown> {
    const doc = this.store.get(id);
    if (!doc) throw new DocumentNotFoundError(404);
    const updated = { ...doc, ...set };
    this.store.set(id, updated);
    return updated;
  }

  async updateByConditions(
    conditions: ValidConditions | undefined,
    set: UpdateSet,
    _config?: UpdateConfig
  ): Promise<unknown> {
    if (!conditions || typeof conditions !== 'object') throw new DocumentNotFoundError(404);
    const cond = conditions as Record<string, unknown>;
    const entry = Array.from(this.store.entries()).find(([, doc]) =>
      Object.entries(cond).every(([k, v]) => doc[k] === v)
    );
    if (!entry) throw new DocumentNotFoundError(404);
    const updated = { ...entry[1], ...set };
    this.store.set(entry[0], updated);
    return updated;
  }

  async delete(id: string): Promise<unknown> {
    this.logger?.debug(`[${this.modelName}] delete id=${id}`);
    const doc = this.store.get(id);
    if (!doc) throw new DocumentNotFoundError(404);
    this.store.delete(id);
    return doc;
  }

  /** Reset all stored documents and reset the auto-increment ID counter. */
  clear(): void {
    this.store.clear();
    this.nextId = 1;
  }

  private _matchServerFilter(doc: Record<string, unknown>, filter: Record<string, unknown>): boolean {
    for (const [key, val] of Object.entries(filter)) {
      if (key === '$or' && Array.isArray(val)) {
        if (!val.some((c) => this._matchServerFilter(doc, c as Record<string, unknown>))) return false;
        continue;
      }
      if (key === '$and' && Array.isArray(val)) {
        if (!val.every((c) => this._matchServerFilter(doc, c as Record<string, unknown>))) return false;
        continue;
      }
      if (doc[key] !== val) return false;
    }
    return true;
  }

  private _matchAll(doc: Record<string, unknown>, filters: HirokiFilter[]): boolean {
    return filters.every((f) => this._match(doc, f));
  }

  private _match(doc: Record<string, unknown>, f: HirokiFilter): boolean {
    const val = doc[f.field];
    switch (f.op) {
      case 'eq':    return val === f.value;
      case 'ne':    return val !== f.value;
      case 'gt':    return (val as number) > (f.value as number);
      case 'gte':   return (val as number) >= (f.value as number);
      case 'lt':    return (val as number) < (f.value as number);
      case 'lte':   return (val as number) <= (f.value as number);
      case 'in':    return (f.value as unknown[]).includes(val);
      case 'nin':   return !(f.value as unknown[]).includes(val);
      case 'regex': return new RegExp(String(f.value)).test(String(val));
      default:      return true;
    }
  }

  private _sort(
    docs: Record<string, unknown>[],
    sort: HirokiSort[]
  ): Record<string, unknown>[] {
    return [...docs].sort((a, b) => {
      for (const s of sort) {
        const av = a[s.field];
        const bv = b[s.field];
        if (av === bv) continue;
        const cmp = av! < bv! ? -1 : 1;
        return s.dir === 'desc' ? -cmp : cmp;
      }
      return 0;
    });
  }

  private _select(doc: Record<string, unknown>, fields?: string[]): unknown {
    if (!fields?.length) return doc;
    return Object.fromEntries(fields.map((k) => [k, doc[k]]));
  }
}
