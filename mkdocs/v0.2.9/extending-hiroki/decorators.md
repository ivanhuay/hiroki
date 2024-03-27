# Extending Hiroki
you can easly extend hiroji using a simple express middleware.

## Using decorators

`hiroki.rest` return a `Controller` object.

see details of controller methods [here](../overview).

### Example
```javascript
...
const app = express();
const UsersSchema = new mongoose.Schema({name});
mongoose.model('Users', UsersSchema);

const controller = hiroki.rest('Users');
controller.request('get', (req,res,next) =>{
  req.query.limit = 3; //override query params limit
  next();
})
app.use('/api', hiroki.build());
app.listen(8012);
```
