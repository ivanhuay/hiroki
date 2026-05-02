import type { HirokiLogger } from 'hiroki';

export interface PinoInstance {
  info(msg: string): void;
  error(msg: string): void;
  warn(msg: string): void;
  debug(msg: string): void;
}

export class PinoLogger implements HirokiLogger {
  private pino: PinoInstance;

  constructor(pinoInstance: PinoInstance) {
    this.pino = pinoInstance;
  }

  info(message: string): void {
    this.pino.info(message);
  }

  error(message: string): void {
    this.pino.error(message);
  }

  warn(message: string): void {
    this.pino.warn(message);
  }

  debug(message: string): void {
    this.pino.debug(message);
  }
}
