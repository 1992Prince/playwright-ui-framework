import { test, expect } from '@playwright/test';
import { PageManager } from '../page-objects/pageManager';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:4200/');
})

test('navigate to form page', async ({ page }) => {
  const pm = new PageManager(page);
  const navigationPage = pm.getNavigationPage();
  await navigationPage.formLayoutsPage();
  await navigationPage.datePickerPage();
  await navigationPage.smartTablePage();
  await navigationPage.toasterPage();
  await navigationPage.tooltipPage();

});

test('parametrized methods', async ({ page }) => {

  const pm = new PageManager(page);
  const navigationPage = pm.getNavigationPage();
  await navigationPage.formLayoutsPage();

  const formLayoutPage = pm.getFormLayoutPage();
  await formLayoutPage.submitUsingGridFormWithCredAndSelectOption('test@gmail.com', 'test123', 'Option 2');
  await page.waitForTimeout(3000);
  await formLayoutPage.submitInlineFormWithCredAndCheckbox('John Smith', 'john@email.com', true);
  await page.waitForTimeout(3000);
  //await page.pause();
});

