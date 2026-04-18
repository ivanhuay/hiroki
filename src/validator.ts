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

export type ValidModel = string | Model<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export type ValidConditions = string | FilterQuery<any> | undefined | null; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface ValidationParams {
  query?: {
    id?: string;
    conditions?: ValidConditions;
  };
  body?: Record<string, unknown>;
  method?: string;
  id?: string;
}

export function isMongooseModel(value: unknown): value is Model<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  return typeof value === 'function' &&
    value.prototype instanceof mongoose.Model;
}

export function validateModel(model: unknown): asserts model is ValidModel {
  if (!model) {
    throw new InvalidModelError(model);
  }

  if (typeof model === 'string') {
    return;
  }

  if (isMongooseModel(model)) {
    return;
  }

  throw new InvalidModelError(model);
}

export function validateConditions(conditions: ValidConditions): FilterQuery<any> | undefined { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!conditions || typeof conditions === 'object') {
    return conditions as FilterQuery<any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  if (typeof conditions === 'string') {
    try {
      return JSON.parse(conditions) as FilterQuery<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    } catch (error) {
      throw new InvalidConditionsError(conditions, error as Error);
    }
  }

  throw new InvalidConditionsError('Invalid conditions format');
}

export function validatePutParams(params: ValidationParams): void {
  const { query } = params;
  if (!query?.hasOwnProperty('id') && !query?.hasOwnProperty('conditions')) {
    throw new ParamRequiredError('id or conditions');
  }
}

export function validateIdRequired(params: ValidationParams): void {
  if (!params.id) {
    throw new ParamRequiredError('id', 404);
  }
}

export function validateDocumentExist<T>(doc: T | null | undefined, status?: number): asserts doc is NonNullable<T> {
  if (!doc) {
    throw new DocumentNotFoundError(status);
  }
}

export function validateBody(params: ValidationParams): void {
  const { body, method } = params;
  if (method && ['POST', 'PUT'].includes(method) && !body) {
    throw new BodyRequiredError(method);
  }
}

export function validateCallback(callback: unknown, callbackName: string): void {
  if (typeof callback !== 'function') {
    throw new InvalidMiddlewareError(callbackName);
  }
}

export function validateEnum<T>(value: T, expected: T[]): void {
  if (!expected.includes(value)) {
    throw new InvalidEnumError(value, expected);
  }
}

export function validateDisabledMethod(method: string, disabledMethods: string[]): void {
  if (disabledMethods.indexOf(method) !== -1) {
    throw new DisabledMethodError(method);
  }
}
