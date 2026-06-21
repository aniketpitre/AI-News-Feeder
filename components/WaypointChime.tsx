'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { WAYPOINTS } from '@/components/IcebergScene';

/**
 * Igloo.inc locks subtle synth pads / glassy chimes to scroll waypoints for
 * multisensory immersion. We do the same with the Web Audio API — no audio
 * files needed, just a soft sine/triangle bell tone that pitches per
 * category color (mapped to a pleasant ascending scale). Defaults to
 * muted on first load (autoplay policies + good manners); the visitor
 * opts in via the toggle.
 */
export function WaypointChime() {
  const [enabled, setEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastIndexRef = useRef<number>(-1);
  const enabledRef = useRef(enabled);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  const playChime = useCallback((index: number) => {
    if (!enabledRef.current) return;
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        return;
      }
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    // Pentatonic-ish ascending pitch per waypoint for a pleasant "glassy chime" feel
    const baseFreqs = [392, 440, 523.25, 587.33, 659.25, 783.99]; // G4 A4 C5 D5 E5 G5
    const freq = baseFreqs[index % baseFreqs.length];

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    // Soft overtone for a "glassy" timbre
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.01, now);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.015, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    osc.connect(gain).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.7);
    osc2.start(now);
    osc2.stop(now + 1.2);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = Array.from(document.querySelectorAll('[data-waypoint-section]')) as HTMLElement[];
      if (sections.length === 0) return;
      const scrollCenter = window.scrollY + window.innerHeight / 2;
      let closest = 0;
      let minDist = Infinity;
      sections.forEach((el, i) => {
        const center = el.offsetTop + el.offsetHeight / 2;
        const dist = Math.abs(scrollCenter - center);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      if (closest !== lastIndexRef.current) {
        lastIndexRef.current = closest;
        playChime(closest);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [playChime]);

  return (
    <button
      onClick={() => setEnabled(v => !v)}
      className="fixed bottom-5 left-5 sm:left-auto sm:right-5 z-40 flex items-center gap-2 px-3 py-2 rounded-full border backdrop-blur-md transition-all duration-300"
      style={{
        background: 'rgba(5,7,14,0.6)',
        borderColor: enabled ? 'rgba(0,255,194,0.4)' : 'rgba(255,255,255,0.1)',
        color: enabled ? '#00FFC2' : 'rgba(255,255,255,0.4)',
      }}
      aria-label={enabled ? 'Mute ambient chimes' : 'Enable ambient chimes'}
    >
      {enabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
      <span className="text-[8px] font-mono font-black uppercase tracking-[0.2em] hidden sm:inline">
        {enabled ? 'Sound On' : 'Sound Off'}
      </span>
    </button>
  );
}
