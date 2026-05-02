# Configuration

## Global config

```ts
hiroki.setConfig({
  basePath: '/api/v2',   // default: '/api'
  logLevel: 'debug',     // 'error' | 'warn' | 'info' | 'debug'  (default: 'error')
  logger: customLogger,  // inject your own logger (see below)
});
```

## Per-model options

All options in `ControllerConfig` can be passed to `importModel`:

```ts
hiroki.importModel(User, {
  disabledMethod: ['DELETE'],            // block HTTP methods
  disabledPluralize: true,              // use model name as-is (default: true)
  fastUpdate: 'optional',               // 'disabled' | 'enabled' | 'optional'
  allowedFields: ['name', 'email'],     // field whitelist for create/update
  queryLimits: { maxFilters: 10 },      // tighten query safety limits
  hooks: { ... },                       // lifecycle hooks
  middleware: [ ... ],                  // per-resource middleware
  adapter: new MemoryAdapter('User'),   // custom adapter
});
```

## Disabling methods

```ts
hiroki.importModel(User, {
  disabledMethod: ['DELETE', 'POST'],   // uppercase for process() path
});

// Lowercase for direct controller method calls:
hiroki.importModel(User, {
  disabledMethod: ['delete', 'post'],
});
```

Disabled methods return `405 Method Not Allowed`.

## Fast update

By default Hiroki fetches a document before updating it (runs Mongoose pre-save hooks). `fastUpdate` skips the fetch:

```ts
hiroki.importModel(User, {
  fastUpdate: 'enabled',    // always fast — no pre-save hooks
  fastUpdate: 'optional',   // fast only when ?fast=true in query
});
```

## Field whitelisting

Strips any field not in the list from `create` and `update` request bodies — before lifecycle hooks run:

```ts
hiroki.importModel(User, {
  allowedFields: ['name', 'email'],
  // 'role', 'isAdmin', etc. silently removed from body
});
```

## Query safety limits

Defaults are conservative. Override per-model if needed:

```ts
hiroki.importModel(User, {
  queryLimits: {
    maxFilters: 5,        // default: 20
    maxInValues: 20,      // default: 100
    maxRegexLength: 100,  // default: 200
  },
});
```

Requests exceeding limits return `400 Bad Request`.

## Custom logger

Any object with `{ info, warn, error, debug }` methods works:

```ts
import pino from 'pino';

const logger = pino();

hiroki.setConfig({ logger });
// or per-model:
hiroki.importModel(User, { logger });
```
