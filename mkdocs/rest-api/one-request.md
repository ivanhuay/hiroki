# One request multiple query using **share** route.
This feature is available since v0.2.0

now we have a new path `/api/share/:shareCondition`.

### Configuration:
you can use multiple queries in only one request using the `shareQueryEnabled` configuration for the controllers that you want enabled.

Also check the [configuration page](../getting-started/configuration.md).

### Usage Details:
`:shareCondition` is a stringify object with this format:
```
{
    modelName:{ params }
}
```

the `params` object is like the tradicional params.

`params`:
```
{
  limit: ...
  select: ...
  count: ...
  skip: ...
  conditions: ...
}
```
now instead of query params is an object.

you can check details [here](../rest-api)
### Format response:
you can use two methods to controll/format the response.

* `shareFormat`: this should be a *sync* function to format in the same way as the map function but it receives the collection as a second parameter.
* `beforeShareEnd`: this a express middleware that run before send the response, here you can do any sync process that you want. The formated response is in the `req.shareResponse` object. Remember to run `next()` doing that you want.

## Examples

#### API build:

```javascript
'use strict';
const hiroki = require('../../index');
const models = require('./models');
const decorators = require('./decorators');

function buildHiroki() {
    Object.keys(models).forEach((modelName) => {
        const options = modelName === 'Draws' ? {fastUpdate: 'enabled'} : {shareQueryEnabled:true};
        const controller = hiroki.rest(models[modelName], options);
        if (decorators.hasOwnProperty(modelName)) {
            decorators[modelName](controller);
        }
    });
    hiroki.shareFormat = (doc, collection) => {
        if(collection === 'books') {
            doc.book = true;
        }
        return doc;
    };
    hiroki.beforeShareEnd = (req, res, next) => {
        req.shareResponse.fakeCollection = [1];
        next();
    };
    return hiroki.build();
}

module.exports = buildHiroki;

```
#### Example Request

`GET '/api/share/{"books":{},"users":{"conditions":{"_id":"5c01997482c8985ad9a7eb5c"}}}'`

#### Response
```
{
  users:
   [ { role: [],
       books: [],
       _id: '5c01997482c8985ad9a7eb5b',
       name: 'test user',
       email: 'test@lts.com',
       __v: 0 } ],
  books:
   [ { tag: [Array],
       _id: '5cfa87a6615ab0eb6fed5cf6',
       title: 'first book',
       tagCount: 1,
       __v: 0 } ]
}
```
