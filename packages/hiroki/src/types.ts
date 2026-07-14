import type { HirokiQuery } from './query.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ProcessParams {
  method: HttpMethod;
  body?: Record<string, unknown>;
  /**
   * Trusted server-side filter merged into the DB query.
   * Use this instead of encoding filters in the URL via `conditions=`.
   * This value is never parsed from user input — set it only from server logic.
   *
   * @example
   * // Show only public content or content owned by the authenticated user
   * hiroki.process(req.url, {
   *   method: 'GET',
   *   serverFilter: { $or: [{ visibility: 'public' }, { author: req.user.id }] },
   * });
   */
  serverFilter?: Record<string, unknown>;
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
