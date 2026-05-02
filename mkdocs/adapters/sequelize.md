# SequelizeAdapter

Connect Hiroki to MySQL or PostgreSQL via [Sequelize](https://sequelize.org/).

::: warning Work in progress
`hiroki-sequelize` is at v0.1.0. The adapter skeleton is in place — full `HirokiFilter` → Sequelize `Op` mapping is under active development.
:::

## Installation

```bash
npm install hiroki-sequelize sequelize
```

Peer dependencies: `sequelize >=6.0.0`, `hiroki >=3.0.0`

## Usage

```ts
import hiroki from 'hiroki';
import { SequelizeAdapter } from 'hiroki-sequelize';
import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize('sqlite::memory:');

const User = sequelize.define('User', {
  name: DataTypes.STRING,
  email: DataTypes.STRING,
});

hiroki.importModel('Users', {
  adapter: new SequelizeAdapter('Users', { model: User }),
});
```

## Constructor

```ts
new SequelizeAdapter(modelName: string, config: SequelizeAdapterConfig)
```

| Option | Type | Description |
|--------|------|-------------|
| `modelName` | `string` | Resource name used for routing and logging |
| `config.model` | `ModelStatic` | Sequelize model class |

## Logger injection

```ts
import hiroki from 'hiroki';
import { SequelizeAdapter } from 'hiroki-sequelize';

const adapter = new SequelizeAdapter('Users', { model: User });

// Logger is injected automatically by the controller after importModel
hiroki.importModel('Users', { adapter });
```

## HirokiFilter operators (planned)

When fully implemented, `SequelizeAdapter` will translate all `HirokiFilter` operators to Sequelize `Op` conditions:

| Operator | Sequelize equivalent |
|----------|----------------------|
| `eq` | `{ field: value }` |
| `ne` | `{ [Op.ne]: value }` |
| `gt` | `{ [Op.gt]: value }` |
| `gte` | `{ [Op.gte]: value }` |
| `lt` | `{ [Op.lt]: value }` |
| `lte` | `{ [Op.lte]: value }` |
| `in` | `{ [Op.in]: value }` |
| `nin` | `{ [Op.notIn]: value }` |
| `regex` | `{ [Op.regexp]: value }` |

## Contributing

Source: [`packages/hiroki-sequelize`](https://github.com/ivanhuay/hiroki/tree/master/packages/hiroki-sequelize)
