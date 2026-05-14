# Hiroki — Agent Reference

> Machine-readable reference for AI agents. Dense, precise, complete. Read this before touching any Hiroki code.

## What Hiroki Is

Hiroki is a TypeScript CRUD engine that generates REST APIs from data models. Register a model → get routes. No boilerplate. Database-agnostic via pluggable adapters. Built-in security (field whitelisting, query limits, prototype pollution protection).

**Package:** `hiroki` (npm). **Ecosystem packages:** `hiroki-drizzle`, `hiroki-sequelize`, `hiroki-pino`, `hiroki-winston`.

---

## Route Generation

`importModel(model)` registers a model and auto-generates 7 routes. Given model name `"User"`:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/users` | List (paginated, filterable) |
| `GET` | `/api/users/count` | Total count |
| `GET` | `/api/users/distinct/:field` | Unique values for a field |
| `GET` | `/api/users/:id` | Find by ID |
| `POST` | `/api/users` | Create |
| `PUT` | `/api/users/:id` | Update by ID |
| `DELETE` | `/api/users/:id` | Delete by ID |

- Base path default: `/api`. Override via `setConfig({ basePath: '/v1' })` or per-model `basePath`.
- Model names pluralized via `pluralize`. Disable with `disabledPluralize: true`.
- Routes match by prefix: `hiroki.process('/api/users', { method: 'GET' })`.

---

## Core API

### `hiroki` singleton

```ts
import hiroki from 'hiroki';
```

#### `hiroki.importModel(model, options?): Controller`

Registers one model. `model` = Mongoose model instance or string name. `options` = `ControllerConfig`. No-op on duplicate registration.

#### `hiroki.importModels(models, options?): void`

Bulk register. `models` = array or object (`{ User: UserModel, Post: PostModel }`).

#### `hiroki.process(path, params): Promise<ProcessResponse>`

Dispatch a request. Never throws — errors are returned as `{ error, status, code, details? }`.

```ts
type ProcessRequest = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
};

type ProcessResponse = {
  data?: unknown;
  status: number;
  // or on error:
  error?: string;
  code?: string;
  details?: unknown;
};
```

Integration pattern (Express):

```ts
app.all('/api/*', async (req, res) => {
  const result = await hiroki.process(req.path, {
    method: req.method as HttpMethod,
    body: req.body,
    query: req.query,
  });
  res.status(result.status).json(result);
});
```

#### `hiroki.setConfig(config): void`

Global defaults for all new controllers.

```ts
hiroki.setConfig({
  basePath?: string;       // default: '/api'
  logLevel?: LogLevel;     // 'error' | 'warn' | 'info' | 'debug'  (default: 'error')
  logger?: HirokiLogger;
});
```

#### `hiroki.controllers`

`Record<string, Controller>` — access registered controllers by model name.

---

## ControllerConfig

All fields optional. Pass as second arg to `importModel`.

```ts
interface ControllerConfig {
  adapter?: HirokiAdapter;                         // custom adapter (overrides auto-detection)
  allowedFields?: string[];                        // field whitelist — strips all other fields on write
  disabledFields?: string[];                       // field blacklist — never returned in any GET response or populate
  basePath?: string;                               // route prefix for this resource
  disabledMethod?: string[];                       // e.g. ['DELETE', 'POST']
  disabledPluralize?: boolean;                     // keep /user instead of /users
  fastUpdate?: 'enabled' | 'disabled' | 'optional'; // Mongoose updateOne optimization
  hooks?: ControllerHooks;                         // lifecycle hooks (see below)
  logger?: HirokiLogger;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  middleware?: HirokiMiddleware[];                  // per-resource middleware chain
  queryLimits?: QueryLimits;                       // override safety limits
}
```

### `QueryLimits`

```ts
interface QueryLimits {
  maxFilters?: number;     // max filter conditions (default: 20)
  maxInValues?: number;    // max values in $in arrays (default: 100)
  maxRegexLength?: number; // max regex string length (default: 200)
}
```

---

## Query Parameters

Sent as URL query string. Parsed into `HirokiQuery` before reaching adapter.

### Filtering — `where`

```
GET /api/users?where[field]=value              → field = value (eq)
GET /api/users?where[age][$gt]=18             → age > 18
GET /api/users?where[role][$in]=admin,user    → role IN [admin, user]
GET /api/users?where[name][$regex]=^ali       → regex match
```

Supported operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`, `regex`.

### Pagination

```
GET /api/users?limit=10&offset=20
GET /api/users?limit=10&skip=20    # skip is alias for offset
```

### Sorting

```
GET /api/users?sort=name           # asc
GET /api/users?sort=-name          # desc
GET /api/users?sort=-createdAt,name  # multi-field
```

### Field Selection

```
GET /api/users?select=name,email
```

### Population (Mongoose only)

```
GET /api/users?populate=posts
```

### Count

