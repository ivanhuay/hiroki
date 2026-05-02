# Custom Adapter

Implement `HirokiAdapter` to connect any data source.

## Minimal example

```ts
import type { HirokiAdapter, HirokiQuery, UpdateSet, UpdateConfig, QueryLimits } from 'hiroki';
import type { ValidConditions } from 'hiroki';
import { DocumentNotFoundError } from 'hiroki';

export class MyAdapter implements HirokiAdapter {
  readonly modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  canHandle(resource: unknown): boolean {
    return resource === this.modelName;
  }

  async findById(id: string, query?: HirokiQuery): Promise<unknown> {
    const doc = await myDb.findOne({ id });
    if (!doc) throw new DocumentNotFoundError(404);
    return doc;
  }

  async find(query: HirokiQuery): Promise<unknown[]> {
    return myDb.find(this.mapQuery(query));
  }

  async count(query?: HirokiQuery): Promise<number> {
    return myDb.count(query ? this.mapQuery(query) : {});
  }

  async distinct(field: string): Promise<unknown[]> {
    return myDb.distinct(field);
  }

  async create(data: Record<string, unknown>): Promise<unknown> {
    return myDb.insert(data);
  }

  async updateById(id: string, data: UpdateSet, config?: UpdateConfig): Promise<unknown> {
    const doc = await myDb.findOneAndUpdate({ id }, data);
    if (!doc) throw new DocumentNotFoundError(404);
    return doc;
  }

  async updateByConditions(conditions: ValidConditions | undefined, data: UpdateSet): Promise<unknown> {
    const doc = await myDb.findOneAndUpdate(conditions ?? {}, data);
    if (!doc) throw new DocumentNotFoundError(404);
    return doc;
  }

  async delete(id: string): Promise<unknown> {
    const doc = await myDb.findOneAndDelete({ id });
    if (!doc) throw new DocumentNotFoundError(404);
    return doc;
  }

  private mapQuery(q: HirokiQuery) {
    // translate HirokiFilter[] and HirokiSort[] to your DB's format
    return { filters: q.where ?? [], limit: q.limit, offset: q.offset };
  }
}
```

## Registering via AdapterRegistry

Register a factory so Hiroki auto-resolves your adapter without explicit injection:

```ts
import { adapterRegistry } from 'hiroki';
import { MyModel, isMyModel } from './my-model';

adapterRegistry.register((resource) => {
  if (isMyModel(resource)) return new MyAdapter((resource as MyModel).name);
  return null;
});

// Now importModel auto-picks MyAdapter for matching models
hiroki.importModel(someMyModel);
```

## Logger injection

Implement optional `setLogger` to receive Hiroki's logger:

```ts
import type { HirokiLogger } from 'hiroki';

export class MyAdapter implements HirokiAdapter {
  private logger?: HirokiLogger;

  setLogger(logger: HirokiLogger): void {
    this.logger = logger;
  }

  async find(query: HirokiQuery): Promise<unknown[]> {
    this.logger?.debug(`[${this.modelName}] find`);
    // ...
  }
}
```
