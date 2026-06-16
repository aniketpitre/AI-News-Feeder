"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { X, ExternalLink, Calendar, Tag, ArrowLeft, Cpu, Shield, Container, Brain, Search } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mockArticles, MockArticle } from '@/lib/mock-articles';
import { TextScramble } from '@/components/ui/TextScramble';
import { useSearchParams, useRouter } from 'next/navigation';
import { normalizeTopic } from '@/lib/normalize-topic';

// Category color map
const CATEGORY_COLORS: Record<string, string> = {
  'K8s':       '#00FFC2',
  'DevOps':    '#4FC3F7',
  'AI/ML':     '#CE93D8',
  'Cyber SOC': '#FF8A65',
  'General':   '#ffffff',
};

// Distribute articles in a galaxy spiral pattern
function galaxyPosition(index: number, total: number): [number, number, number] {
  const arms = 3;
  const arm = index % arms;
  const posInArm = Math.floor(index / arms);
  const t = (posInArm / Math.max(total / arms, 1)) * Math.PI * 4;
  const radius = 2.5 + t * 1.8;
  const angle = t + (arm * Math.PI * 2) / arms;
  const spread = 0.6;
  const x = Math.cos(angle) * radius + (Math.random() - 0.5) * spread;
  const y = (Math.random() - 0.5) * 2.5;
  const z = Math.sin(angle) * radius + (Math.random() - 0.5) * spread;
  return [x, y, z];
}

// Seeded deterministic positions (avoid re-randomising on re-render)
function useGalaxyPositions(count: number) {
  return useMemo(() => {
    const rng = (seed: number) => {
      let s = seed;
      return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    };
    const rand = rng(42);
    return Array.from({ length: count }, (_, i) => {
      const arms = 3;
      const arm = i % arms;
      const posInArm = Math.floor(i / arms);
      const t = (posInArm / Math.max(count / arms, 1)) * Math.PI * 4;
      const radius = 2.5 + t * 1.8;
      const angle = t + (arm * Math.PI * 2) / arms;
      const x = Math.cos(angle) * radius + (rand() - 0.5) * 0.6;
      const y = (rand() - 0.5) * 2.5;
      const z = Math.sin(angle) * radius + (rand() - 0.5) * 0.6;
      return [x, y, z] as [number, number, number];
    });
  }, [count]);
}

// Nebula fog planes drifting in background
function NebulaClouds() {
  const group = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.01;
  });
  return (
    <group ref={group}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos(i * 2.1) * 8, (i - 1) * 2, Math.sin(i * 2.1) * 8]}>
          <planeGeometry args={[12, 8]} />
          <meshBasicMaterial
            color={i === 0 ? '#00FFC2' : i === 1 ? '#4040ff' : '#ff4080'}
            transparent opacity={0.018}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// Galaxy core glow
function GalaxyCore() {
  const mesh = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.scale.setScalar(1 + Math.sin(state.clock.getElapsedTime() * 0.8) * 0.08);
    }
  });
  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshBasicMaterial color="#00FFC2" transparent opacity={0.6} />
      <pointLight intensity={3} distance={8} color="#00FFC2" />
    </mesh>
  );
}

// Single article node — glowing orb
function ArticleNode({
  article, position, selected, onSelect,
}: {
  article: MockArticle;
  position: [number, number, number];
  selected: boolean;
  onSelect: () => void;
}) {
  const mesh = useRef<THREE.Mesh>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS[article.category] || '#ffffff';

  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 0.6 + position[0]) * 0.12;
    const targetScale = selected ? 1.5 : hovered ? 1.2 : 1.0;
    mesh.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    if (ring.current) {
      ring.current.rotation.z += delta * (selected ? 1.5 : 0.5);
      ring.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), 0.1);
    }
  });

  return (
    <group position={position}>
      {/* Outer ring */}
      <mesh ref={ring}>
        <torusGeometry args={[0.22, 0.012, 8, 48]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.9 : hovered ? 0.6 : 0.2} />
      </mesh>

      {/* Core orb */}
      <mesh
        ref={mesh}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[0.14, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 2 : hovered ? 1.2 : 0.6}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Point light per node */}
      <pointLight intensity={selected ? 2 : hovered ? 1 : 0.3} distance={3} color={color} />

      {/* Floating label */}
      <Html
        position={[0, 0.28, 0]}
        center
        distanceFactor={6}
        occlude
        zIndexRange={[0, 10]}
      >
        <div
          className="pointer-events-none select-none text-center"
          style={{ opacity: hovered || selected ? 1 : 0.5, transition: 'opacity 0.3s' }}
        >
          <div className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap px-2 py-0.5 rounded-full"
            style={{ color, textShadow: `0 0 8px ${color}` }}>
            {article.category}
          </div>
          <div className="text-[7px] font-bold text-white/70 whitespace-nowrap max-w-[120px] leading-tight mt-0.5 truncate"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
            {article.title.substring(0, 30)}{article.title.length > 30 ? '…' : ''}
          </div>
        </div>
      </Html>
    </group>
  );
}

