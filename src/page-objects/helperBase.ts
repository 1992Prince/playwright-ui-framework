import { Page, Locator, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { UIError } from '../errors/uiError';
import { TIMEOUTS } from '../constants/timeout.constants';
import { UI_STATES } from '../constants/ui.constants';
import { consoleLogger } from '../utils/logger';

/**
 * HelperBase
 * -----------
 * Abstract base class for all Page Objects.
 *
 * Responsibilities:
 * - Holds shared Playwright `Page` instance
 * - Provides safe UI interaction wrappers
 * - Enforces page-level contract via `isAt()`
 *
 * Why abstract?
 * - Ensures consistency across all page objects
 * - Prevents duplicate defensive UI logic
 */
export abstract class HelperBase {

    protected readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Contract method that every Page Object MUST implement.
     *
     * Purpose:
     * - Verifies the page is fully loaded
     * - Confirms correct page identity (URL, heading, unique element)
     *
     * Called:
     * - After navigation
     * - Before performing any critical UI action
     */
    abstract isAt(): Promise<void>;

    /**
     * Hard wait utility (use sparingly).
     *
     * ⚠️ Note:
     * - Should NOT be used in normal flows
     * - Useful only for debugging or unavoidable delays
     *
     * @param seconds Number of seconds to wait
     */
    async waitForNumberOfSeconds(seconds: number): Promise<void> {
        await this.page.waitForTimeout(seconds * 1000);
    }

    /**
     * Safely clicks on a locator with built-in validations.
     *
     * What it handles:
     * - Waits for element to be visible
     * - Scrolls element into view
     * - Verifies element is enabled
     * - Clicks the element
     *
     * On failure:
     * - Throws `UIError` with page context
     * - Attaches root error for debugging
     *
     * @param locator Playwright Locator to click
     * @param errorMessage Optional custom failure message
     */
    protected async safeClick(
        locator: Locator,
        errorMessage?: string
    ): Promise<void> {
        try {
            consoleLogger.debug('%s.safeClick: Waiting for element to be visible', this.constructor.name);
            await locator.waitFor({ state: UI_STATES.VISIBLE });
            await locator.scrollIntoViewIfNeeded();
            await expect(locator).toBeEnabled();
            await locator.click();
            consoleLogger.debug('%s.safeClick: Element clicked successfully', this.constructor.name);
        } catch (error) {
            const pageName = this.constructor.name;

            throw new UIError(
                `[${pageName}] ${errorMessage ?? 'Failed to click on element'}`,
                error
            );
        }
    }

    /**
     * Safely fills a value into an input field.
     *
     * What it ensures:
     * - Element is visible and editable before filling
     * - Clears existing content before entering a new value
     * - Masks the logged value for password fields (isPassword=true)
     *
     * ⚠️ Always pass `isPassword: true` for password inputs so the value
     * never appears in plain text in logs or CI output.
     *
     * @param locator       Playwright Locator for input field
     * @param value         Text value to enter
     * @param errorMessage  Optional custom failure message
     * @param isPassword    Set to true to mask value in logs (default: false)
     */
    protected async safeFill(
        locator: Locator,
        value: string,
        errorMessage?: string,
        isPassword: boolean = false
    ): Promise<void> {
        // Mask sensitive values — passwords must never appear in plain text in logs
        const logValue = isPassword ? '***' : value;
        try {
            consoleLogger.debug('%s.safeFill: Waiting for input to be visible and editable. value=%s', this.constructor.name, logValue);
            await locator.waitFor({ state: UI_STATES.VISIBLE });
            await expect(locator).toBeEditable();
            // Clear existing content before filling to ensure a clean state
            await locator.clear();
            await locator.fill(value);
            consoleLogger.debug('%s.safeFill: Input filled successfully. value=%s', this.constructor.name, logValue);
        } catch (error) {
            consoleLogger.error('%s.safeFill: Failed to fill input. value=%s | error=%s',
                this.constructor.name, logValue, (error as any)?.message);
            throw new UIError(
                errorMessage ?? 'Failed to fill value into element',
                error
            );
        }
    }

    /**
     * Safely retrieves visible text from a locator.
     *
     * @param locator Playwright Locator
     * @returns Inner text of the element
     */
    protected async safeGetText(locator: Locator): Promise<string> {
        consoleLogger.debug('%s.safeGetText: Retrieving inner text', this.constructor.name);
        await locator.waitFor({ state: UI_STATES.VISIBLE });
        const text = await locator.innerText();
        consoleLogger.debug('%s.safeGetText: Retrieved text=%s', this.constructor.name, text);
        return text;
    }

    /**
     * Waits until page navigation is fully settled.
     *
     * Uses:
     * - `networkidle` to ensure no active network calls
     *
     * Ideal for:
     * - Page transitions
     * - Post-submit navigation
     */
    protected async safeWaitForNavigation(): Promise<void> {
        consoleLogger.debug('%s.safeWaitForNavigation: Waiting for networkidle', this.constructor.name);
        await this.page.waitForLoadState('networkidle');
        consoleLogger.debug('%s.safeWaitForNavigation: Page reached networkidle state', this.constructor.name);
    }

    /**
     * Waits until the current URL contains a specific value.
     *
     * @param partialUrl Partial URL string or identifier
     */
    protected async safeWaitForUrlContains(partialUrl: string): Promise<void> {
        consoleLogger.debug('%s.safeWaitForUrlContains: Waiting for URL to contain "%s"', this.constructor.name, partialUrl);
        await expect(this.page).toHaveURL(new RegExp(partialUrl));
    }

    /**
     * Safely asserts visibility of a locator.
     *
     * On failure:
     * - Throws a `UIError` instead of raw assertion error
     *
     * @param locator Playwright Locator
     * @param errorMessage Custom assertion failure message
     */
    protected async safeExpectVisible(
        locator: Locator,
        errorMessage: string
    ): Promise<void> {
        try {
            consoleLogger.debug('%s.safeExpectVisible: Asserting element is visible', this.constructor.name);
            await expect(locator).toBeVisible();
        } catch (error) {
            throw new UIError(errorMessage, error);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Dynamic Wait Helpers
    // Prefer these over hard sleeps (waitForNumberOfSeconds).
    // They resolve as soon as the condition is met, making tests faster and
    // more stable across different environments and network conditions.
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Waits until a locator becomes visible within the specified timeout.
     *
     * Why dynamic waits > hard sleeps:
     * - Resolves immediately when ready — never wastes time waiting
     * - Fails fast with a clear timeout error instead of silently proceeding
     * - Adapts to slow CI environments without inflating timeouts everywhere
     *
     * @param locator  Playwright Locator to wait for
     * @param timeout  Maximum ms to wait (defaults to TIMEOUTS.LONG)
     */
    protected async waitForVisible(
        locator: Locator,
        timeout: number = TIMEOUTS.LONG
    ): Promise<void> {
        consoleLogger.debug('%s.waitForVisible: Waiting up to %sms for element to be visible', this.constructor.name, timeout);
        try {
            await locator.waitFor({ state: UI_STATES.VISIBLE, timeout });
            consoleLogger.debug('%s.waitForVisible: Element is now visible', this.constructor.name);
        } catch (error) {
            consoleLogger.error('%s.waitForVisible: Element did not become visible within %sms', this.constructor.name, timeout);
            throw new UIError(
                `[${this.constructor.name}] Element did not become visible within ${timeout}ms`,
                error
            );
        }
    }

    /**
     * Waits until a locator becomes hidden or detached within the specified timeout.
     *
     * Useful for:
     * - Waiting for loading spinners to disappear
     * - Confirming a modal/toast has been dismissed
     * - Verifying a deleted element is gone from the DOM
     *
     * @param locator  Playwright Locator to wait on
     * @param timeout  Maximum ms to wait (defaults to TIMEOUTS.LONG)
     */
    protected async waitForHidden(
        locator: Locator,
        timeout: number = TIMEOUTS.LONG
    ): Promise<void> {
        consoleLogger.debug('%s.waitForHidden: Waiting up to %sms for element to be hidden', this.constructor.name, timeout);
        try {
            await locator.waitFor({ state: UI_STATES.HIDDEN, timeout });
            consoleLogger.debug('%s.waitForHidden: Element is now hidden', this.constructor.name);
        } catch (error) {
            consoleLogger.error('%s.waitForHidden: Element did not become hidden within %sms', this.constructor.name, timeout);
            throw new UIError(
                `[${this.constructor.name}] Element did not become hidden within ${timeout}ms`,
                error
            );
        }
    }

    /**
     * Returns whether a locator is currently visible in the DOM.
     *
     * Contract: never throws — always returns a boolean.
     * Use this for conditional logic (e.g. "if element exists, click it").
     * Do NOT use for assertions — use `safeExpectVisible` for that.
     *
     * @param locator Playwright Locator to check
     * @returns `true` if visible, `false` otherwise
     */
    protected async isVisible(locator: Locator): Promise<boolean> {
        try {
            const visible = await locator.isVisible();
            consoleLogger.debug('%s.isVisible: visibility=%s', this.constructor.name, visible);
            return visible;
        } catch {
            // Swallow all errors — this method must never throw
            consoleLogger.debug('%s.isVisible: Error checking visibility — returning false', this.constructor.name);
            return false;
        }
    }

    /**
     * Captures a full-page screenshot and saves it to `test-results/screenshots/`.
     *
     * When to call:
     * - Inside catch blocks just before rethrowing, to capture the failed UI state
     * - In test hooks (beforeEach/afterEach) for visual evidence of each step
     *
     * The returned path can be attached to the Playwright HTML report via
     * `testInfo.attach()` in the spec or fixture layer.
     *
     * @param name  Optional label used in the filename (defaults to class name)
     * @returns     Absolute path to the saved screenshot file
     */
    protected async takeScreenshot(name?: string): Promise<string> {
        const pageName   = this.constructor.name;
        const timestamp  = new Date().toISOString().replace(/[:.]/g, '-');
        const label      = name ?? pageName;
        const screenshotDir  = path.join('test-results', 'screenshots');
        const screenshotPath = path.join(screenshotDir, `${label}-${timestamp}.png`);

        try {
            // Ensure the target directory exists before writing
            fs.mkdirSync(screenshotDir, { recursive: true });
            consoleLogger.debug('%s.takeScreenshot: Capturing screenshot. path=%s', pageName, screenshotPath);
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            consoleLogger.info('%s.takeScreenshot: Screenshot saved. path=%s', pageName, screenshotPath);
            return screenshotPath;
        } catch (error: any) {
            consoleLogger.error('%s.takeScreenshot: Failed to capture screenshot. error=%s', pageName, error.message);
            throw new UIError(`[${pageName}] Failed to capture screenshot`, error);
        }
    }

}
