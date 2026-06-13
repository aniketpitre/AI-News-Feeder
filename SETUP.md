# TECH_SYNC Setup & Deployment Guide

## 🚀 Quick Start (5 minutes)

### 1. Get Your Gemini API Key
- Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Click "Create API Key"
- Copy the key

### 2. Setup Project
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local and add your API key
# GEMINI_API_KEY=your-key-here
```

### 3. Run Locally
```bash
npm run dev
# Open http://localhost:3000
```

### 4. Done! 🎉
Articles will start syncing automatically every 30 minutes.

---

## 📋 Project Structure

```
/app
  ├── page.tsx                 # Main homepage with 3D design
  ├── layout.tsx              # Global layout + auto-sync script
  ├── globals.css             # Animations & styling
  ├── api/
  │   ├── articles/route.ts   # GET articles list
  │   ├── sync/route.ts       # POST manual sync trigger
  │   ├── rss/parse/route.ts  # RSS parsing with Gemini enrichment
  │   └── init/route.ts       # App initialization

/components
  ├── Navigation.tsx           # Top navigation bar
  ├── ArticleCard.tsx         # Article display card (featured/grid/list)
  └── /ui                     # shadcn/ui components

/lib
  ├── article-store.ts        # In-memory article storage
  ├── rss-feeds-config.ts     # RSS feed sources
  └── utils.ts                # Utility functions
```

---

## ⚙️ How It Works

### Automatic Sync Flow
```
1. Page loads → Triggers /api/init
2. Browser script checks /api/sync every 30 mins + 1 hour
3. /api/sync processes all feeds in parallel
4. /api/rss/parse fetches + enriches each article
5. Articles stored in memory
6. Homepage fetches from /api/articles
7. Real-time display with animations
```

### Article Processing
```
RSS Feed URL
    ↓
Parse XML (fast-xml-parser)
    ↓
Extract top 10 articles
    ↓
For each article:
  - Title, URL, Description
  - Send to Gemini API
  - Extract: Summary (2-3 sentences) + Topics (3 max)
  - Store in memory
    ↓
Display on homepage with animations
```

---

## 🎨 Customization

### Change Sync Interval
Edit `app/layout.tsx`:
```typescript
// Change these intervals (milliseconds)
setInterval(syncFeeds, 1800000); // 30 minutes
setInterval(syncFeeds, 3600000); // 1 hour
```

### Add More RSS Feeds
Edit `lib/rss-feeds-config.ts`:
```typescript
{
  id: 'unique-id',
  name: 'Site Name',
  url: 'https://example.com/feed',
  topic: 'AI',
  category: 'Tech',
}
```

### Change Colors
Edit `app/globals.css` and `components/ArticleCard.tsx`:
```css
/* Primary colors */
--color-primary: #00FFC2;  /* Cyan */
--color-secondary: #00D9FF; /* Teal */
```

### Modify Homepage Layout
Edit `app/page.tsx` to:
- Add/remove sections
- Change animations
- Modify grid layouts
- Adjust responsive breakpoints

### Customize Category Colors
In `components/ArticleCard.tsx`:
```typescript
const topicColors: Record<string, string> = {
  'AI': 'bg-blue-500/20 text-blue-300',
  // Add more colors...
};
```

---

## 🚀 Deployment

### Vercel (Recommended - Free)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variable in Vercel dashboard
# GEMINI_API_KEY = your-key
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### Docker
```bash
# Build
docker build -t tech-sync .

# Run
docker run -e GEMINI_API_KEY=your-key -p 3000:3000 tech-sync
```

### Manual Server (Linux/Ubuntu)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone & setup
git clone <repo> tech-sync
cd tech-sync
npm install
echo "GEMINI_API_KEY=your-key" > .env.local

# Build
npm run build

# Run with PM2 (keep alive)
npm install -g pm2
pm2 start "npm start" --name "tech-sync"
pm2 save
pm2 startup
```

---

## 📊 Monitoring

### Check Sync Status
```bash
# GET /api/sync (check status)
curl http://localhost:3000/api/sync

# Response:
{
  "status": "ok",
  "isSyncing": false,
  "lastSyncAt": 1234567890,
  "totalArticles": 42,
  "trendingTopics": ["AI", "Kubernetes", ...]
}
```

### Manual Sync
```bash
# Trigger sync manually
curl -X POST http://localhost:3000/api/sync

# Response:
{
  "status": "completed",
  "totalAdded": 15,
  "feedsProcessed": 10
}
```

### Get Articles
```bash
# Fetch all articles
curl http://localhost:3000/api/articles

# Response:
{
  "articles": [...],
  "trendingTopics": [...],
  "totalArticles": 42
}
```

---

## ⚠️ Troubleshooting

### Issue: No articles appearing
**Solutions:**
1. Check Gemini API key is valid
   ```bash
   curl https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent \
     -H "x-goog-api-key: YOUR_KEY" \
     -H "Content-Type: application/json"
   ```

2. Verify RSS feeds are accessible
   ```bash
   curl https://example.com/feed
   ```

3. Check browser console for errors (F12)

4. Manually trigger sync
   ```bash
   curl -X POST http://localhost:3000/api/sync
   ```

### Issue: Sync timeout
**Solutions:**
1. Reduce number of RSS feeds
2. Increase timeout in `/api/sync`
3. Check Gemini API rate limits
4. Verify network connectivity

### Issue: High memory usage
**Solutions:**
1. Reduce articles stored (change to 50 instead of 100)
   Edit `lib/article-store.ts`:
   ```typescript
   if (store.articles.length > 50) {
     store.articles = store.articles.slice(-50);
   }
   ```

2. Increase sync interval (syncs less often)

3. Restart the app (clears memory)

---

## 📈 Performance Tips

1. **Reduce Feed Count**: Fewer feeds = faster sync
2. **Increase Sync Interval**: Less frequent syncs = lower API costs
3. **Filter Articles**: Only show top N articles on homepage
4. **Cache Static Assets**: Use CDN for images/styles
5. **Monitor Gemini Usage**: Check API quota at ai.google.dev

---

## 🔒 Security Best Practices

1. **Never commit `.env.local`**: Already in `.gitignore`
2. **Use environment variables**: For all secrets
3. **Rotate API keys**: Regularly change Gemini key
4. **Monitor usage**: Track Gemini API spend
5. **Rate limit**: Implement rate limiting for public APIs

---

## 📞 Support

### Debug Mode
Add debug logging:
```typescript
// In app/layout.tsx
console.log('[TECH_SYNC] Initializing auto-sync...');
```

### Check Logs
```bash
# Vercel logs
vercel logs

# Docker logs
docker logs tech-sync

# Server logs
tail -f ~/.pm2/logs/tech-sync-out.log
```

### Common Errors

**"GEMINI_API_KEY not found"**
- Solution: Set in `.env.local` or deployment platform

**"RSS parse error"**
- Solution: Check feed URL is valid RSS/Atom format

**"Too many requests"**
- Solution: Increase sync interval or reduce feeds

**"Out of memory"**
- Solution: Reduce max articles (currently 100)

---

## 🎯 Next Steps

1. ✅ Get Gemini API key
2. ✅ Run locally
3. ✅ Verify articles appear
4. ✅ Customize feeds & design
5. ✅ Deploy to production
6. ✅ Monitor & maintain

---

## 📚 Resources

- **Next.js**: https://nextjs.org/docs
- **Gemini API**: https://ai.google.dev
- **Framer Motion**: https://www.framer.com/motion
- **Tailwind CSS**: https://tailwindcss.com
- **shadcn/ui**: https://ui.shadcn.com

---

**Happy deploying! 🚀**
