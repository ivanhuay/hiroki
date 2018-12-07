'use strict';

function decorator(controller) {
    controller.outgoing = (doc) => {
        doc.customField = 'awesome hiroki';
        return doc;
    };
}

module.exports = decorator;
