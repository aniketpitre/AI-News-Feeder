"use client";

import { useRef, useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight, Cpu, Shield, Container, Brain, ArrowUpRight } from 'lucide-react';
import { TextScramble }                                from '@/components/ui/TextScramble';
import { ArticlePanel, ArticlePanelData }              from '@/components/ui/ArticlePanel';
import { RevealOnScroll }                              from '@/components/ui/RevealOnScroll';
import { Preloader }                                   from '@/components/Preloader';
import { WAYPOINTS }                                   from '@/components/IcebergScene';
import { WaypointDrawer }                              from '@/components/WaypointDrawer';
import { WaypointChime }                               from '@/components/WaypointChime';
import { HeroStats }                                   from '@/components/HeroStats';
import { MetricsMarquee }                              from '@/components/MetricsMarquee';
import { NetworkGraph }                                from '@/components/NetworkGraph';
import { useWaypointSnap }                             from '@/hooks/use-waypoint-snap';
import { collection, getDocs, query, where }          from 'firebase/firestore';
import { db }                                         from '@/lib/firebase';
import { mockArticles }                               from '@/lib/mock-articles';
import { useRouter, useSearchParams }                  from 'next/navigation';
import { normalizeTopic }                              from '@/lib/normalize-topic';
import Link                                           from 'next/link';
import { SystemControlCenter }                        from '@/components/SystemControlCenter';

const IcebergScene = dynamic(() => import('@/components/IcebergScene'), { ssr: false });

const CATEGORY_ICONS: Record<string, any> = {
  'DevOps':    Container,
  'K8s':       Cpu,
  'AI/ML':     Brain,
  'Cyber SOC': Shield,
};

const CATEGORY_COLORS: Record<string, string> = {
  'DevOps':    '#4FC3F7',
  'K8s':       '#00FFC2',
  'AI/ML':     '#CE93D8',
  'Cyber SOC': '#FF8A65',
  'General':   '#aaaaaa',
};

/* ─── Premium glass article card ─────────────────────────────────────────────
   Used inside WaypointSection for each category's top articles.
   Cursor spotlight + tilt-on-hover, matching the articles page DNA.
   ─────────────────────────────────────────────────────────────────────────── */
function GlassArticleCard({
  article,
  color,
  onClick,
}: {
  article: any;
  color: string;
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [coords,  setCoords]  = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect    = el.getBoundingClientRect();
    const x       = e.clientX - rect.left;
    const y       = e.clientY - rect.top;
    setCoords({ x, y });
    const cx  = rect.width / 2;
    const cy  = rect.height / 2;
    const rx  = -((y - cy) / cy) * 6;
    const ry  =  ((x - cx) / cx) * 6;
    el.style.setProperty('--rx', `${rx}deg`);
    el.style.setProperty('--ry', `${ry}deg`);
  };

  const handleLeave = () => {
    setHovered(false);
    const el = cardRef.current;
    if (el) {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    }
  };

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      onMouseMove={handleMouseMove}
      className="w-full text-left group relative flex items-center justify-between gap-4 px-5 py-4 rounded-xl overflow-hidden"
      style={{
        background:    'var(--glass-bg)',
        border:        `1px solid ${hovered ? color + '45' : 'var(--glass-border)'}`,
        backdropFilter:'blur(var(--glass-blur))',
        boxShadow:     hovered ? `0 0 28px ${color}18, 0 8px 32px rgba(0,0,0,0.4)` : '0 2px 12px rgba(0,0,0,0.3)',
        transform: `perspective(800px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))`,
        transition: hovered
          ? 'border-color 0.2s ease, box-shadow 0.2s ease'
          : 'border-color 0.4s ease, box-shadow 0.4s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)',
        '--rx': '0deg',
        '--ry': '0deg',
      } as React.CSSProperties}
    >
      {/* Left accent bar in category color */}
      <div
        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-opacity duration-300"
        style={{ background: color, opacity: hovered ? 1 : 0.35 }}
      />

      {/* Cursor spotlight */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity:    hovered ? 1 : 0,
          background: `radial-gradient(160px circle at ${coords.x}px ${coords.y}px, ${color}14, transparent 70%)`,
        }}
      />

      <div className="min-w-0 pl-2 relative z-10">
        <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{article.date}</span>
        <h3 className="text-sm sm:text-base font-bold text-white/90 leading-snug mt-0.5 truncate transition-colors duration-200"
          style={{ color: hovered ? color : 'rgba(255,255,255,0.9)' }}>
          {article.title}
        </h3>
      </div>

      <ArrowUpRight
        className="w-4 h-4 shrink-0 relative z-10 transition-all duration-300"
        style={{
          color:     color,
          transform: hovered ? 'translate(2px, -2px)' : 'translate(0,0)',
        }}
      />
    </button>
  );
}

