'use strict';
const request = require('supertest');
const assert = require('assert');
const app = require('./mock/app');
const Docs = require('./mock/models/docs');
describe('OUTGOING', () => {
    before(() => {
        return Docs.deleteMany({});
    });
    after(() => {
        return Docs.deleteMany({});
    });
    describe('Docs outgoing formating', () => {
        before(() => {
            return Promise.all([
                Docs.create({
                    _id: '5c01997482c8985ad9a7eb5b',
                    name:'doc 1'
                }),
                Docs.create({
                    _id: '5c01997482c8985ad9a7eb5c',
                    name:'doc 2'
                }),
                Docs.create({
                    _id: '5c01997482c8985ad9a7eb5d',
                    name:'doc 3'
                }),
                Docs.create({
                    _id: '5c01997482c8985ad9a7eb5e',
                    name:'doc 4'
                })
            ]);
        });
        after(() => {
            return Docs.deleteMany({});
        });
        it('should get all docs with customField', () => {
            return request(app)
                .get('/api/docs')
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.length, 4);
                    assert.equal(response.body[0].customField, 'awesome hiroki');
                    assert.equal(response.body[1].customField, 'awesome hiroki');
                    assert.equal(response.body[2].customField, 'awesome hiroki');
                    assert.equal(response.body[3].customField, 'awesome hiroki');
                });
        });
        it('should get one doc with customField', () => {
            return request(app)
                .get('/api/docs/5c01997482c8985ad9a7eb5e')
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.customField, 'awesome hiroki');
                });
        });
    });
});
