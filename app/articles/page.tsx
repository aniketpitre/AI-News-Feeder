"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { X, ExternalLink, Calendar, Tag, ArrowLeft, Cpu, Shield, Container, Brain, Search } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MockArticle } from '@/lib/mock-articles';
import { TextScramble } from '@/components/ui/TextScramble';
import { useSearchParams, useRouter } from 'next/navigation';
import { normalizeTopic } from '@/lib/normalize-topic';

const CATEGORY_COLORS: Record<string, string> = {
  'K8s':       '#00FFC2',
  'DevOps':    '#4FC3F7',
  'AI/ML':     '#CE93D8',
  'Cyber SOC': '#FF8A65',
  'General':   '#aaaaaa',
};

// Deterministic galaxy spiral positions — tighter, more centered
function useGalaxyPositions(count: number) {
  return useMemo(() => {
    const rand = (() => {
      let s = 42;
      return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    })();
    return Array.from({ length: count }, (_, i) => {
      const arms = 3;
      const arm = i % arms;
      const posInArm = Math.floor(i / arms);
      const t = (posInArm / Math.max(Math.ceil(count / arms), 1)) * Math.PI * 3;
      const radius = 1.5 + t * 1.2;
      const angle = t + (arm * Math.PI * 2) / arms;
      const x = Math.cos(angle) * radius + (rand() - 0.5) * 0.4;
      const y = (rand() - 0.5) * 1.8;
      const z = Math.sin(angle) * radius + (rand() - 0.5) * 0.4;
      return [x, y, z] as [number, number, number];
    });
  }, [count]);
}

function GalaxyCore() {
  const mesh = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    if (mesh.current) mesh.current.scale.setScalar(1 + Math.sin(s.clock.getElapsedTime() * 0.8) * 0.1);
  });
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.25, 32, 32]} />
      <meshBasicMaterial color="#00FFC2" transparent opacity={0.7} />
      <pointLight intensity={4} distance={6} color="#00FFC2" />
    </mesh>
  );
}

