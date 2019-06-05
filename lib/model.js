'use strict';
const mongoose = require('mongoose');
const Validator = require('./validator');
class Model {
    constructor(model) {
        Validator.validateModel(model);
    }
    _parseOptions(query) {
        let options = {
            sort:'_id'
        };
        if(query.skip) {
            options.skip = parseInt(query.skip);
        }
        if(query.limit) {
            options.limit = parseInt(query.limit);
        }
        if(query.sort) {
            options.sort = query.sort;
        }
        if(query.select) {
            options.select = query.select;
        }
        return options;
    }
    _parsePopulate(query) {
        let populate = false;
        if(query && query.populate) {
            try {
                populate = JSON.parse(query.populate);
            } catch (e) {
                populate = query.populate;
            }
        }
        return populate;
    }
    _parseConditions(conditions) {
        if(!conditions) {
            return {};
        }
        Validator.validateConditions(conditions);
        if(typeof conditions === 'object') {
            return conditions;
        }
        return JSON.parse(conditions);
    }
}

module.exports = Model;
