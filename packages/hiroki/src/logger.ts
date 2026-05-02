export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export type LoggerConfig = {
    logLevel: LogLevel;
};

export interface HirokiLogger {
    info(message: string): void;
    error(message: string): void;
    warn(message: string): void;
    debug(message: string): void;
}
export class ConsoleLogger implements HirokiLogger {
  private logLevel: LogLevel;

  constructor(config: LoggerConfig) {
    this.logLevel = config.logLevel;
  }

  public setConfig(config: LoggerConfig): void {
    this.logLevel = config.logLevel;
  }
  
  public debug(message: string): void {
    if (this.logLevel === 'debug') {
      console.debug(`[DEBUG] ${message}`);
    }
  }

  public info(message: string): void {
    if (this.logLevel === 'info' || this.logLevel === 'debug') {
      console.info(`[INFO] ${message}`);
    }
  }

  public error(message: string): void {
    if (this.logLevel === 'error' || this.logLevel === 'warn' || this.logLevel === 'info' || this.logLevel === 'debug') {
      console.error(`[ERROR] ${message}`);
    }
  }

  public warn(message: string): void {
    if (this.logLevel === 'warn' || this.logLevel === 'info' || this.logLevel === 'debug') {
      console.warn(`[WARN] ${message}`);
    }
  }
}
