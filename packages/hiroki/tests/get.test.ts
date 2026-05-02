import request from 'supertest';
import app from './mock/app';
import Users from './mock/models/users';
import Books from './mock/models/books';

describe('GET /api/users', () => {
  describe('empty data', () => {
    beforeEach(async () => {
      await Promise.all([
        Users.deleteMany({}),
        Books.deleteMany({})
      ]);
    });

    it('should return empty array', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should return empty array with singular model file', async () => {
      const response = await request(app)
        .get('/api/items')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should return empty array with pluralized route', async () => {
      const response = await request(app)
        .get('/api/people')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should return 200 status', async () => {
      const response = await request(app)
        .get('/api/invisibles')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('preloaded data', () => {
    beforeAll(async () => {
      await Users.create({
        _id: '5c01997482c8985ad9a7eb5b',
        name: 'test user',
        email: 'test@lts.com'
      });
    });

    afterAll(async () => {
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

    it('should get 1 user with only _id parameter', async () => {
      const response = await request(app)
        .get('/api/users?select=_id')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]._id).toBe('5c01997482c8985ad9a7eb5b');
      expect(response.body[0]).not.toHaveProperty('name');
      expect(response.body[0]).not.toHaveProperty('email');
    });

    it('should get distinct email', async () => {
      const response = await request(app)
        .get('/api/users?distinct=email')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toBe('test@lts.com');
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
    beforeAll(async () => {
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

    afterAll(async () => {
      await Users.deleteMany({});
    });

    it('should get 3 user', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].name).toBe('test user');
    });

    it('should return count user', async () => {
      const response = await request(app)
        .get('/api/users?count=true')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toBe(3);
    });

    it('should return count user with conditions', async () => {
      const response = await request(app)
        .get('/api/users?count=true&conditions[email]=main.lex@lts.com')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toBe(1);
    });

    it('should 1 user using conditions', async () => {
      const response = await request(app)
        .get('/api/users?conditions={"email":"main.lex@lts.com"}')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]._id).toBe('5c01997482c8985ad9a7eb5d');
      expect(response.body[0].name).toBe('lex');
    });

    it('should 1 user using other conditions format', async () => {
      const response = await request(app)
        .get('/api/users?conditions[email]=main.lex@lts.com')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]._id).toBe('5c01997482c8985ad9a7eb5d');
      expect(response.body[0].name).toBe('lex');
    });

    it('should return 2 user with limit', async () => {
      const response = await request(app)
        .get('/api/users?limit=2')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('should return 2 user & count header', async () => {
      const response = await request(app)
        .get('/api/users?limit=2')
        .set('Accept', 'application/json')
        .set('hiroki', 'count')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('should return users sorted by email', async () => {
      const response = await request(app)
        .get('/api/users?sort=email')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].email).toBe('aaaa@lts.com');
    });

    it('should return skip first user sorted by email', async () => {
      const response = await request(app)
        .get('/api/users?sort=email&skip=1')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].email).toBe('main.lex@lts.com');
    });
  });

  describe('populate', () => {
    let bookId: string;

    beforeAll(async () => {
      const book = await Books.create({
        title: 'first book',
        tag: ['first']
      });
      bookId = book._id.toString();

      await Promise.all([
        Users.create({
          _id: '5c01997482c8985ad9a7eb5b',
          name: 'test user',
          email: 'test@lts.com',
          books: [bookId]
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

    afterAll(async () => {
      await Promise.all([
        Users.deleteMany({}),
        Books.deleteMany({})
      ]);
    });

    it('should get user & book by id', async () => {
      const response = await request(app)
        .get('/api/users/5c01997482c8985ad9a7eb5b?populate=books')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body.name).toBe('test user');
      expect(response.body.email).toBe('test@lts.com');
      expect(response.body.books).toHaveLength(1);
      expect(response.body.books[0].title).toBe('first book');
    });

    it('should get all user with book data', async () => {
      const response = await request(app)
        .get('/api/users?populate=books')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].name).toBe('test user');
      expect(response.body[0].email).toBe('test@lts.com');
      expect(response.body[0].books).toHaveLength(1);
      expect(response.body[0].books[0].title).toBe('first book');
    });

    it('should get users with book data', async () => {
      const response = await request(app)
        .get('/api/users?populate=books&conditions={"books":{"$not":{"$size":0}}}')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('test user');
      expect(response.body[0].email).toBe('test@lts.com');
      expect(response.body[0].books).toHaveLength(1);
      expect(response.body[0].books[0].title).toBe('first book');
    });
  });
});
