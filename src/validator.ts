import mongoose, { Model, FilterQuery } from 'mongoose';
import {
  InvalidModelError,
  InvalidConditionsError,
  ParamRequiredError,
  DocumentNotFoundError,
  BodyRequiredError,
  InvalidMethodError,
  InvalidMiddlewareError,
  InvalidEnumError,
  DisabledMethodError
} from './errors';

/**
 * Valid model types - can be either:
 * - A string representing the model name (used to retrieve from mongoose registry)
 * - A Mongoose Model instance
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ValidModel = string | Model<any>;

/**
 * MongoDB query conditions - supports all MongoDB query operators
 * Can be:
 * - A string containing JSON-formatted conditions
 * - An object with MongoDB operators ($eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $not, $size, etc.)
 * - undefined/null for no conditions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ValidConditions = string | FilterQuery<any> | undefined | null;

/**
 * Parameters interface for validation methods
 */
export interface ValidationParams {
  query?: {
    id?: string;
    conditions?: ValidConditions;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: Record<string, any>;
  method?: string;
  id?: string;
}

class Validator {
  
  /**
   * Type guard to check if a value is a Mongoose Model
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isMongooseModel(value: unknown): value is Model<any> {
    return typeof value === 'function' &&
      value.prototype instanceof mongoose.Model;
  } 
  
  /**
   * Validates if the provided model is valid (string or Mongoose model)
   * @param model - The model to validate
   * @returns true if valid, throws error otherwise
   */
  static validateModel(model: unknown): model is ValidModel {
    if (!model) {
      throw new InvalidModelError(model);
    }
    
    const modelType = typeof model;
    
    // Accept string (model name to be retrieved from mongoose registry)
    if (modelType === 'string') {
      return true;
    }
    
    // Accept Mongoose Model instance
    if (this.isMongooseModel(model)) {
      return true;
    }
    
    throw new InvalidModelError(model);
  }

  /**
   * Validates and parses conditions
   * @param conditions - Conditions to validate (can be string, object, or undefined)
   * @returns Parsed conditions object or original if already valid
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static validateConditions(conditions: ValidConditions): FilterQuery<any> | undefined {
    // If no conditions or already an object, return as is
    if (!conditions || typeof conditions === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return conditions as FilterQuery<any> | undefined;
    }
    
    // If string, try to parse as JSON
    if (typeof conditions === 'string') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return JSON.parse(conditions) as FilterQuery<any>;
      } catch (error) {
        throw new InvalidConditionsError(conditions, error as Error);
      }
    }
    
    throw new InvalidConditionsError('Invalid conditions format');
  }

  static validatePutParams(params: ValidationParams): boolean {
    const { query } = params;
    if (!query?.hasOwnProperty('id') && !query?.hasOwnProperty('conditions')) {
      throw new ParamRequiredError('id or conditions');
    }
    return true;
  }

  static validateIdRequired(params: ValidationParams): boolean {
    if (!params.id) {
      throw new ParamRequiredError('id', 404);
    }
    return true;
  }

  static validateConditionsString(conditions: string): boolean {
    try {
      JSON.parse(conditions);
    } catch (error) {
      throw new InvalidConditionsError(conditions, error as Error);
    }
    return true;
  }

  static validateDocumentExist(doc: unknown, status?: number): boolean {
    if (!doc) {
      throw new DocumentNotFoundError(status);
    }
    return true;
  }

  static validaMethods(methods: string, validMethods: string[]): void {
    if (!methods) {
      throw new InvalidMethodError(methods, validMethods.join(', '));
    }
    const invalidMethod = methods.split(' ').find((method) => validMethods.indexOf(method) === -1);
    if (invalidMethod) {
      throw new InvalidMethodError(invalidMethod, validMethods.join(', '));
    }
  }

  static validateBody(params: ValidationParams): boolean {
    const { body, method } = params;
    if (method && ['POST', 'PUT'].includes(method) && !body) {
      throw new BodyRequiredError(method);
    }
    return true;
  }

  static validateCallback(callback: unknown, callbackName: string): void {
    if (typeof callback !== 'function') {
      throw new InvalidMiddlewareError(callbackName);
    }
  }

  static validateEnum<T>(value: T, expected: T[]): void {
    if (!expected.includes(value)) {
      throw new InvalidEnumError(value, expected);
    }
  }

  static validateDisabledMethod(method: string, disabledMethods: string[]): void {
    if (disabledMethods.indexOf(method) !== -1) {
      throw new DisabledMethodError(method);
    }
  }
}

export default Validator;
