import Validator from '../src/validator';
import Users from './mock/models/users';
import Books from './mock/models/books';
import mongoose from 'mongoose';

describe('Validator', () => {
  describe('isMongooseModel', () => {
    it('should return true for Mongoose model', () => {
      expect(Validator.isMongooseModel(Users)).toBe(true);
      expect(Validator.isMongooseModel(Books)).toBe(true);
    });

    it('should return false for non-model values', () => {
      expect(Validator.isMongooseModel('Users')).toBe(false);
      expect(Validator.isMongooseModel({})).toBe(false);
      expect(Validator.isMongooseModel(null)).toBe(false);
      expect(Validator.isMongooseModel(undefined)).toBe(false);
      expect(Validator.isMongooseModel(123)).toBe(false);
      expect(Validator.isMongooseModel(() => {})).toBe(false);
    });
  });

  describe('validateModel', () => {
    it('should accept string model names', () => {
      expect(Validator.validateModel('Users')).toBe(true);
      expect(Validator.validateModel('Books')).toBe(true);
    });

    it('should accept Mongoose model instances', () => {
      expect(Validator.validateModel(Users)).toBe(true);
      expect(Validator.validateModel(Books)).toBe(true);
    });

    it('should throw error for null or undefined', () => {
      expect(() => Validator.validateModel(null)).toThrow('model "null" is not valid.');
      expect(() => Validator.validateModel(undefined)).toThrow('model "undefined" is not valid.');
    });

    it('should throw error for invalid model types', () => {
      expect(() => Validator.validateModel(123)).toThrow('is not valid');
      expect(() => Validator.validateModel({})).toThrow('is not valid');
      expect(() => Validator.validateModel([])).toThrow('is not valid');
    });
  });

  describe('validateConditions', () => {
    it('should accept undefined or null conditions', () => {
      expect(Validator.validateConditions(undefined)).toBeUndefined();
      expect(Validator.validateConditions(null)).toBeNull();
    });

    it('should accept object conditions', () => {
      const conditions = { email: 'test@example.com' };
      expect(Validator.validateConditions(conditions)).toEqual(conditions);
    });

    it('should accept MongoDB operators in conditions', () => {
      const conditions = {
        books: { $not: { $size: 0 } },
        age: { $gte: 18, $lte: 65 }
      };
      expect(Validator.validateConditions(conditions)).toEqual(conditions);
    });

    it('should parse valid JSON string conditions', () => {
      const jsonString = '{"email":"test@example.com"}';
      const result = Validator.validateConditions(jsonString);
      expect(result).toEqual({ email: 'test@example.com' });
    });

    it('should parse complex JSON string with operators', () => {
      const jsonString = '{"age":{"$gte":18},"active":true}';
      const result = Validator.validateConditions(jsonString);
      expect(result).toEqual({ age: { $gte: 18 }, active: true });
    });

    it('should throw error for invalid JSON string', () => {
      const invalidJson = '{invalid json}';
      expect(() => Validator.validateConditions(invalidJson)).toThrow('malformed conditions json');
    });
  });

  describe('validatePutParams', () => {
    it('should accept params with id', () => {
      const params = {
        query: { id: '5c01997482c8985ad9a7eb5b' }
      };
      expect(Validator.validatePutParams(params)).toBe(true);
    });

    it('should accept params with conditions', () => {
      const params = {
        query: { conditions: { email: 'test@example.com' } }
      };
      expect(Validator.validatePutParams(params)).toBe(true);
    });

    it('should accept params with both id and conditions', () => {
      const params = {
        query: {
          id: '5c01997482c8985ad9a7eb5b',
          conditions: { email: 'test@example.com' }
        }
      };
      expect(Validator.validatePutParams(params)).toBe(true);
    });

    it('should throw error when neither id nor conditions provided', () => {
      const params = { query: {} };
      expect(() => Validator.validatePutParams(params)).toThrow('params id or conditions required');
    });

    it('should throw error when query is undefined', () => {
      const params = {};
      expect(() => Validator.validatePutParams(params)).toThrow('params id or conditions required');
    });
  });

  describe('validateIdRequired', () => {
    it('should accept params with id', () => {
      const params = { id: '5c01997482c8985ad9a7eb5b' };
      expect(Validator.validateIdRequired(params)).toBe(true);
    });

    it('should throw error when id is missing', () => {
      const params = {};
      expect(() => Validator.validateIdRequired(params)).toThrow('params id required');
    });

    it('should throw error with custom status code', () => {
      const params = {};
      try {
        Validator.validateIdRequired(params);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('params id required');
        expect(error.status).toBe(404);
      }
    });
  });

  describe('validateConditionsString', () => {
    it('should accept valid JSON string', () => {
      const validJson = '{"email":"test@example.com"}';
      expect(Validator.validateConditionsString(validJson)).toBe(true);
    });

    it('should accept empty object JSON', () => {
      expect(Validator.validateConditionsString('{}')).toBe(true);
    });

    it('should accept complex JSON with operators', () => {
      const complexJson = '{"age":{"$gte":18},"books":{"$not":{"$size":0}}}';
      expect(Validator.validateConditionsString(complexJson)).toBe(true);
    });

    it('should throw error for malformed JSON', () => {
      const invalidJson = '{invalid: json}';
      expect(() => Validator.validateConditionsString(invalidJson)).toThrow('malformed conditions json');
    });

    it('should throw error for incomplete JSON', () => {
      const incompleteJson = '{"email":"test@example.com"';
      expect(() => Validator.validateConditionsString(incompleteJson)).toThrow('malformed conditions json');
    });
  });

  describe('validateDocumentExist', () => {
    it('should accept existing document', () => {
      const doc = { _id: '123', name: 'test' };
      expect(Validator.validateDocumentExist(doc)).toBe(true);
    });

    it('should accept truthy values', () => {
      expect(Validator.validateDocumentExist('string')).toBe(true);
      expect(Validator.validateDocumentExist(1)).toBe(true);
      expect(Validator.validateDocumentExist([])).toBe(true);
      expect(Validator.validateDocumentExist({})).toBe(true);
    });

    it('should throw error for null or undefined', () => {
      expect(() => Validator.validateDocumentExist(null)).toThrow('Document not found.');
      expect(() => Validator.validateDocumentExist(undefined)).toThrow('Document not found.');
    });

    it('should throw error with custom status code', () => {
      try {
        Validator.validateDocumentExist(null, 404);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('Document not found.');
        expect(error.status).toBe(404);
      }
    });

    it('should throw error for falsy values', () => {
      expect(() => Validator.validateDocumentExist(0)).toThrow('Document not found.');
      expect(() => Validator.validateDocumentExist('')).toThrow('Document not found.');
      expect(() => Validator.validateDocumentExist(false)).toThrow('Document not found.');
    });
  });

  describe('validaMethods', () => {
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE'];

    it('should accept single valid method', () => {
      expect(() => Validator.validaMethods('GET', validMethods)).not.toThrow();
      expect(() => Validator.validaMethods('POST', validMethods)).not.toThrow();
    });

    it('should accept multiple valid methods', () => {
      expect(() => Validator.validaMethods('GET POST', validMethods)).not.toThrow();
      expect(() => Validator.validaMethods('GET POST PUT DELETE', validMethods)).not.toThrow();
    });

    it('should throw error for invalid method', () => {
      expect(() => Validator.validaMethods('PATCH', validMethods)).toThrow(
        'Request method "PATCH" is not valid. Only GET, POST, PUT, DELETE are allowed.'
      );
    });

    it('should throw error when method is empty', () => {
      expect(() => Validator.validaMethods('', validMethods)).toThrow('is not valid');
    });

    it('should throw error for invalid method in list', () => {
      expect(() => Validator.validaMethods('GET PATCH POST', validMethods)).toThrow(
        'Request method "PATCH" is not valid'
      );
    });
  });

  describe('validateBody', () => {
    it('should accept POST with body', () => {
      const params = {
        method: 'POST',
        body: { name: 'test' }
      };
      expect(Validator.validateBody(params)).toBe(true);
    });

    it('should accept PUT with body', () => {
      const params = {
        method: 'PUT',
        body: { name: 'updated' }
      };
      expect(Validator.validateBody(params)).toBe(true);
    });

    it('should accept GET without body', () => {
      const params = { method: 'GET' };
      expect(Validator.validateBody(params)).toBe(true);
    });

    it('should accept DELETE without body', () => {
      const params = { method: 'DELETE' };
      expect(Validator.validateBody(params)).toBe(true);
    });

    it('should throw error for POST without body', () => {
      const params = { method: 'POST' };
      expect(() => Validator.validateBody(params)).toThrow('Body is required for method "POST"');
    });

    it('should throw error for PUT without body', () => {
      const params = { method: 'PUT' };
      expect(() => Validator.validateBody(params)).toThrow('Body is required for method "PUT"');
    });

    it('should accept empty object as body', () => {
      const params = {
        method: 'POST',
        body: {}
      };
      expect(Validator.validateBody(params)).toBe(true);
    });
  });

  describe('validateCallback', () => {
    it('should accept function callbacks', () => {
      const callback = () => {};
      expect(() => Validator.validateCallback(callback, 'testCallback')).not.toThrow();
    });

    it('should accept arrow functions', () => {
      const callback = () => console.log('test');
      expect(() => Validator.validateCallback(callback, 'arrowCallback')).not.toThrow();
    });

    it('should accept async functions', () => {
      const callback = async () => {};
      expect(() => Validator.validateCallback(callback, 'asyncCallback')).not.toThrow();
    });

    it('should throw error for non-function values', () => {
      expect(() => Validator.validateCallback('not a function', 'testCallback')).toThrow(
        'Middleware "testCallback" should be a function.'
      );
    });

    it('should throw error for null', () => {
      expect(() => Validator.validateCallback(null, 'nullCallback')).toThrow(
        'Middleware "nullCallback" should be a function.'
      );
    });

    it('should throw error for undefined', () => {
      expect(() => Validator.validateCallback(undefined, 'undefinedCallback')).toThrow(
        'Middleware "undefinedCallback" should be a function.'
      );
    });

    it('should throw error for objects', () => {
      expect(() => Validator.validateCallback({}, 'objectCallback')).toThrow(
        'should be a function'
      );
    });
  });

  describe('validateEnum', () => {
    it('should accept valid enum value', () => {
      const options = ['active', 'inactive', 'pending'];
      expect(() => Validator.validateEnum('active', options)).not.toThrow();
      expect(() => Validator.validateEnum('pending', options)).not.toThrow();
    });

    it('should accept numeric enums', () => {
      const numbers = [1, 2, 3, 4, 5];
      expect(() => Validator.validateEnum(3, numbers)).not.toThrow();
      expect(() => Validator.validateEnum(5, numbers)).not.toThrow();
    });

    it('should throw error for invalid enum value', () => {
      const options = ['active', 'inactive', 'pending'];
      expect(() => Validator.validateEnum('deleted', options)).toThrow(
        'Invalid Enum value "deleted" should be a one of "active,inactive,pending"'
      );
    });

    it('should throw error for value not in numeric enum', () => {
      const numbers = [1, 2, 3];
      expect(() => Validator.validateEnum(5, numbers)).toThrow(
        'Invalid Enum value "5" should be a one of "1,2,3"'
      );
    });

    it('should work with type inference', () => {
      type Status = 'active' | 'inactive';
      const statuses: Status[] = ['active', 'inactive'];
      const value: Status = 'active';
      
      expect(() => Validator.validateEnum(value, statuses)).not.toThrow();
    });
  });

  describe('validateDisabledMethod', () => {
    const disabledMethods = ['DELETE', 'PUT'];

    it('should not throw for enabled methods', () => {
      expect(() => Validator.validateDisabledMethod('GET', disabledMethods)).not.toThrow();
      expect(() => Validator.validateDisabledMethod('POST', disabledMethods)).not.toThrow();
    });

    it('should throw error for disabled DELETE method', () => {
      expect(() => Validator.validateDisabledMethod('DELETE', disabledMethods)).toThrow(
        'Disabled method "DELETE" for this model.'
      );
    });

    it('should throw error for disabled PUT method', () => {
      expect(() => Validator.validateDisabledMethod('PUT', disabledMethods)).toThrow(
        'Disabled method "PUT" for this model.'
      );
    });

    it('should work with empty disabled list', () => {
      expect(() => Validator.validateDisabledMethod('DELETE', [])).not.toThrow();
      expect(() => Validator.validateDisabledMethod('PUT', [])).not.toThrow();
    });

    it('should be case sensitive', () => {
      const disabledLowerCase = ['delete'];
      expect(() => Validator.validateDisabledMethod('DELETE', disabledLowerCase)).not.toThrow();
      expect(() => Validator.validateDisabledMethod('delete', disabledLowerCase)).toThrow();
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

      expect(Validator.validatePutParams(validParams)).toBe(true);
      expect(Validator.validateBody(validParams)).toBe(true);
    });

    it('should validate model and conditions together', () => {
      expect(Validator.validateModel(Users)).toBe(true);
      
      const conditions = '{"email":"test@example.com"}';
      const parsed = Validator.validateConditions(conditions);
      
      expect(parsed).toEqual({ email: 'test@example.com' });
    });

    it('should handle MongoDB operators in various formats', () => {
      // String format
      const stringConditions = '{"books":{"$not":{"$size":0}}}';
      const parsed = Validator.validateConditions(stringConditions);
      expect(parsed).toHaveProperty('books');

      // Object format
      const objectConditions = {
        age: { $gte: 18, $lte: 65 },
        status: { $in: ['active', 'pending'] }
      };
      const result = Validator.validateConditions(objectConditions);
      expect(result).toEqual(objectConditions);
    });
  });
});
