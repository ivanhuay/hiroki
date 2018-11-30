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
        if(!this.controllers[model]) {
            this.controllers[model] = new Controller(model);
        }
        return this.controllers[model];
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
