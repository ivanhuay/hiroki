# Changelog

## v3.1.0

### Features
- `disabledFields` — blacklist fields from all GET responses, including when the model is populated as a sub-document from another model. Mirror opposite of `allowedFields`: useful when it's easier to hide a few sensitive fields than to whitelist every exposed field.
  - Takes precedence over `?select=` params that attempt to request a disabled field.
  - Automatically propagates to cross-model populate via Mongoose select — no extra config required on the referencing model.

---

## v3.0.1

### Documentation
- Added `AGENTS.md` — machine-readable reference for AI agents, shipped with the npm package at `node_modules/hiroki/AGENTS.md`
- Added Agent Reference page to VitePress docs site

---

## v3.0.0

### Monorepo & ecosystem
- Migrated to npm workspaces under `packages/`
- New packages: `hiroki-drizzle` (beta), `hiroki-sequelize` (beta), `hiroki-pino`, `hiroki-winston`
- CI migrated from CircleCI to GitHub Actions (Node 20/22 matrix)

### Adapter system
- `HirokiAdapter` interface — pluggable data layer, decoupled from Mongoose
- `MongooseAdapter` — extracted from core, same behavior
- `MemoryAdapter` — zero deps, in-memory store, full operator support, `clear()` for tests
- `AdapterRegistry` — register adapter factories for auto-resolution
- `adapter` option on `importModel` — inject any adapter directly

### Query abstraction
- `HirokiQuery` AST — database-agnostic query representation
- `parseHirokiQuery` — parses `where`, `sort`, `select`, `limit`, `offset` from URL params
- Filter operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`, `regex`
- `HirokiFilter`, `HirokiSort`, `FilterOperator` exported from package

### Hooks & middleware
- Lifecycle hooks: `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, `afterDelete`
- Per-resource middleware chain — `(ctx, next) => Promise<unknown>`
- Supports auth guards, auditing, body transformations

### Security
- Field whitelisting — `allowedFields` filters body before hooks
- Query sanitization — blocks `__proto__`, `constructor`, `prototype`
- Query depth limits — `maxFilters`, `maxInValues`, `maxRegexLength` (400 on violation)

### TypeScript
- Full migration — no `any` in public surface
- All public types exported: `HirokiAdapter`, `HirokiQuery`, `HirokiFilter`, `HirokiSort`, `ControllerConfig`, `HirokiLogger`, `ValidConditions` and more
- Dual CJS + ESM output with `tsup`

### Documentation
- Full VitePress docs site at [ivanhuay.github.io/hiroki](https://ivanhuay.github.io/hiroki/)

---

## v2.0.0

- Hiroki is now backend-agnostic. Express removed as dependency
- Mongoose version updated
- `share` feature removed
* v0.2.7:
    * `shareFormat` & `beforeShareEnd` methods added to format share response.
    * Node v7 support removed.
    * docs for shared.
* v0.2.5 `fastUpdate` option added. This enabled a faster way to update for higher performance.
* v0.2.3 **Critical bugfix:** decorator error with delete method. Test added for cover that.
* v0.2.2 Params `$push` and `$pull` working for PUT method. For doing this a custom Assign method was added to hiroki, because of that we made a benchmark test to measure this performance impact. Check it [Here](https://github.com/ivanhuay/micron-object-assign).
* v0.2.0 Share Query path added. [check the docs](https://ivanhuay.github.io/hiroki/rest-api/share-query/).
* v0.1.3 MongooseConnector added, dependencies update no breaking changes. In future releases, new connectors would be added.
* v0.1.2 Bugfix decorator for put route with :id as parameter
* v0.1.1: Bugfix count with conditions error.
* v0.1.0:
    * PUT request fire pre save hook in Mongoose Schema.
    * PUT update by condition only update one document.
    * findOneAndUpdate method removed from PUT request.
* v0.0.9: Add support for new conditions format.
```
ej: GET /api/users?conditions[active]=true
```
* v0.0.8: fix general request function affect all routes.
This type of decorators affected all the routes.
```javascript
...
controller.request((req,res,next) => {
  res.status(401).json({});
})
```
now it only affects the route of that collection