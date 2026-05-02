# Hiroki

[![NPM version][npm-image]][npm-url] [![CI](https://github.com/ivanhuay/hiroki/actions/workflows/ci.yml/badge.svg)](https://github.com/ivanhuay/hiroki/actions/workflows/ci.yml)

Hiroki helps you build REST APIs faster than ever using open source tools and standards that you and your team already know.

## Table of Contents

- [Documentation](#documentation)
- [Packages](#packages)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Changelog](#changelog)

## Documentation

For detailed information, please read our [full documentation](https://ivanhuay.github.io/hiroki/).

## Packages

Hiroki is a monorepo. The core package is all you need to get started — the sub-packages are optional adapters and logger integrations.

| Package | Version | Description |
|---------|---------|-------------|
| [`hiroki`](./packages/hiroki) | [![NPM version][npm-image]][npm-url] | Core — CRUD engine, MongooseAdapter, MemoryAdapter |
| [`hiroki-drizzle`](./packages/hiroki-drizzle) | `0.1.0-beta.0` | Drizzle ORM adapter (PostgreSQL / SQLite) — beta |
| [`hiroki-sequelize`](./packages/hiroki-sequelize) | `0.1.0-beta.0` | Sequelize adapter (MySQL / PostgreSQL legacy) — beta |
| [`hiroki-pino`](./packages/hiroki-pino) | `0.1.0` | Pino logger integration |
| [`hiroki-winston`](./packages/hiroki-winston) | `0.1.0` | Winston logger integration |

## Getting Started

### Installation

```bash
npm install hiroki
```

Optional packages:

```bash
# Drizzle adapter (requires drizzle-orm peer dep)
npm install hiroki-drizzle drizzle-orm

# Sequelize adapter (requires sequelize peer dep)
npm install hiroki-sequelize sequelize

# Logger integrations
npm install hiroki-pino pino
npm install hiroki-winston winston
```

### Quick Start

```ts
import express from 'express';
import mongoose from 'mongoose';
import hiroki from 'hiroki';

const UserSchema = new mongoose.Schema({ name: String, email: String });
const User = mongoose.model('User', UserSchema);

hiroki.importModel(User);

const app = express();
app.use(express.json());

app.use('/api/*', async (req, res) => {
  const result = await hiroki.process(req.originalUrl, {
    method: req.method as any,
    body: req.body,
  });
  res.status(result.status ?? 200).json(result);
});

mongoose.connect('mongodb://localhost:27017/mydb').then(() => {
  app.listen(3000, () => console.log('http://localhost:3000'));
});
```

### Without a database (MemoryAdapter)

```ts
import hiroki, { MemoryAdapter } from 'hiroki';

hiroki.importModel('Products', {
  adapter: new MemoryAdapter('Products'),
});
```

### Custom logger

```ts
import hiroki from 'hiroki';
import { PinoLogger } from 'hiroki-pino';
import pino from 'pino';

hiroki.setConfig({
  logger: new PinoLogger(pino()),
});
```

## Configuration

```ts
hiroki.setConfig({
  basePath: '/api/v2', // default: '/api'
});
```

## Changelog

### v3.0.0

- Adapter system — pluggable adapters, `MongooseAdapter`, `MemoryAdapter`
- Query AST — database-agnostic `HirokiQuery` with filtering, sorting, pagination
- Hooks & middleware — `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, `afterDelete`
- Security — field whitelisting, query sanitization, depth limits
- TypeScript — full type safety across all public APIs
- Monorepo — `hiroki-drizzle`, `hiroki-sequelize`, `hiroki-pino`, `hiroki-winston`

### v2.0.0

- Hiroki is now backend-agnostic. Express has been removed as a dependency.
- Mongoose version updated.
- The 'share' feature has been removed.

[Full Changelog](https://ivanhuay.github.io/hiroki/changelog)

[npm-image]: https://badge.fury.io/js/hiroki.svg
[npm-url]: https://npmjs.org/package/hiroki
