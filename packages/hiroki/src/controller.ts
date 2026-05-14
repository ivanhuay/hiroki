import { MongooseAdapter } from './mongoose-adapter.js';
import type { HirokiAdapter } from './adapter.js';
import { adapterRegistry } from './adapter.js';
import pluralize from 'pluralize';
import { validateEnum, validateDisabledMethod, validatePutParams, validateIdRequired, validateBody } from './validator.js';
import type { ValidModel } from './validator.js';
import { DisabledMethodError, UnexpectedError } from './errors.js';
import { parseHirokiQuery } from './query.js';
import type { QueryLimits } from './query.js';
import { HirokiLogger, ConsoleLogger, LogLevel } from './logger.js';
import type { ControllerHooks, HirokiMiddleware, MiddlewareContext } from './hooks.js';
import type { HttpMethod, ProcessParams, RequestParams, ExtendedQueryParams, ParsedQuery } from './types.js';
import { fieldRestrictionsRegistry } from './field-restrictions.js';

export type { HttpMethod, ProcessParams, RequestParams, ExtendedQueryParams, ParsedQuery };

export interface ControllerConfig {
  /**
   * Controls whether updates skip the find-then-save round-trip.
   * - `'disabled'` (default): always fetch document before saving (runs Mongoose pre-save hooks).
   * - `'enabled'`: always use `updateOne` (faster, no pre-save hooks).
   * - `'optional'`: use `updateOne` only when `?fast=true` is in the query string.
   */
  fastUpdate?: 'enabled' | 'disabled' | 'optional';
  /** When `true`, disables pluralization (e.g. `User` → `/user`). Default: `false` (route is pluralized). */
  disabledPluralize?: boolean;
  /** URL prefix prepended to the resource route. Default: `''`. */
  basePath?: string;
  /** HTTP methods to block. Accepts uppercase (`'DELETE'`) or lowercase (`'delete'`). */
  disabledMethod?: string[];
  /** Custom logger. Overrides `logLevel`. */
  logger?: HirokiLogger;
  /** Minimum log level when using the default `ConsoleLogger`. Default: `'error'`. */
  logLevel?: LogLevel;
  /** Lifecycle hooks called before/after each mutating operation. */
  hooks?: ControllerHooks;
  /** Per-resource middleware chain. Each function receives `(ctx, next)` — framework-agnostic. */
  middleware?: HirokiMiddleware[];
  /** Inject a custom adapter. When set, skips Mongoose validation and the adapter registry. */
  adapter?: HirokiAdapter;
  /**
   * Whitelist of body field names allowed in `create` and `update` operations.
   * Fields not in the list are stripped before hooks run.
   * When omitted, all fields are passed through.
   *
   * @example
   * { allowedFields: ['name', 'email'] } // strips 'role', 'isAdmin', etc.
   */
  allowedFields?: string[];
  /**
   * Blacklist of field names to exclude from all GET responses, including when
   * this model is populated as a sub-document from another model.
   * Takes precedence over `?select=` query params that attempt to request a disabled field.
   *
   * @example
   * { disabledFields: ['password', 'ssn'] } // never returned in any GET
   */
  disabledFields?: string[];
  /**
   * Override default query safety limits.
   * Requests that exceed a limit are rejected with HTTP 400.
   *
   * Defaults: `{ maxFilters: 20, maxInValues: 100, maxRegexLength: 200 }`
   */
  queryLimits?: QueryLimits;
}

type ResolvedControllerConfig = {
  fastUpdate: 'enabled' | 'disabled' | 'optional';
  disabledPluralize: boolean;
  basePath: string;
  disabledMethod?: string[];
  logger?: HirokiLogger;
  logLevel?: LogLevel;
  hooks?: ControllerHooks;
  middleware?: HirokiMiddleware[];
  adapter?: HirokiAdapter;
  allowedFields?: string[];
  disabledFields?: string[];
  queryLimits?: QueryLimits;
};

class Controller {
  protected model: HirokiAdapter;
  protected config: ResolvedControllerConfig;
  public routeName: string;
  public path: string;
  private disabledMethods: string[];
  private logger: HirokiLogger;

  constructor(model: ValidModel, config: ControllerConfig = {}) {
    this.config = {
      fastUpdate: 'disabled',
      disabledPluralize: false,
      basePath: '',
      ...config
    };
    this.logger = this.config.logger ?? new ConsoleLogger({ logLevel: this.config.logLevel || 'error' });
    this.model = config.adapter
      ?? adapterRegistry.resolve(model)
      ?? new MongooseAdapter(model, this.logger);
    // Propagate logger to injected or registry-resolved adapters
    this.model.setLogger?.(this.logger);
    validateEnum(this.config.fastUpdate, ['enabled', 'disabled', 'optional']);

    const baseName = this.model.modelName.toLocaleLowerCase();
    this.routeName = this.config.disabledPluralize ? baseName : pluralize(baseName);

    this.path = `${this.config.basePath}/${this.routeName}`;
    this.disabledMethods = this.config.disabledMethod || [];

    if (this.config.disabledFields?.length) {
      fieldRestrictionsRegistry.register(this.model.modelName, this.config.disabledFields);
    }
  }

