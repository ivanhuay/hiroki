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
    static validateConditions(conditions) {
        if(!conditions || Object.keys(conditions).length === 0) {
            return ErrorCollection.invalidConditions(conditions);
        }
        return true;
    }
    static validateConditionsString(conditions) {
        try {
            JSON.parse(conditions);
        } catch (error) {
            return ErrorCollection.malformedConditions(conditions, error);
        }
        return true;
    }
    static validateDocumentExist(doc, status) {
        if(!doc) {
            return ErrorCollection.documentNotFound(status);
        }
        return true;
    }
}

module.exports = Validator;