/* ─── Waypoint section ────────────────────────────────────────────────────── */
function WaypointSection({
  index,
  waypoint,
  articles,
  onOpenArticle,
}: {
  index: number;
  waypoint: typeof WAYPOINTS[number];
  articles: any[];
  onOpenArticle: (a: any) => void;
}) {
  const isHero   = waypoint.key === 'hero';
  const isFooter = waypoint.key === 'footer';
  const Icon     = CATEGORY_ICONS[waypoint.key];

  /* ── Hero ── */
  if (isHero) {
    return (
      <section
        data-waypoint-section
        className="relative w-full h-[100vh] min-h-[640px] flex flex-col items-center justify-center px-6 text-center"
      >
        {/* Floating stat chips (pointer-events re-enabled just for this div) */}
        <HeroStats />

        <div className="pointer-events-none flex flex-col items-center">
          <div style={{ opacity: 0, transform: 'translateY(20px)', animation: 'heroTextReveal 0.8s cubic-bezier(0.16,1,0.3,1) 1.8s forwards' }}>
            <span className="mb-4 inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#00FFC2] backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-[#00FFC2] rounded-full animate-pulse" />
              Live Network Feed
            </span>
          </div>
          <div style={{ opacity: 0, transform: 'translateY(20px)', animation: 'heroTextReveal 0.8s cubic-bezier(0.16,1,0.3,1) 2.1s forwards' }}>
            <h1 className="font-mono text-4xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.95] select-none text-white">
              <TextScramble text="TECH_SYNC" trigger="both" />
              <span className="text-[#00FFC2]">.</span>
            </h1>
          </div>
          <div style={{ opacity: 0, transform: 'translateY(20px)', animation: 'heroTextReveal 0.8s cubic-bezier(0.16,1,0.3,1) 2.4s forwards' }}>
            <p className="mt-6 max-w-xl text-xs sm:text-sm md:text-base text-white/50 uppercase tracking-widest font-medium">
              Signal from the edge — DevOps, Kubernetes, AI/ML &amp; Cyber Security, curated in real time.
            </p>
          </div>
          <div style={{ opacity: 0, transform: 'translateY(20px)', animation: 'heroTextReveal 0.8s cubic-bezier(0.16,1,0.3,1) 2.8s forwards' }}>
            <div className="mt-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 animate-bounce">
              Scroll to descend <ArrowRight className="w-3 h-3 rotate-90" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ── Footer ── */
  if (isFooter) {
    return (
      <footer data-waypoint-section className="relative w-full min-h-[100vh] flex flex-col items-center justify-center px-6 py-20 text-center overflow-hidden">
        {/* Network graph background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-35">
          <NetworkGraph />
        </div>

        {/* Gradient overlay so text stays readable over the graph */}
        <div className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 20%, rgba(5,5,5,0.85) 75%)' }} />

        {/* System Control Center */}
        <div className="relative z-10 w-full max-w-5xl mx-auto mb-16 text-left">
          <SystemControlCenter />
        </div>

        <div className="relative z-10">
          <RevealOnScroll>
            <h2 className="font-mono text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-none text-white">
              STAY_SYNCED<span className="text-[#00FFC2]">.</span>
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <p className="mt-6 text-sm text-white/40 max-w-lg mx-auto font-mono">
              New transmissions are automatically parsed and cataloged across the network.
              Real-time intelligence, zero latency.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={400}>
            <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#00FFC2]/30 text-[10px] font-black uppercase tracking-widest text-[#00FFC2] hover:bg-[#00FFC2]/5 transition-all"
              >
                View All Transmissions <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={600}>
            <div className="mt-20 flex flex-wrap items-center justify-center gap-8 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">
              {WAYPOINTS.slice(1, -1).map(w => (
                <Link key={w.key} href={`/?category=${w.key}`} className="hover:text-[#00FFC2] transition-colors">
                  {w.label}
                </Link>
              ))}
            </div>
          </RevealOnScroll>
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center z-10">
          <span className="text-[9px] font-mono text-white/15 uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} TECH_SYNC. All rights reserved.
          </span>
        </div>
      </footer>
    );
  }

  /* ── Category waypoint ── */
  const color = CATEGORY_COLORS[waypoint.key] || '#00FFC2';

  return (
    <section data-waypoint-section className="relative w-full min-h-[100vh] flex flex-col items-center justify-center px-6 py-24">
      <RevealOnScroll className="text-center mb-2" direction="up">
        <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em]" style={{ color }}>
          // Section_{String(index).padStart(2, '0')}
        </span>
      </RevealOnScroll>

      <RevealOnScroll delay={150} direction="up">
        <div className="flex items-center gap-3 mb-3">
          {Icon && <Icon className="w-7 h-7 sm:w-9 sm:h-9" style={{ color }} />}
          <h2 className="font-mono text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white">
            <TextScramble text={waypoint.label} trigger="both" />
          </h2>
        </div>
      </RevealOnScroll>

      <div className="h-[28vh] sm:h-[34vh]" />

      {articles.length > 0 && (
        <div className="w-full max-w-3xl flex flex-col gap-3">
          {articles.slice(0, 3).map((article, i) => (
            <RevealOnScroll key={article.id || i} delay={i * 120} direction={i % 2 === 0 ? 'left' : 'right'}>
              <GlassArticleCard
                article={article}
                color={color}
                onClick={() => onOpenArticle(article)}
              />
            </RevealOnScroll>
          ))}
        </div>
      )}

      {articles.length === 0 && (
        <RevealOnScroll>
          <div className="text-center py-6 px-8 border border-dashed border-white/10 rounded-2xl bg-[#080808]/40">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">
              No transmissions yet in this sector
            </span>
          </div>
        </RevealOnScroll>
      )}

      {articles.length > 0 && (
        <RevealOnScroll delay={400}>
          <Link
            href={`/articles?category=${waypoint.key}`}
            className="mt-8 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors"
            style={{ color }}
          >
            View all {waypoint.label} transmissions <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </RevealOnScroll>
      )}
    </section>
  );
}

