export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export type LoggerConfig = {
    logLevel: LogLevel;
};

let SingletonLogger: Logger | null = null;

export interface HirokiLogger {
    log(message: string): void;
    info(message: string): void;
    error(message: string): void;
    warn(message: string): void;
    debug(message: string): void;
}
export class Logger implements HirokiLogger {
  private readonly logLevel: LogLevel;

  constructor(config: LoggerConfig) {
    this.logLevel = config.logLevel;
  }

  public static createInstance(config: LoggerConfig): Logger {
    if (!SingletonLogger) {
      SingletonLogger = new Logger(config);
    }
    return SingletonLogger;
  }

  public log(message: string): void {
    if (this.logLevel === 'debug') {
      console.log(`[LOG] ${message}`);
    }
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

export const logger = Logger.createInstance({ logLevel: 'error' });