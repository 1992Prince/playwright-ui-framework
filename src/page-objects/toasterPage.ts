import { Page, Locator, expect } from '@playwright/test';
import { HelperBase } from './helperBase';
import { consoleLogger } from '../utils/logger';

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
        consoleLogger.info('ToasterPage.getRandomToasterMsz: Clicking Random Toast button');
        this.randomToastGeneratorBtn.click();
        await expect(this.randomToastMsz).toBeVisible();
        const randomToastMsz = await this.randomToastMsz.textContent();
        consoleLogger.info('ToasterPage.getRandomToasterMsz: Toast appeared. message=%s', randomToastMsz);
    }

    async selectToastTypeAndGenerateToast(toastType: string){
        consoleLogger.info('ToasterPage.selectToastTypeAndGenerateToast: Selecting toast type=%s', toastType);
        await this.toastTypeSelectBtn.click();
        const toastTypeOption = this.page.getByText(toastType);
        await toastTypeOption.click();
        await this.showToastBtn.click();
        await expect(this.randomToastMsz).toBeVisible();
        const randomToastMsz = await this.randomToastMsz.textContent();
        consoleLogger.info('ToasterPage.selectToastTypeAndGenerateToast: Toast appeared. type=%s | message=%s', toastType, randomToastMsz);
    }

}