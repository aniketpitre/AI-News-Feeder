import React, { Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';

function RotatingBox() {
  const mesh = React.useRef<any>(null!);
  useFrame((_state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.x += delta * 0.2;
      mesh.current.rotation.y += delta * 0.4;
    }
  });
  return (
    <mesh ref={mesh} castShadow receiveShadow>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#00FFC2" metalness={0.5} roughness={0.2} />
    </mesh>
  );
}

// A simple rotating Torus Knot to add visual interest
function TorusKnot() {
  const mesh = React.useRef<any>(null!);
  useFrame((_state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.5;
    }
  });
  return (
    <mesh ref={mesh} castShadow receiveShadow>
      <torusKnotGeometry args={[1, 0.4, 100, 16]} />
      <meshStandardMaterial color="#ff69b4" metalness={0.3} roughness={0.7} />
    </mesh>
  );
}

export default function ThreeCanvas() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 60 }}
        shadows
        className="bg-[#050505]"
      >
        <Suspense fallback={null}>
          {/* Sky and stars create a deeper space feel */}
          <Sky radius={500} turbidity={0.1} sunPosition={[100, 20, 100]} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <RotatingBox />
          <TorusKnot />
          <OrbitControls enableZoom={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}
