export class TestExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TestLevelGenericError';
  }
}
