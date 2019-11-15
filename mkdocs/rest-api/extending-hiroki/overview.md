# Controller Object

`hiroki.rest` return a `Controller` object.

this object build routes for a particular mongoose model.

```javascript
const controller = hiroki.rest(model);
```
## Structure
### Methods
* request: extend functionality using middlewares before hiroki native middlewares.
* build: build specific route. **(hiroki.build run build for each controller)**

### Statics methods

* Controller.getRouter: return the current express router.

### Set properties
* disabledMethods: String with disabled routes. `Ej: disabledMethods = "get post"''`
* outgoing: format middleware before response.
* beforeEnd: after format route.

***
## Details Usage
detail of use for some useful functions

### Request

`controler.request(methods, middleware)` enable to add middleware before hiroki routes.
methods(String): methods separated by spaces. *`get post put delete`*

if you wish you can ignore the `methods` parameter and the middleware will apply to all methods.

Example:
```javascript
...
const app = express();
const UsersSchema = new mongoose.Schema({name});
mongoose.model('Users', UsersSchema);

const controller = hiroki.rest('Users');
controller.request((req, res, next) => {
  //do something
  //...
  next();
});
controller.request('delete post put', (req,res,next) =>{
  req.status(401).json({error:'unauthorized'});
})
app.use('/api', hiroki.build());
app.listen(8012);


```

***

### Disabled methods

DisabledMethods alows you to disable some hiroki methods.

request with this methods return `404` status.

Example:

```javascript
...
const controller = hiroki.rest('Users');
controller.disabledMethods = 'delete put';
app.use('/api', hiroki.build());
app.listen(8012);

```
***

### Outgoing

Outgoing allows you to add a formatting function before the output. The function receives each document and is executed once for each document.

```javascript
...
const controller = hiroki.rest('Users');
controller.outGoing = function(doc) {
  doc.outName = doc.name.toUpperCase()
  return doc
};
app.use('/api', hiroki.build());
app.listen(8012);

```

### BeforeEnd

`beforeEnd` allows you to add a middleware that is executed before returning the server response and after formatting all the documents

within this function you can manipulate the object req.rest

`req.rest` can contain up to 3 parameters: count, response (formatted documents) and status (http status)
##### req.rest structure
```json
{
  "count": "Number",
  "response": "Docs",
  "status": "Number"
}
```

##### beforeEnd usage
```javascript
controller.beforeEnd = function(req,res,next){
  doSomething();
  next(); //hiroki make the response
}
```
