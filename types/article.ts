export interface Article {
  id: string;
  title: string;
  url: string;
  summary: string;
  content?: string;
  topics?: string[];
  sourceName?: string;
  imageUrl?: string;
  publishedAt: number;
  createdAt: number;
}

export type MaybeArticle = Article | null;
