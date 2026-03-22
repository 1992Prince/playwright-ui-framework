import { Page, Locator } from '@playwright/test';
import { HelperBase } from './helperBase';
import { consoleLogger } from '../utils/logger';

export class NavigationPage extends HelperBase{

    readonly fromLayoutMenuItem: Locator;
    readonly datePickerMenuItem: Locator;
    readonly smartTableMenuItem: Locator;
    readonly toasterMenuItem: Locator;
    readonly tooltipMenuItem: Locator;



    constructor(page: Page) {
        super(page);
        this.fromLayoutMenuItem = page.getByText('Form Layouts');
        this.datePickerMenuItem = page.getByText('Datepicker');
        this.smartTableMenuItem = page.getByText('Smart Table');
        this.toasterMenuItem = page.getByText('Toastr');
        this.tooltipMenuItem = page.getByText('Tooltip');
    }

    isAt(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async formLayoutsPage(){
        consoleLogger.info('NavigationPage.formLayoutsPage: Navigating to Form Layouts page');
        await this.selectGroupMenuItem('Forms');
        await this.waitForNumberOfSeconds(2);
        await this.fromLayoutMenuItem.click();
    }

    async datePickerPage(){
        consoleLogger.info('NavigationPage.datePickerPage: Navigating to Date Picker page');
        await this.selectGroupMenuItem('Forms');
        await this.waitForNumberOfSeconds(2);
        await this.datePickerMenuItem.click();
    }

    async smartTablePage(){
        consoleLogger.info('NavigationPage.smartTablePage: Navigating to Smart Table page');
        await this.selectGroupMenuItem('Tables & Data');
        await this.waitForNumberOfSeconds(2);
        await this.smartTableMenuItem.click();
    }

    async toasterPage(){
        consoleLogger.info('NavigationPage.toasterPage: Navigating to Toaster page');
        await this.selectGroupMenuItem('Modal & Overlays');
        await this.waitForNumberOfSeconds(2);
        await this.toasterMenuItem.click();
    }

    async tooltipPage(){
        consoleLogger.info('NavigationPage.tooltipPage: Navigating to Tooltip page');
        await this.selectGroupMenuItem('Modal & Overlays');
        await this.waitForNumberOfSeconds(2);
        await this.tooltipMenuItem.click();
    }

    private async selectGroupMenuItem(groupItemTitle: string){
        const groupMenuItem = this.page.getByTitle(groupItemTitle);
        const isExpanded = await groupMenuItem.getAttribute('aria-expanded');
        // Only expand the menu group if it is currently collapsed
        if(isExpanded === 'false'){
            consoleLogger.debug('NavigationPage.selectGroupMenuItem: Expanding collapsed group=%s', groupItemTitle);
            await groupMenuItem.click();
        } else {
            consoleLogger.debug('NavigationPage.selectGroupMenuItem: Group already expanded=%s', groupItemTitle);
        }
    }
}