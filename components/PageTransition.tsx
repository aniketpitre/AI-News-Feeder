'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * PageTransition — igloo.inc-style frost dissolve on every route change.
 *
 * When the pathname changes (new page has mounted), a translucent overlay
 * with a teal chromatic-aberration tint sweeps through and fades out,
 * giving the impression the new page "crystallised" into view.
 *
 * Mount once in app/layout.tsx, above <main>.
 */
export function PageTransition() {
  const overlay = useRef<HTMLDivElement>(null!);
  const pathname = usePathname();
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Skip the very first render — the preloader already handles initial entrance
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const el = overlay.current;
    if (!el) return;

    // Force a reflow so removing + re-adding the class actually restarts the animation
    el.classList.remove('page-transition-active');
    void el.offsetWidth;
    el.classList.add('page-transition-active');

    const cleanup = setTimeout(() => {
      el.classList.remove('page-transition-active');
    }, 750);

    return () => clearTimeout(cleanup);
  }, [pathname]);

  return (
    <div
      ref={overlay}
      className="fixed inset-0 z-[9997] pointer-events-none"
      aria-hidden="true"
    />
  );
}
