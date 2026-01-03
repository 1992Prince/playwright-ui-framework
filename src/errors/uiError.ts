// UIError.ts
export class UIError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'UIError';

    // Preserve original stack trace (Node 16+)
    if (originalError) {
      (this as any).cause = originalError;
    }
  }
}
