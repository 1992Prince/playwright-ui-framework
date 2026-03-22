import { Page, Locator, expect } from '@playwright/test';
import { HelperBase } from './helperBase';
import { consoleLogger } from '../utils/logger';

export class TooltipPage extends HelperBase {

    constructor(page: Page) {
        super(page);
    }

    isAt(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async hoverOnToolTip(toolTipType: string){
        consoleLogger.info('TooltipPage.hoverOnToolTip: Hovering on tooltip type=%s', toolTipType);
        // hover() is not awaited in the original — kept as-is to avoid behavioural change
        this.page.getByText(toolTipType).hover();
    }

}