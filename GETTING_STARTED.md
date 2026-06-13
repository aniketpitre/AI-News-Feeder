# 🎬 Getting Started - TECH_SYNC

## Quick Navigation

| If you want to... | Read this |
|------------------|-----------|
| 🚀 **Get running in 5 minutes** | → **QUICK_REFERENCE.md** |
| 📖 **Understand everything** | → **README.md** |
| 🔧 **Detailed setup** | → **SETUP.md** |
| 🎨 **Design specifications** | → **DESIGN_REFERENCE.md** |
| 📊 **What changed (technical)** | → **IMPLEMENTATION_SUMMARY.md** |
| ✅ **Verify all features** | → **COMPLETION_SUMMARY.md** |

---

## 🏃 Ultra-Quick Start (5 minutes)

### 1️⃣ Get API Key (1 minute)
```
1. Visit: https://aistudio.google.com/app/apikey
2. Click: "Create API Key"  
3. Copy: The generated key
```

### 2️⃣ Setup (2 minutes)
```bash
npm install
cp .env.example .env.local
# Edit .env.local and paste your API key
```

### 3️⃣ Run (1 minute)
```bash
npm run dev
# Open: http://localhost:3000
```

### 4️⃣ Watch Magic ✨ (1 minute)
- Articles appear automatically
- New content every 30 minutes
- Beautiful 3D design
- Fully automated!

---

## 📋 What You Get

```
✅ Professional tech news homepage
✅ 10 popular RSS feeds (pre-configured)
✅ AI-powered content enrichment
✅ Automatic hourly syncing
✅ Beautiful 3D interactive design
✅ Search & category filtering
✅ Trending topics
✅ Newsletter signup
✅ Mobile responsive
✅ Production ready
```

---

## 🎯 Top 5 Questions

### Q: Do I need to set up a database?
**A:** No! Articles are stored in memory. Zero database needed.

### Q: What if Gemini API fails?
**A:** Articles still publish with auto-generated summaries.

### Q: How much does it cost?
**A:** ~$0-20/month. Gemini free tier covers most usage.

### Q: Can I customize the design?
**A:** Yes! Edit `app/globals.css` and `components/ArticleCard.tsx`

### Q: How do I add more RSS feeds?
**A:** Edit `lib/rss-feeds-config.ts` - super easy!

---

## 🚀 Deployment Cheat Sheet

### Vercel (Easiest)
```bash
npm install -g vercel
vercel
```
Then add `GEMINI_API_KEY` in Vercel dashboard.

### Docker (Most Flexible)
```bash
docker build -t tech-sync .
docker run -e GEMINI_API_KEY=your-key -p 3000:3000 tech-sync
```

### Linux (Most Control)
```bash
# Install Node 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Setup
git clone <repo>
cd tech-sync
npm install
echo "GEMINI_API_KEY=key" > .env.local

# Run
npm install -g pm2
pm2 start npm -- start
pm2 startup
pm2 save
```

---

## 📱 Homepage Preview

```
┌─────────────────────────────────────────────────┐
│ TECH_SYNC     Latest  Trending  Categories  ⬜ │
│ 🔵 Live   |   Subscribe                         │
├─────────────────────────────────────────────────┤
│                                                 │
│          Future Tech News, Today                │
│       (Beautiful 3D background)                 │
│                                                 │
│  [🚀 Explore]  [📧 Subscribe]                  │
├─────────────────────────────────────────────────┤
│  Featured Article Card (Large with animations) │
├─────────────────────────────────────────────────┤
│  [Search Box] Filter: [All] [AI] [DevOps]...  │
├─────────────────────────────────────────────────┤
│  Article 1    | Article 2    | Article 3        │
│  ──────────   | ──────────   | ──────────        │
│  Article 4    | Article 5    | Article 6        │
├─────────────────────────────────────────────────┤
│  Trending Topics: [AI] [Kubernetes] [Cloud]... │
├─────────────────────────────────────────────────┤
│  Never Miss  |  📧 email@example.com [Subscribe]
├─────────────────────────────────────────────────┤
│ AI-DRIVEN AGGREGATION • POWERED BY GEMINI • ... │
└─────────────────────────────────────────────────┘
```

---

## 🔑 Key Files

| File | What it does |
|------|------------|
| `app/page.tsx` | Homepage with 3D design |
| `components/ArticleCard.tsx` | Article card display |
| `lib/article-store.ts` | Stores articles in memory |
| `lib/rss-feeds-config.ts` | List of RSS feeds |
| `app/api/sync/route.ts` | Triggers RSS sync |
| `app/api/articles/route.ts` | Returns articles |
| `app/api/rss/parse/route.ts` | Parses & enriches articles |
| `.env.local` | Your Gemini API key |

