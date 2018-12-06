'use strict';
const express = require('express');
const buildHiroki = require('./build-hiroki');
const mongoose = require('mongoose');
const app = express();
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true});
app.use(buildHiroki());

module.exports = app;
