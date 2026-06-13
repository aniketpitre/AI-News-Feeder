"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Html } from '@react-three/drei';
import { ArrowRight, X, ExternalLink, Calendar, Tag, Compass } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mockArticles, MockArticle } from '@/lib/mock-articles';
import { TextScramble } from '@/components/ui/TextScramble';

const getPosition = (index: number, isMobile: boolean) => {
  // Stagger nodes in a zig-zag depth pattern
  const x = index % 2 === 0 ? (isMobile ? -0.7 : -1.8) : (isMobile ? 0.7 : 1.8);
  const y = Math.sin(index * 2) * 0.2;
  const z = index * -9; // Extended Z spacing for better visual separation
  return [x, y, z] as [number, number, number];
};

function TimelineCamera() {
  const { camera, viewport } = useThree();
  const isMobile = viewport.width < 7;

  useFrame((state) => {
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const maxScroll = typeof window !== 'undefined' 
      ? document.documentElement.scrollHeight - window.innerHeight 
      : 1000;
    const ratio = maxScroll > 0 ? scrollY / maxScroll : 0;

    // Camera flies down the Z axis from +4 down to -50 based on scroll ratio
    const targetZ = 4 - ratio * 54;
    camera.position.z += (targetZ - camera.position.z) * 0.08;

    // Mouse-movement reactive sway on X/Y (disabled on mobile)
    const targetX = isMobile ? 0 : state.pointer.x * 0.6;
    const targetY = isMobile ? 0 : state.pointer.y * 0.3;
    camera.position.x += (targetX - camera.position.x) * 0.06;
    camera.position.y += (targetY - camera.position.y) * 0.06;

    // Look slightly in front of the camera path
    camera.lookAt(0, 0, camera.position.z - 4);
  });

  return null;
}

function ArticleNode({ 
  article, 
  index, 
  onSelect 
}: { 
  article: MockArticle; 
  index: number; 
  onSelect: () => void 
}) {
  const meshRef = useRef<any>(null!);
  const [hovered, setHovered] = useState(false);
  const { viewport } = useThree();
  const isMobile = viewport.width < 7;
  const position = getPosition(index, isMobile);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      // Wave hover float
      meshRef.current.position.y = position[1] + Math.sin(time + index) * 0.08;
      // Subtle rotation sway
      meshRef.current.rotation.y = Math.sin(time * 0.4 + index) * 0.04;

      // Scale transition
      const targetScale = hovered ? 1.06 : 1.0;
      meshRef.current.scale.x += (targetScale - meshRef.current.scale.x) * 0.12;
      meshRef.current.scale.y += (targetScale - meshRef.current.scale.y) * 0.12;
      meshRef.current.scale.z += (targetScale - meshRef.current.scale.z) * 0.12;
    }
  });

  return (
    <group>
      {/* 3D Glass block */}
      <mesh
        ref={meshRef}
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[2.3, 1.4, 0.3]} />
        <meshPhysicalMaterial
          color="#0c0c0c"
          roughness={0.12}
          metalness={0.9}
          transmission={0.7}
          thickness={0.4}
          clearcoat={1.0}
        />

        {/* Glow neon cage */}
        <mesh>
          <boxGeometry args={[2.32, 1.42, 0.32]} />
          <meshBasicMaterial
            color={hovered ? '#00FFC2' : '#ffffff'}
            wireframe
            transparent
            opacity={hovered ? 0.35 : 0.08}
          />
        </mesh>

        {/* CSS transform projection tag */}
        <Html
          position={[0, 0, 0.16]}
          transform
          occlude
          pointerEvents="none"
          scale={0.25}
          className="w-[920px] h-[560px] select-none p-16 flex flex-col justify-between bg-[#080808]/92 border-[4px] border-white/10 rounded-3xl backdrop-blur-md shadow-[0_16px_96px_rgba(0,0,0,0.9)]"
        >
          <div className="flex flex-col h-full justify-between select-none">
            <div>
              <span className="text-[30px] font-black uppercase tracking-widest text-[#00FFC2]">{article.category}</span>
              <h3 className="text-[40px] font-extrabold text-white mt-4 leading-snug line-clamp-3 select-none">{article.title}</h3>
            </div>
            <div className="flex items-center justify-between text-[30px] font-bold text-white/40 uppercase tracking-wider select-none">
              <span>{article.date}</span>
              <span className="text-[#00FFC2] flex items-center gap-2 animate-pulse">
                Details <ArrowRight className="w-6 h-6" />
              </span>
            </div>
          </div>
        </Html>
      </mesh>

      {/* Point lights */}
      <pointLight
        position={[position[0], position[1] + 1.2, position[2]]}
        intensity={hovered ? 2.0 : 0.7}
        color={hovered ? '#00FFC2' : '#ffffff'}
        distance={6}
      />
    </group>
  );
}

