'use client';

import React, { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface InteractiveCardProps {
  category: string;
  title: string;
  excerpt: string;
  date: string;
}

export function InteractiveCard({ category, title, excerpt, date }: InteractiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Skip tilt calculations on touch-only devices to avoid scroll interference
    if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) {
      return;
    }

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
      className="group relative border border-white/10 bg-[#080808]/75 rounded-2xl overflow-hidden hover:border-[#00FFC2]/30 transition-all duration-300 cursor-pointer backdrop-blur-md"
      style={{
        transform: isHovered
          ? 'perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale3d(1.02, 1.02, 1.02)'
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered ? 'none' : 'all 0.5s ease',
      }}
    >
      {/* Dynamic Cursor Spotlight Glow (only visible when hovered) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
        style={{
          background: `radial-gradient(280px circle at ${coords.x}px ${coords.y}px, rgba(0, 255, 194, 0.12), transparent 75%)`,
        }}
      />

      {/* Glass border glowing highlight mask */}
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

      <div className="h-44 w-full bg-gradient-to-br from-[#101010] to-[#161616] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_30%_30%,#00FFC2,transparent_60%)] group-hover:opacity-35 transition-opacity duration-300" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 z-[2]">Image / Media</span>
      </div>

      <div className="p-6 relative z-20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FFC2]">
            {category}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            {date}
          </span>
        </div>
        <h3 className="text-lg font-bold leading-snug mb-2 group-hover:text-[#00FFC2] transition-colors duration-200">
          {title}
        </h3>
        <p className="text-sm text-white/40 leading-relaxed">
          {excerpt}
        </p>
        <div className="mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/30 group-hover:text-[#00FFC2] group-hover:gap-2 transition-all duration-200">
          Read More <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
