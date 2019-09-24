# Shared Queries


you can use multiple queries in only one request using the `shareQueryEnabled` configuration for the controllers that you want enabled.

Also check the [configuration page](../configuration/configuration.md).

### Example

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
### Format response:
you can use two methods to controll/format the response.

* `shareFormat`: this should be a *sync* function to format in the same way as the map function but it receives the collection as a second parameter.
* `beforeShareEnd`: this a express middleware that run before send the response, here you can do any sync process that you want. The formated response is in the `req.shareResponse` object. Remember to run `next()` doing that you want.


### Example request

`GET/api/share/${JSON.stringify({books:{}, users:{conditions:{_id:'5c01997482c8985ad9a7eb5b'}}})}`

#### Response
```
{
  books:[
    {
      title: 'example',
      _id:...
    },
    ...
  ],
  users:[
    {
      _id:'5c01997482c8985ad9a7eb5b',
      name: 'me',
      ...
    }
  ]
}
```
