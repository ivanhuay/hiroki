# MongooseAdapter

Default adapter. Used automatically when you pass a Mongoose model to `importModel`.

## Usage

```ts
import hiroki from 'hiroki';
import User from './models/user';

hiroki.importModel(User);          // MongooseAdapter used automatically
```

## Explicit injection

```ts
import { MongooseAdapter } from 'hiroki';

hiroki.importModel(User, {
  adapter: new MongooseAdapter(User),
});
```

## Model resolution

Accepts a Mongoose model class or a model name string:

```ts
new MongooseAdapter(User);           // model class
new MongooseAdapter('User');         // looked up via mongoose.model('User')
```

Duck-typed detection — no `instanceof` check — works correctly with `npm link` and multiple Mongoose copies.

## Query mapping

`HirokiFilter[]` → Mongoose `FilterQuery`:

| Hiroki op | Mongoose |
|-----------|----------|
| `eq` | direct value |
| `ne` | `$ne` |
| `gt` / `gte` / `lt` / `lte` | `$gt` / `$gte` / `$lt` / `$lte` |
| `in` / `nin` | `$in` / `$nin` |
| `regex` | `$regex` |

`HirokiSort[]` → Mongoose sort string (e.g. `-name age`).

## fastUpdate

When `fastUpdate: 'enabled'` or `fast=true`, uses `updateOne` instead of find-then-save. Pre-save hooks do not run in fast mode.

Supports `$push` / `$pull` operators in the update body.
