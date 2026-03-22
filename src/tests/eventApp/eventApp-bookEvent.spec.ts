import { test } from '../../fixtures/eventApp-auth.fixture';
import { expect } from '@playwright/test';
import { EventAppHomeFlow } from '../../bussiness-flows/eventApp/eventApp-home.flow';
import { TestExecutionError } from '../../errors/testLevelGenericError';
import { consoleLogger } from '../../utils/logger';
import { BookEventAppFlow } from 'src/bussiness-flows/eventApp/eventApp-bookEvent.flow';

// ── beforeAll: runs once before all tests in this file ───────────────────────
test.beforeAll('EventApp suite setup', async () => {
    consoleLogger.info('beforeAll: EventApp login suite starting. runId=%s', process.env.RUN_ID);
});

// ── Test: Booking Event Successfully ────────────────────────────────────────
//

test('Validate EventApp Booking Flow', async ({ eventAppPm }) => {
    consoleLogger.info('Start of test: Validate EventApp booking flow');

    // Create the flow needed for this test — pass pm, never instantiate POMs
    const bookingFlow = new BookEventAppFlow(eventAppPm);

    // ── Action ───────────────────────────────────────────────────────────────
    let currentUrl: string;
    try {
        await bookingFlow.bookEvent();
        
        consoleLogger.info('EventApp booking flow completed successfully.');
    } catch (error: any) {
        consoleLogger.error('Failed to complete EventApp booking flow. error=%s', error.message);
        throw new TestExecutionError(`Booking flow failed. Original error: ${error.message}`);
    }

    // ── Assertions (always outside try/catch) ────────────────────────────────
    

    consoleLogger.info('End of test: Validate EventApp booking flow');
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
