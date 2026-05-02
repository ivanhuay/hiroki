import request from 'supertest';
import app from './mock/app';
import Users from './mock/models/users';
import Books from './mock/models/books';

describe('DELETE /api/users', () => {
  beforeEach(async () => {
    await Promise.all([
      Users.deleteMany({}),
      Books.deleteMany({})
    ]);
  });

  afterEach(async () => {
    await Promise.all([
      Users.deleteMany({}),
      Books.deleteMany({})
    ]);
  });

  describe('errors', () => {
    it('should fail', async () => {
      const response = await request(app)
        .del('/api/users')
        .set('Accept', 'application/json')
        .expect(404);

      expect(response.body.error).toBe('params id required');
    });
  });

  describe('preloaded data', () => {
    beforeEach(async () => {
      await Users.create({
        _id: '5c01997482c8985ad9a7eb5b',
        name: 'test user',
        email: 'test@lts.com'
      });
    });

    afterEach(async () => {
      await Users.deleteMany({});
    });

    it('should get 1 user', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('test user');
    });

    it('should get user by id', async () => {
      const response = await request(app)
        .get('/api/users/5c01997482c8985ad9a7eb5b')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body.name).toBe('test user');
      expect(response.body.email).toBe('test@lts.com');
    });

    it('should return not found for unknown id', async () => {
      const response = await request(app)
        .get('/api/users/5c01997482c8985ad9a7eb5c')
        .set('Accept', 'application/json')
        .expect(404);

      expect(response.body.error).toBe('Document not found.');
    });
  });

  describe('multiple preloaded data & params', () => {
    beforeEach(async () => {
      await Promise.all([
        Users.create({
          _id: '5c01997482c8985ad9a7eb5b',
          name: 'test user',
          email: 'test@lts.com'
        }),
        Users.create({
          _id: '5c01997482c8985ad9a7eb5c',
          name: 'mario bross',
          email: 'aaaa@lts.com'
        }),
        Users.create({
          _id: '5c01997482c8985ad9a7eb5d',
          name: 'lex',
          email: 'main.lex@lts.com'
        })
      ]);
    });

    afterEach(async () => {
      await Users.deleteMany({});
    });

    it('should delete user', async () => {
      const response = await request(app)
        .del('/api/users/5c01997482c8985ad9a7eb5c')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body._id).toBe('5c01997482c8985ad9a7eb5c');
      expect(response.body.name).toBe('mario bross');

      const usercount = await Users.countDocuments();
      expect(usercount).toBe(2);
    });
  });
});
