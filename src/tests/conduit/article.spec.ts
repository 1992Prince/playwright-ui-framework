import { TestExecutionError } from '../../errors/testLevelGenericError';
import { test } from '../../fixtures/auth.fixture';
import { PageManager } from '../../page-objects/pageManager';
import { consoleLogger } from '../../utils/consoleLoggerSingletonInstance'

test.beforeAll('run once before all tests', async ({ config }) => {

    consoleLogger.info('beforeAll: Opening Application=%s', config.Application);
    consoleLogger.debug('beforeAll: Auth API URL=%s', config.Env);
    consoleLogger.warn('beforeAll: This is warn message');
    consoleLogger.error('beforeAll: This is error message');

});

test('Create and Delete Article Test', async ({ authenticatedPage }) => {

  consoleLogger.info('Start of test: Create and Delete Article Test');
  const pm = new PageManager(authenticatedPage);
  consoleLogger.info('PageManager created');

  const articleFlow = pm.getArticleFlow();
  consoleLogger.info('Got article flow');

  const articleTitle = 'Test Article Title';
  consoleLogger.debug(`Article title: ${articleTitle}`);

  // Create Auth Business Flow
  try {
    await articleFlow
      .withTitle(articleTitle)
      .withAbout('About Test Article')
      .withContent('This is the content of the test article.')
      .withTags('test,article')
      .publish();
    consoleLogger.info('Article published successfully');
  } catch (error: any) {
    consoleLogger.error(`Error publishing article: ${error.message}`);
    throw new TestExecutionError(`Failed to publish article. Original error: ${error.message}`);
  }


  consoleLogger.warn('About to delete the article. This is a warning log.');
  await pm.getArticleFlow().deleteCurrentArticle();
  consoleLogger.info('Article deleted successfully');

  await authenticatedPage.waitForTimeout(2000);
  consoleLogger.info('End of test: Create and Delete Article Test');
  //await authenticatedPage.pause();
});
