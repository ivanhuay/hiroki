'use strict';

function decorator(controller) {
    controller.request('delete', function(req, res) {
        return res.status(401).json({
            error: 'unauthorized'
        });
    });
}

module.exports = decorator;
