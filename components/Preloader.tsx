'use client';

import { useState, useEffect } from 'react';

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Accelerating progress curve
        const increment = prev < 60 ? 3 : prev < 85 ? 5 : 8;
        return Math.min(prev + increment, 100);
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => setFadeOut(true), 300);
      const hide = setTimeout(() => setVisible(false), 1100);
      return () => { clearTimeout(timeout); clearTimeout(hide); };
    }
  }, [progress]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#050505]"
      style={{
        opacity: fadeOut ? 0 : 1,
        transform: fadeOut ? 'scale(1.05)' : 'scale(1)',
        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* Decorative grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0a0a0a_1px,transparent_1px),linear-gradient(to_bottom,#0a0a0a_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />

      {/* Radial glow behind logo */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,255,194,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <h1 className="font-mono text-4xl sm:text-5xl font-black tracking-tighter text-white select-none">
          TECH_SYNC<span className="text-[#00FFC2]">.</span>
        </h1>

        {/* Progress bar */}
        <div className="w-48 flex flex-col items-center gap-3">
          <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full transition-[width] duration-100 ease-out"
              style={{
                width: `${progress}%`,
                background: '#00FFC2',
                boxShadow: '0 0 12px #00FFC2, 0 0 24px rgba(0,255,194,0.3)',
              }}
            />
          </div>
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-white/30">
            {progress < 100 ? 'Initializing secure feed...' : 'Connection established'}
          </span>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 text-[8px] font-mono text-white/10 uppercase tracking-widest">
        v2.1.0
      </div>
      <div className="absolute bottom-6 right-6 text-[8px] font-mono text-white/10 uppercase tracking-widest flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-[#00FFC2] animate-pulse" />
        Secure Channel
      </div>
    </div>
  );
}
