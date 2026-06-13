import { NextRequest, NextResponse } from 'next/server';
import { RSS_FEEDS } from '@/lib/rss-feeds-config';
import { articleStore } from '@/lib/article-store';

// Simple in-memory sync lock to prevent concurrent syncs
let isSyncing = false;
let lastSyncTime = 0;

export async function POST(req: NextRequest) {
  try {
    // Prevent concurrent syncs
    if (isSyncing) {
      return NextResponse.json({ 
        message: 'Sync already in progress',
        status: 'in-progress'
      }, { status: 202 });
    }

    // Check if enough time has passed since last sync (minimum 5 minutes)
    const now = Date.now();
    if (now - lastSyncTime < 5 * 60 * 1000) {
      return NextResponse.json({ 
        message: 'Last sync too recent, skipping',
        status: 'skipped',
        lastSyncAt: lastSyncTime
      }, { status: 200 });
    }

    isSyncing = true;

    const results = [];
    let totalAdded = 0;

    // Sync all feeds in parallel
    const syncPromises = RSS_FEEDS.map(feed =>
      fetch(new URL('/api/rss/parse', new URL(req.url).origin), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedUrl: feed.url,
          sourceName: feed.name,
          topic: feed.topic,
        }),
      })
        .then(res => res.json())
        .then(data => {
          totalAdded += data.added || 0;
          results.push({
            feed: feed.name,
            added: data.added || 0,
            status: 'success',
          });
          return data;
        })
        .catch(err => {
          results.push({
            feed: feed.name,
            added: 0,
            status: 'failed',
            error: err.message,
          });
        })
    );

    await Promise.all(syncPromises);
    
    lastSyncTime = now;

    return NextResponse.json({
      status: 'completed',
      totalAdded,
      feedsProcessed: results.length,
      results,
      lastSyncAt: lastSyncTime,
      nextSyncIn: '1 hour',
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message,
      status: 'error'
    }, { status: 500 });
  } finally {
    isSyncing = false;
  }
}

export async function GET(req: NextRequest) {
  // Get sync status
  return NextResponse.json({
    status: 'ok',
    isSyncing,
    lastSyncAt: lastSyncTime,
    totalArticles: articleStore.getArticles().length,
    trendingTopics: articleStore.getTrendingTopics(),
  });
}
