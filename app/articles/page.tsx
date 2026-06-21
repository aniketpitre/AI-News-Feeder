"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, MeshDistortMaterial, Sphere, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ExternalLink, ChevronLeft, ChevronRight, Cpu, Shield, Container, Brain, X, Search } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MockArticle, mockArticles } from '@/lib/mock-articles';
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

function OrbitScene({ articles, color, paused, selectedId, onSelect, readArticleIds }: {
  articles: MockArticle[]; color: string; paused: boolean; selectedId: string | null; onSelect: (a: MockArticle) => void;
  readArticleIds: Set<string>;
}) {
  const speedRef = useRef(0.06);

  // Only display articles that are in readArticleIds
  const orbitingArticles = useMemo(() => {
    return articles.filter(a => readArticleIds.has(a.id));
  }, [articles, readArticleIds]);

  const cardConfigs = useMemo(() => {
    const n = orbitingArticles.length;
    return orbitingArticles.map((_, i) => {
      const ring = i % 3; // distribute across 3 orbit rings
      const inRingIdx = Math.floor(i / 3);
      const inRingCount = Math.ceil(n / 3);
      const baseAngle = (inRingIdx / Math.max(inRingCount, 1)) * Math.PI * 2 + ring * 0.6;
      const radius = 3.8 + ring * 1.3;
      const tilt = [Math.PI / 2.5, Math.PI / 3, Math.PI / 2.1][ring];
      const yOffset = [0, 0.4, -0.3][ring];
      return { baseAngle, radius, tilt, yOffset };
    });
  }, [orbitingArticles]);

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
      {orbitingArticles.map((article, i) => (
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

// ─── Article Card — 2D carousel style with tilt and glow ──────────────────────
function ArticleCard({ article, color, isFocused, onClick, style }: {
  article: MockArticle; color: string; isFocused: boolean; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; style?: React.CSSProperties;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState({ x: 140, y: 100 });
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) return;
    const card = cardRef.current;
    if (!card) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCoords({ x, y });
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = -((y - centerY) / centerY) * 8;
      const rotateY = ((x - centerX) / centerX) * 8;
      card.style.setProperty('--rx', `${rotateX}deg`);
      card.style.setProperty('--ry', `${rotateY}deg`);
    });
  };

  const handleEnter = () => setHovered(true);
  const handleLeave = () => {
    setHovered(false);
    const card = cardRef.current;
    if (card) {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    }
  };

  const lift = isFocused ? -10 : hovered ? -6 : 0;
  const scale = isFocused ? 1.03 : hovered ? 1.015 : 1;

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseMove={handleMouseMove}
      className="shrink-0 text-left rounded-2xl overflow-hidden relative"
      style={{
        width: 280,
        background: 'rgba(5,7,14,0.82)',
        border: `1px solid ${isFocused ? color : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isFocused
          ? `0 0 36px ${color}35, 0 20px 48px rgba(0,0,0,0.65)`
          : hovered ? `0 0 24px ${color}25, 0 14px 32px rgba(0,0,0,0.55)` : '0 4px 16px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(18px)',
        transform: `perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(${lift}px) scale(${scale})`,
        transition: hovered
          ? 'box-shadow 0.25s ease, border-color 0.25s ease'
          : 'transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease, border-color 0.4s ease',
        '--rx': '0deg',
        '--ry': '0deg',
        ...style,
      } as React.CSSProperties}
    >
      {/* Cursor spotlight glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 z-10"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(180px circle at ${coords.x}px ${coords.y}px, ${color}18, transparent 70%)`,
        }}
      />
      {/* Glass shimmer sweep */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 z-10"
        style={{
          opacity: hovered ? 0.5 : 0,
          background: `linear-gradient(105deg, transparent 30%, ${color}22 45%, transparent 60%)`,
          backgroundSize: '250% 250%',
          backgroundPosition: hovered ? '0% 0%' : '120% 120%',
          transition: 'background-position 0.8s ease, opacity 0.3s ease',
        }}
      />
      {/* Border glow mask */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
          background: `radial-gradient(140px circle at ${coords.x}px ${coords.y}px, ${color}50, transparent 80%)`,
          padding: '1px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      <div className="h-0.5 w-full relative z-20" style={{ background: `linear-gradient(to right, ${color}, transparent)`, opacity: isFocused || hovered ? 1 : 0.3 }} />
      <div className="p-5 relative z-20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
            style={{ color, borderColor: `${color}40`, background: `${color}10` }}>
            {article.category}
          </span>
          <span className="text-[8px] font-mono text-white/25">{article.date}</span>
        </div>
        <h3 className="text-[13px] font-black leading-snug mb-2 line-clamp-2 transition-colors duration-200"
          style={{ color: isFocused || hovered ? color : 'rgba(255,255,255,0.9)' }}>
          {article.title}
        </h3>
        <p className="text-[10.5px] text-white/35 leading-relaxed line-clamp-2">
          {article.summary}
        </p>
        <div className="mt-3 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest transition-all duration-200"
          style={{ color: isFocused || hovered ? color : 'rgba(255,255,255,0.25)', gap: hovered ? '6px' : '4px' }}>
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
  const [selected, setSelected] = useState<MockArticle | null>(null);
  const [search, setSearch] = useState('');
  
  // Carousel and Orbit state
  const [readArticleIds, setReadArticleIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoRotateTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mouse Drag to Scroll state
  const isDown = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0 });

  // Flying Card Animation
  const [flyingCard, setFlyingCard] = useState<{
    article: MockArticle;
    startRect: DOMRect;
    animating: boolean;
  } | null>(null);

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
        } else {
          console.warn("No articles found in Firestore 'articles' collection, falling back to mockArticles.");
          setArticles(mockArticles);
        }
      } catch (e) {
        console.error("Failed to load articles from Firestore, using mockArticles fallback:", e);
        setArticles(mockArticles);
      }
      finally { setLoading(false); }
    }
    load();
  }, []);

  // Staggered entrance — cards reveal one by one like a carousel intro
  useEffect(() => {
    if (!loading && articles.length > 0 && !hasEntered) {
      const t = setTimeout(() => setHasEntered(true), 100);
      return () => clearTimeout(t);
    }
  }, [loading, articles.length, hasEntered]);

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
  const activeColor = selected
    ? (CATEGORY_CONFIG[selected.category]?.color ?? CATEGORY_CONFIG.General.color)
    : focusedArticle
      ? (CATEGORY_CONFIG[focusedArticle.category]?.color ?? CATEGORY_CONFIG.General.color)
      : '#00FFC2';

  const scrollByCards = useCallback((dir: 1 | -1) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    let targetIdx = focusedIndex + dir;
    if (targetIdx < 0) targetIdx = 0;
    if (targetIdx >= container.children.length) targetIdx = container.children.length - 1;
    
    const child = container.children[targetIdx] as HTMLElement;
    if (child) {
      const targetScroll = child.offsetLeft - (container.clientWidth - child.clientWidth) / 2;
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  }, [focusedIndex]);

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

  // Pause auto-rotate on any manual interaction, resume after 4s idle
  const pauseAutoRotate = useCallback(() => {
    setAutoRotate(false);
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => setAutoRotate(true), 4000);
  }, []);

  const handleManualScroll = useCallback((dir: 1 | -1) => {
    pauseAutoRotate();
    scrollByCards(dir);
  }, [pauseAutoRotate, scrollByCards]);

  // Mouse Drag to Scroll Event Handlers
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    isDown.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollRef.current.scrollLeft
    };
    pauseAutoRotate();
  }, [pauseAutoRotate]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDown.current || !scrollRef.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      if (!isDragging) setIsDragging(true);
      e.preventDefault();
      scrollRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
    }
  }, [isDragging]);

  const onMouseUpOrLeave = useCallback(() => {
    if (isDown.current) {
      isDown.current = false;
      if (isDragging) {
        setTimeout(() => setIsDragging(false), 50);
      }
    }
  }, [isDragging]);

  // Auto-rotate carousel — discrete card-by-card transition when idle
  useEffect(() => {
    if (autoRotateTimer.current) clearInterval(autoRotateTimer.current);
    if (!autoRotate || !hasEntered || filtered.length <= 1 || selected || flyingCard) return;

    autoRotateTimer.current = setInterval(() => {
      const container = scrollRef.current;
      if (!container) return;
      
      const nextIndex = (focusedIndex + 1) % filtered.length;
      const child = container.children[nextIndex] as HTMLElement;
      if (child) {
        const targetScroll = child.offsetLeft - (container.clientWidth - child.clientWidth) / 2;
        container.scrollTo({ left: targetScroll, behavior: 'smooth' });
      }
    }, 4500);

    return () => { if (autoRotateTimer.current) clearInterval(autoRotateTimer.current); };
  }, [autoRotate, hasEntered, filtered.length, selected, flyingCard, focusedIndex]);

  // Resume auto-rotate after closing the article panel
  useEffect(() => {
    if (!selected) {
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
      resumeTimeout.current = setTimeout(() => setAutoRotate(true), 1200);
    } else {
      setAutoRotate(false);
    }
  }, [selected]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
      if (e.key === 'ArrowLeft') handleManualScroll(-1);
      if (e.key === 'ArrowRight') handleManualScroll(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleManualScroll]);

  // Orbit pauses fully whenever the detail panel is open or a card is flying
  const paused = !!selected || !!flyingCard;

  // Triggers flying animation from 2D carousel card to 3D Orbit
  const startFlyingAnimation = (article: MockArticle, e: React.MouseEvent<HTMLButtonElement>) => {
    if (flyingCard) return;
    pauseAutoRotate();

    const rect = e.currentTarget.getBoundingClientRect();
    setFlyingCard({
      article,
      startRect: rect,
      animating: false,
    });

    // Start transition on the next tick
    setTimeout(() => {
      setFlyingCard(prev => prev ? { ...prev, animating: true } : null);
    }, 20);

    // End transition and open full detail panel
    setTimeout(() => {
      setSelected(article);
      setReadArticleIds(prev => {
        const next = new Set(prev);
        next.add(article.id);
        return next;
      });
      setFlyingCard(null);
    }, 820);
  };

  return (
    <div className="relative w-full bg-[#030508] overflow-hidden select-none" style={{ height: 'calc(100vh - 97px)' }}>
      {/* 3D orbit scene — IS the article browser now */}
      <Canvas camera={{ position: [0, 0, 8.5], fov: 55 }} className="absolute inset-0">
        <Suspense fallback={null}>
          <OrbitScene 
            articles={filtered} 
            color={activeColor} 
            paused={paused} 
            selectedId={selected?.id ?? null} 
            onSelect={setSelected} 
            readArticleIds={readArticleIds}
          />
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
          {loading ? 'Syncing nodes...' : `${readArticleIds.size} transmissions in orbit`}
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
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-8 pt-24"
          style={{ background: 'linear-gradient(to top, rgba(3,5,8,0.85) 20%, transparent 100%)' }}>
          {/* Left/Right arrows */}
          <button onClick={() => handleManualScroll(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${activeColor}30`, backdropFilter: 'blur(10px)', color: activeColor }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => handleManualScroll(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${activeColor}30`, backdropFilter: 'blur(10px)', color: activeColor }}>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Scrollable row */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onWheel={pauseAutoRotate}
            onTouchStart={pauseAutoRotate}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUpOrLeave}
            onMouseLeave={onMouseUpOrLeave}
            className="flex gap-4 overflow-x-auto no-scrollbar px-[calc(50%-140px)] pb-2 cursor-grab active:cursor-grabbing"
            style={{ 
              scrollBehavior: autoRotate ? 'auto' : 'smooth',
              scrollSnapType: isDragging ? 'none' : 'x mandatory'
            }}
          >
            {filtered.map((article, i) => {
              const color = CATEGORY_CONFIG[article.category]?.color || '#fff';
              const isFlying = flyingCard?.article.id === article.id;
              return (
                <div
                  key={article.id}
                  className="snap-center"
                  style={{
                    opacity: isFlying ? 0.15 : hasEntered ? 1 : 0,
                    transform: hasEntered ? 'translateY(0px) scale(1)' : 'translateY(40px) scale(0.92)',
                    transition: isFlying
                      ? 'opacity 0.3s ease'
                      : `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
                  }}
                >
                  <ArticleCard
                    article={article}
                    color={color}
                    isFocused={i === focusedIndex}
                    onClick={(e) => {
                      if (!isDragging) {
                        startFlyingAnimation(article, e);
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Counter + hint */}
          <div className="flex items-center justify-center gap-3 mt-4 text-[9px] font-mono text-white/20 uppercase tracking-widest">
            <span>{focusedIndex + 1} / {filtered.length}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            {autoRotate ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: activeColor }} />
                Auto-cycling
              </span>
            ) : (
              <span>← → Scroll · Click Card to Read</span>
            )}
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

      {/* Flying card animation overlay */}
      {flyingCard && (() => {
        const color = CATEGORY_CONFIG[flyingCard.article.category]?.color || '#fff';
        const start = flyingCard.startRect;
        const style = flyingCard.animating
          ? {
              position: 'fixed' as const,
              top: '40%',
              left: '50%',
              width: 280,
              transform: 'translate(-50%, -50%) scale(0.7) rotateX(20deg) rotateY(-20deg)',
              opacity: 0,
              background: 'rgba(5,7,14,0.9)',
              border: `1px solid ${color}`,
              boxShadow: `0 0 40px ${color}60`,
              backdropFilter: 'blur(24px)',
              transition: 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
              zIndex: 9999,
            }
          : {
              position: 'fixed' as const,
              top: start.top,
              left: start.left,
              width: start.width,
              height: start.height,
              transform: 'translate(0, 0) scale(1)',
              opacity: 1,
              background: 'rgba(5,7,14,0.82)',
              border: `1px solid rgba(255,255,255,0.08)`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(18px)',
              transition: 'none',
              zIndex: 9999,
            };

        return (
          <div
            className="rounded-2xl overflow-hidden p-5 pointer-events-none"
            style={style}
          >
            <div className="h-0.5 w-full mb-3" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                style={{ color, borderColor: `${color}40`, background: `${color}10` }}>
                {flyingCard.article.category}
              </span>
              <span className="text-[8px] font-mono text-white/25">{flyingCard.article.date}</span>
            </div>
            <h3 className="text-[13px] font-black leading-snug mb-2 text-white/90">
              {flyingCard.article.title}
            </h3>
            <p className="text-[10.5px] text-white/35 leading-relaxed line-clamp-2">
              {flyingCard.article.summary}
            </p>
          </div>
        );
      })()}

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
