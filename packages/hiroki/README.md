# hiroki

[![NPM version](https://badge.fury.io/js/hiroki.svg)](https://npmjs.org/package/hiroki) [![CI](https://github.com/ivanhuay/hiroki/actions/workflows/ci.yml/badge.svg)](https://github.com/ivanhuay/hiroki/actions/workflows/ci.yml)

CRUD engine with pluggable adapters — expose any model as a REST API in seconds.

## Installation

```bash
npm install hiroki
```

## Quick start

```ts
import express from 'express';
import mongoose from 'mongoose';
import hiroki from 'hiroki';

const User = mongoose.model('User', new mongoose.Schema({ name: String, email: String }));

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
```

Gives you `GET /api/users`, `GET /api/users/:id`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id` — no boilerplate.

## Without a database

```ts
import hiroki, { MemoryAdapter } from 'hiroki';

hiroki.importModel('Products', {
  adapter: new MemoryAdapter('Products'),
});
```

## Ecosystem

| Package | Description |
|---------|-------------|
| [`hiroki-drizzle`](https://npmjs.org/package/hiroki-drizzle) | Drizzle ORM adapter (beta) |
| [`hiroki-sequelize`](https://npmjs.org/package/hiroki-sequelize) | Sequelize adapter (beta) |
| [`hiroki-pino`](https://npmjs.org/package/hiroki-pino) | Pino logger integration |
| [`hiroki-winston`](https://npmjs.org/package/hiroki-winston) | Winston logger integration |

## Documentation

[ivanhuay.github.io/hiroki](https://ivanhuay.github.io/hiroki/)

## License

MIT
