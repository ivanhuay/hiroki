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
        if(!params.hasOwnProperty('id') && !params.hasOwnProperty('conditions')) {
            return ErrorCollection.paramRequired('id or conditions');
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
    // eslint-disable-next-line complexity
    static validateRequestArgument(arg, validMethods) {
        if(!arg || arg.length === 0) {
            ErrorCollection.requestArgumentRequired();
        }
        if(
            (arg.length === 1 && typeof arg[0] !== 'function') ||
            (arg.length === 2 && typeof arg[1] !== 'function')
        ) {
            ErrorCollection.requestRequireCallback();
        }
        if(arg.length === 2 && arg[0] && typeof arg[0] !== 'string') {
            const invalidMethod = arg[0].split(' ').find((method) => validMethods.indexOf(method) === -1);
            if(invalidMethod) {
                ErrorCollection.requestRequireCallback(invalidMethod, validMethods.join(', '));
            }
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
}

module.exports = Validator;
