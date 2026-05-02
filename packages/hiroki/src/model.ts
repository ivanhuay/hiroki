import type { ValidConditions } from './validator';

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
