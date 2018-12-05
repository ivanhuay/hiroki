'use strict';

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: [String],
    books: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Books'
    }]
});

module.exports = mongoose.model('Users', UserSchema);
