"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, MeshDistortMaterial, Sphere, Float } from '@react-three/drei';
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

// ─── 3D Background Scene ──────────────────────────────────────────────────────

function BackgroundOrbs() {
  const orbs = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    pos: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10, -8 - Math.random() * 6] as [number, number, number],
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

// Moons that orbit AROUND the drifting orb on visible elliptical tracks
function OrbitingMoons({ color, orbPos }: { color: string; orbPos: React.MutableRefObject<THREE.Vector3> }) {
  const moons = useMemo(() => [
    { radius: 2.1, tilt: Math.PI / 2.5, tiltZ: 0,    speed: 0.5,  size: 0.08, offset: 0 },
    { radius: 2.1, tilt: Math.PI / 2.5, tiltZ: 0,    speed: 0.5,  size: 0.05, offset: Math.PI },
    { radius: 2.6, tilt: Math.PI / 3,   tiltZ: 0.3,  speed: -0.32, size: 0.1,  offset: Math.PI / 2 },
  ], []);

  return (
    <>
      {moons.map((m, i) => (
        <Moon key={i} {...m} color={color} orbPos={orbPos} />
      ))}
    </>
  );
}

function Moon({ radius, tilt, tiltZ, speed, size, offset, color, orbPos }: {
  radius: number; tilt: number; tiltZ: number; speed: number; size: number; offset: number; color: string;
  orbPos: React.MutableRefObject<THREE.Vector3>;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const trail = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.getElapsedTime() * speed + offset;
    const x = Math.cos(t) * radius;
    const z0 = Math.sin(t) * radius;
    const y1 = z0 * Math.sin(tilt);
    const z1 = z0 * Math.cos(tilt);
    const x2 = x * Math.cos(tiltZ) - y1 * Math.sin(tiltZ);
    const y2 = x * Math.sin(tiltZ) + y1 * Math.cos(tiltZ);
    ref.current.position.set(
      orbPos.current.x + x2,
      orbPos.current.y + y2,
      orbPos.current.z + z1
    );
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} roughness={0.2} metalness={0.6} />
      <pointLight color={color} intensity={0.6} distance={1.8} />
    </mesh>
  );
}

function ActiveOrb({ color, orbPos }: { color: string; orbPos: React.MutableRefObject<THREE.Vector3> }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const group = useRef<THREE.Group>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const targetColor = useMemo(() => new THREE.Color(color), [color]);
  const currentColor = useRef(new THREE.Color(color));

  useFrame((s, delta) => {
    if (!mesh.current || !group.current) return;
    const t = s.clock.getElapsedTime();

    // Visible orbit path — drifts in a wide circular/figure-8 motion
    const px = Math.sin(t * 0.18) * 1.8;
    const py = 0.6 + Math.sin(t * 0.13) * 0.7;
    const pz = -1.5 + Math.cos(t * 0.18) * 1.2;
    group.current.position.set(px, py, pz);
    orbPos.current.set(px, py, pz);

    // Faster self-rotation, clearly visible
    mesh.current.rotation.y += delta * 0.4;
    mesh.current.rotation.x += delta * 0.18;

    currentColor.current.lerp(targetColor, 0.04);
    (mesh.current.material as any).color.copy(currentColor.current);
    (mesh.current.material as any).emissive.copy(currentColor.current);
    if (light.current) light.current.color.copy(currentColor.current);
  });

  return (
    <group ref={group}>
      <Float speed={2} floatIntensity={1.2} rotationIntensity={0.4}>
        <Sphere ref={mesh} args={[1.5, 128, 128]}>
          <MeshDistortMaterial color={color} distort={0.38} speed={1.8} roughness={0.08} metalness={0.9}
            emissive={color} emissiveIntensity={0.15} />
        </Sphere>
        <pointLight ref={light} color={color} intensity={2.5} distance={12} />
      </Float>
    </group>
  );
}