---

## ⚙️ How It Works (Simple Version)

```
Browser loads
    ↓
JavaScript checks if sync needed
    ↓
Every 30 mins: Fetch all 10 RSS feeds
    ↓
Parse each article
    ↓
Send to Gemini: "Give me 2-line summary + 3 categories"
    ↓
Store articles in memory
    ↓
Display on homepage with animations
    ↓
Users see beautiful, automatically updated news site!
```

---

## 🎨 Customization Ideas

### Change Accent Colors
Edit `app/globals.css`:
```css
--color-primary: #00FFC2;    /* Cyan */
--color-secondary: #00D9FF;  /* Teal */
```

### Add More Feeds
Edit `lib/rss-feeds-config.ts`:
```typescript
{
  id: 'myblog-1',
  name: 'My Blog',
  url: 'https://myblog.com/feed',
  topic: 'AI',
  category: 'Tech',
}
```

### Change Sync Interval
Edit `app/layout.tsx`:
```typescript
setInterval(syncFeeds, 600000);   // 10 minutes (faster)
setInterval(syncFeeds, 7200000);  // 2 hours (slower)
```

### Modify Homepage
Edit `app/page.tsx`:
- Change hero text
- Add new sections
- Customize animations
- Adjust grid layouts

---

## 🆘 Troubleshooting

### No articles appearing?
```bash
# Check if API key is valid
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent \
  -H "x-goog-api-key: YOUR_KEY" \
  -H "Content-Type: application/json"

# Manually trigger sync
curl -X POST http://localhost:3000/api/sync

# Check articles
curl http://localhost:3000/api/articles
```

### Feed not syncing?
1. Check RSS feed URL is valid
2. Test RSS in browser: `https://example.com/feed`
3. Check browser console (F12)
4. Check server logs

### Gemini API rate limits?
- Free tier: 60 requests/minute (plenty!)
- Usually resets hourly
- Switch to paid if needed

---

## 📊 Monitoring Commands

```bash
# Check sync status
curl http://localhost:3000/api/sync

# Manual sync trigger
curl -X POST http://localhost:3000/api/sync

# Get all articles
curl http://localhost:3000/api/articles

# Check app health
curl http://localhost:3000/api/init
```

---

## 🎯 Success Checklist

- [ ] Gemini API key obtained
- [ ] `.env.local` created with API key
- [ ] `npm install` completed
- [ ] `npm run dev` running
- [ ] Browser showing homepage
- [ ] Articles appearing (give 30 sec)
- [ ] Search/filter working
- [ ] Homepage looks beautiful
- [ ] Ready to deploy!

---

## 🚀 Ready to Deploy?

Choose one:

**🟦 Vercel** (Easiest)
```bash
npm install -g vercel && vercel
```

**🐋 Docker** (Most reliable)
```bash
docker build -t tech-sync . && docker run -p 3000:3000 tech-sync
```

**🖥️ Linux** (Most control)
```bash
pm2 start npm -- start && pm2 save
```

---

## 📚 Full Documentation

- 📖 **README.md** - Overview & features
- 🔧 **SETUP.md** - Detailed setup steps
- ⚡ **QUICK_REFERENCE.md** - Quick commands
- 🎨 **DESIGN_REFERENCE.md** - UI specifications
- 📊 **IMPLEMENTATION_SUMMARY.md** - Technical details
- ✅ **COMPLETION_SUMMARY.md** - What was completed

---

## 🎓 Learning Path

1. Read this file (Getting Started) ← You are here
2. Try Quick Start (5 minutes)
3. Read QUICK_REFERENCE.md (common tasks)
4. Read SETUP.md (detailed guide)
5. Read README.md (everything)
6. Deploy to production!

---

## 🎉 You're Ready!

Your professional tech news aggregator is built and waiting.

**Next step:** Get your Gemini API key and run `npm run dev`

**Questions?** Check the docs or search the codebase.

---

```
╔════════════════════════════════════════════╗
║                                            ║
║    🚀 Welcome to TECH_SYNC! 🚀           ║
║                                            ║
║  Your AI-powered news aggregator          ║
║  is ready to go!                          ║
║                                            ║
║  Get API key → npm install                ║
║  → .env setup → npm run dev                ║
║                                            ║
║  That's it! Enjoy! ✨                     ║
║                                            ║
╚════════════════════════════════════════════╝
```

---

**Happy coding! 🎉**
