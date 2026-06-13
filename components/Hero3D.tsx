'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function RotatingThing() {
  const mesh = useRef<any>(null);
  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.x += delta * 0.2;
      mesh.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={mesh}>
      <mesh position={[0, 0.2, 0]}>
        <torusKnotGeometry args={[0.9, 0.28, 128, 32]} />
        <meshStandardMaterial color="#00FFC2" metalness={0.6} roughness={0.2} emissive="#002a2a" emissiveIntensity={0.6} />
      </mesh>

      <mesh position={[1.8, -0.2, -0.8]} rotation={[0.6, 0.4, 0.2]}>
        <sphereGeometry args={[0.45, 64, 64]} />
        <meshStandardMaterial color="#00D9FF" metalness={0.3} roughness={0.1} emissive="#001622" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        <RotatingThing />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 4} />
      </Canvas>
    </div>
  );
}
