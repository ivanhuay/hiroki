import request from 'supertest';
import app from './mock/app';
import Users from './mock/models/users';
import Books from './mock/models/books';

describe('POST /api/users', () => {
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

  describe('with all data', () => {
    it('should create a user', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          'name': 'test user',
          'email': 'test@lts.com'
        })
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body.name).toBe('test user');

      const users = await Users.find();
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('test user');
    });
  });

  describe('withoud fields', () => {
    it('should fail creating a book', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({})
        .set('Accept', 'application/json')
        .expect(500);

      expect(response.body.error).toContain('Path `title` is required.');
    });
  });
});
