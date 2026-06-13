'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArticleCard } from '@/components/ArticleCard';
import { Sparkles, Zap, TrendingUp, Search } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  url: string;
  summary: string;
  topics: string[];
  sourceName: string;
  publishedAt: number;
  createdAt: number;
}

const CATEGORIES = [
  'AI',
  'ML',
  'LLMs',
  'DevOps',
  'Kubernetes',
  'Docker',
  'Cybersecurity',
  'Cloud',
  'Security',
  'Development',
];

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);

  useEffect(() => {
    // Fetch articles from API
    const fetchArticles = async () => {
      try {
        const response = await fetch('/api/articles');
        const data = await response.json();
        setArticles(data.articles || []);
        setTrendingTopics(data.trendingTopics || []);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();

    // Trigger sync in background
    fetch('/api/sync', { method: 'POST' }).catch(() => {});
  }, []);

  useEffect(() => {
    let filtered = articles;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(article => article.topics.includes(selectedCategory));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        article =>
          article.title.toLowerCase().includes(query) ||
          article.summary.toLowerCase().includes(query)
      );
    }

    setFilteredArticles(filtered);
  }, [articles, selectedCategory, searchQuery]);

  const featuredArticle = articles[0];

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-20 overflow-x-hidden">
      {/* Hero Section with 3D Background */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-4 md:px-8">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large background gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00FFC2]/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00D9FF]/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-[#0080FF]/10 rounded-full blur-3xl animate-blob animation-delay-4000" />

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 255, 194, .1) 25%, rgba(0, 255, 194, .1) 26%, transparent 27%, transparent 74%, rgba(0, 255, 194, .1) 75%, rgba(0, 255, 194, .1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 194, .1) 25%, rgba(0, 255, 194, .1) 26%, transparent 27%, transparent 74%, rgba(0, 255, 194, .1) 75%, rgba(0, 255, 194, .1) 76%, transparent 77%, transparent)',
            backgroundSize: '50px 50px',
          }} />
        </div>

        <div className="relative z-10 max-w-6xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-block mb-6"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-[#00FFC2]/10 border border-[#00FFC2]/50 rounded-full">
                <Sparkles className="w-4 h-4 text-[#00FFC2]" />
                <span className="text-sm font-bold uppercase tracking-wider text-[#00FFC2]">
                  AI-Powered News Aggregation
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter mb-6 text-white"
            >
              Future Tech News,
              <br />
              <span className="bg-gradient-to-r from-[#00FFC2] via-[#00D9FF] to-[#0080FF] bg-clip-text text-transparent animate-pulse">
                Today
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-8"
            >
              Discover the latest in AI, DevOps, Kubernetes, and emerging technologies. Automatically curated and enriched by advanced AI.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col md:flex-row gap-4 justify-center"
            >
              <button className="px-8 py-4 bg-gradient-to-r from-[#00FFC2] to-[#00D9FF] text-black font-bold uppercase tracking-wider rounded-lg hover:shadow-lg hover:shadow-[#00FFC2]/50 transition-all duration-300 flex items-center gap-2 justify-center">
                <Zap className="w-5 h-5" />
                Explore Latest News
              </button>
              <button className="px-8 py-4 border-2 border-[#00FFC2]/50 text-white font-bold uppercase tracking-wider rounded-lg hover:border-[#00FFC2] hover:bg-[#00FFC2]/5 transition-all duration-300">
                Subscribe for Updates
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Article */}
      {featuredArticle && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <ArticleCard article={featuredArticle} variant="featured" />
          </motion.div>
        </section>
      )}

      {/* Search and Filter Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-4 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#00FFC2] focus:ring-2 focus:ring-[#00FFC2]/20 transition-all"
            />
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Filter by Category</h3>
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all ${
                  selectedCategory === null
                    ? 'bg-[#00FFC2] text-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                All
              </motion.button>
              {CATEGORIES.map((category) => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                  className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all ${
                    selectedCategory === category
                      ? 'bg-[#00FFC2] text-black'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Latest Articles Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-black mb-2">
            {selectedCategory ? `${selectedCategory} News` : 'Latest Articles'}
          </h2>
          <p className="text-white/60 mb-8">
            {filteredArticles.length} {selectedCategory ? `${selectedCategory} ` : ''}article{filteredArticles.length !== 1 ? 's' : ''} available
          </p>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60 text-lg">No articles found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article, index) => (
                <ArticleCard key={article.id} article={article} variant="grid" index={index} />
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* Trending Topics */}
      {trendingTopics.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-[#00FFC2]/10 to-[#00D9FF]/10 border border-[#00FFC2]/30 rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-[#00FFC2]" />
              <h3 className="text-2xl font-bold">Trending Topics</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {trendingTopics.slice(0, 8).map((topic) => (
                <motion.button
                  key={topic}
                  whileHover={{ scale: 1.1, translateY: -2 }}
                  onClick={() => setSelectedCategory(topic)}
                  className="px-6 py-2 bg-white/10 border border-white/20 rounded-full font-mono text-sm uppercase tracking-wider hover:border-[#00FFC2] hover:bg-[#00FFC2]/10 transition-all"
                >
                  {topic}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-[#00FFC2]/20 to-[#00D9FF]/20 border border-[#00FFC2]/50 rounded-2xl p-12 text-center"
        >
          <h3 className="text-3xl font-black mb-4">Never Miss a Story</h3>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            Get the latest tech news delivered to your inbox. Articles are curated and enriched by AI for better insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#00FFC2] transition-all"
            />
            <button className="px-8 py-3 bg-gradient-to-r from-[#00FFC2] to-[#00D9FF] text-black font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FFC2]/50 transition-all">
              Subscribe
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
