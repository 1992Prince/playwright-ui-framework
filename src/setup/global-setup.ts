import type { FullConfig } from '@playwright/test';

function generateRunId(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const msPart = now.getMilliseconds();
  return `RUN_${datePart}_${timePart}_${msPart}`;
}

async function globalSetup(_config: FullConfig) {
  // Only set the RUN_ID here (no console logging—report won't capture it anyway)
  process.env.RUN_ID = generateRunId();

   // ✅ Log once, before any test starts
  console.log(`\n🚀 Test Run Started`);
  console.log(`🔑 RUN_ID: ${process.env.RUN_ID}\n`);
}

export default globalSetup;