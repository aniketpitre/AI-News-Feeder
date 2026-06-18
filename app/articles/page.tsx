"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { X, ExternalLink, Calendar, Tag, ArrowLeft, Cpu, Shield, Container, Brain, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MockArticle } from '@/lib/mock-articles';
import { useSearchParams, useRouter } from 'next/navigation';
import { normalizeTopic } from '@/lib/normalize-topic';

const CATEGORY_COLORS: Record<string, string> = {
  'K8s':       '#00FFC2',
  'DevOps':    '#4FC3F7',
  'AI/ML':     '#CE93D8',
  'Cyber SOC': '#FF8A65',
  'General':   '#aaaaaa',
};

// Ambient orbs drifting in background — give the igloo depth feel
function AmbientOrbs() {
  const group = useRef<THREE.Group>(null!);
  useFrame((s) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      child.position.y = Math.sin(s.clock.getElapsedTime() * 0.2 + i * 1.3) * 0.8;
      child.position.x = (child as any)._baseX + Math.cos(s.clock.getElapsedTime() * 0.15 + i) * 0.3;
    });
  });

  const orbs = useMemo(() => [
    { x: -6, y: 1, z: -4, color: '#00FFC2', size: 0.9, distort: 0.5 },
    { x: 7, y: -1, z: -6, color: '#4040ff', size: 1.1, distort: 0.4 },
    { x: -4, y: -2, z: -8, color: '#CE93D8', size: 0.7, distort: 0.6 },
    { x: 5, y: 2, z: -3, color: '#FF8A65', size: 0.5, distort: 0.7 },
    { x: 0, y: 3, z: -10, color: '#00FFC2', size: 1.4, distort: 0.3 },
  ], []);

  return (
    <group ref={group}>
      {orbs.map((o, i) => {
        const mesh = useRef<THREE.Mesh>(null!);
        // store base x for drift
        useEffect(() => { if (mesh.current) (mesh.current as any)._baseX = o.x; }, []);
        return (
          <Sphere key={i} ref={mesh} args={[o.size, 64, 64]} position={[o.x, o.y, o.z]}>
            <MeshDistortMaterial
              color={o.color}
              distort={o.distort}
              speed={0.6}
              roughness={0.1}
              metalness={0.8}
              emissive={o.color}
              emissiveIntensity={0.08}
              transparent
              opacity={0.18}
            />
          </Sphere>
        );
      })}
    </group>
  );
}

// Central glowing core
function Core({ activeColor }: { activeColor: string }) {
  const mesh = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    if (!mesh.current) return;
    mesh.current.scale.setScalar(1 + Math.sin(s.clock.getElapsedTime() * 1.2) * 0.06);
    (mesh.current.material as any).emissiveIntensity = 0.2 + Math.sin(s.clock.getElapsedTime() * 0.8) * 0.1;
  });
  return (
    <Sphere ref={mesh} args={[0.18, 64, 64]} position={[0, 0, 2]}>
      <MeshDistortMaterial
        color={activeColor}
        distort={0.5}
        speed={2}
        roughness={0.05}
        metalness={0.9}
        emissive={activeColor}
        emissiveIntensity={0.3}
      />
      <pointLight color={activeColor} intensity={3} distance={8} />
    </Sphere>
  );
}

