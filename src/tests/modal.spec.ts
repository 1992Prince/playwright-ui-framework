import { test, expect } from '@playwright/test';
import { PageManager } from '../page-objects/pageManager';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:4200/');
})

test('random toaster generator validation', async ({ page }) => {
  const pm = new PageManager(page);
  const navigationPage = pm.getNavigationPage();
  await navigationPage.toasterPage();
  await page.waitForTimeout(3000);
  const toasterPage = pm.getToasterPage();
  await toasterPage.getRandomToasterMsz();
  await page.pause();

});

test('toaster generator validation with toast type', async ({ page }) => {
  const pm = new PageManager(page);
  const navigationPage = pm.getNavigationPage();
  await navigationPage.toasterPage();
  await page.waitForTimeout(3000);
  const toasterPage = pm.getToasterPage();
  await toasterPage.selectToastTypeAndGenerateToast('danger'); // success, info, warning, danger
  await page.pause();

});

test('coloured tooltip hover ', async ({ page }) => {
  const pm = new PageManager(page);
  const navigationPage = pm.getNavigationPage();
  await navigationPage.tooltipPage();
  await page.waitForTimeout(3000);
  const tooltipPage = pm.getTooltipPage();
  await tooltipPage.hoverOnToolTip('Danger'); // Default, Primary, Success, Info, Warning, Danger
  await page.pause();

});