```
GET /api/users/count               # total count with optional where filters
GET /api/users/count?where[active]=true
```

### Distinct

```
GET /api/users/distinct/role       # unique values of field "role"
```

---

## Lifecycle Hooks

Hooks run in the controller's middleware chain, around each CRUD operation.

```ts
interface ControllerHooks {
  beforeCreate?: BeforeCreateHook;
  afterCreate?: AfterCreateHook;
  beforeUpdate?: BeforeUpdateHook;
  afterUpdate?: AfterUpdateHook;
  beforeDelete?: BeforeDeleteHook;
  afterDelete?: AfterDeleteHook;
}

type HookContext = { modelName: string };

// Mutate body before create (return modified body)
type BeforeCreateHook = (body: Record<string, unknown>, ctx: HookContext) => Record<string, unknown> | Promise<Record<string, unknown>>;

// Side effects after create (doc = created document)
type AfterCreateHook = (doc: unknown, ctx: HookContext) => void | Promise<void>;

// Mutate body before update (return modified body)
type BeforeUpdateHook = (body: Record<string, unknown>, ctx: HookContext) => Record<string, unknown> | Promise<Record<string, unknown>>;

// Side effects after update
type AfterUpdateHook = (doc: unknown, ctx: HookContext) => void | Promise<void>;

// Pre-delete check — throw to cancel deletion
type BeforeDeleteHook = (id: string, ctx: HookContext) => void | Promise<void>;

// Side effects after delete
type AfterDeleteHook = (doc: unknown, ctx: HookContext) => void | Promise<void>;
```

**Execution order:** `allowedFields` strip → `beforeCreate` → adapter create → `afterCreate`.

---

## Middleware

Per-resource async middleware chain. Framework-agnostic.

```ts
type HirokiMiddleware = (ctx: MiddlewareContext, next: () => Promise<unknown>) => Promise<unknown>;

interface MiddlewareContext {
  path: string;
  method: string;
  body?: Record<string, unknown>;
  query?: HirokiQuery;
}
```

Must call `next()` to continue. Throw to abort (error serialized to response).

```ts
// Auth guard example
const authMiddleware: HirokiMiddleware = async (ctx, next) => {
  if (!isAuthenticated(ctx)) throw new Error('Unauthorized');
  return next();
};

hiroki.importModel(User, { middleware: [authMiddleware] });
```

---

## Adapter Interface

Implement this to support any database.

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

### `HirokiQuery` (what adapters receive)

```ts
interface HirokiQuery {
  where?: HirokiFilter[];
  limit?: number;
  offset?: number;
  sort?: HirokiSort[];           // [{ field: string, dir: 'asc' | 'desc' }]
  select?: string[];
  populate?: string;
  conditions?: ValidConditions;  // legacy raw conditions escape hatch
}

interface HirokiFilter {
  field: string;
  op: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex';
  value: unknown;
}
```

### Adapter Registration

```ts
import { adapterRegistry } from 'hiroki';

adapterRegistry.register({
  canHandle: (resource) => resource instanceof MyDbModel,
  create: (resource) => new MyAdapter(resource),
});
```

Resolution order: `options.adapter` → registry → `MongooseAdapter` fallback.

---

## Built-in Adapters

### `MongooseAdapter`

Auto-used for Mongoose models. Supports all `HirokiFilter` operators, `populate`, `select`, sorting, pagination. `fastUpdate` mode uses `updateOne` instead of `findOneAndUpdate`.

```ts
import { MongooseAdapter } from 'hiroki';
const adapter = new MongooseAdapter(MyModel);
hiroki.importModel('MyModel', { adapter });
```

### `MemoryAdapter`

Zero-dependency, in-memory. Good for tests and prototyping.

```ts
import { MemoryAdapter } from 'hiroki';
const mem = new MemoryAdapter('User');
hiroki.importModel('User', { adapter: mem });

// Reset between tests
mem.clear();
```

Limitations: no persistence, no `populate`, no schema validation.

---

## Logger Interface

```ts
interface HirokiLogger {
  info(message: string): void;
  error(message: string): void;
  warn(message: string): void;
  debug(message: string): void;
}
```

### Ecosystem loggers

```ts
import pino from 'pino';
import { PinoLogger } from 'hiroki-pino';
hiroki.setConfig({ logger: new PinoLogger(pino()) });

import winston from 'winston';
import { WinstonLogger } from 'hiroki-winston';
hiroki.setConfig({ logger: new WinstonLogger(winston.createLogger()) });
```

---

## Error Reference

All errors extend `HttpError`. `hiroki.process()` never throws — errors surface in the returned object.

