'use strict';
const Controller = require('./lib/controller');
const Validator = require('./lib/validator');
const express = require('express');
let instance;
class Hiroki {
    constructor() {
        if(instance) {
            return instance;
        }
        this.models = {};
        //TODO: remove controllers
        this.controllers = {};
        this._outgoingShareFormat = false;
        this._beforeShareEnd = false;
        this._router = express.Router();
        this._beforeShareEnd = (req, res, next) => {
            next();
        };
        instance = this;
        return instance;
    }
    importModel(model, options) {
        Validator.validateModel(model);
        let modelName = model;
        if(model.hasOwnProperty('modelName')) {
            modelName = model.modelName;
        }
        modelName = modelName.toLowerCase();
        if(!this.controllers[modelName]) {
            this.controllers[modelName] = new Controller(model, options);
        }
        return this.controllers[modelName];
    }
    importModels(models, options) {
        models.forEach((model) => {
            this.importModel(model, options);
        });
    }
    // TODO: remove rest function
    rest(model, options) {
        Validator.validateModel(model);
        let modelName = model;
        if(model.hasOwnProperty('modelName')) {
            modelName = model.modelName;
        }
        modelName = modelName.toLowerCase();
        if(!this.controllers[modelName]) {
            this.controllers[modelName] = new Controller(model, options);
        }
        return this.controllers[modelName];
    }
    // TODO: refactor this to "multiple" route
    set shareFormat(formatSyncFunction) {
        this._outgoingShareFormat = formatSyncFunction;
    }
    // TODO: unnecesary for v2, should be removed
    set beforeShareEnd(middleware) {
        this._beforeShareEnd = middleware;
    }
    // TODO: unnecesary for v2, should be removed
    get beforeShareEnd() {
        return this._beforeShareEnd;
    }
    // TODO: refactor this to "multiple" route
    _shareFormat(response) {
        if(!this._outgoingShareFormat) {
            return response;
        }
        Object.keys(response).forEach((collection) => {
            if(Array.isArray(response[collection])) {
                response[collection] = response[collection].map((doc) => {
                    let docElm = typeof doc === 'object' ? doc.toJSON() : doc;
                    return this._outgoingShareFormat(docElm, collection);
                });
            }else if(typeof response[collection] === 'object') {
                response[collection] = this._outgoingShareFormat(response[collection].toJSON(), collection);
            }
        });
        return response;
    }
    // TODO: refactor this to "multiple" route
    _buildShare() {
        const router = express.Router();
        router.get('/share/:shareParams', (req, res, next) => {
            Validator.validateConditions(req.params.shareParams);
            const shareParams = JSON.parse(req.params.shareParams);
            const shareResponse = {};
            const promises = Object.keys(shareParams)
                .map((modelName) => {
                    const params = shareParams[modelName];
                    const currentController = this.controllers[modelName];
                    if(!currentController || !currentController.config.shareQueryEnabled) {
                        return false;
                    }
                    return currentController.queryGet(params)
                        .then((response) => {
                            shareResponse[modelName] = response;
                        });
                });
            Promise.all(promises)
                .then(() => {
                    req.shareResponse = this._shareFormat(shareResponse);
                    return next();
                })
                .catch(next);
        }, this.beforeShareEnd, this._sendShare);
        return router;
    }
    // TODO: remove unncesary for v2
    _sendShare(req, res) {
        res.json(req.shareResponse);
    }
    // TODO: reafactor errors
    _buildGlobalError() {
        const router = express.Router();
        // eslint-disable-next-line no-unused-vars
        router.use('/', (err, req, res, next) => {
            res.status(err.status || 500).json({
                error: err.message,
                stack: err.stack
            });
        });
        router.use('/', (req, res) => {
            res.status(404).json({
                error: 'not_found'
            });
        });
        return router;
    }
    // TODO: remove and refactor config.
    build(config) {
        let path = config && config.path || '/api';
        Object.values(this.controllers)
            .forEach((controller) => {
                controller.build();
            });
        return express.Router().use(path, Controller.getRouter(), this._buildShare(), this._buildGlobalError());
    }
}

module.exports = Hiroki;
