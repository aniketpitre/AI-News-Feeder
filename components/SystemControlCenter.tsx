'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Radio, Volume2, VolumeX } from 'lucide-react';
import { TextScramble } from './ui/TextScramble';
import { RevealOnScroll } from './ui/RevealOnScroll';

// -------------------------------------------------------------
// Web Audio API Sound Synthesizer (No external file dependency)
// -------------------------------------------------------------
class AudioSynth {
  private ctx: AudioContext | null = null;
  private ambientHum: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  public enabled: boolean = false;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleAmbient(on: boolean) {
    if (!on) {
      if (this.ambientHum) {
        try {
          this.ambientHum.stop();
        } catch (_) {}
        this.ambientHum = null;
      }
      return;
    }

    try {
      this.init();
      if (!this.ctx) return;

      // Create low ambient grid hum
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A hum
      
      // Filter out high frequencies to make it a deep rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(100, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.015, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      this.ambientHum = osc;
      this.humGain = gain;
    } catch (e) {
      console.error('AudioContext hum failed:', e);
    }
  }

  public playClick(freq = 1200, duration = 0.03, type: OscillatorType = 'sine') {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq / 2, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (_) {}
  }

  public playBeep() {
    this.playClick(880, 0.12, 'triangle');
  }

  public playAlarm() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.15);
      osc.frequency.linearRampToValueAtTime(220, now + 0.3);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.3);
    } catch (_) {}
  }
}

const synth = new AudioSynth();

