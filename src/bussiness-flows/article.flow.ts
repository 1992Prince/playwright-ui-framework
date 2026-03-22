import { ConduitArticlePage } from '../page-objects/conduit-home.page';
import { PageManager } from '../page-objects/pageManager';
import { consoleLogger } from '../utils/logger';

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
        consoleLogger.info('ArticleFlow.publish: Starting article publish flow');
        consoleLogger.debug('ArticleFlow.publish: title=%s | about=%s | tags=%s', this.title, this.about, this.tags);

        await this.articlePage.newArticle();
        await this.articlePage.inputArticleTitle(this.title);
        await this.articlePage.inputArticleAbout(this.about);
        await this.articlePage.inputArticleContent(this.content);
        await this.articlePage.inputArticleTags(this.tags);
        await this.articlePage.publishArticle();

        consoleLogger.info('ArticleFlow.publish: Article published successfully. title=%s', this.title);

        // optional: reset state to avoid leakage
        this.reset();
    }

    async getAllTagsList(){
        consoleLogger.debug('ArticleFlow.getAllTagsList: Fetching all tags');
        const tags = await this.articlePage.getAllTagsList();
        consoleLogger.debug('ArticleFlow.getAllTagsList: Retrieved %s tag(s)', tags.length);
        return tags;
    }

    async getAllTagsListErr(){
        consoleLogger.debug('ArticleFlow.getAllTagsListErr: Fetching all tags (error path)');
        return await this.articlePage.getAllTagsListError();
    }

    async deleteCurrentArticle(): Promise<void> {
        consoleLogger.info('ArticleFlow.deleteCurrentArticle: Deleting current article');
        await this.articlePage.deleteArticle();
        consoleLogger.info('ArticleFlow.deleteCurrentArticle: Article deleted successfully');
    }

    private reset() {
        this.title = '';
        this.about = '';
        this.content = '';
        this.tags = '';
    }
}
