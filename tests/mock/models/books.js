'use strict';

const mongoose = require('mongoose');

const BooksSchema = new mongoose.Schema({
    title: String,
    tag: [String]
});

BooksSchema.swaggerName = 'Books';

module.exports = mongoose.model('Books', BooksSchema);
