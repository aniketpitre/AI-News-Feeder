"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, MeshDistortMaterial, Sphere, Float } from '@react-three/drei';
import * as THREE from 'three';
import { ExternalLink, ChevronLeft, ChevronRight, Cpu, Shield, Container, Brain, X } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MockArticle } from '@/lib/mock-articles';
import { useSearchParams, useRouter } from 'next/navigation';
import { normalizeTopic } from '@/lib/normalize-topic';

const CATEGORY_CONFIG: Record<string, { color: string; secondary: string }> = {
  'K8s':       { color: '#00FFC2', secondary: '#004d3d' },
  'DevOps':    { color: '#4FC3F7', secondary: '#003d52' },
  'AI/ML':     { color: '#CE93D8', secondary: '#3d0052' },
  'Cyber SOC': { color: '#FF8A65', secondary: '#521500' },
  'General':   { color: '#aaaaaa', secondary: '#222222' },
};

// ─── 3D Scene ────────────────────────────────────────────────────────────────

function BackgroundOrbs() {
  const orbs = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    pos: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 12, -8 - Math.random() * 6] as [number,number,number],
    size: 0.4 + Math.random() * 1.2,
    color: ['#00FFC2','#4040ff','#CE93D8','#FF8A65'][i % 4],
    speed: 0.3 + Math.random() * 0.4,
    distort: 0.3 + Math.random() * 0.4,
    phase: Math.random() * Math.PI * 2,
  })), []);

  return (
    <>
      {orbs.map((o, i) => (
        <Float key={i} speed={o.speed} floatIntensity={0.5} rotationIntensity={0.3}>
          <Sphere args={[o.size, 32, 32]} position={o.pos}>
            <MeshDistortMaterial
              color={o.color} distort={o.distort} speed={0.5}
              roughness={0.1} metalness={0.7}
              emissive={o.color} emissiveIntensity={0.04}
              transparent opacity={0.12} depthWrite={false}
            />
          </Sphere>
        </Float>
      ))}
    </>
  );
}