/* ─── Home page ─────────────────────────────────────────────────────────── */
function HomeContent() {
  const [articles, setArticles]         = useState<any[]>(mockArticles);
  const [selectedArticle, setSelected]  = useState<ArticlePanelData | null>(null);
  const router      = useRouter();
  const searchParams = useSearchParams();

  // Prevent browser scroll restoration from landing mid-page on reload
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function fetchHomeArticles() {
      try {
        const snap = await getDocs(query(collection(db, 'articles'), where('status', '==', 'published')));
        if (!snap.empty) {
          const fetched = snap.docs.map(doc => {
            const data = doc.data();
            return {
              id:          doc.id,
              category:    normalizeTopic(data.topics || [], data.sourceName || data.category || ''),
              title:       data.title || '',
              excerpt:     data.summary || data.content?.substring(0, 150) + '...' || '',
              date:        data.publishedAt
                             ? new Date(data.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                             : data.date || 'TBD',
              url:         data.url || '',
              topics:      data.topics || [],
              publishedAt: data.publishedAt || (data.date ? new Date(data.date).getTime() : Date.now()),
            };
          });
          fetched.sort((a, b) => b.publishedAt - a.publishedAt);
          setArticles(fetched);
        }
      } catch (err) {
        console.error('Home Firestore query failed, using mock data', err);
      }
    }
    fetchHomeArticles();
  }, []);

  const articlesByCategory = useCallback(
    (catKey: string) => articles.filter(a => a.category.toLowerCase() === catKey.toLowerCase()),
    [articles]
  );

  // Live counts passed to MetricsMarquee
  const counts = useMemo(() => ({
    devops: articlesByCategory('DevOps').length,
    k8s:    articlesByCategory('K8s').length,
    aiml:   articlesByCategory('AI/ML').length,
    cyber:  articlesByCategory('Cyber SOC').length,
    total:  articles.length,
  }), [articles, articlesByCategory]);

  useWaypointSnap({ sectionCount: WAYPOINTS.length, enabled: true });

  return (
    <div className="w-full relative">
      <Preloader />

      {/* Fixed 3D shard */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <IcebergScene />
      </div>

      {/* Decorative vertical gridlines */}
      <div className="fixed inset-y-0 left-6 md:left-12 lg:left-20 w-px bg-white/[0.04] z-10 pointer-events-none" />
      <div className="fixed inset-y-0 right-6 md:right-12 lg:right-20 w-px bg-white/[0.04] z-10 pointer-events-none" />

      {/* Bottom fade */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#020305] to-transparent z-[1] pointer-events-none" />

      <WaypointDrawer />
      <WaypointChime />

      <div className="relative z-10">
        {WAYPOINTS.map((wp, i) => {
          const section = (
            <WaypointSection
              key={wp.key}
              index={i}
              waypoint={wp}
              articles={wp.key === 'hero' || wp.key === 'footer' ? [] : articlesByCategory(wp.key)}
              onOpenArticle={(article) => setSelected({
                id:       article.id,
                title:    article.title,
                category: article.category,
                date:     article.date,
                excerpt:  article.excerpt,
                url:      article.url,
                topics:   article.topics,
                content:  article.content,
              })}
            />
          );

          // Inject MetricsMarquee between hero (index 0) and first category (index 1)
          if (i === 1) {
            return (
              <div key={wp.key}>
                <MetricsMarquee counts={counts} />
                {section}
              </div>
            );
          }

          return section;
        })}
      </div>

      <ArticlePanel article={selectedArticle} onClose={() => setSelected(null)} />
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