// Mouse-reactive camera
function CameraRig({ panelOpen }: { panelOpen: boolean }) {
  const { camera } = useThree();
  useFrame((s) => {
    const tx = panelOpen ? -1.5 : s.pointer.x * 1.2;
    const ty = s.pointer.y * 0.7;
    camera.position.x += (tx - camera.position.x) * 0.04;
    camera.position.y += (ty - camera.position.y) * 0.04;
    camera.position.z += (6 - camera.position.z) * 0.04;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// Particle field — milky way dust
function DustField() {
  const points = useRef<THREE.Points>(null!);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = 800;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;
      const c = new THREE.Color().setHSL(0.5 + Math.random() * 0.3, 0.6, 0.7);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, []);

  useFrame((s) => {
    if (points.current) points.current.rotation.y = s.clock.getElapsedTime() * 0.008;
  });

  return (
    <points ref={points} geometry={geo}>
      <pointsMaterial size={0.04} vertexColors transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

const CATS = [
  { name: 'All', icon: null },
  { name: 'DevOps', icon: Container },
  { name: 'K8s', icon: Cpu },
  { name: 'AI/ML', icon: Brain },
  { name: 'Cyber SOC', icon: Shield },
];

function ArticlesContent() {
  const [articles, setArticles] = useState<MockArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MockArticle | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
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
              id: d.id,
              title: v.title || '',
              content: v.content || '',
              summary: v.summary || '',
              topics: v.topics || [],
              url: v.url || '',
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

  const activeColor = selected ? (CATEGORY_COLORS[selected.category] || '#00FFC2') : '#00FFC2';

  const prev = useCallback(() => setCurrentIndex(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setCurrentIndex(i => Math.min(filtered.length - 1, i + 1)), [filtered.length]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  useEffect(() => { setCurrentIndex(0); }, [cat, search]);

  const visibleArticles = filtered.slice(currentIndex, currentIndex + 6);

  return (
    <div className="relative w-full bg-[#020408] overflow-hidden" style={{ height: 'calc(100vh - 97px)' }}>

      {/* 3D canvas — always full-screen behind */}
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} className="absolute inset-0">
        <Suspense fallback={null}>
          <color attach="background" args={['#020408']} />
          <fog attach="fog" args={['#020408', 12, 35]} />
          <Stars radius={50} depth={30} count={4000} factor={2} saturation={0.2} fade speed={0.2} />
          <ambientLight intensity={0.2} />
          <pointLight position={[0, 5, 3]} intensity={1} color="#00FFC2" />
          <AmbientOrbs />
          <DustField />
          <Core activeColor={activeColor} />
          <CameraRig panelOpen={!!selected} />
        </Suspense>
      </Canvas>

      {/* HUD top-left */}
      <div className="absolute top-5 left-6 z-20 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-[#00FFC2]">Live Network</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none">
          Transmission<br /><span style={{ color: activeColor }}>Archive</span>
        </h1>
        <p className="text-[10px] text-white/30 font-mono mt-1 uppercase tracking-widest">
          {loading ? 'Syncing nodes...' : `${filtered.length} transmissions`}
        </p>
      </div>

      {/* Search — top right */}
      <div className="absolute top-5 right-6 z-20 flex items-center gap-2 bg-black/50 border border-white/10 rounded-full px-4 py-2 backdrop-blur-xl">
        <Search className="w-3.5 h-3.5 text-white/40 shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="bg-transparent text-[11px] text-white placeholder-white/30 outline-none w-32 font-mono"
        />
        {search && <button onClick={() => setSearch('')} className="text-white/30 hover:text-white transition-colors"><X className="w-3 h-3" /></button>}
      </div>

      {/* Article cards — center stage */}
      {!loading && filtered.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl pointer-events-auto">
            {visibleArticles.map((article, i) => {
              const color = CATEGORY_COLORS[article.category] || '#fff';
              const isSelected = selected?.id === article.id;
              return (
                <button
                  key={article.id}
                  onClick={() => setSelected(isSelected ? null : article)}
                  className="group text-left relative rounded-2xl overflow-hidden border transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, rgba(0,0,0,0.85) 0%, ${color}08 100%)`,
                    borderColor: isSelected ? color : 'rgba(255,255,255,0.08)',
                    boxShadow: isSelected ? `0 0 40px ${color}30, inset 0 0 20px ${color}08` : '0 4px 24px rgba(0,0,0,0.6)',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    backdropFilter: 'blur(20px)',
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  {/* Top accent bar */}
                  <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, transparent, ${color}, transparent)`, opacity: isSelected ? 1 : 0.3 }} />

                  <div className="p-5">
                    {/* Category + date row */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                        style={{ color, borderColor: `${color}40`, background: `${color}10` }}>
                        {article.category}
                      </span>
                      <span className="text-[9px] font-mono text-white/30">{article.date}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-black leading-snug mb-2 line-clamp-2 group-hover:text-white transition-colors"
                      style={{ color: isSelected ? color : 'rgba(255,255,255,0.9)' }}>
                      {article.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">
                      {article.summary}
                    </p>

                    {/* Bottom row */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex gap-1">
                        {article.topics?.slice(0, 2).map((t, ti) => (
                          <span key={ti} className="text-[8px] font-bold uppercase tracking-wider text-white/25 bg-white/5 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
                        Read →
                      </span>
                    </div>
                  </div>

                  {/* Hover glow bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(to right, transparent, ${color}60, transparent)` }} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination — bottom center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        {/* Category pills */}
        <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-xl">
          {CATS.map(({ name, icon: Icon }) => {
            const active = name === 'All' ? cat === 'all' : cat.toLowerCase() === name.toLowerCase();
            const color = CATEGORY_COLORS[name] || '#fff';
            return (
              <button
                key={name}
                onClick={() => { setSelected(null); router.push(name === 'All' ? '/articles' : `/articles?category=${name}`); }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
                  active ? 'scale-105' : 'text-white/40 hover:text-white/70'
                }`}
                style={active ? { color, background: `${color}15` } : {}}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {name}
              </button>
            );
          })}
        </div>

        {/* Nav arrows */}
        {filtered.length > 6 && (
          <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-xl">
            <button onClick={prev} disabled={currentIndex === 0}
              className="text-white/40 hover:text-white disabled:opacity-20 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[9px] font-mono text-white/40 w-16 text-center">
              {currentIndex + 1}–{Math.min(currentIndex + 6, filtered.length)} / {filtered.length}
            </span>
            <button onClick={next} disabled={currentIndex + 6 >= filtered.length}
              className="text-white/40 hover:text-white disabled:opacity-20 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Article detail panel */}
      <div className={`absolute top-0 right-0 bottom-0 z-30 w-full sm:w-[460px] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${selected ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'rgba(4,4,10,0.97)', borderLeft: `1px solid ${activeColor}25`, backdropFilter: 'blur(24px)' }}>
        {selected && (
          <>
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: `1px solid ${activeColor}20` }}>
              <button onClick={() => setSelected(null)}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                style={{ color: activeColor }}>
                <Tag className="w-3 h-3" /> {selected.category}
              </span>
              <button onClick={() => setSelected(null)}
                className="text-white/40 hover:text-white bg-white/5 border border-white/10 p-1.5 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Accent line */}
            <div className="h-0.5 w-full shrink-0" style={{ background: `linear-gradient(to right, ${activeColor}, transparent)` }} />

            <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-3 h-3 text-white/30" />
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{selected.date}</span>
              </div>

              <h2 className="text-xl font-black tracking-tight leading-snug mb-6" style={{ color: 'white' }}>
                {selected.title}
              </h2>

              {/* Summary */}
              <div className="rounded-xl p-5 mb-5 relative overflow-hidden"
                style={{ background: `${activeColor}08`, border: `1px solid ${activeColor}25` }}>
                <div className="absolute top-0 left-0 w-0.5 h-full" style={{ background: activeColor }} />
                <p className="text-sm text-white/65 leading-relaxed pl-3">{selected.summary}</p>
              </div>

              {/* Topics */}
              {selected.topics?.length > 0 && (
                <div className="mb-5">
                  <span className="text-[8px] font-bold text-white/25 uppercase tracking-widest mb-2 block">Signal Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.topics.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
                        style={{ background: `${activeColor}10`, border: `1px solid ${activeColor}20`, color: activeColor }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="w-full h-px my-5" style={{ background: `linear-gradient(to right, ${activeColor}30, transparent)` }} />

              {/* Source info */}
              <p className="text-[11px] text-white/25 leading-relaxed">
                Transmission sourced from external network. Full content available at origin node.
              </p>
            </div>

            <div className="px-6 py-5 shrink-0" style={{ borderTop: `1px solid ${activeColor}15` }}>
              <a href={selected.url} target="_blank" rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest py-3.5 rounded-xl transition-all text-[11px] text-black hover:brightness-110 active:scale-95"
                style={{ background: activeColor, boxShadow: `0 0 32px ${activeColor}40` }}>
                Access Full Transmission <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Articles() {
  return <Suspense fallback={null}><ArticlesContent /></Suspense>;
}
