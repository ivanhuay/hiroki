# Errors

All errors extend `HttpError` and serialize to `{ error, status, code, details? }`.

`hiroki.process()` catches all errors and returns the serialized form — it never throws.

## Error reference

| Class | Status | Code |
|-------|--------|------|
| `BadRequestError` | 400 | `BAD_REQUEST` |
| `NotFoundError` | 404 | `NOT_FOUND` |
| `MethodNotAllowedError` | 405 | `METHOD_NOT_ALLOWED` |
| `InternalServerError` | 500 | `INTERNAL_ERROR` |
| `InvalidModelError` | 400 | `INVALID_MODEL` |
| `InvalidConditionsError` | 400 | `INVALID_CONDITIONS` |
| `ParamRequiredError` | 400 / 404 | `PARAM_REQUIRED` |
| `DocumentNotFoundError` | 404 | `DOCUMENT_NOT_FOUND` |
| `BodyRequiredError` | 400 | `BODY_REQUIRED` |
| `DisabledMethodError` | 405 | `METHOD_DISABLED` |
| `RouteNotFoundError` | 404 | `ROUTE_NOT_FOUND` |

## Using errors in hooks and middleware

Import error classes to return typed HTTP responses from hooks or middleware:

```ts
import { BadRequestError, NotFoundError } from 'hiroki';

const requireAuth: HirokiMiddleware = async (ctx, next) => {
  if (!ctx.query?.token) {
    throw new BadRequestError('Authentication required', 'UNAUTHORIZED');
  }
  return next();
};
```

## isHttpError / hasStatus

```ts
import { isHttpError, hasStatus } from 'hiroki';

if (isHttpError(err)) {
  console.log(err.status, err.code);
}
```
