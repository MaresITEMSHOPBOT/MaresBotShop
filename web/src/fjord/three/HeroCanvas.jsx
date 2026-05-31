import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { Bottle } from './Bottle.jsx';
import { Studio } from './Studio.jsx';
import { scrollState, pointerState } from '../lib/runtime.js';

function HeroBottle() {
  const ref = useRef();
  const spin = useRef(0);

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    spin.current += delta * 0.3;
    g.rotation.y = spin.current + pointerState.x * 0.35;
    const targetX = pointerState.y * 0.14 + scrollState.progress * 0.2;
    g.rotation.x += (targetX - g.rotation.x) * 0.06;
    g.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.06 - scrollState.progress * 0.4;
  });

  return (
    <group position={[1.2, 0, 0]}>
      <group ref={ref}>
        <Bottle colorHex="#2b3a55" metalness={0.9} roughness={0.24} scale={1.16} />
      </group>
      <ContactShadows
        position={[0, -1.72, 0]}
        opacity={0.5}
        scale={9}
        blur={2.6}
        far={4}
        resolution={512}
        color="#000000"
      />
    </group>
  );
}

export default function HeroCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      camera={{ position: [0, 0.15, 6.2], fov: 30 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
      }}
    >
      <Studio />
      <HeroBottle />
    </Canvas>
  );
}
