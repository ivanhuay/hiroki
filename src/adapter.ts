import type { HirokiQuery } from './query';
import type { UpdateSet } from './model';
import type { ValidConditions } from './validator';

export interface UpdateConfig {
  fast?: boolean;
}

export interface HirokiAdapter {
  readonly modelName: string;
  canHandle(resource: unknown): boolean;
  findById(id: string, query?: HirokiQuery): Promise<unknown>;
  find(query: HirokiQuery): Promise<unknown>;
  count(query?: HirokiQuery): Promise<number>;
  distinct(field: string): Promise<unknown[]>;
  create(data: Record<string, unknown>): Promise<unknown>;
  updateById(id: string, data: UpdateSet, config?: UpdateConfig): Promise<unknown>;
  updateByConditions(
    conditions: ValidConditions | undefined,
    data: UpdateSet,
    config?: UpdateConfig
  ): Promise<unknown>;
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
