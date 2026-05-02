import Controller from '../src/controller';
import type { ControllerHooks, HirokiMiddleware } from '../src/hooks';
import Users from './mock/models/users';

class TestableController extends Controller {
  public parseQueryParams(path: string) {
    return this.getQueryParams(path);
  }
}

describe('Hooks', () => {
  describe('beforeCreate / afterCreate', () => {
    it('beforeCreate can mutate body before insert', async () => {
      const calls: unknown[] = [];
      const hooks: ControllerHooks = {
        beforeCreate: async (body, ctx) => {
          calls.push({ hook: 'beforeCreate', ctx });
          return { ...body, name: 'mutated-by-hook' };
        },
        afterCreate: async (doc, ctx) => {
          calls.push({ hook: 'afterCreate', ctx });
        },
      };

      const c = new TestableController(Users, { basePath: '/api', hooks });
      const doc = await c.post({ body: { name: 'test', email: 'a@b.com', role: [], books: [] } }) as Record<string, unknown>;

      // beforeCreate mutated name — verify mutation reached the DB
      expect(doc.name).toBe('mutated-by-hook');
      expect(calls).toHaveLength(2);
      expect((calls[0] as Record<string, unknown>).hook).toBe('beforeCreate');
      expect((calls[1] as Record<string, unknown>).hook).toBe('afterCreate');
    });

    it('hook context carries modelName', async () => {
      const modelNames: string[] = [];
      const hooks: ControllerHooks = {
        beforeCreate: async (body, ctx) => { modelNames.push(ctx.modelName); return body; },
      };

      const c = new TestableController(Users, { basePath: '/api', hooks });
      await c.post({ body: { name: 'x', email: 'x@x.com', role: [], books: [] } });

      expect(modelNames[0]).toBe('Users');
    });

    it('runs without hooks when none configured', async () => {
      const c = new TestableController(Users, { basePath: '/api' });
      const doc = await c.post({ body: { name: 'nohook', email: 'n@n.com', role: [], books: [] } }) as Record<string, unknown>;
      expect(doc.name).toBe('nohook');
    });
  });

  describe('beforeUpdate / afterUpdate', () => {
    it('beforeUpdate can mutate body before update', async () => {
      const inserted = await new (Users as unknown as new (d: unknown) => { save(): Promise<Record<string, unknown>> })({
        name: 'orig', email: 'orig@x.com', role: [], books: []
      }).save();

      const calls: string[] = [];
      const hooks: ControllerHooks = {
        beforeUpdate: async (body, _ctx) => { calls.push('beforeUpdate'); return { ...body, patched: true }; },
        afterUpdate: async (_doc, _ctx) => { calls.push('afterUpdate'); },
      };

      const c = new TestableController(Users, { basePath: '/api', hooks });
      const doc = await c.put({
        query: { id: String((inserted as Record<string, unknown>)._id) },
        body: { name: 'updated' },
      }) as Record<string, unknown>;

      expect(doc.patched).toBe(true);
      expect(calls).toEqual(['beforeUpdate', 'afterUpdate']);
    });
  });

  describe('beforeDelete / afterDelete', () => {
    it('calls beforeDelete with id and afterDelete with doc', async () => {
      const inserted = await new (Users as unknown as new (d: unknown) => { save(): Promise<Record<string, unknown>> })({
        name: 'todelete', email: 'del@x.com', role: [], books: []
      }).save();

      const calls: Array<{ hook: string; arg: unknown }> = [];
      const hooks: ControllerHooks = {
        beforeDelete: async (id, _ctx) => { calls.push({ hook: 'beforeDelete', arg: id }); },
        afterDelete: async (doc, _ctx) => { calls.push({ hook: 'afterDelete', arg: doc }); },
      };

      const c = new TestableController(Users, { basePath: '/api', hooks });
      const id = String((inserted as Record<string, unknown>)._id);
      await c.delete({ id });

      expect(calls[0]).toMatchObject({ hook: 'beforeDelete', arg: id });
      expect(calls[1].hook).toBe('afterDelete');
    });
  });
});

describe('Middleware', () => {
  it('executes middleware before CRUD dispatch', async () => {
    const log: string[] = [];

    const mw: HirokiMiddleware = async (ctx, next) => {
      log.push(`before:${ctx.method}`);
      const result = await next();
      log.push(`after:${ctx.method}`);
      return result;
    };

    const c = new TestableController(Users, { basePath: '/api', middleware: [mw] });
    await c.process('/api/users', {
      method: 'POST',
      body: { name: 'mwtest', email: 'mw@x.com', role: [], books: [] },
    });

    expect(log).toEqual(['before:POST', 'after:POST']);
  });

  it('chains multiple middleware in order', async () => {
    const log: string[] = [];

    const mw1: HirokiMiddleware = async (_ctx, next) => { log.push('mw1:in'); const r = await next(); log.push('mw1:out'); return r; };
    const mw2: HirokiMiddleware = async (_ctx, next) => { log.push('mw2:in'); const r = await next(); log.push('mw2:out'); return r; };

    const c = new TestableController(Users, { basePath: '/api', middleware: [mw1, mw2] });
    await c.process('/api/users', {
      method: 'POST',
      body: { name: 'chain', email: 'chain@x.com', role: [], books: [] },
    });

    expect(log).toEqual(['mw1:in', 'mw2:in', 'mw2:out', 'mw1:out']);
  });

  it('middleware can short-circuit by throwing', async () => {
    const authError = new Error('Unauthorized');
    const mw: HirokiMiddleware = async (_ctx, _next) => { throw authError; };

    const c = new TestableController(Users, { basePath: '/api', middleware: [mw] });
    await expect(
      c.process('/api/users', { method: 'GET' })
    ).rejects.toThrow('Unauthorized');
  });

  it('middleware can short-circuit by returning early without calling next', async () => {
    const mw: HirokiMiddleware = async (_ctx, _next) => ({ blocked: true });

    const c = new TestableController(Users, { basePath: '/api', middleware: [mw] });
    const result = await c.process('/api/users', { method: 'GET' });
    expect(result).toEqual({ blocked: true });
  });

  it('runs without middleware when none configured', async () => {
    const c = new TestableController(Users, { basePath: '/api' });
    const result = await c.process('/api/users', { method: 'GET' }) as unknown[];
    expect(Array.isArray(result)).toBe(true);
  });
});
