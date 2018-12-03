'use strict';
const request = require('supertest');
const assert = require('assert');
const app = require('./mock/app');
const Users = require('./mock/models/users');
const Books = require('./mock/models/books');
const expect = require('expect.js');
describe('PUT method', () => {
    let bookId;
    before(() => {
        return Promise.all([
            Users.deleteMany({}),
            Books.deleteMany({})
        ]);
    });
    beforeEach(() => {
        return Promise.all([
            Books.create({
                _id: '5c01997482c8985ad9a7eb4b',
                title: 'first book'
            }),
            Books.create({
                _id: '5c01997482c8985ad9a7eb4c',
                title: 'first book',
                tag: ['asd']
            }),
            Users.create({
                _id: '5c01997482c8985ad9a7eb5b',
                name:'test user',
                email: 'test@lts.com',
                books:['5c01997482c8985ad9a7eb4b']
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
    afterEach(() => {
        return Promise.all([
            Users.deleteMany({}),
            Books.deleteMany({})
        ]);
    });
    describe('PUT /api/users', () => {
        it('should update a user', () => {
            return request(app)
                .put('/api/users/5c01997482c8985ad9a7eb5b')
                .send({
                    'name':'test user updated'
                })
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    return assert.equal(response.body.name, 'test user updated');
                })
                .then(() => {
                    return Users.find({_id:'5c01997482c8985ad9a7eb5b'});
                })
                .then((users) => {
                    expect(users).to.have.length(1);
                    expect(users[0].name).to.equal('test user updated');
                });
        });
    });
    describe('PUT /api/books', () => {
        it('should update book tag', () => {
            return request(app)
                .put('/api/books/5c01997482c8985ad9a7eb4b')
                .send({
                    tag:['comic']
                })
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    expect(response.body.tag).to.have.length(1);
                    expect(response.body.tag[0]).to.equal('comic');
                });
        });
        it('should update by conditions', () => {
            return request(app)
                .put('/api/books?conditions={"tag":"asd"}')
                .send({
                    tag:['comic']
                })
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    expect(response.body.tag).to.have.length(1);
                    expect(response.body.tag[0]).to.equal('comic');
                });
        });
        it('should update by conditions', () => {
            return request(app)
                .put('/api/books?conditions={"tag":"zfc"}')
                .send({
                    tag:['comic']
                })
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    expect(response.body.tag).to.have.length(1);
                    expect(response.body.tag[0]).to.equal('comic');
                });
        });
    });
});
