import { Page, Locator } from '@playwright/test';
import { HelperBase } from '../page-objects/helperBase';
import { consoleLogger } from '../utils/logger';

/**
 * EventAppHomePage
 * ─────────────────
 * Page Object for the EventApp authenticated homepage / dashboard.
 *
 * Add locators and methods here as you build out coverage for the homepage.
 * All interactions must use HelperBase safe wrappers (safeClick, safeFill, etc.)
 * Never add expect() assertions inside this class — keep assertions in spec files.
 */
export class EventAppDetailsPage extends HelperBase {

    // ── Locators ──────────────────────────────────────────────────────────────
    // TODO: Replace placeholder selectors with real EventApp selectors

    private readonly eventTitle: Locator;
    private readonly dateTxt: Locator;
    private readonly timeTxt: Locator;
    private readonly venueTxt: Locator;
    private readonly cityTxt: Locator;
    private readonly availableTxt: Locator;
    private readonly pricePerTicketTxt: Locator;
    private readonly dilliWalaMelaEvent: Locator;

    private readonly nameTxt: Locator;
    private readonly emailTxt: Locator;
    private readonly mobileNumTxt: Locator;
    private readonly bookingBtn: Locator;

    private readonly successBookingTxt: Locator;

    constructor(page: Page) {
        super(page);

        this.eventTitle     = page.getByText('About this event');
        this.dateTxt        = page.getByText('Date').first();
        this.timeTxt        = page.getByText('Time');
        this.venueTxt       = page.getByText('Venue');
        this.cityTxt        = page.getByText('City');
        this.availableTxt   = page.getByText('Available').last();
        this.pricePerTicketTxt = page.getByText('Price per Ticket');
        this.dilliWalaMelaEvent = page.getByText('Dilli Diwali Mela');
        this.nameTxt = page.locator('//input[@id="customerName"]');
        this.emailTxt = page.locator("//input[@id='customer-email']")
        this.mobileNumTxt = page.locator("//input[@id='phone']")
        this.bookingBtn = page.locator("//button[@type='submit']");
        this.successBookingTxt = page.getByText('Your tickets are reserved.');

    }

    /**
     * Verifies the event details page is loaded.
     * TODO: update URL pattern to match EventApp's actual event details page URL.
     */
    async isAt(): Promise<void> {
        await this.page.waitForURL('**/events**');
    }

    /**
     * Verifies the event details page is displayed correctly.
     * Called by EventAppLoginPage (MODE 1, 2, 3) to confirm auth state.
     */
    async verifyEventDetailsPage(): Promise<void> {
        consoleLogger.info('EventAppDetailsPage.verifyEventDetailsPage: Verifying event details page is displayed');
        await this.safeExpectVisible(
            this.dateTxt,
            'EVENTAPP DETAILS ERROR: Event details date not visible — event details page did not load correctly'
        );
        await this.safeExpectVisible(
            this.timeTxt,
            'EVENTAPP DETAILS ERROR: Event details time not visible — event details page did not load correctly'
        );
        await this.safeExpectVisible(
            this.venueTxt,
            'EVENTAPP DETAILS ERROR: Event details venue not visible — event details page did not load correctly'
        );
        await this.safeExpectVisible(
            this.cityTxt,
            'EVENTAPP DETAILS ERROR: Event details city not visible — event details page did not load correctly'
        );
        await this.safeExpectVisible(
            this.availableTxt,
            'EVENTAPP DETAILS ERROR: Event details available not visible — event details page did not load correctly'
        );
        await this.safeExpectVisible(
            this.pricePerTicketTxt,
            'EVENTAPP DETAILS ERROR: Event details price per ticket not visible — event details page did not load correctly'
        );

        consoleLogger.info('EventAppDetailsPage.verifyEventDetailsPage: Event details page loaded and verified');
    }

    // TODO: Add more page-specific methods below as needed
    // Example:
    // async clickCreateEvent(): Promise<void> { ... }
    // async getWelcomeMessage(): Promise<string> { ... }

    // click on dilli wala mela event on homepage
    async clickDilliWalaMelaEvent(): Promise<void> {
        consoleLogger.info('EventAppHomePage.clickDilliWalaMelaEvent: Clicking on Dilli Wala Mela event');
        await this.safeClick(
            this.dilliWalaMelaEvent,
            'EVENTAPP HOME ERROR: Dilli Wala Mela event not found on homepage'
        );
        consoleLogger.info('EventAppHomePage.clickDilliWalaMelaEvent: Clicked on Dilli Wala Mela event');
    }


    // enter customer details and click on book now button
    // here we don't need to keep them in try catch block as safe wrappers will throw error with proper message if any step fails, 
    // so we can directly let the error propagate to the test which will result in clean failure messages without stack traces
    async bookEvent(fullName: string, email: string, mobile: number): Promise<void> {
        consoleLogger.info('EventAppDetailsPage.bookEvent: Booking event with details fullName=%s, email=%s, mobile=%d', fullName, email, mobile);
        await this.safeFill(this.nameTxt, fullName, 'EVENTAPP BOOKING ERROR: Unable to fill customer name');
        await this.safeFill(this.emailTxt, email, 'EVENTAPP BOOKING ERROR: Unable to fill customer email');
        await this.safeFill(this.mobileNumTxt, mobile.toString(), 'EVENTAPP BOOKING ERROR: Unable to fill customer mobile number');
        await this.safeClick(this.bookingBtn, 'EVENTAPP BOOKING ERROR: Unable to click Book Now button');
        await this.safeExpectVisible(this.successBookingTxt, 'EVENTAPP BOOKING ERROR: Booking success message not visible — booking may have failed');
        consoleLogger.info('EventAppDetailsPage.bookEvent: Clicked Book Now button with provided customer details');
    }
}
