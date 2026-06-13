import Link from 'next/link';
import { TextScramble } from './ui/TextScramble';

export function Navigation() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10 shrink-0 sticky top-0 z-50 bg-[#050505]/80 backdrop-blur">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-2xl font-black tracking-tighter text-[#00FFC2] hover:drop-shadow-[0_0_12px_#00FFC2] transition-all duration-300 hover:scale-105">
          <TextScramble text="TECH_SYNC" trigger="both" />
          <span className="text-white">.</span>
        </Link>
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
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
        <span className="w-2 h-2 bg-[#00FFC2] rounded-full animate-pulse"></span>
        <span className="text-[10px] font-bold uppercase tracking-tighter">
          <TextScramble text="AI Aggregator: Active" trigger="mount" />
        </span>
      </div>
    </nav>
  );
}

