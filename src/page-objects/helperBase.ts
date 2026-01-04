import { Page, Locator, expect } from '@playwright/test';
import { UIError } from '../errors/uiError';
import { TIMEOUTS } from '../constants/timeout.constants';
import { UI_STATES } from '../constants/ui.constants';

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
            await locator.waitFor({ state: UI_STATES.VISIBLE });
            await locator.scrollIntoViewIfNeeded();
            await expect(locator).toBeEnabled();
            await locator.click();
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
     * - Element is visible
     * - Element is editable
     * - Value is filled reliably
     *
     * @param locator Playwright Locator for input field
     * @param value Text value to enter
     * @param errorMessage Optional custom failure message
     */
    protected async safeFill(
        locator: Locator,
        value: string,
        errorMessage?: string
    ): Promise<void> {
        try {
            await locator.waitFor({ state: UI_STATES.VISIBLE });
            await expect(locator).toBeEditable();
            await locator.fill(value);
        } catch (error) {
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
        await locator.waitFor({ state: UI_STATES.VISIBLE });
        return await locator.innerText();
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
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Waits until the current URL contains a specific value.
     *
     * @param partialUrl Partial URL string or identifier
     */
    protected async safeWaitForUrlContains(partialUrl: string): Promise<void> {
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
            await expect(locator).toBeVisible();
        } catch (error) {
            throw new UIError(errorMessage, error);
        }
    }

}