// Camera that drifts and follows mouse
function GalaxyCamera({ target }: { target: [number, number, number] | null }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 14));

  useFrame((state, delta) => {
    // Mouse parallax
    const mx = state.pointer.x * 1.2;
    const my = state.pointer.y * 0.8;
    targetPos.current.x += (mx - targetPos.current.x) * 0.03;
    targetPos.current.y += (my - targetPos.current.y) * 0.03;

    // Slow auto-drift rotation
    const t = state.clock.getElapsedTime() * 0.04;
    const autoX = Math.sin(t) * 2;
    const autoZ = 14 + Math.cos(t * 0.5) * 1;

    camera.position.x += (targetPos.current.x + autoX - camera.position.x) * 0.04;
    camera.position.y += (targetPos.current.y - camera.position.y) * 0.04;
    camera.position.z += (autoZ - camera.position.z) * 0.04;

    if (target) {
      const lookTarget = new THREE.Vector3(...target);
      const currentLook = new THREE.Vector3();
      camera.getWorldDirection(currentLook);
      camera.lookAt(lookTarget.lerp(new THREE.Vector3(0, 0, 0), 0.3));
    } else {
      camera.lookAt(0, 0, 0);
    }
  });
  return null;
}

// Connection lines between nearby nodes
function ConstellationLines({ positions, colors }: { positions: [number,number,number][]; colors: string[] }) {
  const linesRef = useRef<THREE.LineSegments>(null!);

  const { geometry, lineColors } = useMemo(() => {
    const pts: number[] = [];
    const cols: number[] = [];
    const maxDist = 3.5;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[i][0] - positions[j][0];
        const dy = positions[i][1] - positions[j][1];
        const dz = positions[i][2] - positions[j][2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < maxDist) {
          pts.push(...positions[i], ...positions[j]);
          const c1 = new THREE.Color(colors[i]);
          const c2 = new THREE.Color(colors[j]);
          cols.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    return { geometry: geo, lineColors: cols };
  }, [positions, colors]);

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.12} depthWrite={false} />
    </lineSegments>
  );
}

function GalaxyScene({
  articles,
  selectedId,
  onSelect,
}: {
  articles: MockArticle[];
  selectedId: string | null;
  onSelect: (a: MockArticle) => void;
}) {
  const positions = useGalaxyPositions(articles.length);
  const colors = articles.map(a => CATEGORY_COLORS[a.category] || '#ffffff');
  const selectedArticle = articles.find(a => a.id === selectedId);
  const selectedPos = selectedArticle ? positions[articles.indexOf(selectedArticle)] : null;

  return (
    <>
      <color attach="background" args={['#020408']} />
      <fog attach="fog" args={['#020408', 20, 45]} />
      <Stars radius={60} depth={40} count={5000} factor={2.5} saturation={0.3} fade speed={0.3} />
      <ambientLight intensity={0.3} />
      <GalaxyCore />
      <NebulaClouds />
      <ConstellationLines positions={positions} colors={colors} />
      {articles.map((article, i) => (
        <ArticleNode
          key={article.id}
          article={article}
          position={positions[i]}
          selected={article.id === selectedId}
          onSelect={() => onSelect(article)}
        />
      ))}
      <GalaxyCamera target={selectedPos ?? null} />
    </>
  );
}

const CATEGORIES = [
  { name: 'All', icon: null },
  { name: 'DevOps', icon: Container },
  { name: 'K8s', icon: Cpu },
  { name: 'AI/ML', icon: Brain },
  { name: 'Cyber SOC', icon: Shield },
];

