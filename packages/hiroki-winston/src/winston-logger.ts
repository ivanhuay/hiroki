import type { HirokiLogger } from 'hiroki';

export interface WinstonInstance {
  info(msg: string): void;
  error(msg: string): void;
  warn(msg: string): void;
  debug(msg: string): void;
}

export class WinstonLogger implements HirokiLogger {
  private winston: WinstonInstance;

  constructor(winstonInstance: WinstonInstance) {
    this.winston = winstonInstance;
  }

  info(message: string): void {
    this.winston.info(message);
  }

  error(message: string): void {
    this.winston.error(message);
  }

  warn(message: string): void {
    this.winston.warn(message);
  }

  debug(message: string): void {
    this.winston.debug(message);
  }
}
