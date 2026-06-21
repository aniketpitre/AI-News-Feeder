"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, MeshDistortMaterial, Sphere, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ExternalLink, ChevronLeft, ChevronRight, Cpu, Shield, Container, Brain, X, Search } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MockArticle } from '@/lib/mock-articles';
import { useSearchParams, useRouter } from 'next/navigation';
import { normalizeTopic } from '@/lib/normalize-topic';

const CATEGORY_CONFIG: Record<string, { color: string }> = {
  'K8s':       { color: '#00FFC2' },
  'DevOps':    { color: '#4FC3F7' },
  'AI/ML':     { color: '#CE93D8' },
  'Cyber SOC': { color: '#FF8A65' },
  'General':   { color: '#aaaaaa' },
};

// ─── Background ambient orbs (decorative, far away) ───────────────────────────
function BackgroundOrbs() {
  const orbs = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    pos: [(Math.random() - 0.5) * 22, (Math.random() - 0.5) * 12, -10 - Math.random() * 6] as [number, number, number],
    size: 0.4 + Math.random() * 1.2,
    color: ['#00FFC2', '#4040ff', '#CE93D8', '#FF8A65'][i % 4],
    speed: 0.3 + Math.random() * 0.4,
    distort: 0.3 + Math.random() * 0.4,
  })), []);
  return (
    <>
      {orbs.map((o, i) => (
        <Float key={i} speed={o.speed} floatIntensity={0.5} rotationIntensity={0.3}>
          <Sphere args={[o.size, 32, 32]} position={o.pos}>
            <MeshDistortMaterial color={o.color} distort={o.distort} speed={0.5} roughness={0.1} metalness={0.7}
              emissive={o.color} emissiveIntensity={0.04} transparent opacity={0.1} depthWrite={false} />
          </Sphere>
        </Float>
      ))}
    </>
  );
}

// ─── Central planet ────────────────────────────────────────────────────────────
function Planet({ color }: { color: string }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const targetColor = useMemo(() => new THREE.Color(color), [color]);
  const currentColor = useRef(new THREE.Color(color));

  useFrame((s, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += delta * 0.1;
    mesh.current.rotation.x += delta * 0.04;
    currentColor.current.lerp(targetColor, 0.04);
    (mesh.current.material as any).color.copy(currentColor.current);
    (mesh.current.material as any).emissive.copy(currentColor.current);
    if (light.current) light.current.color.copy(currentColor.current);
  });

  return (
    <Float speed={0.8} floatIntensity={0.25} rotationIntensity={0.1}>
      <Sphere ref={mesh} args={[1.1, 128, 128]}>
        <MeshDistortMaterial color={color} distort={0.3} speed={0.8} roughness={0.08} metalness={0.9}
          emissive={color} emissiveIntensity={0.18} />
      </Sphere>
      <pointLight ref={light} color={color} intensity={2.8} distance={14} />
    </Float>
  );
}

// Decorative inner rings close to the planet
function RingSystem({ color }: { color: string }) {
  const ring1 = useRef<THREE.Mesh>(null!);
  const ring2 = useRef<THREE.Mesh>(null!);
  useFrame((_, d) => {
    if (ring1.current) ring1.current.rotation.z += d * 0.15;
    if (ring2.current) ring2.current.rotation.z -= d * 0.09;
  });
  const c = useMemo(() => new THREE.Color(color), [color]);
  return (
    <>
      <mesh ref={ring1} rotation={[Math.PI / 2.5, 0, 0]}>
        <torusGeometry args={[1.5, 0.006, 6, 120]} />
        <meshBasicMaterial color={c} transparent opacity={0.18} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 3, 0.3, 0]}>
        <torusGeometry args={[1.8, 0.004, 6, 120]} />
        <meshBasicMaterial color={c} transparent opacity={0.1} />
      </mesh>
    </>
  );
}

