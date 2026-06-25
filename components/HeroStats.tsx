'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * HeroStats — 4 floating glassmorphic stat chips around the hero crystal.
 *
 * Drop this in components/HeroStats.tsx
 * Use it in app/page.tsx inside the hero WaypointSection (pointer-events-none removed
 * for the stats div so chips are interactive, but the section wrapper keeps
 * pointer-events-none for the rest).
 *
 * Reads real article counts from Firestore, falls back to placeholders.
 */

interface Stat {
  label: string;
  value: string;
  sub: string;
  color: string;
  top: string;
  left: string;
  delay: string;
  duration: string;
}

const FALLBACK_STATS: Stat[] = [
  { label: 'Articles synced',     value: '342',     sub: 'across all sectors',   color: '#00FFC2', top: '22%', left: '4%',  delay: '0s',    duration: '5.2s' },
  { label: 'Sectors monitored',   value: '4',       sub: 'live feed active',     color: '#4FC3F7', top: '30%', left: '76%', delay: '0.8s',  duration: '6.1s' },
  { label: 'AI/ML signals',       value: '↑ 18%',   sub: 'vs last 24h',          color: '#CE93D8', top: '66%', left: '6%',  delay: '1.4s',  duration: '4.8s' },
  { label: 'Last sync',           value: '3m ago',  sub: 'next in 57m',          color: '#FF8A65', top: '62%', left: '74%', delay: '2.0s',  duration: '5.7s' },
];

export function HeroStats() {
  const [stats, setStats] = useState<Stat[]>(FALLBACK_STATS);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, 'articles'), where('status', '==', 'published')));
        if (snap.empty) return;

        const all = snap.docs.map(d => d.data());
        const total = all.length;
        const byCategory = (cat: string) => all.filter(a => {
          const c = (a.category || '').toLowerCase();
          return c.includes(cat.toLowerCase());
        }).length;
        const aiCount = byCategory('AI');

        // Compute last sync from most-recent publishedAt
        const latest = all
          .map(a => a.publishedAt as number)
          .filter(Boolean)
          .sort((a, b) => b - a)[0];
        const minutesAgo = latest ? Math.floor((Date.now() - latest) / 60000) : null;
        const syncLabel = minutesAgo !== null
          ? minutesAgo < 60 ? `${minutesAgo}m ago` : `${Math.floor(minutesAgo / 60)}h ago`
          : '–';

        setStats([
          { ...FALLBACK_STATS[0], value: `${total}+` },
          { ...FALLBACK_STATS[1], value: '4' },
          { ...FALLBACK_STATS[2], value: aiCount > 0 ? `${aiCount} new` : '↑ active' },
          { ...FALLBACK_STATS[3], value: syncLabel },
        ]);
      } catch { /* keep fallback */ }
    }
    load();
  }, []);

  return (
    <>
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-8px) rotate(0.5deg); }
          66%       { transform: translateY(4px) rotate(-0.3deg); }
        }
        @keyframes heroChipIn {
          from { opacity: 0; transform: translateY(12px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>

      {/* Positioned relative to the hero section — use pointer-events-auto on chips */}
      <div className="absolute inset-0 pointer-events-none z-20 hidden sm:block">
        {stats.map((s, i) => (
          <div
            key={i}
            className="absolute pointer-events-auto"
            style={{
              top: s.top,
              left: s.left,
              animation: `heroChipIn 0.7s cubic-bezier(0.16,1,0.3,1) ${parseFloat(s.delay) + 2.6}s both,
                          heroFloat ${s.duration} ease-in-out ${s.delay} infinite`,
            }}
          >
            <div
              className="flex flex-col gap-0.5 px-3.5 py-2.5 rounded-xl border select-none"
              style={{
                background:    'rgba(5,7,14,0.72)',
                backdropFilter:'blur(18px)',
                borderColor:   `${s.color}28`,
                boxShadow:     `0 0 20px ${s.color}12, inset 0 1px 0 rgba(255,255,255,0.06)`,
              }}
            >
              {/* Colored left accent line */}
              <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ background: s.color }} />
              <span
                className="text-[16px] font-black font-mono leading-none"
                style={{ color: s.color, textShadow: `0 0 12px ${s.color}60` }}
              >
                {s.value}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">{s.label}</span>
              <span className="text-[8px] font-mono text-white/25">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
