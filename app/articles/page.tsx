"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, MeshDistortMaterial, MeshTransmissionMaterial, Sphere, Float, Html, Environment } from '@react-three/drei';
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

// ─── Background ambient ice fragments (decorative, far away, glassy) ──────────
function BackgroundOrbs() {
  const frags = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    pos: [(Math.random() - 0.5) * 22, (Math.random() - 0.5) * 12, -10 - Math.random() * 6] as [number, number, number],
    size: 0.35 + Math.random() * 0.9,
    speed: 0.3 + Math.random() * 0.4,
    shape: i % 3,
  })), []);
  return (
    <>
      {frags.map((f, i) => (
        <Float key={i} speed={f.speed} floatIntensity={0.5} rotationIntensity={0.3}>
          <mesh position={f.pos}>
            {f.shape === 0 && <octahedronGeometry args={[f.size, 0]} />}
            {f.shape === 1 && <icosahedronGeometry args={[f.size, 0]} />}
            {f.shape === 2 && <tetrahedronGeometry args={[f.size, 0]} />}
            <meshPhysicalMaterial
              color="#dff7ff"
              roughness={0.05}
              transmission={0.92}
              thickness={0.6}
              ior={1.25}
              transparent
              opacity={0.16}
              depthWrite={false}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

// ─── Central crystal — glassy transmission material, igloo-consistent ────────
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
    const mat = mesh.current.material as any;
    if (mat?.color) mat.color.copy(currentColor.current);
    if (light.current) light.current.color.copy(currentColor.current);
  });

  return (
    <Float speed={0.8} floatIntensity={0.25} rotationIntensity={0.1}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.15, 1]} />
        <MeshTransmissionMaterial
          color={color}
          thickness={1.1}
          roughness={0.08}
          transmission={1}
          ior={1.3}
          chromaticAberration={0.035}
          anisotropy={0.25}
          distortion={0.12}
          distortionScale={0.35}
          temporalDistortion={0.08}
          clearcoat={1}
          attenuationDistance={2.2}
          attenuationColor="#ffffff"
        />
      </mesh>
      <pointLight ref={light} color={color} intensity={2.8} distance={14} />
    </Float>
  );
}

// Decorative inner rings close to the crystal — frosted glass arcs
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
        <torusGeometry args={[1.5, 0.005, 6, 120]} />
        <meshPhysicalMaterial color={c} transmission={0.6} roughness={0.2} transparent opacity={0.22} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 3, 0.3, 0]}>
        <torusGeometry args={[1.8, 0.0035, 6, 120]} />
        <meshPhysicalMaterial color={c} transmission={0.6} roughness={0.2} transparent opacity={0.13} />
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
      <color attach="background" args={['#020305']} />
      <fog attach="fog" args={['#020305', 16, 42]} />
      <Stars radius={60} depth={40} count={5000} factor={2.5} saturation={0.2} fade speed={0.3} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[4, 6, 5]} intensity={0.6} color="#ffffff" />
      <pointLight position={[8, 6, 4]} intensity={0.4} color="#ffffff" />
      <Environment preset="city" />
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

