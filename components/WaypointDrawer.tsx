'use client';

import { useEffect, useState, useCallback } from 'react';
import { WAYPOINTS } from '@/components/IcebergScene';

/**
 * Persistent right-edge breadcrumb trail — igloo.inc keeps a context-aware
 * indicator so visitors never feel lost inside the single-page narrative.
 * Each dot represents one waypoint section; the active one expands and
 * shows its label. Clicking jumps (eased) to that section.
 */
export function WaypointDrawer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = Array.from(document.querySelectorAll('[data-waypoint-section]')) as HTMLElement[];
      if (sections.length === 0) return;

      const scrollCenter = window.scrollY + window.innerHeight / 2;
      let closest = 0;
      let minDist = Infinity;
      sections.forEach((el, i) => {
        const center = el.offsetTop + el.offsetHeight / 2;
        const dist = Math.abs(scrollCenter - center);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      setActiveIndex(closest);
      setVisible(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const jumpTo = useCallback((index: number) => {
    const sections = Array.from(document.querySelectorAll('[data-waypoint-section]')) as HTMLElement[];
    const target = sections[index];
    if (!target) return;

    const lenis = (window as any).lenis;
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(target.offsetTop, {
        duration: 1.2,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
      });
    } else {
      window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    }
  }, []);

  return (
    <div
      className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col items-end gap-3 pointer-events-none transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {WAYPOINTS.map((wp, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={wp.key}
            onClick={() => jumpTo(i)}
            className="group flex items-center gap-2.5 pointer-events-auto"
            aria-label={`Jump to ${wp.label}`}
          >
            {/* Label — only shown for active waypoint, fades in */}
            <span
              className="text-[9px] font-mono font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300"
              style={{
                color: isActive ? wp.color : 'transparent',
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'translateX(0)' : 'translateX(8px)',
                textShadow: isActive ? `0 0 12px ${wp.color}80` : 'none',
              }}
            >
              {wp.label}
            </span>

            {/* Dot */}
            <span
              className="rounded-full transition-all duration-300 border"
              style={{
                width: isActive ? 8 : 5,
                height: isActive ? 8 : 5,
                background: isActive ? wp.color : 'transparent',
                borderColor: isActive ? wp.color : 'rgba(255,255,255,0.25)',
                boxShadow: isActive ? `0 0 10px ${wp.color}` : 'none',
              }}
            />
          </button>
        );
      })}

      {/* Connecting vertical line */}
      <div
        className="absolute right-[2px] top-0 bottom-0 w-px -z-10"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent)' }}
      />
    </div>
  );
}
