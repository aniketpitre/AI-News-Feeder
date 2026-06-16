'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DEFAULT_HEADLINES = [
  'NEW CVE-2024-9122 DETECTED IN NODE.JS RUNTIME',
  'OPENAI RELEASES SEARCHGPT API FOR ENTERPRISE',
  'LINUX KERNEL 6.10 MERGED WITH AI OPTIMIZATIONS',
  'KUBERNETES v1.31 RELEASED',
  'TERRAFORM 1.9 ADDS EPHEMERAL VALUES SUPPORT',
  'CRITICAL ZERO-DAY FOUND IN APACHE STRUTS',
  'GOOGLE DEEPMIND RELEASES GEMINI 2.0 FLASH',
  'DOCKER DESKTOP 4.30 SHIPS WITH WASM RUNTIME',
];

export function TickerBar() {
  const [headlines, setHeadlines] = useState<string[]>(DEFAULT_HEADLINES);

  useEffect(() => {
    async function fetchHeadlines() {
      try {
        const q = query(
          collection(db, 'articles'),
          where('status', '==', 'published'),
          orderBy('publishedAt', 'desc'),
          limit(15)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const titles = snapshot.docs
            .map(doc => doc.data().title as string)
            .filter(Boolean)
            .map(t => t.toUpperCase());
          if (titles.length > 0) setHeadlines(titles);
        }
      } catch {
        // fallback to defaults
      }
    }
    fetchHeadlines();
  }, []);

  // Duplicate for seamless loop
  const items = [...headlines, ...headlines];

  return (
    <div className="w-full bg-[#00FFC2] text-black h-8 overflow-hidden flex items-center shrink-0 z-50">
      <div
        className="flex items-center whitespace-nowrap"
        style={{
          animation: `ticker-scroll ${headlines.length * 4}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {items.map((headline, i) => (
          <span key={i} className="inline-flex items-center text-[10px] font-black uppercase tracking-widest">
            <span className="px-6">{headline}</span>
            <span className="opacity-40 text-[8px]">◆</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
