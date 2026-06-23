'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * CustomCursor — igloo.inc-style magnetic cursor.
 *
 * • Inner dot  : 8px filled teal circle, velocity-smear on fast moves
 * • Outer ring : 28px border ring, expands + turns teal on interactive elements
 * • Mix-blend  : "difference" on idle so it stays visible on any background
 * • Touch safe : detects (hover:hover)+(pointer:fine) — renders nothing on touch devices
 */
export function CustomCursor() {
  const dot  = useRef<HTMLDivElement>(null!);
  const ring = useRef<HTMLDivElement>(null!);
  const pos    = useRef({ x: -200, y: -200 });
  const target = useRef({ x: -200, y: -200 });
  const hovered  = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only activate on true pointer devices — skip touch-only screens
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    setVisible(true);
    document.body.style.cursor = 'none';

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };

      // Horizontal velocity smear — wider dot on fast horizontal moves (igloo drag feel)
      const vx = Math.min(Math.abs(e.movementX) * 0.14, 1.6);
      if (dot.current) {
        dot.current.style.transform = `translate(-50%,-50%) scaleX(${1 + vx})`;
      }
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [role="button"], [data-cursor="pointer"], input, textarea, select')) {
        hovered.current = true;
      }
    };
    const onOut = () => { hovered.current = false; };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout',  onOut);

    let raf: number;
    const loop = () => {
      // Smooth lag follow — ring slightly slower than dot
      pos.current.x += (target.current.x - pos.current.x) * 0.14;
      pos.current.y += (target.current.y - pos.current.y) * 0.14;
      const { x, y } = pos.current;
      const h = hovered.current;

      if (dot.current) {
        dot.current.style.left  = `${x}px`;
        dot.current.style.top   = `${y}px`;
        dot.current.style.opacity = h ? '0' : '1';
      }

      if (ring.current) {
        ring.current.style.left   = `${x}px`;
        ring.current.style.top    = `${y}px`;
        ring.current.style.width  = h ? '48px' : '28px';
        ring.current.style.height = h ? '48px' : '28px';
        ring.current.style.borderColor   = h ? '#00FFC2' : 'rgba(255,255,255,0.45)';
        ring.current.style.mixBlendMode  = h ? 'normal' : 'difference';
        ring.current.style.background    = h ? 'rgba(0,255,194,0.06)' : 'transparent';
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
      setVisible(false);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Inner filled dot */}
      <div
        ref={dot}
        className="fixed z-[9999] pointer-events-none rounded-full"
        style={{
          width: 8,
          height: 8,
          background: '#00FFC2',
          transform: 'translate(-50%,-50%)',
          transition: 'opacity 0.15s ease',
          boxShadow: '0 0 10px #00FFC2, 0 0 20px rgba(0,255,194,0.4)',
          willChange: 'left, top',
        }}
      />
      {/* Outer ring */}
      <div
        ref={ring}
        className="fixed z-[9999] pointer-events-none rounded-full border"
        style={{
          width: 28,
          height: 28,
          transform: 'translate(-50%,-50%)',
          transition:
            'width 0.3s cubic-bezier(0.16,1,0.3,1),' +
            'height 0.3s cubic-bezier(0.16,1,0.3,1),' +
            'border-color 0.25s ease,' +
            'background 0.25s ease',
          willChange: 'left, top, width, height',
        }}
      />
    </>
  );
}
