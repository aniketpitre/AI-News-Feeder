"use client";

import { useRef, useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight, Cpu, Shield, Container, Brain, ArrowUpRight } from 'lucide-react';
import { TextScramble } from '@/components/ui/TextScramble';
import { ArticlePanel, ArticlePanelData } from '@/components/ui/ArticlePanel';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { Preloader } from '@/components/Preloader';
import { WAYPOINTS } from '@/components/IcebergScene';
import { WaypointDrawer } from '@/components/WaypointDrawer';
import { WaypointChime } from '@/components/WaypointChime';
import { useWaypointSnap } from '@/hooks/use-waypoint-snap';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mockArticles } from '@/lib/mock-articles';
import { useRouter, useSearchParams } from 'next/navigation';
import { normalizeTopic } from '@/lib/normalize-topic';
import Link from 'next/link';

// IcebergScene is heavy (WebGL); load client-only, no SSR
const IcebergScene = dynamic(() => import('@/components/IcebergScene'), { ssr: false });

const CATEGORY_ICONS: Record<string, any> = {
  'DevOps': Container,
  'K8s': Cpu,
  'AI/ML': Brain,
  'Cyber SOC': Shield,
};

/* ───────────────────────────────────────────────────────────
   Waypoint section — pinned-feel container the shard "lives
   inside" while this section is in view. Igloo reveals one
   project per shard stop; we reveal one category + its top
   articles per shard stop.
   ─────────────────────────────────────────────────────────── */
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
  const isHero = waypoint.key === 'hero';
  const isFooter = waypoint.key === 'footer';
  const Icon = CATEGORY_ICONS[waypoint.key];

  if (isHero) {
    return (
      <section data-waypoint-section className="relative w-full h-[100vh] min-h-[640px] flex flex-col items-center justify-center px-6 text-center pointer-events-none">
        <RevealOnScroll delay={200}>
          <span className="mb-4 inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#00FFC2] backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-[#00FFC2] rounded-full animate-pulse" />
            Live Network Feed
          </span>
        </RevealOnScroll>
        <RevealOnScroll delay={400}>
          <h1 className="font-mono text-4xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.95] select-none text-white">
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
            Scroll to descend <ArrowRight className="w-3 h-3 rotate-90" />
          </div>
        </RevealOnScroll>
      </section>
    );
  }

  if (isFooter) {
    return (
      <footer data-waypoint-section className="relative w-full min-h-[100vh] flex flex-col items-center justify-center px-6 text-center">
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
            <Link href="/articles" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#00FFC2]/30 text-[10px] font-black uppercase tracking-widest text-[#00FFC2] hover:bg-[#00FFC2]/5 transition-all">
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

        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center">
          <span className="text-[9px] font-mono text-white/15 uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} TECH_SYNC. All rights reserved.
          </span>
        </div>
      </footer>
    );
  }

  // Category waypoint — crystal occupies center stage, top 3 articles reveal beside it
  return (
    <section data-waypoint-section className="relative w-full min-h-[100vh] flex flex-col items-center justify-center px-6 py-24">
      <RevealOnScroll className="text-center mb-2" direction="up">
        <span
          className="text-[10px] font-mono font-black uppercase tracking-[0.3em]"
          style={{ color: waypoint.color }}
        >
          // Section_{String(index).padStart(2, '0')}
        </span>
      </RevealOnScroll>

      <RevealOnScroll delay={150} direction="up">
        <div className="flex items-center gap-3 mb-3">
          {Icon && <Icon className="w-7 h-7 sm:w-9 sm:h-9" style={{ color: waypoint.color }} />}
          <h2 className="font-mono text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white">
            <TextScramble text={waypoint.label} trigger="both" />
          </h2>
        </div>
      </RevealOnScroll>

      {/* Spacer so the crystal (fixed behind) has room to be the focal point */}
      <div className="h-[28vh] sm:h-[34vh]" />

      {/* Top articles for this category — minimal, igloo-style reveal not a grid wall */}
      {articles.length > 0 && (
        <div className="w-full max-w-3xl flex flex-col gap-3">
          {articles.slice(0, 3).map((article, i) => (
            <RevealOnScroll key={article.id || i} delay={i * 120} direction={i % 2 === 0 ? 'left' : 'right'}>
              <button
                onClick={() => onOpenArticle(article)}
                className="w-full text-left group flex items-center justify-between gap-4 px-5 py-4 rounded-xl border transition-all duration-300 backdrop-blur-md"
                style={{
                  background: 'rgba(5,7,14,0.55)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${waypoint.color}50`; e.currentTarget.style.boxShadow = `0 0 28px ${waypoint.color}20`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="min-w-0">
                  <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{article.date}</span>
                  <h3 className="text-sm sm:text-base font-bold text-white/90 leading-snug mt-1 truncate group-hover:text-white transition-colors">
                    {article.title}
                  </h3>
                </div>
                <ArrowUpRight
                  className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                  style={{ color: waypoint.color }}
                />
              </button>
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
            style={{ color: waypoint.color }}
          >
            View all {waypoint.label} transmissions <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </RevealOnScroll>
      )}
    </section>
  );
}

function HomeContent() {
  const [articles, setArticles] = useState<any[]>(mockArticles);
  const [selectedArticle, setSelectedArticle] = useState<ArticlePanelData | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const articlesByCategory = (catKey: string) =>
    articles.filter(a => a.category.toLowerCase() === catKey.toLowerCase());

  // igloo-style eased scroll-to-waypoint after the user pauses scrolling
  useWaypointSnap({ sectionCount: WAYPOINTS.length, enabled: true });

  return (
    <div className="w-full relative">
      <Preloader />

      {/* ── Persistent fixed 3D shard — stays mounted across the whole scroll journey ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <IcebergScene />
      </div>

      {/* Decorative vertical gridlines, igloo-style framing */}
      <div className="fixed inset-y-0 left-6 md:left-12 lg:left-20 w-px bg-white/[0.04] z-10 pointer-events-none" />
      <div className="fixed inset-y-0 right-6 md:right-12 lg:right-20 w-px bg-white/[0.04] z-10 pointer-events-none" />

      {/* Bottom fade so content stays legible over the 3D scene */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#020305] to-transparent z-[1] pointer-events-none" />

      {/* Persistent breadcrumb trail — igloo-style waypoint indicator */}
      <WaypointDrawer />

      {/* Ambient chime toggle — igloo-style multisensory waypoint cues */}
      <WaypointChime />

      {/* ── Scroll-driven waypoint sections ── */}
      <div className="relative z-10">
        {WAYPOINTS.map((wp, i) => (
          <WaypointSection
            key={wp.key}
            index={i}
            waypoint={wp}
            articles={wp.key === 'hero' || wp.key === 'footer' ? [] : articlesByCategory(wp.key)}
            onOpenArticle={(article) => setSelectedArticle({
              id: article.id,
              title: article.title,
              category: article.category,
              date: article.date,
              excerpt: article.excerpt,
              url: article.url,
              topics: article.topics,
              content: article.content,
            })}
          />
        ))}
      </div>

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
