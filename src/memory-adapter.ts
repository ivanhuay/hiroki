import { DocumentNotFoundError } from './errors';
import type { HirokiAdapter, UpdateConfig } from './adapter';
import type { UpdateSet } from './model';
import type { ValidConditions } from './validator';
import type { HirokiQuery, HirokiFilter, HirokiSort } from './query';

export class MemoryAdapter implements HirokiAdapter {
  readonly modelName: string;
  private store: Map<string, Record<string, unknown>> = new Map();
  private nextId = 1;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  canHandle(resource: unknown): boolean {
    return resource === this.modelName;
  }

  async findById(id: string, query?: HirokiQuery): Promise<unknown> {
    const doc = this.store.get(id);
    if (!doc) throw new DocumentNotFoundError(404);
    return this._select(doc, query?.select);
  }

  async find(query: HirokiQuery): Promise<unknown[]> {
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

    if (query.sort?.length) results = this._sort(results, query.sort);
    if (query.offset) results = results.slice(query.offset);
    if (query.limit) results = results.slice(0, query.limit);
    if (query.select?.length) {
      results = results.map((doc) => this._select(doc, query.select) as Record<string, unknown>);
    }

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
    const doc = this.store.get(id);
    if (!doc) throw new DocumentNotFoundError(404);
    this.store.delete(id);
    return doc;
  }

  // Reset store — useful in tests between cases
  clear(): void {
    this.store.clear();
    this.nextId = 1;
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
