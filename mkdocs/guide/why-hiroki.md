# Why Hiroki

## The problem

Every CRUD resource in a REST API looks the same:

```ts
// You write this for every single model
router.get('/users', async (req, res) => { ... });
router.get('/users/:id', async (req, res) => { ... });
router.post('/users', async (req, res) => { ... });
router.put('/users/:id', async (req, res) => { ... });
router.delete('/users/:id', async (req, res) => { ... });
// × repeat for 10 more models
```

Then you add filtering, pagination, sorting, error handling... 500 lines of boilerplate per model.

## What Hiroki does

```ts
hiroki.importModel(User);  // done
```

One line. Hiroki generates all five endpoints with filtering, pagination, sorting, field selection, and consistent error responses.

## What Hiroki is NOT

- **Not an ORM.** Hiroki sits above your data layer. You define the model; Hiroki exposes it.
- **Not Express-only.** The `hiroki.process()` call is framework-agnostic — use it with Fastify, Koa, or a raw Node.js server.
- **Not Mongoose-only.** The adapter system lets you plug in any data source.

## Design goals

| Goal | How |
|------|-----|
| No boilerplate | `importModel` generates all routes |
| Predictable API | Same URL patterns and response shapes every time |
| Extensible | Hooks + middleware, no core modification needed |
| Type-safe | Full TypeScript — every option and hook is typed |
| Testable | MemoryAdapter lets you test without a real database |
