'use strict';
const express = require('express');
const Model = require('./model');
class Controller {
    constructor(model) {
        this.model = new Model(model);
        this._router = express.router();
        this.methods = ['put', 'post', 'get', 'delete', 'head'];
        this._outgoingFormat = (doc) => {
            return doc;
        };
        this._chunkLimit = 10;
    }
    request(middleware) {
        this._router.use(middleware);
        return this;
    }
    set outgoing(middleware) {
        this._outgoingFormat = middleware;
    }
    _buildGet() {
        this._router.get(`/${this.model}/:id?`, (req, res, next) => {
            if(req.params.id) {
                this.model.findById(req.params.id)
                    .then((response) => {
                        req.rest = {};
                        req.rest.response = response;
                        next();
                    })
                    .catch(next);
            }
        });
        this._router.get(`/${this.model}/:id?`, (req, res) => {
            const response = req.rest.response;
            if(Array.isArray(response)) {
                req.res.response = response.map((doc) => {
                    return this._outgoingFormat(doc);
                });
            }
            req.res.response = this._outgoingFormat(response);
            return res.json(req.res.response);
        });
    }
    _buildErrorHandler() {
        // eslint-disable-next-line no-unused-vars
        this._router.use(function(err, req, res, next) {
            res.status(500 || err.status).json({
                error: err.message
            });
        });
    }
    build() {
        this._buildGet();
        this._buildErrorHandler();
        return this._router();
    }
}

module.exports = Controller;
