import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Bottle } from './Bottle.jsx';
import { Studio } from './Studio.jsx';
import { scrollState, pointerState } from '../lib/runtime.js';

function HeroBottle() {
  const ref = useRef();
  const spin = useRef(0);

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    spin.current += delta * 0.25;
    g.rotation.y = spin.current + pointerState.x * 0.3;
    const targetX = pointerState.y * 0.16 + scrollState.progress * 0.25;
    g.rotation.x += (targetX - g.rotation.x) * 0.06;
    g.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.07 - scrollState.progress * 0.5;
  });

  return (
    <Bottle ref={ref} colorHex="#2b3a55" metalness={0.95} roughness={0.3} scale={1.18} position={[1.25, 0, 0]} />
  );
}

export default function HeroCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 34 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <Studio />
      <HeroBottle />
    </Canvas>
  );
}