  private filterBody(body: Record<string, unknown>): Record<string, unknown> {
    const allowed = this.config.allowedFields;
    if (!allowed) return body;
    return Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  }

  private filterDisabledFields(result: unknown): unknown {
    const disabled = this.config.disabledFields;
    if (!disabled?.length) return result;

    const strip = (obj: unknown): unknown => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return (obj as unknown[]).map(strip);
      const plain: Record<string, unknown> =
        typeof (obj as Record<string, unknown>).toJSON === 'function'
          ? (obj as { toJSON(): Record<string, unknown> }).toJSON()
          : { ...(obj as Record<string, unknown>) };
      disabled.forEach((f) => delete plain[f]);
      return plain;
    };

    return strip(result);
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

  async get(params: ExtendedQueryParams): Promise<unknown> {
    validateDisabledMethod('get', this.disabledMethods);
    if (params.id) {
      this.logger.debug(`[${this.model.modelName}] GET id=${params.id}`);
      const result = await this.model.findById(params.id, params);
      return this.filterDisabledFields(result);
    }

    this.logger.debug(`[${this.model.modelName}] GET query=${JSON.stringify(params)}`);
    const result = await this.queryGet(params);
    return this.filterDisabledFields(result);
  }

  async post(params: RequestParams): Promise<unknown> {
    validateDisabledMethod('post', this.disabledMethods);
    const hooks = this.config.hooks;
    const ctx = { modelName: this.model.modelName };

    let body = this.filterBody(params.body!);
    this.logger.debug(`[${this.model.modelName}] POST keys=${Object.keys(body).join(',')}`);
    if (hooks?.beforeCreate) body = await hooks.beforeCreate(body, ctx);

    const doc = await this.model.create(body);
    this.logger.info(`[${this.model.modelName}] created`);

    if (hooks?.afterCreate) await hooks.afterCreate(doc, ctx);

    return doc;
  }

  async put(params: RequestParams): Promise<unknown> {
    validateDisabledMethod('put', this.disabledMethods);
    validatePutParams(params);
    const hooks = this.config.hooks;
    const ctx = { modelName: this.model.modelName };
    this.logger.debug(`[${this.model.modelName}] PUT id=${params.query?.id ?? 'by-conditions'}`);

    const fast =
      this.config.fastUpdate === 'enabled' ||
      (this.config.fastUpdate === 'optional' && params.query?.fast);

    let body = this.filterBody(params.body!);
    if (hooks?.beforeUpdate) body = await hooks.beforeUpdate(body, ctx);

    let doc: unknown;
    if (params.query?.id) {
      doc = await this.model.updateById(params.query.id, body, { fast });
    } else {
      doc = await this.model.updateByConditions(params.query?.conditions, body, { fast });
    }
    this.logger.info(`[${this.model.modelName}] updated`);

    if (hooks?.afterUpdate) await hooks.afterUpdate(doc, ctx);

    return doc;
  }

  async delete(params: RequestParams): Promise<unknown> {
    validateDisabledMethod('delete', this.disabledMethods);
    validateIdRequired(params);
    const hooks = this.config.hooks;
    const ctx = { modelName: this.model.modelName };
    this.logger.debug(`[${this.model.modelName}] DELETE id=${params.id}`);

    if (hooks?.beforeDelete) await hooks.beforeDelete(params.id!, ctx);

    const doc = await this.model.delete(params.id!);
    this.logger.info(`[${this.model.modelName}] deleted id=${params.id}`);

    if (hooks?.afterDelete) await hooks.afterDelete(doc, ctx);

    return doc;
  }

  check(path: string): boolean {
    return path.includes(this.path);
  }

  protected getQueryParams(path: string): ParsedQuery {
    const url = new URL(`http://localhost${path}`);
    const searchParams = url.searchParams;

    const hirokiQuery = parseHirokiQuery(searchParams, this.config.queryLimits);
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
    const parsedQuery = this.getQueryParams(path);
    const { method, body } = params;
    this.logger.debug(`Processing request: ${method} ${path} with body: ${JSON.stringify(body)} and query: ${JSON.stringify(parsedQuery.query)}`);

    if (this.disabledMethods.includes(method)) {
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
