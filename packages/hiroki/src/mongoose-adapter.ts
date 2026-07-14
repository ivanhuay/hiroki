import mongoose, {
  Document,
  Model as MongooseModel,
  FilterQuery,
  UpdateQuery,
  PopulateOptions as MongoosePopulateOptions
} from 'mongoose';
import { validateModel, validateDocumentExist, validateConditions } from './validator';
import type { ValidModel, ValidConditions } from './validator';
import type { UpdateSet } from './model';
import type { HirokiAdapter, UpdateConfig } from './adapter';
import type { HirokiQuery, HirokiFilter, HirokiSort, FilterOperator } from './query';
import type { HirokiLogger } from './logger';
import { fieldRestrictionsRegistry } from './field-restrictions';

export type MongooseDocument = Document & Record<string, unknown>;
export type PopulateOptions = MongoosePopulateOptions | MongoosePopulateOptions[] | false;

export class MongooseAdapter implements HirokiAdapter {
  private _model: MongooseModel<MongooseDocument>;
  readonly modelName: string;
  private logger?: HirokiLogger;

  constructor(model: ValidModel, logger?: HirokiLogger) {
    validateModel(model);

    if (typeof model === 'string') {
      this._model = mongoose.model<MongooseDocument>(model);
    } else {
      this._model = model as MongooseModel<MongooseDocument>;
    }

    this.modelName = this._model.modelName;
    this.logger = logger;
  }

  setLogger(logger: HirokiLogger): void {
    this.logger = logger;
  }

  canHandle(resource: unknown): boolean {
    if (typeof resource === 'string') {
      try {
        mongoose.model(resource);
        return true;
      } catch {
        return false;
      }
    }
    return (
      resource != null &&
      typeof resource === 'object' &&
      'modelName' in resource &&
      'schema' in resource
    );
  }

  findById(id: string, hirokiQuery?: HirokiQuery): Promise<unknown> {
    this.logger?.debug(`[${this.modelName}] findById id=${id}`);
    const populate = this._parsePopulate(hirokiQuery);
    const select = this._buildSelect(hirokiQuery?.select ?? []);
    let query = this._model.findById(id);

    if (select) query = query.select(select) as typeof query;
    if (populate) query = query.populate(populate);

    return query.then((doc) => {
      validateDocumentExist(doc, 404);
      this.logger?.debug(`[${this.modelName}] findById found`);
      return doc;
    });
  }

  find(hirokiQuery: HirokiQuery): Promise<unknown> {
    const { filter, options } = this._mapQuery(hirokiQuery);
    this.logger?.debug(`[${this.modelName}] find filter=${JSON.stringify(filter)} options=${JSON.stringify(options)}`);
    const populate = this._parsePopulate(hirokiQuery);

    let query = this._model.find(filter, options.select ?? null, {
      skip: options.skip,
      limit: options.limit,
      sort: options.sort,
    });

    if (populate) query = query.populate(populate);

    return query.then((docs) => {
      this.logger?.debug(`[${this.modelName}] find → ${(docs as unknown[]).length} results`);
      return docs;
    });
  }

  count(hirokiQuery?: HirokiQuery): Promise<number> {
    const filter = hirokiQuery ? this._mapQuery(hirokiQuery).filter : {};
    this.logger?.debug(`[${this.modelName}] count filter=${JSON.stringify(filter)}`);

    const p = !Object.keys(filter).length
      ? this._model.estimatedDocumentCount()
      : this._model.countDocuments(filter);

    return p.then((n) => {
      this.logger?.debug(`[${this.modelName}] count → ${n}`);
      return n;
    });
  }

  distinct(field: string): Promise<unknown[]> {
    return this._model.distinct(field);
  }

  create(body: Record<string, unknown>): Promise<unknown> {
    this.logger?.debug(`[${this.modelName}] create keys=${Object.keys(body).join(',')}`);
    const newDoc = new this._model(body as Partial<MongooseDocument>);
    return newDoc.save().then((doc) => {
      this.logger?.debug(`[${this.modelName}] create → id=${(doc as Record<string, unknown>)._id}`);
      return doc;
    });
  }

