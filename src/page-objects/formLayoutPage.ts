import { Page, Locator } from '@playwright/test';

export class FormLayoutPage {

    private readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * This method fills and submits the "Using the Grid" form with given credentials and selected option.
     * @param email 
     * @param password 
     * @param optionTxt 
     */
    async submitUsingGridFormWithCredAndSelectOption(email: string, password: string, optionTxt: string) {
        const usingTheGridForm = this.page.locator('nb-card', { hasText: "Using the Grid" });
        await usingTheGridForm.getByRole('textbox', { name: 'Email' }).fill(email);
        await usingTheGridForm.getByRole('textbox', { name: 'Password' }).fill(password);
        await usingTheGridForm.getByRole('radio', { name: optionTxt }).check({ force: true });
        await usingTheGridForm.getByRole('button').click();
    }

    /**
     * This method fills and submits the inline form with given credentials and checkbox option.
     * @param name - should be filled in the 'Jane Doe' field
     * @param email - should be filled in the 'Email' field
     * @param rememberMe  - if true, the 'Remember me' checkbox will be checked
     */
    async submitInlineFormWithCredAndCheckbox(name: string, email: string, rememberMe: boolean) {
        const usingInlineForm = this.page.locator('nb-card', { hasText: "Inline form" });
        await usingInlineForm.getByRole('textbox', { name: 'Jane Doe' }).fill(name);
        await usingInlineForm.getByRole('textbox', { name: 'Email' }).fill(email);
        if (rememberMe) {
            await usingInlineForm.getByRole('checkbox').check({ force: true });
        }
        await usingInlineForm.getByRole('button').click();
    }
}