| Class | HTTP Status | `code` |
|-------|-------------|--------|
| `BadRequestError` | 400 | `BAD_REQUEST` |
| `InvalidModelError` | 400 | `INVALID_MODEL` |
| `InvalidConditionsError` | 400 | `INVALID_CONDITIONS` |
| `ParamRequiredError` | 400 | `PARAM_REQUIRED` |
| `BodyRequiredError` | 400 | `BODY_REQUIRED` |
| `NotFoundError` | 404 | `NOT_FOUND` |
| `DocumentNotFoundError` | 404 | `DOCUMENT_NOT_FOUND` |
| `RouteNotFoundError` | 404 | `ROUTE_NOT_FOUND` |
| `MethodNotAllowedError` | 405 | `METHOD_NOT_ALLOWED` |
| `DisabledMethodError` | 405 | `METHOD_DISABLED` |
| `InternalServerError` | 500 | `INTERNAL_ERROR` |

Query limit violations return 400 with `code: 'QUERY_LIMIT_EXCEEDED'`.

```ts
import { isHttpError, hasStatus } from 'hiroki';

if (isHttpError(err)) console.log(err.status, err.code);
if (hasStatus(err)) console.log(err.status);
```

---

## Package Ecosystem

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| `hiroki` | 3.1.0 | Core engine | Stable |
| `hiroki-drizzle` | 0.1.0-beta.0 | Drizzle ORM adapter | Beta (stub) |
| `hiroki-sequelize` | 0.1.0-beta.0 | Sequelize adapter | Beta (stub) |
| `hiroki-pino` | 0.1.0 | Pino logger adapter | Stable |
| `hiroki-winston` | 0.1.0 | Winston logger adapter | Stable |

---

## TypeScript Exports (hiroki)

```ts
// Instance
import hiroki from 'hiroki';
import { Hiroki } from 'hiroki';  // class for CJS interop

// Adapters
import { MongooseAdapter, MemoryAdapter, adapterRegistry, AdapterRegistry } from 'hiroki';

// Errors
import {
  HttpError, BadRequestError, NotFoundError, MethodNotAllowedError,
  InternalServerError, InvalidModelError, InvalidConditionsError,
  ParamRequiredError, DocumentNotFoundError, BodyRequiredError,
  DisabledMethodError, RouteNotFoundError, UnexpectedError,
  isHttpError, hasStatus
} from 'hiroki';

// Types
import type {
  HirokiConfig, ControllerConfig, ProcessRequest, ProcessResponse,
  HirokiAdapter, HirokiQuery, HirokiFilter, HirokiSort, FilterOperator,
  HirokiMiddleware, MiddlewareContext,
  ControllerHooks, HookContext,
  BeforeCreateHook, AfterCreateHook,
  BeforeUpdateHook, AfterUpdateHook,
  BeforeDeleteHook, AfterDeleteHook,
  HirokiLogger, LogLevel,
  UpdateSet, UpdateConfig, QueryLimits,
  HttpMethod, HttpErrorResponse
} from 'hiroki';
```

---

## Common Patterns

### Minimal setup (MemoryAdapter)

```ts
import hiroki from 'hiroki';
import { MemoryAdapter } from 'hiroki';

hiroki.importModel('Task', { adapter: new MemoryAdapter('Task') });

const result = await hiroki.process('/api/tasks', { method: 'GET' });
// { data: [], status: 200 }
```

### Mongoose setup

```ts
import hiroki from 'hiroki';
import mongoose from 'mongoose';

const User = mongoose.model('User', new mongoose.Schema({ name: String, email: String }));

hiroki.importModel(User, {
  allowedFields: ['name', 'email'],
  hooks: {
    beforeCreate: async (body) => ({ ...body, createdAt: new Date() }),
    afterDelete: async (doc) => console.log('deleted', doc),
  },
});
```

### Disable routes

```ts
hiroki.importModel(User, {
  disabledMethod: ['DELETE', 'POST'],
});
```

### Per-resource security

```ts
hiroki.importModel(User, {
  allowedFields: ['name', 'email'],     // blocks writing other fields
  disabledFields: ['password', 'ssn'], // never returned in GET or populate
  queryLimits: { maxFilters: 5 },       // tighter limit for this resource
  middleware: [requireAuth],
});
```

### disabledFields with populate

`disabledFields` propagates automatically to cross-model populate. If `Post` has `{ author: { ref: 'User' } }` and `User` has `disabledFields: ['password']`, then `GET /api/posts?populate=author` will NOT include `password` in the populated author object. No extra config needed on `Post`.

### Custom adapter (minimal)

```ts
class RedisAdapter implements HirokiAdapter {
  readonly modelName = 'CacheItem';
  canHandle(r: unknown) { return r instanceof RedisClient; }

  async find(query: HirokiQuery) { /* ... */ }
  async findById(id: string) { /* ... */ }
  async count() { return 0; }
  async distinct(field: string) { return []; }
  async create(data: Record<string, unknown>) { /* ... */ }
  async updateById(id: string, data: UpdateSet) { /* ... */ }
  async updateByConditions(conditions: any, data: UpdateSet) { /* ... */ }
  async delete(id: string) { /* ... */ }
}
```