  updateById(id: string, set: UpdateSet, config: UpdateConfig = {}): Promise<unknown> {
    this.logger?.debug(`[${this.modelName}] updateById id=${id} fast=${!!config.fast}`);
    if (config.fast) {
      const { $pull, $push, ...$set } = set;
      return this._model.updateOne(
        { _id: id } as FilterQuery<MongooseDocument>,
        { ...($pull && { $pull }), ...($push && { $push }), ...($set && { $set }) } as UpdateQuery<MongooseDocument>
      );
    }

    return this._model
      .findOne({ _id: id } as FilterQuery<MongooseDocument>)
      .then((doc) => {
        validateDocumentExist(doc, 404);
        return doc;
      })
      .then((doc) => {
        this._assign(doc as Record<string, unknown>, set);
        return doc.save();
      });
  }

  updateByConditions(
    conditions: ValidConditions | undefined,
    set: UpdateSet,
    config: UpdateConfig = {}
  ): Promise<unknown> {
    const parsedConditions = this._parseConditions(conditions);

    if (config.fast) {
      const { $pull, $push, ...$set } = set;
      return this._model.updateOne(
        parsedConditions,
        { ...($pull && { $pull }), ...($push && { $push }), ...($set && { $set }) } as UpdateQuery<MongooseDocument>
      );
    }

    return this._model
      .findOne(parsedConditions)
      .then((doc) => {
        validateDocumentExist(doc, 404);
        return doc;
      })
      .then((doc) => {
        this._assign(doc as Record<string, unknown>, set);
        return doc.save();
      });
  }

  delete(id: string): Promise<unknown> {
    this.logger?.debug(`[${this.modelName}] delete id=${id}`);
    return this.findById(id).then((doc) => {
      return this._model
        .deleteOne({ _id: id } as FilterQuery<MongooseDocument>)
        .then(() => {
          this.logger?.debug(`[${this.modelName}] delete done id=${id}`);
          return doc;
        });
    });
  }

  private _assign(obj: Record<string, unknown>, set: UpdateSet): void {
    Object.keys(set).forEach((key) => {
      const value = set[key];
      if (value && typeof value === 'object' && '$pull' in value) {
        const op = value as { $pull?: unknown[] };
        obj[key] = (obj[key] as unknown[]).filter(
          (item) => op.$pull?.indexOf(item) === -1
        );
      } else if (value && typeof value === 'object' && '$push' in value) {
        const op = value as { $push?: unknown | unknown[] };
        obj[key] = (obj[key] as unknown[]).concat(op.$push);
      } else {
        obj[key] = value;
      }
    });
  }

  private _mapQuery(hirokiQuery: HirokiQuery): {
    filter: FilterQuery<MongooseDocument>;
    options: { skip?: number; limit?: number; sort?: string; select?: string };
  } {
    const filter: FilterQuery<MongooseDocument> = {};

    // Map abstract where filters to Mongoose operators
    for (const f of hirokiQuery.where ?? []) {
      Object.assign(filter, this._mapFilter(f));
    }

    // Merge legacy conditions escape hatch
    if (hirokiQuery.conditions) {
      const parsed = this._parseConditions(hirokiQuery.conditions);
      if (parsed) Object.assign(filter, parsed);
    }

    // Trusted server-side filter — applied last so it takes precedence
    if (hirokiQuery.serverFilter && Object.keys(hirokiQuery.serverFilter).length) {
      Object.assign(filter, hirokiQuery.serverFilter);
    }

    const options: { skip?: number; limit?: number; sort?: string; select?: string } = {
      sort: '_id',
    };
    if (hirokiQuery.offset) options.skip = hirokiQuery.offset;
    if (hirokiQuery.limit) options.limit = hirokiQuery.limit;
    if (hirokiQuery.sort?.length) options.sort = this._mapSort(hirokiQuery.sort);
    const computedSelect = this._buildSelect(hirokiQuery.select ?? []);
    if (computedSelect) options.select = computedSelect;

    return { filter, options };
  }

