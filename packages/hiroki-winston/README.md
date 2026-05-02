# hiroki-winston

[![NPM version](https://badge.fury.io/js/hiroki-winston.svg)](https://npmjs.org/package/hiroki-winston)

[Winston](https://github.com/winstonjs/winston) logger adapter for [hiroki](https://npmjs.org/package/hiroki). Implements `HirokiLogger` by delegating to a winston instance.

## Installation

```bash
npm install hiroki-winston winston
```

Peer dependencies: `winston >=3.0.0`, `hiroki >=3.0.0`

## Usage

```ts
import hiroki from 'hiroki';
import { WinstonLogger } from 'hiroki-winston';
import winston from 'winston';

const winstonLogger = winston.createLogger({
  level: 'debug',
  transports: [new winston.transports.Console()],
});

hiroki.setConfig({
  logger: new WinstonLogger(winstonLogger),
});
```

## API

```ts
new WinstonLogger(winstonInstance: WinstonInstance)
```

`WinstonInstance` is structurally typed — any object with `info`, `error`, `warn`, `debug` methods works.

## Documentation

[ivanhuay.github.io/hiroki/guide/loggers](https://ivanhuay.github.io/hiroki/guide/loggers)

## License

MIT
