import ErrorCollection from './error-collection';
import mongoose, { Model } from 'mongoose';

const validModelTypes = ['function', 'object'];

// Type for Mongoose model or model name
export type ValidModel = string | { modelName: string };

// Parameters interface for validation methods
export interface ValidationParams {
  query?: {
    id?: string;
    conditions?: any;
  };
  body?: any;
  method?: string;
  id?: string;
}

class Validator {
  
  static isMongooseModel(value: unknown): value is Model<any> {
    return typeof value === 'function' &&
      value.prototype instanceof mongoose.Model;
  } 
  // Validate if the provided model is valid (string or Mongoose model)
  static validateModel(model: unknown): boolean {
    if (!model) {
      ErrorCollection.invalidModel(model);
    }
    const modelType = typeof model;
    if (modelType === 'string') {
      return true;
    }
    if (this.isMongooseModel(model)) {
      return true;
    }
    ErrorCollection.invalidModel(model);
  }

  static validateConditions(conditions: any): any {
    if (!conditions || typeof conditions === 'object') {
      return true;
    }
    try {
      return JSON.parse(conditions);
    } catch (error) {
      ErrorCollection.invalidConditions((error as Error).message);
    }
  }

  static validatePutParams(params: ValidationParams): boolean {
    const { query } = params;
    if (!query?.hasOwnProperty('id') && !query?.hasOwnProperty('conditions')) {
      ErrorCollection.paramRequired('id or conditions');
    }
    return true;
  }

  static validateIdRequired(params: ValidationParams): boolean {
    if (!params.id) {
      ErrorCollection.paramRequired('id', 404);
    }
    return true;
  }

  static validateConditionsString(conditions: string): boolean {
    try {
      JSON.parse(conditions);
    } catch (error) {
      ErrorCollection.malformedConditions(conditions, error as Error);
    }
    return true;
  }

  static validateDocumentExist(doc: any, status?: number): boolean {
    if (!doc) {
      ErrorCollection.documentNotFound(status);
    }
    return true;
  }

  static validaMethods(methods: string, validMethods: string[]): void {
    if (!methods) {
      ErrorCollection.invalidMethod(methods, validMethods.join(', '));
    }
    const invalidMethod = methods.split(' ').find((method) => validMethods.indexOf(method) === -1);
    if (invalidMethod) {
      ErrorCollection.invalidMethod(invalidMethod, validMethods.join(', '));
    }
  }

  static validateBody(params: ValidationParams): boolean {
    const { body, method } = params;
    if (method && ['POST', 'PUT'].includes(method) && !body) {
      ErrorCollection.bodyRequired(method);
    }
    return true;
  }

  static validateCallback(callback: any, callbackName: string): void {
    if (typeof callback !== 'function') {
      ErrorCollection.invalidMiddleware(callbackName);
    }
  }

  static validateEnum(value: any, expected: any[]): void {
    if (!expected.includes(value)) {
      ErrorCollection.invalidEnum(value, expected);
    }
  }

  static validateDisabledMethod(method: string, disabledMethods: string[]): void {
    if (disabledMethods.indexOf(method) !== -1) {
      ErrorCollection.disabledMethod(method);
    }
  }
}

export default Validator;
