import MongooseConnector from './mongoose-connector';
import pluralize from 'pluralize';
import { validateEnum, validateDisabledMethod, validatePutParams, validateIdRequired, validateBody } from './validator';
import type { ValidModel } from './validator';
import { DisabledMethodError, UnexpectedError } from './errors';
import type { QueryParams } from './model';
import { HirokiLogger, ConsoleLogger, LogLevel } from './logger';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ControllerConfig {
  fastUpdate?: 'enabled' | 'disabled' | 'optional';
  disabledPluralize?: boolean;
  basePath?: string;
  disabledMethod?: string[];
  logger?: HirokiLogger;
  logLevel?: LogLevel;
}

export interface ProcessParams {
  method: HttpMethod;
  body?: Record<string, unknown>;
}

export interface RequestParams {
  id?: string;
  body?: Record<string, unknown>;
  query?: ExtendedQueryParams;
}

export interface ExtendedQueryParams extends QueryParams {
  id?: string;
  count?: boolean;
  distinct?: string;
  fast?: boolean;
}

export interface ParsedQuery {
  query: ExtendedQueryParams;
}

type ResolvedControllerConfig =
  Required<Omit<ControllerConfig, 'disabledMethod' | 'logger' | 'logLevel'>> &
  Pick<ControllerConfig, 'disabledMethod' | 'logger' | 'logLevel'>;

class Controller {
  protected model: MongooseConnector;
  protected config: ResolvedControllerConfig;
  public routeName: string;
  public path: string;
  private _disabledMethods: string[];
  private logger: HirokiLogger;

  constructor(model: ValidModel, config: ControllerConfig = {}) {
    this.model = new MongooseConnector(model);
    this.config = {
      fastUpdate: 'disabled',
      disabledPluralize: true,
      basePath: '',
      ...config
    };
    this.logger = this.config.logger ?? new ConsoleLogger({ logLevel: this.config.logLevel || 'error' });
    validateEnum(this.config.fastUpdate, ['enabled', 'disabled', 'optional']);

    this.routeName = pluralize(this.model.modelName).toLocaleLowerCase();

    if (this.config.disabledPluralize === false) {
      this.routeName = this.model.modelName;
    }

    this.path = `${this.config.basePath}/${this.routeName}`;
    this._disabledMethods = this.config.disabledMethod || [];
  }

  protected queryGet(query: ExtendedQueryParams): Promise<unknown> {
    if (query.count) {
      return this.model.count(query);
    }
    if (query.distinct) {
      return this.model.distinct(query.distinct);
    }
    return this.model.find(query);
  }

  get(params: ExtendedQueryParams): Promise<unknown> {
    validateDisabledMethod('get', this._disabledMethods);
    if (params.id) {
      return this.model.findById(params.id, params);
    }

    return this.queryGet(params);
  }

  post(params: RequestParams): Promise<unknown> {
    validateDisabledMethod('post', this._disabledMethods);
    return this.model.create(params.body!);
  }

  put(params: RequestParams): Promise<unknown> {
    validateDisabledMethod('put', this._disabledMethods);
    validatePutParams(params);

    const fast =
      this.config.fastUpdate === 'enabled' ||
      (this.config.fastUpdate === 'optional' && params.query?.fast);

    if (params.query?.id) {
      return this.model.updateById(params.query.id, params.body!, { fast });
    }

    return this.model.updateByConditions(params.query?.conditions, params.body!, { fast });
  }

  delete(params: RequestParams): Promise<unknown> {
    validateDisabledMethod('delete', this._disabledMethods);
    validateIdRequired(params);
    return this.model.delete(params.id!);
  }

  check(path: string): boolean {
    return path.includes(this.path);
  }

  protected _getQueryParams(path: string): ParsedQuery {
    const url = new URL(`http://localhost${path}`);
    const searchParams = url.searchParams;
    const queryParams: Record<string, unknown> = {};

    for (const [key, value] of searchParams.entries()) {
      queryParams[key] = value;
      if (queryParams[key] === 'true' || queryParams[key] === 'false') {
        queryParams[key] = queryParams[key] === 'true';
      }
    }

    const pathRegex = new RegExp(`^${this.path}/([\\w\\d]+)`);
    const matchId = path.match(pathRegex);

    if (matchId) {
      queryParams.id = matchId[1];
    }

    if (path.match(/conditions\[(\w+)\]/ig)) {
      const conditions: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(queryParams)) {
        const match = String(key).match(/^conditions\[(\w+)\]$/);
        if (match) {
          conditions[match[1]] = value;
        }
      }

      queryParams.conditions = conditions;
    }

    return { query: queryParams as ExtendedQueryParams };
  }

  process(path: string, params: ProcessParams): Promise<unknown> {
    const query = this._getQueryParams(path);
    const { method, body } = params;
    this.logger.debug(`Processing request: ${method} ${path} with body: ${JSON.stringify(body)} and query: ${JSON.stringify(query.query)}`);

    if (this._disabledMethods.includes(method)) {
      throw new DisabledMethodError(method);
    }

    validateBody({ body, method });

    if (method === 'GET') {
      return this.get(query.query);
    }
    if (method === 'POST') {
      return this.post({ body });
    }
    if (method === 'PUT') {
      return this.put({ body, ...query });
    }
    if (method === 'DELETE') {
      return this.delete({ id: query.query.id });
    }

    throw new UnexpectedError();
  }
}

export default Controller;
