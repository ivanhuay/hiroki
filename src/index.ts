import Hiroki from './hiroki';

// Create singleton instance
const hiroki = new Hiroki();

// Export singleton as default
export default hiroki;

// Export types for TypeScript users
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
  ParsedOptions,
  PopulateOptions
} from './model.js';

export type {
  CustomError
} from './error-collection.js';

export type {
  ValidModel,
  ValidationParams
} from './validator.js';

// Export Hiroki class for advanced users who want to create their own instances
export { Hiroki };
