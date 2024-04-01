'use strict';
const express = require('express');
const models = require('./models');
const hiroki = require('../../index');
const bodyParser = require('body-parser');
const {MONGODB_USERNAME, MONGODB_PASSWORD} = process.env;
const mongoose = require('mongoose');
const app = express();
mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${MONGODB_USERNAME}@${MONGODB_PASSWORD}localhost:27017/test`, {useNewUrlParser: true});

Object.keys(models).forEach((modelName) => {
    let options = modelName === 'Draws' ? {fastUpdate: 'enabled'} : {};
    if(modelName === 'Invisible') {
        options = {
            disabledMethods: ['get']
        };
    }
    hiroki.importModel(models[modelName], options);
});

app.use(bodyParser.urlencoded());

app.use(bodyParser.json());

app.use('/api/*', async(req, res) => {
    const path = req.originalUrl;
    const resp = await hiroki.process(path, {
        method: req.method,
        body: req.body
    });
    res.status(resp.status || 200).json(resp);
});

module.exports = app;
