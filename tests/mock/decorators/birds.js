'use strict';

function decorator(controller) {
    controller.request('delete', function(req, res) {
        return res.status(401).json({
            error: 'unauthorized'
        });
    });
    controller.request('get', function(req, res, next) {
        req.query.limit = 2;
        next();
    });
    controller.request('put', function(req, res, next) {
        res.status(401).json({error: 'unauthorized'});
    });
}

module.exports = decorator;
