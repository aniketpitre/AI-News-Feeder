'use client';

export default function Home() {
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 grid-rows-6 gap-px bg-white/10 h-full overflow-y-auto md:overflow-hidden">
      
      {/* Main Featured Article */}
      <div className="md:col-span-8 md:row-span-4 bg-[#080808] p-10 flex flex-col justify-end relative group min-h-[400px]">
        <div className="absolute top-10 left-10 text-[10px] font-bold tracking-[0.2em] text-[#00FFC2] uppercase mb-4 px-2 py-1 border border-[#00FFC2]">
          Top Story / Infrastructure
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter mb-6">
          KUBERNETES AT EDGE:<br/><span className="text-[#00FFC2]">LLM DEPLOYMENT</span><br/>REDEFINED.
        </h1>
        <div className="flex items-center gap-6">
          <p className="text-white/40 max-w-md text-sm leading-relaxed">
            New automated pipelines are bridging the gap between heavy SOC monitoring and light-weight edge nodes using quantized LLMs for real-time threat detection.
          </p>
          <div className="h-12 w-12 border border-white/20 rounded-full flex items-center justify-center text-[#00FFC2] shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Live RSS Feed/Aggregator Stats */}
      <div className="md:col-span-4 md:row-span-4 bg-[#0A0A0A] p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/50">Live AI Feed Synthesis</h2>
          <span className="text-[10px] text-[#00FFC2] font-mono animate-pulse">SCANNING...</span>
        </div>
        
        <div className="space-y-4 overflow-y-auto flex-1 pb-4">
          {/* Feed Item */}
          <div className="p-4 bg-white/5 border-l-2 border-[#00FFC2] flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase">
              <span>Source: Reuters / Tech</span>
              <span>2m ago</span>
            </div>
            <h3 className="text-sm font-bold leading-snug">NVIDIA Blackwell Architecture: First Benchmarks Released for LLM Training</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded">AI DRAFT READY</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-white/10 text-white/60 rounded">NEEDS HUMAN OVERSIGHT</span>
            </div>
          </div>
          
          <div className="p-4 bg-transparent border-l-2 border-white/10 flex flex-col gap-2 opacity-60">
            <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase">
              <span>Source: arXiv.org</span>
              <span>14m ago</span>
            </div>
            <h3 className="text-sm font-bold leading-snug">Zero-shot Knowledge Distillation in Kubernetes-Native Agents</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded">PROCESSING</span>
            </div>
          </div>

          <div className="p-4 bg-transparent border-l-2 border-white/10 flex flex-col gap-2 opacity-40">
            <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase">
              <span>Source: GitHub / Security</span>
              <span>42m ago</span>
            </div>
            <h3 className="text-sm font-bold leading-snug">Critical Zero-Day in Core DNS Resolution Chains Patch Released</h3>
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-white/10">
          <button className="w-full py-4 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Open Content Studio
          </button>
        </div>
      </div>

      {/* Bottom Section: Secondary News Tiles */}
      <div className="md:col-span-3 md:row-span-2 bg-[#080808] p-6 flex flex-col">
        <span className="text-[9px] font-mono text-[#00FFC2] mb-2 uppercase">Cyber Defense</span>
        <h4 className="text-lg font-bold leading-tight mb-4 group-hover:text-[#00FFC2] transition-colors cursor-pointer">
          SOC Operations: Automating Incident Response with GPT-5 Engines
        </h4>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-[10px] text-white/40">8.2k Views</span>
          <span className="text-[10px] text-white/40">Jun 14</span>
        </div>
      </div>

      <div className="md:col-span-3 md:row-span-2 bg-[#0C0C0C] p-6 flex flex-col">
        <span className="text-[9px] font-mono text-[#00FFC2] mb-2 uppercase">DevOps Culture</span>
        <h4 className="text-lg font-bold leading-tight mb-4 cursor-pointer hover:text-white/80">
          Why Platform Engineering is Swallowing Traditional DevOps Roles in 2024
        </h4>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-[10px] text-white/40">12.5k Views</span>
          <span className="text-[10px] text-white/40">Jun 13</span>
        </div>
      </div>

      <div className="md:col-span-6 md:row-span-2 bg-[#050505] p-6 flex flex-col justify-center relative overflow-hidden">
        {/* Data Visualization Ornament */}
        <div className="absolute right-0 top-0 bottom-0 w-32 flex items-end gap-1 p-2 opacity-20 pointer-events-none">
          <div className="bg-[#00FFC2] w-2 h-1/4"></div>
          <div className="bg-[#00FFC2] w-2 h-2/4"></div>
          <div className="bg-[#00FFC2] w-2 h-3/4"></div>
          <div className="bg-[#00FFC2] w-2 h-1/2"></div>
          <div className="bg-[#00FFC2] w-2 h-full"></div>
        </div>
        
        <div className="flex flex-col gap-2 z-10 relative">
          <div className="text-xs font-bold uppercase tracking-widest text-white">AI System Health</div>
          <div className="grid grid-cols-3 gap-8 mt-2">
            <div>
              <div className="text-2xl font-mono text-[#00FFC2]">99.4%</div>
              <div className="text-[9px] uppercase tracking-wider text-white/40">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-2xl font-mono text-white">1.2s</div>
              <div className="text-[9px] uppercase tracking-wider text-white/40">Synthesis Latency</div>
            </div>
            <div>
              <div className="text-2xl font-mono text-white">4.2k</div>
              <div className="text-[9px] uppercase tracking-wider text-white/40">Sources Scanned</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
