import { PageManager } from '../page-objects/pageManager';
import { ConduitLoginPage } from '../page-objects/conduit-login-logout.page';
import { TestExecutionError } from '../errors/testLevelGenericError';
import { consoleLogger } from '../utils/logger'

export class AuthFlow {
    private readonly pm: PageManager;
    private readonly loginPage: ConduitLoginPage;


    constructor(pageManager: PageManager) {
        this.pm = pageManager;
        this.loginPage = this.pm.getConduitLoginPage();
    }

    async loginAsValidUser(email: string, password: string, url: string) {
        consoleLogger.info('AuthFlow.loginAsValidUser: Starting login flow');
        consoleLogger.debug('AuthFlow.loginAsValidUser: url=%s | email=%s', url, email);
        try {
            await this.loginPage.open(url);
            await this.loginPage.goToSignIn();
            await this.loginPage.login(email, password);
            await this.loginPage.verifyLoginSuccess();
            consoleLogger.info('AuthFlow.loginAsValidUser: Login successful. email=%s', email);
        } catch (error: any) {
            consoleLogger.error('AuthFlow.loginAsValidUser: Login failed. email=%s | error=%s', email, error.message);
            throw new TestExecutionError(`Error during login: ${error.message}`);
        }
    }

    async logout() {
        consoleLogger.info('AuthFlow.logout: Starting logout flow');
        await this.loginPage.logout();
        consoleLogger.info('AuthFlow.logout: Logout completed successfully');
    }
}
