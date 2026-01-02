import { Page, Locator } from '@playwright/test';
import { NavigationPage } from '../page-objects/navigationPage';
import { FormLayoutPage } from '../page-objects/formLayoutPage';
import { ToasterPage } from '../page-objects/toasterPage';
import { TooltipPage } from '../page-objects/tooltipPage';
import { ConduitArticlePage } from './conduit-home.page';
import { ConduitLoginPage } from './conduit-login-logout.page';
import { ArticleFlow } from '../bussiness-flows/article.flow';
import { CommonLocators } from './commonLocators';

export class PageManager {

    private readonly page: Page;
    private commonLocators?: CommonLocators;
    private navigationPage?: NavigationPage;
    private formLayoutPage?: FormLayoutPage;
    private toasterPage?: ToasterPage;
    private tooltipPage?: TooltipPage;
    private conduitLoginPage?: ConduitLoginPage;
    private conduitArticlePage?: ConduitArticlePage;
    private articleFlow?: ArticleFlow;


    constructor(page: Page) {
        this.page = page;
    }

    getNavigationPage(): NavigationPage {
        return this.navigationPage ??= new NavigationPage(this.page);
    }


    getFormLayoutPage(): FormLayoutPage {
        return this.formLayoutPage ??= new FormLayoutPage(this.page);
    }

    getToasterPage(): ToasterPage {
        return this.toasterPage ??= new ToasterPage(this.page);
    }

    getTooltipPage(): TooltipPage {
        return this.tooltipPage ??= new TooltipPage(this.page);
    }

    getConduitLoginPage(): ConduitLoginPage {
        return this.conduitLoginPage ??= new ConduitLoginPage(this.page, this);
    }

    getConduitArticlePage(): ConduitArticlePage {
        return this.conduitArticlePage ??= new ConduitArticlePage(this.page);
    }

    getArticleFlow(): ArticleFlow {
        return this.articleFlow ??= new ArticleFlow(this);
    }

    getCommonLocators(): CommonLocators {
        return this.commonLocators ??= new CommonLocators(this.page);
    }

}