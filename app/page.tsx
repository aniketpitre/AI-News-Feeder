"use client";

import {
  useRef, useState, useEffect, useMemo,
  useCallback, Suspense,
} from 'react';
import dynamic from 'next/dynamic';
import {
  ArrowRight, Cpu, Shield, Container,
  Brain, ArrowUpRight, Activity,
} from 'lucide-react';
import { TextScramble }               from '@/components/ui/TextScramble';
import { ArticlePanel, ArticlePanelData } from '@/components/ui/ArticlePanel';
import { RevealOnScroll }             from '@/components/ui/RevealOnScroll';
import { Preloader }                  from '@/components/Preloader';
import { WAYPOINTS }                  from '@/components/IcebergScene';
import { WaypointDrawer }             from '@/components/WaypointDrawer';
import { WaypointChime }              from '@/components/WaypointChime';
import { HeroStats }                  from '@/components/HeroStats';
import { MetricsMarquee }             from '@/components/MetricsMarquee';
import { NetworkGraph }               from '@/components/NetworkGraph';
import { useWaypointSnap }            from '@/hooks/use-waypoint-snap';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db }                         from '@/lib/firebase';
import { mockArticles }               from '@/lib/mock-articles';
import { useRouter, useSearchParams } from 'next/navigation';
import { normalizeTopic }             from '@/lib/normalize-topic';
import Link                           from 'next/link';
import { SystemControlCenter }        from '@/components/SystemControlCenter';

const IcebergScene = dynamic(() => import('@/components/IcebergScene'), { ssr: false });

/* ─── Data ───────────────────────────────────────────────────────────────── */
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
  'hero':      '#00FFC2',
  'footer':    '#ffffff',
  'General':   '#aaaaaa',
};

const SECTION_NUMBERS: Record<string, string> = {
  'DevOps': '01', 'K8s': '02', 'AI/ML': '03', 'Cyber SOC': '04',
};

/* ─── Section atmosphere ─────────────────────────────────────────────────────
   A fixed radial glow behind everything whose color + position smoothly
   transitions as the user scrolls through each waypoint section.
   Driven by IntersectionObserver — no scroll listeners, no jank.
   ─────────────────────────────────────────────────────────────────────────── */
