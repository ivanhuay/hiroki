import Hiroki from './hiroki';

const hiroki = new Hiroki();

export default hiroki;

export type {
  HirokiConfig,
  ImportModelOptions,
  ProcessRequest,
  ProcessResponse
} from './hiroki';

export type {
  HttpMethod,
  ProcessParams,
  RequestParams,
  ExtendedQueryParams,
  ParsedQuery,
} from './types';

export type { ControllerConfig } from './controller';

export type {
  UpdateSet,
  UpdateOperators,
} from './model';

export type {
  HirokiQuery,
  HirokiFilter,
  HirokiSort,
  FilterOperator,
  QueryLimits,
} from './query';

export type {
  HirokiAdapter,
  UpdateConfig
} from './adapter';

export type {
  ControllerHooks,
  HirokiMiddleware,
  MiddlewareContext,
  HookContext,
  BeforeCreateHook,
  AfterCreateHook,
  BeforeUpdateHook,
  AfterUpdateHook,
  BeforeDeleteHook,
  AfterDeleteHook,
} from './hooks';

export { adapterRegistry, AdapterRegistry } from './adapter';

export type {
  MongooseDocument,
  PopulateOptions
} from './mongoose-adapter';

export { MongooseAdapter } from './mongoose-adapter';
export { MemoryAdapter } from './memory-adapter';

export type {
  ValidModel,
  ValidationParams,
  ValidConditions,
} from './validator';

export type { HirokiLogger, LogLevel, LoggerConfig } from './logger';

export type { HttpErrorResponse } from './errors';

export {
  HttpError,
  BadRequestError,
  NotFoundError,
  MethodNotAllowedError,
  InternalServerError,
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
  hasStatus
} from './errors';

export { Hiroki };
