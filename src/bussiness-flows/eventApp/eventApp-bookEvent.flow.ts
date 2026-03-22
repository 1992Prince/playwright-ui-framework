import { EventAppPageManager } from '../../eventApp-pageObjects/eventApp-pageManager';
import { consoleLogger } from '../../utils/logger';

/**
 * BookEventAppFlow
 * ─────────────────
 * Business flow for EventApp booking actions.
 *
 * Responsibilities:
 * - Wraps all booking POM interactions behind named business-level methods
 * - Returns data that tests need for assertions (e.g. current URL)
 * - Must NOT contain expect() assertions — assertions belong in spec files only
 *
 * Receives EventAppPageManager in its constructor — never a raw Page.
 * Instantiated by the fixture, not by tests.
 */
export class BookEventAppFlow {

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
    async bookEvent(): Promise<void> {
        consoleLogger.info('BookEventAppFlow.bookEvent: Booking event');
        await this.pm.getEventAppEventDetailsPage().clickDilliWalaMelaEvent();
        await this.pm.getEventAppEventDetailsPage().verifyEventDetailsPage();
        // below data should code from Test data file, hardcoding here just for demo purpose
        await this.pm.getEventAppEventDetailsPage().bookEvent('John Doe', 'john.doe@example.com', 1234567890);
        consoleLogger.info('BookEventAppFlow.bookEvent: Clicked on Dilli Wala Mela event and verified details page');
    }

    // ── Add more booking business flows below ────────────────────────────────
    // Example:
    // async searchForEvent(keyword: string): Promise<string[]> { ... }
    // async getWelcomeMessage(): Promise<string> { ... }
}
