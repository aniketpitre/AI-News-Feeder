import Link from 'next/link';

export function Navigation() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10 shrink-0">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-2xl font-black tracking-tighter text-[#00FFC2]">
          TECH_SYNC<span className="text-white">.</span>
        </Link>
        <div className="hidden md:flex gap-6 text-sm font-medium text-white/60 uppercase tracking-widest">
          <Link href="/" className="text-white border-b-2 border-[#00FFC2] pb-1">Network</Link>
          <Link href="#" className="hover:text-white transition-colors">DevOps</Link>
          <Link href="#" className="hover:text-white transition-colors">K8s</Link>
          <Link href="#" className="hover:text-white transition-colors">AI/ML</Link>
          <Link href="#" className="hover:text-white transition-colors">Cyber SOC</Link>
        <Link href="/articles" className="hover:text-white transition-colors ml-4">Articles</Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 bg-[#00FFC2] rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">AI Aggregator: Active</span>
        </div>
        <div className="bg-[#00FFC2] text-black px-4 py-1.5 rounded-full text-xs font-bold uppercase">Review Queue (14)</div>
      </div>
    </nav>
  );
}
