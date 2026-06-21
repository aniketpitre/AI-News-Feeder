'use client';

import React, { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface InteractiveCardProps {
  category: string;
  title: string;
  excerpt: string;
  date: string;
  url?: string;
  onReadMore?: () => void;
}

export function InteractiveCard({ category, title, excerpt, date, onReadMore }: InteractiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });
    setIsHovered(true);
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = -((y - centerY) / centerY) * 6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.setProperty('--rx', `${rotateX}deg`);
    card.style.setProperty('--ry', `${rotateY}deg`);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onReadMore}
      className="group relative border border-white/10 bg-[#080808]/75 rounded-2xl overflow-hidden hover:border-[#00FFC2]/30 transition-all duration-300 cursor-pointer backdrop-blur-md"
      style={{
        transform: isHovered
          ? 'perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale3d(1.02, 1.02, 1.02)'
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered ? 'none' : 'all 0.5s ease',
      }}
    >
      {/* Cursor spotlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
        style={{
          background: `radial-gradient(280px circle at ${coords.x}px ${coords.y}px, rgba(0, 255, 194, 0.12), transparent 75%)`,
        }}
      />

      {/* Border glow mask */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]"
        style={{
          background: `radial-gradient(150px circle at ${coords.x}px ${coords.y}px, rgba(0, 255, 194, 0.25), transparent 80%)`,
          padding: '1px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {/* Premium Igloo-inspired SVG Diagnostic Visual */}
      <div className="h-44 w-full bg-black/80 relative overflow-hidden border-b border-white/5 flex items-center justify-center">
        {/* Neon Tech Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:14px_14px] opacity-40" />
        
        {/* Radial scanner glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,194,0.06),transparent_70%)] group-hover:bg-[radial-gradient(circle_at_center,rgba(0,255,194,0.12),transparent_60%)] transition-all duration-300" />
        
        <svg className="w-full h-full absolute inset-0 z-10 p-4" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <style>{`
            @keyframes sweep {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes pulse-node {
              0%, 100% { opacity: 0.2; r: 2px; }
              50% { opacity: 0.9; r: 3.5px; }
            }
            @keyframes scanline {
              0% { top: 0%; }
              100% { top: 100%; }
            }
            @keyframes data-flow {
              0% { transform: translateY(0); }
              100% { transform: translateY(-30px); }
            }
            .radar-sweep {
              transform-origin: 100px 60px;
              animation: sweep 8s linear infinite;
            }
            .node-pulse-1 { animation: pulse-node 3s infinite ease-in-out; }
            .node-pulse-2 { animation: pulse-node 4s infinite ease-in-out 1s; }
            .node-pulse-3 { animation: pulse-node 2.5s infinite ease-in-out 1.5s; }
            .data-text {
              font-family: monospace;
              font-size: 5px;
              fill: rgba(0, 255, 194, 0.45);
              animation: data-flow 12s linear infinite;
            }
          `}</style>

          {/* Scrolling data packet column */}
          <g className="opacity-40 group-hover:opacity-80 transition-opacity duration-300">
            <text x="10" y="30" className="data-text">0x7F4B92 A1</text>
            <text x="10" y="45" className="data-text">SYS_INIT_OK</text>
            <text x="10" y="60" className="data-text">PORT_3001_CONN</text>
            <text x="10" y="75" className="data-text">TR_SYNC_INIT</text>
            <text x="10" y="90" className="data-text">BUFF_OVERFLOW_0</text>
          </g>

          {/* Circular Radar Grids */}
          <circle cx="100" cy="60" r="45" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <circle cx="100" cy="60" r="30" stroke="rgba(0,255,194,0.05)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="100" cy="60" r="15" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

          {/* Radar Sweep Line */}
          <line x1="100" y1="60" x2="100" y2="15" stroke="rgba(0, 255, 194, 0.25)" strokeWidth="1.5" className="radar-sweep" />

          {/* Diagnostic Crosshairs */}
          <path d="M100 5V15M100 105V115M5 60H15M185 60H195" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Connected Network Nodes */}
          <g>
            {/* Connection lines */}
            <line x1="60" y1="40" x2="100" y2="60" stroke="rgba(0, 255, 194, 0.08)" strokeWidth="1" />
            <line x1="140" y1="80" x2="100" y2="60" stroke="rgba(0, 255, 194, 0.08)" strokeWidth="1" />
            <line x1="130" y1="35" x2="100" y2="60" stroke="rgba(0, 255, 194, 0.08)" strokeWidth="1" />

            {/* Glowing nodes */}
            <circle cx="60" cy="40" r="2.5" fill="#00FFC2" className="node-pulse-1" />
            <circle cx="140" cy="80" r="3" fill="#00FFC2" className="node-pulse-2" />
            <circle cx="130" cy="35" r="2" fill="#00FFC2" className="node-pulse-3" />
            <circle cx="100" cy="60" r="4" fill="#00FFC2" className="opacity-80" />
          </g>

          {/* Border decorative frames */}
          <rect x="2" y="2" width="196" height="116" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </svg>

        {/* Scanline Overlay */}
        <div className="absolute inset-x-0 h-0.5 bg-[#00FFC2]/5 pointer-events-none z-20 animate-[scanline_4s_linear_infinite]" style={{
          animationName: 'scanline',
          animationDuration: '4s',
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite'
        }} />
      </div>

      <div className="p-6 relative z-20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FFC2]">{category}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{date}</span>
        </div>
        <h3 className="text-lg font-bold leading-snug mb-2 group-hover:text-[#00FFC2] transition-colors duration-200 line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-white/40 leading-relaxed line-clamp-3">{excerpt}</p>
        <div className="mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/30 group-hover:text-[#00FFC2] group-hover:gap-2 transition-all duration-200">
          Read More <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
