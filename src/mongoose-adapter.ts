import mongoose, {
  Document,
  Model as MongooseModel,
  FilterQuery,
  UpdateQuery,
  PopulateOptions as MongoosePopulateOptions
} from 'mongoose';
import { validateModel, validateDocumentExist, validateConditions } from './validator';
import type { ValidModel, ValidConditions } from './validator';
import type { QueryParams, UpdateSet, ParsedOptions } from './model';
import type { HirokiAdapter, UpdateConfig } from './adapter';

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

  findById(id: string, queryParams?: QueryParams): Promise<unknown> {
    const populate = this._parsePopulate(queryParams);
    let query = this._model.findById(id);

    if (populate) {
      query = query.populate(populate);
    }

    return query.then((doc) => {
      validateDocumentExist(doc, 404);
      return doc;
    });
  }

  find(queryParams: QueryParams): Promise<unknown> {
    const conditions = this._parseConditions(queryParams.conditions);
    const populate = this._parsePopulate(queryParams);
    const select = queryParams.select || null;
    const options = this._parseOptions(queryParams);

    let query = this._model.find(conditions, select, options);

    if (populate) {
      query = query.populate(populate);
    }

    return query;
  }

  count(query?: QueryParams): Promise<number> {
    const conditions = query ? this._parseConditions(query.conditions) : {};

    if (!Object.keys(conditions).length) {
      return this._model.estimatedDocumentCount();
    }

    return this._model.countDocuments(conditions);
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

  private _parseOptions(query: QueryParams): ParsedOptions {
    const options: ParsedOptions = { sort: '_id' };

    if (query.skip) options.skip = parseInt(String(query.skip));
    if (query.limit) options.limit = parseInt(String(query.limit));
    if (query.sort) options.sort = query.sort;
    if (query.select) options.select = query.select;

    return options;
  }

  private _parsePopulate(query?: QueryParams): PopulateOptions {
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
