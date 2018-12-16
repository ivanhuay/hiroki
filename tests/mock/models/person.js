'use strict';

const mongoose = require('mongoose');

const PersonSchema = new mongoose.Schema({
    title: {
        type:String,
        required: true
    },
    tag: [String]
});

module.exports = mongoose.model('Person', PersonSchema);
