'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Stars, Environment } from '@react-three/drei';

function CoreOrb() {
  const mesh = useRef<any>(null!);
  const materialRef = useRef<any>(null!);

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.15;
      mesh.current.rotation.x += delta * 0.05;

      // mouse-reactive drift
      mesh.current.position.x += (state.pointer.x * 1.2 - mesh.current.position.x) * 0.04;
      mesh.current.position.y += (state.pointer.y * 0.8 - mesh.current.position.y) * 0.04;
    }
    if (materialRef.current) {
      const speed = Math.abs(state.pointer.x) + Math.abs(state.pointer.y);
      materialRef.current.distort = 0.35 + speed * 0.3;
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
      <Sphere ref={mesh} args={[1.8, 128, 128]}>
        <MeshDistortMaterial
          ref={materialRef}
          color="#00FFC2"
          attach="material"
          distort={0.4}
          speed={1.5}
          roughness={0.1}
          metalness={0.9}
          emissive="#00FFC2"
          emissiveIntensity={0.15}
        />
      </Sphere>
    </Float>
  );
}

function Satellites() {
  const group = useRef<any>(null!);
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.08;
      group.current.rotation.x += (state.pointer.y * 0.25 - group.current.rotation.x) * 0.03;
      group.current.rotation.z += (state.pointer.x * 0.15 - group.current.rotation.z) * 0.03;
    }
  });
  return (
    <group ref={group}>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        const radius = 3.6;
        return (
          <Float key={i} speed={1 + i * 0.2} rotationIntensity={1} floatIntensity={1.2}>
            <mesh position={[Math.cos(angle) * radius, Math.sin(i) * 0.8, Math.sin(angle) * radius]}>
              <icosahedronGeometry args={[0.18, 0]} />
              <meshStandardMaterial color="#ffffff" metalness={0.6} roughness={0.3} emissive="#00FFC2" emissiveIntensity={0.2} />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

function CameraRig() {
  const { camera } = useThree();
  useFrame((state) => {
    camera.position.x += (state.pointer.x * 0.8 - camera.position.x) * 0.03;
    camera.position.y += (state.pointer.y * 0.5 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroCanvas() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
        <Suspense fallback={null}>
          <color attach="background" args={['#050505']} />
          <Stars radius={80} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <pointLight position={[-5, -3, -5]} intensity={0.6} color="#00FFC2" />
          <CoreOrb />
          <Satellites />
          <CameraRig />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
