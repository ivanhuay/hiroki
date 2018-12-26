'use strict';

const mongoose = require('mongoose');

const DocsSchema = new mongoose.Schema({
    name: String,
    content: String
});

module.exports = mongoose.model('Item', DocsSchema);
