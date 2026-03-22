import type { FullConfig } from '@playwright/test';
import { consoleLogger } from '../utils/logger';

function generateRunId(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const msPart = now.getMilliseconds();
  return `RUN_${datePart}_${timePart}_${msPart}`;
}

async function globalSetup(_config: FullConfig) {
  // Set RUN_ID first — consoleLogger reads process.env.RUN_ID at call time,
  // so all subsequent log lines will carry the correct RUN_ID in their prefix.
  process.env.RUN_ID = generateRunId();

  // Log once before any test starts — visible in CI stdout and local terminal
  consoleLogger.info('GlobalSetup: Test run started');
  consoleLogger.info('GlobalSetup: RUN_ID=%s', process.env.RUN_ID);
}

export default globalSetup;