# hiroki-drizzle

[![NPM version](https://badge.fury.io/js/hiroki-drizzle.svg)](https://npmjs.org/package/hiroki-drizzle)

> **Beta** — adapter skeleton in place, full implementation in progress.

[Drizzle ORM](https://orm.drizzle.team/) adapter for [hiroki](https://npmjs.org/package/hiroki). Connect Hiroki to PostgreSQL or SQLite.

## Installation

```bash
npm install hiroki-drizzle@beta drizzle-orm
```

Peer dependencies: `drizzle-orm >=0.30.0`, `hiroki >=3.0.0`

## Usage

```ts
import hiroki from 'hiroki';
import { DrizzleAdapter } from 'hiroki-drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users } from './schema';

const db = drizzle(connectionString);

hiroki.importModel('Users', {
  adapter: new DrizzleAdapter('Users', { db, table: users }),
});
```

## Status

- [x] Class structure, `canHandle`, `setLogger`
- [ ] `find` / `findById` / `count` / `distinct`
- [ ] `create` / `updateById` / `updateByConditions` / `delete`
- [ ] `HirokiFilter[]` → Drizzle `where` mapping
- [ ] Integration tests

## Documentation

[ivanhuay.github.io/hiroki/adapters/drizzle](https://ivanhuay.github.io/hiroki/adapters/drizzle)

## License

MIT
