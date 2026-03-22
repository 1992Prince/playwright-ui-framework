import { test } from '../../fixtures/eventApp-auth.fixture';
import { expect } from '@playwright/test';
import { EventAppHomeFlow } from '../../bussiness-flows/eventApp/eventApp-home.flow';
import { TestExecutionError } from '../../errors/testLevelGenericError';
import { consoleLogger } from '../../utils/logger';
import { getTestData } from "../../utils/data-factory";

// ── beforeAll: runs once before all tests in this file ───────────────────────
test.beforeAll('EventApp suite setup', async ( {config} ) => {
    consoleLogger.info('beforeAll: EventApp login suite starting. runId=%s', process.env.RUN_ID);
    consoleLogger.info('beforeAll: Opening Application=%s', config.EventApplication);
    consoleLogger.debug('beforeAll: Auth API URL=%s', config.Env);
    consoleLogger.info('RUN-ID=%s', process.env.RUN_ID);
});

// ── Test: Validate login and homepage ────────────────────────────────────────
//
// Pattern:
//   1. Fixture provides eventAppPm (authenticated, ONE instance)
//   2. Test creates a business flow using pm — no POM methods called directly
//   3. Test calls flow method — all UI interactions happen inside the flow
//   4. Assertions outside try/catch

test('Validate EventApp homepage loads after login ', async ({ eventAppPm }) => {
    consoleLogger.info('Start of test: Validate EventApp homepage loads after login');

    // Create the flow needed for this test — pass pm, never instantiate POMs
    const homeFlow = new EventAppHomeFlow(eventAppPm);

    // ── Action ───────────────────────────────────────────────────────────────
    let currentUrl: string;
    try {
        currentUrl = await homeFlow.verifyHomepageLoaded();
        consoleLogger.info('EventApp homepage verified. currentUrl=%s', currentUrl);
    } catch (error: any) {
        consoleLogger.error('Failed to verify EventApp homepage. error=%s', error.message);
        throw new TestExecutionError(`Homepage verification failed. Original error: ${error.message}`);
    }

    // ── Assertions (always outside try/catch) ────────────────────────────────
    expect(currentUrl).toContain('eventhub.rahulshettyacademy.com');

    consoleLogger.info('End of test: Validate EventApp homepage loads after login');
});



// read test data from JSON file from testData folder using the getTestData() utility function
const loginData = getTestData("eventApp-login");

test('Load login creds from testData file sample ', async ({ eventAppPm }) => {
    consoleLogger.info('Start of test: Validate EventApp homepage loads after login');

    consoleLogger.info('Login creds from testData: email=%s | password=%s', loginData.invalidLogin.inputs.username,
        loginData.validLogin.inputs.password);

    consoleLogger.info('Login creds from testData: email=%s | password=%s', loginData.invalidLogin.inputs.username,
        loginData.invalidLogin.inputs.password);

    consoleLogger.info('End of test: Validate EventApp homepage loads after login');
});

// ── Template: Add more EventApp tests below ──────────────────────────────────
//
// test('Describe what the test validates @smoke', async ({ eventAppPm }) => {
//     consoleLogger.info('Start of test: <description>');
//
//     const myFlow = new EventApp<Feature>Flow(eventAppPm);  // ← create the flow you need
//
//     let result: <type>;
//     try {
//         result = await myFlow.<method>();
//     } catch (error: any) {
//         consoleLogger.error('Failed: %s', error.message);
//         throw new TestExecutionError(`<context>. Original error: ${error.message}`);
//     }
//
//     expect(result).<assertion>;
//     consoleLogger.info('End of test: <description>');
// });
