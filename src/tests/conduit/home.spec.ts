import { test } from '../../fixtures/auth.fixture';
import { PageManager } from '../../page-objects/pageManager';
import { consoleLogger } from '../../utils/consoleLoggerSingletonInstance'


test.beforeAll('run once before all tests', async ({ config }) => {

    consoleLogger.info('beforeAll: Opening Application=%s', config.Application);
    consoleLogger.debug('beforeAll: Auth API URL=%s', config.Env);
    consoleLogger.warn('beforeAll: This is warn message');
    consoleLogger.error('beforeAll: This is error message');

});

test('Validate home page after login', async ({ authenticatedPage }) => {

  consoleLogger.info('Start of test: Validate home page after login');
  const pm = new PageManager(authenticatedPage);
  consoleLogger.info('PageManager created');
  const articleFlow = pm.getArticleFlow();
  consoleLogger.info('Got article flow');
  const allTagsText = await articleFlow.getAllTagsList();
  consoleLogger.info('Tags on home page: %s', allTagsText);
  consoleLogger.info('End of test: Validate home page after login');
});
