import { Page, Locator, expect } from '@playwright/test';
import { UIError } from '../errors/uiError';

export abstract class HelperBase {

    protected readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // -------------------------------
    // Mandatory contract for every page
    // -------------------------------
    abstract isAt(): Promise<void>;

    async waitForNumberOfSeconds(seconds: number) {
        await this.page.waitForTimeout(seconds * 1000);
    }

    // -------------------------------
    // Safe Actions (Dynamic waits)
    // -------------------------------
    // protected async safeClick(
    //     locator: Locator,
    //     errorMessage?: string
    // ): Promise<void> {
    //     try {
    //         await locator.waitFor({ state: 'visible' });
    //         await locator.scrollIntoViewIfNeeded();
    //         await expect(locator).toBeEnabled();
    //         await locator.click();
    //     } catch (error) {
    //         throw new UIError(
    //             errorMessage ?? 'Failed to click on element'
    //         );
    //     }
    // }

    protected async safeClick(
        locator: Locator,
        errorMessage?: string
    ): Promise<void> {
        try {
            await locator.waitFor({ state: 'visible' });
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


    protected async safeFill(
        locator: Locator,
        value: string,
        errorMessage?: string
    ): Promise<void> {
        try {
            await locator.waitFor({ state: 'visible' });
            await expect(locator).toBeEditable();
            await locator.fill(value);
        } catch (error) {
            throw new UIError(
                errorMessage ?? 'Failed to fill value into element'
            );
        }
    }

    protected async safeGetText(locator: Locator): Promise<string> {
        await locator.waitFor({ state: 'visible' });
        return await locator.innerText();
    }

    protected async safeWaitForNavigation(): Promise<void> {
        await this.page.waitForLoadState('networkidle');
    }

    protected async safeWaitForUrlContains(partialUrl: string): Promise<void> {
        await expect(this.page).toHaveURL(new RegExp(partialUrl));
    }

    protected async safeExpectVisible(locator: Locator, errorMessage: string): Promise<void> {
        try {
            await expect(locator).toBeVisible();
        } catch {
            throw new UIError(errorMessage);
        }
    }

}