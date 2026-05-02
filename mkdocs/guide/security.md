# Security

## Field whitelisting (mass-assignment protection)

Without a whitelist, any field sent in a POST/PUT body reaches the adapter:

```ts
// Risk: user sends { name: 'Alice', isAdmin: true }
// isAdmin gets persisted if it's in the schema

hiroki.importModel(User, {
  allowedFields: ['name', 'email'],  // isAdmin, role, etc. are silently stripped
});
```

Filtering happens **before** hooks, so `beforeCreate` / `beforeUpdate` only see allowed fields.

## Query sanitization

Hiroki automatically blocks prototype-pollution vectors in URL parameters:

```
# These are silently dropped:
GET /api/users?where[__proto__]=bad
GET /api/users?conditions[constructor]=bad
```

## Query limits

Default limits prevent abuse via oversized queries:

| Limit | Default | Description |
|-------|---------|-------------|
| `maxFilters` | 20 | Max `where[]` entries per request |
| `maxInValues` | 100 | Max values in a single `$in`/`$nin` array |
| `maxRegexLength` | 200 | Max `$regex` string length (ReDoS protection) |

Override per-model:

```ts
hiroki.importModel(User, {
  queryLimits: { maxFilters: 5, maxRegexLength: 50 },
});
```

Requests exceeding limits return `400 Bad Request` with `code: 'QUERY_LIMIT_EXCEEDED'`.

## Auth integration

Use middleware to protect specific resources:

```ts
import { BadRequestError } from 'hiroki';
import type { HirokiMiddleware } from 'hiroki';

const requireAuth: HirokiMiddleware = async (ctx, next) => {
  const token = getTokenFromContext(ctx);
  if (!verifyToken(token)) {
    throw new BadRequestError('Authentication required', 'UNAUTHORIZED');
  }
  return next();
};

hiroki.importModel(User, { middleware: [requireAuth] });
```

## Disabling dangerous methods

Protect destructive operations at the config level:

```ts
hiroki.importModel(User, {
  disabledMethod: ['DELETE'],
});
```

Disabled methods return `405 Method Not Allowed`.
