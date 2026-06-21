'use client';

import { useEffect, useRef } from 'react';

interface UseWaypointSnapOptions {
  sectionCount: number;
  enabled?: boolean;
  idleMs?: number; // how long to wait after scroll stops before snapping
}

/**
 * Detects which waypoint section the viewport is closest to, then — after
 * the user pauses scrolling — eases the page to perfectly align with that
 * section's top edge. Mirrors igloo.inc's GSAP-eased scroll-to-waypoint
 * behavior without hijacking continuous scroll (so it still feels natural,
 * not "scroll-jacked").
 */
export function useWaypointSnap({ sectionCount, enabled = true, idleMs = 650 }: UseWaypointSnapOptions) {
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSnapping = useRef(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const getSectionTops = () => {
      const sections = Array.from(document.querySelectorAll('[data-waypoint-section]')) as HTMLElement[];
      return sections.map(el => el.offsetTop);
    };

    const handleScroll = () => {
      if (isSnapping.current) return;
      lastScrollY.current = window.scrollY;

      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        const tops = getSectionTops();
        if (tops.length === 0) return;

        const y = window.scrollY;
        const viewportH = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight - viewportH;

        // Don't snap if already very close to top or bottom of document
        if (y < 40 || y > docHeight - 40) return;

        // Find nearest section top
        let nearest = tops[0];
        let minDist = Math.abs(y - tops[0]);
        for (const t of tops) {
          const d = Math.abs(y - t);
          if (d < minDist) { minDist = d; nearest = t; }
        }

        // Only snap if we're reasonably close (within 35% of viewport height) —
        // avoids fighting the user mid-read on a long section
        if (minDist > viewportH * 0.35) return;
        if (minDist < 4) return; // already aligned

        isSnapping.current = true;
        const lenis = (window as any).lenis;
        if (lenis && typeof lenis.scrollTo === 'function') {
          lenis.scrollTo(nearest, {
            duration: 1.1,
            easing: (t: number) => 1 - Math.pow(1 - t, 4), // quart-out, igloo-style ease
            onComplete: () => { isSnapping.current = false; },
          });
        } else {
          window.scrollTo({ top: nearest, behavior: 'smooth' });
          setTimeout(() => { isSnapping.current = false; }, 1100);
        }
      }, idleMs);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [enabled, idleMs, sectionCount]);
}
