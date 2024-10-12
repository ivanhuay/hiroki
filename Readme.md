# Hiroki

[![NPM version][npm-image]][npm-url] [![CircleCI](https://dl.circleci.com/status-badge/img/circleci/73Gnub9RenZ7Vn7XN2Cq7A/7FichnXE69CYoQzoP7ppAd/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/circleci/73Gnub9RenZ7Vn7XN2Cq7A/7FichnXE69CYoQzoP7ppAd/tree/master)

Hiroki helps you build REST APIs faster than ever using open source tools and standards that you and your team already know.

## Table of Contents

- [Documentation](#documentation)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Changelog](#changelog)

## Documentation

For detailed information, please read our [full documentation](https://ivanhuay.github.io/hiroki/).

## Getting Started

### Installation

```bash
npm install --save hiroki
```

### Quick Start

Here's a basic example of how to create a simple REST API with Hiroki:

```javascript
const express = require('express');
const hiroki = require('hiroki');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

// Model definition
const UsersSchema = new mongoose.Schema({name: String});
const UsersModel = mongoose.model('Users', UsersSchema);

// Importing model
hiroki.importModel(UsersModel);

// Bodyparser middleware
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

Note: This example assumes you have already set up your MongoDB connection.

## Configuration

You can customize Hiroki's configuration, such as changing the base path:

```javascript
hiroki.setConfig({ 
    basePath: '/api/v2' // default is '/api'
});
```

## Changelog

### v2.0.0

- Hiroki is now backend-agnostic. Express has been removed as a dependency.
- Mongoose version updated.
- The 'share' feature has been removed. Please check if this impacts your use case.

[Full Changelog](https://ivanhuay.github.io/hiroki/changelog)

[npm-image]: https://badge.fury.io/js/hiroki.svg
[npm-url]: https://npmjs.org/package/hiroki