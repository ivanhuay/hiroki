import { MongooseAdapter } from './mongoose-adapter';
import type { HirokiAdapter } from './adapter';
import pluralize from 'pluralize';
import { validateEnum, validateDisabledMethod, validatePutParams, validateIdRequired, validateBody } from './validator';
import type { ValidModel } from './validator';
import { DisabledMethodError, UnexpectedError } from './errors';
import { parseHirokiQuery } from './query';
import type { HirokiQuery } from './query';
import { HirokiLogger, ConsoleLogger, LogLevel } from './logger';
import type { ControllerHooks, HirokiMiddleware, MiddlewareContext } from './hooks';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ControllerConfig {
  fastUpdate?: 'enabled' | 'disabled' | 'optional';
  disabledPluralize?: boolean;
  basePath?: string;
  disabledMethod?: string[];
  logger?: HirokiLogger;
  logLevel?: LogLevel;
  hooks?: ControllerHooks;
  middleware?: HirokiMiddleware[];
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

export interface ExtendedQueryParams extends HirokiQuery {
  id?: string;
  count?: boolean;
  distinct?: string;
  fast?: boolean;
}

export interface ParsedQuery {
  query: ExtendedQueryParams;
}

type ResolvedControllerConfig =
  Required<Omit<ControllerConfig, 'disabledMethod' | 'logger' | 'logLevel' | 'hooks' | 'middleware'>> &
  Pick<ControllerConfig, 'disabledMethod' | 'logger' | 'logLevel' | 'hooks' | 'middleware'>;

class Controller {
  protected model: HirokiAdapter;
  protected config: ResolvedControllerConfig;
  public routeName: string;
  public path: string;
  private _disabledMethods: string[];
  private logger: HirokiLogger;

  constructor(model: ValidModel, config: ControllerConfig = {}) {
    this.model = new MongooseAdapter(model);
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

  async post(params: RequestParams): Promise<unknown> {
    validateDisabledMethod('post', this._disabledMethods);
    const hooks = this.config.hooks;
    const ctx = { modelName: this.model.modelName };

    let body = params.body!;
    if (hooks?.beforeCreate) body = await hooks.beforeCreate(body, ctx);

    const doc = await this.model.create(body);

    if (hooks?.afterCreate) await hooks.afterCreate(doc, ctx);

    return doc;
  }

  async put(params: RequestParams): Promise<unknown> {
    validateDisabledMethod('put', this._disabledMethods);
    validatePutParams(params);
    const hooks = this.config.hooks;
    const ctx = { modelName: this.model.modelName };

    const fast =
      this.config.fastUpdate === 'enabled' ||
      (this.config.fastUpdate === 'optional' && params.query?.fast);

    let body = params.body!;
    if (hooks?.beforeUpdate) body = await hooks.beforeUpdate(body, ctx);

    let doc: unknown;
    if (params.query?.id) {
      doc = await this.model.updateById(params.query.id, body, { fast });
    } else {
      doc = await this.model.updateByConditions(params.query?.conditions, body, { fast });
    }

    if (hooks?.afterUpdate) await hooks.afterUpdate(doc, ctx);

    return doc;
  }

  async delete(params: RequestParams): Promise<unknown> {
    validateDisabledMethod('delete', this._disabledMethods);
    validateIdRequired(params);
    const hooks = this.config.hooks;
    const ctx = { modelName: this.model.modelName };

    if (hooks?.beforeDelete) await hooks.beforeDelete(params.id!, ctx);

    const doc = await this.model.delete(params.id!);

    if (hooks?.afterDelete) await hooks.afterDelete(doc, ctx);

    return doc;
  }

  check(path: string): boolean {
    return path.includes(this.path);
  }

  protected _getQueryParams(path: string): ParsedQuery {
    const url = new URL(`http://localhost${path}`);
    const searchParams = url.searchParams;

    const hirokiQuery = parseHirokiQuery(searchParams);
    const extended: ExtendedQueryParams = { ...hirokiQuery };

    const count = searchParams.get('count');
    if (count !== null) extended.count = count === 'true';

    const fast = searchParams.get('fast');
    if (fast !== null) extended.fast = fast === 'true';

    const distinct = searchParams.get('distinct');
    if (distinct !== null) extended.distinct = distinct;

    const pathRegex = new RegExp(`^${this.path}/([\\w\\d]+)`);
    const matchId = path.match(pathRegex);
    if (matchId) extended.id = matchId[1];

    return { query: extended };
  }

  process(path: string, params: ProcessParams): Promise<unknown> {
    const parsedQuery = this._getQueryParams(path);
    const { method, body } = params;
    this.logger.debug(`Processing request: ${method} ${path} with body: ${JSON.stringify(body)} and query: ${JSON.stringify(parsedQuery.query)}`);

    if (this._disabledMethods.includes(method)) {
      throw new DisabledMethodError(method);
    }

    validateBody({ body, method });

    const middleware = this.config.middleware ?? [];
    const ctx: MiddlewareContext = { path, method, body, query: parsedQuery.query };

    const dispatch = (): Promise<unknown> => {
      if (method === 'GET') return this.get(parsedQuery.query);
      if (method === 'POST') return this.post({ body });
      if (method === 'PUT') return this.put({ body, ...parsedQuery });
      if (method === 'DELETE') return this.delete({ id: parsedQuery.query.id });
      throw new UnexpectedError();
    };

    if (!middleware.length) return dispatch();

    const chain = middleware.reduceRight<() => Promise<unknown>>(
      (next, mw) => () => mw(ctx, next),
      dispatch
    );

    return chain();
  }
}

export default Controller;
