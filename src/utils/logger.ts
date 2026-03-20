// src/utils/logger.ts

const RESET = '\x1b[0m';

class ConsoleLogger {

  private buildPrefix(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    const runId     = process.env.RUN_ID ?? 'NA';
    return `[${timestamp}] [RUN_ID=${runId}] ${level}: ${message}`;
  }

  // Use for key milestones — test start/end, login, major action completed
  info(message: string, ...args: any[]): void {
    console.info(`\x1b[34m${this.buildPrefix('INFO', message)}${RESET}`, ...args);
  }

  // Use for non-fatal surprises — something unexpected but the test can continue
  warn(message: string, ...args: any[]): void {
    console.warn(`\x1b[33m${this.buildPrefix('WARN', message)}${RESET}`, ...args);
  }

  // Use immediately before re-throwing an error — what broke and why
  error(message: string, ...args: any[]): void {
    console.error(`\x1b[31m${this.buildPrefix('ERROR', message)}${RESET}`, ...args);
  }

  // Use for variable values, URLs, config — helpful when debugging a failure
  debug(message: string, ...args: any[]): void {
    console.log(`\x1b[32m${this.buildPrefix('DEBUG', message)}${RESET}`, ...args);
  }
}

// Class is NOT exported — only the ready-to-use instance is
export const consoleLogger = new ConsoleLogger();