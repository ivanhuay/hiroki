class Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }

  info(message: string): void {
    console.info(`[INFO] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }

  warn(message: string): void {
    console.warn(`[WARN] ${message}`);
  }
}

export const logger = new Logger();