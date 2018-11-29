'use strict';
const express = require('express');
const Model = require('./model');
const pluralize = require('pluralize');
const ErrorCollection = require('./error-collection');
class Controller {
    constructor(model, config) {
        this.model = new Model(model);
        this.config = config || {};
        this.routeName = pluralize(this.model.modelName);
        if(this.config.disabledPluralize === false) {
            this.routeName = this.model.modelName;
        }
        this._router = express.router();
        this.methods = ['put', 'post', 'get', 'delete', 'head'];
        this._outgoingFormat = (doc) => {
            return doc;
        };
        this._chunkLimit = 10;
    }
    request(middleware) {
        this._router.use(middleware);
        return this;
    }
    set outgoing(middleware) {
        this._outgoingFormat = middleware;
    }
    _buildRestObject() {
        this._router.use((req, res, next) => {
            if(!req.rest) {
                req.rest = {};
            }
            next();
        });
    }
    _outgoingRoute(req, res) {
        const response = req.rest.response;
        if(Array.isArray(response)) {
            req.res.response = response.map((doc) => {
                return this._outgoingFormat(doc);
            });
        }
        req.rest.response = this._outgoingFormat(response);
        return res.status(req.rest.status || 200).json(req.res.response);
    }
    _buildGet() {
        this._router.get(`/${this.routeName}/:id?`, (req, res, next) => {
            if(req.params.id) {
                return this.model.findById(req.params.id)
                    .then((response) => {
                        req.rest.response = response;
                        next();
                    })
                    .catch(next);
            }
            return this.model.find(req.query);
        }, this._outgoingRoute);
    }
    _buildPost() {
        this._router.post(`/${this.routeName}`, (req, res, next) => {
            this.model.create(req.body)
                .then((doc) => {
                    req.rest.response = doc;
                    req.rest.status = 201;
                    next();
                })
                .catch(next);
        }, this._outgoingRoute);
    }
    _buildPut() {
        this._router.put(`/${this.routeName}/:id?`, (req, res, next) => {
            if(req.params.id) {
                return this.model.updateById(req.params.id, req.body)
                    .then((response) => {
                        req.rest.response = response;
                        next();
                    })
                    .catch(next);
            } if(req.query.conditions) {
                return this.model.updateByConditions(req.query.conditions, req.body)
                    .then((response) => {
                        req.rest.response = response;
                        next();
                    })
                    .catch(next);
            }
            return ErrorCollection.paramRequired('id or conditions');
        }, this._outgoingRoute);
    }
    _buildDelete() {
        this._router.delete(`/${this.routeName}/:id`, (req, res, next) => {
            return this.model.delete(req.params.id)
                .then((response) => {
                    req.rest.response = response;
                    next();
                })
                .catch(next);
        }, this._outgoingRoute);
    }
    _buildErrorHandler() {
        // eslint-disable-next-line no-unused-vars
        this._router.use(function(err, req, res, next) {
            res.status(500 || err.status).json({
                error: err.message
            });
        });
    }
    build() {
        this._buildRestObject();
        this._buildPost();
        this._buildGet();
        this._buildPut();
        this._buildDelete();
        this._buildErrorHandler();
        return this._router();
    }
}

module.exports = Controller;
