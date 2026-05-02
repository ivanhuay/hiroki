# Getting Started

## Installation

```bash
npm install hiroki mongoose
```

## Basic setup (Mongoose)

```ts
import express from 'express';
import mongoose from 'mongoose';
import hiroki from 'hiroki';

// 1. Define a Mongoose model
const UserSchema = new mongoose.Schema({ name: String, email: String });
const User = mongoose.model('User', UserSchema);

// 2. Register it with Hiroki
hiroki.importModel(User);

// 3. Wire Hiroki into Express
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

That's it. You now have:

| Method | URL | Action |
|--------|-----|--------|
| `GET` | `/api/users` | list all users |
| `GET` | `/api/users/:id` | get user by ID |
| `POST` | `/api/users` | create user |
| `PUT` | `/api/users/:id` | update user |
| `DELETE` | `/api/users/:id` | delete user |

## Without a database (MemoryAdapter)

No MongoDB needed — use `MemoryAdapter` for local dev or testing:

```ts
import hiroki, { MemoryAdapter } from 'hiroki';

hiroki.importModel('Products', {
  adapter: new MemoryAdapter('Products'),
});
```

## Importing multiple models

```ts
import { UserModel, PostModel } from './models';

hiroki.importModels([UserModel, PostModel]);

// Or as a named record
hiroki.importModels({ UserModel, PostModel });
```

## Next steps

- [Configuration](/guide/configuration) — disable methods, field whitelisting, query limits
- [Hooks & Middleware](/guide/hooks-middleware) — auth, auditing, transformations
- [Adapters](/adapters/overview) — swap or build your own adapter
- [Query params](/api/query-params) — filtering, sorting, pagination
