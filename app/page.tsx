"use client";

import { useRef, useState, useEffect, Suspense } from 'react';
import HeroCanvas from '@/components/HeroCanvas';
import { ArrowRight, Cpu, Shield, Container, Brain } from 'lucide-react';
import { TextScramble } from '@/components/ui/TextScramble';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
import { ArticlePanel, ArticlePanelData } from '@/components/ui/ArticlePanel';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { Preloader } from '@/components/Preloader';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mockArticles } from '@/lib/mock-articles';
import { useRouter, useSearchParams } from 'next/navigation';
import { normalizeTopic } from '@/lib/normalize-topic';
import Link from 'next/link';

const categories = [
  { name: 'DevOps', icon: Container },
  { name: 'K8s', icon: Cpu },
  { name: 'AI/ML', icon: Brain },
  { name: 'Cyber SOC', icon: Shield },
];

/* ───────────────────────────────────────────────────────────
   Animated Section Divider — self-drawing neon line
   ─────────────────────────────────────────────────────────── */
function SectionDivider({ label }: { label?: string }) {
  return (
    <RevealOnScroll className="relative w-full max-w-7xl mx-auto px-6">
      <div className="flex items-center gap-4">
        {label && (
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-white/20 whitespace-nowrap shrink-0">
            {label}
          </span>
        )}
        <div className="flex-1 relative h-px overflow-hidden">
          <div className="section-line-animate absolute inset-0 bg-gradient-to-r from-transparent via-[#00FFC2]/60 to-transparent" />
        </div>
      </div>
      <style>{`
        .section-line-animate {
          animation: lineExpand 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform: scaleX(0);
        }
        @keyframes lineExpand {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </RevealOnScroll>
  );
}

/* ───────────────────────────────────────────────────────────
   Stagger Letter Reveal — for large footer CTA
   ─────────────────────────────────────────────────────────── */
function StaggerLetters({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); observer.unobserve(el); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} aria-label={text}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'translateY(0)' : 'translateY(100%)',
            transition: `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 45}ms, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 45}ms`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
}

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
    <div className="w-full relative">
      {/* Preloader */}
      <Preloader />

      {/* Fixed Background 3D Scene */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <HeroCanvas />
      </div>

      {/* Decorative vertical gridlines inspired by Igloo.inc */}
      <div className="fixed inset-y-0 left-6 md:left-12 lg:left-20 w-px bg-white/[0.04] z-10 pointer-events-none" />
      <div className="fixed inset-y-0 right-6 md:right-12 lg:right-20 w-px bg-white/[0.04] z-10 pointer-events-none" />

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
          <RevealOnScroll delay={200}>
            <span className="mb-4 inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#00FFC2] backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-[#00FFC2] rounded-full animate-pulse" />
              Live Network Feed
            </span>
          </RevealOnScroll>
          <RevealOnScroll delay={400}>
            <h1
              className="font-mono text-4xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.95] select-none transition-all duration-300 pointer-events-auto cursor-default"
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
          </RevealOnScroll>
          <RevealOnScroll delay={600}>
            <p className="mt-6 max-w-xl text-xs sm:text-sm md:text-base text-white/50 uppercase tracking-widest font-medium">
              Signal from the edge — DevOps, Kubernetes, AI/ML &amp; Cyber Security, curated in real time.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={900}>
            <div className="mt-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 animate-bounce">
              Scroll <ArrowRight className="w-3 h-3 rotate-90" />
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Animated divider between hero and categories */}
      <SectionDivider label="// SECTION_01: CATEGORIES" />

      {/* CATEGORY STRIP */}
      <section className="border-y border-white/10 bg-[#080808]/80 sticky top-[97px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-start md:justify-center gap-x-8 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
          {categories.map(({ name, icon: Icon }, i) => {
            const isActive = activeCategory.toLowerCase() === name.toLowerCase();
            return (
              <RevealOnScroll key={name} delay={i * 100} direction="up">
                <button
                  onClick={() => handleCategoryClick(name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 cursor-pointer shrink-0 border ${
                    isActive ? 'text-[#00FFC2] border-[#00FFC2] bg-[#00FFC2]/5 scale-105' : 'text-white/50 border-transparent hover:text-[#00FFC2]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em]">
                    <TextScramble text={name} trigger="hover" />
                  </span>
                </button>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      {/* Animated divider between categories and feed */}
      <SectionDivider label="// SECTION_02: LATEST_FEED" />

      {/* LATEST FEED */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <RevealOnScroll>
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">
              Latest <TextScramble text={activeCategory === 'all' ? 'Transmissions' : activeCategory} trigger="both" />
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 font-mono">
              // {filteredArticles.length} NODES_ACTIVE
            </span>
          </div>
        </RevealOnScroll>

        {filteredArticles.length === 0 ? (
          <RevealOnScroll>
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-[#080808]/40">
              <span className="text-xs font-bold uppercase tracking-widest text-white/30">
                No matching transmissions found on the network.
              </span>
            </div>
          </RevealOnScroll>
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

      {/* Animated divider before footer */}
      <SectionDivider label="// SECTION_03: NETWORK_STATUS" />

      {/* ═══════════════════════════════════════════════════════
          IMMERSIVE FOOTER — Igloo.inc-inspired
         ═══════════════════════════════════════════════════════ */}
      <footer className="relative bg-[#080808] border-t border-white/5 overflow-hidden">
        {/* Subtle radial glow behind the CTA */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none" 
             style={{ background: 'radial-gradient(circle, rgba(0,255,194,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        {/* Large CTA */}
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 text-center">
          <StaggerLetters
            text="STAY_SYNCED."
            className="font-mono text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none text-white select-none overflow-hidden"
          />
          <RevealOnScroll delay={400}>
            <p className="mt-6 text-sm text-white/40 max-w-lg mx-auto font-mono">
              New transmissions are automatically parsed and cataloged across the network. 
              Real-time intelligence, zero latency.
            </p>
          </RevealOnScroll>
        </div>

        {/* Neon horizontal rule */}
        <div className="max-w-7xl mx-auto px-6">
          <RevealOnScroll>
            <div className="h-px w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00FFC2]/40 to-transparent section-line-animate" />
            </div>
          </RevealOnScroll>
        </div>

        {/* 3-Column Grid */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {/* Column 1: Navigation */}
            <RevealOnScroll delay={100}>
              <div>
                <h4 className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-white/20 mb-6">
                  // Navigation
                </h4>
                <ul className="space-y-3">
                  {['Network', 'Articles', 'DevOps', 'K8s', 'AI/ML', 'Cyber SOC'].map((item) => (
                    <li key={item}>
                      <Link 
                        href={item === 'Network' ? '/' : item === 'Articles' ? '/articles' : `/?category=${item}`}
                        className="text-[11px] font-mono uppercase tracking-[0.15em] text-white/40 hover:text-[#00FFC2] transition-colors duration-200"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>

            {/* Column 2: Categories */}
            <RevealOnScroll delay={200}>
              <div>
                <h4 className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-white/20 mb-6">
                  // Feed Categories
                </h4>
                <div className="space-y-3">
                  {categories.map(({ name, icon: Icon }) => (
                    <Link 
                      key={name} 
                      href={`/?category=${name}`}
                      className="flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.15em] text-white/40 hover:text-[#00FFC2] transition-colors duration-200"
                    >
                      <Icon className="w-3 h-3" />
                      {name}
                    </Link>
                  ))}
                </div>
              </div>
            </RevealOnScroll>

            {/* Column 3: Status */}
            <RevealOnScroll delay={300}>
              <div>
                <h4 className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-white/20 mb-6">
                  // System Status
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-pulse" />
                    <span className="text-[11px] font-mono text-white/50">AI Aggregator: <span className="text-[#00FFC2]">Online</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-pulse" />
                    <span className="text-[11px] font-mono text-white/50">Feed Parser: <span className="text-[#00FFC2]">Active</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4FC3F7]" />
                    <span className="text-[11px] font-mono text-white/50">Build: <span className="text-white/30">v2.1.0</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4FC3F7]" />
                    <span className="text-[11px] font-mono text-white/50">Protocol: <span className="text-white/30">TLS 1.3</span></span>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
            <span className="text-[9px] font-mono text-white/15 uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} TECH_SYNC. All rights reserved.
            </span>
            <span className="text-[9px] font-mono text-white/15 uppercase tracking-[0.2em]">
              Secured via encrypted agent mesh
            </span>
          </div>
        </div>
      </footer>

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
