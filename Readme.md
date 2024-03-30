# Hiroki [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]

 build REST APIs faster than ever using the open source tools and standards you and your team already know.

hiroki is an open source tool inspired by [baucis](https://github.com/wprl/baucis).

hiroki is fully compatible with mongoose 4 and 5.

hiroki is written in ES6 standards.

read the [documentation here](https://ivanhuay.github.io/hiroki/).
### Getting Started
Step by step example [HERE](https://ivanhuay.github.io/hiroki/).


To install:
```
npm install --save hiroki
```

Create simple rest api:

this is a basic example, keep in mind you may need body-parser library.
```javascript
const express = require('express');
const hiroki = require('hiroki');
const app = express();
const UsersSchema = new mongoose.Schema({name: String});
mongoose.model('Users', UsersSchema);

hiroki.rest('Users');//enable GET,PUT,POST & DELETE methods

app.use(hiroki.build());//automatically use the route "/api"
app.listen(8012);
```
### Build config:

it is possible to change the route that hiroki uses
```javascript
const config = {path:'/api/v1'};
app.use(hiroki.build(config));

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
[daviddm-image]: https://david-dm.org/ivanhuay/hiroki.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/ivanhuay/hiroki