  private _mapFilter(f: HirokiFilter): FilterQuery<MongooseDocument> {
    const OP_TO_MONGO: Record<FilterOperator, string> = {
      eq: '$eq', ne: '$ne', gt: '$gt', gte: '$gte',
      lt: '$lt', lte: '$lte', in: '$in', nin: '$nin', regex: '$regex',
    };
    if (f.op === 'eq') return { [f.field]: f.value } as FilterQuery<MongooseDocument>;
    return { [f.field]: { [OP_TO_MONGO[f.op]]: f.value } } as FilterQuery<MongooseDocument>;
  }

  private _mapSort(sort: HirokiSort[]): string {
    return sort.map((s) => `${s.dir === 'desc' ? '-' : ''}${s.field}`).join(' ');
  }

  private _parsePopulate(query?: HirokiQuery): PopulateOptions {
    if (!query?.populate) return false;

    let opts: MongoosePopulateOptions | MongoosePopulateOptions[];
    try {
      opts = JSON.parse(query.populate) as MongoosePopulateOptions | MongoosePopulateOptions[];
    } catch {
      opts = { path: query.populate };
    }

    if (Array.isArray(opts)) {
      return opts.map((o) => this._applyRefDisabledFields(o));
    }
    return this._applyRefDisabledFields(opts);
  }

  /** Merges disabledFields of the referenced model into populate select options. */
  private _applyRefDisabledFields(opt: MongoosePopulateOptions): MongoosePopulateOptions {
    const path = typeof opt.path === 'string' ? opt.path : undefined;
    if (!path) return opt;

    const refModel = this._getRefModelName(path);
    if (!refModel) return opt;

    const disabled = fieldRestrictionsRegistry.get(refModel);
    if (!disabled.length) return opt;

    const existingSelect = typeof opt.select === 'string' ? opt.select : undefined;
    const newSelect = this._mergeDisabledSelect(existingSelect, disabled);
    return { ...opt, select: newSelect };
  }

  /** Resolves the `ref` model name for a schema path (handles ObjectId and array refs). */
  private _getRefModelName(pathStr: string): string | undefined {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schemaDef = (this._model.schema as any).path(pathStr);
    if (!schemaDef) return undefined;
    if (schemaDef.options?.ref) return schemaDef.options.ref as string;
    if (schemaDef.caster?.options?.ref) return schemaDef.caster.options.ref as string;
    return undefined;
  }

  /**
   * Builds a Mongoose select string that combines a user-requested positive projection
   * with server-side disabled-field exclusions.
   *
   * Rules (Mongoose cannot mix positive and negative projections):
   * - User has positive select → filter disabled fields out of it (stays positive).
   * - No user select → use negative projection `-field1 -field2`.
   */
  private _buildSelect(userSelect: string[]): string | null {
    const disabled = fieldRestrictionsRegistry.get(this.modelName);

    if (userSelect.length > 0 && disabled.length > 0) {
      const filtered = userSelect.filter((f) => !disabled.includes(f));
      return filtered.length
        ? filtered.join(' ')
        : disabled.map((f) => `-${f}`).join(' ');
    }
    if (userSelect.length > 0) return userSelect.join(' ');
    if (disabled.length) return disabled.map((f) => `-${f}`).join(' ');
    return null;
  }

  /** Same merging logic for populate's existing select string. */
  private _mergeDisabledSelect(existingSelect: string | undefined, disabled: string[]): string {
    if (!existingSelect) {
      return disabled.map((f) => `-${f}`).join(' ');
    }

    const parts = existingSelect.split(/\s+/).filter(Boolean);
    const isNegative = parts.every((p) => p.startsWith('-') || p === '_id');

    if (isNegative) {
      // Append more exclusions (avoid duplicates)
      const toAdd = disabled.filter((f) => !parts.includes(`-${f}`)).map((f) => `-${f}`);
      return [...parts, ...toAdd].join(' ');
    }

    // Positive projection: strip disabled fields out
    const filtered = parts.filter((p) => !disabled.includes(p.replace(/^\+/, '')));
    return filtered.length
      ? filtered.join(' ')
      : disabled.map((f) => `-${f}`).join(' ');
  }

  private _parseConditions(conditions?: ValidConditions): FilterQuery<MongooseDocument> {
    if (!conditions) return {};
    const parsed = validateConditions(conditions);
    return (parsed ?? {}) as FilterQuery<MongooseDocument>;
  }
}
