'use strict';

const mongoose = require('mongoose');

const DrawsSchema = new mongoose.Schema({
    name: String,
    type: String
});
DrawsSchema.pre('save', function(next) {
    if(!this.type) {
        this.type = 'default-type';
    }
    next();
});
module.exports = mongoose.model('Draws', DrawsSchema);
