'use client';

import React, { Suspense, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Environment, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

/* ───────────────────────────────────────────────────────────
   Waypoint definitions — one per scroll section.
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
   noisy displacement on a base polyhedron.
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

  const pos  = base.attributes.position;
  const v    = new THREE.Vector3();
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
   The shard — igloo.inc-style interactive crystal.

   At hero (scrollProgress < ~0.12):
   • Tracks the pointer with a soft rotation lag (looks AT you)
   • Magnetically drifts position slightly toward cursor
   • Breathes with a gentle scale pulse
   • Click triggers a heartbeat expand+contract
   • Pointer proximity intensifies the inner glow and distortion

   Past hero:
   • Switches back to scroll-driven descent/rotation
   ─────────────────────────────────────────────────────────── */
function Shard({ scrollProgressRef }: { scrollProgressRef: React.MutableRefObject<number> }) {
  const group        = useRef<THREE.Group>(null!);
  const mesh         = useRef<THREE.Mesh>(null!);
  const matRef       = useRef<any>(null!);
  const innerGlow    = useRef<THREE.PointLight>(null!);
  const auroraRef    = useRef<THREE.Mesh>(null!);

  // Hover / click state — tracked as refs to avoid re-renders in the hot path
  const hoverIntensity = useRef(0);
  const clickPulse     = useRef(0);   // decays from 1→0 after click
  const [hovered, setHovered] = useState(false);

  // Smooth target values for pointer-tracking at hero
  const pointerTarget = useRef({ rx: 0, ry: 0, px: 0, py: 0 });

  const geometries = useMemo(
    () => WAYPOINTS.map((w, i) => buildCrystalGeometry(w.shape, i * 17 + 5)),
    []
  );

  const colors       = useMemo(() => WAYPOINTS.map(w => new THREE.Color(w.color)), []);
  const currentColor = useRef(new THREE.Color(WAYPOINTS[0].color));
  const currentGeomIdx = useRef(0);

  useFrame((state, delta) => {
    const n       = WAYPOINTS.length;
    const p       = scrollProgressRef.current * (n - 1);
    const idx     = Math.min(Math.floor(p), n - 2);
    const localT  = p - idx;
    const isHero  = scrollProgressRef.current < 0.12;

    // ── Geometry swap at midpoint crossing ──
    const nearestIdx = localT < 0.5 ? idx : idx + 1;
    if (mesh.current && nearestIdx !== currentGeomIdx.current) {
      mesh.current.geometry = geometries[nearestIdx];
      currentGeomIdx.current = nearestIdx;
    }

    // ── Color lerp ──
    const colorA = colors[idx];
    const colorB = colors[Math.min(idx + 1, n - 1)];
    currentColor.current.copy(colorA).lerp(colorB, localT);
    if (matRef.current?.color) matRef.current.color.copy(currentColor.current);

    // ── Hover / pulse values ──
    hoverIntensity.current += ((hovered ? 1 : 0) - hoverIntensity.current) * 0.08;
    clickPulse.current      = Math.max(0, clickPulse.current - delta * 1.8);
    const t                 = state.clock.getElapsedTime();
    const pulse             = 0.85 + Math.sin(t * 2.2) * 0.15;

    // ── Inner glow ──
    if (innerGlow.current) {
      innerGlow.current.color.copy(currentColor.current);
      innerGlow.current.intensity =
        2.2 + hoverIntensity.current * 3.5 * pulse + clickPulse.current * 6;
    }

    // ── Aurora halo ──
    if (auroraRef.current) {
      const mat     = auroraRef.current.material as any;
      mat.color.copy(currentColor.current);
      const auroraBase = isHero
        ? hoverIntensity.current * 0.4 + clickPulse.current * 0.5
        : hoverIntensity.current * 0.35;
      mat.opacity       = auroraBase * pulse;
      const auroraScale = 1.9 + hoverIntensity.current * 0.5 + clickPulse.current * 0.8 + Math.sin(t * 1.5) * 0.06;
      auroraRef.current.scale.setScalar(auroraScale);
      auroraRef.current.lookAt(state.camera.position);
    }

    // ── Pointer-reactive distortion (hero only) ──
    if (matRef.current && isHero) {
      const dist = Math.sqrt(state.pointer.x ** 2 + state.pointer.y ** 2);
      // closer to center = more distortion, makes it feel "aware"
      matRef.current.distortion = 0.15 + (1 - Math.min(dist, 1)) * 0.35 + clickPulse.current * 0.4;
      matRef.current.distortionScale = 0.4 + hoverIntensity.current * 0.3;
    } else if (matRef.current) {
      matRef.current.distortion      = 0.15;
      matRef.current.distortionScale = 0.4;
    }

    // ── Position / rotation ──
    if (group.current) {
      if (isHero) {
        // ─ HERO MODE: crystal tracks pointer magnetically ─

        // Smooth targets
        pointerTarget.current.rx += (state.pointer.y * -0.5 - pointerTarget.current.rx) * 0.055;
        pointerTarget.current.ry += (state.pointer.x *  0.7 - pointerTarget.current.ry) * 0.055;
        pointerTarget.current.px += (state.pointer.x *  0.25 - pointerTarget.current.px) * 0.04;
        pointerTarget.current.py += (state.pointer.y *  0.18 - pointerTarget.current.py) * 0.04;

        // Magnetic pull — group drifts toward cursor
        group.current.position.x  = pointerTarget.current.px;
        group.current.position.y  = 1.2 + pointerTarget.current.py;
        group.current.position.z  = 0;

        // Crystal faces the cursor — igloo's "looking at you" feel
        group.current.rotation.x  = pointerTarget.current.rx;
        group.current.rotation.y  = pointerTarget.current.ry;
        group.current.rotation.z  = 0;

      } else {
        // ─ SCROLL MODE: descent + scroll-driven rotation ─
        const totalDescent = (n - 1) * 2.4;
        group.current.position.y = 1.2 - scrollProgressRef.current * totalDescent;
        group.current.position.x = Math.sin(scrollProgressRef.current * Math.PI * 2) * 0.6;
        group.current.rotation.y += delta * 0.15 + scrollProgressRef.current * 0.002;
        group.current.rotation.x  = scrollProgressRef.current * Math.PI * 0.4;
        group.current.rotation.z  = Math.sin(scrollProgressRef.current * Math.PI) * 0.15;
      }
    }

    // ── Mesh-level animation: breathing scale + click heartbeat ──
    if (mesh.current) {
      const breathe    = 1 + Math.sin(t * 0.85) * 0.025;
      const clickScale = 1 + clickPulse.current * 0.28;
      mesh.current.scale.setScalar(breathe * clickScale);

      // Ambient self-spin (kept outside hero pointer-tracking so it layers on top)
      if (!isHero) {
        mesh.current.rotation.y += delta * 0.08 + hoverIntensity.current * delta * 0.3;
      } else {
        // Slow ambient spin even in hero mode, but subtle
        mesh.current.rotation.y += delta * 0.03;
      }
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    // Heartbeat pulse — decays in useFrame
    clickPulse.current = 1;
  };

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
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e)  => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <MeshTransmissionMaterial
          ref={matRef}
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
   Ambient background ice fragments
   ─────────────────────────────────────────────────────────── */
function AmbientFragments({ scrollProgressRef }: { scrollProgressRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null!);
  const frags = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    pos:   [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 30, -4 - Math.random() * 8] as [number, number, number],
    size:  0.15 + Math.random() * 0.35,
    speed: 0.2 + Math.random() * 0.3,
  })), []);

  useFrame((state, delta) => {
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
   Camera rig — at hero, amplified pointer parallax so the
   scene feels more alive; past hero, standard drift.
   ─────────────────────────────────────────────────────────── */
function CameraRig({ scrollProgressRef }: { scrollProgressRef: React.MutableRefObject<number> }) {
  const { camera } = useThree();

  useFrame((state) => {
    const t      = state.clock.getElapsedTime() * 0.02;
    const autoX  = Math.sin(t) * 0.4;
    const isHero = scrollProgressRef.current < 0.12;

    // At hero, camera has a wider parallax range so the 3D depth is obvious
    const sensitivity = isHero ? 1.4 : 0.6;
    const tx = state.pointer.x * sensitivity + autoX;
    const ty = state.pointer.y * (isHero ? 0.6 : 0.3);

    camera.position.x += (tx - camera.position.x) * 0.025;
    camera.position.y += (ty - camera.position.y) * 0.025;
    camera.position.z += (7   - camera.position.z) * 0.03;

    const n           = WAYPOINTS.length;
    const totalDescent = (n - 1) * 2.4;
    const shardY      = 1.2 - scrollProgressRef.current * totalDescent;
    camera.lookAt(0, shardY * 0.3, 0);
  });

  return null;
}

/* ───────────────────────────────────────────────────────────
   Scene root
   ─────────────────────────────────────────────────────────── */
function SceneContents() {
  const scrollProgressRef = useRef(0);

  useFrame(() => {
    if (typeof window === 'undefined') return;
    const scrollY   = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
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
      <directionalLight position={[4, 6, 5]}    intensity={1.1} color="#ffffff" />
      <directionalLight position={[-4, -3, -3]} intensity={0.3} color="#4FC3F7" />
      <Environment preset="city" />
      <Shard            scrollProgressRef={scrollProgressRef} />
      <AmbientFragments scrollProgressRef={scrollProgressRef} />
      <CameraRig        scrollProgressRef={scrollProgressRef} />
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
