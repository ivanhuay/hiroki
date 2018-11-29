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
        this.modelName = this.model.modelName;
    }
    findById(id) {
        return this.model.findOneById(id);
    }
    _parseOptions(query) {
        let options = {};
        if(query.skyp) {
            options.skyp = query.skyp;
        }
        if(query.skyp) {
            options.skyp = query.skyp;
        }
        if(query.sort) {
            options.sort = query.sort;
        }
        return options;
    }
    find(query) {
        const conditions = query.conditions || {};
        const select = query.select || null;
        const options = this._parseOptions(query);
        return this.model.find(conditions, select, options);
    }
    create(body) {
        let newDoc = new this.model(body);
        return newDoc.save();
    }
}

module.exports = Model;
