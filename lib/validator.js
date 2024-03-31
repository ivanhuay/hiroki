'use strict';
const ErrorCollection = require('./error-collection');
const validModelTypes = ['function', 'object'];
//TODO: check new validations or unnecesary
class Validator {
    static validateModel(model) {
        if(!model) {
            return ErrorCollection.invalidModel(model);
        }
        const modelType = typeof model;
        if(modelType === 'string') {
            return true;
        }
        if(validModelTypes.indexOf(modelType) !== -1 && model.hasOwnProperty('modelName')) {
            return true;
        }
        return ErrorCollection.invalidModel(model);
    }

    static validateConditions(conditions) {
        let response;

        if(!conditions || typeof conditions === 'object') {
            return true;
        }
        try {
            response = JSON.parse(conditions);
        } catch (error) {
            return ErrorCollection.invalidConditions(error.message);
        }
        return response;
    }

    static validatePutParams(params) {
        const {query} = params;
        if (!query.hasOwnProperty('id') && (
            !query.hasOwnProperty('conditions')
        )) {
            return ErrorCollection.paramRequired('id or conditions');
        }
        return true;
    }
    static validateIdRequired(params) {
        if(!params.id) {
            return ErrorCollection.paramRequired('id', 404);
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
    static validaMethods(methods, validMethods) {
        if(!methods) {
            ErrorCollection.invalidMethod(methods, validMethods.join(', '));
        }
        const invalidMethod = methods.split(' ').find((method) => validMethods.indexOf(method) === -1);
        if(invalidMethod) {
            ErrorCollection.invalidMethod(invalidMethod, validMethods.join(', '));
        }
    }
    static validateBody(params) {
        const {body, method} = params;
        if (['POST', 'PUT'].includes(method) && !body) {
            ErrorCollection.bodyRequired(method);
        }
        return true;
    }
    static validateCallback(callback, callbackName) {
        if(typeof callback !== 'function') {
            ErrorCollection.invalidMiddleware(callbackName);
        }
    }
    static validateEnum(value, expected) {
        if(!expected.includes(value)) {
            ErrorCollection.invalidEnum(value, expected);
        }
    }
    static validateDisabledMethod(method, disabledMethods) {
        if(disabledMethods.indexOf(method) !== -1) {
            ErrorCollection.disabledMethod(method);
        }
    }
}

module.exports = Validator;
