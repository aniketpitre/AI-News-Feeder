'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TextScramble } from './ui/TextScramble';
import { Menu, X } from 'lucide-react';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <nav className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-white/10 shrink-0 sticky top-0 z-50 bg-[#050505]/85 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-xl md:text-2xl font-black tracking-tighter text-[#00FFC2] hover:drop-shadow-[0_0_12px_#00FFC2] transition-all duration-300 hover:scale-105"
            onClick={() => setIsOpen(false)}
          >
            <TextScramble text="TECH_SYNC" trigger="both" />
            <span className="text-white">.</span>
          </Link>
          
          {/* Desktop Links */}
          <div className="hidden md:flex gap-6 text-sm font-medium text-white/60 uppercase tracking-widest">
            <Link href="/" className="text-white border-b-2 border-[#00FFC2] pb-1">
              <TextScramble text="Network" trigger="hover" />
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              <TextScramble text="DevOps" trigger="hover" />
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              <TextScramble text="K8s" trigger="hover" />
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              <TextScramble text="AI/ML" trigger="hover" />
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              <TextScramble text="Cyber SOC" trigger="hover" />
            </Link>
            <Link href="/articles" className="hover:text-white transition-colors ml-4">
              <TextScramble text="Articles" trigger="hover" />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#00FFC2] rounded-full animate-pulse"></span>
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-tighter text-white/80">
              <span className="hidden sm:inline">AI Aggregator: </span>Active
            </span>
          </div>

          {/* Hamburger Menu Toggle (Mobile Only) */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-white hover:text-[#00FFC2] transition-colors p-1"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-[61px] z-40 bg-[#050505]/95 backdrop-blur-lg flex flex-col p-8 md:hidden border-b border-white/10 animate-mobile-menu">
          <div className="flex flex-col gap-6 text-lg font-bold uppercase tracking-widest mt-4">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-[#00FFC2] border-b border-white/5 pb-2 transition-colors"
            >
              <TextScramble text="Network" trigger="both" />
            </Link>
            <Link
              href="#"
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-[#00FFC2] border-b border-white/5 pb-2 transition-colors"
            >
              <TextScramble text="DevOps" trigger="both" />
            </Link>
            <Link
              href="#"
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-[#00FFC2] border-b border-white/5 pb-2 transition-colors"
            >
              <TextScramble text="K8s" trigger="both" />
            </Link>
            <Link
              href="#"
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-[#00FFC2] border-b border-white/5 pb-2 transition-colors"
            >
              <TextScramble text="AI/ML" trigger="both" />
            </Link>
            <Link
              href="#"
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-[#00FFC2] border-b border-white/5 pb-2 transition-colors"
            >
              <TextScramble text="Cyber SOC" trigger="both" />
            </Link>
            <Link
              href="/articles"
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-[#00FFC2] pb-2 transition-colors"
            >
              <TextScramble text="Articles" trigger="both" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
