import { Page, Locator } from '@playwright/test';

export class CommonLocators {
  readonly settingsLink: Locator;
  readonly logoutButton: Locator;
  readonly globalLoader: Locator;
  readonly toastMessage: Locator;
  readonly signInLink: Locator;

  constructor(page: Page) {
    this.settingsLink = page.locator("//*[@routerLink='/settings']");
    this.logoutButton = page.getByText('Or click here to logout.');
    this.globalLoader = page.locator('.loading-spinner');
    this.toastMessage = page.locator('.toast-message');
    this.signInLink = page.locator("//a[text()=' Sign in ']");
  }
}
