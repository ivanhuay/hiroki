'use strict';
const request = require('supertest');
const assert = require('assert');
const app = require('./mock/app');
const Users = require('./mock/models/users');
const Books = require('./mock/models/books');
describe('POST /api/users', () => {
    before(() => {
        return Promise.all([
            Users.deleteMany({}),
            Books.deleteMany({})
        ]);
    });
    describe('empty data', () => {
        it('should return empty array', () => {
            return request(app)
                .post('/api/users')
                .send({
                    'name':'test user',
                    'email': 'test@lts.com'
                })
                .set('Accept', 'application/json')
                .expect(201)
                .then((response) => {
                    return assert.equal(response.body.name, 'test user');
                });
        });
    });
});
