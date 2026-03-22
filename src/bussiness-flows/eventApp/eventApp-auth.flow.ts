import { EventAppPageManager } from '../../eventApp-pageObjects/eventApp-pageManager';
import { TestExecutionError } from '../../errors/testLevelGenericError';
import { consoleLogger } from '../../utils/logger';

/**
 * EventAppAuthFlow
 * ─────────────────
 * Business flow for EventApp authentication.
 *
 * Responsibilities:
 * - Orchestrates login using the 3-mode smartLogin from EventAppLoginPage
 * - Wraps errors with TestExecutionError so spec files get clean failure messages
 * - Handles logout via the login page
 *
 * Usage in a fixture or test:
 *   const pm = new EventAppPageManager(page);
 *   const authFlow = new EventAppAuthFlow(pm);
 *   await authFlow.loginAsValidUser(url, email, password);
 */
export class EventAppAuthFlow {

    private readonly pm: EventAppPageManager;

    constructor(pageManager: EventAppPageManager) {
        this.pm = pageManager;
    }

    /**
     * Log in using the 3-mode smart login.
     * MODE 1 / 2 / 3 is auto-detected based on page state at runtime.
     *
     * @param url      Application base URL to navigate to
     * @param email    User email address
     * @param password User password (masked in all log output)
     */
    async loginAsValidUser(url: string, email: string, password: string): Promise<void> {
        consoleLogger.info('EventAppAuthFlow.loginAsValidUser: Starting smart login. url=%s | email=%s', url, email);
        try {
            await this.pm.getEventAppLoginPage().smartLogin(url, email, password);
            consoleLogger.info('EventAppAuthFlow.loginAsValidUser: Login successful. email=%s', email);
        } catch (error: any) {
            consoleLogger.error('EventAppAuthFlow.loginAsValidUser: Login failed. email=%s | error=%s', email, error.message);
            throw new TestExecutionError(`EventApp login failed. Original error: ${error.message}`);
        }
    }

    /**
     * Log out of the EventApp session.
     * TODO: implement logout() on EventAppLoginPage once logout locators are confirmed.
     *       Add the locator to EventAppLoginPage and uncomment the call below.
     */
    async logout(): Promise<void> {
        consoleLogger.info('EventAppAuthFlow.logout: Initiating logout');
        // TODO: uncomment once EventAppLoginPage.logout() is implemented
        // await this.pm.getEventAppLoginPage().logout();
        consoleLogger.warn('EventAppAuthFlow.logout: Logout not yet implemented — skipping gracefully');
    }
}
