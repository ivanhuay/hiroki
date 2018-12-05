'use strict';

const mongoose = require('mongoose');

const BooksSchema = new mongoose.Schema({
    title: {
        type:String,
        required: true
    },
    tag: [String]
});

module.exports = mongoose.model('Books', BooksSchema);
