'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Preloader — typewriter boot sequence + CRT scan-line overlay.
 *
 * Replace components/Preloader.tsx with this file entirely.
 * No other files need to change for this component.
 * The .scan-line CSS is in app/globals.css (provided in this file set).
 */

const BOOT_LINES = [
  { text: 'INITIALIZING SECURE TUNNEL...', delay: 0,    duration: 420, color: 'rgba(255,255,255,0.35)' },
  { text: 'CONNECTING TO RSS MESH NETWORK...', delay: 500, duration: 500, color: 'rgba(255,255,255,0.35)' },
  { text: 'LOADING AI SUMMARIZATION ENGINE...', delay: 1050, duration: 540, color: 'rgba(255,255,255,0.35)' },
  { text: 'CALIBRATING THREAT DETECTION...', delay: 1640, duration: 460, color: 'rgba(255,255,255,0.35)' },
  { text: 'PARSING LIVE FEEDS...', delay: 2150, duration: 380, color: 'rgba(255,255,255,0.35)' },
  { text: 'CONNECTION ESTABLISHED.', delay: 2580, duration: 300, color: '#00FFC2' },
];

function TypewriterLine({ text, color, onDone }: { text: string; color: string; onDone?: () => void }) {
  const [shown, setShown] = useState('');
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setTimeout(() => { setCursor(false); onDone?.(); }, 200);
      }
    }, 28);
    return () => clearInterval(interval);
  }, [text, onDone]);

  return (
    <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-widest leading-relaxed">
      <span className="text-[#00FFC2] opacity-50 shrink-0">›</span>
      <span style={{ color }}>{shown}</span>
      {cursor && (
        <span className="inline-block w-[6px] h-[11px] ml-0.5 align-middle animate-pulse"
          style={{ background: color, opacity: 0.7 }} />
      )}
    </div>
  );
}

export function Preloader() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [fadeOut, setFadeOut]           = useState(false);
  const [visible, setVisible]           = useState(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Lock scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';
    const lenis = (window as any).lenis;
    if (lenis?.stop) lenis.stop();

    return () => { document.body.style.overflow = ''; };
  }, []);

  // Stagger lines in, then fade out
  useEffect(() => {
    BOOT_LINES.forEach((line, i) => {
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, i]);
      }, line.delay);
      timers.current.push(t);
    });

    // After last line finishes typing, wait a beat then fade
    const totalTime = BOOT_LINES[BOOT_LINES.length - 1].delay + BOOT_LINES[BOOT_LINES.length - 1].duration + 600;

    const fadeT = setTimeout(() => setFadeOut(true), totalTime);
    const hideT = setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = '';
      const lenis = (window as any).lenis;
      if (lenis?.start) lenis.start();
      window.dispatchEvent(new CustomEvent('preloader-done'));
    }, totalTime + 900);

    timers.current.push(fadeT, hideT);
    return () => timers.current.forEach(clearTimeout);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
      style={{
        opacity:    fadeOut ? 0 : 1,
        transform:  fadeOut ? 'scale(1.04)' : 'scale(1)',
        transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)',
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* CRT scan line */}
      <div className="scan-line" />

      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'linear-gradient(to right, #0d0d0d 1px, transparent 1px), linear-gradient(to bottom, #0d0d0d 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Radial teal glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,255,194,0.06) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-8">
        {/* Logo */}
        <h1 className="font-mono text-3xl sm:text-4xl font-black tracking-tighter text-white select-none mb-8">
          TECH_SYNC<span className="text-[#00FFC2]">.</span>
        </h1>

        {/* Boot terminal */}
        <div
          className="w-full rounded-xl border px-5 py-4 flex flex-col gap-1.5 mb-6"
          style={{ background: 'rgba(0,0,0,0.6)', borderColor: 'rgba(0,255,194,0.12)', backdropFilter: 'blur(8px)' }}
        >
          <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-pulse" />
            SECURE BOOT SEQUENCE
          </div>

          {BOOT_LINES.map((line, i) => (
            visibleLines.includes(i) ? (
              <TypewriterLine key={i} text={line.text} color={line.color} />
            ) : (
              <div key={i} className="h-4" /> // placeholder to prevent layout shift
            )
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full flex flex-col items-center gap-2">
          <div className="w-full h-[1px] bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-out"
              style={{
                width: `${(visibleLines.length / BOOT_LINES.length) * 100}%`,
                background: '#00FFC2',
                boxShadow: '0 0 10px #00FFC2, 0 0 22px rgba(0,255,194,0.25)',
              }}
            />
          </div>
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">
            {visibleLines.length < BOOT_LINES.length ? 'Establishing connection...' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 text-[8px] font-mono text-white/10 uppercase tracking-widest">v2.1.0</div>
      <div className="absolute bottom-6 right-6 text-[8px] font-mono text-white/10 uppercase tracking-widest flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-[#00FFC2] animate-pulse" />
        Secure Channel
      </div>

      {/* Corner frame decorators */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-[#00FFC2]/20" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-[#00FFC2]/20" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-[#00FFC2]/20" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-[#00FFC2]/20" />
    </div>
  );
}
