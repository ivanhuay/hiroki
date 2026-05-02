# MemoryAdapter

Zero-dependency in-memory store. No database required.

## When to use

- Unit and integration tests — no MongoDB needed
- Local prototyping
- Demo / playground environments

## Usage

```ts
import hiroki, { MemoryAdapter } from 'hiroki';

const adapter = new MemoryAdapter('Products');

hiroki.importModel('Products', { adapter });
```

## In tests

```ts
import { MemoryAdapter } from 'hiroki';

const adapter = new MemoryAdapter('Users');
hiroki.importModel('Users', { adapter });

afterEach(() => adapter.clear());  // reset between tests
```

## Supported features

- All filter operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`, `regex`
- `sort`, `limit`, `offset`
- `select` (field projection)
- Legacy `conditions` object
- `count`, `distinct`

## IDs

Auto-increments from `1`. Created documents get an `id` field (string).

## clear()

Resets all stored documents and the ID counter:

```ts
adapter.clear();
```

## Limitations

- No persistence — data lives in process memory
- No `populate` (relation resolution)
- No schema validation
- `distinct` uses strict equality, not collation
