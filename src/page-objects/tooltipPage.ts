import { Page, Locator, expect } from '@playwright/test';
import { HelperBase } from './helperBase';

export class TooltipPage extends HelperBase {

    constructor(page: Page) {
        super(page);
    }

    isAt(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async hoverOnToolTip(toolTipType: string){
        this.page.getByText(toolTipType).hover();
    }

}