function ArticlesContent() {
  const [articles, setArticles] = useState<MockArticle[]>(mockArticles);
  const [selectedArticle, setSelectedArticle] = useState<MockArticle | null>(null);
  const [search, setSearch] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCategory = searchParams.get('category') || 'all';

  useEffect(() => {
    async function fetchArticles() {
      try {
        const q = query(collection(db, 'articles'), where('status', '==', 'published'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const fetched = snapshot.docs.map(doc => {
            const data = doc.data();
            const rawDate = data.publishedAt
              ? new Date(data.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : data.date || 'TBD';
            return {
              id: doc.id,
              title: data.title || '',
              content: data.content || '',
              summary: data.summary || '',
              topics: data.topics || ['General'],
              url: data.url || '',
              category: normalizeTopic(data.topics || [], data.sourceName || data.category || ''),
              date: rawDate,
              publishedAt: data.publishedAt || Date.now(),
            } as MockArticle & { publishedAt: number };
          });
          fetched.sort((a: any, b: any) => b.publishedAt - a.publishedAt);
          setArticles(fetched);
        }
      } catch (err) {
        console.error("Firestore error, falling back to mocks", err);
      }
    }
    fetchArticles();
  }, []);

  const filteredArticles = useMemo(() => {
    let list = articles;
    if (activeCategory !== 'all') {
      list = list.filter(a => a.category.toLowerCase() === activeCategory.toLowerCase());
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(s) || a.category.toLowerCase().includes(s));
    }
    return list;
  }, [articles, activeCategory, search]);

  const handleCategoryClick = (name: string) => {
    setSelectedArticle(null);
    if (name === 'All') router.push('/articles?category=all');
    else router.push(`/articles?category=${name}`);
  };

  return (
    <div className="relative w-full h-[calc(100vh-97px)] bg-[#020408] overflow-hidden">
      {/* Full-screen galaxy canvas */}
      <Canvas camera={{ position: [0, 0, 14], fov: 55 }} className="absolute inset-0">
        <Suspense fallback={null}>
          <GalaxyScene
            articles={filteredArticles}
            selectedId={selectedArticle?.id ?? null}
            onSelect={setSelectedArticle}
          />
        </Suspense>
      </Canvas>

      {/* HUD — top left */}
      <div className="absolute top-5 left-6 z-20 pointer-events-none">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          Transmission <span className="text-[#00FFC2]">Galaxy</span>
        </h1>
        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1 font-mono">
          {filteredArticles.length} nodes in the network
        </p>
      </div>

      {/* Search bar — top right */}
      <div className="absolute top-5 right-6 z-20 flex items-center gap-2 bg-[#080808]/80 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md">
        <Search className="w-3.5 h-3.5 text-white/40" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search transmissions..."
          className="bg-transparent text-[11px] text-white placeholder-white/30 outline-none w-40 font-mono"
        />
      </div>

      {/* Category pills — bottom center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#080808]/80 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md flex-wrap justify-center">
        {CATEGORIES.map(({ name, icon: Icon }) => {
          const isActive = name === 'All' ? activeCategory === 'all' : activeCategory.toLowerCase() === name.toLowerCase();
          const color = CATEGORY_COLORS[name] || '#ffffff';
          return (
            <button
              key={name}
              onClick={() => handleCategoryClick(name)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-200 border ${
                isActive ? 'border-current bg-current/10' : 'border-transparent text-white/40 hover:text-white/80'
              }`}
              style={isActive ? { color, borderColor: color } : {}}
            >
              {Icon && <Icon className="w-3 h-3" />}
              {name}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      {!selectedArticle && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/25 animate-pulse">
            Click any star to read
          </span>
        </div>
      )}

      {/* Article slide panel */}
      <div
        className={`absolute top-0 right-0 bottom-0 z-30 w-full sm:w-[480px] bg-[#070707]/95 border-l border-white/10 backdrop-blur-xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          selectedArticle ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedArticle && (
          <>
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
              <button
                onClick={() => setSelectedArticle(null)}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Galaxy
              </button>
              <span
                className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                style={{ color: CATEGORY_COLORS[selectedArticle.category] || '#fff' }}
              >
                <Tag className="w-3 h-3" />
                {selectedArticle.category}
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-white/40 hover:text-white transition-colors bg-white/5 border border-white/10 p-1.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-white/40 uppercase tracking-widest mb-4">
                <Calendar className="w-3 h-3" />
                {selectedArticle.date}
              </span>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug mb-5">
                <TextScramble text={selectedArticle.title} trigger="both" />
              </h2>

              {/* Neon summary card */}
              <div
                className="rounded-2xl p-5 mb-5 border"
                style={{
                  backgroundColor: `${CATEGORY_COLORS[selectedArticle.category]}0d`,
                  borderColor: `${CATEGORY_COLORS[selectedArticle.category]}33`,
                }}
              >
                <p className="text-sm text-white/70 leading-relaxed italic">
                  "{selectedArticle.summary}"
                </p>
              </div>

              {/* Topics */}
              {selectedArticle.topics?.length > 0 && (
                <div className="mb-5">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2 block">Topics</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.topics.map((t, i) => (
                      <span key={i} className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider text-white/50">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div
                className="w-full h-px mb-5"
                style={{ background: `linear-gradient(to right, transparent, ${CATEGORY_COLORS[selectedArticle.category]}40, transparent)` }}
              />

              <p className="text-xs text-white/30 leading-relaxed">
                This article is sourced from an external publication. Click below to read the full story.
              </p>
            </div>

            {/* CTA */}
            <div className="px-6 py-5 border-t border-white/10 shrink-0">
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest py-3.5 rounded-xl transition-all text-[11px] text-black"
                style={{
                  backgroundColor: CATEGORY_COLORS[selectedArticle.category] || '#00FFC2',
                  boxShadow: `0 0 24px ${CATEGORY_COLORS[selectedArticle.category]}50`,
                }}
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
  return (
    <Suspense fallback={null}>
      <ArticlesContent />
    </Suspense>
  );
}
