import { NextResponse } from 'next/server';
import { articleStore } from '@/lib/article-store';

export async function GET() {
  try {
    const articles = articleStore.getLatestArticles(50);
    const trendingTopics = articleStore.getTrendingTopics();

    return NextResponse.json({
      articles,
      trendingTopics,
      totalArticles: articles.length,
      lastSync: articleStore.getLastSyncAt(),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      articles: [],
      trendingTopics: [],
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      url,
      summary,
      topics,
      sourceName,
      publishedAt,
      imageUrl,
      content,
    } = body;

    if (!title || !url || !summary) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const topicsArr = Array.isArray(topics)
      ? topics
      : typeof topics === 'string' && topics.length > 0
      ? topics.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];

    const now = Date.now();
    const article = {
      id: `${now}-${Math.random().toString(36).slice(2, 9)}`,
      title,
      url,
      summary,
      content: content || summary,
      topics: topicsArr,
      sourceName: sourceName || 'Manual',
      imageUrl: imageUrl || undefined,
      publishedAt: publishedAt ? Number(publishedAt) : now,
      createdAt: now,
    } as any;

    articleStore.addArticle(article);

    return NextResponse.json({ ok: true, article });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
