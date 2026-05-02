# Adapters

The adapter system decouples Hiroki's routing layer from the underlying data source. Every adapter implements `HirokiAdapter`.

## Built-in adapters

| Adapter | Package | When to use |
|---------|---------|-------------|
| `MongooseAdapter` | `hiroki` (default) | MongoDB via Mongoose |
| `MemoryAdapter` | `hiroki` | Testing, prototyping, no database |

## How adapter resolution works

When you call `hiroki.importModel(model, options)`, the controller picks an adapter in this order:

1. `options.adapter` — explicit injection
2. `adapterRegistry` — registered factories
3. `new MongooseAdapter(model)` — fallback

```ts
// Option 1: direct injection
hiroki.importModel('Cart', {
  adapter: new MemoryAdapter('Cart'),
});

// Option 2: register a factory for all models of a certain type
import { adapterRegistry } from 'hiroki';
adapterRegistry.register((resource) => {
  if (isMyCustomModel(resource)) return new MyAdapter(resource);
  return null;
});
```

## HirokiAdapter interface

```ts
interface HirokiAdapter {
  readonly modelName: string;
  canHandle(resource: unknown): boolean;
  setLogger?(logger: HirokiLogger): void;
  findById(id: string, query?: HirokiQuery): Promise<unknown>;
  find(query: HirokiQuery): Promise<unknown>;
  count(query?: HirokiQuery): Promise<number>;
  distinct(field: string): Promise<unknown[]>;
  create(data: Record<string, unknown>): Promise<unknown>;
  updateById(id: string, data: UpdateSet, config?: UpdateConfig): Promise<unknown>;
  updateByConditions(conditions: ValidConditions | undefined, data: UpdateSet, config?: UpdateConfig): Promise<unknown>;
  delete(id: string): Promise<unknown>;
}
```

## HirokiQuery

All adapter methods receive a `HirokiQuery` — a database-agnostic query AST:

```ts
interface HirokiQuery {
  where?: HirokiFilter[];   // [{ field, op, value }]
  limit?: number;
  offset?: number;
  sort?: HirokiSort[];      // [{ field, dir: 'asc' | 'desc' }]
  select?: string[];
  populate?: string;
  conditions?: ValidConditions;  // legacy escape hatch
}
```
