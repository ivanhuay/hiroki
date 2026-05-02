import { MemoryAdapter } from '../src/memory-adapter';
import Controller from '../src/controller';

function makeController(allowedFields?: string[]) {
  const adapter = new MemoryAdapter('Item');
  return new Controller('Item', { adapter, allowedFields });
}

describe('field whitelisting (allowedFields)', () => {
  it('passes all fields when allowedFields not set', async () => {
    const c = makeController();
    const doc = await c.post({ body: { name: 'alice', role: 'admin' } }) as Record<string, unknown>;
    expect(doc.name).toBe('alice');
    expect(doc.role).toBe('admin');
  });

  it('strips disallowed fields on create', async () => {
    const c = makeController(['name', 'email']);
    const doc = await c.post({ body: { name: 'alice', role: 'admin', isAdmin: true } }) as Record<string, unknown>;
    expect(doc.name).toBe('alice');
    expect(doc.role).toBeUndefined();
    expect(doc.isAdmin).toBeUndefined();
  });

  it('keeps only allowed fields on create', async () => {
    const c = makeController(['name']);
    const doc = await c.post({ body: { name: 'bob', email: 'bob@x.com', password: 'secret' } }) as Record<string, unknown>;
    const keys = Object.keys(doc).filter((k) => k !== 'id');
    expect(keys).toEqual(['name']);
  });

  it('strips disallowed fields on update', async () => {
    const c = makeController(['name']);
    const created = await c.post({ body: { name: 'alice' } }) as Record<string, unknown>;
    const updated = await c.put({
      query: { id: String(created.id) },
      body: { name: 'alice-2', role: 'superadmin' }
    }) as Record<string, unknown>;
    expect(updated.name).toBe('alice-2');
    expect(updated.role).toBeUndefined();
  });

  it('empty allowedFields strips all user-supplied fields', async () => {
    const c = makeController([]);
    const doc = await c.post({ body: { name: 'alice', role: 'admin' } }) as Record<string, unknown>;
    const keys = Object.keys(doc).filter((k) => k !== 'id');
    expect(keys).toHaveLength(0);
  });

  it('hooks receive already-filtered body', async () => {
    const seen: Record<string, unknown>[] = [];
    const c = makeController(['name']);
    // @ts-expect-error accessing protected config for test
    c.config.hooks = {
      beforeCreate: (body: Record<string, unknown>) => { seen.push({ ...body }); return body; }
    };
    await c.post({ body: { name: 'alice', role: 'admin' } });
    expect(seen[0]).not.toHaveProperty('role');
    expect(seen[0]).toHaveProperty('name', 'alice');
  });
});
