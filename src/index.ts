import Hiroki from './hiroki';

const hiroki = new Hiroki();

export default hiroki;

export type {
  HirokiConfig,
  ImportModelOptions,
  ProcessRequest,
  ProcessResponse
} from './hiroki.js';

export type {
  HttpMethod,
  ControllerConfig,
  ProcessParams,
  RequestParams,
  ExtendedQueryParams
} from './controller.js';

export type {
  QueryParams,
  UpdateSet,
  UpdateOperators,
  ParsedOptions
} from './model.js';

export type {
  HirokiAdapter,
  UpdateConfig
} from './adapter.js';

export { adapterRegistry, AdapterRegistry } from './adapter';

export type {
  MongooseDocument,
  PopulateOptions
} from './mongoose-adapter.js';

export { MongooseAdapter } from './mongoose-adapter';

export type {
  ValidModel,
  ValidationParams
} from './validator.js';

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
