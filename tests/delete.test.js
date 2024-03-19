'use strict';
const request = require('supertest');
const assert = require('assert');
const app = require('./mock/app');
const Users = require('./mock/models/users');
const Books = require('./mock/models/books');
describe('DELETE /api/users', () => {
    before(() => {
        return Promise.all([
            Users.deleteMany({}),
            Books.deleteMany({})
        ]);
    });
    after(() => {
        return Promise.all([
            Users.deleteMany({}),
            Books.deleteMany({})
        ]);
    });
    describe('errors', () => {
        it('should fail', () => {
            return request(app)
                .del('/api/users')
                .set('Accept', 'application/json')
                .expect(404)
                .then((response) => {
                    return assert.equal(response.body.error, 'not_found');
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
        it('should delete user', () => {
            return request(app)
                .del('/api/users/5c01997482c8985ad9a7eb5c')
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body._id, '5c01997482c8985ad9a7eb5c');
                    assert.equal(response.body.name, 'mario bross');
                })
                .then(() => {
                    return Users.countDocuments();
                })
                .then((usercount) => {
                    assert.equal(usercount, 2);
                });
        });
    });
});