function SectionAtmosphere() {
  const glowRef   = useRef<HTMLDivElement>(null!);
  const colorRef  = useRef('#00FFC2');
  const targetRef = useRef('#00FFC2');
  const rafRef    = useRef<number>();

  useEffect(() => {
    // Smoothly lerp the color string between hex values
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

    let currentRgb = hexToRgb(colorRef.current);

    const animate = () => {
      const targetRgb = hexToRgb(targetRef.current);
      currentRgb = currentRgb.map((c, i) => c + (targetRgb[i] - c) * 0.035) as [number, number, number];
      const hex = rgbToHex(...(currentRgb as [number, number, number]));
      colorRef.current = hex;

      if (glowRef.current) {
        glowRef.current.style.background =
          `radial-gradient(ellipse 70% 55% at 50% 48%, ${hex}0c 0%, transparent 72%)`;
        glowRef.current.style.setProperty('--atm-color', hex);
        document.documentElement.style.setProperty('--atm-color', hex);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    const io = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the highest ratio
        const top = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!top) return;
        const key = (top.target as HTMLElement).dataset.waypointKey || 'hero';
        targetRef.current = CATEGORY_COLORS[key] || '#00FFC2';
      },
      { threshold: [0.1, 0.3, 0.5, 0.7] }
    );

    // Observe after a tick so elements are mounted
    const t = setTimeout(() => {
      document.querySelectorAll('[data-waypoint-section]').forEach(el => io.observe(el));
    }, 300);

    return () => {
      cancelAnimationFrame(rafRef.current!);
      io.disconnect();
      clearTimeout(t);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="fixed inset-0 z-0 pointer-events-none transition-none"
      style={{
        background: 'radial-gradient(ellipse 70% 55% at 50% 48%, #00FFC20c 0%, transparent 72%)',
      }}
    />
  );
}

/* ─── Premium glass article card ─────────────────────────────────────────────
   Tilt on hover, cursor spotlight, gradient left accent bar, category color.
   ─────────────────────────────────────────────────────────────────────────── */
function GlassArticleCard({
  article, color, onClick,
}: {
  article: any; color: string; onClick: () => void;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [coords,  setCoords]  = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>();

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = cardRef.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const x    = e.clientX - rect.left;
      const y    = e.clientY - rect.top;
      setCoords({ x, y });
      const rx = -((y - rect.height / 2) / rect.height) * 7;
      const ry =  ((x - rect.width  / 2) / rect.width)  * 7;
      el.style.setProperty('--rx', `${rx}deg`);
      el.style.setProperty('--ry', `${ry}deg`);
    });
  };

  const handleLeave = () => {
    setHovered(false);
    const el = cardRef.current;
    if (el) { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); }
  };

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      onMouseMove={handleMouseMove}
      className="w-full text-left group relative flex items-center justify-between gap-4 px-5 py-4 rounded-2xl overflow-hidden"
      style={{
        background:     'rgba(6, 8, 16, 0.7)',
        border:         `1px solid ${hovered ? color + '40' : 'rgba(255,255,255,0.07)'}`,
        backdropFilter: 'blur(20px)',
        boxShadow:      hovered
          ? `0 0 0 1px ${color}20, 0 0 32px ${color}14, 0 12px 40px rgba(0,0,0,0.5)`
          : '0 2px 16px rgba(0,0,0,0.3)',
        transform: `perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))`,
        transition: hovered
          ? 'border-color 0.2s, box-shadow 0.2s'
          : 'border-color 0.4s, box-shadow 0.4s, transform 0.55s cubic-bezier(0.16,1,0.3,1)',
        '--rx': '0deg', '--ry': '0deg',
      } as React.CSSProperties}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-all duration-300"
        style={{ background: `linear-gradient(to bottom, ${color}, ${color}55)`, opacity: hovered ? 1 : 0.4 }} />

      {/* Cursor spotlight */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity:    hovered ? 1 : 0,
          background: `radial-gradient(180px circle at ${coords.x}px ${coords.y}px, ${color}12, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div className="min-w-0 pl-3 relative z-10 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[8px] font-mono text-white/25 uppercase tracking-widest">{article.date}</span>
        </div>
        <h3
          className="text-sm sm:text-[15px] font-bold leading-snug truncate transition-colors duration-200"
          style={{ color: hovered ? color : 'rgba(255,255,255,0.88)' }}
        >
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-[11px] text-white/30 mt-1 line-clamp-1 leading-relaxed">
            {article.excerpt}
          </p>
        )}
      </div>

      <ArrowUpRight
        className="w-4 h-4 shrink-0 relative z-10 transition-all duration-300"
        style={{ color, transform: hovered ? 'translate(2px,-2px)' : 'translate(0,0)', opacity: hovered ? 1 : 0.5 }}
      />
    </button>
  );
}

/* ─── Waypoint sections ──────────────────────────────────────────────────── */
function WaypointSection({
  index, waypoint, articles, onOpenArticle,
}: {
  index: number;
  waypoint: typeof WAYPOINTS[number];
  articles: any[];
  onOpenArticle: (a: any) => void;
}) {
  const isHero   = waypoint.key === 'hero';
  const isFooter = waypoint.key === 'footer';
  const Icon     = CATEGORY_ICONS[waypoint.key];
  const color    = CATEGORY_COLORS[waypoint.key] || '#00FFC2';
  const ghostNum = SECTION_NUMBERS[waypoint.key];

  /* ── Hero ── */
  if (isHero) {
    return (
      <section
        data-waypoint-section
        data-waypoint-key="hero"
        className="relative w-full h-[100vh] min-h-[640px] flex flex-col items-center justify-center px-6 text-center overflow-hidden"
      >
        {/* Floating stat chips */}
        <HeroStats />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0,255,194,0.6) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
          }}
        />

        {/* Corner frame decorations */}
        <div className="absolute top-8 left-8 w-8 h-8 border-t border-l border-[#00FFC2]/20 pointer-events-none" />
        <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-[#00FFC2]/20 pointer-events-none" />
        <div className="absolute bottom-8 left-8 w-8 h-8 border-b border-l border-[#00FFC2]/20 pointer-events-none" />
        <div className="absolute bottom-8 right-8 w-8 h-8 border-b border-r border-[#00FFC2]/20 pointer-events-none" />

        <div className="pointer-events-none flex flex-col items-center relative z-10">
          {/* Tag */}
          <div style={{ opacity: 0, animation: 'heroTextReveal 0.8s cubic-bezier(0.16,1,0.3,1) 1.8s forwards' }}>
            <span className="mb-5 inline-flex items-center gap-2 bg-[#00FFC2]/8 border border-[#00FFC2]/20 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#00FFC2] backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-[#00FFC2] rounded-full animate-pulse" />
              Live Network Feed Active
            </span>
          </div>

          {/* Main heading with gradient highlight */}
          <div style={{ opacity: 0, animation: 'heroTextReveal 0.9s cubic-bezier(0.16,1,0.3,1) 2.05s forwards' }}>
            <h1 className="font-mono font-black tracking-tighter leading-[0.9] select-none"
              style={{ fontSize: 'clamp(52px, 10vw, 120px)' }}>
              <span className="text-white">TECH_</span>
              <span className="text-gradient-teal">
                <TextScramble text="SYNC" trigger="both" />
              </span>
              <span style={{ color: '#00FFC2', textShadow: '0 0 30px rgba(0,255,194,0.6)' }}>.</span>
            </h1>
          </div>

          {/* Subtitle */}
          <div style={{ opacity: 0, animation: 'heroTextReveal 0.8s cubic-bezier(0.16,1,0.3,1) 2.35s forwards' }}>
            <p className="mt-6 max-w-2xl text-xs sm:text-sm text-white/40 uppercase tracking-[0.2em] font-medium leading-relaxed">
              Signal from the edge —&nbsp;
              <span style={{ color: '#4FC3F7' }}>DevOps</span>,&nbsp;
              <span style={{ color: '#00FFC2' }}>Kubernetes</span>,&nbsp;
              <span style={{ color: '#CE93D8' }}>AI/ML</span>&nbsp;&amp;&nbsp;
              <span style={{ color: '#FF8A65' }}>Cyber Security</span>,
              curated in real time.
            </p>
          </div>

          {/* CTA row */}
          <div style={{ opacity: 0, animation: 'heroTextReveal 0.8s cubic-bezier(0.16,1,0.3,1) 2.7s forwards' }}>
            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/articles"
                className="pointer-events-auto inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-black transition-all hover:brightness-110 active:scale-95"
                style={{ background: '#00FFC2', boxShadow: '0 0 24px rgba(0,255,194,0.3)' }}
              >
                Explore Transmissions <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 animate-bounce">
                Scroll <ArrowRight className="w-3 h-3 rotate-90" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ── Footer ── */
  if (isFooter) {
    return (
      <footer
        data-waypoint-section
        data-waypoint-key="footer"
        className="relative w-full min-h-[100vh] flex flex-col items-center justify-center px-6 py-20 text-center overflow-hidden"
      >
        {/* Network graph background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
          <NetworkGraph />
        </div>

        {/* Radial mask so text stays legible */}
        <div className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 15%, rgba(5,5,5,0.9) 70%)' }} />

        {/* Horizontal gradient lines — igloo aesthetic */}
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(to right, transparent, rgba(0,255,194,0.2), transparent)' }} />

        <div className="relative z-10 w-full max-w-5xl mx-auto mb-16 text-left">
          <SystemControlCenter />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <RevealOnScroll>
            <span className="text-[10px] font-mono text-[#00FFC2]/50 uppercase tracking-[0.3em] mb-4 block">
              // END_OF_FEED
            </span>
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <h2
              className="font-mono font-black tracking-tighter leading-none text-white"
              style={{ fontSize: 'clamp(36px, 8vw, 96px)' }}
            >
              STAY_<span className="text-gradient-teal">SYNCED</span>
              <span style={{ color: '#00FFC2', textShadow: '0 0 24px rgba(0,255,194,0.5)' }}>.</span>
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={200}>
            <p className="mt-6 text-sm text-white/35 max-w-lg mx-auto font-mono leading-relaxed">
              New transmissions are automatically parsed and cataloged across the network.
              Real-time intelligence, zero latency.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={350}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-black transition-all hover:brightness-110"
                style={{ background: '#00FFC2', boxShadow: '0 0 28px rgba(0,255,194,0.25)' }}
              >
                View All Transmissions <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={500}>
            <div className="mt-16 flex flex-wrap items-center justify-center gap-6">
              {WAYPOINTS.slice(1, -1).map(w => (
                <Link
                  key={w.key}
                  href={`/?category=${w.key}`}
                  className="text-[10px] font-mono uppercase tracking-[0.2em] transition-colors hover:opacity-100 opacity-30"
                  style={{ color: CATEGORY_COLORS[w.key] || '#fff' }}
                >
                  {w.label}
                </Link>
              ))}
            </div>
          </RevealOnScroll>
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center z-10">
          <span className="text-[9px] font-mono text-white/12 uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} TECH_SYNC. All rights reserved.
          </span>
        </div>
      </footer>
    );
  }

  /* ── Category section ── */
  return (
    <section
      data-waypoint-section
      data-waypoint-key={waypoint.key}
      className="relative w-full min-h-[100vh] flex flex-col items-center justify-center px-6 py-24 overflow-hidden"
    >
      {/* Giant ghost section number — igloo-style background typography */}
      {ghostNum && (
        <span className="ghost-num" style={{ color }}>
          {ghostNum}
        </span>
      )}

      {/* Subtle radial glow behind this section's content */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${color}07 0%, transparent 70%)`,
        }}
      />

      {/* Top horizontal rule in category color */}
      <div
        className="absolute top-0 left-1/4 right-1/4 h-px pointer-events-none"
        style={{ background: `linear-gradient(to right, transparent, ${color}30, transparent)` }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-3xl">

        <RevealOnScroll className="text-center mb-2" direction="up">
          <span
            className="text-[10px] font-mono font-black uppercase tracking-[0.35em]"
            style={{ color: `${color}80` }}
          >
            // Section_{ghostNum || String(index).padStart(2,'0')}
          </span>
        </RevealOnScroll>

        <RevealOnScroll delay={100} direction="up">
          <div className="flex items-center gap-4 mb-2">
            {Icon && (
              <div
                className="p-2.5 rounded-xl"
                style={{ background: `${color}12`, border: `1px solid ${color}25` }}
              >
                <Icon className="w-7 h-7" style={{ color }} />
              </div>
            )}
            <h2
              className="font-mono font-black tracking-tighter text-white"
              style={{ fontSize: 'clamp(36px, 7vw, 82px)' }}
            >
              <TextScramble text={waypoint.label} trigger="both" />
            </h2>
          </div>
        </RevealOnScroll>

        {/* Spacer so crystal remains focal */}
        <div className="h-[25vh] sm:h-[30vh]" />

        {/* Articles */}
        {articles.length > 0 ? (
          <div className="w-full flex flex-col gap-3">
            {articles.slice(0, 3).map((article, i) => (
              <RevealOnScroll key={article.id || i} delay={i * 100} direction={i % 2 === 0 ? 'left' : 'right'}>
                <GlassArticleCard
                  article={article}
                  color={color}
                  onClick={() => onOpenArticle(article)}
                />
              </RevealOnScroll>
            ))}
          </div>
        ) : (
          <RevealOnScroll>
            <div
              className="w-full text-center py-7 px-8 rounded-2xl border border-dashed"
              style={{ borderColor: `${color}20`, background: `${color}05` }}
            >
              <Activity className="w-5 h-5 mx-auto mb-2 opacity-20" style={{ color }} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                No transmissions yet in this sector
              </span>
            </div>
          </RevealOnScroll>
        )}

        {articles.length > 0 && (
          <RevealOnScroll delay={350}>
            <Link
              href={`/articles?category=${waypoint.key}`}
              className="mt-8 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group transition-all"
              style={{ color }}
            >
              View all {waypoint.label} transmissions
              <ArrowUpRight
                className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </RevealOnScroll>
        )}
      </div>
    </section>
  );
}

