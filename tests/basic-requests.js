'use strict';
const request = require('supertest');
const assert = require('assert');
const app = require('./mock/app');
const Users = require('./mock/models/users');
describe('basic request', () => {
    describe('GET /api/users', () => {
        before(() => {
            return Users.deleteMany({});
        });
        describe('empty data', () => {
            it('should return empty array', () => {
                return request(app)
                    .get('/api/users')
                    .set('Accept', 'application/json')
                    .expect(200)
                    .then((response) => {
                        return assert.equal(response.body.length, 0);
                    });
            });
        });
        describe('preloaded data', () => {
            before(() => {
                return Users.create({
                    _id: '5c01997482c8985ad9a7eb5b',
                    name:'test user',
                    email: 'test@lts.com'
                });
            });
            after(() => {
                return Users.deleteMany({});
            });
            it('should get 1 user', () => {
                return request(app)
                    .get('/api/users')
                    .set('Accept', 'application/json')
                    .expect(200)
                    .then((response) => {
                        assert.equal(response.body.length, 1);
                        assert.equal(response.body[0].name, 'test user');
                    });
            });
            it('should get user by id', () => {
                return request(app)
                    .get('/api/users/5c01997482c8985ad9a7eb5b')
                    .set('Accept', 'application/json')
                    .expect(200)
                    .then((response) => {
                        assert.equal(response.body.name, 'test user');
                        assert.equal(response.body.email, 'test@lts.com');
                    });
            });
            it('should return not found for unknown id', () => {
                return request(app)
                    .get('/api/users/5c01997482c8985ad9a7eb5c')
                    .set('Accept', 'application/json')
                    .expect(404)
                    .then((response) => {
                        assert.equal(response.body.error, 'Document not found.');
                    });
            });
        });
        describe('multiple preloaded data & params', () => {
            before(() => {
                return Promise.all([
                    Users.create({
                        _id: '5c01997482c8985ad9a7eb5b',
                        name:'test user',
                        email: 'test@lts.com'
                    }),
                    Users.create({
                        _id: '5c01997482c8985ad9a7eb5c',
                        name:'mario bross',
                        email: 'aaaa@lts.com'
                    }),
                    Users.create({
                        _id: '5c01997482c8985ad9a7eb5d',
                        name:'lex',
                        email: 'main.lex@lts.com'
                    })
                ]);
            });
            after(() => {
                return Users.deleteMany({});
            });
            it('should get 3 user', () => {
                return request(app)
                    .get('/api/users')
                    .set('Accept', 'application/json')
                    .expect(200)
                    .then((response) => {
                        assert.equal(response.body.length, 3);
                        assert.equal(response.body[0].name, 'test user');
                    });
            });
            it('should return count user', () => {
                return request(app)
                    .get('/api/users?count=true')
                    .set('Accept', 'application/json')
                    .expect(200)
                    .then((response) => {
                        assert.equal(response.body, 3);
                    });
            });
            it('should return 2 user with limit', () => {
                return request(app)
                    .get('/api/users?limit=2')
                    .set('Accept', 'application/json')
                    .expect(200)
                    .then((response) => {
                        assert.equal(response.body.length, 2);
                    });
            });
            it('should return users sorted by email', () => {
                return request(app)
                    .get('/api/users?sort=email')
                    .set('Accept', 'application/json')
                    .expect(200)
                    .then((response) => {
                        assert.equal(response.body.length, 3);
                        assert.equal(response.body[0].email, 'aaaa@lts.com');
                    });
            });
            it('should return skyp first user sorted by email', () => {
                return request(app)
                    .get('/api/users?sort=email&skip=1')
                    .set('Accept', 'application/json')
                    .expect(200)
                    .then((response) => {
                        assert.equal(response.body.length, 2);
                        assert.equal(response.body[0].email, 'main.lex@lts.com');
                    });
            });
        });
    });
});
