import express, { Request, Response } from 'express';
import mongoose, { Schema } from 'mongoose';
import request from 'supertest';
import Controller from '../src/controller';
import { isHttpError } from '../src/errors';

// Unique model names to avoid collision with other test suites
const SecretUserSchema = new Schema({
  name: String,
  email: String,
  password: String
});

const SecretPostSchema = new Schema({
  title: String,
  author: { type: Schema.Types.ObjectId, ref: 'SecretUser' }
});

if (!mongoose.modelNames().includes('SecretUser')) {
  mongoose.model('SecretUser', SecretUserSchema);
}
if (!mongoose.modelNames().includes('SecretPost')) {
  mongoose.model('SecretPost', SecretPostSchema);
}

const SecretUser = mongoose.model('SecretUser');
const SecretPost = mongoose.model('SecretPost');

function buildApp() {
  const app = express();
  app.use(express.json());

  const userController = new Controller(SecretUser, {
    basePath: '/api',
    disabledFields: ['password'],
  });

  const postController = new Controller(SecretPost, {
    basePath: '/api',
  });

  const controllers = [userController, postController];

  app.use('/api/*', async (req: Request, res: Response) => {
    const path = req.originalUrl;
    const matched = controllers.find((c) => c.check(path));

    if (!matched) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    try {
      const resp = await matched.process(path, {
        method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
        body: req.body,
      });
      res.status((resp as any)?.status ?? 200).json(resp);
    } catch (error) {
      if (isHttpError(error)) {
        res.status(error.status).json(error.toJSON());
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  });

  return app;
}

describe('disabledFields', () => {
  const app = buildApp();
  let authorId: string;
  let postId: string;

  beforeAll(async () => {
    await SecretUser.deleteMany({});
    await SecretPost.deleteMany({});

    const author = await SecretUser.create({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'supersecret',
    });
    authorId = author._id.toString();

    const post = await SecretPost.create({ title: 'My Post', author: authorId });
    postId = post._id.toString();
  });

  afterAll(async () => {
    await SecretUser.deleteMany({});
    await SecretPost.deleteMany({});
  });

  describe('direct GET', () => {
    it('should not expose password in list response', async () => {
      const response = await request(app)
        .get('/api/secretusers')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Alice');
      expect(response.body[0].email).toBe('alice@test.com');
      expect(response.body[0].password).toBeUndefined();
    });

    it('should not expose password in findById response', async () => {
      const response = await request(app)
        .get(`/api/secretusers/${authorId}`)
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body.name).toBe('Alice');
      expect(response.body.password).toBeUndefined();
    });

    it('should not expose password even when explicitly requested via ?select', async () => {
      const response = await request(app)
        .get('/api/secretusers?select=name,email,password')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body[0].name).toBe('Alice');
      expect(response.body[0].password).toBeUndefined();
    });
  });

  describe('populate', () => {
    it('should not expose password in populated author (list)', async () => {
      const response = await request(app)
        .get('/api/secretposts?populate=author')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('My Post');
      expect(response.body[0].author.name).toBe('Alice');
      expect(response.body[0].author.email).toBe('alice@test.com');
      expect(response.body[0].author.password).toBeUndefined();
    });

    it('should not expose password in populated author (findById)', async () => {
      const response = await request(app)
        .get(`/api/secretposts/${postId}?populate=author`)
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.body.title).toBe('My Post');
      expect(response.body.author.name).toBe('Alice');
      expect(response.body.author.password).toBeUndefined();
    });
  });
});
