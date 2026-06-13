import { NextResponse } from 'next/server';
import { RSS_FEEDS } from '@/lib/rss-feeds-config';

export async function GET() {
  try {
    // Trigger a sync when the app initializes
    const syncResponse = await fetch(new URL('/api/sync', new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000')), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => ({ status: 503 }));

    if (syncResponse.status === 200 || syncResponse.status === 202) {
      const data = await syncResponse.json();
      return NextResponse.json({
        status: 'initialized',
        syncStatus: data.status,
        totalAdded: data.totalAdded,
        feedsProcessed: data.feedsProcessed,
        message: 'Application initialized and RSS feeds synced',
      });
    }

    return NextResponse.json({
      status: 'initializing',
      message: 'Application ready, RSS sync will run in background',
      feedsConfigured: RSS_FEEDS.length,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'ready',
      message: 'Application ready',
      feedsConfigured: RSS_FEEDS.length,
      note: 'RSS feeds will be synced automatically',
    });
  }
}
