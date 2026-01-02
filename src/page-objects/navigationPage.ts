import { Page, Locator } from '@playwright/test';
import { HelperBase } from './helperBase';

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
        await this.selectGroupMenuItem('Forms');
        await this.waitForNumberOfSeconds(2);
        await this.fromLayoutMenuItem.click();
    }

    async datePickerPage(){
        await this.selectGroupMenuItem('Forms');
        await this.waitForNumberOfSeconds(2);
        await this.datePickerMenuItem.click();
    }

    async smartTablePage(){
        await this.selectGroupMenuItem('Tables & Data');
        await this.waitForNumberOfSeconds(2);
        await this.smartTableMenuItem.click();
    }

    async toasterPage(){
        await this.selectGroupMenuItem('Modal & Overlays');
        await this.waitForNumberOfSeconds(2);
        await this.toasterMenuItem.click();
    }

    async tooltipPage(){
        await this.selectGroupMenuItem('Modal & Overlays');
        await this.waitForNumberOfSeconds(2);
        await this.tooltipMenuItem.click();
    }

    private async selectGroupMenuItem(groupItemTitle: string){
        const groupMenuItem = this.page.getByTitle(groupItemTitle);
        const isExpanded = await groupMenuItem.getAttribute('aria-expanded');
        if(isExpanded === 'false'){
            await groupMenuItem.click();
        }
    }
}