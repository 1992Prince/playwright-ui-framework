import { ConduitArticlePage } from '../page-objects/conduit-home.page';
import { PageManager } from '../page-objects/pageManager';

export class ArticleFlow {

    private readonly articlePage: ConduitArticlePage;

    // fluent state (temporary data holder)
    private title!: string;
    private about!: string;
    private content!: string;
    private tags!: string;

    constructor(pageManager: PageManager) {
        this.articlePage = pageManager.getConduitArticlePage();
    }

    withTitle(title: string): this {
        this.title = title;
        return this;
    }

    withAbout(about: string): this {
        this.about = about;
        return this;
    }

    withContent(content: string): this {
        this.content = content;
        return this;
    }

    withTags(tags: string): this {
        this.tags = tags;
        return this;
    }

    async publish(): Promise<void> {
        await this.articlePage.newArticle();
        await this.articlePage.inputArticleTitle(this.title);
        await this.articlePage.inputArticleAbout(this.about);
        await this.articlePage.inputArticleContent(this.content);
        await this.articlePage.inputArticleTags(this.tags);
        await this.articlePage.publishArticle();

        // optional: reset state to avoid leakage
        this.reset();
    }

    async getAllTagsList(){
        return await this.articlePage.getAllTagsList();
    }

    async getAllTagsListErr(){
        return await this.articlePage.getAllTagsListError();
    }

    async deleteCurrentArticle(): Promise<void> {
        await this.articlePage.deleteArticle();
    }

    private reset() {
        this.title = '';
        this.about = '';
        this.content = '';
        this.tags = '';
    }
}
