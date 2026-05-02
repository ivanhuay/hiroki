# Query Parameters

Hiroki parses URL query parameters into a typed `HirokiQuery` AST before passing to the adapter. All adapters (Mongoose, Memory, custom) receive the same normalized query.

## Filtering (`where`)

```
GET /api/users?where[name]=alice
# → { field: 'name', op: 'eq', value: 'alice' }

GET /api/users?where[age][$gt]=18
# → { field: 'age', op: 'gt', value: 18 }

GET /api/users?where[role][$in]=admin,user
# → { field: 'role', op: 'in', value: ['admin', 'user'] }
```

### Supported operators

| Operator | Description |
|----------|-------------|
| _(none)_ | equal (`eq`) |
| `$eq` | equal |
| `$ne` | not equal |
| `$gt` | greater than |
| `$gte` | greater than or equal |
| `$lt` | less than |
| `$lte` | less than or equal |
| `$in` | in array (comma-separated) |
| `$nin` | not in array (comma-separated) |
| `$regex` | regex match |

Multiple `where` filters are AND-combined.

## Sorting

```
GET /api/users?sort=name          # ascending by name
GET /api/users?sort=-name         # descending by name
GET /api/users?sort=-name,age     # desc name, then asc age
```

## Pagination

```
GET /api/users?limit=10
GET /api/users?offset=20          # or: skip=20
GET /api/users?limit=10&offset=20
```

## Field selection

```
GET /api/users?select=name,email  # only name and email fields
```

## Count

```
GET /api/users?count=true              # total count
GET /api/users?count=true&where[active]=true   # filtered count
```

Returns a number, not an array.

## Distinct

```
GET /api/users?distinct=role   # unique values of 'role' field
```

## Populate (Mongoose only)

```
GET /api/users?populate=posts         # populate by field name
GET /api/users?populate={"path":"posts","select":"title"}
```

## Legacy conditions

The `conditions` parameter is kept for backward compatibility:

```
GET /api/users?conditions={"name":"alice"}          # JSON string
GET /api/users?conditions[name]=alice               # bracket notation
```

Prefer `where[]` for new code — it works across all adapters.

## Value coercion

Hiroki automatically coerces query string values:

| String | Becomes |
|--------|---------|
| `"true"` | `true` (boolean) |
| `"false"` | `false` (boolean) |
| `"42"` | `42` (number) |
| `"alice"` | `"alice"` (string) |
