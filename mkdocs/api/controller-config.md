# ControllerConfig

Full reference for options accepted by `importModel` and `importModels`.

```ts
interface ControllerConfig {
  fastUpdate?: 'enabled' | 'disabled' | 'optional';
  disabledPluralize?: boolean;
  basePath?: string;
  disabledMethod?: string[];
  logger?: HirokiLogger;
  logLevel?: LogLevel;
  hooks?: ControllerHooks;
  middleware?: HirokiMiddleware[];
  adapter?: HirokiAdapter;
  allowedFields?: string[];
  queryLimits?: QueryLimits;
}
```

## fastUpdate

Controls whether updates skip the find-then-save round-trip.

| Value | Behavior |
|-------|----------|
| `'disabled'` (default) | Always fetch document first — runs Mongoose pre-save hooks |
| `'enabled'` | Always use `updateOne` — faster, no pre-save hooks |
| `'optional'` | Use `updateOne` only when `?fast=true` is in the query string |

## disabledPluralize

When `false`, pluralizes the model name for the route (e.g. `User` → `/users`). Default: `true` (no pluralization).

## basePath

URL prefix prepended to the resource route. Default: inherits from global config (`'/api'`).

## disabledMethod

Array of HTTP methods to block. Accepts uppercase (`'DELETE'`) or lowercase (`'delete'`).

Blocked methods return `405 Method Not Allowed`.

## logger / logLevel

Custom logger instance or minimum log level for the default `ConsoleLogger`.

`logger` overrides `logLevel` when both are set.

## hooks

Lifecycle hooks. See [Hooks & Middleware](/guide/hooks-middleware).

## middleware

Per-resource middleware chain. See [Hooks & Middleware](/guide/hooks-middleware).

## adapter

Inject a custom `HirokiAdapter` directly. Skips Mongoose validation and the adapter registry. See [Adapters](/adapters/overview).

## allowedFields

Whitelist of body field names allowed in `create` and `update` operations. Fields not in the list are stripped **before** hooks run. See [Security](/guide/security).

## queryLimits

Override default query safety limits.

```ts
interface QueryLimits {
  maxFilters?: number;      // default: 20
  maxInValues?: number;     // default: 100
  maxRegexLength?: number;  // default: 200
}
```

See [Security](/guide/security).
