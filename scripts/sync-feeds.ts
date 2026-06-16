import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { XMLParser } from 'fast-xml-parser';

// Initialize Firebase Admin SDK
const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
if (getApps().length === 0) {
  if (serviceAccountEnv) {
    try {
      const serviceAccount = JSON.parse(serviceAccountEnv);
      initializeApp({ credential: cert(serviceAccount) });
      console.log("Firebase Admin initialized via service account credentials.");
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT.", e);
      process.exit(1);
    }
  } else {
    initializeApp({ projectId: "gen-lang-client-0073420653" });
    console.log("Firebase Admin initialized via projectId.");
  }
}

const db = getFirestore();

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Safely extract string from RSS field (may be object with #text)
function extractString(raw: any): string {
  if (!raw) return '';
  if (typeof raw === 'object') {
    return raw['#text'] || raw._ || raw.__cdata || JSON.stringify(raw);
  }
  return String(raw);
}

// Strip HTML tags and decode entities
function stripHtml(raw: any): string {
  const str = extractString(raw);
  return str
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean title — remove URLs and trailing metadata (e.g. SANS stormcast)
function cleanTitle(raw: any): string {
  let title = stripHtml(raw);
  // Remove URLs embedded in title
  title = title.replace(/https?:\/\/\S+/g, '').trim();
  // Remove trailing date patterns like ", (Tue, Jun 16th)"
  title = title.replace(/,\s*\(.*?\)\s*$/, '').trim();
  // Remove trailing comma
  title = title.replace(/,\s*$/, '').trim();
  return title;
}

async function callGroq(title: string, description: string, feedTopic: string): Promise<{ summary: string; topics: string[] }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const prompt = `You are a tech news curator. Analyze this article and respond ONLY with valid JSON, no markdown, no explanation.

Title: ${title}
Content: ${description.substring(0, 600)}

Respond with exactly this JSON structure:
{"summary": "2-3 sentence professional summary for tech audience", "topics": ["topic1", "topic2"]}

Topics must be from: Kubernetes, DevOps, AI, Machine Learning, LLM, Cybersecurity, Docker, CI/CD, Cloud, Security, MLOps, Infrastructure`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  try {
    const clean = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      summary: parsed.summary || '',
      topics: Array.isArray(parsed.topics) ? parsed.topics : [feedTopic],
    };
  } catch {
    return { summary: '', topics: [feedTopic] };
  }
}

async function syncFeeds() {
  console.log("Starting hourly RSS feed sync...");

  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY not set — will use fallback summaries.");
  }

  try {
    const feedsRef = db.collection('feeds');
    const activeFeedsSnapshot = await feedsRef.where('isActive', '==', true).get();

    if (activeFeedsSnapshot.empty) {
      console.log("No active RSS feeds found. Exiting.");
      return;
    }

    console.log(`Found ${activeFeedsSnapshot.size} active feeds to sync.`);

    for (const doc of activeFeedsSnapshot.docs) {
      const feed = doc.data();
      const feedId = doc.id;
      const feedUrl = feed.url;
      const feedName = feed.name || "Unknown Source";
      const feedTopic = feed.topic || "General";

      console.log(`Processing feed: "${feedName}"...`);

      try {
        const response = await fetch(feedUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 TechSync RSS Cron-Sync' },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          console.error(`Failed to fetch "${feedName}": ${response.statusText}`);
          continue;
        }

        const xmlText = await response.text();
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
        const parsed = parser.parse(xmlText);

        const rawItems = parsed.rss?.channel?.item || parsed.feed?.entry || [];
        const items = Array.isArray(rawItems) ? rawItems : [rawItems];

        const recentItems = items.slice(0, 5).map((item: any) => {
          const rawLink = item.link;
          let link = '';
          if (typeof rawLink === 'string') link = rawLink;
          else if (typeof rawLink === 'object') link = rawLink?.['@_href'] || rawLink?.href || '';

          return {
            title: cleanTitle(item.title),
            link,
            description: stripHtml(item.description || item.content || item['content:encoded'] || item.summary || ''),
            pubDate: item.pubDate || item.published || item.updated || '',
          };
        });

        let newArticlesCount = 0;

        for (const item of recentItems) {
          if (!item.title || !item.link) continue;

          // Skip podcast/audio entries from SANS
          if (item.title.toLowerCase().includes('stormcast') || item.title.toLowerCase().includes('podcastdetail')) continue;

          // Dedup check
          const existing = await db.collection('articles')
            .where('url', '==', item.link)
            .limit(1)
            .get();

          if (!existing.empty) continue;

          console.log(`New article: "${item.title}"`);
          newArticlesCount++;

          // Rate limit: 2.1s between Groq calls = ~28 req/min (under 30 RPM limit)
          await sleep(2100);

          let summaryText = '';
          let extractedTopics: string[] = [feedTopic];

          try {
            const result = await callGroq(item.title, item.description, feedTopic);
            summaryText = result.summary;
            extractedTopics = result.topics;
            console.log(`  Groq OK. Topics: ${extractedTopics.join(', ')}`);
          } catch (err) {
            console.warn(`  Groq failed, using fallback. ${err}`);
            summaryText = item.description.substring(0, 200) + '...';
            extractedTopics = [feedTopic];
          }

          if (!summaryText) {
            summaryText = item.description.substring(0, 200) + '...';
          }

          const now = Date.now();
          const cleanId = Buffer.from(item.link).toString('base64').substring(0, 24).replace(/[^a-zA-Z0-9]/g, '_');

          await db.collection('articles').doc(cleanId).set({
            title: item.title,
            url: item.link,
            summary: summaryText,
            content: item.description,
            topics: extractedTopics,
            sourceId: feedId,
            sourceName: feedName,
            status: 'published',
            publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : now,
            createdAt: now,
            updatedAt: now,
          });

          console.log(`  Stored: "${item.title}"`);
        }

        console.log(`Finished "${feedName}". Stored ${newArticlesCount} new articles.`);

      } catch (feedError) {
        console.error(`Error processing feed "${feedName}":`, feedError);
      }
    }

    console.log("Cron synchronization completed successfully.");

  } catch (error) {
    console.error("General cron-sync error:", error);
    process.exit(1);
  }
}

syncFeeds().then(() => process.exit(0)).catch((err) => {
  console.error("Unhandled cron promise rejection:", err);
  process.exit(1);
});
