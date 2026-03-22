import { consoleLogger } from '../utils/logger';

// TestExecutionError — thrown in spec files and fixtures to wrap caught action/flow errors.
// Always log with consoleLogger.error() at the call site BEFORE throwing this error,
// so the root cause is visible in the log output alongside the rethrown message.
// Never throw this from POM or flow classes — use UIError there instead.
export class TestExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TestExecutionError';

    // Log the error at construction time so every TestExecutionError is always
    // captured in the run output, even if the caller forgot to log before throwing.
    consoleLogger.error('TestExecutionError: %s', message);
  }
}
