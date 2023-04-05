'use strict';
const request = require('supertest');
const app = require('./mock/app');
const Users = require('./mock/models/users');
const Books = require('./mock/models/books');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const assert = chai.assert;

describe('POST /api/users', () => {
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
    describe('with all data', () => {
        it('should create a user', () => {
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
                })
                .then(() => {
                    return Users.find();
                })
                .then((users) => {
                    users.should.have.length(1);
                    assert.equal(users[0].name, 'test user');
                });
        });
    });
    describe('withoud fields', () => {
        it('should fail creating a book', () => {
            return request(app)
                .post('/api/books')
                .send({})
                .set('Accept', 'application/json')
                .expect(500)
                .then((response) => {
                    return expect(response.body.error).contain('Path `title` is required.');
                });
        });
    });
});