export default function Articles() {
  const [articles, setArticles] = useState<MockArticle[]>(mockArticles);
  const [selectedArticle, setSelectedArticle] = useState<MockArticle | null>(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const q = query(collection(db, 'articles'), where('status', '==', 'published'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const fetched = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as MockArticle[];
          fetched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setArticles(fetched);
        }
      } catch (err) {
        console.error("Firestore error, falling back to local mocks", err);
      }
    }
    fetchArticles();
  }, []);

  return (
    <div className="relative w-full min-h-[350vh] bg-[#050505] text-white">
      {/* Flight Canvas Overlay */}
      <div className="fixed inset-0 w-full h-full z-10">
        <Canvas camera={{ position: [0, 0, 4], fov: 60 }}>
          <Suspense fallback={null}>
            <color attach="background" args={['#050505']} />
            <Stars radius={100} depth={50} count={4000} factor={3} saturation={0} fade speed={0.4} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1.0} />
            
            {articles.map((article, idx) => (
              <ArticleNode 
                key={article.id} 
                article={article} 
                index={idx} 
                onSelect={() => setSelectedArticle(article)} 
              />
            ))}

            <TimelineCamera />
          </Suspense>
        </Canvas>
      </div>

      {/* Floating UI HUD elements */}
      <div className="fixed top-24 left-6 md:left-12 z-20 pointer-events-none">
        <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-[#00FFC2] backdrop-blur-md">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          Timeline Navigator
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mt-3 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          Transmission <span className="text-[#00FFC2]">Nodes</span>
        </h1>
        <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mt-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Scroll down to fly through the archive
        </p>
      </div>

      {/* Selected Article Slide-over Panel */}
      <div 
        className={`fixed top-[61px] right-0 bottom-0 w-full sm:w-[480px] bg-[#080808]/90 border-l border-white/10 backdrop-blur-xl z-50 p-6 md:p-8 flex flex-col justify-between transition-transform duration-500 ease-out select-text pointer-events-auto ${
          selectedArticle ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedArticle && (
          <>
            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar mb-4">
              {/* Close Button */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00FFC2] flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  {selectedArticle.category}
                </span>
                <button 
                  onClick={() => setSelectedArticle(null)}
                  className="text-white/60 hover:text-white transition-colors bg-white/5 border border-white/10 p-1.5 rounded-full hover:scale-105 duration-200"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Title & Date */}
              <div className="mb-6">
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1 mb-2">
                  <Calendar className="w-3 h-3" />
                  {selectedArticle.date}
                </span>
                <h2 className="text-xl md:text-2xl font-black tracking-tight leading-snug">
                  <TextScramble text={selectedArticle.title} trigger="both" />
                </h2>
              </div>

              {/* Detailed Summary Card */}
              <div className="bg-[#00FFC2]/5 border border-[#00FFC2]/20 rounded-xl p-4 mb-6">
                <p className="text-xs md:text-sm text-white/70 italic leading-relaxed">
                  "{selectedArticle.summary}"
                </p>
              </div>

              {/* Body Content */}
              <div className="prose prose-invert max-w-none">
                <p className="text-sm text-white/60 leading-relaxed font-light whitespace-pre-line">
                  {selectedArticle.content}
                </p>
              </div>
            </div>

            {/* Outbound Link Actions (Sticky bottom container) */}
            <div className="border-t border-white/10 pt-4 flex flex-col gap-3 shrink-0 bg-[#080808]/10">
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                Resource Taxonomy
              </span>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedArticle.topics.map((t, idx) => (
                  <span key={idx} className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider text-white/50">
                    {t}
                  </span>
                ))}
              </div>
              <a 
                href={selectedArticle.url}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#00FFC2] hover:bg-[#00e0aa] text-black font-black uppercase tracking-widest py-3 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,255,194,0.4)] text-[10px]"
              >
                Go to Source Document <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </>
        )}
      </div>

      {/* Spacer container to provide document scrolling length */}
      <div className="relative w-full h-[350vh] pointer-events-none z-0" />
    </div>
  );
}
