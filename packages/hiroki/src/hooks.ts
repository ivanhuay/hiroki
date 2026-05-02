import type { HirokiQuery } from './query';

export interface HookContext {
  modelName: string;
}

export interface MiddlewareContext {
  path: string;
  method: string;
  body?: Record<string, unknown>;
  query?: HirokiQuery;
}

export type BeforeCreateHook = (
  body: Record<string, unknown>,
  ctx: HookContext
) => Record<string, unknown> | Promise<Record<string, unknown>>;

export type AfterCreateHook = (
  doc: unknown,
  ctx: HookContext
) => void | Promise<void>;

export type BeforeUpdateHook = (
  body: Record<string, unknown>,
  ctx: HookContext
) => Record<string, unknown> | Promise<Record<string, unknown>>;

export type AfterUpdateHook = (
  doc: unknown,
  ctx: HookContext
) => void | Promise<void>;

export type BeforeDeleteHook = (
  id: string,
  ctx: HookContext
) => void | Promise<void>;

export type AfterDeleteHook = (
  doc: unknown,
  ctx: HookContext
) => void | Promise<void>;

export interface ControllerHooks {
  beforeCreate?: BeforeCreateHook;
  afterCreate?: AfterCreateHook;
  beforeUpdate?: BeforeUpdateHook;
  afterUpdate?: AfterUpdateHook;
  beforeDelete?: BeforeDeleteHook;
  afterDelete?: AfterDeleteHook;
}

// Framework-agnostic per-resource middleware.
// Call next() to continue; throw to abort with an error.
export type HirokiMiddleware = (
  ctx: MiddlewareContext,
  next: () => Promise<unknown>
) => Promise<unknown>;
