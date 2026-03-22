import { consoleLogger } from '../utils/logger';

// UIError — thrown inside POM helper methods (safeClick, safeFill, etc.) for element-level failures.
// Never throw this from spec files or fixtures — use TestExecutionError there instead.
// The optional `originalError` preserves the underlying Playwright cause for deeper debugging.
export class UIError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'UIError';

    // Log at error level so every UI interaction failure is captured in run output,
    // even if the POM caller does not log before rethrowing.
    consoleLogger.error('UIError: %s', message);

    // Preserve the original Playwright error as the cause (Node 16+).
    // Surfaces in stack traces as "Caused by:" for easier root-cause analysis.
    if (originalError) {
      (this as any).cause = originalError;
      consoleLogger.debug('UIError cause: %s', (originalError as any)?.message ?? String(originalError));
    }
  }
}
