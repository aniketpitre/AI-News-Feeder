'use client';

import { Article } from '@/types/article';
import { ExternalLink } from 'lucide-react';

export default function ArticleModal({ article, onClose }: { article: Article | null; onClose: () => void }) {
  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl bg-[#071020] border border-white/10 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{article.title}</h2>
            <div className="text-sm text-white/60 mb-4">
              {article.sourceName} • {new Date(article.publishedAt).toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={article.url} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-white/5 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Open
            </a>
            <button onClick={onClose} className="text-sm text-white/60">Close</button>
          </div>
        </div>

        <p className="text-white/70 leading-relaxed mt-4">{article.summary}</p>

        <div className="flex flex-wrap gap-2 mt-4">
          {article.topics?.map((t) => (
            <span key={t} className="px-3 py-1 text-xs rounded bg-white/5">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
