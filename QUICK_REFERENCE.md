# TECH_SYNC - Quick Reference Card

## 🚀 30-Second Start

```bash
# 1. Get API Key
# → Go to https://aistudio.google.com/app/apikey
# → Create API Key → Copy it

# 2. Install & Run
npm install
echo "GEMINI_API_KEY=your-key-here" > .env.local
npm run dev

# 3. Open Browser
# → http://localhost:3000
# → Articles appear automatically! ✨
```

---

## 📁 Key Files to Know

| File | Purpose |
|------|---------|
| `app/page.tsx` | 🎨 Homepage design |
| `components/ArticleCard.tsx` | 📰 Article display |
| `lib/article-store.ts` | 💾 Data storage |
| `lib/rss-feeds-config.ts` | 📡 RSS sources |
| `.env.local` | 🔑 API key |
| `SETUP.md` | 📖 Full setup |

---

## 🔧 Common Tasks

### Add RSS Feed
Edit `lib/rss-feeds-config.ts`:
```typescript
{
  id: 'unique-id',
  name: 'Feed Name',
  url: 'https://example.com/feed',
  topic: 'Category',
  category: 'Tech',
}
```

### Change Sync Interval
Edit `app/layout.tsx`:
```typescript
setInterval(syncFeeds, 1800000); // 30 minutes
setInterval(syncFeeds, 3600000); // 1 hour
```

### Customize Colors
Edit `app/globals.css`:
```css
--color-primary: #00FFC2;    /* Cyan */
--color-secondary: #00D9FF;  /* Teal */
```

### Manual Sync
```bash
curl -X POST http://localhost:3000/api/sync
```

### Get Articles
```bash
curl http://localhost:3000/api/articles
```

---

## 🚀 Deployment Commands

### Vercel
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t tech-sync .
docker run -e GEMINI_API_KEY=your-key -p 3000:3000 tech-sync
```

### Linux (PM2)
```bash
npm install -g pm2
pm2 start npm --name tech-sync -- start
pm2 save
```

---

## 📊 Architecture at a Glance

```
🔄 Auto Sync (Every 30 min + 1 hour)
    ↓
📡 Fetch RSS Feeds (Parallel)
    ↓
🤖 Gemini AI (Summarize + Categorize)
    ↓
💾 In-Memory Store (Latest 100)
    ↓
🎨 Beautiful Homepage (Auto-updates)
    ↓
👥 Users see Real-time News!
```

---

## 🎨 Homepage Sections

1. **Navigation** - Logo, links, subscribe button
2. **Hero** - 3D background, tagline, CTAs
3. **Featured** - Large story with animations
4. **Search** - Keyword search + category filter
5. **Grid** - 3-column article cards
6. **Trending** - Popular topics
7. **Newsletter** - Email signup
8. **Ticker** - Animated bottom banner

---

## 🔐 Security Checklist

- ✅ `.env.local` in `.gitignore`
- ✅ API key never in code
- ✅ No user login needed
- ✅ No database compromise risk
- ✅ Rate-limited API calls

---

## 💡 Pro Tips

1. **Test API**: Open `/api/articles` in browser
2. **Debug**: Open DevTools (F12) → Console
3. **Check Logs**: Look for `[TECH_SYNC]` messages
4. **Monitor Sync**: Visit `/api/sync` (GET)
5. **Fresh Data**: Ctrl+Shift+Delete to clear cache

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| No articles | Check API key, run `POST /api/sync` |
| Page blank | Check browser console (F12) |
| Sync fails | Verify RSS feed URLs are valid |
| Memory high | Restart app (clears articles) |
| Slow load | Reduce number of feeds |

---

## 📈 Monitoring

```bash
# Check sync status
curl http://localhost:3000/api/sync

# Manual trigger
curl -X POST http://localhost:3000/api/sync

# Get articles (with pagination)
curl http://localhost:3000/api/articles?limit=10

# Check health
curl http://localhost:3000/api/init
```

---

## 🎯 What Happens When You Run It

```
1. npm run dev → Starts dev server on :3000
2. Browser loads → JavaScript fires auto-sync
3. /api/sync → Fetches all 10 RSS feeds (parallel)
4. Gemini processes → Each article gets summary + topics
5. Store updates → Articles in memory
6. Page refreshes → Shows new articles
7. Every 30 min → Repeat automatically
8. Every 1 hour → Backup sync runs
```

---

## 🌟 Features Checklist

- ✅ 3D interactive homepage
- ✅ Automatic hourly sync
- ✅ AI-enriched content
- ✅ Auto-publishing
- ✅ Search & filter
- ✅ Trending topics
- ✅ Responsive design
- ✅ Newsletter signup
- ✅ Zero database
- ✅ Production ready

---

## 📚 Documentation

- **README.md** - Full overview
- **SETUP.md** - Complete setup guide
- **DESIGN_REFERENCE.md** - UI/UX details
- **IMPLEMENTATION_SUMMARY.md** - What changed
- This file - Quick reference

---

## 🔗 Important Links

- **Gemini API**: https://ai.google.dev
- **Get API Key**: https://aistudio.google.com/app/apikey
- **Next.js Docs**: https://nextjs.org
- **Tailwind Docs**: https://tailwindcss.com
- **Framer Motion**: https://www.framer.com/motion

---

## 💬 Need Help?

1. Read **SETUP.md** for detailed instructions
2. Check browser **console** (F12) for errors
3. Test **API endpoints** directly
4. Review **app/page.tsx** for implementation
5. Check **GitHub issues** for common problems

---

**Keep this card handy! 📌**

*You've got a professional, production-ready tech news platform!* 🚀
