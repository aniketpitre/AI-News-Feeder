'use client';

import { useEffect, useRef } from 'react';

/**
 * NetworkGraph — animated canvas node graph for the footer background.
 *
 * Drop this in components/NetworkGraph.tsx
 * Use it in app/page.tsx inside the footer WaypointSection:
 *
 *   <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
 *     <NetworkGraph />
 *   </div>
 *
 * Pure canvas, zero dependencies.
 */

const CATEGORY_COLORS = ['#00FFC2', '#4FC3F7', '#CE93D8', '#FF8A65'];

interface Node {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  color: string;
  pulsePhase: number;
  pulseSpeed: number;
}

interface Edge { a: number; b: number }

export function NetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let W = 0, H = 0;
    let raf: number;
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    const NODE_COUNT = 30;
    const MAX_DIST = 160;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
    };

    const init = () => {
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 2 + Math.random() * 3,
        color: CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)],
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.8 + Math.random() * 1.2,
      }));
      buildEdges();
    };

    const buildEdges = () => {
      edges = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          if (Math.sqrt(dx * dx + dy * dy) < MAX_DIST) {
            edges.push({ a: i, b: j });
          }
        }
      }
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);

      // Update nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }

      // Rebuild edges periodically (every ~60 frames)
      if (Math.floor(t / 16) % 60 === 0) buildEdges();

      // Draw edges
      for (const e of edges) {
        const na = nodes[e.a], nb = nodes[e.b];
        const dx = na.x - nb.x, dy = na.y - nb.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const alpha = (1 - dist / MAX_DIST) * 0.3;
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Draw nodes
      const ts = t * 0.001;
      for (const n of nodes) {
        const pulse = 1 + Math.sin(ts * n.pulseSpeed + n.pulsePhase) * 0.4;
        const r = n.r * pulse;

        // Outer glow
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3);
        grad.addColorStop(0, n.color + '60');
        grad.addColorStop(1, n.color + '00');
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    init();
    raf = requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => { resize(); init(); });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