// -------------------------------------------------------------
// Component Implementation
// -------------------------------------------------------------
export function SystemControlCenter() {
  const [audioOn, setAudioOn] = useState(false);
  const [quantumSync, setQuantumSync] = useState(true);
  const [highSpeedFeed, setHighSpeedFeed] = useState(false);
  const [activeTab, setActiveTab] = useState<'terminal' | 'diagnostics'>('terminal');
  
  // Terminal state
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'SYS_STATUS: AGENT_MESH_ONLINE [v2.1.0]',
    'PORT: 3001 ESTABLISHED (SECURE TLS 1.3)',
    'READY: INPUT OR RUN DIAGNOSTICS SUITE'
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // SVG Chart interaction states
  const [chartHoverVal, setChartHoverVal] = useState<number | null>(null);
  const [chartPos, setChartPos] = useState({ x: 0, y: 0 });
  const chartContainerRef = useRef<SVGSVGElement>(null);

  // Live fluctuating data
  const [metrics, setMetrics] = useState({
    cpu: 24,
    latency: 12,
    syncRate: 98.4
  });

  useEffect(() => {
    // Scroll terminal to bottom
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  useEffect(() => {
    // Fluctuating values
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.max(15, Math.min(85, Math.round(prev.cpu + (Math.random() - 0.5) * 8))),
        latency: Math.max(4, Math.min(32, Math.round(prev.latency + (Math.random() - 0.5) * 4))),
        syncRate: Math.max(92.0, Math.min(99.9, Number((prev.syncRate + (Math.random() - 0.5) * 0.4).toFixed(1))))
      }));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const handleAudioToggle = () => {
    const newState = !audioOn;
    setAudioOn(newState);
    synth.enabled = newState;
    synth.toggleAmbient(newState);
    if (newState) {
      synth.playBeep();
    }
  };

  const executeCommand = (cmd: string) => {
    const cleanCmd = cmd.trim().toLowerCase();
    if (!cleanCmd) return;

    synth.playClick(1000, 0.05, 'sine');
    const newLogs = [...consoleLogs, `tech_sync:~$ ${cmd}`];

    if (cleanCmd === 'clear') {
      setConsoleLogs([]);
      setTerminalInput('');
      return;
    }

    setConsoleLogs([...newLogs, 'executing directive...']);

    setTimeout(() => {
      let response: string[] = [];
      if (cleanCmd.startsWith('diagnose')) {
        synth.playBeep();
        response = [
          '>> RESOLVING LOCAL NETWORK NODES...',
          `>> CPU CORE LOAD: ${metrics.cpu}% (NORMAL)`,
          `>> CLOUD LATENCY: ${metrics.latency}ms (OPTIMAL)`,
          '>> CONSTELLATION MESH: STATUS_ACTIVE',
          '>> STATUS: 0 ERRORS FOUND'
        ];
      } else if (cleanCmd.startsWith('sync')) {
        synth.playBeep();
        response = [
          '>> REQUESTING MUTATION AGENT INJECTOR...',
          '>> RE-ALIGNING HERO WEBGL REFRACTION AXIS...',
          '>> PROTOCOL RESET: SYNCHRONIZATION 100% COMPLETE'
        ];
      } else if (cleanCmd.includes('help')) {
        response = [
          'AVAILABLE PROTOCOLS:',
          '  help               Show interface directives',
          '  diagnose           Initiate full local node integrity check',
          '  sync               Re-align grid systems & WebGL matrices',
          '  clear              Flush secure console logs'
        ];
      } else {
        synth.playAlarm();
        response = [
          `ERR: DIRECTIVE "${cmd}" NOT RECOGNIZED`,
          'ENTER "help" FOR INTERFACE PROTOCOLS'
        ];
      }
      setConsoleLogs(prev => [...prev.slice(0, -1), ...response]);
    }, 600);

    setTerminalInput('');
  };

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = chartContainerRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale position to a coordinate percentage
    const percentX = (x / rect.width) * 100;
    const val = Math.round(30 + (Math.sin(percentX * 0.1) * 20) + (y % 15));
    setChartHoverVal(val);
    setChartPos({ x, y });

    // Synth slide effect
    if (audioOn && Math.random() > 0.85) {
      synth.playClick(600 + val * 10, 0.015, 'sine');
    }
  };

  return (
    <RevealOnScroll className="max-w-7xl mx-auto px-6 py-20 relative z-20">
      <div className="border border-white/10 bg-[#080808]/90 rounded-2xl overflow-hidden backdrop-blur-md shadow-[0_24px_50px_rgba(0,0,0,0.8)]">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/60">
          <div className="flex items-center gap-3">
            <span className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#00FFC2]/80" />
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/40">
              // CORE_DIAGNOSTICS_MODULE
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Audio Toggle */}
            <button
              onClick={handleAudioToggle}
              onMouseEnter={() => synth.playClick(1000, 0.02)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-[9px] font-mono uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                audioOn 
                  ? 'border-[#00FFC2] text-[#00FFC2] bg-[#00FFC2]/5 shadow-[0_0_10px_rgba(0,255,194,0.1)]' 
                  : 'border-white/10 text-white/30 hover:text-white/60 hover:border-white/20'
              }`}
            >
              {audioOn ? (
                <>
                  <Volume2 className="w-3 h-3 animate-pulse" />
                  AUDIO_ON
                </>
              ) : (
                <>
                  <VolumeX className="w-3 h-3" />
                  AUDIO_OFF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modular Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
          
          {/* LEFT SIDE: Diagnostics Control switches & parameters */}
          <div className="lg:col-span-4 p-6 border-r border-white/10 flex flex-col justify-between bg-black/20">
            <div className="space-y-6">
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#00FFC2]">
                // LIVE INTEGRITY CONTROLS
              </h3>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="p-4 border border-white/5 bg-black/40 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-[11px] font-mono text-white/80 font-bold uppercase tracking-wider">Quantum Sync</h4>
                    <p className="text-[9px] font-mono text-white/30 uppercase mt-0.5">Dual-channel feed lock</p>
                  </div>
                  <button
                    onClick={() => {
                      setQuantumSync(!quantumSync);
                      synth.playClick(quantumSync ? 600 : 900, 0.06);
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                      quantumSync ? 'bg-[#00FFC2]' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-black transition-transform duration-200 ${
                      quantumSync ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="p-4 border border-white/5 bg-black/40 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-[11px] font-mono text-white/80 font-bold uppercase tracking-wider">Hyper-Speed Feed</h4>
                    <p className="text-[9px] font-mono text-white/30 uppercase mt-0.5">Sub-second indexing mode</p>
                  </div>
                  <button
                    onClick={() => {
                      setHighSpeedFeed(!highSpeedFeed);
                      synth.playClick(highSpeedFeed ? 600 : 900, 0.06);
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                      highSpeedFeed ? 'bg-[#00FFC2]' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-black transition-transform duration-200 ${
                      highSpeedFeed ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Performance Stats widgets */}
            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#00FFC2]" />
                  SYS CPU
                </span>
                <span className="text-white font-bold">{metrics.cpu}%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#00FFC2] transition-all duration-300" style={{ width: `${metrics.cpu}%` }} />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#00FFC2]" />
                  SYS LATENCY
                </span>
                <span className="text-white font-bold">{metrics.latency}ms</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#00FFC2] transition-all duration-300" style={{ width: `${(metrics.latency / 32) * 100}%` }} />
              </div>
            </div>

          </div>

          {/* MIDDLE / RIGHT SIDE: Terminal & Live Diagnostic Graph */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-black/10">
            
            {/* Tabs Selector */}
            <div className="flex border-b border-white/10 bg-black/40">
              <button
                onClick={() => {
                  setActiveTab('terminal');
                  synth.playClick(800, 0.03);
                }}
                className={`px-6 py-3 text-[10px] font-mono uppercase tracking-[0.2em] border-r border-white/10 transition-colors duration-200 cursor-pointer ${
                  activeTab === 'terminal' ? 'text-[#00FFC2] bg-[#080808]' : 'text-white/30 hover:text-white/60'
                }`}
              >
                // secure_terminal
              </button>
              <button
                onClick={() => {
                  setActiveTab('diagnostics');
                  synth.playClick(800, 0.03);
                }}
                className={`px-6 py-3 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors duration-200 cursor-pointer ${
                  activeTab === 'diagnostics' ? 'text-[#00FFC2] bg-[#080808]' : 'text-white/30 hover:text-white/60'
                }`}
              >
                // node_visualizer
              </button>
            </div>

            {/* TAB CONTENT: Secure Terminal */}
            {activeTab === 'terminal' && (
              <div className="flex-1 flex flex-col justify-between p-6">
                <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar font-mono text-[11px] text-white/60">
                  {consoleLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed">
                      {log.startsWith('tech_sync:') ? (
                        <span className="text-[#00FFC2]">{log}</span>
                      ) : log.startsWith('ERR:') ? (
                        <span className="text-red-400 font-bold">{log}</span>
                      ) : log.startsWith('>>') ? (
                        <span className="text-[#00FFC2]/70 pl-2">{log}</span>
                      ) : (
                        log
                      )}
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>

                {/* Quick Directive Hotlinks */}
                <div className="mt-4 flex flex-wrap gap-2 py-3 border-t border-white/5">
                  <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest self-center mr-1">Directives:</span>
                  {['diagnose', 'sync', 'help', 'clear'].map(c => (
                    <button
                      key={c}
                      onClick={() => executeCommand(c)}
                      onMouseEnter={() => synth.playClick(1100, 0.015)}
                      className="px-2.5 py-1 border border-white/10 hover:border-[#00FFC2]/30 hover:bg-[#00FFC2]/5 rounded text-[9px] font-mono text-white/50 hover:text-[#00FFC2] transition-all duration-200 cursor-pointer"
                    >
                      {c}()
                    </button>
                  ))}
                </div>

                {/* Input Prompt */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    executeCommand(terminalInput);
                  }}
                  className="flex items-center gap-2 border border-white/10 bg-black/40 rounded-xl px-4 py-2 mt-2"
                >
                  <Terminal className="w-3.5 h-3.5 text-[#00FFC2]" />
                  <span className="text-[11px] font-mono text-[#00FFC2]">tech_sync:~$</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder='Enter command (e.g. "diagnose")...'
                    className="flex-1 bg-transparent border-none outline-none text-[11px] font-mono text-white placeholder-white/20 p-0 focus:ring-0 focus:border-none focus:outline-none"
                  />
                </form>
              </div>
            )}

            {/* TAB CONTENT: Interactive Node Visualizer Graph */}
            {activeTab === 'diagnostics' && (
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div className="relative w-full h-[220px] bg-black/40 border border-white/5 rounded-xl overflow-hidden">
                  {/* Interactive Chart */}
                  <svg
                    ref={chartContainerRef}
                    onMouseMove={handleChartMouseMove}
                    onMouseLeave={() => setChartHoverVal(null)}
                    className="w-full h-full cursor-crosshair"
                  >
                    {/* Gridlines */}
                    <line x1="0" y1="55" x2="100%" y2="55" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="110" x2="100%" y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="165" x2="100%" y2="165" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                    {/* Smooth Neon Graph paths */}
                    <path
                      d={`M0,130 C120,60 240,180 360,110 C480,40 600,160 720,120 L840,130`}
                      fill="none"
                      stroke="#00FFC2"
                      strokeWidth="2"
                      className="opacity-70"
                    />

                    {/* Dotted secondary guide path */}
                    <path
                      d={`M0,110 C100,160 220,50 340,140 C460,200 580,70 700,90 L840,110`}
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />

                    {/* Vertical scrub line */}
                    {chartHoverVal !== null && (
                      <>
                        <line
                          x1={chartPos.x}
                          y1="0"
                          x2={chartPos.x}
                          y2="100%"
                          stroke="#00FFC2"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                        <circle
                          cx={chartPos.x}
                          cy={chartPos.y}
                          r="5"
                          fill="#00FFC2"
                          className="animate-pulse shadow-md"
                        />
                      </>
                    )}
                  </svg>

                  {/* Absolute positioning of current hover stats inside graph */}
                  <div className="absolute top-3 left-4 pointer-events-none font-mono text-[9px] text-white/30 uppercase tracking-widest flex items-center gap-4">
                    <span>Signal: <strong className="text-white">Active</strong></span>
                    <span>Node Count: <strong className="text-white">52</strong></span>
                    {chartHoverVal !== null && (
                      <span className="text-[#00FFC2]">
                        Scrub Value: <strong className="text-[#00FFC2] font-black">{chartHoverVal}hz</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mt-4">
                  // Scrub or hover within chart grid to trigger real-time audio synthesis frequencies
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </RevealOnScroll>
  );
}
