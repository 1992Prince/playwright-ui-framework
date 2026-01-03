import { Page, Locator, expect } from '@playwright/test';
import { HelperBase } from './helperBase';

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
        await this.safeClick(this.publicArticleBtn,
            'ARTICLE PAGE ERROR: Unable to click on Publish Article button'
        );
    }   

    async deleteArticle() {
        await this.safeClick(this.deleteArticleBtn,
            'ARTICLE PAGE ERROR: Unable to click on Delete Article button'
        );
    }

    async getAllTagsList(){
        return await this.allTagsLocator.allTextContents();
    }

    async getAllTagsListError(){
        await this.safeClick(this.allTagsLocatorErr,
            'ARTICLE PAGE ERROR: Unable to click on GetAllTags Article link'
        );
    }

}