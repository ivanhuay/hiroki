import {
  HttpError,
  BadRequestError,
  NotFoundError,
  InvalidModelError,
  InvalidConditionsError,
  ParamRequiredError,
  DocumentNotFoundError,
  BodyRequiredError,
  InvalidMethodError,
  InvalidMiddlewareError,
  InvalidEnumError,
  DisabledMethodError,
  RouteNotFoundError,
  UnexpectedError,
  isHttpError,
  hasStatus,
} from '../src/errors';

describe('Custom Error Classes', () => {
  describe('HttpError', () => {
    it('should create error with all properties', () => {
      const error = new HttpError('Test error', 400, 'TEST_ERROR', { key: 'value' });
      
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ key: 'value' });
      expect(error.name).toBe('HttpError');
    });

    it('should have proper stack trace', () => {
      const error = new HttpError('Test error', 400, 'TEST_ERROR');
      expect(error.stack).toBeDefined();
    });

    it('should serialize to JSON', () => {
      const error = new HttpError('Test error', 400, 'TEST_ERROR', { key: 'value' });
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: 'Test error',
        status: 400,
        code: 'TEST_ERROR',
        details: { key: 'value' }
      });
    });

    it('should serialize without details when not provided', () => {
      const error = new HttpError('Test error', 400, 'TEST_ERROR');
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: 'Test error',
        status: 400,
        code: 'TEST_ERROR'
      });
    });
  });

  describe('BadRequestError', () => {
    it('should create 400 error', () => {
      const error = new BadRequestError('Bad request');
      
      expect(error.status).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.code).toBe('BAD_REQUEST');
    });

    it('should accept custom code', () => {
      const error = new BadRequestError('Custom error', 'CUSTOM_CODE');
      expect(error.code).toBe('CUSTOM_CODE');
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error', () => {
      const error = new NotFoundError('Not found');
      
      expect(error.status).toBe(404);
      expect(error.message).toBe('Not found');
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('InvalidModelError', () => {
    it('should create error for invalid model', () => {
      const error = new InvalidModelError(123);
      
      expect(error.status).toBe(400);
      expect(error.message).toBe('model "123" is not valid.');
      expect(error.code).toBe('INVALID_MODEL');
      expect(error.details).toEqual({ providedModel: 123 });
    });

    it('should handle null model', () => {
      const error = new InvalidModelError(null);
      expect(error.message).toContain('null');
    });
  });

  describe('InvalidConditionsError', () => {
    it('should create error for invalid JSON conditions', () => {
      const error = new InvalidConditionsError('{invalid}');
      
      expect(error.status).toBe(400);
      expect(error.message).toContain('invalid conditions json');
      expect(error.code).toBe('INVALID_CONDITIONS');
    });

    it('should include parse error details', () => {
      const parseError = new Error('Unexpected token');
      const error = new InvalidConditionsError('{invalid}', parseError);
      
      expect(error.message).toContain('malformed conditions json');
      expect(error.message).toContain('Unexpected token');
      expect(error.details).toHaveProperty('parseError');
    });
  });

  describe('ParamRequiredError', () => {
    it('should create error for missing param', () => {
      const error = new ParamRequiredError('id');
      
      expect(error.status).toBe(400);
      expect(error.message).toBe('params id required');
      expect(error.code).toBe('PARAM_REQUIRED');
      expect(error.details).toEqual({ requiredParam: 'id' });
    });

    it('should accept custom status code', () => {
      const error = new ParamRequiredError('id', 404);
      expect(error.status).toBe(404);
    });
  });

  describe('DocumentNotFoundError', () => {
    it('should create 404 error for missing document', () => {
      const error = new DocumentNotFoundError();
      
      expect(error.status).toBe(404);
      expect(error.message).toBe('Document not found.');
      expect(error.code).toBe('DOCUMENT_NOT_FOUND');
    });

    it('should accept custom status', () => {
      const error = new DocumentNotFoundError(410);
      expect(error.status).toBe(410);
    });
  });

  describe('BodyRequiredError', () => {
    it('should create error for missing body', () => {
      const error = new BodyRequiredError('POST');
      
      expect(error.status).toBe(400);
      expect(error.message).toBe('Body is required for method "POST"');
      expect(error.code).toBe('BODY_REQUIRED');
      expect(error.details).toEqual({ method: 'POST' });
    });
  });

  describe('InvalidMethodError', () => {
    it('should create error for invalid HTTP method', () => {
      const error = new InvalidMethodError('PATCH', 'GET, POST, PUT, DELETE');
      
      expect(error.status).toBe(405);
      expect(error.message).toContain('PATCH');
      expect(error.message).toContain('GET, POST, PUT, DELETE');
      expect(error.code).toBe('INVALID_METHOD');
    });
  });

  describe('InvalidMiddlewareError', () => {
    it('should create error for invalid middleware', () => {
      const error = new InvalidMiddlewareError('authMiddleware');
      
      expect(error.status).toBe(400);
      expect(error.message).toContain('authMiddleware');
      expect(error.message).toContain('should be a function');
      expect(error.code).toBe('INVALID_MIDDLEWARE');
    });
  });

  describe('InvalidEnumError', () => {
    it('should create error for invalid enum value', () => {
      const error = new InvalidEnumError('invalid', ['active', 'inactive']);
      
      expect(error.status).toBe(400);
      expect(error.message).toContain('invalid');
      expect(error.message).toContain('active,inactive');
      expect(error.code).toBe('INVALID_ENUM');
      expect(error.details).toEqual({
        providedValue: 'invalid',
        expectedValues: ['active', 'inactive']
      });
    });
  });

  describe('DisabledMethodError', () => {
    it('should create error for disabled method', () => {
      const error = new DisabledMethodError('DELETE');
      
      expect(error.status).toBe(405);
      expect(error.message).toContain('DELETE');
      expect(error.message).toContain('Disabled method');
      expect(error.code).toBe('DISABLED_METHOD');
    });
  });

  describe('RouteNotFoundError', () => {
    it('should create error for missing route', () => {
      const error = new RouteNotFoundError('/api/missing');
      
      expect(error.status).toBe(404);
      expect(error.message).toContain('/api/missing');
      expect(error.message).toContain('404');
      expect(error.code).toBe('ROUTE_NOT_FOUND');
    });
  });

  describe('UnexpectedError', () => {
    it('should create 500 error', () => {
      const error = new UnexpectedError();
      
      expect(error.status).toBe(500);
      expect(error.message).toBe('Unexpected error.');
      expect(error.code).toBe('UNEXPECTED_ERROR');
    });

    it('should include original error details', () => {
      const original = new Error('Original error');
      const error = new UnexpectedError(original);
      
      expect(error.details).toEqual({
        originalError: 'Original error'
      });
    });
  });

  describe('Type Guards', () => {
    describe('isHttpError', () => {
      it('should return true for HttpError instances', () => {
        const error = new HttpError('test', 400, 'TEST');
        expect(isHttpError(error)).toBe(true);
      });

      it('should return true for derived error classes', () => {
        expect(isHttpError(new BadRequestError('test'))).toBe(true);
        expect(isHttpError(new NotFoundError('test'))).toBe(true);
        expect(isHttpError(new InvalidModelError(null))).toBe(true);
      });

      it('should return false for regular errors', () => {
        const error = new Error('regular error');
        expect(isHttpError(error)).toBe(false);
      });

      it('should return false for non-error values', () => {
        expect(isHttpError(null)).toBe(false);
        expect(isHttpError(undefined)).toBe(false);
        expect(isHttpError('string')).toBe(false);
        expect(isHttpError({})).toBe(false);
      });
    });

    describe('hasStatus', () => {
      it('should return true for errors with status property', () => {
        const error = new HttpError('test', 400, 'TEST');
        expect(hasStatus(error)).toBe(true);
      });

      it('should return true for custom errors with status', () => {
        const error = new Error('test') as any;
        error.status = 404;
        expect(hasStatus(error)).toBe(true);
      });

      it('should return false for errors without status', () => {
        const error = new Error('test');
        expect(hasStatus(error)).toBe(false);
      });
    });
  });

  describe('Error inheritance', () => {
    it('should be instance of Error', () => {
      const error = new InvalidModelError(null);
      expect(error instanceof Error).toBe(true);
    });

    it('should be instance of HttpError', () => {
      const error = new InvalidModelError(null);
      expect(error instanceof HttpError).toBe(true);
    });

    it('should be instance of BadRequestError', () => {
      const error = new InvalidModelError(null);
      expect(error instanceof BadRequestError).toBe(true);
    });

    it('should have correct constructor name', () => {
      const error = new InvalidModelError(null);
      expect(error.name).toBe('InvalidModelError');
    });
  });

  describe('Error catching and handling', () => {
    it('should catch and identify error types', () => {
      try {
        throw new DocumentNotFoundError();
      } catch (error) {
        expect(isHttpError(error)).toBe(true);
        expect(error).toBeInstanceOf(NotFoundError);
        expect(error).toBeInstanceOf(DocumentNotFoundError);
        if (isHttpError(error)) {
          expect(error.status).toBe(404);
          expect(error.code).toBe('DOCUMENT_NOT_FOUND');
        }
      }
    });

    it('should serialize properly for API responses', () => {
      try {
        throw new InvalidEnumError('wrong', ['a', 'b', 'c']);
      } catch (error) {
        if (isHttpError(error)) {
          const response = error.toJSON();
          expect(response.status).toBe(400);
          expect(response.code).toBe('INVALID_ENUM');
          expect(response.error).toContain('wrong');
          expect(response.details).toBeDefined();
        }
      }
    });
  });
});
