'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * PageTransition — frost-dissolve overlay on every route change.
 *
 * Drop this in components/PageTransition.tsx
 * Mount <PageTransition /> in app/layout.tsx (inside <body>, after <CustomCursor />)
 *
 * The @keyframes frostDissolve lives in app/globals.css
 * (provided in the globals.css file in this set).
 */
export function PageTransition() {
  const overlay  = useRef<HTMLDivElement>(null!);
  const pathname = usePathname();
  const isFirst  = useRef(true);

  useEffect(() => {
    // Skip the very first render — Preloader handles the initial entrance
    if (isFirst.current) { isFirst.current = false; return; }

    const el = overlay.current;
    if (!el) return;

    el.classList.remove('frost-dissolve-active');
    void el.offsetWidth; // force reflow so re-adding restarts the animation
    el.classList.add('frost-dissolve-active');

    const t = setTimeout(() => el.classList.remove('frost-dissolve-active'), 750);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div
      ref={overlay}
      aria-hidden="true"
      className="fixed inset-0 z-[9997] pointer-events-none"
    />
  );
}
