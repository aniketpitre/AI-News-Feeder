'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Zap } from 'lucide-react';
import dynamic from 'next/dynamic';

const AddPostModal = dynamic(() => import('./AddPostModal'), { ssr: false });

export function Navigation() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-[#050505]/80 backdrop-blur-md border-b border-white/10 shrink-0">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#00FFC2] to-[#00D9FF] rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5 text-black" />
          </div>
          <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-[#00FFC2] to-[#00D9FF] bg-clip-text text-transparent">
            TECH_SYNC
          </span>
        </Link>
        
        <div className="hidden lg:flex gap-8 text-sm font-medium text-white/60 uppercase tracking-widest">
          <Link href="/" className="text-white/80 hover:text-[#00FFC2] transition-colors duration-300">
            Latest
          </Link>
          <Link href="#trending" className="hover:text-[#00FFC2] transition-colors duration-300">
            Trending
          </Link>
          <a href="#categories" className="hover:text-[#00FFC2] transition-colors duration-300">
            Categories
          </a>
          <a href="#about" className="hover:text-[#00FFC2] transition-colors duration-300">
            About
          </a>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white/5 border border-white/20 px-3 py-1.5 rounded-full hover:border-[#00FFC2]/50 transition-colors duration-300">
          <span className="w-2 h-2 bg-[#00FFC2] rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold uppercase tracking-tighter text-white/70">Live</span>
        </div>

        <button onClick={() => setShowAdd(true)} className="px-4 py-1 rounded bg-white/5 text-sm hover:bg-white/10 transition">Add Post</button>

        <Link href="#newsletter" className="bg-gradient-to-r from-[#00FFC2] to-[#00D9FF] text-black px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-[#00FFC2]/20 transition-all duration-300">
          Subscribe
        </Link>
      </div>

      {showAdd && <AddPostModal onClose={() => setShowAdd(false)} />}
    </nav>
  );
}
