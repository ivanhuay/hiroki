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
    findById(id) {
        return this.model.findById(id)
            .then((doc) => {
                Validator.validateDocumentExist(doc, 404);
                return doc;
            });
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
    find(query) {
        const conditions = query.conditions || {};
        const select = query.select || null;
        const options = this._parseOptions(query);
        return this.model.find(conditions, select, options);
    }
    count(query) {
        const conditions = query.conditions || {};
        return this.model[this._methods.count](conditions);
    }
    updateByConditions(query, set) {
        Validator.validateConditions(query.conditions);
        return this.model.findOneAndUpdate(query.conditions, {$set:set});
    }
    updateById(id, set) {
        return this.model.findByIdAndUpdate(id, {$set:set});
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
