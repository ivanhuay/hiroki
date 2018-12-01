'use strict';
const Users = require('./models/users');
const Books = require('./models/books');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true});

Promise.all([

]);
Books.create({
    title: 'el juego del ender'
})
    .then((book) => {
        Users.create({
            name: 'carlos',
            email: 'carlos@live.com',
            books:[book._id]
        });
    });

let query = Users.find();
query = query.populate();
query = query.populate('books');

query.then((response) => {
    console.log('response: ', JSON.stringify(response));
});
