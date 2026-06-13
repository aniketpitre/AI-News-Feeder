import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { GoogleGenAI, Type } from '@google/genai';
import { articleStore } from '@/lib/article-store';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { feedUrl, sourceName, topic } = await req.json();
    if (!feedUrl) {
      return NextResponse.json({ error: 'feedUrl is required' }, { status: 400 });
    }

    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TECH_SYNC News Aggregator',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch RSS: ${response.statusText}` }, { status: 400 });
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    const parsed = parser.parse(xmlText);

    const rawItems = parsed.rss?.channel?.item || parsed.feed?.entry || [];
    // Normalize to array
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    // Pick top 10 recent items
    const recentItems = items.slice(0, 10).map((item: any) => ({
      title: item.title,
      link: item.link?.href || item.link || '',
      description: item.description || item.content || item['content:encoded'] || '',
      pubDate: item.pubDate || item.published || item.updated || '',
    }));

    if (recentItems.length === 0) {
      return NextResponse.json({ items: [], added: 0 });
    }

    const enrichedItems = [];
    let added = 0;
    
    // Process sequentially
    for (const item of recentItems) {
      if (!item.title || !item.link) continue;
      
      const prompt = `
        Analyze the following tech news article snippet/description:
        Title: ${item.title}
        Content Snippet: ${item.description.substring(0, 800)}...
        
        Provide a concise, professional summary for a tech-savvy audience (like XDA or advanced IT news).
        Also provide up to 3 relevant tech topics from: AI, ML, LLMs, DevOps, Kubernetes, Docker, Cybersecurity, SOC, Cloud, Infrastructure, Networking, Security, Development, Open Source, GitHub, Linux, Node.js, Python, TypeScript, Web3, Blockchain, Quantum Computing, Edge Computing, IoT, 5G, or other relevant tech categories.
      `;

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
        const article = {
          id: `${Date.now()}-${Math.random()}`,
          title: item.title,
          url: item.link,
          content: item.description,
          summary: data.summary || "",
          topics: data.topics || [topic || 'Tech'],
          sourceName: sourceName || 'Tech News',
          publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
          createdAt: Date.now(),
        };

        articleStore.addArticle(article);
        enrichedItems.push(article);
        added++;
      } catch (err) {
        console.error("Gemini failed for item:", item.title, err);
        // Fallback - still add the article
        const article = {
          id: `${Date.now()}-${Math.random()}`,
          title: item.title,
          url: item.link,
          content: item.description,
          summary: item.description.substring(0, 200) + '...',
          topics: [topic || 'Tech'],
          sourceName: sourceName || 'Tech News',
          publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
          createdAt: Date.now(),
        };
        
        articleStore.addArticle(article);
        enrichedItems.push(article);
        added++;
      }
    }

    articleStore.setLastSyncAt(Date.now());

    return NextResponse.json({ 
      items: enrichedItems,
      added,
      message: `Synced ${added} articles from ${sourceName || 'source'}`
    });
  } catch (err: any) {
    console.error('RSS parse error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
