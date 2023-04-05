'use strict';
const request = require('supertest');
const app = require('./mock/app');
const Users = require('./mock/models/users');
const Books = require('./mock/models/books');
const Draws = require('./mock/models/draws');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const assert = chai.assert;

chai.should();

describe('PUT method', () => {
    let bookId;
    before(() => {
        return Promise.all([
            Users.deleteMany({}),
            Books.deleteMany({}),
            Draws.deleteMany({})
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
            }),
            Draws.create({
                _id: '5c01297482c8985ad9a7eb5c',
                name: 'Alvatro'
            })
        ]);
    });
    afterEach(() => {
        return Promise.all([
            Users.deleteMany({}),
            Books.deleteMany({}),
            Draws.deleteMany({})
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
                    users.should.have.length(1);
                    assert.equal(users[0].name, 'test user updated');
                });
        });
    });
    describe('PUT /api/books', () => {
        it('should update book tag and run presave', () => {
            return request(app)
                .put('/api/books/5c01997482c8985ad9a7eb4b')
                .send({
                    tag:['comic']
                })
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    response.body.tag.should.have.length(1);
                    assert.equal(response.body.tag[0], 'comic');
                    assert.equal(response.body.tagCount, 1);
                });
        });
        it('should update using $push', () => {
            return request(app)
                .put('/api/books/5c01997482c8985ad9a7eb4b')
                .send({
                    tag:{$push:'comic'}
                })
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    response.body.tag.should.have.length(1);
                    assert.equal(response.body.tag[0], 'comic');
                    assert.equal(response.body.tagCount, 1);
                });
        });
        it('should update using $push with an array', () => {
            return request(app)
                .put('/api/books/5c01997482c8985ad9a7eb4b')
                .send({
                    tag:{$push:['comic', 'test']}
                })
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    response.body.tag.should.have.length(2);
                    assert.equal(response.body.tag[0], 'comic');
                    assert.equal(response.body.tag[1], 'test');
                    assert.equal(response.body.tagCount, 2);
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
                    response.body.tag.should.have.length(1);
                    assert.equal(response.body.tag[0], 'comic');
                    assert.equal(response.body.title, 'second book');
                });
        });
        it('should update by conditions and $pull', () => {
            return request(app)
                .put('/api/books?conditions={"tag":"asd"}')
                .send({
                    tag:{$pull:['asd']}
                })
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    response.body.tag.should.have.length(0);
                    assert.equal(response.body.title, 'second book');
                });
        });
        it('should update by conditions and $pull with multiple data', () => {
            return request(app)
                .put('/api/books?conditions={"tag":"hiroki"}')
                .send({
                    tag:{$pull:['hiroki', 'awesome']}
                })
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    response.body.tag.should.have.length(1);
                    console.log('response.body.tag[0]: ', response.body.tag[0])
                    response.body.tag[0].should.be.equal('rock');
                    response.body.title.should.be.equal('3 book');
                });
        });
        it('should fail with 404', () => {
            return request(app)
                .put('/api/books?conditions={"tag":"zfc"}')
                .send({
                    tag:['comic']
                })
                .set('Accept', 'application/json')
                .expect(404)
                .then((response) => {
                    assert.equal(response.body.error, 'Document not found.');
                });
        });
    });
    describe('PUT /api/draws', () => {
        it('fast update should not run pre-save', () => {
            return request(app)
                .put('/api/draws/5c01297482c8985ad9a7eb5c')
                .send({
                    'name':'some bird'
                })
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    return assert.isUndefined(response.body.type);
                });
        });
    });
});
