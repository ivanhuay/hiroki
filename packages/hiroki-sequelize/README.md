# hiroki-sequelize

[![NPM version](https://badge.fury.io/js/hiroki-sequelize.svg)](https://npmjs.org/package/hiroki-sequelize)

> **Beta** — adapter skeleton in place, full implementation in progress.

[Sequelize](https://sequelize.org/) adapter for [hiroki](https://npmjs.org/package/hiroki). Connect Hiroki to MySQL or PostgreSQL.

## Installation

```bash
npm install hiroki-sequelize@beta sequelize
```

Peer dependencies: `sequelize >=6.0.0`, `hiroki >=3.0.0`

## Usage

```ts
import hiroki from 'hiroki';
import { SequelizeAdapter } from 'hiroki-sequelize';
import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize('sqlite::memory:');
const User = sequelize.define('User', { name: DataTypes.STRING });

hiroki.importModel('Users', {
  adapter: new SequelizeAdapter('Users', { model: User }),
});
```

## Status

- [x] Class structure, `canHandle`, `setLogger`
- [ ] `find` / `findById` / `count` / `distinct`
- [ ] `create` / `updateById` / `updateByConditions` / `delete`
- [ ] `HirokiFilter[]` → Sequelize `Op` mapping
- [ ] Integration tests

## Documentation

[ivanhuay.github.io/hiroki/adapters/sequelize](https://ivanhuay.github.io/hiroki/adapters/sequelize)

## License

MIT
