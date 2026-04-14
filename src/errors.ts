/**
 * Base HTTP Error class with status code support
 * All custom errors should extend this class
 */
export class HttpError extends Error {
  public status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts error to JSON for API responses
   */
  toJSON() {
    return {
      error: this.message,
      status: this.status,
      code: this.code,
      ...(this.details && { details: this.details })
    };
  }
}

/**
 * 400 - Bad Request errors (validation, malformed input, etc.)
 */
export class BadRequestError extends HttpError {
  constructor(message: string, code = 'BAD_REQUEST', details?: unknown) {
    super(message, 400, code, details);
  }
}

/**
 * 404 - Not Found errors
 */
export class NotFoundError extends HttpError {
  constructor(message: string, code = 'NOT_FOUND', details?: unknown) {
    super(message, 404, code, details);
  }
}

/**
 * 405 - Method Not Allowed errors
 */
export class MethodNotAllowedError extends HttpError {
  constructor(message: string, code = 'METHOD_NOT_ALLOWED', details?: unknown) {
    super(message, 405, code, details);
  }
}

/**
 * 500 - Internal Server Error
 */
export class InternalServerError extends HttpError {
  constructor(message: string, code = 'INTERNAL_SERVER_ERROR', details?: unknown) {
    super(message, 500, code, details);
  }
}

// ==================== Specific Error Classes ====================

/**
 * Invalid model provided (string or Mongoose model expected)
 */
export class InvalidModelError extends BadRequestError {
  constructor(model: unknown) {
    super(
      `model "${model}" is not valid.`,
      'INVALID_MODEL',
      { providedModel: model }
    );
  }
}

/**
 * Invalid or malformed conditions for MongoDB query
 */
export class InvalidConditionsError extends BadRequestError {
  constructor(conditions: string, parseError?: Error) {
    const message = parseError
      ? `malformed conditions json: "${conditions}". ${parseError.message}`
      : `invalid conditions json: "${conditions}".`;
    
    super(message, 'INVALID_CONDITIONS', {
      conditions,
      parseError: parseError?.message
    });
  }
}

/**
 * Required parameter is missing
 */
export class ParamRequiredError extends BadRequestError {
  constructor(paramName: string, status?: number) {
    super(
      `params ${paramName} required`,
      'PARAM_REQUIRED',
      { requiredParam: paramName }
    );
    if (status) {
      this.status = status;
    }
  }
}

/**
 * Document not found in database
 */
export class DocumentNotFoundError extends NotFoundError {
  constructor(status?: number) {
    super('Document not found.', 'DOCUMENT_NOT_FOUND');
    if (status) {
      this.status = status;
    }
  }
}

/**
 * Body is required for POST/PUT requests
 */
export class BodyRequiredError extends BadRequestError {
  constructor(method: string) {
    super(
      `Body is required for method "${method}"`,
      'BODY_REQUIRED',
      { method }
    );
  }
}

/**
 * HTTP method not valid for this endpoint
 */
export class InvalidMethodError extends MethodNotAllowedError {
  constructor(method: string, validMethods: string) {
    super(
      `Request method "${method}" is not valid. Only ${validMethods} are allowed.`,
      'INVALID_METHOD',
      { invalidMethod: method, validMethods }
    );
  }
}

/**
 * Middleware is not a function
 */
export class InvalidMiddlewareError extends BadRequestError {
  constructor(middlewareName: string) {
    super(
      `Middleware "${middlewareName}" should be a function.`,
      'INVALID_MIDDLEWARE',
      { middlewareName }
    );
  }
}

/**
 * Invalid enum value provided
 */
export class InvalidEnumError extends BadRequestError {
  constructor(value: unknown, expected: unknown[]) {
    super(
      `Invalid Enum value "${value}" should be a one of "${expected.join(',')}"`,
      'INVALID_ENUM',
      { providedValue: value, expectedValues: expected }
    );
  }
}

/**
 * Method is disabled for this model
 */
export class DisabledMethodError extends MethodNotAllowedError {
  constructor(method: string) {
    super(
      `Disabled method "${method}" for this model.`,
      'DISABLED_METHOD',
      { method }
    );
  }
}

/**
 * Route not found
 */
export class RouteNotFoundError extends NotFoundError {
  constructor(path: string) {
    super(`404 "${path}" not found.`, 'ROUTE_NOT_FOUND', { path });
  }
}

/**
 * Unexpected error occurred
 */
export class UnexpectedError extends InternalServerError {
  constructor(originalError?: Error) {
    super('Unexpected error.', 'UNEXPECTED_ERROR', {
      originalError: originalError?.message
    });
  }
}

// ==================== Type Guards ====================

/**
 * Type guard to check if error is an HttpError
 */
export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

/**
 * Type guard to check if error has status property (legacy support)
 */
export function hasStatus(error: unknown): error is Error & { status: number } {
  return error instanceof Error && 'status' in error && typeof (error as any).status === 'number';
}

// ==================== Error Factory (Legacy compatibility) ====================

/**
 * Factory class for creating errors (maintains backward compatibility)
 * @deprecated Use specific error classes directly instead
 */
export class ErrorFactory {
  static invalidModel(model: unknown): never {
    throw new InvalidModelError(model);
  }

  static invalidConditions(conditions: string): never {
    throw new InvalidConditionsError(conditions);
  }

  static malformedConditions(conditions: string, parseError?: Error): never {
    throw new InvalidConditionsError(conditions, parseError);
  }

  static paramRequired(paramsString: string, status?: number): never {
    throw new ParamRequiredError(paramsString, status);
  }

  static documentNotFound(status?: number): never {
    throw new DocumentNotFoundError(status);
  }

  static bodyRequired(method: string): never {
    throw new BodyRequiredError(method);
  }

  static requestRequireCallback(): never {
    throw new InvalidMiddlewareError('callback');
  }

  static requestInvalidMethod(method: string, validMethodsStr: string): never {
    throw new InvalidMethodError(method, validMethodsStr);
  }

  static invalidMethod(method: string, validMethodsStr: string): never {
    throw new InvalidMethodError(method, validMethodsStr);
  }

  static invalidMiddleware(middlewareName: string): never {
    throw new InvalidMiddlewareError(middlewareName);
  }

  static invalidEnum(value: unknown, expected: unknown[]): never {
    throw new InvalidEnumError(value, expected);
  }

  static disabledMethod(value: string): never {
    throw new DisabledMethodError(value);
  }

  static notFound(path: string): never {
    throw new RouteNotFoundError(path);
  }

  static unexpectedError(): never {
    throw new UnexpectedError();
  }
}
