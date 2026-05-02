# DrizzleAdapter

Connect Hiroki to PostgreSQL or SQLite via [Drizzle ORM](https://orm.drizzle.team/).

::: warning Work in progress
`hiroki-drizzle` is at v0.1.0. The adapter skeleton is in place — full `HirokiFilter` → Drizzle `where` mapping is under active development.
:::

## Installation

```bash
npm install hiroki-drizzle drizzle-orm
```

Peer dependencies: `drizzle-orm >=0.30.0`, `hiroki >=3.0.0`

## Usage

```ts
import hiroki from 'hiroki';
import { DrizzleAdapter } from 'hiroki-drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users } from './schema'; // your Drizzle table schema

const db = drizzle(connectionString);

hiroki.importModel('Users', {
  adapter: new DrizzleAdapter('Users', { db, table: users }),
});
```

## Constructor

```ts
new DrizzleAdapter(modelName: string, config: DrizzleAdapterConfig)
```

| Option | Type | Description |
|--------|------|-------------|
| `modelName` | `string` | Resource name used for routing and logging |
| `config.db` | `DrizzleInstance` | Drizzle database instance |
| `config.table` | `Table` | Drizzle table schema object |

## Logger injection

```ts
import hiroki, { type HirokiLogger } from 'hiroki';
import { DrizzleAdapter } from 'hiroki-drizzle';

const adapter = new DrizzleAdapter('Users', { db, table: users });

// Logger is injected automatically by the controller after importModel
hiroki.importModel('Users', { adapter });
```

## HirokiFilter operators (planned)

When fully implemented, `DrizzleAdapter` will translate all `HirokiFilter` operators to Drizzle `where` conditions:

| Operator | Drizzle equivalent |
|----------|--------------------|
| `eq` | `eq(col, val)` |
| `ne` | `ne(col, val)` |
| `gt` | `gt(col, val)` |
| `gte` | `gte(col, val)` |
| `lt` | `lt(col, val)` |
| `lte` | `lte(col, val)` |
| `in` | `inArray(col, val)` |
| `nin` | `notInArray(col, val)` |
| `regex` | `like(col, pattern)` |

## Contributing

Source: [`packages/hiroki-drizzle`](https://github.com/ivanhuay/hiroki/tree/master/packages/hiroki-drizzle)
