'use strict';
const request = require('supertest');
const assert = require('assert');
const app = require('./mock/app');
const Users = require('./mock/models/users');
const Books = require('./mock/models/books');
describe('GET /api/share', () => {
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
    describe('preloaded data', () => {
        before(() => {
            return Promise.all([
                Users.create({
                    _id: '5c01997482c8985ad9a7eb5b',
                    name:'test user',
                    email: 'test@lts.com'
                }),
                Books.create({
                    title: 'first book',
                    tag: ['first']
                })
            ]);
        });
        after(() => {
            return Promise.all([
                Users.deleteMany({}),
                Books.deleteMany({})
            ]);
        });
        it('should get 1 user & 1 book', () => {
            return request(app)
                .get(`/api/share/${JSON.stringify({books:{}, users:{}})}`)
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.books.length, 1);
                    assert.equal(response.body.users.length, 1);
                    assert.equal(response.body.users[0].name, 'test user');
                });
        });
        it('should get 1 user with only _id parameter', () => {
            return request(app)
                .get(`/api/share/${JSON.stringify({books:{}, users:{select:'_id'}})}`)
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.books.length, 1);
                    assert.equal(response.body.users.length, 1);
                    assert.equal(response.body.users[0]._id, '5c01997482c8985ad9a7eb5b');
                    assert.equal(Object.hasOwnProperty(response.body.users[0], 'name'), false);
                    assert.equal(Object.hasOwnProperty(response.body.users[0], 'email'), false);
                });
        });
        it('should get distinct email', () => {
            return request(app)
                .get(`/api/share/${JSON.stringify({books:{}, users:{distinct:'email'}})}`)
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.books.length, 1);
                    assert.equal(response.body.users.length, 1);
                    assert.equal(response.body.users[0], 'test@lts.com');
                });
        });
        it('should get user by id', () => {
            return request(app)
                .get(`/api/share/${JSON.stringify({books:{}, users:{conditions:{_id:'5c01997482c8985ad9a7eb5b'}}})}`)
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.books.length, 1);
                    assert.equal(response.body.users[0].name, 'test user');
                    assert.equal(response.body.users[0].email, 'test@lts.com');
                });
        });
        it('should return empty array for user', () => {
            return request(app)
                .get(`/api/share/${JSON.stringify({books:{}, users:{conditions:{_id:'5c01997482c8985ad9a7eb5c'}}})}`)
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.books.length, 1);
                    assert.equal(response.body.users.length, 0);
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
                }),
                Books.create({
                    title: 'first book',
                    tag: ['first']
                })
            ]);
        });
        after(() => {
            return Promise.all([
                Users.deleteMany({}),
                Books.deleteMany({})
            ]);
        });
        it('should get 3 user & 1 book', () => {
            return request(app)
                .get(`/api/share/${JSON.stringify({books:{}, users:{}})}`)
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.books.length, 1);
                    assert.equal(response.body.users.length, 3);
                    assert.equal(response.body.users[0].name, 'test user');
                });
        });
        it('should return count user', () => {
            return request(app)
                .get(`/api/share/${JSON.stringify({books:{}, users:{count:true}})}`)
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.books.length, 1);
                    assert.equal(response.body.users, 3);
                });
        });
        it('should return count user with conditions', () => {
            return request(app)
                .get(`/api/share/${JSON.stringify({books:{}, users:{count:true, conditions:{email:'main.lex@lts.com'}}})}`)
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.users, 1);
                    assert.equal(response.body.books.length, 1);
                });
        });
        it('should 1 user using conditions', () => {
            return request(app)
                .get(`/api/share/${JSON.stringify({books:{}, users:{conditions:{email:'main.lex@lts.com'}}})}`)
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.books.length, 1);
                    assert.equal(response.body.users.length, 1);
                    assert.equal(response.body.users[0]._id, '5c01997482c8985ad9a7eb5d');
                    assert.equal(response.body.users[0].name, 'lex');
                });
        });
        it('should return 2 user with limit', () => {
            return request(app)
                .get(`/api/share/${JSON.stringify({books:{}, users:{limit:2}})}`)
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.books.length, 1);
                    assert.equal(response.body.users.length, 2);
                });
        });
        it('should return users sorted by email', () => {
            return request(app)
                .get(`/api/share/${JSON.stringify({books:{}, users:{sort:'email'}})}`)
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.books.length, 1);
                    assert.equal(response.body.users.length, 3);
                    assert.equal(response.body.users[0].email, 'aaaa@lts.com');
                });
        });
        it('should return skyp first user sorted by email', () => {
            return request(app)
                .get(`/api/share/${JSON.stringify({books:{}, users:{sort:'email', skip:1}})}`)
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.books.length, 1);
                    assert.equal(response.body.users.length, 2);
                    assert.equal(response.body.users[0].email, 'main.lex@lts.com');
                });
        });
    });
    describe('populate', () => {
        let bookId;
        before(() => {
            return Books.create({
                title: 'first book',
                tag: ['first']
            }).then((book) => {
                bookId = book._id;
                return Promise.all([
                    Users.create({
                        _id: '5c01997482c8985ad9a7eb5b',
                        name:'test user',
                        email: 'test@lts.com',
                        books:[bookId]
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
        });
        after(() => {
            return Promise.all([
                Users.deleteMany({}),
                Books.deleteMany({})
            ]);
        });
        it('should get user & book by id', () => {
            return request(app)
                .get(`/api/share/${JSON.stringify({books:{}, users:{populate:'books', conditions:{_id:'5c01997482c8985ad9a7eb5b'}}})}`)
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.books.length, 1);
                    assert.equal(response.body.users[0].name, 'test user');
                    assert.equal(response.body.users[0].email, 'test@lts.com');
                    assert.equal(response.body.users[0].books.length, 1);
                    assert.equal(response.body.users[0].books[0].title, 'first book');
                });
        });
        it('should get all user with book data', () => {
            return request(app)
                .get(`/api/share/${JSON.stringify({books:{}, users:{populate:'books'}})}`)
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.books.length, 1);
                    assert.equal(response.body.users.length, 3);
                    assert.equal(response.body.users[0].name, 'test user');
                    assert.equal(response.body.users[0].email, 'test@lts.com');
                    assert.equal(response.body.users[0].books.length, 1);
                    assert.equal(response.body.users[0].books[0].title, 'first book');
                });
        });
        it('should get users with book data', () => {
            return request(app)
                .get(`/api/share/${JSON.stringify({books:{}, users:{populate:'books', conditions:{books:{$not:{$size:0}}}}})}`)
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.books.length, 1);
                    assert.equal(response.body.users.length, 1);
                    assert.equal(response.body.users[0].name, 'test user');
                    assert.equal(response.body.users[0].email, 'test@lts.com');
                    assert.equal(response.body.users[0].books.length, 1);
                    assert.equal(response.body.users[0].books[0].title, 'first book');
                });
        });
    });
});
