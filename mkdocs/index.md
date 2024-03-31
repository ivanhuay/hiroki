# Hiroki [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]

 build REST APIs faster than ever using the open source tools and standards you and your team already know.

### Getting Started
Step by step example [HERE](/getting-started/).


To install:
``` { .bash .copy }
npm install --save hiroki
```

Create simple rest api:

this is a basic example, keep in mind you may need body-parser library.
``` { .javascript .copy }
const express = require('express');
const hiroki = require('hiroki');
const mongoose = require('mongoose');
const app = express();

// Model definition
const UsersSchema = new mongoose.Schema({name: String});
mongoose.model('Users', UsersSchema);

// Importing model
hiroki.importModel(UsersSchema);

// Bodyparser added
app.use(bodyParser.urlencoded());

app.use(bodyParser.json());


// Api route to pass data to hiroki
app.use('/api/*', async(req, res) => {
    const path = req.originalUrl;
    const resp = await hiroki.process(path, {
        method: req.method,
        body: req.body
    });
    res.status(resp.status || 200).json(resp);
});

app.listen(8012);
```
### Update config:

it is possible to change the route that hiroki uses
```javascript
const config = {basePath:'/api/v1'};
hiroki.setConfig({
    basePath: '/api/v1' // Default: /api
})
```
### Changelog
* v2.0.0: 
  * hiroki should be now backend agnostic. Express removed as dependency.
  * mongoose version updated
  * share will be removed for this version. Check if this would be usefull.
[Full Changelog](https://ivanhuay.github.io/hiroki/changelog)

[npm-image]: https://badge.fury.io/js/hiroki.svg
[npm-url]: https://npmjs.org/package/hiroki
[travis-image]: https://travis-ci.com/ivanhuay/hiroki.svg?branch=master
[travis-url]: https://travis-ci.com/ivanhuay/hiroki
