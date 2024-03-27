'use strict';
const Controller = require('./lib/controller');
const ErrorCollection = require('./lib/error-collection');
const Validator = require('./lib/validator');

let instance;
class Hiroki {
    constructor() {
        if(instance) {
            return instance;
        }
        this.defaultConfig = {
            basePath: '/api'
        };
        this.config = {...this.defaultConfig};
        this.models = {};
        this.controllers = {};
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
            this.controllers[modelName] = new Controller(model, {...this.defaultConfig, ...options});
        }
        return this.controllers[modelName];
    }
    importModels(models, options) {
        if(Array.isArray(models)) {
            models.forEach((model) => {
                this.importModel(model, options);
            });
        }
        if (typeof models === 'object') {
            Object.values(models).forEach((model) => {
                this.importModel(model, options);
            });
        }
    }
    
    setConfig(newConf) {
        this.config = {
            ...this.defaultConfig,
            ...newConf
        };
    }
    async process(_path, params) {
        const path = _path.replace(/\/\//ig, '/');
        const currentController = Object.values(this.controllers)
            .find((controller) =>
                controller.check(path)
            );
        if(!currentController) {
            ErrorCollection.notFound(path);
        }
        try {
            return await currentController.process(path, params);
        } catch (error) {
            console.error('Hiroki Error: ', error);
            return {error: error.message, status: error.status || 500};
        }
    }
}

module.exports = Hiroki;
