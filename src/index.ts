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
  ControllerConfig,
  ProcessParams,
  RequestParams,
  ExtendedQueryParams
} from './controller';

export type {
  UpdateSet,
  UpdateOperators,
} from './model';

export type {
  HirokiQuery,
  HirokiFilter,
  HirokiSort,
  FilterOperator,
} from './query';

export type {
  HirokiAdapter,
  UpdateConfig
} from './adapter';

export { adapterRegistry, AdapterRegistry } from './adapter';

export type {
  MongooseDocument,
  PopulateOptions
} from './mongoose-adapter';

export { MongooseAdapter } from './mongoose-adapter';

export type {
  ValidModel,
  ValidationParams
} from './validator';

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
