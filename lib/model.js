'use strict';
const mongoose = require('mongoose');
const Validator = require('./validator');
class Model {
    constructor(model) {
        Validator.validateModel(model);
        if(typeof model === 'string') {
            this.model = mongoose.model(model);
        }else{
            this.model = model;
        }
        this._methods = this._methodsVersion();
        this.modelName = this.model.modelName;
    }
    _methodsVersion() {
        const latestVersion = mongoose.version >= '5';
        return {
            count: latestVersion && 'estimatedDocumentCount' || 'count',
            delete: latestVersion && 'deleteOne' || 'delete'
        };
    }
    _parseOptions(query) {
        let options = {};
        if(query.skip) {
            options.skip = parseInt(query.skip);
        }
        if(query.limit) {
            options.limit = parseInt(query.limit);
        }
        if(query.sort) {
            options.sort = query.sort;
        }
        return options;
    }
    _parsePopulate(query) {
        let populate = false;
        if(query.populate) {
            try {
                populate = JSON.parse(query.populate);
            } catch (e) {
                populate = query.populate;
            }
        }
        return populate;
    }
    _parseConditions(conditions) {
        if(!conditions) {
            return {};
        }
        Validator.validateConditions(conditions);
        return JSON.parse(conditions);
    }
    findById(id, queryParams) {
        const populate = this._parsePopulate(queryParams);
        let query = this.model.findById(id);
        if(populate) {
            query = query.populate(populate);
        }
        return query.then((doc) => {
            Validator.validateDocumentExist(doc, 404);
            return doc;
        });
    }
    find(queryParams) {
        const conditions = this._parseConditions(queryParams.conditions);
        const populate = this._parsePopulate(queryParams);
        const select = queryParams.select || null;
        const options = this._parseOptions(queryParams);
        let query  = this.model.find(conditions, select, options);
        if(populate) {
            query = query.populate(populate);
        }
        return query;
    }
    count(query) {
        const conditions = this._parseConditions(query.conditions);
        return this.model[this._methods.count](conditions);
    }
    updateByConditions(conditions, set) {
        Validator.validateConditions(conditions);
        return this.model.findOneAndUpdate(this._parseConditions(conditions), {$set:set}, {new:true})
            .then((doc) => {
                Validator.validateDocumentExist(doc, 404);
                return doc;
            });
    }
    updateById(id, set) {
        return this.model.findByIdAndUpdate(id, {$set:set}, {new:true});
    }
    delete(id) {
        return this.findById(id)
            .then((doc) => {
                Validator.validateDocumentExist(doc);
                return this.model[this._methods.delete]({_id:id})
                    .then(() => {
                        return doc;
                    });
            });
    }
    create(body) {
        let newDoc = new this.model(body);
        return newDoc.save();
    }
}

module.exports = Model;
