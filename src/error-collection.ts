// Custom error interface with status property
export interface CustomError extends Error {
  status?: number;
}

// Type guard for custom errors
export function isCustomError(error: unknown): error is CustomError {
  return error instanceof Error && 'status' in error;
}

class ErrorCollection {
  static invalidModel(model: any): never {
    throw new Error(`model "${model}" is not valid.`);
  }

  static invalidConditions(conditions: string): never {
    throw new Error(`invalid conditions json: "${conditions}".`);
  }

  static malformedConditions(conditions: string, parseError?: Error): never {
    const parseMsg = parseError?.message || '';
    throw new Error(`malformed conditions json: "${conditions}". ${parseMsg}`);
  }

  static paramRequired(paramsString: string, status?: number): never {
    const error = new Error(`params ${paramsString} required`) as CustomError;
    error.status = status;
    throw error;
  }

  static documentNotFound(status?: number): never {
    const error = new Error('Document not found.') as CustomError;
    error.status = status;
    throw error;
  }

  static bodyRequired(method: string): never {
    throw new Error(`Body is required for method "${method}"`);
  }

  static requestRequireCallback(): Error {
    return new Error('Request method require a callback function.');
  }

  static requestInvalidMethod(method: string, validMethodsStr: string): Error {
    return new Error(`Request method "${method}" is not valid. Only ${validMethodsStr} are allowed.`);
  }

  static invalidMethod(method: string, validMethodsStr: string): Error {
    return new Error(`Request method "${method}" is not valid. Only ${validMethodsStr} are allowed.`);
  }

  static invalidMiddleware(middlewareName: string): never {
    throw new Error(`Middleware "${middlewareName}" should be a function.`);
  }

  static invalidEnum(value: any, expected: any[]): never {
    throw new Error(`Invalid Enum value "${value}" should be a one of "${expected.join(',')}"`);
  }

  static disabledMethod(value: string): never {
    throw new Error(`Disabled method "${value}" for this model.`);
  }

  static notFound(path: string): never {
    const err = new Error(`404 "${path}" not found.`) as CustomError;
    err.status = 404;
    throw err;
  }

  static unexpectedError(): never {
    throw new Error('Unexpected error.');
  }
}

export default ErrorCollection;
