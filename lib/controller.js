'use strict';
//TODO: remove express
const express = require('express');
const bodyParser = require('body-parser');
const Model = require('./mongoose-connector');
const pluralize = require('pluralize');
const Validator = require('./validator');
let router;
class Controller {
    constructor(model, config) {
        this.model = new Model(model);
        this.config = {shareQueryEnabled: false, fastUpdate: 'disabled', ...config};
        Validator.validateEnum(this.config.fastUpdate, ['enabled', 'disabled', 'optional']);
        this.routeName = pluralize(this.model.modelName);
        if(this.config.disabledPluralize === false) {
            this.routeName = this.model.modelName;
        }
        if(!router) {
            router = express.Router();
            router.use(bodyParser.json({
                extended: true
            }));
            router.use(bodyParser.urlencoded({
                extended: true
            }));
        }
        this._router = router;
        this._disabledMethods = [];
        this._outgoingFormat = false;
        this._beforeEnd = (req, res, next) => {
            next();
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
            this._router.use(`/${this.routeName}/`, arguments[0]);
            return this;
        }
        if(arguments.length === 2) {
            middleware = arguments[1];
            methods = arguments[0].split(' ');
            methods.forEach((method) => {
                const path = ['get', 'put', 'delete'].includes(method) ?
                    `/${this.routeName}/:id?` : `/${this.routeName}/`;
                this._router[method](path, middleware);
            });
        }
        return this;
    }
    // TODO unnecesary for v2
    set disabledMethods(methods) {
        Validator.validaMethods(methods, this.validMethods);
        this._disabledMethods = methods.split(' ');
    }
    // TODO unnecesary for v2
    get disabledMethods() {
        return this._disabledMethods.join(' ');
    }
    // TODO unnecesary for v2
    set outgoing(middleware) {
        Validator.validateCallback(middleware, 'outgoing');
        this._outgoingFormat = middleware;
    }
    // TODO unnecesary for v2
    _buildRestObject() {
        this._router.use((req, res, next) => {
            if(!req.rest) {
                req.rest = {};
            }
            next();
        });
    }
    // TODO unnecesary for v2
    get _sendResponse() {
        return (req, res) => {
            const headers = {};
            if(req.rest.count) {
                headers['hiroki-total-count'] = req.rest.count;
            }
            return res.set(headers).status(req.rest.status || 200).json(req.rest.response);
        };
    }
    // TODO unnecesary for v2
    get _outgoingRoute() {
        return (req, res, next) => {
            if(!this._outgoingFormat) {
                next();
                return;
            }
            const response = req.rest.response;
            if(Array.isArray(response)) {
                req.rest.response = response.map((doc) => {
                    return this._outgoingFormat(doc.toJSON());
                });
            }else if(typeof response === 'object') {
                req.rest.response = this._outgoingFormat(response.toJSON());
            }
            next();
        };
    }
    // TODO unnecesary for v2
    get beforeEnd() {
        return this._beforeEnd;
    }
    // TODO unnecesary for v2
    set beforeEnd(middleware) {
        Validator.validateCallback(middleware, 'beforeEnd');
        this._beforeEnd = middleware;
    }
    // TODO unnecesary for v2, count would be a query param only
    _parseHeaders() {
        this._router.use(`/${this.routeName}/`, (req, res, next) => {
            if(
                req.headers &&
                req.headers.hiroki === 'count'
            ) {
                return this.model.count()
                    .then((count) => {
                        req.rest.count = count;
                        next();
                    })
                    .catch(next);
            }
            return next();
        });
    }
    // TODO: check the usage
    queryGet(query) {
        if(query.count) {
            return this.model.count(query);
        }
        if(query.distinct) {
            return this.model.distinct(query.distinct);
        }
        return this.model.find(query);
    }
    // TODO refactor for v2
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
            return this.queryGet(req.query)
                .then((response) => {
                    req.rest.response = response;
                    next();
                });
        }, this._outgoingRoute, this.beforeEnd, this._sendResponse);
    }
    // TODO refactor for v2
    _buildPost() {
        if(this._disabledMethods.indexOf('post') !== -1) {
            return;
        }
        this._router.post(`/${this.routeName}`, (req, res, next) => {
            return this.model.create(req.body)
                .then((doc) => {
                    req.rest.response = doc;
                    req.rest.status = 201;
                    next();
                })
                .catch(next);
        }, this._outgoingRoute, this.beforeEnd, this._sendResponse);
    }
    // TODO refactor for v2
    _buildPut() {
        if(this._disabledMethods.indexOf('put') !== -1) {
            return;
        }
        this._router.put(`/${this.routeName}/:id?`, (req, res, next) => {
            Validator.validatePutParams(req.params);
            let fast = this.config.fastUpdate === 'enabled' ||
                (this.config.fastUpdate === 'optional' && this.query.fast);
            if(req.params.id) {
                return this.model.updateById(req.params.id, req.body, {fast})
                    .then((response) => {
                        req.rest.response = response;
                        next();
                    })
                    .catch(next);
            }
            return this.model.updateByConditions(req.query.conditions, req.body, {fast})
                .then((response) => {
                    req.rest.response = response;
                    next();
                })
                .catch(next);
        }, this._outgoingRoute, this.beforeEnd, this._sendResponse);
    }
    // TODO refactor for v2
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
        }, this._outgoingRoute, this.beforeEnd, this._sendResponse);
    }
    // TODO refactor for v2
    _buildErrorHandler() {
        this._disabledMethods.forEach((method) => {
            // eslint-disable-next-line no-unused-vars
            this._router[method](`/${this.routeName}/`, (err, req, res, next) => {
                res.status(404).json({
                    error: err.message || 'not_found'
                });
            });
        });
        // eslint-disable-next-line no-unused-vars
        this._router.use(`/${this.routeName}/`, (err, req, res, next) => {
            res.status(err.status || 500).json({
                error: err.message,
                stack: err.stack
            });
        });
        this._router.use(`/${this.routeName}/`, (req, res) => {
            res.status(404).json({
                error: 'not_found'
            });
        });
    }
    // TODO refactor for v2
    build() {
        this._buildRestObject();
        this._parseHeaders();
        this._buildPost();
        this._buildGet();
        this._buildPut();
        this._buildDelete();
        this._buildErrorHandler();
        return this;
    }
}

module.exports = Controller;
