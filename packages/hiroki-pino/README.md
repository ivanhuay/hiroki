# hiroki-pino

[![NPM version](https://badge.fury.io/js/hiroki-pino.svg)](https://npmjs.org/package/hiroki-pino)

[Pino](https://github.com/pinojs/pino) logger adapter for [hiroki](https://npmjs.org/package/hiroki). Implements `HirokiLogger` by delegating to a pino instance.

## Installation

```bash
npm install hiroki-pino pino
```

Peer dependencies: `pino >=8.0.0`, `hiroki >=3.0.0`

## Usage

```ts
import hiroki from 'hiroki';
import { PinoLogger } from 'hiroki-pino';
import pino from 'pino';

hiroki.setConfig({
  logger: new PinoLogger(pino({ level: 'debug' })),
});
```

## Custom transport

```ts
import { PinoLogger } from 'hiroki-pino';
import pino from 'pino';

const logger = new PinoLogger(
  pino({
    transport: { target: 'pino-pretty' },
  })
);
```

## API

```ts
new PinoLogger(pinoInstance: PinoInstance)
```

`PinoInstance` is structurally typed — any object with `info`, `error`, `warn`, `debug` methods works.

## Documentation

[ivanhuay.github.io/hiroki/guide/loggers](https://ivanhuay.github.io/hiroki/guide/loggers)

## License

MIT
