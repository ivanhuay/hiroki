import request from 'supertest';
import app from './mock/app';
import Users from './mock/models/users';

beforeEach(async () => {
  await Users.deleteMany({});
});

afterEach(async () => {
  await Users.deleteMany({});
});

describe('edge cases', () => {
  describe('route not found', () => {
    it('returns 404 for unknown resource', async () => {
      const res = await request(app)
        .get('/api/nonexistent')
        .set('Accept', 'application/json')
        .expect(404);

      expect(res.body.error).toBeDefined();
      expect(res.body.status).toBe(404);
    });

    it('returns 404 for deeply nested unknown path', async () => {
      const res = await request(app)
        .get('/api/nonexistent/nested/path')
        .set('Accept', 'application/json')
        .expect(404);

      expect(res.body.status).toBe(404);
    });
  });

  describe('malformed paths', () => {
    it('handles programmatic double-slash normalization via hiroki.process()', async () => {
      // Double-slash normalization works when path is passed directly to hiroki.process().
      // HTTP routing (Express) handles slashes before Hiroki sees the path.
      // Verified: hiroki.process('//api/users', ...) normalizes to /api/users internally.
      const hiroki = (await import('../src')).default;
      const result = await hiroki.process('//api/users', { method: 'GET' });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('malformed conditions', () => {
    it('returns error for invalid JSON conditions string', async () => {
      const res = await request(app)
        .get('/api/users?conditions={invalid}')
        .set('Accept', 'application/json')
        .expect(400);

      expect(res.body.error).toBeDefined();
    });

    it('returns results for valid JSON conditions string', async () => {
      await Users.create({ name: 'alice', email: 'a@x.com' });
      const res = await request(app)
        .get('/api/users?conditions={"name":"alice"}')
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('alice');
    });
  });

  describe('missing body', () => {
    it('POST with empty body on model with required fields returns error', async () => {
      // Books requires `title` — Mongoose rejects empty create
      const res = await request(app)
        .post('/api/books')
        .send({})
        .set('Accept', 'application/json')
        .expect(500);

      expect(res.body.error).toContain('`title` is required');
    });

    it('PUT on non-existent document returns 404', async () => {
      const res = await request(app)
        .put('/api/users/5c01997482c8985ad9a7eb5b')
        .send({ name: 'test' })
        .set('Accept', 'application/json')
        .expect(404);

      expect(res.body.error).toBeDefined();
    });
  });

  describe('missing required params', () => {
    it('DELETE without id returns 404', async () => {
      const res = await request(app)
        .delete('/api/users')
        .set('Accept', 'application/json')
        .expect(404);

      expect(res.body.error).toBeDefined();
    });

    it('PUT without id or conditions returns 400', async () => {
      const res = await request(app)
        .put('/api/users')
        .send({ name: 'test' })
        .set('Accept', 'application/json')
        .expect(400);

      expect(res.body.error).toBeDefined();
    });
  });

  describe('where query filters (integration)', () => {
    beforeEach(async () => {
      await Users.create([
        { name: 'alice', email: 'a@x.com' },
        { name: 'bob', email: 'b@x.com' },
        { name: 'charlie', email: 'c@x.com' },
      ]);
    });

    it('filters by exact field value', async () => {
      const res = await request(app)
        .get('/api/users?where[name]=alice')
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('alice');
    });

    it('filters with $ne operator', async () => {
      const res = await request(app)
        .get('/api/users?where[name][$ne]=alice')
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body.every((u: { name: string }) => u.name !== 'alice')).toBe(true);
    });

    it('filters with $in operator', async () => {
      const res = await request(app)
        .get('/api/users?where[name][$in]=alice,bob')
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body).toHaveLength(2);
    });

    it('returns empty array when no match', async () => {
      const res = await request(app)
        .get('/api/users?where[name]=unknown')
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body).toHaveLength(0);
    });
  });

  describe('count with where filter (integration)', () => {
    beforeEach(async () => {
      await Users.create([
        { name: 'alice', email: 'a@x.com' },
        { name: 'bob', email: 'b@x.com' },
      ]);
    });

    it('counts filtered results', async () => {
      const res = await request(app)
        .get('/api/users?count=true&where[name]=alice')
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.body).toBe(1);
    });
  });
});
