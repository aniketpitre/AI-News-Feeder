'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * CustomCursor — magnetic teal cursor, igloo.inc style.
 *
 * Drop this in components/CustomCursor.tsx
 * Then add <CustomCursor /> to app/layout.tsx (inside <body>, above <SmoothScroll />)
 *
 * Works only on pointer devices (hover:hover + pointer:fine).
 * Renders nothing on touch screens — no behaviour change on mobile.
 */
export function CustomCursor() {
  const dot  = useRef<HTMLDivElement>(null!);
  const ring = useRef<HTMLDivElement>(null!);
  const pos    = useRef({ x: -200, y: -200 });
  const target = useRef({ x: -200, y: -200 });
  const hovered = useRef(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Only on real pointer devices — skip touch-only screens entirely
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    setActive(true);
    document.body.style.cursor = 'none';

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      // Horizontal velocity smear — widens the dot on fast sideways moves
      const vx = Math.min(Math.abs(e.movementX) * 0.13, 1.8);
      if (dot.current) {
        dot.current.style.transform = `translate(-50%,-50%) scaleX(${1 + vx})`;
      }
    };

    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('a, button, [role="button"], [data-cursor="pointer"], input, textarea, select, label')) {
        hovered.current = true;
      }
    };
    const onOut = () => { hovered.current = false; };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout',  onOut);

    let raf: number;
    const loop = () => {
      // Smooth lag follow — ring lags slightly behind dot for depth
      pos.current.x += (target.current.x - pos.current.x) * 0.13;
      pos.current.y += (target.current.y - pos.current.y) * 0.13;
      const { x, y } = pos.current;
      const h = hovered.current;

      if (dot.current) {
        dot.current.style.left    = `${x}px`;
        dot.current.style.top     = `${y}px`;
        dot.current.style.opacity = h ? '0' : '1';
      }

      if (ring.current) {
        ring.current.style.left        = `${x}px`;
        ring.current.style.top         = `${y}px`;
        ring.current.style.width       = h ? '46px' : '28px';
        ring.current.style.height      = h ? '46px' : '28px';
        ring.current.style.borderColor = h ? '#00FFC2' : 'rgba(255,255,255,0.4)';
        ring.current.style.background  = h ? 'rgba(0,255,194,0.07)' : 'transparent';
        ring.current.style.mixBlendMode = h ? 'normal' : 'difference';
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout',  onOut);
      document.body.style.cursor = '';
      setActive(false);
    };
  }, []);

  if (!active) return null;

  return (
    <>
      {/* Inner dot — fills teal, smears on horizontal velocity */}
      <div
        ref={dot}
        className="fixed z-[9999] pointer-events-none rounded-full"
        style={{
          width: 8, height: 8,
          background: '#00FFC2',
          boxShadow: '0 0 10px #00FFC2, 0 0 22px rgba(0,255,194,0.35)',
          transform: 'translate(-50%,-50%)',
          transition: 'opacity 0.15s ease',
          willChange: 'left, top',
        }}
      />
      {/* Outer ring — expands + turns teal on interactive elements */}
      <div
        ref={ring}
        className="fixed z-[9999] pointer-events-none rounded-full border"
        style={{
          width: 28, height: 28,
          transform: 'translate(-50%,-50%)',
          transition:
            'width 0.28s cubic-bezier(0.16,1,0.3,1),' +
            'height 0.28s cubic-bezier(0.16,1,0.3,1),' +
            'border-color 0.22s ease,' +
            'background 0.22s ease',
          willChange: 'left, top, width, height',
        }}
      />
    </>
  );
}
