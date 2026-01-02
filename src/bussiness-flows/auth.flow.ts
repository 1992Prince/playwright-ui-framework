import { PageManager } from '../page-objects/pageManager';
import { ConduitLoginPage } from '../page-objects/conduit-login-logout.page';
import { TestExecutionError } from '../errors/testLevelGenericError';
import { consoleLogger } from '../utils/consoleLoggerSingletonInstance'

export class AuthFlow {
    private readonly pm: PageManager;
    private readonly loginPage: ConduitLoginPage;


    constructor(pageManager: PageManager) {
        this.pm = pageManager;
        this.loginPage = this.pm.getConduitLoginPage();
    }

    async loginAsValidUser(email: string, password: string, url: string) {
        try {
            await this.loginPage.open(url);
            await this.loginPage.goToSignIn();
            await this.loginPage.login(email, password);
            await this.loginPage.verifyLoginSuccess();
        } catch (error: any) {
            consoleLogger.error(`Login failed: ${error.message}`);
            throw new TestExecutionError(`Error during login: ${error.message}`);
        }
    }

    async logout() {
        await this.loginPage.logout();
    }
}
