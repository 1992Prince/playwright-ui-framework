import type { FullConfig } from '@playwright/test';
import { consoleLogger } from '../utils/logger';

// Runs once after all tests complete.
// RUN_ID is still available from global-setup via process.env.
async function globalTeardown(_config: FullConfig) {
  // Log run completion milestone with the same RUN_ID used throughout the run
  consoleLogger.info('GlobalTeardown: Test run finished. RUN_ID=%s', process.env.RUN_ID ?? 'NA');
}

export default globalTeardown;
