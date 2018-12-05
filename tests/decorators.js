'use strict';
const request = require('supertest');
const assert = require('assert');
const app = require('./mock/app');
const Birds = require('./mock/models/birds');
describe('DECORATORS', () => {
    before(() => {
        return Birds.deleteMany({});
    });
    after(() => {
        return Birds.deleteMany({});
    });
    describe('birds decorator', () => {
        before(() => {
            return Promise.all([
                Birds.create({
                    _id: '5c01997482c8985ad9a7eb5b',
                    name:'bird 1'
                }),
                Birds.create({
                    _id: '5c01997482c8985ad9a7eb5c',
                    name:'bird 2'
                }),
                Birds.create({
                    _id: '5c01997482c8985ad9a7eb5d',
                    name:'bird 3'
                }),
                Birds.create({
                    _id: '5c01997482c8985ad9a7eb5e',
                    name:'bird 4'
                })
            ]);
        });
        after(() => {
            return Birds.deleteMany({});
        });
        it('should get return unauthorized', () => {
            return request(app)
                .del('/api/birds')
                .set('Accept', 'application/json')
                .expect(401)
                .then((response) => {
                    assert.equal(response.body.error, 'unauthorized');
                });
        });
        it('should get birds with override limit', () => {
            return request(app)
                .get('/api/birds?limit=10')
                .set('Accept', 'application/json')
                .expect(200)
                .then((response) => {
                    assert.equal(response.body.length, 2);
                });
        });
    });
});
