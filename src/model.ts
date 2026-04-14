import Validator from './validator';
import type { QueryOptions as MongooseQueryOptions } from 'mongoose';

// MongoDB update operators
export interface UpdateOperators {
  $pull?: any[];
  $push?: any | any[];
}

export type UpdateSet = Record<string, any | UpdateOperators>;

// Query parameters interface
export interface QueryParams {
  skip?: string | number;
  limit?: string | number;
  sort?: string;
  select?: string;
  populate?: string;
  conditions?: any;
}

// Parsed options for Mongoose queries
export interface ParsedOptions {
  sort?: string;
  skip?: number;
  limit?: number;
  select?: string;
}

// Populate options (can be string, object, or array)
export type PopulateOptions = string | object | object[] | false;

class Model {
  constructor(model: any) {
    Validator.validateModel(model);
  }

  // Assigns values to object with support for MongoDB operators $pull and $push
  assign(obj: any, set: UpdateSet): void {
    Object.keys(set).forEach((key) => {
      if (set[key] && typeof set[key] === 'object' && set[key].hasOwnProperty('$pull')) {
        obj[key] = obj[key].filter((subitem: any) => 
          (set[key] as UpdateOperators).$pull?.indexOf(subitem) === -1
        );
      } else if (set[key] && typeof set[key] === 'object' && set[key].hasOwnProperty('$push')) {
        const pushValue = (set[key] as UpdateOperators).$push;
        obj[key] = obj[key].concat(pushValue);
      } else {
        obj[key] = set[key];
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
    let populate: PopulateOptions = false;
    
    if (query?.populate) {
      try {
        populate = JSON.parse(query.populate);
      } catch (e) {
        populate = query.populate;
      }
    }
    
    return populate;
  }

  protected _parseConditions(conditions?: any): any {
    if (!conditions) {
      return {};
    }
    
    Validator.validateConditions(conditions);
    
    if (typeof conditions === 'object') {
      return conditions;
    }
    
    return JSON.parse(conditions);
  }
}

export default Model;