function ActiveOrb({ color, intensity }: { color: string; intensity: number }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const targetColor = useMemo(() => new THREE.Color(color), [color]);
  const currentColor = useRef(new THREE.Color(color));

  useFrame((s, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += delta * 0.15;
    mesh.current.rotation.x += delta * 0.07;
    // Color lerp on category change
    currentColor.current.lerp(targetColor, 0.05);
    (mesh.current.material as any).color.copy(currentColor.current);
    (mesh.current.material as any).emissive.copy(currentColor.current);
    if (light.current) light.current.color.copy(currentColor.current);
  });

  return (
    <Float speed={1.2} floatIntensity={0.4} rotationIntensity={0.2}>
      <Sphere ref={mesh} args={[1.6, 128, 128]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color={color} distort={0.35} speed={1.2}
          roughness={0.08} metalness={0.9}
          emissive={color} emissiveIntensity={0.18}
        />
      </Sphere>
      <pointLight ref={light} color={color} intensity={3 * intensity} distance={12} position={[0,0,0]} />
    </Float>
  );
}

function SatelliteDots({ color, count }: { color: string; count: number }) {
  const group = useRef<THREE.Group>(null!);
  useFrame((s, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.25;
      group.current.rotation.x += delta * 0.08;
    }
  });

  const dots = useMemo(() =>
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.4 + (i % 3) * 0.4;
      return {
        pos: [
          Math.cos(angle) * radius,
          Math.sin(i * 0.7) * 0.6,
          Math.sin(angle) * radius,
        ] as [number,number,number],
        size: 0.05 + (i % 3) * 0.03,
      };
    }), [count]);

  return (
    <group ref={group}>
      {dots.map((d, i) => (
        <mesh key={i} position={d.pos}>
          <sphereGeometry args={[d.size, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function RingSystem({ color }: { color: string }) {
  const ring1 = useRef<THREE.Mesh>(null!);
  const ring2 = useRef<THREE.Mesh>(null!);
  useFrame((_, d) => {
    if (ring1.current) ring1.current.rotation.z += d * 0.3;
    if (ring2.current) ring2.current.rotation.z -= d * 0.18;
  });
  const c = useMemo(() => new THREE.Color(color), [color]);
  return (
    <>
      <mesh ref={ring1} rotation={[Math.PI / 2.5, 0, 0]}>
        <torusGeometry args={[2.2, 0.012, 6, 120]} />
        <meshBasicMaterial color={c} transparent opacity={0.25} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 3, 0.3, 0]}>
        <torusGeometry args={[2.8, 0.006, 6, 120]} />
        <meshBasicMaterial color={c} transparent opacity={0.12} />
      </mesh>
    </>
  );
}

function CameraRig({ targetZ }: { targetZ: number }) {
  const { camera } = useThree();
  useFrame((s) => {
    camera.position.x += (s.pointer.x * 0.8 - camera.position.x) * 0.04;
    camera.position.y += (s.pointer.y * 0.5 - camera.position.y) * 0.04;
    camera.position.z += (targetZ - camera.position.z) * 0.06;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Scene3D({ color, panelOpen, articleCount }: { color: string; panelOpen: boolean; articleCount: number }) {
  return (
    <>
      <color attach="background" args={['#030508']} />
      <fog attach="fog" args={['#030508', 15, 40]} />
      <Stars radius={60} depth={40} count={5000} factor={2.5} saturation={0.2} fade speed={0.3} />
      <ambientLight intensity={0.15} />
      <pointLight position={[8, 6, 4]} intensity={0.5} color="#ffffff" />
      <BackgroundOrbs />
      <ActiveOrb color={color} intensity={1} />
      <RingSystem color={color} />
      <SatelliteDots color={color} count={Math.min(articleCount, 12)} />
      <CameraRig targetZ={panelOpen ? 7 : 5.5} />
    </>
  );
}

// ─── Category pill ────────────────────────────────────────────────────────────
const CATS = [
  { name: 'All', icon: null },
  { name: 'DevOps', icon: Container },
  { name: 'K8s', icon: Cpu },
  { name: 'AI/ML', icon: Brain },
  { name: 'Cyber SOC', icon: Shield },
];

// ─── Main component ───────────────────────────────────────────────────────────
function ArticlesContent() {
  const [articles, setArticles] = useState<MockArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [animDir, setAnimDir] = useState<'left'|'right'|null>(null);
  const [visible, setVisible] = useState(true);
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
    if (cat === 'all') return articles;
    return articles.filter(a => a.category.toLowerCase() === cat.toLowerCase());
  }, [articles, cat]);

  const article = filtered[index] ?? null;
  const cfg = article ? (CATEGORY_CONFIG[article.category] ?? CATEGORY_CONFIG.General) : CATEGORY_CONFIG.General;

  const go = useCallback((dir: 'left'|'right') => {
    const next = dir === 'right'
      ? Math.min(filtered.length - 1, index + 1)
      : Math.max(0, index - 1);
    if (next === index) return;
    setAnimDir(dir);
    setVisible(false);
    setPanelOpen(false);
    setTimeout(() => { setIndex(next); setVisible(true); setAnimDir(null); }, 280);
  }, [index, filtered.length]);

  useEffect(() => { setIndex(0); setPanelOpen(false); }, [cat]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  go('left');
      if (e.key === 'ArrowRight') go('right');
      if (e.key === 'Escape') setPanelOpen(false);
      if (e.key === 'Enter' && article) setPanelOpen(true);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go, article]);

  return (
    <div className="relative w-full bg-[#030508] overflow-hidden select-none" style={{ height: 'calc(100vh - 97px)' }}>
      {/* 3D canvas */}
      <Canvas camera={{ position: [0, 0, 5.5], fov: 55 }} className="absolute inset-0">
        <Suspense fallback={null}>
          <Scene3D color={cfg.color} panelOpen={panelOpen} articleCount={filtered.length} />
        </Suspense>
      </Canvas>

      {/* Radial glow under orb */}
      <div className="absolute inset-0 z-[1] pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full transition-all duration-1000"
          style={{ background: `radial-gradient(circle, ${cfg.color}15 0%, transparent 70%)`, filter: 'blur(40px)' }} />
      </div>

      {/* ── TOP HUD ── */}
      <div className="absolute top-5 left-6 z-20 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: cfg.color }}>
            Transmission Archive
          </span>
        </div>
        {!loading && (
          <div className="text-[10px] font-mono text-white/25 uppercase tracking-widest">
            Node {index + 1} / {filtered.length}
          </div>
        )}
      </div>

      {/* Category strip — top right */}
      <div className="absolute top-5 right-6 z-20 flex items-center gap-1.5 bg-black/40 border border-white/8 rounded-full px-3 py-1.5 backdrop-blur-xl">
        {CATS.map(({ name, icon: Icon }) => {
          const active = name === 'All' ? cat === 'all' : cat.toLowerCase() === name.toLowerCase();
          const color = CATEGORY_CONFIG[name]?.color || '#fff';
          return (
            <button key={name} onClick={() => router.push(name === 'All' ? '/articles' : `/articles?category=${name}`)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${active ? 'scale-105' : 'text-white/35 hover:text-white/70'}`}
              style={active ? { color, background: `${color}18` } : {}}>
              {Icon && <Icon className="w-2.5 h-2.5" />}
              {name}
            </button>
          );
        })}
      </div>

      {/* ── ARTICLE CARD — center floating ── */}
      {article && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
          style={{
            paddingRight: panelOpen ? '460px' : '0',
            transition: 'padding 0.5s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div
            className="pointer-events-auto w-full max-w-sm"
            style={{
              opacity: visible ? 1 : 0,
              transform: `translateX(${visible ? 0 : animDir === 'right' ? -40 : 40}px)`,
              transition: 'opacity 0.28s ease, transform 0.28s ease',
            }}
          >
            {/* Main card */}
            <div className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(4,6,14,0.88)',
                border: `1px solid ${cfg.color}35`,
                boxShadow: `0 0 60px ${cfg.color}20, 0 20px 60px rgba(0,0,0,0.7)`,
                backdropFilter: 'blur(24px)',
              }}>
              {/* Colored top bar */}
              <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${cfg.color}, ${cfg.color}40)` }} />

              <div className="p-7">
                {/* Category + date */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border"
                    style={{ color: cfg.color, borderColor: `${cfg.color}40`, background: `${cfg.color}12` }}>
                    {article.category}
                  </span>
                  <span className="text-[9px] font-mono text-white/25">{article.date}</span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-black leading-snug mb-3 tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>
                  {article.title}
                </h2>

                {/* Summary */}
                <p className="text-[12px] text-white/45 leading-relaxed line-clamp-3 mb-5">
                  {article.summary}
                </p>

                {/* Topics */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {article.topics?.slice(0, 3).map((t, i) => (
                    <span key={i} className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ background: `${cfg.color}10`, border: `1px solid ${cfg.color}25`, color: `${cfg.color}cc` }}>
                      {t}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setPanelOpen(true)}
                    className="flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
                    style={{ background: cfg.color, color: '#000', boxShadow: `0 0 20px ${cfg.color}40` }}>
                    Read Article
                  </button>
                  <a href={article.url} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center w-11 rounded-xl transition-all hover:brightness-110 border"
                    style={{ borderColor: `${cfg.color}40`, background: `${cfg.color}10`, color: cfg.color }}>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Pagination dots */}
            <div className="flex items-center justify-center gap-1.5 mt-5">
              {filtered.slice(Math.max(0, index - 4), Math.min(filtered.length, index + 5)).map((_, i) => {
                const realIndex = Math.max(0, index - 4) + i;
                const isActive = realIndex === index;
                return (
                  <button key={realIndex} onClick={() => { setVisible(false); setTimeout(() => { setIndex(realIndex); setVisible(true); }, 280); }}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: isActive ? 20 : 5, height: 5,
                      background: isActive ? cfg.color : 'rgba(255,255,255,0.2)',
                    }} />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── NAV ARROWS ── */}
      <button onClick={() => go('left')} disabled={index === 0}
        className="absolute left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-15 hover:scale-110 active:scale-95"
        style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${cfg.color}30`, backdropFilter: 'blur(12px)', color: cfg.color }}>
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={() => go('right')} disabled={index >= filtered.length - 1}
        className="absolute right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-15 hover:scale-110 active:scale-95"
        style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${cfg.color}30`, backdropFilter: 'blur(12px)', color: cfg.color, right: panelOpen ? '465px' : '20px', transition: 'right 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Keyboard hint */}
      {!panelOpen && article && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="flex items-center gap-3 text-[9px] font-mono text-white/20 uppercase tracking-widest">
            <span>← → Navigate</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Enter to open</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>{filtered.length} transmissions</span>
          </div>
        </div>
      )}

      {/* ── DETAIL PANEL ── */}
      <div
        className="absolute top-0 right-0 bottom-0 z-30 w-full sm:w-[450px] flex flex-col"
        style={{
          transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
          background: 'rgba(3,5,8,0.97)',
          borderLeft: `1px solid ${cfg.color}25`,
          backdropFilter: 'blur(32px)',
        }}>
        {article && (
          <>
            {/* Panel top accent */}
            <div className="h-0.5 w-full shrink-0" style={{ background: `linear-gradient(to right, ${cfg.color}, transparent)` }} />

            <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: cfg.color }}>
                {article.category}
              </span>
              <span className="text-[9px] font-mono text-white/25">{article.date}</span>
              <button onClick={() => setPanelOpen(false)} className="text-white/30 hover:text-white transition-colors bg-white/5 border border-white/10 p-1.5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
              <h2 className="text-xl font-black leading-snug mb-6 text-white">
                {article.title}
              </h2>

              {/* Summary block */}
              <div className="rounded-xl p-5 mb-5 relative overflow-hidden"
                style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}20` }}>
                <div className="absolute top-0 left-0 w-0.5 h-full" style={{ background: cfg.color }} />
                <p className="text-[13px] text-white/65 leading-relaxed pl-3 italic">
                  {article.summary}
                </p>
              </div>

              {/* Full content if available */}
              {article.content && article.content !== article.summary && (
                <p className="text-[12px] text-white/35 leading-relaxed mb-5 line-clamp-6">
                  {article.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                </p>
              )}

              {/* Topics */}
              {article.topics?.length > 0 && (
                <div className="mb-6">
                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest block mb-2">Signal Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {article.topics.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
                        style={{ background: `${cfg.color}10`, border: `1px solid ${cfg.color}20`, color: `${cfg.color}bb` }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Nav inside panel */}
              <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
                <button onClick={() => go('left')} disabled={index === 0}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-20 hover:scale-105"
                  style={{ color: cfg.color }}>
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="text-[9px] font-mono text-white/20">{index + 1} / {filtered.length}</span>
                <button onClick={() => go('right')} disabled={index >= filtered.length - 1}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-20 hover:scale-105"
                  style={{ color: cfg.color }}>
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 shrink-0" style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
              <a href={article.url} target="_blank" rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest py-3.5 rounded-xl text-[11px] text-black transition-all hover:brightness-110 active:scale-95"
                style={{ background: cfg.color, boxShadow: `0 0 32px ${cfg.color}40` }}>
                Access Full Transmission <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </>
        )}
      </div>

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">No transmissions found</p>
            <p className="text-[9px] font-mono text-white/10 mt-1">Switch category or check back later</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Articles() {
  return <Suspense fallback={null}><ArticlesContent /></Suspense>;
}
