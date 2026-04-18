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
* [ ] Mejorar manejo de errores tipados

---

## 🥈 Fase 2 — Adapter system

### Objetivo

Separar el core del motor de base de datos

### Tasks

* [ ] Definir interfaz base:

```ts
interface HirokiAdapter {
  canHandle(resource: unknown): boolean
  find(query: unknown): Promise<any>
  create(data: unknown): Promise<any>
  update(query: unknown, data: unknown): Promise<any>
  delete(query: unknown): Promise<any>
}
```

* [ ] Extraer Mongoose a adapter:

  * [ ] `@hiroki/adapter-mongoose`
* [ ] Implementar `canHandle()`
* [ ] Adapter registry interno
* [ ] Refactor Controller → usar adapter

---

## 🥉 Fase 3 — Query abstraction

### Objetivo

Soportar múltiples bases de datos

### Tasks

* [ ] Definir AST de queries:

```ts
{
  where: [],
  limit: number,
  offset: number,
  sort: []
}
```

* [ ] Parser agnóstico de query params
* [ ] Mapper:

  * Mongo → `$gt`, `$in`
  * SQL → `>`, `IN`
* [ ] Validación de filtros

---

## ⭐ Fase 4 — Hooks & extensibilidad

### Objetivo

Permitir custom lógica sin modificar core

### Tasks

* [ ] Lifecycle hooks:

  * [ ] beforeCreate
  * [ ] afterCreate
  * [ ] beforeUpdate
  * [ ] afterDelete
* [ ] Middleware por recurso
* [ ] Soporte para:

  * auth
  * multitenancy
  * auditoría

---

## 🚀 Fase 5 — Nuevos adapters

### Objetivo

Expandir ecosistema

### Posibles adapters

* [ ] PostgreSQL (Drizzle / Prisma)
* [ ] Sequelize (legacy support)
* [ ] Custom adapter API

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

# 🧹 Deuda técnica

* [x] Remover `any`
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
