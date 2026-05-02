# Logger Integrations

Hiroki uses `HirokiLogger` internally. By default it ships with `ConsoleLogger`. Two optional packages wrap popular loggers:

| Package | Logger |
|---------|--------|
| `hiroki-pino` | [pino](https://github.com/pinojs/pino) |
| `hiroki-winston` | [winston](https://github.com/winstonjs/winston) |

## PinoLogger

### Installation

```bash
npm install hiroki-pino pino
```

### Usage

```ts
import hiroki from 'hiroki';
import { PinoLogger } from 'hiroki-pino';
import pino from 'pino';

hiroki.setConfig({
  logger: new PinoLogger(pino()),
});
```

### Custom pino options

```ts
import pino from 'pino';
import { PinoLogger } from 'hiroki-pino';

const logger = new PinoLogger(
  pino({
    level: 'debug',
    transport: {
      target: 'pino-pretty',
    },
  })
);
```

### Constructor

```ts
new PinoLogger(pinoInstance: PinoInstance)
```

`PinoInstance` is structurally typed — any object with `info`, `error`, `warn`, `debug` methods works.

---

## WinstonLogger

### Installation

```bash
npm install hiroki-winston winston
```

### Usage

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

### Constructor

```ts
new WinstonLogger(winstonInstance: WinstonInstance)
```

`WinstonInstance` is structurally typed — any object with `info`, `error`, `warn`, `debug` methods works.

---

## Custom logger

Implement `HirokiLogger` directly to wrap any logger:

```ts
import type { HirokiLogger } from 'hiroki';

export class MyLogger implements HirokiLogger {
  info(message: string): void { /* ... */ }
  error(message: string): void { /* ... */ }
  warn(message: string): void { /* ... */ }
  debug(message: string): void { /* ... */ }
}

hiroki.setConfig({ logger: new MyLogger() });
```

## Log levels

Hiroki emits at these levels:

| Level | When |
|-------|------|
| `debug` | All operations — filter/options/result on every request |
| `info` | Mutating operations — create, update, delete |
| `error` | Caught errors passed to response |
