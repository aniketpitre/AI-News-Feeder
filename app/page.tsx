"use client";

import { useRef, useState, useEffect, Suspense } from 'react';
import HeroCanvas from '@/components/HeroCanvas';
import { ArrowRight, Cpu, Shield, Container, Brain } from 'lucide-react';
import { TextScramble } from '@/components/ui/TextScramble';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
import { ArticlePanel, ArticlePanelData } from '@/components/ui/ArticlePanel';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mockArticles } from '@/lib/mock-articles';
import { useRouter, useSearchParams } from 'next/navigation';
import { normalizeTopic } from '@/lib/normalize-topic';

const categories = [
  { name: 'DevOps', icon: Container },
  { name: 'K8s', icon: Cpu },
  { name: 'AI/ML', icon: Brain },
  { name: 'Cyber SOC', icon: Shield },
];

function HomeContent() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [articles, setArticles] = useState<any[]>(mockArticles);
  const [selectedArticle, setSelectedArticle] = useState<ArticlePanelData | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get('category') || 'all';

  useEffect(() => {
    setVisibleCount(6);
  }, [activeCategory]);

  useEffect(() => {
    async function fetchHomeArticles() {
      try {
        const q = query(collection(db, 'articles'), where('status', '==', 'published'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const fetched = snapshot.docs.map(doc => {
            const data = doc.data();
            const rawDate = data.publishedAt
              ? new Date(data.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : data.date || 'TBD';
            return {
              id: doc.id,
              category: normalizeTopic(data.topics || [], data.sourceName || data.category || ''),
              title: data.title || '',
              excerpt: data.summary || data.content?.substring(0, 150) + '...' || '',
              date: rawDate,
              url: data.url || '',
              topics: data.topics || [],
              publishedAt: data.publishedAt || (data.date ? new Date(data.date).getTime() : Date.now()),
            };
          });
          fetched.sort((a, b) => b.publishedAt - a.publishedAt);
          setArticles(fetched);
        }
      } catch (err) {
        console.error("Home Firestore query failed, using mock data", err);
      }
    }
    fetchHomeArticles();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--mx', `${x}%`);
    el.style.setProperty('--my', `${y}%`);
  };

  const handleCategoryClick = (name: string) => {
    if (activeCategory.toLowerCase() === name.toLowerCase()) {
      router.push('/?category=all');
    } else {
      router.push(`/?category=${name}`);
    }
  };

  const handleLoadMore = () => {
    if (isScanning) return;
    setIsScanning(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 6);
      setIsScanning(false);
    }, 1500);
  };

  const filteredArticles = activeCategory.toLowerCase() === 'all' || activeCategory.toLowerCase() === 'network'
    ? articles
    : articles.filter(a => a.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="w-full">
      {/* HERO SECTION */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative w-full h-[100vh] min-h-[640px] overflow-hidden group"
        style={{ '--mx': '50%', '--my': '50%' } as React.CSSProperties}
      >
        <HeroCanvas />
        <div
          className="pointer-events-none absolute inset-0 z-[5] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: 'radial-gradient(400px circle at var(--mx) var(--my), rgba(0,255,194,0.12), transparent 70%)' }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050505] to-transparent z-10" />
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 text-center pointer-events-none">
          <span className="mb-4 inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#00FFC2] backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-[#00FFC2] rounded-full animate-pulse" />
            Live Network Feed
          </span>
          <h1
            className="text-4xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.95] select-none transition-all duration-300 pointer-events-auto cursor-default"
            style={{
              backgroundImage: 'radial-gradient(550px circle at var(--mx) var(--my), #00FFC2 0%, #ffffff 45%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            <TextScramble text="TECH_SYNC" trigger="both" />
            <span className="text-[#00FFC2]">.</span>
          </h1>
          <p className="mt-6 max-w-xl text-xs sm:text-sm md:text-base text-white/50 uppercase tracking-widest font-medium">
            Signal from the edge — DevOps, Kubernetes, AI/ML &amp; Cyber Security, curated in real time.
          </p>
          <div className="mt-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 animate-bounce">
            Scroll <ArrowRight className="w-3 h-3 rotate-90" />
          </div>
        </div>
      </section>

      {/* CATEGORY STRIP */}
      <section className="border-y border-white/10 bg-[#080808]/80 sticky top-[97px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-start md:justify-center gap-x-8 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
          {categories.map(({ name, icon: Icon }) => {
            const isActive = activeCategory.toLowerCase() === name.toLowerCase();
            return (
              <button
                key={name}
                onClick={() => handleCategoryClick(name)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer shrink-0 border ${
                  isActive ? 'text-[#00FFC2] border-[#00FFC2] bg-[#00FFC2]/5 scale-105' : 'text-white/50 border-transparent hover:text-[#00FFC2]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  <TextScramble text={name} trigger="hover" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* LATEST FEED */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">
            Latest <TextScramble text={activeCategory === 'all' ? 'Transmissions' : activeCategory} trigger="both" />
          </h2>
          <span className="text-xs font-bold uppercase tracking-widest text-white/30 font-mono">
            {filteredArticles.length} Nodes Found
          </span>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-[#080808]/40">
            <span className="text-xs font-bold uppercase tracking-widest text-white/30">
              No matching transmissions found on the network.
            </span>
          </div>
        ) : (
          <div>
            <style>{`
              @keyframes revealCard {
                from {
                  opacity: 0;
                  transform: translateY(24px) scale(0.98);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }
              .card-stagger-reveal {
                opacity: 0;
                animation: revealCard 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
            `}</style>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.slice(0, visibleCount).map((article, i) => {
                const delay = (i % 6) * 90;
                return (
                  <div 
                    key={article.id || i}
                    className="card-stagger-reveal"
                    style={{ animationDelay: `${delay}ms` }}
                  >
                    <InteractiveCard
                      category={article.category}
                      title={article.title}
                      excerpt={article.excerpt}
                      date={article.date}
                      url={article.url}
                      onReadMore={() => setSelectedArticle({
                        id: article.id,
                        title: article.title,
                        category: article.category,
                        date: article.date,
                        excerpt: article.excerpt,
                        url: article.url,
                        topics: article.topics,
                        content: article.content
                      })}
                    />
                  </div>
                );
              })}
            </div>

            {/* Load more controls */}
            {filteredArticles.length > visibleCount && (
              <div className="mt-14 flex flex-col items-center justify-center space-y-5">
                {/* Progress bar */}
                <div className="w-64">
                  <div className="flex justify-between text-[9px] font-mono text-white/30 mb-1.5 uppercase tracking-widest">
                    <span>Active Nodes</span>
                    <span>{Math.min(visibleCount, filteredArticles.length)} / {filteredArticles.length}</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-[#00FFC2] transition-all duration-500 rounded-full"
                      style={{ width: `${(Math.min(visibleCount, filteredArticles.length) / filteredArticles.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Scanning simulation loading bar */}
                {isScanning ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center gap-2 text-[9px] font-mono text-[#00FFC2] uppercase tracking-[0.25em]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-pulse" />
                      Scanning sub-nodes...
                    </div>
                    <div className="w-48 h-0.5 bg-white/5 rounded-full overflow-hidden relative">
                      <div className="w-1/3 h-full bg-[#00FFC2] absolute top-0 left-0 rounded-full animate-[loadingSweep_1s_infinite_linear]" />
                    </div>
                    <style>{`
                      @keyframes loadingSweep {
                        0% { left: -33%; }
                        100% { left: 100%; }
                      }
                    `}</style>
                  </div>
                ) : (
                  <button
                    onClick={handleLoadMore}
                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-[#00FFC2]/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#00FFC2] bg-transparent hover:bg-[#00FFC2]/5 transition-all hover:shadow-[0_0_24px_rgba(0,255,194,0.15)] active:scale-95 duration-200 cursor-pointer"
                  >
                    Load More Transmissions
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* FOOTER CTA */}
      <section className="border-t border-white/10 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tighter mb-3">
            Stay synced with the network<span className="text-[#00FFC2]">.</span>
          </h2>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            New transmissions are automatically parsed and cataloged. Check back for updates.
          </p>
        </div>
      </section>

      {/* Article Panel */}
      <ArticlePanel article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
