'use strict';
const Validator = require('./validator');
class Model {
    constructor(model) {
        Validator.validateModel(model);
    }
    assign(obj, set) {
        Object.keys(set).forEach((key) => {
            if(set[key].hasOwnProperty('$pull')) {
                obj[key] = obj[key].filter((subitem) => set[key].$pull.indexOf(subitem) === -1);
            } else if(set[key].hasOwnProperty('$push')) {
                obj[key] = obj[key].concat(set[key].$push);
            } else{
                obj[key] = set[key];
            }
        });
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
