import { test as base, Page } from '@playwright/test';
import { PageManager } from '../page-objects/pageManager';
import { AuthFlow } from '../bussiness-flows/auth.flow';
import { config } from '../config/config';
import { TestExecutionError } from '../errors/testLevelGenericError';
import { consoleLogger } from '../utils/consoleLoggerSingletonInstance'


type AuthFixtures = {
  authenticatedPage: Page;
  config: typeof config;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    consoleLogger.info('--- Fixture Setup: Authenticated Page ---');
    // Create PageManager per test
    const pm = new PageManager(page);
    consoleLogger.info('PageManager created for the test.');

    // Create Auth Business Flow
    const authFlow = new AuthFlow(pm);
    consoleLogger.info('AuthFlow created.');

    // ---------- Setup ----------
    try {
      consoleLogger.info('Attempting to log in as a valid user...');
      consoleLogger.debug(`User: ${config.userEmail}, App URL: ${config.appUrl}`);
      await authFlow.loginAsValidUser(
        config.userEmail,
        config.userPassword,
        config.appUrl
      );
      consoleLogger.info('Login successful.');
    } catch (error: any) {
      consoleLogger.error(`Login to Application failed: ${error.message}`);
      throw new TestExecutionError(`Failed to Login. Original error: ${error.message}`);
    }

    // Provide authenticated page
    consoleLogger.info('Providing authenticated page to the test.');
    await use(page);

    // Teardown (logout)
    consoleLogger.info('--- Fixture Teardown: Authenticated Page ---');
    consoleLogger.info('Attempting to logout...');
    await authFlow.logout();
    consoleLogger.info('Logout successful.');
    consoleLogger.info('--- Fixture Teardown Complete ---');
  },
  config: async ({ }, use) => {
    await use(config);
  }
});
