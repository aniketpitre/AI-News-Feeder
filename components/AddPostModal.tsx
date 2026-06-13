'use client';

import { useEffect, useRef, useState } from 'react';

export default function AddPostModal({ onClose }: { onClose?: () => void }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [topics, setTopics] = useState('');
  const [sourceName, setSourceName] = useState('Manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    // focus first input
    const first = modalRef.current?.querySelector<HTMLInputElement>('input, textarea');
    first?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>('a, button, input, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title || !url || !summary) {
      setError('Please fill title, url and summary');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url, summary, topics: topics.split(',').map(t => t.trim()), sourceName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to add article');
      // refresh page to show new article
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Add Post">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <form
        ref={modalRef}
        onKeyDown={trapFocus}
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-2xl bg-[#071020] border border-white/10 rounded-xl p-6"
      >
        <h3 className="text-lg font-bold mb-4">Add Post</h3>

        <div className="grid grid-cols-1 gap-3">
          <input aria-label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded" />
          <input aria-label="URL" value={url} onChange={e => setUrl(e.target.value)} placeholder="URL" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded" />
          <input aria-label="Source name" value={sourceName} onChange={e => setSourceName(e.target.value)} placeholder="Source name" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded" />
          <input aria-label="Topics" value={topics} onChange={e => setTopics(e.target.value)} placeholder="Topics (comma separated)" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded" />
          <textarea aria-label="Summary" value={summary} onChange={e => setSummary(e.target.value)} placeholder="Summary" rows={4} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded" />
        </div>

        {error && <div className="text-sm text-red-400 mt-3">{error}</div>}

        <div className="flex justify-end gap-3 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-white/5">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-gradient-to-r from-[#00FFC2] to-[#00D9FF] text-black font-bold">
            {loading ? 'Adding...' : 'Add Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
