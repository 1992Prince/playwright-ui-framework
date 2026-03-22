import { Page, Locator } from '@playwright/test';
import { HelperBase } from 'src/page-objects/helperBase';

/**
 * EventAppCommonLocators
 * ───────────────────────
 * Central registry for locators AND actions shared across multiple EventApp pages.
 *
 * Two responsibilities:
 *   1. Holds `readonly` Locator properties for every shared element.
 *   2. Exposes named action methods (click, verify, isVisible) for those elements.
 *      Consumers call the method — they never reach into the locator directly.
 *
 * Rules:
 * - Add a locator here ONLY if it appears on 2 or more pages.
 * - Page-specific locators belong in that page's own POM class.
 * - Never instantiate this class directly in POMs or tests.
 *   Always access via:  pm.getEventAppCommonLocators().<methodName>()
 *
 * Adding a new shared element:
 *   1. Declare the locator as readonly below
 *   2. Initialise it in the constructor
 *   3. Add click / verify / isVisible action methods in the relevant section
 */
export class EventAppCommonLocators extends HelperBase {

    // ── Navigation locators ───────────────────────────────────────────────────
    // Keep these readonly — consumers must call the action methods below,
    // not interact with the raw Locator directly.
    private readonly navBookings: Locator;
    private readonly navApiDocs:  Locator;

    constructor(page: Page) {
        super(page);
        this.navBookings = page.locator("//a[@id='nav-bookings']");
        this.navApiDocs  = page.getByText('API Docs');
    }

    // ── isAt — verify shared chrome is present ────────────────────────────────
    /**
     * Asserts that the core navigation elements are visible.
     * Called from POMs' isAt() and from flow-level "page loaded" checks
     * to confirm the full app chrome has rendered correctly.
     */
    async isAt(): Promise<void> {
        await this.safeExpectVisible(
            this.navBookings,
            'COMMON LOCATORS ERROR: Bookings nav link not visible — page may not have loaded correctly'
        );
        await this.safeExpectVisible(
            this.navApiDocs,
            'COMMON LOCATORS ERROR: API Docs nav link not visible — page may not have loaded correctly'
        );
    }

    // ── Navigation — click actions ────────────────────────────────────────────

    /** Clicks the Bookings link in the top navigation bar. */
    async clickNavBookings(): Promise<void> {
        await this.safeClick(
            this.navBookings,
            'COMMON LOCATORS ERROR: Unable to click Bookings nav link'
        );
    }

    /** Clicks the API Docs link in the top navigation bar. */
    async clickNavApiDocs(): Promise<void> {
        await this.safeClick(
            this.navApiDocs,
            'COMMON LOCATORS ERROR: Unable to click API Docs nav link'
        );
    }

    // ── Navigation — visibility assertions ───────────────────────────────────

    /** Asserts that the Bookings nav link is visible. Throws UIError on failure. */
    async expectNavBookingsVisible(): Promise<void> {
        await this.safeExpectVisible(
            this.navBookings,
            'COMMON LOCATORS ERROR: Bookings nav link is not visible'
        );
    }

    /** Asserts that the API Docs nav link is visible. Throws UIError on failure. */
    async expectNavApiDocsVisible(): Promise<void> {
        await this.safeExpectVisible(
            this.navApiDocs,
            'COMMON LOCATORS ERROR: API Docs nav link is not visible'
        );
    }

    // ── Navigation — boolean checks ───────────────────────────────────────────
    // Use these for conditional logic only — NOT for assertions.
    // "Is the nav visible right now?" → use isNavBookingsVisible()
    // "The nav MUST be visible"       → use expectNavBookingsVisible()

    /** Returns true if the Bookings nav link is currently visible. Never throws. */
    async isNavBookingsVisible(): Promise<boolean> {
        return this.isVisible(this.navBookings);
    }

    /** Returns true if the API Docs nav link is currently visible. Never throws. */
    async isNavApiDocsVisible(): Promise<boolean> {
        return this.isVisible(this.navApiDocs);
    }
}
