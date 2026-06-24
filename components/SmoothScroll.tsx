"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll() {
  useEffect(() => {
    let lenis: Lenis | null = null;

    const initLenis = () => {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
      });

      function raf(time: number) {
        lenis!.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      // Keep lenis instance globally accessible in case other components need to controls/scroll
      (window as any).lenis = lenis;
    };

    // Wait for preloader to finish before starting Lenis
    // If preloader already fired (e.g. fast reload), init immediately after a short delay
    const onPreloaderDone = () => {
      // Small delay to ensure scroll position is at 0 before Lenis takes over
      setTimeout(initLenis, 100);
    };

    window.addEventListener('preloader-done', onPreloaderDone);

    // Fallback: if preloader-done never fires (e.g. navigating between pages), init after 2s
    const fallbackTimer = setTimeout(() => {
      if (!lenis) initLenis();
    }, 2000);

    return () => {
      window.removeEventListener('preloader-done', onPreloaderDone);
      clearTimeout(fallbackTimer);
      if (lenis) {
        lenis.destroy();
        (window as any).lenis = null;
      }
    };
  }, []);

  return null;
}
