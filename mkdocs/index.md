# Getting started with hiroki
In this tutorial we are going to build our first rest API using hiroki. Some things in this tutorial aren't the best practice but this is to keep the example simpler as possible.

## Setup

* First we must create a project folder.
```
mkdir hello-hiroki
cd hello-hiroki
```

* Now we have to create a `package.json` file.
```
npm init -y
```

* Install dependencies.
```
npm i --save express mongoose body-parser hiroki
```

## Project folders
* Create a model folder.
```
mkdir models
```
in this folder we have to create our models.

## Create the first model
create a model file `(models/book.js)` in models folder.

* `models/book.js`

```javascript
const mongoose = require('mongoose');

const Book = new mongoose.Schema({
  title: String,
  description: String
});

module.exports = mongoose.model('Book', Book);
```

Create a index file for models.

`models/index.js`
```javascript
const Book = require('./book');

module.exports = {
  Book
}
```
## The server file
Create a file `app.js`.

#### step by step:
* Import dependencies:
```javascript
const express = require('express');
const mongoose = require('mongoose');
const models = require('./models');
const bodyParser = require('body-parser');
const hiroki = require('hiroki');
```
* Create the express app and use body-parser.
```javascript
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
```
* Connect to mongo:
```javascript
mongoose.connect('mongodb://localhost:27017/test')
  .then(()=>{
    console.log('connection succes!');
  })
```
* Build the rest api:
```javascript
Object.keys(models).forEach((model)=>{
  hiroki.rest(model);
})
app.use(hiroki.build());
```
* Handle errors:
```javascript
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});
app.use(function(error, req, res, next) {
    console.error('handleError: ', error);
    return res.status(error.status || 500).json({
        status: error.status,
        error: error.message,
        stack: error.stack
    });
});
```
* The end: add the app listen
```javascript
app.listen(3030);
console.log('server listening on port 3030...');
```

#### File app.js:
This is the complete file.

```javascript
const express = require('express');
const mongoose = require('mongoose');
const models = require('./models');
const bodyParser = require('body-parser');
const hiroki = require('hiroki');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

mongoose.connect('mongodb://localhost:27017/test')
  .then(()=>{
    console.log('connection succes!');
  })

Object.keys(models).forEach((model)=>{
  hiroki.rest(model);
})
app.use(hiroki.build());


app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});
app.use(function(error, req, res, next) {
    console.error('handleError: ', error);
    return res.status(error.status || 500).json({
        status: error.status,
        error: error.message,
        stack: error.stack
    });
});


app.listen(3030);
console.log('server listening on port 3030...');
```

## Start application
```
node app.js
```
now you can open `http://localhost:3030/api/books`.

have fun!

### Remember:
* GET: get documents.
* POST: create one document.
* PUT: update one document.
* DELETE: remove one document.

### Source code:
[HERE](https://github.com/ivanhuay/hiroki-basic-example)
