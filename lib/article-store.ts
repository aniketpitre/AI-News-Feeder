// In-memory article store with persistence
interface Article {
  id: string;
  title: string;
  url: string;
  summary: string;
  content: string;
  topics: string[];
  sourceName: string;
  imageUrl?: string;
  publishedAt: number;
  createdAt: number;
}

interface NewsStore {
  articles: Article[];
  lastSyncAt: number;
}

// Initialize store
let store: NewsStore = {
  articles: [],
  lastSyncAt: 0,
};

export const articleStore = {
  getArticles: () => [...store.articles].sort((a, b) => b.publishedAt - a.publishedAt),
  
  addArticle: (article: Article) => {
    // Check if article already exists
    if (!store.articles.find(a => a.url === article.url)) {
      store.articles.push(article);
      // Keep only last 100 articles
      if (store.articles.length > 100) {
        store.articles = store.articles.slice(-100);
      }
    }
  },

  addArticles: (articles: Article[]) => {
    articles.forEach(article => articleStore.addArticle(article));
  },

  setLastSyncAt: (timestamp: number) => {
    store.lastSyncAt = timestamp;
  },

  getLastSyncAt: () => store.lastSyncAt,

  getArticlesByTopic: (topic: string) => {
    return store.articles.filter(a => a.topics.includes(topic));
  },

  getLatestArticles: (limit: number = 10) => {
    return articleStore.getArticles().slice(0, limit);
  },

  getFeaturedArticle: () => {
    const articles = articleStore.getArticles();
    return articles.length > 0 ? articles[0] : null;
  },

  getTrendingTopics: () => {
    const topicCount: Record<string, number> = {};
    store.articles.forEach(article => {
      article.topics.forEach(topic => {
        topicCount[topic] = (topicCount[topic] || 0) + 1;
      });
    });
    return Object.entries(topicCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);
  },
};
