import MongooseConnector from './mongoose-connector';
import pluralize from 'pluralize';
import Validator from './validator';
import ErrorCollection from './error-collection';
import type { QueryParams } from './model';

// HTTP Methods enum
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// Controller configuration
export interface ControllerConfig {
  fastUpdate?: 'enabled' | 'disabled' | 'optional';
  disabledPluralize?: boolean;
  basePath?: string;
  disabledMethod?: string[];
}

// Process request parameters
export interface ProcessParams {
  method: HttpMethod;
  body?: any;
}

// Internal request parameters
export interface RequestParams {
  id?: string;
  body?: any;
  query?: ExtendedQueryParams;
}

// Extended query parameters with id and conditions
export interface ExtendedQueryParams extends QueryParams {
  id?: string;
  count?: boolean;
  distinct?: string;
  fast?: boolean;
}

// Parsed query object
export interface ParsedQuery {
  query: ExtendedQueryParams;
}

class Controller {
  protected model: MongooseConnector;
  protected config: Required<Omit<ControllerConfig, 'disabledMethod'>> & Pick<ControllerConfig, 'disabledMethod'>;
  public routeName: string;
  public path: string;
  private _disabledMethods: string[];

  constructor(model: any, config: ControllerConfig = {}) {
    this.model = new MongooseConnector(model);
    this.config = {
      fastUpdate: 'disabled',
      disabledPluralize: true,
      basePath: '',
      ...config
    };
    
    Validator.validateEnum(this.config.fastUpdate, ['enabled', 'disabled', 'optional']);
    
    this.routeName = pluralize(this.model.modelName).toLocaleLowerCase();
    
    if (this.config.disabledPluralize === false) {
      this.routeName = this.model.modelName;
    }
    
    this.path = `${this.config.basePath}/${this.routeName}`;
    this._disabledMethods = this.config.disabledMethod || [];
  }

  protected queryGet(query: ExtendedQueryParams): Promise<any> {
    if (query.count) {
      return this.model.count(query);
    }
    if (query.distinct) {
      return this.model.distinct(query.distinct);
    }
    return this.model.find(query);
  }

  get(params: ExtendedQueryParams): Promise<any> {
    Validator.validateDisabledMethod('get', this._disabledMethods);
    if (params.id) {
      return this.model.findById(params.id, params);
    }
    
    return this.queryGet(params);
  }

  post(params: RequestParams): Promise<any> {
    Validator.validateDisabledMethod('post', this._disabledMethods);
    const body = params.body;
    return this.model.create(body);
  }

  put(params: RequestParams): Promise<any> {
    Validator.validateDisabledMethod('put', this._disabledMethods);
    Validator.validatePutParams(params);
    
    const fast = 
      this.config.fastUpdate === 'enabled' ||
      (this.config.fastUpdate === 'optional' && params.query?.fast);
    
    if (params.query?.id) {
      return this.model.updateById(params.query.id, params.body, { fast });
    }
    
    return this.model.updateByConditions(params.query?.conditions, params.body, { fast });
  }

  delete(params: RequestParams): Promise<any> {
    Validator.validateDisabledMethod('delete', this._disabledMethods);
    Validator.validateIdRequired(params);
    return this.model.delete(params.id!);
  }

  check(path: string): boolean {
    return path.includes(this.path);
  }

  protected _getQueryParams(path: string): ParsedQuery {
    const url = new URL(`http://localhost${path}`);
    const searchParams = url.searchParams;
    const queryParams: any = {};
    
    for (const [key, value] of searchParams.entries()) {
      queryParams[key] = value;
      if (queryParams[key] === 'true' || queryParams[key] === 'false') {
        queryParams[key] = queryParams[key] === 'true';
      }
    }
    
    const pathRegex = new RegExp(`^${this.path}/([\\w\\d]+)`);
    const matchId = path.match(pathRegex);
    
    if (matchId) {
      const id = matchId[1];
      queryParams.id = id;
    }
    
    if (path.match(/conditions\[(\w+)\]/ig)) {
      const conditions: Record<string, any> = {};
      
      for (let [key, value] of Object.entries(queryParams)) {
        const match = String(key).match(/^conditions\[(\w+)\]$/);
        if (match) {
          const field = match[1];
          conditions[field] = value;
        }
      }
      
      queryParams.conditions = conditions;
    }
    
    return { query: queryParams };
  }

  process(path: string, params: ProcessParams): Promise<any> {
    const query = this._getQueryParams(path);
    const { method, body } = params;
    if (this._disabledMethods.includes(method)) {
      ErrorCollection.disabledMethod(method);
    }
    
    Validator.validateBody({ body, method });
    
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
    
    ErrorCollection.unexpectedError();
  }
}

export default Controller;
