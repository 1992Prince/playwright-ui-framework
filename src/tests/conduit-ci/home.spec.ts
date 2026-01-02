import { expect } from '@playwright/test';
import { test } from '../../fixtures/auth.fixture';
import { PageManager } from '../../page-objects/pageManager';
import { consoleLogger } from '../../utils/consoleLoggerSingletonInstance'
import { TestExecutionError } from '../../errors/testLevelGenericError';


test.beforeAll('run once before all tests', async ({ config }) => {

  consoleLogger.info('beforeAll: Opening Application=%s', config.Application);
  consoleLogger.debug('beforeAll: Auth API URL=%s', config.Env);
  consoleLogger.info('RUN-ID=%s', process.env.RUN_ID);

});

test('Validate home page after login @regression', async ({ authenticatedPage }) => {

  consoleLogger.info('Start of test: Validate home page after login');
  const pm = new PageManager(authenticatedPage);
  consoleLogger.info('PageManager created');
  const articleFlow = pm.getArticleFlow();
  consoleLogger.info('Got article flow');
  const allTagsText = await articleFlow.getAllTagsList();
  consoleLogger.info('Tags on home page: %s', allTagsText);
  consoleLogger.info('End of test: Validate home page after login');
});

test('Validate home page after login2 @smoke', async ({ authenticatedPage }) => {

  consoleLogger.info('Start of test: Validate home page after login');
  const pm = new PageManager(authenticatedPage);
  consoleLogger.info('PageManager created');
  const articleFlow = pm.getArticleFlow();
  consoleLogger.info('Got article flow');
  const allTagsText = await articleFlow.getAllTagsList();
  consoleLogger.info('Tags on home page: %s', allTagsText);
  consoleLogger.info('End of test: Validate home page after login');
});

test('Validate home page after login3 @sanity', async ({ authenticatedPage }) => {

  let allTagsText: string[];

  try {
    const pm = new PageManager(authenticatedPage);
    const articleFlow = pm.getArticleFlow();
    allTagsText = await articleFlow.getAllTagsList();
  } catch (error) {
    throw new TestExecutionError(
      `Failed to fetch tags. Original error: ${(error as Error).message}`
    );
  }

  // ✅ Assertions should fail naturally
  expect(allTagsText.length).toBeGreaterThan(0);
  expect(allTagsText).toContain('Global');

});

test('Validate home page after login4 @bvt', async ({ authenticatedPage }) => {

  consoleLogger.info('Start of test: Validate home page after login');
  const pm = new PageManager(authenticatedPage);
  consoleLogger.info('PageManager created');
  const articleFlow = pm.getArticleFlow();
  consoleLogger.info('Got article flow');
  const allTagsText = await articleFlow.getAllTagsList();
  consoleLogger.info('Tags on home page: %s', allTagsText);
  consoleLogger.info('End of test: Validate home page after login');
});
