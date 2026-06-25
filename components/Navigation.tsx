'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TextScramble } from './ui/TextScramble';
import { Menu, X, Zap } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';

const CAT_COLORS: Record<string, string> = {
  devops:    '#4FC3F7',
  k8s:       '#00FFC2',
  'ai/ml':   '#CE93D8',
  'cyber soc': '#FF8A65',
  all:       '#00FFC2',
  articles:  '#00FFC2',
};

export function Navigation() {
  const [isOpen,   setIsOpen]   = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden,   setHidden]   = useState(false);
  const lastScrollY = useRef(0);
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const activeCategory  = searchParams.get('category') || 'all';
  const isArticlesPage  = pathname.startsWith('/articles');
  const basePath        = isArticlesPage ? '/articles' : '/';
  const activeCatLower  = isArticlesPage ? 'articles' : activeCategory.toLowerCase();
  const activeColor     = CAT_COLORS[activeCatLower] || '#00FFC2';

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 80);
      setHidden(y > lastScrollY.current && y > 200);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (cat: string) =>
    cat === 'articles'
      ? isArticlesPage
      : activeCategory.toLowerCase() === cat.toLowerCase();

  return (
    <>
      <nav
        className="flex items-center justify-between px-6 md:px-10 shrink-0 sticky top-0 z-50 transition-all duration-500"
        style={{
          height: scrolled ? 56 : 65,
          background: scrolled
            ? 'rgba(4, 5, 10, 0.88)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(22px) saturate(1.6)' : 'none',
          borderBottom: scrolled
            ? `1px solid rgba(255,255,255,0.07)`
            : '1px solid transparent',
          /* Thin gradient glow line under nav when scrolled */
          boxShadow: scrolled
            ? `0 1px 0 0 ${activeColor}22, 0 4px 24px rgba(0,0,0,0.4)`
            : 'none',
          transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
        }}
      >
        {/* Left: logo + links */}
        <div className="flex items-center gap-8">

          {/* Logo */}
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-1.5 group"
          >
            <span
              className="text-xl md:text-2xl font-black tracking-tighter transition-all duration-300"
              style={{
                color: '#00FFC2',
                textShadow: '0 0 18px rgba(0,255,194,0.35)',
              }}
            >
              <TextScramble text="TECH_SYNC" trigger="both" />
            </span>
            <span className="text-xl md:text-2xl font-black tracking-tighter text-white/60 group-hover:text-white transition-colors">.</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-[0.18em]">
            {[
              { label: 'Network',   href: `${basePath}?category=all`,       cat: 'all'        },
              { label: 'DevOps',    href: `${basePath}?category=DevOps`,     cat: 'DevOps'     },
              { label: 'K8s',       href: `${basePath}?category=K8s`,        cat: 'K8s'        },
              { label: 'AI/ML',     href: `${basePath}?category=AI/ML`,      cat: 'AI/ML'      },
              { label: 'Cyber SOC', href: `${basePath}?category=Cyber SOC`,  cat: 'Cyber SOC'  },
              { label: 'Articles',  href: '/articles',                        cat: 'articles'   },
            ].map(({ label, href, cat }) => {
              const active = isActive(cat);
              const col    = CAT_COLORS[cat.toLowerCase()] || '#00FFC2';
              return (
                <Link
                  key={cat}
                  href={href}
                  className="relative px-3 py-1.5 rounded-lg transition-all duration-200 group"
                  style={{
                    color:      active ? col : 'rgba(255,255,255,0.45)',
                    background: active ? `${col}12` : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)';
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)';
                  }}
                >
                  <TextScramble text={label} trigger="hover" />
                  {/* Active dot indicator */}
                  {active && (
                    <span
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: col, boxShadow: `0 0 6px ${col}` }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: status badge + mobile toggle */}
        <div className="flex items-center gap-3">
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-mono font-bold uppercase tracking-tight"
            style={{
              background:  `${activeColor}0d`,
              borderColor: `${activeColor}30`,
              color:        activeColor,
            }}
          >
            <Zap className="w-3 h-3" style={{ color: activeColor }} />
            <span className="hidden sm:inline">AI</span> Live
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: activeColor }}
            />
          </div>

          <button
            onClick={() => setIsOpen(o => !o)}
            className="md:hidden text-white/70 hover:text-white transition-colors p-1"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 top-[56px] z-40 flex flex-col px-8 py-10 md:hidden animate-mobile-menu"
          style={{
            background:     'rgba(3,4,9,0.97)',
            backdropFilter: 'blur(28px)',
            borderTop:      `1px solid ${activeColor}20`,
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse, ${activeColor}12 0%, transparent 70%)`,
              filter: 'blur(20px)',
            }}
          />

          <div className="relative flex flex-col gap-1">
            {[
              { label: 'Network',   href: `${basePath}?category=all`,       cat: 'all'        },
              { label: 'DevOps',    href: `${basePath}?category=DevOps`,     cat: 'DevOps'     },
              { label: 'K8s',       href: `${basePath}?category=K8s`,        cat: 'K8s'        },
              { label: 'AI/ML',     href: `${basePath}?category=AI/ML`,      cat: 'AI/ML'      },
              { label: 'Cyber SOC', href: `${basePath}?category=Cyber SOC`,  cat: 'Cyber SOC'  },
              { label: 'Articles',  href: '/articles',                        cat: 'articles'   },
            ].map(({ label, href, cat }, i) => {
              const active = isActive(cat);
              const col    = CAT_COLORS[cat.toLowerCase()] || '#00FFC2';
              return (
                <Link
                  key={cat}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-4 py-4 rounded-xl border transition-all duration-200"
                  style={{
                    color:       active ? col   : 'rgba(255,255,255,0.55)',
                    background:  active ? `${col}0f` : 'transparent',
                    borderColor: active ? `${col}25` : 'rgba(255,255,255,0.05)',
                    animationDelay: `${i * 40}ms`,
                  }}
                >
                  <span className="text-lg font-black uppercase tracking-widest">
                    <TextScramble text={label} trigger="both" />
                  </span>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: col, boxShadow: `0 0 8px ${col}` }} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
