"use client";

import { useRef } from 'react';
import HeroCanvas from '@/components/HeroCanvas';
import { ArrowRight, Cpu, Shield, Container, Brain } from 'lucide-react';
import { TextScramble } from '@/components/ui/TextScramble';
import { InteractiveCard } from '@/components/ui/InteractiveCard';

const categories = [
  { name: 'DevOps', icon: Container },
  { name: 'K8s', icon: Cpu },
  { name: 'AI/ML', icon: Brain },
  { name: 'Cyber SOC', icon: Shield },
];

const placeholderArticles = [
  { category: 'AI/ML', title: 'Article headline goes here — placeholder', excerpt: 'Short summary text will appear here once articles are added manually.', date: 'TBD' },
  { category: 'K8s', title: 'Article headline goes here — placeholder', excerpt: 'Short summary text will appear here once articles are added manually.', date: 'TBD' },
  { category: 'Cyber SOC', title: 'Article headline goes here — placeholder', excerpt: 'Short summary text will appear here once articles are added manually.', date: 'TBD' },
  { category: 'DevOps', title: 'Article headline goes here — placeholder', excerpt: 'Short summary text will appear here once articles are added manually.', date: 'TBD' },
  { category: 'AI/ML', title: 'Article headline goes here — placeholder', excerpt: 'Short summary text will appear here once articles are added manually.', date: 'TBD' },
  { category: 'K8s', title: 'Article headline goes here — placeholder', excerpt: 'Short summary text will appear here once articles are added manually.', date: 'TBD' },
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--mx', `${x}%`);
    el.style.setProperty('--my', `${y}%`);
  };

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

        {/* cursor-follow glow */}
        <div
          className="pointer-events-none absolute inset-0 z-[5] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              'radial-gradient(400px circle at var(--mx) var(--my), rgba(0,255,194,0.12), transparent 70%)',
          }}
        />

        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050505] to-transparent z-10" />

        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 text-center pointer-events-none">
          <span className="mb-4 inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#00FFC2] backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-[#00FFC2] rounded-full animate-pulse" />
            Live Network Feed
          </span>

          <h1
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.95] select-none transition-all duration-300 pointer-events-auto cursor-default"
            style={{
              backgroundImage:
                'radial-gradient(550px circle at var(--mx) var(--my), #00FFC2 0%, #ffffff 45%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            <TextScramble text="TECH_SYNC" trigger="both" />
            <span className="text-[#00FFC2]">.</span>
          </h1>

          <p className="mt-6 max-w-xl text-sm sm:text-base text-white/50 uppercase tracking-widest font-medium">
            Signal from the edge — DevOps, Kubernetes, AI/ML &amp; Cyber Security, curated in real time.
          </p>

          <div className="mt-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 animate-bounce">
            Scroll
            <ArrowRight className="w-3 h-3 rotate-90" />
          </div>
        </div>
      </section>

      {/* CATEGORY STRIP */}
      <section className="border-y border-white/10 bg-[#080808]/80 sticky top-[65px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {categories.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className="flex items-center gap-2 text-white/50 hover:text-[#00FFC2] hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                <TextScramble text={name} trigger="hover" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* LATEST FEED */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">
            Latest <TextScramble text="Transmissions" trigger="hover" />
          </h2>
          <span className="text-xs font-bold uppercase tracking-widest text-white/30">
            Articles added manually
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholderArticles.map((article, i) => (
            <InteractiveCard key={i} {...article} />
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="border-t border-white/10 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tighter mb-3">
            Stay synced with the network<span className="text-[#00FFC2]">.</span>
          </h2>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            New transmissions are curated and published manually. Check back for updates.
          </p>
        </div>
      </section>
    </div>
  );
}
