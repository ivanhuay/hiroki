# Hiroki [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

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
...
const app = express();
const UsersSchema = new mongoose.Schema({name});
mongoose.model('Users', UsersSchema);

hiroki.rest('Users');//enable GET,PUT,POST & DELETE methods

app.use('/api', hiroki.build());
app.listen(8012);
```


### Sponsors:

[![Alt icon](https://grava.digital/assets/img/brandFooter.svg)
](https://grava.digital)
