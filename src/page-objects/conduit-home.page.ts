import { Page, Locator, expect } from '@playwright/test';
import { HelperBase } from './helperBase';
import { consoleLogger } from '../utils/logger';

export class ConduitArticlePage extends HelperBase {

    private readonly newArticleLink: Locator;
    private readonly articleTitleInput: Locator;
    private readonly articleAboutInput: Locator;
    private readonly articleInput: Locator;
    private readonly tagsInput: Locator;
    private readonly publicArticleBtn: Locator;
    private readonly deleteArticleBtn: Locator;
    private readonly allTagsLocator: Locator;
    private readonly allTagsLocatorErr: Locator;

    constructor(page: Page) {
        super(page);
        this.newArticleLink = page.locator("//*[@routerLink='/editor']");
        this.articleTitleInput = page.getByPlaceholder('Article Title');
        this.articleAboutInput = page.getByPlaceholder("What's this article about?");
        this.articleInput = page.getByPlaceholder("Write your article (in markdown)");
        this.tagsInput = page.getByPlaceholder('Enter tags');
        this.publicArticleBtn = page.getByText("Publish Article");
        this.deleteArticleBtn = page.getByText("Delete Article").last();
        this.allTagsLocator = page.locator('.tag-list');
        this.allTagsLocatorErr = page.locator('.tag-list2');
    }

    isAt(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async newArticle() {
        consoleLogger.info('ConduitArticlePage.newArticle: Navigating to new article editor');
        await this.safeClick(
            this.newArticleLink,
            'ARTICLE PAGE ERROR: Unable to click on New Article link');
    }

    async inputArticleTitle(title: string) {
        await this.safeFill(
            this.articleTitleInput, title,
            'ARTICLE PAGE ERROR: Unable to enter article title');
    }

    async inputArticleAbout(about: string) {
        await this.safeFill(this.articleAboutInput, about,
            'ARTICLE PAGE ERROR: Unable to enter article about'
        );
    }

    async inputArticleContent(content: string) {
        await this.safeFill(this.articleInput, content,
            'ARTICLE PAGE ERROR: Unable to enter article content'
        );
    }   

    async inputArticleTags(tags: string) {
        await this.safeFill(this.tagsInput, tags,
            'ARTICLE PAGE ERROR: Unable to enter article tags'
        );
    }

    async publishArticle() {
        consoleLogger.info('ConduitArticlePage.publishArticle: Clicking Publish Article button');
        await this.safeClick(this.publicArticleBtn,
            'ARTICLE PAGE ERROR: Unable to click on Publish Article button'
        );
        consoleLogger.info('ConduitArticlePage.publishArticle: Article published successfully');
    }   

    async deleteArticle() {
        consoleLogger.info('ConduitArticlePage.deleteArticle: Clicking Delete Article button');
        await this.safeClick(this.deleteArticleBtn,
            'ARTICLE PAGE ERROR: Unable to click on Delete Article button'
        );
        consoleLogger.info('ConduitArticlePage.deleteArticle: Article deleted successfully');
    }

    async getAllTagsList(){
        consoleLogger.debug('ConduitArticlePage.getAllTagsList: Fetching all tag text contents');
        const tags = await this.allTagsLocator.allTextContents();
        consoleLogger.debug('ConduitArticlePage.getAllTagsList: Retrieved %s tag(s)', tags.length);
        return tags;
    }

    async getAllTagsListError(){
        // Intentional error path — uses a non-existent locator to simulate a UI failure
        consoleLogger.debug('ConduitArticlePage.getAllTagsListError: Triggering intentional error path for testing');
        await this.safeClick(this.allTagsLocatorErr,
            'ARTICLE PAGE ERROR: Unable to click on GetAllTags Article link'
        );
    }

}