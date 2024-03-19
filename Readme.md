# Hiroki [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

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
* v0.2.7:
  * `shareFormat` & `beforeShareEnd` methods added to format share response.
  * Node v7 support removed.
  * docs for shared.
* v0.2.5 `fastUpdate` option added. This enabled a faster way to update for higher performance.
* v0.2.3 **Critical bugfix:** decorator error with delete method. Test added for cover that.
* v0.2.2 Params `$push` and `$pull` working for PUT method. For doing this a custom Assign method was added to hiroki, because of that we made a benchmark test to measure this performance impact. Check it [Here](https://github.com/ivanhuay/micron-object-assign).
* v0.2.0 Share Query path added. [check the docs](https://ivanhuay.github.io/hiroki/rest-api/share-query/).
* v0.1.3 MongooseConnector added, dependencies update no breaking changes. In future releases, new connectors would be added.
* v0.1.2 Bugfix decorator for put route with :id as parameter
* v0.1.1: Bugfix count with conditions error.
* v0.1.0:
  * PUT request fire pre save hook in Mongoose Schema.
  * PUT update by condition only update one document.
  * findOneAndUpdate method removed from PUT request.
* v0.0.9: Add support for new conditions format.
```
ej: GET /api/users?conditions[active]=true
```
* v0.0.8: fix general request function affect all routes.
This type of decorators affected all the routes.
```javascript
...
controller.request((req,res,next) => {
  res.status(401).json({});
})
```
now it only affects the route of that collection

[npm-image]: https://badge.fury.io/js/hiroki.svg
[npm-url]: https://npmjs.org/package/hiroki
[travis-image]: https://travis-ci.com/ivanhuay/hiroki.svg?branch=master
[travis-url]: https://travis-ci.com/ivanhuay/hiroki
[daviddm-image]: https://david-dm.org/ivanhuay/hiroki.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/ivanhuay/hiroki
