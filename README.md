<div align="center">
<img width="1200" height="100" alt="TECH_SYNC" src="https://via.placeholder.com/1200x100?text=TECH_SYNC+-+AI+News+Aggregation" />
</div>

# TECH_SYNC - AI-Powered Tech News Aggregation Platform

A stunning, fully-automated tech news aggregator that uses AI to curate and enrich content from multiple RSS feeds. Built with Next.js 15, Gemini API, and Framer Motion animations.

## Features

✨ **AI-Driven Curation**
- Automatic RSS feed parsing and article enrichment using Google Gemini
- Intelligent topic extraction and categorization
- Real-time news aggregation

🔄 **Fully Automated**
- Scheduled hourly RSS feed synchronization
- Zero manual intervention required
- Auto-publishing of articles

🎨 **3D Interactive Design**
- Modern, responsive UI inspired by igloo.inc
- Smooth animations and transitions
- Dark theme with cyan/teal accents
- Real-time article streaming

📰 **Professional Coverage**
- AI, Machine Learning, LLMs
- DevOps, Kubernetes, Docker
- Cybersecurity, SOC, Infrastructure
- Cloud Computing, Open Source
- Plus 10+ more tech categories

🚀 **Performance**
- Lightweight and fast
- Client-side rendering with Next.js
- Optimized animations with Framer Motion
- In-memory article storage (scalable)

## Tech Stack

- **Frontend**: Next.js 15.4.9, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Framer Motion
- **AI**: Google Gemini 3.5 Flash API
- **RSS Parsing**: fast-xml-parser
- **UI Components**: shadcn/ui, Lucide Icons
- **Database**: In-memory store (no external DB required)

## Prerequisites

- Node.js 18+ and npm/yarn
- Google Gemini API Key (free tier available at [ai.google.dev](https://ai.google.dev))

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd AI-News-Feeder
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Create .env.local file
echo "GEMINI_API_KEY=your-gemini-api-key-here" > .env.local
```

Get your free Gemini API key:
- Visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Create a new API key
- Copy it to `.env.local`

4. **Run the development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Configuration

### Adding/Modifying RSS Feeds

Edit `lib/rss-feeds-config.ts` to add or remove RSS feed sources:

```typescript
export const RSS_FEEDS: RSSFeedConfig[] = [
  {
    id: 'unique-id',
    name: 'Feed Name',
    url: 'https://example.com/feed',
    topic: 'Category',
    category: 'Tech',
  },
  // Add more feeds...
];
```

### Customizing Sync Interval

The default sync interval is set to 30 minutes (backup) and 1 hour (primary) in `app/layout.tsx`:

```typescript
// Sync every 30 minutes for freshness
setInterval(syncFeeds, 1800000); // 30 minutes

// Primary sync every hour
setInterval(syncFeeds, 3600000); // 1 hour
```

Modify these intervals as needed.

## API Endpoints

### GET `/api/articles`
Fetch all published articles with trending topics.

**Response:**
```json
{
  "articles": [
    {
      "id": "string",
      "title": "string",
      "url": "string",
      "summary": "string",
      "topics": ["string"],
      "sourceName": "string",
      "publishedAt": 1234567890,
      "createdAt": 1234567890
    }
  ],
  "trendingTopics": ["AI", "Kubernetes", ...],
  "totalArticles": 42,
  "lastSync": 1234567890
}
```

### POST `/api/sync`
Manually trigger RSS feed synchronization.

**Response:**
```json
{
  "status": "completed",
  "totalAdded": 15,
  "feedsProcessed": 10,
  "results": [
    {
      "feed": "Feed Name",
      "added": 2,
      "status": "success"
    }
  ],
  "lastSyncAt": 1234567890
}
```

### POST `/api/rss/parse`
Parse a single RSS feed URL.

**Request:**
```json
{
  "feedUrl": "https://example.com/feed",
  "sourceName": "Feed Name",
  "topic": "Category"
}
```

### GET `/api/init`
Initialize the application and trigger initial sync.

## Usage

1. **Home Page**: Browse all aggregated tech news
2. **Search**: Find articles by keyword
3. **Filter**: Browse by category (AI, DevOps, Kubernetes, etc.)
4. **Subscribe**: Get email notifications for new articles
5. **Share**: Click article cards to read full stories

## How It Works

```
RSS Feeds → Parse XML → Gemini AI → Extract Summary + Topics → Store → Display
    ↓
Auto-Sync (Hourly) → Process All Feeds in Parallel → Auto-Publish Articles → Live Updates
```

1. **Fetch**: RSS feeds are fetched every 30 minutes and 1 hour
2. **Parse**: XML is parsed to extract article metadata
3. **Enrich**: Each article is sent to Gemini for summarization and topic extraction
4. **Store**: Articles are stored in memory (up to 100 latest articles)
5. **Publish**: Articles are immediately available on the homepage
6. **Display**: Users see real-time updates with smooth animations

## Performance Considerations

- **In-Memory Storage**: Articles are stored in RAM; the system keeps the 100 most recent articles
- **Parallel Processing**: All RSS feeds are synced in parallel for speed
- **Rate Limiting**: Sync operations are rate-limited (minimum 5 minutes between syncs)
- **Fallback**: If Gemini API fails, articles are still published with auto-generated summaries

## Customization

### Styling
- Primary colors: Cyan (#00FFC2) and Teal (#00D9FF)
- Edit `app/globals.css` for theme changes
- Tailwind CSS configuration in components.json

### Article Display
- Modify `components/ArticleCard.tsx` for different layouts
- Update category colors in the component
- Customize animations with Framer Motion

### Homepage
- Edit `app/page.tsx` to add sections
- Modify hero content in the 3D hero section
- Adjust grid layouts and responsive breakpoints

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t tech-sync .
docker run -e GEMINI_API_KEY=your-key -p 3000:3000 tech-sync
```

### Environment Variables for Production
```
GEMINI_API_KEY=your-production-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Troubleshooting

### No articles showing
1. Check that `GEMINI_API_KEY` is set correctly
2. Verify RSS feed URLs are accessible
3. Check browser console for errors
4. Trigger manual sync: `POST /api/sync`

### Sync not working
1. Verify Gemini API key quota
2. Check feed URLs in `lib/rss-feeds-config.ts`
3. Look at server logs for errors
4. Ensure network connectivity

### Articles not updating
1. Manual sync: `POST /api/sync`
2. Check sync interval settings in `app/layout.tsx`
3. Verify article store isn't full (max 100 articles)
4. Check browser cache (Ctrl+Shift+Delete)

## Contributing

Contributions are welcome! Please submit issues and pull requests.

## License

MIT License - feel free to use this for personal or commercial projects.

## Credits

- Inspired by [igloo.inc](https://www.igloo.inc/) design principles
- Powered by Google Gemini API
- Built with Next.js and React
- Animations with Framer Motion

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Happy news reading!** 🚀

Made with ❤️ for tech enthusiasts, developers, and DevOps engineers.
