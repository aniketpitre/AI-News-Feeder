'use client';

import React, { Suspense, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Environment, MeshTransmissionMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ───────────────────────────────────────────────────────────
   Waypoint definitions — one per scroll section.
   index 0 = hero, 1-4 = categories, 5 = footer
   ─────────────────────────────────────────────────────────── */
export const WAYPOINTS = [
  { key: 'hero',      label: 'TECH_SYNC',   color: '#00FFC2', shape: 'icosahedron' as const },
  { key: 'DevOps',    label: 'DevOps',      color: '#4FC3F7', shape: 'octahedron'  as const },
  { key: 'K8s',       label: 'K8s',         color: '#00FFC2', shape: 'dodecahedron' as const },
  { key: 'AI/ML',     label: 'AI/ML',       color: '#CE93D8', shape: 'icosahedron' as const },
  { key: 'Cyber SOC', label: 'Cyber SOC',   color: '#FF8A65', shape: 'tetrahedron' as const },
  { key: 'footer',    label: 'STAY_SYNCED', color: '#ffffff', shape: 'sphere'      as const },
];

/* ───────────────────────────────────────────────────────────
   Crystal geometry builder — procedural "ice growth" look via
   noisy displacement on a base polyhedron, per igloo.inc's
   crystal-growth-inside-a-container technique.
   ─────────────────────────────────────────────────────────── */
function buildCrystalGeometry(shape: string, seed: number): THREE.BufferGeometry {
  let base: THREE.BufferGeometry;
  switch (shape) {
    case 'octahedron':   base = new THREE.OctahedronGeometry(1.5, 2);   break;
    case 'dodecahedron': base = new THREE.DodecahedronGeometry(1.4, 1); break;
    case 'tetrahedron':  base = new THREE.TetrahedronGeometry(1.7, 3);  break;
    case 'sphere':       base = new THREE.IcosahedronGeometry(1.3, 3);  break;
    case 'icosahedron':
    default:             base = new THREE.IcosahedronGeometry(1.5, 2);  break;
  }

  const pos = base.attributes.position;
  const v   = new THREE.Vector3();
  const rand = (() => {
    let s = seed;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  })();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = (
      Math.sin(v.x * 3.1 + seed) *
      Math.cos(v.y * 2.7 + seed) *
      Math.sin(v.z * 3.4 + seed)
    ) * 0.14;
    const jitter = (rand() - 0.5) * 0.05;
    v.addScaledVector(v.clone().normalize(), n + jitter);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  base.computeVertexNormals();
  return base;
}

/* ───────────────────────────────────────────────────────────
   The shard itself — glassy transmission material, morphs
   position/rotation/color/geometry across scroll waypoints.
   ─────────────────────────────────────────────────────────── */
function Shard({ scrollProgressRef }: { scrollProgressRef: React.MutableRefObject<number> }) {
  const group        = useRef<THREE.Group>(null!);
  const mesh         = useRef<THREE.Mesh>(null!);
  const innerGlow    = useRef<THREE.PointLight>(null!);
  const auroraRef    = useRef<THREE.Mesh>(null!);
  const hoverIntensity = useRef(0);
  const [hovered, setHovered] = useState(false);

  const geometries = useMemo(
    () => WAYPOINTS.map((w, i) => buildCrystalGeometry(w.shape, i * 17 + 5)),
    []
  );

  const colors = useMemo(() => WAYPOINTS.map(w => new THREE.Color(w.color)), []);
  const currentColor   = useRef(new THREE.Color(WAYPOINTS[0].color));
  const currentGeomIdx = useRef(0);

  useFrame((state, delta) => {
    const n = WAYPOINTS.length;
    const p = scrollProgressRef.current * (n - 1);
    const idx    = Math.min(Math.floor(p), n - 2);
    const localT = p - idx;

    // Swap geometry at midpoint crossing
    const nearestIdx = localT < 0.5 ? idx : idx + 1;
    if (mesh.current && nearestIdx !== currentGeomIdx.current) {
      mesh.current.geometry = geometries[nearestIdx];
      currentGeomIdx.current = nearestIdx;
    }

    // Continuous color lerp between waypoint colors
    const colorA = colors[idx];
    const colorB = colors[Math.min(idx + 1, n - 1)];
    currentColor.current.copy(colorA).lerp(colorB, localT);
    if (mesh.current) {
      const mat = mesh.current.material as any;
      if (mat?.color) mat.color.copy(currentColor.current);
    }

    // Hover aurora halo
    hoverIntensity.current += ((hovered ? 1 : 0) - hoverIntensity.current) * 0.08;
    const pulse = 0.85 + Math.sin(state.clock.getElapsedTime() * 2.2) * 0.15;

    if (innerGlow.current) {
      innerGlow.current.color.copy(currentColor.current);
      innerGlow.current.intensity = 2.2 + hoverIntensity.current * 3.5 * pulse;
    }

    if (auroraRef.current) {
      const mat = auroraRef.current.material as any;
      mat.color.copy(currentColor.current);
      mat.opacity = hoverIntensity.current * 0.35 * pulse;
      const scale = 1.9 + hoverIntensity.current * 0.5 + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.06;
      auroraRef.current.scale.setScalar(scale);
      auroraRef.current.lookAt(state.camera.position);
    }

    // Position descent — shard drifts down + rotates as you scroll
    if (group.current) {
      const totalDescent = (n - 1) * 2.4;
      group.current.position.y = 1.2 - scrollProgressRef.current * totalDescent;
      group.current.position.x = Math.sin(scrollProgressRef.current * Math.PI * 2) * 0.6;
      group.current.rotation.y += delta * 0.15 + scrollProgressRef.current * 0.002;
      group.current.rotation.x  = scrollProgressRef.current * Math.PI * 0.4;
      group.current.rotation.z  = Math.sin(scrollProgressRef.current * Math.PI) * 0.15;
    }

    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.08 + hoverIntensity.current * delta * 0.3;
    }
  });

  return (
    <group ref={group}>
      {/* Aurora halo sprite */}
      <mesh ref={auroraRef} position={[0, 0, -0.3]}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial
          color={WAYPOINTS[0].color}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh
        ref={mesh}
        geometry={geometries[0]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e)  => { e.stopPropagation(); setHovered(false); }}
      >
        <MeshTransmissionMaterial
          color={WAYPOINTS[0].color}
          thickness={1.2}
          roughness={0.08}
          transmission={1}
          ior={1.3}
          chromaticAberration={0.04}
          anisotropy={0.3}
          distortion={0.15}
          distortionScale={0.4}
          temporalDistortion={0.1}
          clearcoat={1}
          attenuationDistance={2.5}
          attenuationColor="#ffffff"
        />
      </mesh>

      <pointLight ref={innerGlow} intensity={2.2} distance={6} color={WAYPOINTS[0].color} />
    </group>
  );
}