/* ─── Home page ──────────────────────────────────────────────────────────── */
function HomeContent() {
  const [articles,  setArticles] = useState<any[]>(mockArticles);
  const [selected,  setSelected] = useState<ArticlePanelData | null>(null);
  useSearchParams(); // keep for future category routing

  // Prevent browser scroll restoration from landing mid-page
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, 'articles'), where('status', '==', 'published')));
        if (!snap.empty) {
          const data = snap.docs.map(doc => {
            const d = doc.data();
            return {
              id:          doc.id,
              category:    normalizeTopic(d.topics || [], d.sourceName || d.category || ''),
              title:       d.title || '',
              excerpt:     d.summary || d.content?.substring(0, 140) + '...' || '',
              date:        d.publishedAt
                ? new Date(d.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : d.date || 'TBD',
              url:         d.url || '',
              topics:      d.topics || [],
              publishedAt: d.publishedAt || Date.now(),
            };
          });
          data.sort((a: any, b: any) => b.publishedAt - a.publishedAt);
          setArticles(data);
        }
      } catch (e) { console.error('Firestore fallback to mock:', e); }
    }
    load();
  }, []);

  const articlesByCategory = useCallback(
    (cat: string) => articles.filter(a => a.category.toLowerCase() === cat.toLowerCase()),
    [articles]
  );

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

      {/* Section-reactive ambient glow — shifts color per waypoint */}
      <SectionAtmosphere />

      {/* Fixed 3D shard */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <IcebergScene />
      </div>

      {/* Decorative vertical gridlines */}
      <div className="fixed inset-y-0 left-6 md:left-14 w-px bg-white/[0.035] z-10 pointer-events-none" />
      <div className="fixed inset-y-0 right-6 md:right-14 w-px bg-white/[0.035] z-10 pointer-events-none" />

      {/* Bottom fade */}
      <div className="fixed bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#020305] to-transparent z-[1] pointer-events-none" />

      <WaypointDrawer />
      <WaypointChime />

      <div className="relative z-10">
        {WAYPOINTS.map((wp, i) => {
          const sectionEl = (
            <WaypointSection
              key={wp.key}
              index={i}
              waypoint={wp}
              articles={wp.key === 'hero' || wp.key === 'footer' ? [] : articlesByCategory(wp.key)}
              onOpenArticle={a => setSelected({
                id: a.id, title: a.title, category: a.category,
                date: a.date, excerpt: a.excerpt, url: a.url,
                topics: a.topics, content: a.content,
              })}
            />
          );

          // MetricsMarquee between hero and first category
          if (i === 1) {
            return (
              <div key={wp.key}>
                <MetricsMarquee counts={counts} />
                {sectionEl}
              </div>
            );
          }

          return sectionEl;
        })}
      </div>

      <ArticlePanel article={selected} onClose={() => setSelected(null)} />
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
