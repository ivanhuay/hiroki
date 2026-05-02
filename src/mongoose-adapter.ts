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

export type MongooseDocument = Document & Record<string, unknown>;
export type PopulateOptions = MongoosePopulateOptions | MongoosePopulateOptions[] | false;

export class MongooseAdapter implements HirokiAdapter {
  private _model: MongooseModel<MongooseDocument>;
  readonly modelName: string;

  constructor(model: ValidModel) {
    validateModel(model);

    if (typeof model === 'string') {
      this._model = mongoose.model<MongooseDocument>(model);
    } else {
      this._model = model as MongooseModel<MongooseDocument>;
    }

    this.modelName = this._model.modelName;
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
    const populate = this._parsePopulate(hirokiQuery);
    const select = hirokiQuery?.select?.join(' ') || null;
    let query = this._model.findById(id);

    if (select) query = query.select(select) as typeof query;
    if (populate) query = query.populate(populate);

    return query.then((doc) => {
      validateDocumentExist(doc, 404);
      return doc;
    });
  }

  find(hirokiQuery: HirokiQuery): Promise<unknown> {
    const { filter, options } = this._mapQuery(hirokiQuery);
    const populate = this._parsePopulate(hirokiQuery);

    let query = this._model.find(filter, options.select ?? null, {
      skip: options.skip,
      limit: options.limit,
      sort: options.sort,
    });

    if (populate) query = query.populate(populate);

    return query;
  }

  count(hirokiQuery?: HirokiQuery): Promise<number> {
    const filter = hirokiQuery ? this._mapQuery(hirokiQuery).filter : {};

    if (!Object.keys(filter).length) {
      return this._model.estimatedDocumentCount();
    }

    return this._model.countDocuments(filter);
  }

  distinct(field: string): Promise<unknown[]> {
    return this._model.distinct(field);
  }

  create(body: Record<string, unknown>): Promise<unknown> {
    const newDoc = new this._model(body as Partial<MongooseDocument>);
    return newDoc.save();
  }

  updateById(id: string, set: UpdateSet, config: UpdateConfig = {}): Promise<unknown> {
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
    return this.findById(id).then((doc) => {
      return this._model
        .deleteOne({ _id: id } as FilterQuery<MongooseDocument>)
        .then(() => doc);
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
      const parsed = validateConditions(hirokiQuery.conditions);
      if (parsed) Object.assign(filter, parsed);
    }

    const options: { skip?: number; limit?: number; sort?: string; select?: string } = {
      sort: '_id',
    };
    if (hirokiQuery.offset) options.skip = hirokiQuery.offset;
    if (hirokiQuery.limit) options.limit = hirokiQuery.limit;
    if (hirokiQuery.sort?.length) options.sort = this._mapSort(hirokiQuery.sort);
    if (hirokiQuery.select?.length) options.select = hirokiQuery.select.join(' ');

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

    try {
      return JSON.parse(query.populate) as MongoosePopulateOptions | MongoosePopulateOptions[];
    } catch {
      return { path: query.populate };
    }
  }

  private _parseConditions(conditions?: ValidConditions): FilterQuery<MongooseDocument> {
    if (!conditions) return {};

    const parsed = validateConditions(conditions);
    return (parsed ?? {}) as FilterQuery<MongooseDocument>;
  }
}
