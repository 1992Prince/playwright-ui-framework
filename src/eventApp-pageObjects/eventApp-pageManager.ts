import { Page } from '@playwright/test';
import { EventAppCommonLocators } from './eventApp-commonLocators';
import { EventAppLoginPage } from './eventApp-login.page';
import { EventAppHomePage } from './eventApp-home.page';
import { EventAppDetailsPage } from './eventApp-eventDetails.page';

/**
 * EventAppPageManager
 * ────────────────────
 * Single entry point for all EventApp page objects.
 *
 * Rules:
 * - Never instantiate EventApp page objects directly in test files or flows.
 * - Always access them through this manager.
 * - All getters use lazy ??= initialisation — pages are only created when first needed.
 *
 * To add a new page:
 *   1. Import the new page class above
 *   2. Add a private optional field: `private myNewPage?: MyNewPage;`
 *   3. Add a getter: `getMyNewPage(): MyNewPage { return this.myNewPage ??= new MyNewPage(this.page); }`
 */
export class EventAppPageManager {

    private readonly page: Page;

    private commonLocators?:  EventAppCommonLocators;
    private loginPage?:       EventAppLoginPage;
    private homePage?:        EventAppHomePage;
    private eventDetailsPage?: EventAppDetailsPage;

    constructor(page: Page) {
        this.page = page;
    }

    /** Returns the underlying Playwright Page instance. Used by fixtures to expose the page without creating a second PageManager. */
    getPage(): Page {
        return this.page;
    }

    /** Shared locators used across multiple pages — navigation links, spinners, toasts etc. */
    getEventAppCommonLocators(): EventAppCommonLocators {
        return this.commonLocators ??= new EventAppCommonLocators(this.page);
    }

    getEventAppLoginPage(): EventAppLoginPage {
        return this.loginPage ??= new EventAppLoginPage(this.page);
    }

    getEventAppHomePage(): EventAppHomePage {
        return this.homePage ??= new EventAppHomePage(this.page, this);
    }

    getEventAppEventDetailsPage(): EventAppDetailsPage {
        return this.eventDetailsPage ??= new EventAppDetailsPage(this.page);
    }
}
