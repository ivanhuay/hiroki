# hiroki instance

The default export is a singleton `Hiroki` instance.

```ts
import hiroki from 'hiroki';
```

## importModel

```ts
hiroki.importModel(model, options?)
```

Registers a model and exposes it as a REST resource. Returns the `Controller` instance.

```ts
import hiroki, { MemoryAdapter } from 'hiroki';
import User from './models/user';

// Mongoose model
hiroki.importModel(User);

// With options
hiroki.importModel(User, {
  disabledMethod: ['DELETE'],
  allowedFields: ['name', 'email'],
});

// With a custom adapter (no Mongoose needed)
hiroki.importModel('Products', {
  adapter: new MemoryAdapter('Products'),
});
```

Called multiple times with the same model name is a no-op — first registration wins.

## importModels

```ts
hiroki.importModels(models, options?)
```

Register multiple models at once. Accepts an array or a record:

```ts
hiroki.importModels([User, Post, Comment]);
hiroki.importModels({ User, Post, Comment });
```

## process

```ts
hiroki.process(path, { method, body? }) => Promise<ProcessResponse>
```

Dispatch an incoming request to the matching controller. Never throws — errors are returned as `{ error, status, code }`.

```ts
app.use('/api/*', async (req, res) => {
  const result = await hiroki.process(req.originalUrl, {
    method: req.method as any,
    body: req.body,
  });
  res.status(result.status ?? 200).json(result);
});
```

### ProcessResponse

On success: the adapter result (document or array) with `status` omitted.

On error:

```ts
{
  error: string;
  status: number;
  code: string;
  details?: unknown;
}
```

## setConfig

```ts
hiroki.setConfig(config)
```

Update global defaults. Affects only models registered **after** this call.

```ts
hiroki.setConfig({
  basePath: '/api/v2',
  logLevel: 'debug',
  logger: myLogger,
});
```

## controllers

```ts
hiroki.controllers: Record<string, Controller>
```

Map of registered controllers by model name. Useful for testing or manual dispatch.
