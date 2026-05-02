import request from 'supertest';
import app from './mock/app';
import Users from './mock/models/users';
import Books from './mock/models/books';
import Draws from './mock/models/draws';

describe('PUT method', () => {
  let bookId: string;

  beforeEach(async () => {
    await Promise.all([
      Users.deleteMany({}),
      Books.deleteMany({}),
      Draws.deleteMany({})
    ]);
  });

  beforeEach(async () => {
    await Promise.all([
      Books.create({
        _id: '5c01997482c8985ad9a7eb4b',
        title: 'first book'
      }),
      Books.create({
        _id: '5c01997482c8985ad9a7eb4c',
        title: 'second book',
        tag: ['asd']
      }),
      Books.create({
        _id: '5c01997482c8985ad9a7eb4d',
        title: '3 book',
        tag: ['hiroki', 'rock', 'awesome']
      }),
      Users.create({
        _id: '5c01997482c8985ad9a7eb5b',
        name: 'test user',
        email: 'test@lts.com',
        books: ['5c01997482c8985ad9a7eb4b']
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
      }),
      Draws.create({
        _id: '5c01297482c8985ad9a7eb5c',
        name: 'Alvatro'
      })
    ]);
  });

  afterEach(async () => {
    await Promise.all([
      Users.deleteMany({}),
      Books.deleteMany({}),
      Draws.deleteMany({})
    ]);
  });

  describe('PUT /api/users', () => {
    it('should update a user', async () => {
      const response = await request(app)
        .put('/api/users/5c01997482c8985ad9a7eb5b')
        .send({
          'name': 'test user updated'
        })
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body.name).toBe('test user updated');

      const users = await Users.find({ _id: '5c01997482c8985ad9a7eb5b' });
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('test user updated');
    });
  });

  describe('PUT /api/books', () => {
    it('should update book tag and run presave', async () => {
      const response = await request(app)
        .put('/api/books/5c01997482c8985ad9a7eb4b')
        .send({
          tag: ['comic']
        })
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body.tag).toHaveLength(1);
      expect(response.body.tag[0]).toBe('comic');
      expect(response.body.tagCount).toBe(1);
    });

    it('should update using $push', async () => {
      const response = await request(app)
        .put('/api/books/5c01997482c8985ad9a7eb4b')
        .send({
          tag: { $push: 'comic' }
        })
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body.tag).toHaveLength(1);
      expect(response.body.tag[0]).toBe('comic');
      expect(response.body.tagCount).toBe(1);
    });

    it('should update using $push with an array', async () => {
      const response = await request(app)
        .put('/api/books/5c01997482c8985ad9a7eb4b')
        .send({
          tag: { $push: ['comic', 'test'] }
        })
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body.tag).toHaveLength(2);
      expect(response.body.tag[0]).toBe('comic');
      expect(response.body.tag[1]).toBe('test');
      expect(response.body.tagCount).toBe(2);
    });

    it('should update by conditions', async () => {
      const response = await request(app)
        .put('/api/books?conditions={"tag":"asd"}')
        .send({
          tag: ['comic']
        })
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body.tag).toHaveLength(1);
      expect(response.body.tag[0]).toBe('comic');
      expect(response.body.title).toBe('second book');
    });

    it('should update by conditions and $pull', async () => {
      const response = await request(app)
        .put('/api/books?conditions={"tag":"asd"}')
        .send({
          tag: { $pull: ['asd'] }
        })
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body.tag).toHaveLength(0);
      expect(response.body.title).toBe('second book');
    });

    it('should update by conditions and $pull with multiple data', async () => {
      const response = await request(app)
        .put('/api/books?conditions={"tag":"hiroki"}')
        .send({
          tag: { $pull: ['hiroki', 'awesome'] }
        })
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body.tag).toHaveLength(1);
      expect(response.body.tag[0]).toBe('rock');
      expect(response.body.title).toBe('3 book');
    });

    it('should fail with 404', async () => {
      const response = await request(app)
        .put('/api/books?conditions={"tag":"zfc"}')
        .send({
          tag: ['comic']
        })
        .set('Accept', 'application/json')
        .expect(404);

      expect(response.body.error).toBe('Document not found.');
    });
  });

  describe('PUT /api/draws', () => {
    it('fast update should not run pre-save', async () => {
      const response = await request(app)
        .put('/api/draws/5c01297482c8985ad9a7eb5c')
        .send({
          'name': 'some bird'
        })
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body.type).toBeUndefined();
    });
  });
});