function RingSystem({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null!);
  const ring1 = useRef<THREE.Mesh>(null!);
  const ring2 = useRef<THREE.Mesh>(null!);
  const ring3 = useRef<THREE.Mesh>(null!);
  useFrame((s, d) => {
    if (!group.current) return;
    const t = s.clock.getElapsedTime();
    group.current.position.x = Math.sin(t * 0.18) * 1.8;
    group.current.position.y = 0.6 + Math.sin(t * 0.13) * 0.7;
    group.current.position.z = -1.5 + Math.cos(t * 0.18) * 1.2;
    if (ring1.current) ring1.current.rotation.z += d * 0.25;
    if (ring2.current) ring2.current.rotation.z -= d * 0.15;
    if (ring3.current) ring3.current.rotation.z += d * 0.1;
  });
  const c = useMemo(() => new THREE.Color(color), [color]);
  return (
    <group ref={group}>
      <mesh ref={ring1} rotation={[Math.PI / 2.5, 0, 0]}>
        <torusGeometry args={[2.1, 0.01, 6, 120]} />
        <meshBasicMaterial color={c} transparent opacity={0.22} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 3, 0.3, 0]}>
        <torusGeometry args={[2.6, 0.005, 6, 120]} />
        <meshBasicMaterial color={c} transparent opacity={0.13} />
      </mesh>
      <mesh ref={ring3} rotation={[Math.PI / 2.1, -0.4, 0.2]}>
        <torusGeometry args={[3.1, 0.004, 6, 120]} />
        <meshBasicMaterial color={c} transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

function CameraRig() {
  const { camera } = useThree();
  useFrame((s) => {
    const t = s.clock.getElapsedTime() * 0.02;
    const autoX = Math.sin(t) * 0.6;
    const autoY = Math.cos(t * 0.6) * 0.25;
    const tx = s.pointer.x * 0.5 + autoX;
    const ty = s.pointer.y * 0.3 + autoY;
    camera.position.x += (tx - camera.position.x) * 0.025;
    camera.position.y += (ty - camera.position.y) * 0.025;
    camera.position.z += (6.5 - camera.position.z) * 0.03;
    camera.lookAt(0, 0.4, -1.5);
  });
  return null;
}

