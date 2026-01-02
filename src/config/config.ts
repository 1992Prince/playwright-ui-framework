import globalSetup from "../setup/global-setup";

const processEnv = process.env.TEST_ENV;
const env = processEnv || 'dev';

console.log('Running tests on environment:', env.toUpperCase());

// default configuration values (DEV defaults)
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

   // ✅ RUN ID coming from globalSetup
  runId: process.env.RUN_ID
};

// QA overrides (only if not overridden via env vars)
if (env === 'QA') {
  config.appUrl =
    process.env.API_URL || 'https://qa-conduit-api.bondaracademy.com/api';
  config.userEmail =
    process.env.USER_EMAIL || 'qa-pwapiuser@test.com';
  config.userPassword =
    process.env.USER_PASSWORD || 'qa-Welcome';
}

export { config };