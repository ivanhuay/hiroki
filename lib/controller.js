'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const Model = require('./model');
const pluralize = require('pluralize');
const Validator = require('./validator');
let router;
class Controller {
    constructor(model, config) {
        this.model = new Model(model);
        this.config = config || {};
        this.routeName = pluralize(this.model.modelName);
        if(this.config.disabledPluralize === false) {
            this.routeName = this.model.modelName;
        }
        if(!router) {
            router = express.Router();
            router.use(bodyParser());
        }
        this._router = router;
        this.methods = ['put', 'post', 'get', 'delete', 'head'];
        this._disabledMethods = [];
        this._outgoingFormat = (doc) => {
            return doc;
        };
    }
    static getRouter() {
        return router;
    }
    request() {
        Validator.validateRequestArgument(arguments, this.validMethods);
        let middleware;
        let methods;
        if(arguments.length === 1) {
            middleware = arguments[0];
            this._router.use(arguments[0]);
            return this;
        }
        if(arguments.length === 2) {
            middleware = arguments[1];
            methods = arguments[0].split(' ');
            methods.forEach((method) => {
                this._router[method](middleware);
            });
        }
        return this;
    }
    set disabledMethods(methods) {
        Validator.validaMethods(methods, this.validMethods);
        this._disabledMethods = methods.split(' ');
    }
    get disabledMethods() {
        return this._disabledMethods.join(' ');
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
    get _outgoingRoute() {
        return (req, res) => {
            const response = req.rest.response;
            if(Array.isArray(response)) {
                req.rest.response = response.map((doc) => {
                    return this._outgoingFormat(doc);
                });
            }
            if(typeof response === 'object') {
                req.rest.response = this._outgoingFormat(response);
            }
            return res.status(req.rest.status || 200).json(req.rest.response);
        };
    }
    _buildGet() {
        this._router.get(`/${this.routeName}/:id?`, (req, res, next) => {
            if(req.params.id) {
                return this.model.findById(req.params.id, req.query)
                    .then((response) => {
                        req.rest.response = response;
                        next();
                    })
                    .catch(next);
            }
            if(req.query.count) {
                return this.model.count(req.query)
                    .then((response) => {
                        req.rest.response = response;
                        next();
                    });
            }
            return this.model.find(req.query)
                .then((response) => {
                    req.rest.response = response;
                    next();
                });
        }, this._outgoingRoute);
    }
    _buildPost() {
        if(this._disabledMethods.indexOf('post') !== -1) {
            return;
        }
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
        if(this._disabledMethods.indexOf('put') !== -1) {
            return;
        }
        this._router.put(`/${this.routeName}/:id?`, (req, res, next) => {
            Validator.validatePutParams(req.params);
            if(req.params.id) {
                return this.model.updateById(req.params.id, req.body)
                    .then((response) => {
                        req.rest.response = response;
                        next();
                    })
                    .catch(next);
            }
            return this.model.updateByConditions(req.query.conditions, req.body)
                .then((response) => {
                    req.rest.response = response;
                    next();
                })
                .catch(next);
        }, this._outgoingRoute);
    }
    _buildDelete() {
        if(this._disabledMethods.indexOf('delete') !== -1) {
            return;
        }
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
        this._disabledMethods.forEach((method) => {
            // eslint-disable-next-line no-unused-vars
            this._router[method]((err, req, res, next) => {
                res.status(400).json({
                    error: err.message || 'not_found'
                });
            });
        });
        // eslint-disable-next-line no-unused-vars
        this._router.use((err, req, res, next) => {
            res.status(err.status || 500).json({
                error: err.message,
                stack: err.stack
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
        return this._router;
    }
}

module.exports = Controller;
