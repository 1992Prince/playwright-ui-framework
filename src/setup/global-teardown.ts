import type { FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig) {
  console.log('\n🏁 Test Run Finished');
  console.log(`🔑 RUN_ID: ${process.env.RUN_ID}\n`);
}

export default globalTeardown;