function NebulaClouds() {
  const g = useRef<THREE.Group>(null!);
  useFrame((_, d) => { if (g.current) g.current.rotation.y += d * 0.008; });
  return (
    <group ref={g}>
      {[['#00FFC2', 7, 0], ['#4040ff', -6, 1], ['#ff40a0', 5, -1]].map(([col, x, z], i) => (
        <mesh key={i} position={[Number(x), (i - 1) * 1.5, Number(z)]}>
          <planeGeometry args={[10, 7]} />
          <meshBasicMaterial color={col as string} transparent opacity={0.025} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function ConstellationLines({ positions, colors }: { positions: [number, number, number][]; colors: string[] }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    const cols: number[] = [];
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const d = Math.hypot(...positions[i].map((v, k) => v - positions[j][k]) as [number, number, number]);
        if (d < 3.2) {
          pts.push(...positions[i], ...positions[j]);
          const c1 = new THREE.Color(colors[i]);
          const c2 = new THREE.Color(colors[j]);
          cols.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    return g;
  }, [positions, colors]);

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial vertexColors transparent opacity={0.25} depthWrite={false} />
    </lineSegments>
  );
}

function ArticleNode({ article, position, selected, onSelect }: {
  article: MockArticle; position: [number, number, number]; selected: boolean; onSelect: () => void;
}) {
  const mesh = useRef<THREE.Mesh>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS[article.category] || '#fff';
  const baseY = position[1];

  useFrame((s, d) => {
    if (!mesh.current) return;
    mesh.current.position.y = baseY + Math.sin(s.clock.getElapsedTime() * 0.7 + position[0]) * 0.1;
    const target = selected ? 1.6 : hovered ? 1.25 : 1.0;
    mesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
    if (ring.current) {
      ring.current.rotation.z += d * (selected ? 2 : hovered ? 1 : 0.4);
      ring.current.position.y = mesh.current.position.y;
      ring.current.scale.lerp(new THREE.Vector3(target, target, 1), 0.12);
    }
  });

  return (
    <group position={[position[0], position[1], position[2]]}>
      <mesh ref={ring}>
        <torusGeometry args={[0.28, 0.015, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 1 : hovered ? 0.7 : 0.3} />
      </mesh>

      <mesh
        ref={mesh}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 2.5 : hovered ? 1.5 : 0.7}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      <pointLight color={color} intensity={selected ? 2.5 : hovered ? 1.2 : 0.4} distance={3} />

      {/* Label — always visible, bigger */}
      <Html position={[0, 0.38, 0]} center distanceFactor={5} zIndexRange={[0, 5]}>
        <div className="pointer-events-none select-none text-center" style={{ minWidth: 120 }}>
          <div
            className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border whitespace-nowrap"
            style={{ color, borderColor: `${color}60`, background: `${color}15`, textShadow: `0 0 8px ${color}` }}
          >
            {article.category}
          </div>
          <div
            className="text-[8px] font-bold text-white/80 mt-0.5 leading-tight whitespace-nowrap"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,1)', maxWidth: 140 }}
          >
            {article.title.length > 32 ? article.title.substring(0, 32) + '…' : article.title}
          </div>
        </div>
      </Html>
    </group>
  );
}

function GalaxyCamera() {
  const { camera } = useThree();
  useFrame((s) => {
    const t = s.clock.getElapsedTime() * 0.03;
    const tx = s.pointer.x * 1.5 + Math.sin(t) * 1.5;
    const ty = s.pointer.y * 1.0;
    const tz = 11 + Math.cos(t * 0.7) * 0.8;
    camera.position.x += (tx - camera.position.x) * 0.035;
    camera.position.y += (ty - camera.position.y) * 0.035;
    camera.position.z += (tz - camera.position.z) * 0.035;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function GalaxyScene({ articles, selectedId, onSelect }: {
  articles: MockArticle[]; selectedId: string | null; onSelect: (a: MockArticle) => void;
}) {
  const positions = useGalaxyPositions(articles.length);
  const colors = articles.map(a => CATEGORY_COLORS[a.category] || '#fff');

  return (
    <>
      <color attach="background" args={['#020408']} />
      <fog attach="fog" args={['#020408', 18, 40]} />
      <Stars radius={55} depth={35} count={6000} factor={2.8} saturation={0.2} fade speed={0.25} />
      <ambientLight intensity={0.25} />
      <GalaxyCore />
      <NebulaClouds />
      <ConstellationLines positions={positions} colors={colors} />
      {articles.map((a, i) => (
        <ArticleNode key={a.id} article={a} position={positions[i]} selected={a.id === selectedId} onSelect={() => onSelect(a)} />
      ))}
      <GalaxyCamera />
    </>
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
  const [search, setSearch] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const cat = searchParams.get('category') || 'all';

  useEffect(() => {
    async function fetch_() {
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
    fetch_();
  }, []);

  const filtered = useMemo(() => {
    let list = articles;
    if (cat !== 'all') list = list.filter(a => a.category.toLowerCase() === cat.toLowerCase());
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(s) || a.category.toLowerCase().includes(s));
    }
    return list;
  }, [articles, cat, search]);

  return (
    <div className="relative w-full bg-[#020408] overflow-hidden" style={{ height: 'calc(100vh - 97px)' }}>
      <Canvas camera={{ position: [0, 0, 11], fov: 55 }} className="absolute inset-0">
        <Suspense fallback={null}>
          <GalaxyScene articles={filtered} selectedId={selected?.id ?? null} onSelect={setSelected} />
        </Suspense>
      </Canvas>

      {/* HUD */}
      <div className="absolute top-5 left-6 z-20 pointer-events-none">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter drop-shadow-[0_2px_16px_rgba(0,0,0,1)]">
          Transmission <span className="text-[#00FFC2]">Galaxy</span>
        </h1>
        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1 font-mono">
          {loading ? 'Loading nodes...' : `${filtered.length} nodes in the network`}
        </p>
      </div>

      {/* Search */}
      <div className="absolute top-5 right-6 z-20 flex items-center gap-2 bg-black/60 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md">
        <Search className="w-3.5 h-3.5 text-white/40 shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search transmissions..."
          className="bg-transparent text-[11px] text-white placeholder-white/30 outline-none w-40 font-mono"
        />
      </div>

      {/* Category pills */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md">
        {CATS.map(({ name, icon: Icon }) => {
          const active = name === 'All' ? cat === 'all' : cat.toLowerCase() === name.toLowerCase();
          const color = CATEGORY_COLORS[name] || '#fff';
          return (
            <button
              key={name}
              onClick={() => { setSelected(null); router.push(name === 'All' ? '/articles' : `/articles?category=${name}`); }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-200 border ${
                active ? 'border-current bg-current/10 scale-105' : 'border-transparent text-white/40 hover:text-white/70'
              }`}
              style={active ? { color, borderColor: color } : {}}
            >
              {Icon && <Icon className="w-3 h-3" />}
              {name}
            </button>
          );
        })}
      </div>

      {!selected && !loading && filtered.length > 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-pulse">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Click any star to read</span>
        </div>
      )}

      {/* Slide panel */}
      <div className={`absolute top-0 right-0 bottom-0 z-30 w-full sm:w-[480px] bg-[#070707]/96 border-l border-white/10 backdrop-blur-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${selected ? 'translate-x-0' : 'translate-x-full'}`}>
        {selected && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
              <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Galaxy
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: CATEGORY_COLORS[selected.category] || '#fff' }}>
                <Tag className="w-3 h-3" /> {selected.category}
              </span>
              <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white bg-white/5 border border-white/10 p-1.5 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-white/40 uppercase tracking-widest mb-4">
                <Calendar className="w-3 h-3" /> {selected.date}
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug mb-5">
                <TextScramble text={selected.title} trigger="both" />
              </h2>
              <div className="rounded-2xl p-5 mb-5 border" style={{ backgroundColor: `${CATEGORY_COLORS[selected.category]}0d`, borderColor: `${CATEGORY_COLORS[selected.category]}33` }}>
                <p className="text-sm text-white/70 leading-relaxed italic">"{selected.summary}"</p>
              </div>
              {selected.topics?.length > 0 && (
                <div className="mb-5">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2 block">Topics</span>
                  <div className="flex flex-wrap gap-2">
                    {selected.topics.map((t, i) => (
                      <span key={i} className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider text-white/50">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="w-full h-px mb-5" style={{ background: `linear-gradient(to right, transparent, ${CATEGORY_COLORS[selected.category]}40, transparent)` }} />
              <p className="text-xs text-white/30 leading-relaxed">This article is sourced externally. Click below to read the full story.</p>
            </div>

            <div className="px-6 py-5 border-t border-white/10 shrink-0">
              <a
                href={selected.url} target="_blank" rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest py-3.5 rounded-xl transition-all text-[11px] text-black hover:brightness-110"
                style={{ backgroundColor: CATEGORY_COLORS[selected.category] || '#00FFC2', boxShadow: `0 0 28px ${CATEGORY_COLORS[selected.category]}50` }}
              >
                Read Full Article <ExternalLink className="w-3.5 h-3.5" />
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
