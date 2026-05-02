import { Model } from 'mongoose';
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
} from './errors.js';

export type ValidModel = string | Model<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export type ValidConditions = string | Record<string, unknown> | undefined | null;

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
  // Use duck typing instead of instanceof to avoid cross-realm failures
  // (e.g. npm link or multiple mongoose copies resolving to different classes).
  const v = value as unknown as Record<string, unknown>;
  return typeof value === 'function' &&
    typeof v.modelName === 'string' &&
    typeof v.find === 'function' &&
    typeof v.schema === 'object';
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

export function validateConditions(conditions: ValidConditions): Record<string, unknown> | undefined {
  if (!conditions || typeof conditions === 'object') {
    return conditions as Record<string, unknown> | undefined;
  }

  if (typeof conditions === 'string') {
    try {
      return JSON.parse(conditions) as Record<string, unknown>;
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