/* ───────────────────────────────────────────────────────────
   Ambient background — distant ice fragments + stars
   ─────────────────────────────────────────────────────────── */
function AmbientFragments({ scrollProgressRef }: { scrollProgressRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null!);
  const frags = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    pos:   [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 30, -4 - Math.random() * 8] as [number,number,number],
    size:  0.15 + Math.random() * 0.35,
    speed: 0.2 + Math.random() * 0.3,
  })), []);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.position.y = 4 - scrollProgressRef.current * 14;
    group.current.children.forEach((c, i) => {
      c.rotation.x += delta * frags[i].speed * 0.3;
      c.rotation.y += delta * frags[i].speed * 0.2;
    });
  });

  return (
    <group ref={group}>
      {frags.map((f, i) => (
        <mesh key={i} position={f.pos}>
          <octahedronGeometry args={[f.size, 0]} />
          <meshPhysicalMaterial
            color="#ffffff"
            roughness={0.1}
            transmission={0.9}
            thickness={0.5}
            transparent
            opacity={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ───────────────────────────────────────────────────────────
   Camera — slow auto drift + mouse parallax, looks at shard
   ─────────────────────────────────────────────────────────── */
function CameraRig({ scrollProgressRef }: { scrollProgressRef: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  useFrame((state) => {
    const t   = state.clock.getElapsedTime() * 0.02;
    const autoX = Math.sin(t) * 0.4;
    const tx  = state.pointer.x * 0.6 + autoX;
    const ty  = state.pointer.y * 0.3;
    camera.position.x += (tx - camera.position.x) * 0.025;
    camera.position.y += (ty - camera.position.y) * 0.025;
    camera.position.z += (7 - camera.position.z) * 0.03;

    const n = WAYPOINTS.length;
    const totalDescent = (n - 1) * 2.4;
    const shardY = 1.2 - scrollProgressRef.current * totalDescent;
    camera.lookAt(0, shardY * 0.3, 0);
  });
  return null;
}

/* ───────────────────────────────────────────────────────────
   Scroll-reactive Bloom — intensity spikes on fast scroll
   (waypoint crossings), echoing igloo.inc's scene transitions.
   ChromaticAberration adds the persistent RGB edge split.
   ─────────────────────────────────────────────────────────── */
function ScrollPostProcessing({
  scrollProgressRef,
}: {
  scrollProgressRef: React.MutableRefObject<number>;
}) {
  const bloomRef     = useRef<any>(null!);
  const chromaRef    = useRef<any>(null!);
  const lastProgress = useRef(0);

  useFrame(() => {
    // Delta scroll per frame — fast scroll = large delta = bloom spike
    const delta = Math.abs(scrollProgressRef.current - lastProgress.current);
    lastProgress.current = scrollProgressRef.current;

    if (bloomRef.current) {
      const target = 0.55 + Math.min(delta * 80, 3.0);
      bloomRef.current.intensity += (target - bloomRef.current.intensity) * 0.1;
    }

    if (chromaRef.current) {
      // Briefly widen the chroma offset on fast scroll, then settle back
      const aberration = 0.0004 + Math.min(delta * 0.08, 0.004);
      chromaRef.current.offset.set(aberration, aberration);
    }
  });

  return (
    <EffectComposer>
      <Bloom
        ref={bloomRef}
        intensity={0.55}
        luminanceThreshold={0.08}
        luminanceSmoothing={0.85}
        mipmapBlur
      />
      <ChromaticAberration ref={chromaRef} offset={[0.0004, 0.0004] as any} />
    </EffectComposer>
  );
}

/* ───────────────────────────────────────────────────────────
   Scene root — wires scroll progress into all sub-components
   ─────────────────────────────────────────────────────────── */
function SceneContents() {
  const scrollProgressRef = useRef(0);

  useFrame(() => {
    if (typeof window === 'undefined') return;
    const scrollY    = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgressRef.current = docHeight > 0
      ? Math.min(Math.max(scrollY / docHeight, 0), 1)
      : 0;
  });

  return (
    <>
      <color attach="background" args={['#020305']} />
      <fog   attach="fog"        args={['#020305', 10, 30]} />
      <Stars radius={50} depth={35} count={3500} factor={2} saturation={0.1} fade speed={0.2} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 5]}   intensity={1.1} color="#ffffff" />
      <directionalLight position={[-4, -3, -3]} intensity={0.3} color="#4FC3F7" />
      <Environment preset="city" />
      <Shard             scrollProgressRef={scrollProgressRef} />
      <AmbientFragments  scrollProgressRef={scrollProgressRef} />
      <CameraRig         scrollProgressRef={scrollProgressRef} />
      {/* Post-processing — Bloom spikes on waypoint scroll + persistent chroma */}
      <ScrollPostProcessing scrollProgressRef={scrollProgressRef} />
    </>
  );
}

export default function IcebergScene() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <SceneContents />
        </Suspense>
      </Canvas>
    </div>
  );
}
