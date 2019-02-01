'use strict';

const mongoose = require('mongoose');

const InvisibleSchema = new mongoose.Schema({
    name: String,
    content: String
});

module.exports = mongoose.model('Invisible', InvisibleSchema);
