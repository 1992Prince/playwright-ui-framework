
export class ConsoleLogger {
  private timestamp(): string {
    return new Date().toISOString();
  }

  private prefix(msg: string) {
    const run = process.env.RUN_ID ?? 'NA';
    return `[${this.timestamp()}] [RUN_ID=${run}] ${msg}`;
  }

  info(message: string, ...args: any[]) {
    console.info(`\x1b[34m${this.prefix('INFO: ' + message)}`, ...args);
  }

  warn(message: string, ...args: any[]) {
    console.warn(`\x1b[33m${this.prefix('WARN: ' + message)}`, ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(`\x1b[31m${this.prefix('ERROR: ' + message)}`, ...args);
  }

  debug(message: string, ...args: any[]) {
    console.log(`\x1b[32m${this.prefix('DEBUG: ' + message)}`, ...args);
  }
}
