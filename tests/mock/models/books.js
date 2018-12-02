'use strict';

const mongoose = require('mongoose');

const BooksSchema = new mongoose.Schema({
    title: {
        type:String,
        required: true
    },
    tag: [String]
});

BooksSchema.swaggerName = 'Books';

module.exports = mongoose.model('Books', BooksSchema);
