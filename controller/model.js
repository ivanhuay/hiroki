'use strict';
const mongoose = require('mongoose');
const Validator = require('./validator');
class Model {
    constructor(model) {
        Validator.validateModel(model);
        if(typeof model === 'string') {
            this.model = mongoose.model(model);
        }else{
            this.model = model;
        }

    }
    findById(id) {
        return this.model.findOneById(id);
    }
}

module.exports = Model;
