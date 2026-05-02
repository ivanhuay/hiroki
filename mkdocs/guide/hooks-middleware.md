# Hooks & Middleware

## Lifecycle hooks

Hooks fire around each mutating operation. They receive the data and a context object with `modelName`.

```ts
hiroki.importModel(User, {
  hooks: {
    beforeCreate: async (body, ctx) => {
      // mutate and return the body
      return { ...body, createdAt: new Date() };
    },
    afterCreate: async (doc, ctx) => {
      await auditLog.record('create', ctx.modelName, doc);
    },
    beforeUpdate: async (body, ctx) => {
      return { ...body, updatedAt: new Date() };
    },
    afterUpdate: async (doc, ctx) => { ... },
    beforeDelete: async (id, ctx) => {
      // throw to cancel the delete
      if (await hasRelations(id)) throw new Error('Has relations');
    },
    afterDelete: async (doc, ctx) => { ... },
  },
});
```

### Hook signatures

| Hook | Signature | Notes |
|------|-----------|-------|
| `beforeCreate` | `(body, ctx) => body \| Promise<body>` | return mutated body |
| `afterCreate` | `(doc, ctx) => void \| Promise<void>` | |
| `beforeUpdate` | `(body, ctx) => body \| Promise<body>` | return mutated body |
| `afterUpdate` | `(doc, ctx) => void \| Promise<void>` | |
| `beforeDelete` | `(id, ctx) => void \| Promise<void>` | throw to cancel |
| `afterDelete` | `(doc, ctx) => void \| Promise<void>` | |

`ctx` is `{ modelName: string }`.

## Middleware

Middleware runs around the entire request dispatch — before routing to `get/post/put/delete`. Useful for auth guards, rate limiting, and request logging.

```ts
const authMiddleware: HirokiMiddleware = async (ctx, next) => {
  if (!ctx.headers?.authorization) {
    throw new Error('Unauthorized');   // returns 500; use an HttpError for clean status
  }
  return next();
};

hiroki.importModel(User, {
  middleware: [authMiddleware],
});
```

`ctx` has `{ path, method, body, query }`.

### Auth guard example

```ts
import { BadRequestError } from 'hiroki';

const requireAuth: HirokiMiddleware = async (ctx, next) => {
  const token = ctx.query?.token as string | undefined;
  if (!token || !isValid(token)) {
    throw new BadRequestError('Unauthorized', 'UNAUTHORIZED');
  }
  return next();
};
```

### Middleware chain

Multiple middleware stack in order — each must call `next()` to continue:

```ts
hiroki.importModel(User, {
  middleware: [logRequest, requireAuth, checkRateLimit],
});
```

If any middleware throws or returns without calling `next()`, the chain stops.

## Rate limiting (via middleware)

Hiroki doesn't ship a rate limiter, but middleware makes it trivial to add one:

```ts
const requestCounts = new Map<string, number>();

const rateLimit: HirokiMiddleware = async (ctx, next) => {
  const key = ctx.path;
  const count = (requestCounts.get(key) ?? 0) + 1;
  requestCounts.set(key, count);
  if (count > 100) throw new Error('Rate limit exceeded');
  return next();
};
```

## Combining hooks and middleware

```ts
hiroki.importModel(Order, {
  allowedFields: ['items', 'note'],       // security
  middleware: [requireAuth],              // auth before any operation
  hooks: {
    beforeCreate: async (body, ctx) => ({
      ...body,
      userId: getCurrentUserId(),         // inject server-side fields
    }),
    afterCreate: async (doc, ctx) => {
      await notifyFulfillment(doc);       // side effects after create
    },
  },
});
```
