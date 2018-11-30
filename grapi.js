'use strict';
const Controller = require('./lib/controller');
const Validator = require('./lib/validator');
class Grapi {
    constructor() {
        this.controllers = {};
    }
    rest(model) {
        Validator.validateModel(model);
        if(!this.controllers[model]) {
            this.controllers[model] = new Controller(model);
        }
        return this.controllers[model];
    }
    build() {
        Object.values(this.controllers)
            .forEach((controller) => {
                controller.build();
            });
    }
}
const grapi = new Grapi();

module.exports = grapi;
