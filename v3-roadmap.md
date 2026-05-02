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

### Posibles adapters (externos, fuera del core)

* [ ] PostgreSQL (Drizzle / Prisma) — paquete separado `hiroki-drizzle`
* [ ] Sequelize (legacy support) — paquete separado `hiroki-sequelize`

---

# 📊 Observabilidad

### Objetivo

Mejorar debugging y DX

### Tasks

* [x] Logger base (`ConsoleLogger`)
* [ ] Logging en:

  * [ ] Controller
  * [ ] Adapter
  * [ ] Query parsing
* [ ] Logger externo (opcional):

  * [ ] Pino
  * [ ] Winston

---

# 🔐 Seguridad

### Objetivo

Evitar exposiciones peligrosas

### Tasks

* [ ] Field whitelisting
* [ ] Query sanitization
* [ ] Limit depth / recursion
* [ ] Rate limiting hooks
* [ ] Auth integration examples

---

# 📚 Documentación

## 🧩 Docs actuales

* MkDocs (base existente)

## 🆕 Próximos pasos

### 1. Reorganización

* [ ] Getting Started claro
* [ ] Why Hiroki
* [ ] Examples reales
* [ ] API reference completa

---

## 🤖 Documentación compatible con IA

### Objetivo

Hacer que Hiroki sea fácil de usar por herramientas AI (ChatGPT, Copilot, etc.)

### Tasks

* [ ] Agregar ejemplos claros y simples:

```ts
hiroki.register(User)
```

* [ ] Evitar ambigüedades en API
* [ ] Tipos bien definidos en TypeScript
* [ ] Comentarios JSDoc:

```ts
/**
 * Registers a model and exposes REST endpoints automatically
 */
```

* [ ] Casos de uso explícitos:

  * CRUD básico
  * filtros
  * paginación

---

## 🧠 AI-friendly design principles

* APIs predecibles
* nombres explícitos
* ejemplos cortos y reales
* evitar “magia implícita”
* tipos claros

---

# 🧪 Testing

### Objetivo

Aumentar confianza en cambios

### Tasks

* [ ] Unit tests:

  * Controller
  * Validator
  * Query parsing
* [ ] Integration tests:

  * end-to-end CRUD
* [ ] Edge cases:

  * invalid query
  * disabled methods
  * malformed paths

---

# 📦 Build & Distribución

### Objetivo

Garantizar que el paquete publicado funcione correctamente como ESM y CJS

### Tasks

* [x] Agregar extensiones `.js` a todos los imports relativos en fuente TypeScript (requerido para ESM output)
* [x] Agregar `moduleNameMapper` en Jest para resolver `.js` → `.ts` en tests
* [x] Smoke test (`smoke-test.mjs`) — verifica exports del build antes de publicar
* [x] Script `npm run smoke` + integrado en `prepublishOnly`
* [x] Migrar build a **tsup** (dual CJS + ESM output)
* [x] `package.json` `exports` con condiciones `import` / `require`
* [x] CJS interop: `require('hiroki')` retorna singleton directamente (no exports object)
* [x] Smoke test actualizado para verificar ambos formatos (ESM + CJS)
* [x] Dependencias `mongoose` y `pluralize` marcadas como `external` — evita bundling y conflictos de instancias

---

# 🧹 Deuda técnica

* [x] Remover `any`
* [x] Refactor `Validator` class → standalone named exports (remove static-only class antipattern)
* [x] Eliminar código muerto: `validateConditionsString`, `validaMethods`
* [x] Fix ESM: bare imports causaban `ERR_PACKAGE_PATH_NOT_EXPORTED` al usar el paquete como dependencia
* [x] Fix `instanceof mongoose.Model` → duck typing (`modelName`, `find`, `schema`) — resuelve fallos cross-realm (npm link, múltiples copias de mongoose)
* [x] Fix `InvalidModelError` — mensaje mostraba función completa; ahora muestra `model.modelName`
* [ ] Simplificar tipos complejos (`Omit + Pick`)
* [ ] Separar tipos en archivos
* [ ] Mejorar naming interno
* [ ] Evitar lógica duplicada

---

# 🎯 Prioridades actuales

1. TypeScript sólido
2. Adapter abstraction
3. Query parser agnóstico
4. Logging consistente
5. Docs claras

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

🚧 En refactor activo hacia v3
⚠️ API puede cambiar
✅ Base funcional estable
