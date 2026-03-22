import { Page, Locator, expect } from '@playwright/test';
import { HelperBase } from '../page-objects/helperBase';
import { consoleLogger } from '../utils/logger';

/**
 * EventAppLoginPage
 * ──────────────────
 * Page Object for the EventApp login page.
 *
 * Smart Login Logic (3 modes):
 *   MODE 1 — Email input visible → fill email → fill password → click login → wait for homepage element
 *   MODE 2 — Email input NOT visible, password visible → fill password only → click login → wait for homepage element
 *   MODE 3 — Neither input visible → homepage element already visible → validate and proceed
 *
 * To adapt for a different app:
 *   - Update the locators in the constructor with app-specific selectors
 *   - Update `homepageElement` to an element that only appears after login
 *   - Keep smartLogin() unchanged — the logic is generic
 */
export class EventAppLoginPage extends HelperBase {

    // ── Locators ──────────────────────────────────────────────────────────────
    // Replace these selectors with EventApp-specific ones

    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;

    // An element that is ONLY visible when the user is authenticated
    // (e.g. a dashboard heading, user avatar, or nav menu item)
    private readonly homepageElement: Locator;

    // Used in log messages and screenshot file names to identify the app
    private readonly appName: string = 'EventApp';

    constructor(page: Page) {
        super(page);

        // TODO: Replace placeholder selectors with real EventApp selectors
        this.emailInput      = page.getByPlaceholder('you@email.com');
        this.passwordInput   = page.getByLabel('Password');
        this.loginButton     = page.getByText('Sign In');
        this.homepageElement = page.getByText('Amazing Events');
    }

    /**
     * Verifies the login page is loaded.
     * TODO: implement with a URL pattern or unique element check.
     *       Like wait for URL /login or wait for a unique heading or form element on the login page.
     */
    async isAt(): Promise<void> {
        await this.page.waitForURL('**/login**');
    }

    /**
     * Navigate to the app and execute the correct login mode based on page state.
     *
     * @param url      Application base URL
     * @param email    User email address
     * @param password User password (masked in logs)
     */
    async smartLogin(url: string, email: string, password: string): Promise<void> {
        consoleLogger.info('%s.smartLogin: Navigating to url=%s | email=%s', this.appName, url, email);
        await this.page.goto(url);

        try {

            // ── MODE 1: Email input is visible — full login ──────────────────
            if (await this.isVisible(this.emailInput)) {
                consoleLogger.info('%s.smartLogin: MODE 1 — Email field visible, performing full login', this.appName);

                await this.safeFill(this.emailInput, email,
                    `${this.appName} LOGIN ERROR: Unable to fill email`);
                await this.safeFill(this.passwordInput, password,
                    `${this.appName} LOGIN ERROR: Unable to fill password`, true);
                await this.safeClick(this.loginButton.last(),
                    `${this.appName} LOGIN ERROR: Unable to click Login button`);

                await this.waitForVisible(this.homepageElement);
                //expect(this.homepageElement).toBeVisible({ timeout: 10000 });
                consoleLogger.info('%s.smartLogin: MODE 1 complete — homepage element visible', this.appName);

            // ── MODE 2: Password input visible, email already filled ─────────
            // if email locator is not visible but password locator is visible, we assume email is pre-filled and we just need to enter password and submit
            } else if (await this.isVisible(this.passwordInput)) {
                consoleLogger.info('%s.smartLogin: MODE 2 — Email pre-filled, entering password only', this.appName);

                await this.safeFill(this.passwordInput, password,
                    `${this.appName} LOGIN ERROR: Unable to fill password`, true);
                await this.safeClick(this.loginButton,
                    `${this.appName} LOGIN ERROR: Unable to click Login button`);

                await this.waitForVisible(this.homepageElement);
                consoleLogger.info('%s.smartLogin: MODE 2 complete — homepage element visible', this.appName);

            // ── MODE 3: Already authenticated — validate homepage ────────────
            } else {
                consoleLogger.info('%s.smartLogin: MODE 3 — No login form detected, validating homepage', this.appName);

                await this.safeExpectVisible(this.homepageElement,
                    `${this.appName} LOGIN ERROR: MODE 3 — Homepage element not visible, user may not be authenticated`);
                consoleLogger.info('%s.smartLogin: MODE 3 complete — homepage element confirmed visible', this.appName);
            }

        } catch (error: any) {
            consoleLogger.error('%s.smartLogin: Login failed — capturing screenshot. error=%s', this.appName, error.message);
            await this.takeScreenshot(`${this.appName}-smartlogin-failure`);
            throw error;
        }
    }
}
