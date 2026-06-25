'use client';

/**
 * MetricsMarquee — horizontal live-data scrolling bar.
 *
 * Drop this in components/MetricsMarquee.tsx
 * Insert between the hero section and first category in app/page.tsx,
 * just before the WAYPOINTS.map() render:
 *
 *   <MetricsMarquee articleCounts={articlesByCategory} />
 *
 * Pass in the real counts from HomeContent so they reflect live Firestore data.
 */

interface Props {
  /** Pass articlesByCategory counts from HomeContent */
  counts?: { devops: number; k8s: number; aiml: number; cyber: number; total: number };
}

const METRICS_STATIC = [
  { label: 'NETWORK STATUS',    value: 'ONLINE',      color: '#00FFC2' },
  { label: 'AI ENGINE',         value: 'ACTIVE',       color: '#00FFC2' },
  { label: 'THREAT LEVEL',      value: 'ELEVATED',     color: '#FF8A65' },
  { label: 'FEED SYNC',         value: 'LIVE',         color: '#00FFC2' },
  { label: 'ENCRYPTION',        value: 'AES-256',      color: '#4FC3F7' },
  { label: 'UPTIME',            value: '99.97%',       color: '#00FFC2' },
];

export function MetricsMarquee({ counts }: Props) {
  const devops = counts?.devops ?? 28;
  const k8s    = counts?.k8s   ?? 14;
  const aiml   = counts?.aiml  ?? 41;
  const cyber  = counts?.cyber ?? 19;
  const total  = counts?.total ?? 342;

  const METRICS_DYNAMIC = [
    { label: 'DEVOPS',     value: `↑ ${devops} NEW`,   color: '#4FC3F7' },
    { label: 'K8S',        value: `↑ ${k8s} NEW`,      color: '#00FFC2' },
    { label: 'AI/ML',      value: `↑ ${aiml} NEW`,     color: '#CE93D8' },
    { label: 'CYBER SOC',  value: `↑ ${cyber} NEW`,    color: '#FF8A65' },
    { label: 'TOTAL',      value: `${total} SIGNALS`,  color: '#ffffff' },
  ];

  const items = [...METRICS_STATIC, ...METRICS_DYNAMIC, ...METRICS_STATIC, ...METRICS_DYNAMIC];

  return (
    <div
      className="relative w-full overflow-hidden shrink-0 z-10"
      style={{
        background: 'rgba(0,0,0,0.6)',
        borderTop:    '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        height: 36,
      }}
    >
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.8), transparent)' }} />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.8), transparent)' }} />

      <div
        className="flex items-center h-full whitespace-nowrap"
        style={{ animation: `metricsScroll ${items.length * 3.2}s linear infinite`, willChange: 'transform' }}
      >
        {items.map((m, i) => (
          <span key={i} className="inline-flex items-center gap-2.5 px-5">
            <span className="text-[8px] font-mono text-white/25 uppercase tracking-widest">{m.label}</span>
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: m.color, textShadow: `0 0 8px ${m.color}50` }}
            >
              {m.value}
            </span>
            <span className="text-[7px] text-white/15">◆</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes metricsScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
