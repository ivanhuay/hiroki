'use strict';
const Controller = require('./controller');
const Validator = require('./validator');
class Grapi {
    controllers = {};
    rest(model) {
      Validator.validateModel(model);
      if(!this.controllers[model]){
        this.controllers[model] = new Controller(model);
      }
      return this.controllers[model];
    }
}
