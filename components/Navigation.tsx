'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TextScramble } from './ui/TextScramble';
import { Menu, X } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get('category') || 'all';
  const isArticlesPage = pathname.startsWith('/articles');
  const basePath = isArticlesPage ? '/articles' : '/';

  // Scroll-aware: transparent at top, glassmorphic on scroll, hide on scroll-down
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 80);
      if (y > lastScrollY.current && y > 200) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const getLinkClass = (category: string) => {
    const isActive = activeCategory.toLowerCase() === category.toLowerCase();
    // Special condition: if the user highlights Articles itself, highlight it
    if (category === 'articles') {
      return isArticlesPage 
        ? "text-[#00FFC2] font-black tracking-widest pb-1 border-b-2 border-[#00FFC2]" 
        : "hover:text-white transition-colors pb-1";
    }
    return isActive
      ? "text-[#00FFC2] font-black tracking-widest pb-1 border-b-2 border-[#00FFC2]"
      : "hover:text-white transition-colors pb-1";
  };

  return (
    <>
      <nav
        className="flex items-center justify-between px-6 md:px-8 py-4 shrink-0 sticky top-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(5,5,5,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
          transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
        }}
      >
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-xl md:text-2xl font-black tracking-tighter text-[#00FFC2] hover:drop-shadow-[0_0_12px_#00FFC2] transition-all duration-300 hover:scale-105"
            onClick={() => setIsOpen(false)}
          >
            <TextScramble text="TECH_SYNC" trigger="both" />
            <span className="text-white">.</span>
          </Link>
          
          {/* Desktop Links */}
          <div className="hidden md:flex gap-6 text-[10px] font-mono font-medium text-white/60 uppercase tracking-[0.18em]">
            <Link href={`${basePath}?category=all`} className={getLinkClass('all')}>
              <TextScramble text="Network" trigger="hover" />
            </Link>
            <Link href={`${basePath}?category=DevOps`} className={getLinkClass('DevOps')}>
              <TextScramble text="DevOps" trigger="hover" />
            </Link>
            <Link href={`${basePath}?category=K8s`} className={getLinkClass('K8s')}>
              <TextScramble text="K8s" trigger="hover" />
            </Link>
            <Link href={`${basePath}?category=AI/ML`} className={getLinkClass('AI/ML')}>
              <TextScramble text="AI/ML" trigger="hover" />
            </Link>
            <Link href={`${basePath}?category=Cyber SOC`} className={getLinkClass('Cyber SOC')}>
              <TextScramble text="Cyber SOC" trigger="hover" />
            </Link>
            <Link href="/articles" className={getLinkClass('articles') + " ml-4"}>
              <TextScramble text="Articles" trigger="hover" />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#00FFC2] rounded-full animate-pulse"></span>
            <span className="text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-tighter text-white/80">
              <span className="hidden sm:inline">AI Aggregator: </span>Active
            </span>
          </div>

          {/* Hamburger Menu Toggle (Mobile Only) */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-white hover:text-[#00FFC2] transition-colors p-1"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-[61px] z-40 bg-[#050505]/95 backdrop-blur-lg flex flex-col p-8 md:hidden border-b border-white/10 animate-mobile-menu">
          <div className="flex flex-col gap-6 text-lg font-bold uppercase tracking-widest mt-4">
            <Link
              href={`${basePath}?category=all`}
              onClick={() => setIsOpen(false)}
              className={activeCategory === 'all' ? 'text-[#00FFC2] border-b border-white/5 pb-2 font-black' : 'text-white/60 hover:text-[#00FFC2] border-b border-white/5 pb-2 transition-colors'}
            >
              <TextScramble text="Network" trigger="both" />
            </Link>
            <Link
              href={`${basePath}?category=DevOps`}
              onClick={() => setIsOpen(false)}
              className={activeCategory.toLowerCase() === 'devops' ? 'text-[#00FFC2] border-b border-white/5 pb-2 font-black' : 'text-white/60 hover:text-[#00FFC2] border-b border-white/5 pb-2 transition-colors'}
            >
              <TextScramble text="DevOps" trigger="both" />
            </Link>
            <Link
              href={`${basePath}?category=K8s`}
              onClick={() => setIsOpen(false)}
              className={activeCategory.toLowerCase() === 'k8s' ? 'text-[#00FFC2] border-b border-white/5 pb-2 font-black' : 'text-white/60 hover:text-[#00FFC2] border-b border-white/5 pb-2 transition-colors'}
            >
              <TextScramble text="K8s" trigger="both" />
            </Link>
            <Link
              href={`${basePath}?category=AI/ML`}
              onClick={() => setIsOpen(false)}
              className={activeCategory.toLowerCase() === 'ai/ml' ? 'text-[#00FFC2] border-b border-white/5 pb-2 font-black' : 'text-white/60 hover:text-[#00FFC2] border-b border-white/5 pb-2 transition-colors'}
            >
              <TextScramble text="AI/ML" trigger="both" />
            </Link>
            <Link
              href={`${basePath}?category=Cyber SOC`}
              onClick={() => setIsOpen(false)}
              className={activeCategory.toLowerCase() === 'cyber soc' ? 'text-[#00FFC2] border-b border-white/5 pb-2 font-black' : 'text-white/60 hover:text-[#00FFC2] border-b border-white/5 pb-2 transition-colors'}
            >
              <TextScramble text="Cyber SOC" trigger="both" />
            </Link>
            <Link
              href="/articles"
              onClick={() => setIsOpen(false)}
              className={isArticlesPage ? 'text-[#00FFC2] pb-2 font-black' : 'text-white/60 hover:text-[#00FFC2] pb-2 transition-colors'}
            >
              <TextScramble text="Articles" trigger="both" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
