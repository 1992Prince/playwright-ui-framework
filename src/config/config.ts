import globalSetup from "../setup/global-setup";
import { consoleLogger } from "../utils/logger";

// Resolve target environment from env var; fall back to 'dev' if not set
const processEnv = process.env.TEST_ENV;
const env = processEnv || 'dev';

// Log resolved environment at startup so CI logs are unambiguous
consoleLogger.info('Config: Resolved TEST_ENV=%s', env.toUpperCase());

// Default configuration values (DEV environment)
// Individual values can be overridden via environment variables — CI secrets take precedence
const config = {
  appUrl: process.env.API_URL || 'https://conduit.bondaracademy.com/',
  userEmail: process.env.USER_EMAIL || 'testbondar1@gmail.com',
  userPassword: process.env.USER_PASSWORD || 'testbondar1',
  dbPassword: process.env.DB_PASSWORD || 'password123',
  Release: process.env.RELEASE || '21.09',
  Application: process.env.APPLICATION || 'Conduit-API-UI',
  Env: env,
  authTokenBaseUrl:
    process.env.AUTH_TOKEN_BASE_URL ||
    'https://dev-dj4vuaaxgimt7erd.us.auth0.com/oauth/token',
  authAutoInsuranceBaseUrl:
    process.env.AUTO_INSURANCE_BASE_URL ||
    'https://generalinsurance-ff4b.restdb.io/rest',

  // RUN_ID is injected by global-setup.ts before tests execute
  runId: process.env.RUN_ID
};

// Apply QA environment overrides when TEST_ENV=QA
// Only takes effect if the individual env vars have not been set explicitly
if (env === 'QA') {
  consoleLogger.info('Config: Applying QA environment overrides');
  config.appUrl =
    process.env.API_URL || 'https://qa-conduit-api.bondaracademy.com/api';
  config.userEmail =
    process.env.USER_EMAIL || 'qa-pwapiuser@test.com';
  config.userPassword =
    process.env.USER_PASSWORD || 'qa-Welcome';
}

// Log the final resolved config at debug level — passwords are intentionally excluded
consoleLogger.debug(
  'Config: appUrl=%s | application=%s | release=%s | runId=%s',
  config.appUrl,
  config.Application,
  config.Release,
  config.runId ?? 'not yet set'
);

export { config };
// import globalSetup from "../setup/global-setup";

// const processEnv = process.env.TEST_ENV;
// const env = processEnv || 'dev';

// console.log('Running tests on environment:', env.toUpperCase());

// // default configuration values (DEV defaults)
// const config = {
//   appUrl: process.env.API_URL || 'https://conduit.bondaracademy.com/',
//   userEmail: process.env.USER_EMAIL || 'testbondar1@gmail.com',
//   userPassword: process.env.USER_PASSWORD || 'testbondar1',
//   dbPassword: process.env.DB_PASSWORD || 'password123',
//   Release: process.env.RELEASE || '21.09',
//   Application: process.env.APPLICATION || 'Conduit-API-UI',
//   Env: env,
//   authTokenBaseUrl:
//     process.env.AUTH_TOKEN_BASE_URL ||
//     'https://dev-dj4vuaaxgimt7erd.us.auth0.com/oauth/token',
//   authAutoInsuranceBaseUrl:
//     process.env.AUTO_INSURANCE_BASE_URL ||
//     'https://generalinsurance-ff4b.restdb.io/rest',

//    // ✅ RUN ID coming from globalSetup
//   runId: process.env.RUN_ID
// };

// // QA overrides (only if not overridden via env vars)
// if (env === 'QA') {
//   config.appUrl =
//     process.env.API_URL || 'https://qa-conduit-api.bondaracademy.com/api';
//   config.userEmail =
//     process.env.USER_EMAIL || 'qa-pwapiuser@test.com';
//   config.userPassword =
//     process.env.USER_PASSWORD || 'qa-Welcome';
// }

// export { config };