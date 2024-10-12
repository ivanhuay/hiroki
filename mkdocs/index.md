# Hiroki

[![NPM version][npm-image]][npm-url] [![CircleCI](https://dl.circleci.com/status-badge/img/circleci/73Gnub9RenZ7Vn7XN2Cq7A/7FichnXE69CYoQzoP7ppAd/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/circleci/73Gnub9RenZ7Vn7XN2Cq7A/7FichnXE69CYoQzoP7ppAd/tree/master)

Hiroki helps you build REST APIs faster than ever using the open source tools and standards you and your team already know.

## Documentation

Read the full [documentation here](https://ivanhuay.github.io/hiroki/).

## Getting Started

Follow our step-by-step [Getting Started guide](https://ivanhuay.github.io/hiroki/) to begin using Hiroki.

### Installation

```bash
npm install --save hiroki
```

### Create a Simple REST API

Here's a basic example to get you started. Note that you may need to install and use the `body-parser` library as well.

```javascript
const express = require('express');
const hiroki = require('hiroki');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

// Model definition
const UsersSchema = new mongoose.Schema({name: String});
const UserModel = mongoose.model('Users', UsersSchema);

// Importing model
hiroki.importModel(UserModel);

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// API route to pass data to Hiroki
app.use('/api/*', async (req, res) => {
    const path = req.originalUrl;
    const resp = await hiroki.process(path, {
        method: req.method,
        body: req.body
    });
    res.status(resp.status || 200).json(resp);
});

app.listen(8012, () => console.log('Server running on port 8012'));
```

## Configuration

You can customize Hiroki's behavior by changing its configuration:

```javascript
hiroki.setConfig({ 
    basePath: '/api/v2' // default is '/api'
});
```

## Changelog

### v2.0.0
- Hiroki is now backend-agnostic. Express has been removed as a dependency.
- Mongoose version has been updated.
- The 'share' feature has been removed. Please check if this impacts your usage.

[Full Changelog](https://ivanhuay.github.io/hiroki/changelog)

## License

Hiroki is licensed under the MIT License.

[npm-image]: https://badge.fury.io/js/hiroki.svg
[npm-url]: https://npmjs.org/package/hiroki