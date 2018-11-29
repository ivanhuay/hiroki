'use strict';
const Controller = require('./controller');
const Validator = require('./validator');
let instance;
class Grapi {
    constructor() {
        if(!instance) {
            instance = this;
        }
        this.controllers = {};
        return instance;
    }
    static rest(model) {
        Validator.validateModel(model);
        if(!this.controllers[model]) {
            this.controllers[model] = new Controller(model);
        }
        return this.controllers[model];
    }
}


module.exports = Grapi;
