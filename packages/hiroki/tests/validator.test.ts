import {
  isMongooseModel,
  validateModel,
  validateConditions,
  validatePutParams,
  validateIdRequired,
  validateDocumentExist,
  validateBody,
  validateCallback,
  validateEnum,
  validateDisabledMethod
} from '../src/validator';
import Users from './mock/models/users';
import Books from './mock/models/books';

describe('Validator', () => {
  describe('isMongooseModel', () => {
    it('should return true for Mongoose model', () => {
      expect(isMongooseModel(Users)).toBe(true);
      expect(isMongooseModel(Books)).toBe(true);
    });

    it('should return false for non-model values', () => {
      expect(isMongooseModel('Users')).toBe(false);
      expect(isMongooseModel({})).toBe(false);
      expect(isMongooseModel(null)).toBe(false);
      expect(isMongooseModel(undefined)).toBe(false);
      expect(isMongooseModel(123)).toBe(false);
      expect(isMongooseModel(() => {})).toBe(false);
    });
  });

  describe('validateModel', () => {
    it('should accept string model names', () => {
      expect(() => validateModel('Users')).not.toThrow();
      expect(() => validateModel('Books')).not.toThrow();
    });

    it('should accept Mongoose model instances', () => {
      expect(() => validateModel(Users)).not.toThrow();
      expect(() => validateModel(Books)).not.toThrow();
    });

    it('should throw error for null or undefined', () => {
      expect(() => validateModel(null)).toThrow('model "null" is not valid.');
      expect(() => validateModel(undefined)).toThrow('model "undefined" is not valid.');
    });

    it('should throw error for invalid model types', () => {
      expect(() => validateModel(123)).toThrow('is not valid');
      expect(() => validateModel({})).toThrow('is not valid');
      expect(() => validateModel([])).toThrow('is not valid');
    });
  });

  describe('validateConditions', () => {
    it('should accept undefined or null conditions', () => {
      expect(validateConditions(undefined)).toBeUndefined();
      expect(validateConditions(null)).toBeNull();
    });

    it('should accept object conditions', () => {
      const conditions = { email: 'test@example.com' };
      expect(validateConditions(conditions)).toEqual(conditions);
    });

    it('should accept MongoDB operators in conditions', () => {
      const conditions = {
        books: { $not: { $size: 0 } },
        age: { $gte: 18, $lte: 65 }
      };
      expect(validateConditions(conditions)).toEqual(conditions);
    });

    it('should parse valid JSON string conditions', () => {
      const jsonString = '{"email":"test@example.com"}';
      const result = validateConditions(jsonString);
      expect(result).toEqual({ email: 'test@example.com' });
    });

    it('should parse complex JSON string with operators', () => {
      const jsonString = '{"age":{"$gte":18},"active":true}';
      const result = validateConditions(jsonString);
      expect(result).toEqual({ age: { $gte: 18 }, active: true });
    });

    it('should throw error for invalid JSON string', () => {
      const invalidJson = '{invalid json}';
      expect(() => validateConditions(invalidJson)).toThrow('malformed conditions json');
    });
  });

  describe('validatePutParams', () => {
    it('should accept params with id', () => {
      const params = {
        query: { id: '5c01997482c8985ad9a7eb5b' }
      };
      expect(() => validatePutParams(params)).not.toThrow();
    });

    it('should accept params with conditions', () => {
      const params = {
        query: { conditions: { email: 'test@example.com' } }
      };
      expect(() => validatePutParams(params)).not.toThrow();
    });

    it('should accept params with both id and conditions', () => {
      const params = {
        query: {
          id: '5c01997482c8985ad9a7eb5b',
          conditions: { email: 'test@example.com' }
        }
      };
      expect(() => validatePutParams(params)).not.toThrow();
    });

    it('should throw error when neither id nor conditions provided', () => {
      const params = { query: {} };
      expect(() => validatePutParams(params)).toThrow('params id or conditions required');
    });

    it('should throw error when query is undefined', () => {
      const params = {};
      expect(() => validatePutParams(params)).toThrow('params id or conditions required');
    });
  });

  describe('validateIdRequired', () => {
    it('should accept params with id', () => {
      const params = { id: '5c01997482c8985ad9a7eb5b' };
      expect(() => validateIdRequired(params)).not.toThrow();
    });

    it('should throw error when id is missing', () => {
      const params = {};
      expect(() => validateIdRequired(params)).toThrow('params id required');
    });

    it('should throw error with custom status code', () => {
      const params = {};
      try {
        validateIdRequired(params);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('params id required');
        expect(error.status).toBe(404);
      }
    });
  });

  describe('validateDocumentExist', () => {
    it('should accept existing document', () => {
      const doc = { _id: '123', name: 'test' };
      expect(() => validateDocumentExist(doc)).not.toThrow();
    });

    it('should accept truthy values', () => {
      expect(() => validateDocumentExist('string')).not.toThrow();
      expect(() => validateDocumentExist(1)).not.toThrow();
      expect(() => validateDocumentExist([])).not.toThrow();
      expect(() => validateDocumentExist({})).not.toThrow();
    });

    it('should throw error for null or undefined', () => {
      expect(() => validateDocumentExist(null)).toThrow('Document not found.');
      expect(() => validateDocumentExist(undefined)).toThrow('Document not found.');
    });

    it('should throw error with custom status code', () => {
      try {
        validateDocumentExist(null, 404);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('Document not found.');
        expect(error.status).toBe(404);
      }
    });

    it('should throw error for falsy values', () => {
      expect(() => validateDocumentExist(0)).toThrow('Document not found.');
      expect(() => validateDocumentExist('')).toThrow('Document not found.');
      expect(() => validateDocumentExist(false)).toThrow('Document not found.');
    });
  });

  describe('validateBody', () => {
    it('should accept POST with body', () => {
      const params = {
        method: 'POST',
        body: { name: 'test' }
      };
      expect(() => validateBody(params)).not.toThrow();
    });

    it('should accept PUT with body', () => {
      const params = {
        method: 'PUT',
        body: { name: 'updated' }
      };
      expect(() => validateBody(params)).not.toThrow();
    });

    it('should accept GET without body', () => {
      const params = { method: 'GET' };
      expect(() => validateBody(params)).not.toThrow();
    });

    it('should accept DELETE without body', () => {
      const params = { method: 'DELETE' };
      expect(() => validateBody(params)).not.toThrow();
    });

    it('should throw error for POST without body', () => {
      const params = { method: 'POST' };
      expect(() => validateBody(params)).toThrow('Body is required for method "POST"');
    });

    it('should throw error for PUT without body', () => {
      const params = { method: 'PUT' };
      expect(() => validateBody(params)).toThrow('Body is required for method "PUT"');
    });

    it('should accept empty object as body', () => {
      const params = {
        method: 'POST',
        body: {}
      };
      expect(() => validateBody(params)).not.toThrow();
    });
  });

  describe('validateCallback', () => {
    it('should accept function callbacks', () => {
      const callback = () => {};
      expect(() => validateCallback(callback, 'testCallback')).not.toThrow();
    });

    it('should accept arrow functions', () => {
      const callback = () => console.log('test');
      expect(() => validateCallback(callback, 'arrowCallback')).not.toThrow();
    });

    it('should accept async functions', () => {
      const callback = async () => {};
      expect(() => validateCallback(callback, 'asyncCallback')).not.toThrow();
    });

    it('should throw error for non-function values', () => {
      expect(() => validateCallback('not a function', 'testCallback')).toThrow(
        'Middleware "testCallback" should be a function.'
      );
    });

    it('should throw error for null', () => {
      expect(() => validateCallback(null, 'nullCallback')).toThrow(
        'Middleware "nullCallback" should be a function.'
      );
    });

    it('should throw error for undefined', () => {
      expect(() => validateCallback(undefined, 'undefinedCallback')).toThrow(
        'Middleware "undefinedCallback" should be a function.'
      );
    });

    it('should throw error for objects', () => {
      expect(() => validateCallback({}, 'objectCallback')).toThrow(
        'should be a function'
      );
    });
  });

  describe('validateEnum', () => {
    it('should accept valid enum value', () => {
      const options = ['active', 'inactive', 'pending'];
      expect(() => validateEnum('active', options)).not.toThrow();
      expect(() => validateEnum('pending', options)).not.toThrow();
    });

    it('should accept numeric enums', () => {
      const numbers = [1, 2, 3, 4, 5];
      expect(() => validateEnum(3, numbers)).not.toThrow();
      expect(() => validateEnum(5, numbers)).not.toThrow();
    });

    it('should throw error for invalid enum value', () => {
      const options = ['active', 'inactive', 'pending'];
      expect(() => validateEnum('deleted', options)).toThrow(
        'Invalid Enum value "deleted" should be a one of "active,inactive,pending"'
      );
    });

    it('should throw error for value not in numeric enum', () => {
      const numbers = [1, 2, 3];
      expect(() => validateEnum(5, numbers)).toThrow(
        'Invalid Enum value "5" should be a one of "1,2,3"'
      );
    });

    it('should work with type inference', () => {
      type Status = 'active' | 'inactive';
      const statuses: Status[] = ['active', 'inactive'];
      const value: Status = 'active';

      expect(() => validateEnum(value, statuses)).not.toThrow();
    });
  });

  describe('validateDisabledMethod', () => {
    const disabledMethods = ['DELETE', 'PUT'];

    it('should not throw for enabled methods', () => {
      expect(() => validateDisabledMethod('GET', disabledMethods)).not.toThrow();
      expect(() => validateDisabledMethod('POST', disabledMethods)).not.toThrow();
    });

    it('should throw error for disabled DELETE method', () => {
      expect(() => validateDisabledMethod('DELETE', disabledMethods)).toThrow(
        'Disabled method "DELETE" for this model.'
      );
    });

    it('should throw error for disabled PUT method', () => {
      expect(() => validateDisabledMethod('PUT', disabledMethods)).toThrow(
        'Disabled method "PUT" for this model.'
      );
    });

    it('should work with empty disabled list', () => {
      expect(() => validateDisabledMethod('DELETE', [])).not.toThrow();
      expect(() => validateDisabledMethod('PUT', [])).not.toThrow();
    });

    it('should be case sensitive', () => {
      const disabledLowerCase = ['delete'];
      expect(() => validateDisabledMethod('DELETE', disabledLowerCase)).not.toThrow();
      expect(() => validateDisabledMethod('delete', disabledLowerCase)).toThrow();
    });
  });

  describe('Integration: Complex scenarios', () => {
    it('should validate complete PUT request params', () => {
      const validParams = {
        query: {
          id: '5c01997482c8985ad9a7eb5b',
          conditions: { email: 'test@example.com' }
        },
        body: { name: 'updated name' },
        method: 'PUT'
      };

      expect(() => validatePutParams(validParams)).not.toThrow();
      expect(() => validateBody(validParams)).not.toThrow();
    });

    it('should validate model and conditions together', () => {
      expect(() => validateModel(Users)).not.toThrow();

      const conditions = '{"email":"test@example.com"}';
      const parsed = validateConditions(conditions);

      expect(parsed).toEqual({ email: 'test@example.com' });
    });

    it('should handle MongoDB operators in various formats', () => {
      const stringConditions = '{"books":{"$not":{"$size":0}}}';
      const parsed = validateConditions(stringConditions);
      expect(parsed).toHaveProperty('books');

      const objectConditions = {
        age: { $gte: 18, $lte: 65 },
        status: { $in: ['active', 'pending'] }
      };
      const result = validateConditions(objectConditions);
      expect(result).toEqual(objectConditions);
    });
  });
});
