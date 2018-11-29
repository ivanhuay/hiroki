'use strict';
const ErrorCollection = require('./error-collection');

class Validator {
    static validateModel(model) {
        if(!model) {
            return ErrorCollection.invalidModel(model);
        }
        const modelType = typeof model;
        if(modelType === 'string') {
            return true;
        }
        if(['function', 'object'].indexOf(modelType) && model.hasOwnProperty('modelName')) {
            return true;
        }

        return ErrorCollection.invalidModel(model);
    }
}

module.exports = Validator;
