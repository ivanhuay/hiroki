'use strict';

const mongoose = require('mongoose');

const BooksSchema = new mongoose.Schema({
    title: {
        type:String,
        required: true
    },
    tag: [String],
    tagCount: Number
});

BooksSchema.pre('save', function(next) {
    if(this.isModified('tag')) {
        this.tagCount = this.tag.length;
    }
    next();
});
module.exports = mongoose.model('Books', BooksSchema);
