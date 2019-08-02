'use strict';
const hiroki = require('../../index');
const models = require('./models');
const decorators = require('./decorators');

function buildHiroki() {
    Object.keys(models).forEach((modelName) => {
        const options = modelName === 'Draws' ? {fastUpdate: 'enabled'} : {};
        const controller = hiroki.rest(models[modelName], options);
        if (decorators.hasOwnProperty(modelName)) {
            decorators[modelName](controller);
        }
    });

    return hiroki.build();
}

module.exports = buildHiroki;
