import { ConduitArticlePage } from '../page-objects/conduit-home.page';
import { PageManager } from '../page-objects/pageManager';

export class ArticleFlow {

    private readonly pm: PageManager;
    private readonly articlePage: ConduitArticlePage;


    constructor(pageManager: PageManager) {
        this.pm = pageManager;
        this.articlePage = this.pm.getConduitArticlePage();
    }
    

    async createArticle(title: string, about: string, content: string, tags: string) {
        await this.articlePage.newArticle()
        await this.articlePage.inputArticleTitle(title);
        await this.articlePage.inputArticleAbout(about);
        await this.articlePage.inputArticleContent(content);
        await this.articlePage.inputArticleTags(tags);
        await this.articlePage.publishArticle();
    }

    async deleteCurrentArticle() {
        await this.articlePage.deleteArticle();
    }

    async getAllTagsList(){
        return await this.articlePage.getAllTagsList();
    }
}