// ─── Orbiting article card (HTML mounted in 3D space) ─────────────────────────
interface OrbitCardProps {
  article: MockArticle;
  color: string;
  baseAngle: number;
  radius: number;
  yOffset: number;
  tilt: number;
  speedRef: React.MutableRefObject<number>;
  paused: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

function OrbitCard({ article, color, baseAngle, radius, yOffset, tilt, speedRef, paused, isSelected, onSelect }: OrbitCardProps) {
  const group = useRef<THREE.Group>(null!);
  const angleRef = useRef(baseAngle);
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  useFrame((s, delta) => {
    if (!group.current) return;
    if (!paused && !hovered) {
      angleRef.current += delta * speedRef.current;
    }
    const x = Math.cos(angleRef.current) * radius;
    const z0 = Math.sin(angleRef.current) * radius;
    const y = yOffset + z0 * Math.sin(tilt) * 0.35;
    const z = z0 * Math.cos(tilt);
    group.current.position.set(x, y, z);

    // Scale by distance from camera (closer = bigger), and fade by depth
    const dist = camera.position.distanceTo(group.current.position);
    const scale = THREE.MathUtils.clamp(8 / dist, 0.55, 1.25);
    group.current.scale.setScalar(scale);
  });

  const isFront = group.current ? group.current.position.z > 0 : true;

  return (
    <group ref={group}>
      <Html
        center
        distanceFactor={6}
        zIndexRange={[10, 0]}
        occlude={false}
        style={{ pointerEvents: 'auto' }}
      >
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={onSelect}
          className="cursor-pointer select-none"
          style={{
            width: 230,
            opacity: isSelected ? 0 : 1,
            transition: 'opacity 0.3s ease',
          }}
        >
          <div
            className="rounded-xl overflow-hidden transition-all duration-300"
            style={{
              background: 'rgba(5,7,14,0.85)',
              border: `1px solid ${hovered ? color : 'rgba(255,255,255,0.1)'}`,
              boxShadow: hovered ? `0 0 28px ${color}40, 0 12px 32px rgba(0,0,0,0.6)` : '0 4px 16px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(14px)',
              transform: hovered ? 'scale(1.08) translateY(-4px)' : 'scale(1)',
            }}
          >
            <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, ${color}, transparent)`, opacity: hovered ? 1 : 0.35 }} />
            <div className="p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border"
                  style={{ color, borderColor: `${color}40`, background: `${color}10` }}>
                  {article.category}
                </span>
                <span className="text-[7px] font-mono text-white/25">{article.date}</span>
              </div>
              <h3 className="text-[11px] font-black leading-snug line-clamp-2"
                style={{ color: hovered ? color : 'rgba(255,255,255,0.9)' }}>
                {article.title}
              </h3>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

function CameraRig({ paused }: { paused: boolean }) {
  const { camera } = useThree();
  useFrame((s) => {
    const t = s.clock.getElapsedTime() * (paused ? 0.008 : 0.02);
    const autoX = Math.sin(t) * 0.8;
    const autoY = Math.cos(t * 0.6) * 0.3;
    const tx = s.pointer.x * 0.6 + autoX;
    const ty = s.pointer.y * 0.35 + autoY;
    camera.position.x += (tx - camera.position.x) * 0.025;
    camera.position.y += (ty - camera.position.y) * 0.025;
    camera.position.z += (8.5 - camera.position.z) * 0.025;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function OrbitScene({ articles, color, paused, selectedId, onSelect }: {
  articles: MockArticle[]; color: string; paused: boolean; selectedId: string | null; onSelect: (a: MockArticle) => void;
}) {
  const speedRef = useRef(0.06);

  const cardConfigs = useMemo(() => {
    const n = articles.length;
    return articles.map((_, i) => {
      const ring = i % 3; // distribute across 3 orbit rings
      const inRingIdx = Math.floor(i / 3);
      const inRingCount = Math.ceil(n / 3);
      const baseAngle = (inRingIdx / Math.max(inRingCount, 1)) * Math.PI * 2 + ring * 0.6;
      const radius = 4.2 + ring * 1.5;
      const tilt = [Math.PI / 2.5, Math.PI / 3, Math.PI / 2.1][ring];
      const yOffset = [0, 0.4, -0.3][ring];
      return { baseAngle, radius, tilt, yOffset };
    });
  }, [articles]);

  return (
    <>
      <color attach="background" args={['#030508']} />
      <fog attach="fog" args={['#030508', 16, 42]} />
      <Stars radius={60} depth={40} count={5000} factor={2.5} saturation={0.2} fade speed={0.3} />
      <ambientLight intensity={0.15} />
      <pointLight position={[8, 6, 4]} intensity={0.4} color="#ffffff" />
      <BackgroundOrbs />
      <Planet color={color} />
      <RingSystem color={color} />
      {articles.map((article, i) => (
        <OrbitCard
          key={article.id}
          article={article}
          color={CATEGORY_CONFIG[article.category]?.color || color}
          baseAngle={cardConfigs[i].baseAngle}
          radius={cardConfigs[i].radius}
          yOffset={cardConfigs[i].yOffset}
          tilt={cardConfigs[i].tilt}
          speedRef={speedRef}
          paused={paused}
          isSelected={selectedId === article.id}
          onSelect={() => onSelect(article)}
        />
      ))}
      <CameraRig paused={paused} />
    </>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────
const CATS = [
  { name: 'All', icon: null },
  { name: 'DevOps', icon: Container },
  { name: 'K8s', icon: Cpu },
  { name: 'AI/ML', icon: Brain },
  { name: 'Cyber SOC', icon: Shield },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
function ArticlesContent() {
  const [articles, setArticles] = useState<MockArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MockArticle | null>(null);
  const [search, setSearch] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const cat = searchParams.get('category') || 'all';

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, 'articles'), where('status', '==', 'published')));
        if (!snap.empty) {
          const data = snap.docs.map(d => {
            const v = d.data();
            return {
              id: d.id, title: v.title || '', content: v.content || '',
              summary: v.summary || '', topics: v.topics || [], url: v.url || '',
              category: normalizeTopic(v.topics || [], v.sourceName || v.category || ''),
              date: v.publishedAt ? new Date(v.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'TBD',
              publishedAt: v.publishedAt || Date.now(),
            } as MockArticle & { publishedAt: number };
          });
          data.sort((a: any, b: any) => b.publishedAt - a.publishedAt);
          setArticles(data);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = articles;
    if (cat !== 'all') list = list.filter(a => a.category.toLowerCase() === cat.toLowerCase());
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(s));
    }
    return list.slice(0, 18); // cap for perf — orbiting HTML nodes are expensive
  }, [articles, cat, search]);

  useEffect(() => { setSelected(null); }, [cat, search]);

  const activeColor = selected
    ? (CATEGORY_CONFIG[selected.category]?.color ?? CATEGORY_CONFIG.General.color)
    : '#00FFC2';

  // Orbit pauses fully whenever the detail panel is open
  const paused = !!selected;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="relative w-full bg-[#030508] overflow-hidden select-none" style={{ height: 'calc(100vh - 97px)' }}>
      {/* 3D orbit scene — IS the article browser now */}
      <Canvas camera={{ position: [0, 0, 8.5], fov: 55 }} className="absolute inset-0">
        <Suspense fallback={null}>
          <OrbitScene articles={filtered} color={activeColor} paused={paused} selectedId={selected?.id ?? null} onSelect={setSelected} />
        </Suspense>
      </Canvas>

      {/* radial glow */}
      <div className="absolute inset-0 z-[1] pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full transition-all duration-1000"
          style={{ background: `radial-gradient(circle, ${activeColor}10 0%, transparent 70%)`, filter: 'blur(50px)' }} />
      </div>

      {/* HUD top-left */}
      <div className="absolute top-5 left-6 z-20 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: activeColor }} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: activeColor }}>
            Transmission Orbit
          </span>
        </div>
        <div className="text-[10px] font-mono text-white/25 uppercase tracking-widest">
          {loading ? 'Syncing nodes...' : `${filtered.length} transmissions in orbit`}
        </div>
      </div>

      {/* Search + categories — top right */}
      <div className="absolute top-5 right-6 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-black/40 border border-white/8 rounded-full px-2.5 py-1.5 backdrop-blur-xl">
          <Search className="w-3 h-3 text-white/30 shrink-0 ml-1" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="bg-transparent text-[10px] text-white placeholder-white/25 outline-none w-20 font-mono" />
        </div>
        <div className="flex items-center gap-1 bg-black/40 border border-white/8 rounded-full px-2.5 py-1.5 backdrop-blur-xl">
          {CATS.map(({ name, icon: Icon }) => {
            const active = name === 'All' ? cat === 'all' : cat.toLowerCase() === name.toLowerCase();
            const color = CATEGORY_CONFIG[name]?.color || '#fff';
            return (
              <button key={name} onClick={() => router.push(name === 'All' ? '/articles' : `/articles?category=${name}`)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${active ? 'scale-105' : 'text-white/35 hover:text-white/70'}`}
                style={active ? { color, background: `${color}18` } : {}}>
                {Icon && <Icon className="w-2.5 h-2.5" />}
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hint — bottom center */}
      {!selected && !loading && filtered.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="flex items-center gap-3 text-[9px] font-mono text-white/20 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: activeColor }} />
              Orbiting
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Click any node to read</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">No transmissions found</p>
            <p className="text-[9px] font-mono text-white/10 mt-1">Switch category or check back later</p>
          </div>
        </div>
      )}

      {/* ── Detail panel ── */}
      <div
        className="absolute top-0 right-0 bottom-0 z-30 w-full sm:w-[450px] flex flex-col"
        style={{
          transform: selected ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
          background: 'rgba(3,5,8,0.97)',
          borderLeft: `1px solid ${activeColor}25`,
          backdropFilter: 'blur(32px)',
        }}>
        {selected && (() => {
          const color = CATEGORY_CONFIG[selected.category]?.color || '#fff';
          const selIdx = filtered.findIndex(a => a.id === selected.id);
          return (
            <>
              <div className="h-0.5 w-full shrink-0" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
              <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color }}>{selected.category}</span>
                <span className="text-[9px] font-mono text-white/25">{selected.date}</span>
                <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white transition-colors bg-white/5 border border-white/10 p-1.5 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
                <h2 className="text-xl font-black leading-snug mb-6 text-white">{selected.title}</h2>

                <div className="rounded-xl p-5 mb-5 relative overflow-hidden" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                  <div className="absolute top-0 left-0 w-0.5 h-full" style={{ background: color }} />
                  <p className="text-[13px] text-white/65 leading-relaxed pl-3 italic">{selected.summary}</p>
                </div>

                {selected.content && selected.content !== selected.summary && (
                  <p className="text-[12px] text-white/35 leading-relaxed mb-5 line-clamp-6">
                    {selected.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                  </p>
                )}

                {selected.topics?.length > 0 && (
                  <div className="mb-6">
                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest block mb-2">Signal Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.topics.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
                          style={{ background: `${color}10`, border: `1px solid ${color}20`, color: `${color}bb` }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() => { const prev = filtered[Math.max(0, selIdx - 1)]; if (prev) setSelected(prev); }}
                    disabled={selIdx <= 0}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-20 hover:scale-105"
                    style={{ color }}>
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="text-[9px] font-mono text-white/20">{selIdx + 1} / {filtered.length}</span>
                  <button
                    onClick={() => { const next = filtered[Math.min(filtered.length - 1, selIdx + 1)]; if (next) setSelected(next); }}
                    disabled={selIdx >= filtered.length - 1}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-20 hover:scale-105"
                    style={{ color }}>
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-5 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <a href={selected.url} target="_blank" rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest py-3.5 rounded-xl text-[11px] text-black transition-all hover:brightness-110 active:scale-95"
                  style={{ background: color, boxShadow: `0 0 32px ${color}40` }}>
                  Access Full Transmission <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

export default function Articles() {
  return <Suspense fallback={null}><ArticlesContent /></Suspense>;
}
