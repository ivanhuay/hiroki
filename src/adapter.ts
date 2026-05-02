import type { HirokiQuery } from './query';
import type { UpdateSet } from './model';
import type { ValidConditions } from './validator';
import type { HirokiLogger } from './logger';

export interface UpdateConfig {
  fast?: boolean;
}

/**
 * Contract that every Hiroki data adapter must satisfy.
 *
 * Implement this interface to connect any data source (SQL, in-memory, REST, etc.)
 * to the Hiroki controller layer.
 *
 * @example
 * class MyAdapter implements HirokiAdapter {
 *   readonly modelName = 'MyModel';
 *   canHandle(r: unknown) { return r === this.modelName; }
 *   // … implement remaining methods
 * }
 */
export interface HirokiAdapter {
  /** Unique name identifying the resource (used for routing and logging). */
  readonly modelName: string;
  /** Returns `true` when this adapter can serve the given model/resource reference. */
  canHandle(resource: unknown): boolean;
  /** Optional — called by the controller to inject the active logger after construction. */
  setLogger?(logger: HirokiLogger): void;
  /** Fetch a single document by its ID. */
  findById(id: string, query?: HirokiQuery): Promise<unknown>;
  /** Fetch a list of documents matching the query. */
  find(query: HirokiQuery): Promise<unknown>;
  /** Return the total count of documents matching the query. */
  count(query?: HirokiQuery): Promise<number>;
  /** Return unique values for a field across all documents. */
  distinct(field: string): Promise<unknown[]>;
  /** Create a new document from `data`. */
  create(data: Record<string, unknown>): Promise<unknown>;
  /** Update a document by ID, applying `data` as a partial set. */
  updateById(id: string, data: UpdateSet, config?: UpdateConfig): Promise<unknown>;
  /** Update the first document matching `conditions`. */
  updateByConditions(
    conditions: ValidConditions | undefined,
    data: UpdateSet,
    config?: UpdateConfig
  ): Promise<unknown>;
  /** Delete a document by ID. Returns the deleted document. */
  delete(id: string): Promise<unknown>;
}

export class AdapterRegistry {
  private factories: Array<(resource: unknown) => HirokiAdapter | null> = [];

  register(factory: (resource: unknown) => HirokiAdapter | null): void {
    this.factories.push(factory);
  }

  resolve(resource: unknown): HirokiAdapter | null {
    for (const factory of this.factories) {
      const adapter = factory(resource);
      if (adapter?.canHandle(resource)) return adapter;
    }
    return null;
  }
}

export const adapterRegistry = new AdapterRegistry();
