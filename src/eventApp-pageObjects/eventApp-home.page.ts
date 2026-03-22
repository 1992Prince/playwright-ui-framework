import { Page, Locator } from '@playwright/test';
import { HelperBase } from '../page-objects/helperBase';
import { consoleLogger } from '../utils/logger';
import { EventAppPageManager } from './eventApp-pageManager';

/**
 * EventAppHomePage
 * ─────────────────
 * Page Object for the EventApp authenticated homepage / dashboard.
 *
 * Receives EventAppPageManager so it can call CommonLocators action methods
 * (e.g. verify nav is visible in isAt()) without re-defining shared locators.
 *
 * Add locators and methods here as you build out coverage for the homepage.
 * All interactions must use HelperBase safe wrappers (safeClick, safeFill, etc.)
 * Never add expect() assertions inside this class — keep assertions in spec files.
 */
export class EventAppHomePage extends HelperBase {

    // PageManager reference — used to access shared CommonLocators methods.
    // Page-specific locators are still defined directly on this class.
    private readonly pm: EventAppPageManager;

    // ── Locators ──────────────────────────────────────────────────────────────
    private readonly pageHeading: Locator;
    private readonly userAccountMenu: Locator;
    private readonly dilliWalaMelaEvent: Locator;

    constructor(page: Page, pm: EventAppPageManager) {
        super(page);
        this.pm = pm;

        // TODO: Replace with real EventApp homepage locators
        this.pageHeading        = page.getByText('Amazing Events');
        this.userAccountMenu    = page.locator('[data-testid="user-account-menu"]');
        this.dilliWalaMelaEvent = page.getByText('Dilli Diwali Mela');
    }

    /**
     * Verifies the homepage is loaded.
     * Checks both the shared navigation chrome (via CommonLocators) and the
     * page-specific heading so both layers confirm correct state.
     */
    async isAt(): Promise<void> {
        await this.page.waitForURL('**/dashboard**');
        // Shared chrome check — delegates to CommonLocators action methods
        await this.pm.getEventAppCommonLocators().expectNavBookingsVisible();
    }

    /**
     * Verifies the homepage is displayed correctly after login.
     * Called by EventAppLoginPage (MODE 1, 2, 3) to confirm auth state.
     */
    async verifyHomepageLoaded(): Promise<void> {
        consoleLogger.info('EventAppHomePage.verifyHomepageLoaded: Verifying homepage is displayed');
        await this.safeExpectVisible(
            this.pageHeading,
            'EVENTAPP HOME ERROR: Dashboard heading not visible — homepage did not load correctly'
        );
        consoleLogger.info('EventAppHomePage.verifyHomepageLoaded: Homepage loaded and verified');
    }

    // TODO: Add more page-specific methods below as needed
    // Example:
    // async clickCreateEvent(): Promise<void> { ... }
    // async getWelcomeMessage(): Promise<string> { ... }

    // click on dilli wala mela event on homepage
    async clickDilliWalaMelaEvent(): Promise<void> {
        consoleLogger.info('EventAppHomePage.clickDilliWalaMelaEvent: Clicking on Dilli Wala Mela event');
        await this.safeClick(
            this.dilliWalaMelaEvent,
            'EVENTAPP HOME ERROR: Dilli Wala Mela event not found on homepage'
        );
        consoleLogger.info('EventAppHomePage.clickDilliWalaMelaEvent: Clicked on Dilli Wala Mela event');
    }
}
