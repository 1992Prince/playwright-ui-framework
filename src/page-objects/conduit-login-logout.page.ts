import { Page, expect, Locator } from '@playwright/test';
import { HelperBase } from './helperBase';
import { CommonLocators } from './commonLocators';
import { PageManager } from './pageManager';

export class ConduitLoginPage extends HelperBase {

    private readonly signInLink: Locator;
    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;
    private readonly submitButton: Locator;
    private readonly allTags: Locator;
    private readonly settingsLink: Locator;
    private readonly signOutButton: Locator;
    private readonly common: CommonLocators;

    //

    constructor(page: Page, pm: PageManager) {
        super(page);
        this.signInLink = page.locator("//a[text()=' Sign in ']");
        this.emailInput = page.getByPlaceholder('Email');
        this.passwordInput = page.getByPlaceholder('Password');
        this.submitButton = page.locator("button[type='submit']");
        this.allTags = page.getByText('Popular Tags');
        this.settingsLink = page.locator("//*[@routerLink='/settings']");
        this.signOutButton = page.getByText("Or click here to logout.");
        this.common = pm.getCommonLocators();
    }

    isAt(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async open(url: string) {
        await this.page.goto(url);
    }

    async goToSignIn() {
        await this.safeClick(
            //this.signInLink,
            this.common.signInLink,
            'LOGIN PAGE ERROR: Unable to click on Sign In link'
        );
    }

    async login(email: string, password: string) {
        await this.safeFill(
            this.emailInput,
            email,
            'LOGIN PAGE ERROR: Unable to enter email'
        );
        await this.safeFill(
            this.passwordInput,
            password,
            'LOGIN PAGE ERROR: Unable to enter password'
        );
        await this.safeClick(
            this.submitButton,
            'LOGIN PAGE ERROR: Unable to submit login form'
        );
    }

    async verifyLoginSuccess() {
        await this.safeExpectVisible(
            this.allTags,
            'LOGIN FAILED: Popular Tags not visible after login'
        );
    }

    async logout() {
        await this.safeClick(
            this.settingsLink,
            'LOGOUT ERROR: Unable to click on Settings link'
        );
        await this.safeClick(
            this.signOutButton,
            'LOGOUT ERROR: Unable to click on Sign Out button');
    }
}
