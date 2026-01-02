import { Page, Locator, expect } from '@playwright/test';
import { HelperBase } from './helperBase';

export class ToasterPage extends HelperBase {

    readonly randomToastGeneratorBtn: Locator;
    readonly randomToastMsz: Locator;
    readonly toastTypeSelectBtn: Locator;
    readonly showToastBtn: Locator;

    constructor(page: Page) {
        super(page);
        this.randomToastGeneratorBtn = page.getByText('Random toast');
        this.randomToastMsz = page.locator('nb-toast');
        this.toastTypeSelectBtn = page.locator("(//button[@class='select-button'])[3]");
        this.showToastBtn = page.getByText('Show toast').last();
    }

    isAt(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async getRandomToasterMsz(){
        this.randomToastGeneratorBtn.click();
        await expect(this.randomToastMsz).toBeVisible();
        let randomToastMsz = await this.randomToastMsz.textContent();
        console.log("Random Toast Message: " + randomToastMsz);
    }

    async selectToastTypeAndGenerateToast(toastType: string){
        await this.toastTypeSelectBtn.click();
        const toastTypeOption = this.page.getByText(toastType);
        await toastTypeOption.click();
        await this.showToastBtn.click();
        await expect(this.randomToastMsz).toBeVisible();
        let randomToastMsz = await this.randomToastMsz.textContent();
        console.log("Random Toast Message: " + randomToastMsz);
    }

}