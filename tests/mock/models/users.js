'use strict';

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: [String]
});

UserSchema.swaggerName = 'Users';

module.exports = mongoose.model('Users', UserSchema);
