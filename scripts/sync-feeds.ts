import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { XMLParser } from 'fast-xml-parser';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize Firebase Admin SDK
const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
if (getApps().length === 0) {
  if (serviceAccountEnv) {
    try {
      const serviceAccount = JSON.parse(serviceAccountEnv);
      initializeApp({
        credential: cert(serviceAccount)
      });
      console.log("Firebase Admin initialized via service account credentials.");
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable.", e);
      process.exit(1);
    }
  } else {
    // Fallback to default credentials or project ID configuration
    initializeApp({
      projectId: "gen-lang-client-0073420653"
    });
    console.log("Firebase Admin initialized via projectId configuration.");
  }
}

const db = getFirestore();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function syncFeeds() {
  console.log("Starting hourly RSS feed sync...");
  
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY environment variable is not defined!");
    process.exit(1);
  }

  try {
    // 1. Fetch active feeds from Firestore
    const feedsRef = db.collection('feeds');
    const activeFeedsSnapshot = await feedsRef.where('isActive', '==', true).get();

    if (activeFeedsSnapshot.empty) {
      console.log("No active RSS feeds found in the database. Exiting.");
      return;
    }

    console.log(`Found ${activeFeedsSnapshot.size} active feeds to sync.`);

    // 2. Loop through each active feed
    for (const doc of activeFeedsSnapshot.docs) {
      const feed = doc.data();
      const feedId = doc.id;
      const feedUrl = feed.url;
      const feedName = feed.name || "Unknown Source";
      const feedTopic = feed.topic || "General";

      console.log(`Processing feed: "${feedName}" (${feedUrl})...`);

      try {
        const response = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TechSync RSS Cron-Sync',
          },
        });

        if (!response.ok) {
          console.error(`Failed to fetch RSS feed from ${feedUrl}: ${response.statusText}`);
          continue;
        }

        const xmlText = await response.text();
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "@_"
        });
        const parsed = parser.parse(xmlText);
        
        const rawItems = parsed.rss?.channel?.item || parsed.feed?.entry || [];
        const items = Array.isArray(rawItems) ? rawItems : [rawItems];
        
        // Take top 5 recent items to parse
        const recentItems = items.slice(0, 5).map((item: any) => ({
          title: item.title,
          link: item.link?.href || item.link || '',
          description: item.description || item.content || item['content:encoded'] || '',
          pubDate: item.pubDate || item.published || item.updated || '',
        }));

        if (recentItems.length === 0) {
          console.log(`No items found in feed: "${feedName}".`);
          continue;
        }

        let newArticlesCount = 0;

        for (const item of recentItems) {
          if (!item.title || !item.link) continue;

          // 3. Deduplication check: Query articles collection by url
          const articleUrl = item.link;
          const articleExistsQuery = await db.collection('articles')
            .where('url', '==', articleUrl)
            .limit(1)
            .get();

          if (!articleExistsQuery.empty) {
            // Article already exists, skip
            continue;
          }

          console.log(`New article found: "${item.title}". Fetching Gemini analysis...`);
          newArticlesCount++;

          const prompt = `
            Analyze the following tech news article snippet/description:
            Title: ${item.title}
            Content Snippet: ${item.description.substring(0, 800)}...
            
            Provide a concise, professional summary for a tech-savvy audience (like XDA or advanced IT news).
            Also provide up to 3 relevant tech topics (e.g., AI, DevOps, Cybersecurity, LLMs, Kubernetes).
          `;

          let summaryText = "";
          let extractedTopics: string[] = [];

          try {
            const genRes = await ai.models.generateContent({
              model: 'gemini-3.5-flash',
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    summary: {
                      type: Type.STRING,
                      description: "A professional 2-3 sentence summary of the article."
                    },
                    topics: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Up to 3 tech taxonomy tags/topics"
                    }
                  },
                  required: ["summary", "topics"]
                }
              }
            });

            const data = JSON.parse(genRes.text || "{}");
            summaryText = data.summary || item.description.substring(0, 150) + "...";
            extractedTopics = data.topics || [feedTopic];
          } catch (err) {
            console.error(`Gemini call failed for item "${item.title}", using fallback.`, err);
            summaryText = item.description.substring(0, 150) + "...";
            extractedTopics = [feedTopic];
          }

          // 4. Save the new article record in Firestore
          const now = Date.now();
          const cleanId = Buffer.from(articleUrl).toString('base64').substring(0, 24).replace(/[^a-zA-Z0-9]/g, '_');
          
          await db.collection('articles').doc(cleanId).set({
            title: item.title,
            url: articleUrl,
            summary: summaryText,
            content: item.description,
            topics: extractedTopics,
            sourceId: feedId,
            sourceName: feedName,
            status: 'published',
            publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : now,
            createdAt: now,
            updatedAt: now
          });

          console.log(`Stored article: "${item.title}" with ID ${cleanId}.`);
        }

        console.log(`Finished processing feed "${feedName}". Stored ${newArticlesCount} new articles.`);

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

syncFeeds().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error("Unhandle cron promise rejection:", err);
  process.exit(1);
});
