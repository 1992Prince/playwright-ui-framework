import { test as base } from '@playwright/test';
import { EventAppPageManager } from '../eventApp-pageObjects/eventApp-pageManager';
import { EventAppAuthFlow } from '../bussiness-flows/eventApp/eventApp-auth.flow';
import { TestExecutionError } from '../errors/testLevelGenericError';
import { consoleLogger } from '../utils/logger';
import { config } from '../config/config';

// -- EventApp environment config -----------------------------------------------
// Override via environment variables in CI; defaults are used for local dev.
const EVENTAPP_URL   = process.env.EVENTAPP_URL   ?? 'https://eventhub.rahulshettyacademy.com/login';
const EVENTAPP_EMAIL = process.env.EVENTAPP_EMAIL ?? 'eventhubtestuser1@gmail.com';
const EVENTAPP_PASS  = process.env.EVENTAPP_PASS  ?? 'Eventhub@2026';
// -----------------------------------------------------------------------------

type EventAppFixtures = {
    /**
     * Authenticated EventAppPageManager - ONE instance per test.
     *
     * Rules for spec files:
     *   OK  - Create business flow objects from it:  new EventAppHomeFlow(eventAppPm)
     *   OK  - Call flow methods:                     homeFlow.verifyHomepageLoaded()
     *   NOT - Never call POM methods directly:       eventAppPm.getEventAppHomePage().anything()
     *   NOT - Never call getPage() or access raw UI
     *
     * How to add a new flow for a test:
     *   1. Create src/bussiness-flows/eventApp/eventApp-<feature>.flow.ts
     *   2. In the test: const myFlow = new EventAppMyFlow(eventAppPm);
     */
    eventAppPm: EventAppPageManager;
    config: typeof config;
};

/**
 * EventApp test fixture.
 *
 * Import `test` from this file in any EventApp spec that requires an authenticated session:
 *
 *   import { test } from '../../fixtures/eventApp-auth.fixture';
 *   import { expect } from '@playwright/test';
 */
export const test = base.extend<EventAppFixtures>({

    // -- Session fixture -------------------------------------------------------
    // Setup:    Creates ONE EventAppPageManager, performs login via EventAppAuthFlow.
    // Exposes:  pm - tests create business flows from this and call flow methods only.
    // Teardown: Calls authFlow.logout() - always runs even if the test fails.
    eventAppPm: async ({ page }, use) => {
        consoleLogger.info('--- EventApp Fixture Setup ---');
        consoleLogger.info('EventApp Fixture: url=%s | email=%s | runId=%s',
            EVENTAPP_URL, EVENTAPP_EMAIL, process.env.RUN_ID);

        const pm       = new EventAppPageManager(page);  // ONE instance for the entire test
        const authFlow = new EventAppAuthFlow(pm);

        // -- Setup: Login -----------------------------------------------------
        try {
            consoleLogger.info('EventApp Fixture: Attempting login');
            await authFlow.loginAsValidUser(EVENTAPP_URL, EVENTAPP_EMAIL, EVENTAPP_PASS);
            consoleLogger.info('EventApp Fixture: Login successful - providing pm to test');
        } catch (error: any) {
            consoleLogger.error('EventApp Fixture: Login failed. error=%s', error.message);
            throw new TestExecutionError(`EventApp fixture setup failed. Original error: ${error.message}`);
        }

        // Provide pm to the test - test creates flows from this, never calls POMs directly
        await use(pm);

        // -- Teardown: Logout --------------------------------------------------
        // Always runs after the test body, even on test failure.
        consoleLogger.info('--- EventApp Fixture Teardown ---');
        try {
            await authFlow.logout();
            consoleLogger.info('EventApp Fixture: Logout completed');
        } catch (error: any) {
            // Non-fatal - warn and continue so test results are not masked by teardown errors
            consoleLogger.warn('EventApp Fixture: Logout failed (non-fatal). error=%s', error.message);
        }
        consoleLogger.info('--- EventApp Fixture Teardown Complete ---');
    },
    config: async ({ }, use) => {
    await use(config);
  }
});
