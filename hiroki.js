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
        this.controllers = {};
        this._router = express.Router();
        instance = this;
        return instance;
    }
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
    _buildShare() {
        const router = express.Router();
        router.get('/share/:shareParams', (req, res, next) => {
            Validator.validateConditions(req.shareParams);
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
                    return res.json(shareResponse);
                })
                .catch(next);
        });
        return router;
    }
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
