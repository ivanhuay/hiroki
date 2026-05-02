import type { HirokiQuery } from './query.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ProcessParams {
  method: HttpMethod;
  body?: Record<string, unknown>;
}

export interface ExtendedQueryParams extends HirokiQuery {
  id?: string;
  count?: boolean;
  distinct?: string;
  fast?: boolean;
}

export interface RequestParams {
  id?: string;
  body?: Record<string, unknown>;
  query?: ExtendedQueryParams;
}

export interface ParsedQuery {
  query: ExtendedQueryParams;
}
