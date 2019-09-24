# Hiroki

 build REST APIs faster than ever using the open source tools and standards you and your team already know.

hiroki is an open source tool inspired by [baucis](https://github.com/wprl/baucis).

hiroki is fully compatible with mongoose 4 and 5.

hiroki is written in ES6 standards.

read the [documentation here](https://ivanhuay.github.io/hiroki/).
### Getting Started
To install:
```
npm install --save hiroki
```

Create simple rest api:
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
