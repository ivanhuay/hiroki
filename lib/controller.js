'use strict';
const Model = require('./mongoose-connector');
const pluralize = require('pluralize');
const Validator = require('./validator');
const ErrorCollection = require('./error-collection');

class Controller {
    constructor(model, config) {
        this.model = new Model(model);
        this.config = {fastUpdate: 'disabled', ...config};
        Validator.validateEnum(this.config.fastUpdate, ['enabled', 'disabled', 'optional']);
        this.routeName = pluralize(this.model.modelName).toLocaleLowerCase();
        if(this.config.disabledPluralize === false) {
            this.routeName = this.model.modelName;
        }
        this.path = `${this.config.basePath}/${this.routeName}`;
        this._disabledMethods = this.config.disabledMethod || [];
    }
    queryGet(query) {
        if(query.count) {
            return this.model.count(query);
        }
        if(query.distinct) {
            return this.model.distinct(query.distinct);
        }
        return this.model.find(query);
    }
    get(params) {
        Validator.validateDisabledMethod('get', this._disabledMethods);
        if(params.id) {
            return this.model.findById(params.id, params);
        }
        return this.queryGet(params);
    }
    post(params) {
        Validator.validateDisabledMethod('post', this._disabledMethods);
        const body = params.body;
        return this.model.create(body);
    }
    put(params) {
        Validator.validateDisabledMethod('put', this._disabledMethods);
        Validator.validatePutParams(params);
        let fast = this.config.fastUpdate === 'enabled' ||
                (this.config.fastUpdate === 'optional' && this.query.fast);
        
        if(params.query.id) {
            return this.model.updateById(params.query.id, params.body, {fast});
        }
        return this.model.updateByConditions(params.query.conditions, params.body, {fast});
    }
    delete(params) {
        Validator.validateDisabledMethod('delete', this._disabledMethods);
        Validator.validateIdRequired(params);
        return this.model.delete(params.id);
    }
    check(path) {
        return path.includes(this.path);
    }
    // eslint-disable-next-line max-statements
    _getQueryParams(path) {
        const url = new URL(`http://localhost/${path}`);
        const searchParams = url.searchParams;
        const queryParams = {};
        for (const [key, value] of searchParams.entries()) {
            queryParams[key] = value;
            if(queryParams[key] === 'true' || queryParams[key] === 'false') {
                queryParams[key] = Boolean(queryParams[key]);
            }
        }
        const pathRegex = new RegExp(`^${this.path}/([\\w\\d]+)`);
        const matchId = path.match(pathRegex);
        if (matchId) {
            const id = matchId[1];
            queryParams.id = id;
        }
        if(path.match(/conditions\[(\w+)\]/ig)) {
            const conditions = {};
            for (const [key, value] of Object.entries(queryParams)) {
                const match = key.match(/^conditions\[(\w+)\]$/);
                if (match) {
                    const field = match[1];
                    conditions[field] = value;
                }
            }
            queryParams.conditions = conditions;
        }
        return {query: queryParams};
    }

    process(path, params) {
        const query = this._getQueryParams(path);
        const {method, body} = params;
        if(this._disabledMethods.includes(method)) {
            ErrorCollection.disabledMethod(method);
        }

        Validator.validateBody({body, method});

        if(method === 'GET') {
            return this.get(query.query);
        }
        if(method === 'POST') {
            return this.post({body});
        }
        if(method === 'PUT') {
            return this.put({body, ...query});
        }
        if(method === 'DELETE') {
            return this.delete({id: query.query.id});
        }
        return ErrorCollection.unexpectedError;
    }
}

module.exports = Controller;
