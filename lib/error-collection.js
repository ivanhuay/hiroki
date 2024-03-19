'use strict';
//TODO: check new errors or unnecesary

class ErrorCollection {
    static invalidModel(model) {
        throw new Error(`model "${model}" is not valid.`);
    }
    static invalidConditions(conditions) {
        throw new Error(`invalid conditions json: "${conditions}".`);
    }
    static malformedConditions(conditions, parseError) {
        const parseMsg = parseError && parseError.message || '';
        throw new Error(`malformed conditions json: "${conditions}". ${parseMsg}`);
    }
    static paramRequired(paramsString, status) {
        const error = new Error(`params ${paramsString} required`);
        error.status = status;
        throw error;
    }
    static documentNotFound(status) {
        const error = new Error('Document not found.');
        error.status = status;
        throw error;
    }
    static requestArgumentRequired() {
        const error = new Error('Request method require at least a callback o methods and callback.');
        throw error;
    }
    static requestRequireCallback() {
        return new Error('Request method require a callback function.');
    }
    static requestInvalidMethod(method, validMethodsStr) {
        return new Error(`Request method "${method}" is not valid. Only ${validMethodsStr} are allowed.`);
    }
    static invalidMethod(method, validMethodsStr) {
        return new Error(`Request method "${method}" is not valid. Only ${validMethodsStr} are allowed.`);
    }
    static invalidMethod(method, validMethodsStr) {
        return new Error(`Request method "${method}" is not valid. Only ${validMethodsStr} are allowed.`);
    }
    static invalidConditions(message, status) {
        const error = new Error(`Invalid conditions: ${message}`);
        error.status = status || 500;
        throw error;
    }
    static invalidMiddleware(middlewareName) {
        throw new Error(`Middleware "${middlewareName}" should be a function.`);
    }
    static invalidEnum(value, expected) {
        throw new Error(`Invalid Enum value "${value}" should be a one of "${expected.join(',')}"`);
    }
}

module.exports = ErrorCollection;
