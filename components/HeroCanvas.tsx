'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Stars, Environment } from '@react-three/drei';

function CameraRig() {
  const { camera } = useThree();
  useFrame((state) => {
    // Dynamic parallax camera drift based on mouse
    camera.position.x += (state.pointer.x * 0.8 - camera.position.x) * 0.03;
    camera.position.y += (state.pointer.y * 0.5 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function SceneContents() {
  const mainGroup = useRef<any>(null!);
  const coreRef = useRef<any>(null!);
  const innerCoreRef = useRef<any>(null!);
  const materialRef = useRef<any>(null!);
  const lineGeometryRef = useRef<any>(null!);
  const starsGroupRef = useRef<any>(null!);
  
  const satelliteRefs = useRef<any[]>([]);
  const linePositions = useRef(new Float32Array(60)); // 5 paths to satellites + 5 ring paths = 10 lines * 2 vertices * 3 coords = 60 values
  const lastScroll = useRef(0);

  // Initialize satellite refs array
  if (satelliteRefs.current.length === 0) {
    satelliteRefs.current = Array(5).fill(null).map(() => React.createRef());
  }

  useFrame((state, delta) => {
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const docHeight = typeof document !== 'undefined' ? document.documentElement.scrollHeight - window.innerHeight : 1000;
    const scrollProgress = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0;

    const { width: vpWidth, height: vpHeight } = state.viewport;
    const isMobile = vpWidth < 7;

    // 1. Scroll-driven parent group positioning and scaling
    if (mainGroup.current) {
      // Dynamic shift based on screen size (shift less on small screens)
      const targetX = scrollProgress * (isMobile ? vpWidth * 0.15 : vpWidth * 0.22);
      const targetY = scrollProgress * (isMobile ? vpHeight * 0.20 : vpHeight * 0.22);
      const targetZ = scrollProgress * (isMobile ? -1.5 : -2.5);
      
      const baseScale = isMobile ? 0.65 : 1.0;
      const targetScale = baseScale * (1 - scrollProgress * 0.50);

      mainGroup.current.position.x += (targetX - mainGroup.current.position.x) * 0.08;
      mainGroup.current.position.y += (targetY - mainGroup.current.position.y) * 0.08;
      mainGroup.current.position.z += (targetZ - mainGroup.current.position.z) * 0.08;
      
      const currentScale = mainGroup.current.scale.x;
      const nextScale = currentScale + (targetScale - currentScale) * 0.08;
      mainGroup.current.scale.set(nextScale, nextScale, nextScale);
    }

    // 2. Mouse-reactive core orb rotation, distortion and drift
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.15;
      coreRef.current.rotation.x += delta * 0.06;

      // Disable mouse offset drift on touch screens to prevent jumpy touch frames
      const mouseXOffset = isMobile ? 0 : state.pointer.x * 1.0 * (1 - scrollProgress);
      const mouseYOffset = isMobile ? 0 : state.pointer.y * 0.6 * (1 - scrollProgress);
      
      coreRef.current.position.x += (mouseXOffset - coreRef.current.position.x) * 0.05;
      coreRef.current.position.y += (mouseYOffset - coreRef.current.position.y) * 0.05;
    }

    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.y -= delta * 0.25;
      innerCoreRef.current.rotation.z += delta * 0.10;
      innerCoreRef.current.position.copy(coreRef.current.position);
    }

    // 3. Satellite orbiting
    satelliteRefs.current.forEach((ref, i) => {
      const sat = ref.current;
      if (sat) {
        const time = state.clock.getElapsedTime();
        const angle = (i / 5) * Math.PI * 2 + time * 0.12;
        const radius = isMobile ? 2.0 : 3.6; // Smaller radius on mobile viewport
        
        sat.position.x = Math.cos(angle) * radius;
        sat.position.z = Math.sin(angle) * radius;
        sat.position.y = Math.sin(time * 0.4 + i) * (isMobile ? 0.2 : 0.4);
        
        sat.rotation.x += delta * 0.4;
        sat.rotation.y += delta * 0.2;
      }
    });

    // 4. Update Constellation Lines
    if (lineGeometryRef.current && coreRef.current) {
      const posArray = linePositions.current;
      const corePos = coreRef.current.position;

      // Lines from Core to Satellites
      for (let i = 0; i < 5; i++) {
        const sat = satelliteRefs.current[i].current;
        if (sat) {
          const idx = i * 6;
          posArray[idx] = corePos.x;
          posArray[idx + 1] = corePos.y;
          posArray[idx + 2] = corePos.z;
          posArray[idx + 3] = sat.position.x;
          posArray[idx + 4] = sat.position.y;
          posArray[idx + 5] = sat.position.z;
        }
      }

      // Ring lines between adjacent Satellites
      for (let i = 0; i < 5; i++) {
        const satStart = satelliteRefs.current[i].current;
        const satEnd = satelliteRefs.current[(i + 1) % 5].current;
        if (satStart && satEnd) {
          const idx = 30 + i * 6;
          posArray[idx] = satStart.position.x;
          posArray[idx + 1] = satStart.position.y;
          posArray[idx + 2] = satStart.position.z;
          posArray[idx + 3] = satEnd.position.x;
          posArray[idx + 4] = satEnd.position.y;
          posArray[idx + 5] = satEnd.position.z;
        }
      }

      lineGeometryRef.current.attributes.position.needsUpdate = true;
    }

    // 5. Scroll-responsive Starfield acceleration
    if (starsGroupRef.current) {
      starsGroupRef.current.rotation.y += delta * 0.02;
      const diff = Math.abs(scrollY - lastScroll.current);
      lastScroll.current = scrollY;
      
      starsGroupRef.current.rotation.y += diff * 0.0015;
      starsGroupRef.current.rotation.x += diff * 0.0005;
    }
  });

  return (
    <>
      <group ref={starsGroupRef}>
        <Stars radius={80} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />
      </group>

      <group ref={mainGroup}>
        {/* Core Crystals System */}
        <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
          <group>
            {/* Outer Refracting Crystal */}
            <mesh ref={coreRef}>
              <icosahedronGeometry args={[1.8, 0]} />
              <meshPhysicalMaterial
                ref={materialRef}
                color="#00FFC2"
                emissive="#00FFC2"
                emissiveIntensity={0.12}
                roughness={0.08}
                metalness={0.05}
                transmission={0.92}
                thickness={1.6}
                ior={1.48}
                clearcoat={1.0}
                clearcoatRoughness={0.08}
                transparent
                opacity={0.95}
              />
            </mesh>
            
            {/* Inner Glowing Wireframe Core */}
            <mesh ref={innerCoreRef}>
              <icosahedronGeometry args={[1.45, 1]} />
              <meshBasicMaterial
                color="#00FFC2"
                wireframe
                transparent
                opacity={0.35}
              />
            </mesh>
          </group>
        </Float>

        {/* Orbiting Satellites */}
        {satelliteRefs.current.map((ref, i) => (
          <Float key={i} speed={1 + i * 0.2} rotationIntensity={1} floatIntensity={1.2}>
            <mesh ref={ref}>
              <octahedronGeometry args={[0.2, 0]} />
              <meshStandardMaterial
                color="#ffffff"
                metalness={0.8}
                roughness={0.2}
                emissive="#00FFC2"
                emissiveIntensity={0.3}
              />
            </mesh>
          </Float>
        ))}

        {/* Constellation Lines */}
        <lineSegments>
          <bufferGeometry ref={lineGeometryRef}>
            <bufferAttribute
              attach="attributes-position"
              args={[linePositions.current, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00FFC2" transparent opacity={0.25} />
        </lineSegments>
      </group>
    </>
  );
}

export default function HeroCanvas() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
        <Suspense fallback={null}>
          <color attach="background" args={['#050505']} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <pointLight position={[-5, -3, -5]} intensity={0.6} color="#00FFC2" />
          <SceneContents />
          <CameraRig />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
