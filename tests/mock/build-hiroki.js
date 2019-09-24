'use strict';
const hiroki = require('../../index');
const models = require('./models');
const decorators = require('./decorators');

function buildHiroki() {
    Object.keys(models).forEach((modelName) => {
        const options = modelName === 'Draws' ? {fastUpdate: 'enabled'} : {shareQueryEnabled:true};
        const controller = hiroki.rest(models[modelName], options);
        if (decorators.hasOwnProperty(modelName)) {
            decorators[modelName](controller);
        }
    });
    hiroki.shareFormat = (doc, collection) => {
        if(collection === 'books') {
            doc.book = true;
        }
        return doc;
    };
    hiroki.beforeShareEnd = (req, res, next) => {
        req.shareResponse.fakeCollection = [1];
        next();
    };
    return hiroki.build();
}

module.exports = buildHiroki;
