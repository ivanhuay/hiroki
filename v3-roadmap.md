# 🚀 Hiroki Roadmap (v3)

Hiroki está evolucionando desde un **wrapper de Mongoose** hacia un:

> **CRUD engine agnóstico con adapters pluggeables**

Este roadmap define las mejoras progresivas para modernizar la librería manteniendo compatibilidad y simplicidad.

---

# 🎯 Visión

Hiroki busca permitir:

* Generar APIs REST CRUD sin boilerplate
* Abstraer la capa de acceso a datos
* Ser extensible vía adapters (Mongo, SQL, etc.)
* Mantener una DX simple y predecible

---

# 🧱 Estado actual

* Base en JavaScript (migrando a TypeScript)
* Integración fuerte con Mongoose
* Generación automática de endpoints CRUD
* Parsing básico de query params
* Sin separación clara de adapters

---

# 🗺️ Roadmap

## 🥇 Fase 1 — Base moderna (en progreso)

### Objetivo

Estabilizar el core y preparar arquitectura para extensibilidad

### Tasks

* [x] Migración progresiva a TypeScript
* [x] Logger injectable (`HirokiLogger`)
* [x] Configuración con defaults claros
* [x] Eliminar `any` en:

  * [x] Controller
  * [x] MongooseConnector
  * [x] Requests / Responses
* [x] Tests básicos:

  * [x] routing (`check`)
  * [x] query parsing
  * [x] disabled methods
* [x] Mejorar manejo de errores tipados

---

## 🥈 Fase 2 — Adapter system ✅

### Objetivo

Separar el core del motor de base de datos

### Tasks

* [x] Definir interfaz base (`src/adapter.ts`):

```ts
interface HirokiAdapter {
  readonly modelName: string;
  canHandle(resource: unknown): boolean;
  findById(id: string, query?: QueryParams): Promise<unknown>;
  find(query: QueryParams): Promise<unknown>;
  count(query?: QueryParams): Promise<number>;
  distinct(field: string): Promise<unknown[]>;
  create(data: Record<string, unknown>): Promise<unknown>;
  updateById(id: string, data: UpdateSet, config?: UpdateConfig): Promise<unknown>;
  updateByConditions(conditions: ValidConditions | undefined, data: UpdateSet, config?: UpdateConfig): Promise<unknown>;
  delete(id: string): Promise<unknown>;
}
```

* [x] Extraer Mongoose a adapter (`src/mongoose-adapter.ts`):

  * [x] `MongooseAdapter implements HirokiAdapter`
* [x] Implementar `canHandle()`
* [x] Adapter registry interno (`AdapterRegistry` + `adapterRegistry` singleton)
* [x] Refactor Controller → usar `HirokiAdapter` (default: `MongooseAdapter`)
* [x] Eliminar `mongoose-connector.ts` (lógica absorbida por `MongooseAdapter`)
* [x] Simplificar `model.ts` → solo tipos/interfaces, sin clase ni deps de Mongoose

---

## 🥉 Fase 3 — Query abstraction ✅

### Objetivo

Soportar múltiples bases de datos

### Tasks

* [x] Definir AST de queries (`src/query.ts`):

```ts
interface HirokiQuery {
  where?: HirokiFilter[];   // { field, op, value }
  limit?: number;
  offset?: number;
  sort?: HirokiSort[];      // { field, dir: 'asc' | 'desc' }
  select?: string[];
  populate?: string;
  conditions?: ValidConditions; // legacy escape hatch
}
```

* [x] Parser agnóstico de query params (`parseHirokiQuery`)

  * `where[field]=value` → `{ field, op: 'eq', value }`
  * `where[field][$gt]=18` → `{ field, op: 'gt', value: 18 }`
  * `where[tags][$in]=a,b` → `{ field, op: 'in', value: ['a','b'] }`
  * `sort=-name,age` → `[{ field: 'name', dir: 'desc' }, ...]`
  * `select=name,email` → `['name', 'email']`
  * `limit`/`offset`/`skip` coerced to numbers
  * `conditions={"..."}` and `conditions[field]=value` kept as legacy

* [x] Mapper Mongoose: `HirokiFilter[]` → `FilterQuery` + options

  * `eq` → direct value, `gt/gte/lt/lte/ne/in/nin/regex` → `$op`
  * `HirokiSort[]` → Mongoose sort string