function Scene3D({ color }: { color: string }) {
  const orbPos = useRef(new THREE.Vector3(0, 0.6, -1.5));
  return (
    <>
      <color attach="background" args={['#030508']} />
      <fog attach="fog" args={['#030508', 14, 38]} />
      <Stars radius={60} depth={40} count={5000} factor={2.5} saturation={0.2} fade speed={0.3} />
      <ambientLight intensity={0.15} />
      <pointLight position={[8, 6, 4]} intensity={0.4} color="#ffffff" />
      <BackgroundOrbs />
      <ActiveOrb color={color} orbPos={orbPos} />
      <RingSystem color={color} />
      <OrbitingMoons color={color} orbPos={orbPos} />
      <CameraRig />
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

// ─── Article Card ─────────────────────────────────────────────────────────────
function ArticleCard({ article, color, isFocused, onClick, style }: {
  article: MockArticle; color: string; isFocused: boolean; onClick: () => void; style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="shrink-0 text-left rounded-2xl overflow-hidden transition-all duration-300 ease-out"
      style={{
        width: 280,
        background: 'rgba(5,7,14,0.82)',
        border: `1px solid ${isFocused ? color : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isFocused
          ? `0 0 36px ${color}35, 0 16px 40px rgba(0,0,0,0.6)`
          : hovered ? `0 0 20px ${color}20, 0 8px 24px rgba(0,0,0,0.5)` : '0 4px 16px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(18px)',
        transform: isFocused ? 'translateY(-8px) scale(1.02)' : hovered ? 'translateY(-4px)' : 'translateY(0)',
        ...style,
      }}
    >
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, ${color}, transparent)`, opacity: isFocused || hovered ? 1 : 0.3 }} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
            style={{ color, borderColor: `${color}40`, background: `${color}10` }}>
            {article.category}
          </span>
          <span className="text-[8px] font-mono text-white/25">{article.date}</span>
        </div>
        <h3 className="text-[13px] font-black leading-snug mb-2 line-clamp-2"
          style={{ color: isFocused ? color : 'rgba(255,255,255,0.9)' }}>
          {article.title}
        </h3>
        <p className="text-[10.5px] text-white/35 leading-relaxed line-clamp-2">
          {article.summary}
        </p>
        <div className="mt-3 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest"
          style={{ color: isFocused || hovered ? color : 'rgba(255,255,255,0.25)' }}>
          Read More →
        </div>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function ArticlesContent() {
  const [articles, setArticles] = useState<MockArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selected, setSelected] = useState<MockArticle | null>(null);
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
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
    return list;
  }, [articles, cat, search]);

  useEffect(() => { setFocusedIndex(0); setSelected(null); if (scrollRef.current) scrollRef.current.scrollLeft = 0; }, [cat, search]);

  const focusedArticle = filtered[focusedIndex] ?? null;
  const activeColor = focusedArticle ? (CATEGORY_CONFIG[focusedArticle.category]?.color ?? CATEGORY_CONFIG.General.color) : '#00FFC2';

  const scrollByCards = useCallback((dir: 1 | -1) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
  }, []);

  // Track focused card via scroll position
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const center = container.scrollLeft + container.clientWidth / 2;
    let closestIdx = 0;
    let closestDist = Infinity;
    Array.from(container.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(elCenter - center);
      if (dist < closestDist) { closestDist = dist; closestIdx = i; }
    });
    setFocusedIndex(closestIdx);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
      if (e.key === 'ArrowLeft') scrollByCards(-1);
      if (e.key === 'ArrowRight') scrollByCards(1);
      if (e.key === 'Enter' && focusedArticle) setSelected(focusedArticle);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [scrollByCards, focusedArticle]);

  return (
    <div className="relative w-full bg-[#030508] overflow-hidden select-none" style={{ height: 'calc(100vh - 97px)' }}>
      {/* 3D backdrop */}
      <Canvas camera={{ position: [0, 0, 6.5], fov: 55 }} className="absolute inset-0">
        <Suspense fallback={null}>
          <Scene3D color={activeColor} />
        </Suspense>
      </Canvas>

      {/* radial glow */}
      <div className="absolute inset-0 z-[1] pointer-events-none flex items-center justify-center" style={{ marginTop: -60 }}>
        <div className="w-[600px] h-[600px] rounded-full transition-all duration-1000"
          style={{ background: `radial-gradient(circle, ${activeColor}12 0%, transparent 70%)`, filter: 'blur(50px)' }} />
      </div>

      {/* HUD top-left */}
      <div className="absolute top-5 left-6 z-20 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: activeColor }} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: activeColor }}>
            Transmission Archive
          </span>
        </div>
        <div className="text-[10px] font-mono text-white/25 uppercase tracking-widest">
          {loading ? 'Syncing...' : `${filtered.length} transmissions`}
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

      {/* ── Horizontal scrolling cards — bottom anchored ── */}
      {!loading && filtered.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 pt-24"
          style={{ background: 'linear-gradient(to top, rgba(3,5,8,0.85) 20%, transparent 100%)' }}>
          {/* Left/Right arrows */}
          <button onClick={() => scrollByCards(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${activeColor}30`, backdropFilter: 'blur(10px)', color: activeColor }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scrollByCards(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${activeColor}30`, backdropFilter: 'blur(10px)', color: activeColor }}>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Scrollable row */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto no-scrollbar px-[calc(50%-140px)] snap-x snap-mandatory pb-2"
            style={{ scrollBehavior: 'smooth' }}
          >
            {filtered.map((article, i) => {
              const color = CATEGORY_CONFIG[article.category]?.color || '#fff';
              return (
                <div key={article.id} className="snap-center">
                  <ArticleCard
                    article={article}
                    color={color}
                    isFocused={i === focusedIndex}
                    onClick={() => setSelected(article)}
                  />
                </div>
              );
            })}
          </div>

          {/* Counter + hint */}
          <div className="flex items-center justify-center gap-3 mt-4 text-[9px] font-mono text-white/20 uppercase tracking-widest">
            <span>{focusedIndex + 1} / {filtered.length}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>← → Scroll · Enter to Open</span>
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
