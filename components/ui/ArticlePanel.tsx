'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink, Calendar, Tag, ArrowLeft } from 'lucide-react';
import { TextScramble } from '@/components/ui/TextScramble';

export interface ArticlePanelData {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  url: string;
  topics?: string[];
}

interface ArticlePanelProps {
  article: ArticlePanelData | null;
  onClose: () => void;
}

export function ArticlePanel({ article, onClose }: ArticlePanelProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (article) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [article]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
          article ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[520px] bg-[#070707] border-l border-white/10 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          article ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {article && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00FFC2] flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                {article.category}
              </span>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors bg-white/5 border border-white/10 p-1.5 rounded-full hover:scale-105 duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
              {/* Date */}
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-white/40 uppercase tracking-widest mb-4">
                <Calendar className="w-3 h-3" />
                {article.date}
              </span>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug mb-6">
                <TextScramble text={article.title} trigger="both" />
              </h2>

              {/* Summary card */}
              <div className="bg-[#00FFC2]/5 border border-[#00FFC2]/20 rounded-2xl p-5 mb-6">
                <p className="text-sm text-white/70 leading-relaxed italic">
                  "{article.excerpt}"
                </p>
              </div>

              {/* Topics */}
              {article.topics && article.topics.length > 0 && (
                <div className="mb-6">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2 block">Topics</span>
                  <div className="flex flex-wrap gap-2">
                    {article.topics.map((t, i) => (
                      <span key={i} className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider text-white/50">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Neon divider */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-[#00FFC2]/30 to-transparent mb-6" />

              {/* Source notice */}
              <p className="text-xs text-white/30 leading-relaxed mb-6">
                This article is sourced from an external publication. Click the button below to read the full story on the original source.
              </p>
            </div>

            {/* Sticky CTA */}
            <div className="px-6 py-5 border-t border-white/10 shrink-0 bg-[#070707]">
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#00FFC2] hover:bg-[#00e0aa] text-black font-black uppercase tracking-widest py-3.5 rounded-xl transition-all hover:shadow-[0_0_30px_rgba(0,255,194,0.35)] text-[11px]"
              >
                Read Full Article <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </>
        )}
      </div>
    </>
  );
}
