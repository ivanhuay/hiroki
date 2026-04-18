import mongoose, { Document, Model as MongooseModel, Query, FilterQuery, UpdateQuery } from 'mongoose';
import Validator from './validator';
import type { ValidModel, ValidConditions } from './validator';
import Model, { UpdateSet, QueryParams } from './model';

export interface UpdateConfig {
  fast?: boolean;
}

export type MongooseDocument = Document & Record<string, unknown>;
export type MongooseQueryResult<T = MongooseDocument> = Query<T | null, T>;

class MongooseConnector<T extends MongooseDocument = MongooseDocument> extends Model<T> {
  protected model: MongooseModel<T>;
  public modelName: string;

  constructor(model: ValidModel) {
    super(model);
    Validator.validateModel(model);

    if (typeof model === 'string') {
      this.model = mongoose.model<T>(model);
    } else {
      this.model = model as MongooseModel<T>;
    }

    this.modelName = this.model.modelName;
  }

  findById(id: string, queryParams?: QueryParams): Promise<T> {
    const populate = this._parsePopulate(queryParams);
    let query = this.model.findById(id);

    if (populate) {
      query = query.populate(populate);
    }

    return query.then((doc) => {
      Validator.validateDocumentExist(doc, 404);
      return doc as T;
    });
  }

  find(queryParams: QueryParams): Query<T[], T> {
    const conditions = this._parseConditions(queryParams.conditions);
    const populate = this._parsePopulate(queryParams);
    const select = queryParams.select || null;
    const options = this._parseOptions(queryParams);

    let query = this.model.find(conditions, select, options);

    if (populate) {
      query = query.populate(populate);
    }

    return query;
  }

  count(query?: QueryParams): Promise<number> {
    const conditions = query ? this._parseConditions(query.conditions) : {};

    if (!Object.keys(conditions).length) {
      return this.model.estimatedDocumentCount();
    }

    return this.model.countDocuments(conditions);
  }

  distinct(query: string): Promise<unknown[]> {
    return this.model.distinct(query);
  }

  updateByConditions(
    conditions: ValidConditions,
    set: UpdateSet,
    config: UpdateConfig = {}
  ): Promise<unknown> {
    Validator.validateConditions(conditions);

    if (config.fast) {
      const { $pull, $push, ...$set } = set;
      return this.model.updateOne(
        this._parseConditions(conditions),
        { ...($pull && { $pull }), ...($push && { $push }), ...($set && { $set }) } as UpdateQuery<T>
      );
    }

    return this.model
      .findOne(this._parseConditions(conditions))
      .then((doc) => {
        Validator.validateDocumentExist(doc, 404);
        return doc;
      })
      .then((doc) => {
        if (doc) {
          this.assign(doc as Record<string, unknown>, set);
          return doc.save();
        }
        return doc;
      });
  }

  updateById(id: string, set: UpdateSet, config: UpdateConfig = {}): Promise<unknown> {
    if (config.fast) {
      const { $pull, $push, ...$set } = set;
      return this.model.updateOne(
        { _id: id } as FilterQuery<T>,
        { ...($pull && { $pull }), ...($push && { $push }), ...($set && { $set }) } as UpdateQuery<T>
      );
    }

    return this.model
      .findOne({ _id: id } as FilterQuery<T>)
      .then((doc) => {
        Validator.validateDocumentExist(doc, 404);
        return doc;
      })
      .then((doc) => {
        if (doc) {
          this.assign(doc as Record<string, unknown>, set);
          return doc.save();
        }
        return doc;
      });
  }

  delete(id: string): Promise<T> {
    return this.findById(id).then((doc) => {
      Validator.validateDocumentExist(doc);
      return this.model.deleteOne({ _id: id } as FilterQuery<T>).then(() => {
        return doc;
      });
    });
  }

  create(body: Record<string, unknown>): Promise<T> {
    const newDoc = new this.model(body as Partial<T>);
    return newDoc.save();
  }
}

export default MongooseConnector;