* [x] `HirokiAdapter` interface updated to use `HirokiQuery`
* [x] Controller `_getQueryParams` refactored to use new parser
* [x] `HirokiQuery`, `HirokiFilter`, `HirokiSort`, `FilterOperator` exported from package

---

## ⭐ Fase 4 — Hooks & extensibilidad ✅

### Objetivo

Permitir custom lógica sin modificar core

### Tasks

* [x] Lifecycle hooks (`src/hooks.ts`):

  * [x] `beforeCreate(body, ctx)` → mutated body
  * [x] `afterCreate(doc, ctx)`
  * [x] `beforeUpdate(body, ctx)` → mutated body
  * [x] `afterUpdate(doc, ctx)`
  * [x] `beforeDelete(id, ctx)`
  * [x] `afterDelete(doc, ctx)`

* [x] Middleware por recurso — `HirokiMiddleware[]` en `ControllerConfig`

  * Framework-agnostic: `(ctx, next) => Promise<unknown>`
  * Soporta chain de N middlewares (reduceRight)
  * Puede cortocircuitar: throw para denegar, return sin next para mock

* [x] Soporte para casos de uso:

  * auth — middleware lanza error antes del dispatch
  * auditoría — afterCreate/afterUpdate/afterDelete hooks
  * transformaciones — beforeCreate/beforeUpdate mutan el body

* [x] `HookContext` con `modelName` en todos los hooks
* [x] Hook + middleware types exportados del paquete

---

## 🚀 Fase 5 — Nuevos adapters ✅

### Objetivo

Expandir ecosistema

### Tasks

* [x] `MemoryAdapter` — zero deps, in-memory store, implements `HirokiAdapter` completo

  * Soporta todos los operadores: `eq/ne/gt/gte/lt/lte/in/nin/regex`
  * `sort`, `limit`, `offset`, `select`, legacy `conditions`
  * `clear()` para reset en tests
  * Exportado del paquete como `MemoryAdapter`

* [x] `adapter?: HirokiAdapter` en `ControllerConfig` — inyección directa de cualquier adapter

  * `Controller` usa: `config.adapter ?? adapterRegistry.resolve(model) ?? new MongooseAdapter(model)`
  * `hiroki.importModel('MyModel', { adapter: new MemoryAdapter('MyModel') })` — sin Mongoose

* [x] `AdapterRegistry` auto-resolution ya integrado en Controller (Fase 2)

---

# 📊 Observabilidad ✅

* [x] Logger base (`ConsoleLogger`)
* [x] Controller — `debug` por operación; `info` en create/update/delete
* [x] `MongooseAdapter` y `MemoryAdapter` loguean filter/options/result count en `debug`
* [x] Logger propagado a adapters vía `setLogger?(logger)` en `HirokiAdapter`

---

# 🔐 Seguridad ✅

* [x] Field whitelisting (`allowedFields` — filtra body antes de hooks)
* [x] Query sanitization (bloquea `__proto__`, `constructor`, `prototype`)
* [x] Limit depth / recursion (`QueryLimits`: `maxFilters`, `maxInValues`, `maxRegexLength` — 400 on violation)

---

# 🧪 Testing ✅

* [x] Unit tests — Controller, Validator, Query parsing (269 tests total)
* [x] Integration tests — CRUD completo (get/post/put/delete)
* [x] Edge cases — query inválida, paths malformados, params faltantes, route not found
* [x] Security tests — field whitelisting, query limits

---

# 📦 Build & Distribución ✅

* [x] Dual CJS + ESM output con **tsup**
* [x] `package.json` exports con condiciones `import` / `require`
* [x] CJS interop: `require('hiroki')` retorna singleton directamente
* [x] Smoke test ESM + CJS verificado en `prepublishOnly`
* [x] `mongoose` y `pluralize` como `external` (evita conflictos de instancias)

---

# 🧹 Deuda técnica completada ✅

* [x] Remover `any`, refactor `Validator` class → named exports
* [x] Fix ESM bare imports (`ERR_PACKAGE_PATH_NOT_EXPORTED`)
* [x] Fix `instanceof mongoose.Model` → duck typing (cross-realm)
* [x] Fix `InvalidModelError` mensaje, Fix `RouteNotFoundError` fuera de try-catch

---

## 🗺️ Próximas fases

---

## 🔧 Fase 6 — Deuda técnica & DX interna ✅

### Objetivo

Limpiar el core para facilitar contribuciones y mantenimiento

