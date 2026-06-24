'use client';

import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Environment, MeshTransmissionMaterial, Html } from '@react-three/drei';
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
   Shattered Fragments — broken pieces of the crystal that
   float apart at hero and assemble into the orb as user
   scrolls (igloo.inc-inspired reveal).

   Each fragment is a small crystal shard with glassy material.
   At scroll=0 they're scattered; at scroll ~0.10 they've
   fully converged to center, and the main orb takes over.
   ─────────────────────────────────────────────────────────── */
const FRAGMENT_COUNT = 10;
const ASSEMBLY_END = 0.08; // scroll progress at which fragments fully assemble

function ShatteredFragments({ scrollProgressRef, introProgress }: {
  scrollProgressRef: React.MutableRefObject<number>;
  introProgress: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null!);

  // Pre-calculate fragment data: scattered position, rotation, scale, geometry
  const fragments = useMemo(() => {
    const seed = (i: number) => {
      let s = i * 7919 + 31;
      const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      return r;
    };

    return Array.from({ length: FRAGMENT_COUNT }, (_, i) => {
      const r = seed(i);
      // Scattered positions — spread in a sphere around center
      const theta = r() * Math.PI * 2;
      const phi   = Math.acos(2 * r() - 1);
      const radius = 2.5 + r() * 3.0;
      const scatteredPos: [number, number, number] = [
        Math.sin(phi) * Math.cos(theta) * radius,
        Math.sin(phi) * Math.sin(theta) * radius,
        Math.cos(phi) * radius * 0.6,
      ];
      // Random rotation for scattered state
      const scatteredRot: [number, number, number] = [
        r() * Math.PI * 2,
        r() * Math.PI * 2,
        r() * Math.PI * 2,
      ];
      // Fragment size (smaller shards)
      const scale = 0.25 + r() * 0.35;
      // Shape variety
      const shapes: THREE.BufferGeometry[] = [
        new THREE.TetrahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.IcosahedronGeometry(1, 0),
      ];
      const geom = shapes[i % shapes.length];
      // Speed multiplier for floating animation
      const floatSpeed = 0.3 + r() * 0.6;
      const floatOffset = r() * Math.PI * 2;

      return { scatteredPos, scatteredRot, scale, geom, floatSpeed, floatOffset };
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const scroll = scrollProgressRef.current;
    const intro = introProgress.current;

    // Assembly progress: 0 = fully scattered, 1 = fully assembled
    const assemblyT = Math.min(scroll / ASSEMBLY_END, 1);
    // Smooth ease-in-out
    const eased = assemblyT < 0.5
      ? 4 * assemblyT * assemblyT * assemblyT
      : 1 - Math.pow(-2 * assemblyT + 2, 3) / 2;

    // Fade out fragments as they assemble (opacity → 0 at full assembly)
    const fragOpacity = Math.max(0, 1 - eased * 1.2); // fade a bit before fully assembled

    groupRef.current.children.forEach((child, i) => {
      const frag = fragments[i];
      if (!frag) return;

      const meshChild = child as THREE.Mesh;

      // Lerp position from scattered → center (0,0,0)
      meshChild.position.x = frag.scatteredPos[0] * (1 - eased) + Math.sin(t * frag.floatSpeed + frag.floatOffset) * 0.15 * (1 - eased);
      meshChild.position.y = frag.scatteredPos[1] * (1 - eased) + Math.cos(t * frag.floatSpeed * 0.7 + frag.floatOffset) * 0.1 * (1 - eased);
      meshChild.position.z = frag.scatteredPos[2] * (1 - eased);

      // Rotation: scatter rotation → converge to 0
      meshChild.rotation.x = frag.scatteredRot[0] * (1 - eased) + t * 0.2 * (1 - eased);
      meshChild.rotation.y = frag.scatteredRot[1] * (1 - eased) + t * 0.15 * (1 - eased);
      meshChild.rotation.z = frag.scatteredRot[2] * (1 - eased);

      // Scale: appear with intro, shrink as they assemble
      const baseScale = frag.scale * intro;
      meshChild.scale.setScalar(baseScale * Math.max(0.1, 1 - eased * 0.8));

      // Opacity
      const mat = meshChild.material as THREE.MeshPhysicalMaterial;
      if (mat) mat.opacity = fragOpacity * intro;
    });

    // Follow shard group position when scrolled
    if (scroll > ASSEMBLY_END) {
      groupRef.current.visible = false;
    } else {
      groupRef.current.visible = true;
      // Position at shard's hero position
      groupRef.current.position.y = 1.2;
    }
  });

  return (
    <group ref={groupRef}>
      {fragments.map((frag, i) => (
        <mesh key={i} geometry={frag.geom}>
          <meshPhysicalMaterial
            color="#00FFC2"
            emissive="#00FFC2"
            emissiveIntensity={0.15}
            roughness={0.05}
            metalness={0.1}
            transmission={0.85}
            thickness={0.8}
            ior={1.4}
            transparent
            opacity={0.7}
            clearcoat={1}
            clearcoatRoughness={0.1}
            envMapIntensity={1.5}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ───────────────────────────────────────────────────────────
   Floating Data Metrics — igloo-style floating labels that
   orbit the shard during hero, showing live-feel stats.
   ─────────────────────────────────────────────────────────── */
const METRICS = [
  { label: 'FEEDS',    value: '4',      offset: 0 },
  { label: 'UPTIME',   value: '99.9%',  offset: Math.PI * 0.5 },
  { label: 'LATENCY',  value: '12ms',   offset: Math.PI },
  { label: 'ARTICLES', value: '128',    offset: Math.PI * 1.5 },
];

function FloatingMetrics({ scrollProgressRef }: { scrollProgressRef: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!groupRef.current) return;
    const isHero = scrollProgressRef.current < 0.12;
    const t = state.clock.getElapsedTime();

    // Fade the whole group in/out based on hero
    const targetOpacity = isHero ? 1 : 0;
    groupRef.current.visible = isHero || groupRef.current.children.some(c => (c as any).currentOpacity > 0.01);

    groupRef.current.children.forEach((child, i) => {
      const metric = METRICS[i];
      const angle = t * 0.3 + metric.offset;
      const radius = 2.8;

      child.position.x = Math.cos(angle) * radius;
      child.position.z = Math.sin(angle) * radius;
      child.position.y = Math.sin(t * 0.6 + i * 1.2) * 0.3;

      // Smooth opacity
      const current = (child as any).currentOpacity ?? 0;
      const next = current + (targetOpacity - current) * 0.06;
      (child as any).currentOpacity = next;
    });
  });

  return (
    <group ref={groupRef}>
      {METRICS.map((metric, i) => (
        <Html
          key={metric.label}
          center
          distanceFactor={8}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(0, 255, 194, 0.06)',
              border: '1px solid rgba(0, 255, 194, 0.2)',
              borderRadius: '8px',
              padding: '6px 12px',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              animation: `metricFadeIn 0.8s ease-out ${i * 0.15 + 0.3}s both`,
            }}
          >
            <span style={{
              fontSize: '8px',
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.35)',
            }}>
              {metric.label}
            </span>
            <span style={{
              fontSize: '16px',
              fontFamily: 'monospace',
              fontWeight: 900,
              color: '#00FFC2',
              textShadow: '0 0 12px rgba(0, 255, 194, 0.5)',
            }}>
              {metric.value}
            </span>
          </div>
        </Html>
      ))}
    </group>
  );
}

/* ───────────────────────────────────────────────────────────
   Data Particle Field — rising particles around shard (hero)
   ─────────────────────────────────────────────────────────── */
function DataParticles({ scrollProgressRef }: { scrollProgressRef: React.MutableRefObject<number> }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 200;

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      vel[i * 3]     = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 1] = 0.003 + Math.random() * 0.005; // rising
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const isHero = scrollProgressRef.current < 0.15;

    // Fade particles
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    const targetOpacity = isHero ? 0.6 : 0;
    mat.opacity += (targetOpacity - mat.opacity) * 0.05;

    if (!isHero && mat.opacity < 0.01) return;

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    // Mouse attraction
    const mx = state.pointer.x * 3;
    const my = state.pointer.y * 3;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      arr[ix]     += velocities[ix];
      arr[ix + 1] += velocities[ix + 1];
      arr[ix + 2] += velocities[ix + 2];

      // Slight attraction toward mouse position
      arr[ix]     += (mx - arr[ix]) * 0.0003;
      arr[ix + 1] += (my - arr[ix + 1]) * 0.0003;

      // Reset if out of bounds
      if (arr[ix + 1] > 5) {
        arr[ix + 1] = -5;
        arr[ix] = (Math.random() - 0.5) * 10;
        arr[ix + 2] = (Math.random() - 0.5) * 6;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00FFC2"
        size={0.03}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ───────────────────────────────────────────────────────────
   The shard — glassy crystal orb.

   At hero (scrollProgress < ~0.12):
   • Starts small (hidden behind fragments) and grows as
     fragments assemble
   • Tracks the pointer with a soft rotation lag
   • Magnetically drifts position slightly toward cursor
   • Breathes with a gentle scale pulse
   • Click triggers a heartbeat expand+contract

   Past hero:
   • Full glassy orb — scroll-driven descent/rotation
   ─────────────────────────────────────────────────────────── */
function Shard({ scrollProgressRef, introProgress }: {
  scrollProgressRef: React.MutableRefObject<number>;
  introProgress: React.MutableRefObject<number>;
}) {
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
    const intro   = introProgress.current;

    // ── Assembly progress: orb grows as fragments converge ──
    const assemblyT = Math.min(scrollProgressRef.current / ASSEMBLY_END, 1);
    const assemblyEased = assemblyT < 0.5
      ? 4 * assemblyT * assemblyT * assemblyT
      : 1 - Math.pow(-2 * assemblyT + 2, 3) / 2;

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

    // ── Pointer-reactive distortion (hero only, kept subtle for glassy look) ──
    if (matRef.current && isHero) {
      const dist = Math.sqrt(state.pointer.x ** 2 + state.pointer.y ** 2);
      const proximity = 1 - Math.min(dist, 1);
      // Keep distortion subtle so the glassy transmission look shines through
      matRef.current.distortion = 0.15 + proximity * 0.2 + clickPulse.current * 0.3;
      matRef.current.distortionScale = 0.4 + hoverIntensity.current * 0.2;
      matRef.current.chromaticAberration = 0.04 + proximity * 0.06;
    } else if (matRef.current) {
      matRef.current.distortion      = 0.15;
      matRef.current.distortionScale = 0.4;
      matRef.current.chromaticAberration = 0.04;
    }

    // ── Position / rotation ──
    if (group.current) {
      if (isHero) {
        // ─ HERO MODE: crystal tracks pointer magnetically ─
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

    // ── Mesh-level animation: assembly reveal + breathing + click heartbeat ──
    if (mesh.current) {
      const breathe    = 1 + Math.sin(t * 0.85) * 0.025;
      const clickScale = 1 + clickPulse.current * 0.28;

      // Orb starts small (0.15) and grows to full size as fragments assemble
      // After assembly is done, it's full scale
      const assemblyScale = isHero ? 0.15 + assemblyEased * 0.85 : 1;
      mesh.current.scale.setScalar(breathe * clickScale * assemblyScale * intro);

      // Ambient self-spin
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
   Camera rig — at hero, amplified pointer parallax;
   past hero, standard drift.
   ─────────────────────────────────────────────────────────── */
function CameraRig({ scrollProgressRef, introProgress }: {
  scrollProgressRef: React.MutableRefObject<number>;
  introProgress: React.MutableRefObject<number>;
}) {
  const { camera } = useThree();

  useFrame((state) => {
    const t      = state.clock.getElapsedTime() * 0.02;
    const autoX  = Math.sin(t) * 0.4;
    const isHero = scrollProgressRef.current < 0.12;
    const intro  = introProgress.current;

    // At hero, camera has a wider parallax range so the 3D depth is obvious
    const sensitivity = isHero ? 1.4 : 0.6;
    const tx = state.pointer.x * sensitivity + autoX;
    const ty = state.pointer.y * (isHero ? 0.6 : 0.3);

    // Cinematic intro: camera starts slightly closer (z=5) and pulls back to z=7
    const zTarget = 7;
    const introZ = isHero ? 5 + intro * 2 : zTarget;
    const finalZ = isHero && intro < 0.99 ? introZ : zTarget;

    camera.position.x += (tx - camera.position.x) * 0.025;
    camera.position.y += (ty - camera.position.y) * 0.025;
    camera.position.z += (finalZ - camera.position.z) * 0.03;

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
  const introProgress = useRef(0);
  const introStarted = useRef(false);
  const introStartTime = useRef(0);

  useEffect(() => {
    const onPreloaderDone = () => {
      introStarted.current = true;
      introStartTime.current = performance.now();
    };
    window.addEventListener('preloader-done', onPreloaderDone);

    // Fallback if preloader-done never fires
    const fallback = setTimeout(() => {
      if (!introStarted.current) {
        introStarted.current = true;
        introStartTime.current = performance.now();
      }
    }, 2500);

    return () => {
      window.removeEventListener('preloader-done', onPreloaderDone);
      clearTimeout(fallback);
    };
  }, []);

  useFrame(() => {
    if (typeof window === 'undefined') return;

    // Scroll progress
    const scrollY   = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgressRef.current = docHeight > 0
      ? Math.min(Math.max(scrollY / docHeight, 0), 1)
      : 0;

    // Intro animation: 0 → 1 over ~1.5s with ease-out
    if (introStarted.current) {
      const elapsed = (performance.now() - introStartTime.current) / 1500; // 1.5s
      const raw = Math.min(elapsed, 1);
      // Ease-out cubic
      introProgress.current = 1 - Math.pow(1 - raw, 3);
    }
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
      <ShatteredFragments scrollProgressRef={scrollProgressRef} introProgress={introProgress} />
      <Shard              scrollProgressRef={scrollProgressRef} introProgress={introProgress} />
      <FloatingMetrics    scrollProgressRef={scrollProgressRef} />
      <DataParticles      scrollProgressRef={scrollProgressRef} />
      <AmbientFragments   scrollProgressRef={scrollProgressRef} />
      <CameraRig          scrollProgressRef={scrollProgressRef} introProgress={introProgress} />
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
      {/* Inject keyframe for floating metric fade-in */}
      <style>{`
        @keyframes metricFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
