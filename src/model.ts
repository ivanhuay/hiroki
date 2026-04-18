import { validateModel, validateConditions } from './validator';
import type { FilterQuery, Document, PopulateOptions as MongoosePopulateOptions } from 'mongoose';
import type { ValidModel, ValidConditions } from './validator';

export interface UpdateOperators {
  $pull?: unknown[];
  $push?: unknown | unknown[];
}

export type UpdateSet = Record<string, unknown>;

export interface QueryParams {
  skip?: string | number;
  limit?: string | number;
  sort?: string;
  select?: string;
  populate?: string;
  conditions?: ValidConditions;
}

export interface ParsedOptions {
  sort?: string;
  skip?: number;
  limit?: number;
  select?: string;
}

export type PopulateOptions = MongoosePopulateOptions | MongoosePopulateOptions[] | false;

class Model<T extends Document = Document> {
  constructor(model: ValidModel) {
    validateModel(model);
  }

  assign(obj: Record<string, unknown>, set: UpdateSet): void {
    Object.keys(set).forEach((key) => {
      const value = set[key];
      if (value && typeof value === 'object' && '$pull' in value) {
        const operator = value as UpdateOperators;
        obj[key] = (obj[key] as unknown[]).filter(
          (subitem) => operator.$pull?.indexOf(subitem) === -1
        );
      } else if (value && typeof value === 'object' && '$push' in value) {
        const operator = value as UpdateOperators;
        obj[key] = (obj[key] as unknown[]).concat(operator.$push);
      } else {
        obj[key] = value;
      }
    });
  }

  protected _parseOptions(query: QueryParams): ParsedOptions {
    const options: ParsedOptions = {
      sort: '_id'
    };

    if (query.skip) {
      options.skip = parseInt(String(query.skip));
    }
    if (query.limit) {
      options.limit = parseInt(String(query.limit));
    }
    if (query.sort) {
      options.sort = query.sort;
    }
    if (query.select) {
      options.select = query.select;
    }

    return options;
  }

  protected _parsePopulate(query?: QueryParams): PopulateOptions {
    if (!query?.populate) {
      return false;
    }

    try {
      return JSON.parse(query.populate) as MongoosePopulateOptions | MongoosePopulateOptions[];
    } catch (e) {
      return { path: query.populate };
    }
  }

  protected _parseConditions(conditions?: ValidConditions): FilterQuery<T> {
    if (!conditions) {
      return {};
    }

    const parsed = validateConditions(conditions);
    return (parsed ?? {}) as FilterQuery<T>;
  }
}

export default Model;
