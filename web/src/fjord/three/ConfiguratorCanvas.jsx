import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Bottle } from './Bottle.jsx';
import { Studio } from './Studio.jsx';

// Interaktivní plátno konfigurátoru: tažením se otáčí, jinak se pomalu sám točí.
export default function ConfiguratorCanvas({ color, scale = 1 }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      camera={{ position: [0, 0.2, 6.2], fov: 30 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
      }}
    >
      <Studio />
      <group scale={scale} position={[0, 0.1, 0]}>
        <Bottle colorHex={color.hex} metalness={color.metalness} roughness={color.roughness} />
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
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.85}
        enableDamping
        minPolarAngle={Math.PI * 0.32}
        maxPolarAngle={Math.PI * 0.6}
      />
    </Canvas>
  );
}
