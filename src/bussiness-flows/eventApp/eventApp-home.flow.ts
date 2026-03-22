import { EventAppPageManager } from '../../eventApp-pageObjects/eventApp-pageManager';
import { consoleLogger } from '../../utils/logger';

/**
 * EventAppHomeFlow
 * ─────────────────
 * Business flow for EventApp homepage actions.
 *
 * Responsibilities:
 * - Wraps all homepage POM interactions behind named business-level methods
 * - Returns data that tests need for assertions (e.g. current URL)
 * - Must NOT contain expect() assertions — assertions belong in spec files only
 *
 * Receives EventAppPageManager in its constructor — never a raw Page.
 * Instantiated by the fixture, not by tests.
 */
export class EventAppHomeFlow {

    private readonly pm: EventAppPageManager;

    constructor(pm: EventAppPageManager) {
        this.pm = pm;
    }

    /**
     * Verifies the EventApp homepage is loaded and fully rendered after login.
     * Returns the current page URL so the calling test can assert correct navigation.
     *
     * @returns Current page URL after homepage is verified
     */
    async verifyHomepageLoaded(): Promise<string> {
        consoleLogger.info('EventAppHomeFlow.verifyHomepageLoaded: Verifying homepage is loaded');
        // validate common nav links are visible to confirm the page is fully rendered
        await this.pm.getEventAppCommonLocators().isAt();
        // validate homepage-specific elements are visible
        await this.pm.getEventAppHomePage().verifyHomepageLoaded();
        const currentUrl = this.pm.getPage().url();
        consoleLogger.info('EventAppHomeFlow.verifyHomepageLoaded: Homepage verified. currentUrl=%s', currentUrl);
        return currentUrl;
    }

    // ── Add more homepage business flows below ────────────────────────────────
    // Example:
    // async searchForEvent(keyword: string): Promise<string[]> { ... }
    // async getWelcomeMessage(): Promise<string> { ... }
}
