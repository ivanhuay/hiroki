import { MemoryAdapter } from '../src/memory-adapter';
import { DocumentNotFoundError } from '../src/errors';

describe('MemoryAdapter', () => {
  let adapter: MemoryAdapter;

  beforeEach(() => {
    adapter = new MemoryAdapter('items');
    adapter.clear();
  });

  describe('create / findById', () => {
    it('creates a doc and returns it with an id', async () => {
      const doc = await adapter.create({ name: 'foo', age: 10 }) as Record<string, unknown>;
      expect(doc.name).toBe('foo');
      expect(doc.id).toBeDefined();
    });

    it('findById returns the doc', async () => {
      const created = await adapter.create({ name: 'bar' }) as Record<string, unknown>;
      const found = await adapter.findById(String(created.id)) as Record<string, unknown>;
      expect(found.name).toBe('bar');
    });

    it('findById throws DocumentNotFoundError for unknown id', async () => {
      await expect(adapter.findById('999')).rejects.toThrow(DocumentNotFoundError);
    });
  });

  describe('find', () => {
    beforeEach(async () => {
      await adapter.create({ name: 'alice', age: 30, role: 'admin' });
      await adapter.create({ name: 'bob',   age: 25, role: 'user' });
      await adapter.create({ name: 'carol', age: 35, role: 'user' });
    });

    it('returns all docs with empty query', async () => {
      const results = await adapter.find({}) as unknown[];
      expect(results).toHaveLength(3);
    });

    it('filters by eq', async () => {
      const results = await adapter.find({ where: [{ field: 'name', op: 'eq', value: 'alice' }] }) as Record<string, unknown>[];
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('alice');
    });

    it('filters by gt', async () => {
      const results = await adapter.find({ where: [{ field: 'age', op: 'gt', value: 25 }] }) as unknown[];
      expect(results).toHaveLength(2);
    });

    it('filters by in', async () => {
      const results = await adapter.find({ where: [{ field: 'role', op: 'in', value: ['admin'] }] }) as unknown[];
      expect(results).toHaveLength(1);
    });

    it('filters by ne', async () => {
      const results = await adapter.find({ where: [{ field: 'role', op: 'ne', value: 'admin' }] }) as unknown[];
      expect(results).toHaveLength(2);
    });

    it('applies limit', async () => {
      const results = await adapter.find({ limit: 2 }) as unknown[];
      expect(results).toHaveLength(2);
    });

    it('applies offset', async () => {
      const all = await adapter.find({}) as unknown[];
      const paged = await adapter.find({ offset: 1 }) as unknown[];
      expect(paged).toHaveLength(all.length - 1);
    });

    it('sorts asc', async () => {
      const results = await adapter.find({ sort: [{ field: 'age', dir: 'asc' }] }) as Record<string, unknown>[];
      expect(results[0].name).toBe('bob');
      expect(results[2].name).toBe('carol');
    });

    it('sorts desc', async () => {
      const results = await adapter.find({ sort: [{ field: 'age', dir: 'desc' }] }) as Record<string, unknown>[];
      expect(results[0].name).toBe('carol');
    });

    it('applies select', async () => {
      const results = await adapter.find({ where: [{ field: 'name', op: 'eq', value: 'alice' }], select: ['name'] }) as Record<string, unknown>[];
      expect(results[0]).toEqual({ name: 'alice' });
      expect(results[0].age).toBeUndefined();
    });

    it('filters by legacy conditions object', async () => {
      const results = await adapter.find({ conditions: { role: 'admin' } }) as unknown[];
      expect(results).toHaveLength(1);
    });
  });

  describe('count', () => {
    beforeEach(async () => {
      await adapter.create({ name: 'x', active: true });
      await adapter.create({ name: 'y', active: false });
    });

    it('returns total without query', async () => {
      expect(await adapter.count()).toBe(2);
    });

    it('returns filtered count', async () => {
      expect(await adapter.count({ where: [{ field: 'active', op: 'eq', value: true }] })).toBe(1);
    });
  });

  describe('distinct', () => {
    beforeEach(async () => {
      await adapter.create({ role: 'admin' });
      await adapter.create({ role: 'user' });
      await adapter.create({ role: 'user' });
    });

    it('returns unique values', async () => {
      const roles = await adapter.distinct('role') as unknown[];
      expect(roles).toHaveLength(2);
      expect(roles).toContain('admin');
      expect(roles).toContain('user');
    });
  });

  describe('updateById', () => {
    it('updates fields on existing doc', async () => {
      const doc = await adapter.create({ name: 'old' }) as Record<string, unknown>;
      const updated = await adapter.updateById(String(doc.id), { name: 'new' }) as Record<string, unknown>;
      expect(updated.name).toBe('new');
    });

    it('throws for unknown id', async () => {
      await expect(adapter.updateById('999', { name: 'x' })).rejects.toThrow(DocumentNotFoundError);
    });
  });

  describe('updateByConditions', () => {
    it('updates first matching doc', async () => {
      await adapter.create({ name: 'target', status: 'pending' });
      const updated = await adapter.updateByConditions({ name: 'target' }, { status: 'done' }) as Record<string, unknown>;
      expect(updated.status).toBe('done');
    });

    it('throws when no match found', async () => {
      await expect(adapter.updateByConditions({ name: 'ghost' }, { x: 1 })).rejects.toThrow(DocumentNotFoundError);
    });
  });

  describe('delete', () => {
    it('removes doc and returns it', async () => {
      const doc = await adapter.create({ name: 'bye' }) as Record<string, unknown>;
      const deleted = await adapter.delete(String(doc.id)) as Record<string, unknown>;
      expect(deleted.name).toBe('bye');
      await expect(adapter.findById(String(doc.id))).rejects.toThrow(DocumentNotFoundError);
    });

    it('throws for unknown id', async () => {
      await expect(adapter.delete('999')).rejects.toThrow(DocumentNotFoundError);
    });
  });

  describe('adapter injection via ControllerConfig', () => {
    it('Controller uses injected MemoryAdapter', async () => {
      const { default: Controller } = await import('../src/controller');
      const mem = new MemoryAdapter('Products');
      const c = new Controller('Products', { basePath: '/api', adapter: mem });
      expect(c.routeName).toBe('products');
      // create via controller post
      const doc = await c.post({ body: { title: 'widget', price: 9 } }) as Record<string, unknown>;
      expect(doc.title).toBe('widget');
    });
  });
});
