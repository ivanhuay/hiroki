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
        instance = this;
        return instance;
    }
    rest(model) {
        Validator.validateModel(model);
        let modelName = model;
        if(model.hasOwnProperty('modelName')) {
            modelName = model.modelName;
        }
        if(!this.controllers[modelName]) {
            this.controllers[modelName] = new Controller(model);
        }
        return this.controllers[modelName];
    }

    build(config) {
        let path = config && config.path || '/api';
        Object.values(this.controllers)
            .forEach((controller) => {
                controller.build();
            });
        return express.Router().use(path, Controller.getRouter());
    }
}

module.exports = Hiroki;
