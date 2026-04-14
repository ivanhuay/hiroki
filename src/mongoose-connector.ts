import mongoose, { Document, Model as MongooseModel, Query } from 'mongoose';
import Validator from './validator';
import Model, { UpdateSet, QueryParams } from './model';

// Configuration for update operations
export interface UpdateConfig {
  fast?: boolean;
}

// Result types for Mongoose operations
export type MongooseDocument = Document & Record<string, any>;
export type MongooseQueryResult<T = MongooseDocument> = Query<T | null, T>;

class MongooseConnector<T extends MongooseDocument = MongooseDocument> extends Model {
  protected model: MongooseModel<T>;
  protected _methods: { count: string };
  public modelName: string;

  constructor(model: string | MongooseModel<T>) {
    super(model);
    Validator.validateModel(model);
    
    if (typeof model === 'string') {
      this.model = mongoose.model<T>(model);
    } else {
      this.model = model;
    }
    
    this._methods = this._methodsVersion();
    this.modelName = this.model.modelName;
  }

  private _methodsVersion(): { count: string } {
    // Simplified for mongoose 8.x - always use countDocuments
    return {
      count: 'countDocuments'
    };
  }

  findById(id: string, queryParams?: QueryParams): Promise<T> {
    const populate = this._parsePopulate(queryParams);
    let query = this.model.findById(id);
    
    if (populate) {
      query = query.populate(populate as any);
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
      query = query.populate(populate as any);
    }
    
    return query;
  }

  count(query?: QueryParams): Promise<number> {
    const conditions = query ? this._parseConditions(query.conditions) : {};
    let method = this._methods.count as keyof MongooseModel<T>;
    
    if (!Object.keys(conditions).length) {
      method = 'estimatedDocumentCount' as keyof MongooseModel<T>;
    }
    
    return (this.model[method] as any)(conditions);
  }

  distinct(query: string): Promise<any[]> {
    return this.model.distinct(query);
  }

  updateByConditions(
    conditions: any,
    set: UpdateSet,
    config: UpdateConfig = {}
  ): Promise<any> {
    Validator.validateConditions(conditions);
    
    if (config.fast) {
      const { $pull, $push, ...$set } = set;
      return this.model.updateOne(
        conditions,
        {
          ...($pull && { $pull }),
          ...($push && { $push }),
          ...($set && { $set })
        } as any
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
          this.assign(doc, set);
          return doc.save();
        }
        return doc;
      });
  }

  updateById(id: string, set: UpdateSet, config: UpdateConfig = {}): Promise<any> {
    if (config.fast) {
      const { $pull, $push, ...$set } = set;
      return this.model.updateOne(
        { _id: id } as any,
        {
          ...($pull && { $pull }),
          ...($push && { $push }),
          ...($set && { $set })
        } as any
      );
    }
    
    return this.model
      .findOne({ _id: id } as any)
      .then((doc) => {
        Validator.validateDocumentExist(doc, 404);
        return doc;
      })
      .then((doc) => {
        if (doc) {
          this.assign(doc, set);
          return doc.save();
        }
        return doc;
      });
  }

  delete(id: string): Promise<T> {
    return this.findById(id).then((doc) => {
      Validator.validateDocumentExist(doc);
      return this.model.deleteOne({ _id: id } as any).then(() => {
        return doc;
      });
    });
  }

  create(body: Partial<T>): Promise<T> {
    const newDoc = new this.model(body);
    return newDoc.save();
  }
}

export default MongooseConnector;
