'use strict';

const mongoose = require('mongoose');

const BirdsSchema = new mongoose.Schema({
    name: String,
    type: String
});

module.exports = mongoose.model('Birds', BirdsSchema);
