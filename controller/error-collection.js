'use strict';

class ErrorCollection {
    static invalidModel(model) {
        throw new Error(`model "${model}" is not valid.`);
    }
}

module.exports = ErrorCollection;