### Tasks

* [x] Simplificar `ResolvedControllerConfig` — reemplazado `Required<Omit<...>> & Pick<...>` por tipo explícito legible
* [x] Separar tipos públicos en `src/types.ts` — `HttpMethod`, `ProcessParams`, `RequestParams`, `ExtendedQueryParams`, `ParsedQuery` extraídos de `controller.ts`
* [x] Mejorar naming interno — `_disabledMethods` → `disabledMethods`, `_filterBody` → `filterBody`, `_getQueryParams` → `getQueryParams`
* [x] Eliminar `FilterQuery<any>` de `validator.ts` — `ValidConditions` ahora usa `Record<string, unknown>`, sin dep de mongoose

---

## 📚 Fase 7 — Documentación ✅

### Objetivo

Hacer Hiroki fácil de adoptar para humanos y herramientas AI

### Tasks

* [x] Getting Started — instalación + primer modelo en < 10 líneas (`mkdocs/guide/getting-started.md`)
* [x] Why Hiroki — comparación vs boilerplate manual (`mkdocs/guide/why-hiroki.md`)
* [x] Examples reales — CRUD con Mongoose, con MemoryAdapter, con hooks, con middleware auth (en guide pages)
* [x] API reference completa — todos los tipos y opciones documentados (`mkdocs/api/`)
* [x] Rate limiting — ejemplo de implementación vía middleware (`mkdocs/guide/security.md`)
* [x] Auth integration — ejemplo de guard via middleware + `beforeCreate` hook (`mkdocs/guide/hooks-middleware.md`)
* [x] VitePress setup — `npm run docs:build` → outputs to `docs/` for GitHub Pages
* [x] Adapters docs — MongooseAdapter, MemoryAdapter, Custom adapter guide (`mkdocs/adapters/`)

---

## ⚙️ Fase 8 — CI/CD: Migrar CircleCI → GitHub Actions ✅

### Objetivo

Reemplazar CircleCI con GitHub Actions para ejecutar tests en cada PR y push

### Tasks

* [x] Crear `.github/workflows/ci.yml` — ejecutar test suite completa (`npm test`)
* [x] Disparar en `push` y `pull_request` a `master` y `feature/**`
* [x] Matrix de Node.js versions (LTS actual + siguiente)
* [x] Eliminar `.circleci/config.yml` y directorio `.circleci/`
* [x] Verificar badge de status en README (si aplica)

---

## 📦 Fase 9 — Monorepo & sub-packages

### Objetivo

Expandir el ecosistema de adapters sin contaminar el core

### Tasks

* [ ] Migrar a estructura monorepo — `packages/hiroki` (core), workspace root con `npm workspaces` o `pnpm`
* [ ] `packages/hiroki-drizzle` — adapter para Drizzle ORM (PostgreSQL / SQLite)

  * Implementa `HirokiAdapter`
  * Mapea `HirokiFilter[]` → Drizzle `where` conditions
  * Peer deps: `drizzle-orm`, `hiroki`

* [ ] `packages/hiroki-sequelize` — adapter para Sequelize (MySQL / PostgreSQL legacy)

  * Implementa `HirokiAdapter`
  * Mapea `HirokiFilter[]` → Sequelize `Op` operators
  * Peer deps: `sequelize`, `hiroki`

* [ ] Logger externo — adaptadores para Pino y Winston que implementen `HirokiLogger`

---

# 🎯 Estado actual

✅ Core estable — Fases 1–5 completas
✅ Deuda técnica — Fase 6 completa
✅ Documentación — Fase 7 completa (VitePress, 13 páginas)
✅ CI/CD migración — Fase 8 completa (GitHub Actions)
🔧 Pendiente — Monorepo & sub-packages (Fase 9)

---

# 🤝 Contribuciones

Las contribuciones son bienvenidas.

Antes de abrir PR:

* Seguir roadmap
* Mantener compatibilidad
* Agregar tests si aplica

---

# 💡 Filosofía

Hiroki no busca ser un ORM.

Busca ser:

> **la forma más rápida de exponer un modelo como API REST usable**

---

# 📌 Estado del proyecto

✅ v3 core estable — adapter system, query AST, hooks, middleware, seguridad, build dual CJS/ESM
🔧 Fases 6–9 pendientes — deuda técnica, docs, CI/CD, monorepo
⚠️ API pública puede cambiar hasta release oficial de v3