function getRichContent(article: MockArticle) {
  const category = article.category;
  let sections: { type: 'p' | 'h3' | 'code'; content: string; lang?: string }[] = [];
  
  if (category === 'K8s') {
    sections = [
      { type: 'p', content: `${article.content} This update represents a collaborative effort across multiple Special Interest Groups (SIGs) to elevate production-grade performance, improve compatibility boundaries, and introduce standardized APIs.` },
      { type: 'h3', content: 'Key Architectural Highlights' },
      { type: 'p', content: 'One of the most anticipated updates is the graduation of Sidecar Containers to a stable feature. Prior to this, initializing logging daemons, service mesh sidecars, or configuration synchronizers required complex, fragile entrypoint scripts. With native sidecars, Kubernetes guarantees that auxiliary containers start before main app containers and remain running until the primary workload finishes.' },
      { type: 'code', lang: 'yaml', content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: secured-web-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: main-app
        image: nginx:1.25
      initContainers:
      - name: vault-agent
        image: hashicorp/vault:1.15
        restartPolicy: Always # Declares this as a native sidecar` },
      { type: 'h3', content: 'Edge Optimization & API Maturation' },
      { type: 'p', content: 'For resource-constrained environments, kubelet memory management has been heavily optimized. By utilizing structured logging and limiting active file descriptor retention, memory utilization has been dropped by 18%. Additionally, SPIFFE-based pod identifiers can now be mounted directly via Projected Volumes, offering automated cryptographic identity validation.' }
    ];
  } else if (category === 'AI/ML') {
    sections = [
      { type: 'p', content: `${article.content} The implications of this update stretch across software architecture, operations, and general automation. Teams are now deploying autonomous systems that actively monitor their own runtime state.` },
      { type: 'h3', content: 'Leveraging a 2-Million Token Window' },
      { type: 'p', content: 'Traditional code generation tools are limited to single-file suggestions. Gemini 3.5 overcomes this restriction by reading entire code repositories along with dependency locks, Dockerfiles, and Helm charts. This comprehensive context allows the reasoning engine to map out deep architectural dependencies and locate bugs that span multiple microservices.' },
      { type: 'code', lang: 'python', content: `import google.generativeai as genai

# Initialize agent with repository context
model = genai.GenerativeModel('gemini-3.5-pro')
chat = model.start_chat(history=[])

response = chat.send_message(
    "Analyze the crash log from the pods: "
    "K8s says 'BackOff' and the logs show db connection timeout. "
    "Here is our entire config folder: ..."
)` },
      { type: 'h3', content: 'Autonomous CI/CD Debugging' },
      { type: 'p', content: 'DevOps agents running Gemini 3.5 can connect directly to GitHub Actions API streams. When a build step fails, the agent queries the runner logs, parses the build failure, writes a corrective patch in a new branch, runs local tests, and opens a Pull Request with a detailed summary.' }
    ];
  } else if (category === 'DevOps') {
    sections = [
      { type: 'p', content: `${article.content} Automating infrastructure state management remains a primary bottleneck for high-velocity teams. These updates show how GitOps and policy-as-code are merging to address configuration drift.` },
      { type: 'h3', content: 'Preventing Infrastructure State Drift' },
      { type: 'p', content: 'OpenTofu 1.9 introduces encrypted state files and advanced state locking. This ensures that concurrent runs inside GitLab or GitHub runners do not corrupt infrastructure mapping. Furthermore, state snapshots can now be audited in real time against live cloud resources.' },
      { type: 'code', lang: 'hcl', content: `# OpenTofu 1.9 Drift Management
provider "aws" {
  region = "us-east-1"
}

resource "aws_security_group" "web_firewall" {
  name        = "secure-web-sg"
  description = "Managed via OpenTofu GitOps"
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}` },
      { type: 'h3', content: 'Enforcing Security Gates' },
      { type: 'p', content: 'By integrating Open Policy Agent (OPA) directly into the plan phase, infrastructure modifications are blocked if they violate compliance rules. For instance, any change exposing database ports directly to the internet is rejected before resource allocation begins.' }
    ];
  } else if (category === 'Cyber SOC') {
    sections = [
      { type: 'p', content: `${article.content} Mitigating cloud-native threats requires real-time automated intervention. By leveraging spi-fication and container runtime isolation, security teams can respond to intrusions in seconds.` },
      { type: 'h3', content: 'Automated Container Anomaly Detection' },
      { type: 'p', content: 'By piping kernel-level system calls via eBPF probes, SOC agents analyze execution patterns within active workloads. If a container tries to execute a shell or access host-level credentials, the SOC system flags the alert and triggers a localized security policy.' },
      { type: 'code', lang: 'json', content: `{
  "alert": "Unauthorized Socket Connection",
  "source_pod": "customer-api-8f921a",
  "severity": "CRITICAL",
  "mitigation_action": "isolate_pod",
  "timestamp": "2026-06-21T13:45:00Z"
}` },
      { type: 'h3', content: 'Zero Trust Inter-Service Connectivity' },
      { type: 'p', content: 'Establishing strict cryptographic trust mesh prevents lateral movement. If a single web pod is compromised, security rules restrict it from accessing database endpoints or caching servers, containing the threat cluster within the ingress boundary.' }
    ];
  } else {
    sections = [
      { type: 'p', content: article.content },
      { type: 'p', content: 'Keeping systems secure, scalable, and automated is the core pillar of modern digital architectures. Continuous learning and testing remain paramount.' }
    ];
  }

  return sections;
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
  const scrollTarget = useRef<number | null>(null);
  const scrollTween = useRef<number | null>(null);

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

  const carouselArticles = useMemo(() => {
    return filtered.filter(a => !readArticleIds.has(a.id));
  }, [filtered, readArticleIds]);

  useEffect(() => { setFocusedIndex(0); setSelected(null); if (scrollRef.current) scrollRef.current.scrollLeft = 0; }, [cat, search]);

  const focusedArticle = carouselArticles[focusedIndex] ?? null;
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
  // Attach native wheel event listener to translate vertical scroll to horizontal scroll with momentum
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    
    const onWheelNative = (e: WheelEvent) => {
      pauseAutoRotate();
      e.preventDefault();
      
      if (scrollTarget.current === null) {
        scrollTarget.current = container.scrollLeft;
      }
      
      scrollTarget.current += e.deltaY * 0.85;
      const maxScroll = container.scrollWidth - container.clientWidth;
      scrollTarget.current = Math.max(0, Math.min(scrollTarget.current, maxScroll));
      
      const smoothScroll = () => {
        const c = scrollRef.current;
        if (!c || scrollTarget.current === null) return;
        const current = c.scrollLeft;
        const dist = scrollTarget.current - current;
        if (Math.abs(dist) > 0.5) {
          c.scrollLeft += dist * 0.12;
          scrollTween.current = requestAnimationFrame(smoothScroll);
        } else {
          c.scrollLeft = scrollTarget.current;
          scrollTween.current = null;
          scrollTarget.current = null;
        }
      };
      
      if (scrollTween.current) cancelAnimationFrame(scrollTween.current);
      scrollTween.current = requestAnimationFrame(smoothScroll);
    };
    
    container.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelNative);
      if (scrollTween.current) cancelAnimationFrame(scrollTween.current);
    };
  }, [pauseAutoRotate, carouselArticles.length]);
  const handleCloseDetail = useCallback(() => {
    if (!selected) return;
    const closedId = selected.id;
    setSelected(null);
    setReadArticleIds(prev => {
      const next = new Set(prev);
      next.add(closedId);
      return next;
    });
  }, [selected]);

  // Auto-rotate carousel — discrete card-by-card transition when idle
  useEffect(() => {
    if (autoRotateTimer.current) clearInterval(autoRotateTimer.current);
    if (!autoRotate || !hasEntered || carouselArticles.length <= 1 || selected || flyingCard) return;

    autoRotateTimer.current = setInterval(() => {
      const container = scrollRef.current;
      if (!container) return;
      
      const nextIndex = (focusedIndex + 1) % carouselArticles.length;
      const child = container.children[nextIndex] as HTMLElement;
      if (child) {
        const targetScroll = child.offsetLeft - (container.clientWidth - child.clientWidth) / 2;
        container.scrollTo({ left: targetScroll, behavior: 'smooth' });
      }
    }, 4500);

    return () => { if (autoRotateTimer.current) clearInterval(autoRotateTimer.current); };
  }, [autoRotate, hasEntered, carouselArticles.length, selected, flyingCard, focusedIndex]);

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
      if (e.key === 'Escape') handleCloseDetail();
      if (e.key === 'ArrowLeft') handleManualScroll(-1);
      if (e.key === 'ArrowRight') handleManualScroll(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleManualScroll, handleCloseDetail]);

  // Orbit never pauses, running continuously in the background
  const paused = false;

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
      setFlyingCard(null);
    }, 820);
  };

  return (
    <div className="relative w-full bg-[#020305] overflow-hidden select-none" style={{ height: 'calc(100vh - 97px)' }}>
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
      {!loading && carouselArticles.length > 0 && (
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
            onTouchStart={pauseAutoRotate}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUpOrLeave}
            onMouseLeave={onMouseUpOrLeave}
            className="flex gap-4 overflow-x-auto no-scrollbar px-[calc(50%-140px)] pt-10 pb-8 -mt-10 cursor-grab active:cursor-grabbing"
            style={{ 
              scrollBehavior: autoRotate ? 'auto' : 'smooth',
              scrollSnapType: isDragging ? 'none' : 'x mandatory'
            }}
          >
            {carouselArticles.map((article, i) => {
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
            <span>{focusedIndex + 1} / {carouselArticles.length}</span>
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

      {/* ── Detail modal with Igloo.inc style card expansion animation ── */}
      {selected && (() => {
        const color = CATEGORY_CONFIG[selected.category]?.color || '#fff';
        const richSections = getRichContent(selected);
        const selIdx = carouselArticles.findIndex(a => a.id === selected.id);
        
        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all duration-300"
            onClick={handleCloseDetail}
          >
            <style>{`
              @keyframes modalExpand {
                from {
                  opacity: 0;
                  transform: scale(0.93) translateY(15px);
                }
                to {
                  opacity: 1;
                  transform: scale(1) translateY(0);
                }
              }
              .modal-animate-expand {
                animation: modalExpand 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
            `}</style>
            <div 
              className="relative w-full max-w-3xl h-[82vh] flex flex-col rounded-3xl overflow-hidden border modal-animate-expand"
              style={{ 
                background: 'rgba(8, 11, 20, 0.96)',
                borderColor: `${color}40`,
                boxShadow: `0 0 50px ${color}20`,
                backdropFilter: 'blur(30px)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Colored top gradient bar */}
              <div className="h-1.5 w-full shrink-0" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
              
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-5 shrink-0 border-b border-white/5 bg-black/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full border"
                    style={{ color, borderColor: `${color}30`, background: `${color}10` }}>
                    {selected.category}
                  </span>
                  <span className="text-[9px] font-mono text-white/30">{selected.date}</span>
                </div>
                <button 
                  onClick={handleCloseDetail} 
                  className="text-white/40 hover:text-white hover:bg-white/5 transition-all p-2 rounded-full border border-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-8 py-7 space-y-6 no-scrollbar">
                <h2 className="text-2xl font-black leading-snug text-white">{selected.title}</h2>
                
                {/* Immersive rich sections */}
                {richSections.map((sec, idx) => {
                  if (sec.type === 'p') {
                    return <p key={idx} className="text-[13px] text-white/70 leading-relaxed font-normal">{sec.content}</p>;
                  }
                  if (sec.type === 'h3') {
                    return <h3 key={idx} className="text-sm font-black text-white pt-3 uppercase tracking-wider" style={{ color }}>{sec.content}</h3>;
                  }
                  if (sec.type === 'code') {
                    return (
                      <div key={idx} className="relative rounded-2xl overflow-hidden border border-white/5 bg-black/60 p-5 font-mono text-[11px] leading-relaxed text-white/90">
                        <div className="absolute top-2 right-3 text-[8px] font-black uppercase text-white/25">{sec.lang}</div>
                        <pre className="overflow-x-auto no-scrollbar"><code>{sec.content}</code></pre>
                      </div>
                    );
                  }
                  return null;
                })}

                {selected.topics?.length > 0 && (
                  <div className="pt-4">
                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest block mb-2.5">Signal Tags</span>
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
              </div>

              {/* Navigation controls & external links footer */}
              <div className="px-8 py-5 shrink-0 border-t border-white/5 flex items-center justify-between bg-black/30">
                <div className="flex items-center gap-4">
                  {selIdx >= 0 && (
                    <>
                      <button
                        onClick={() => { const prev = carouselArticles[Math.max(0, selIdx - 1)]; if (prev) setSelected(prev); }}
                        disabled={selIdx <= 0}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-20 hover:scale-105"
                        style={{ color }}>
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                      </button>
                      <span className="text-[9px] font-mono text-white/20">{selIdx + 1} / {carouselArticles.length}</span>
                      <button
                        onClick={() => { const next = carouselArticles[Math.min(carouselArticles.length - 1, selIdx + 1)]; if (next) setSelected(next); }}
                        disabled={selIdx >= carouselArticles.length - 1}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-20 hover:scale-105"
                        style={{ color }}>
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
                <a href={selected.url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 font-black uppercase tracking-widest px-6 py-3.5 rounded-xl text-[10px] text-black transition-all hover:brightness-110 active:scale-95"
                  style={{ background: color, boxShadow: `0 0 24px ${color}30` }}>
                  Access Full Source <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function Articles() {
  return <Suspense fallback={null}><ArticlesContent /></Suspense>;
}
