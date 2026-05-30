import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { Bottle } from './Bottle.jsx';
import { Studio } from './Studio.jsx';

// Interaktivní plátno konfigurátoru: táhnutím se otáčí, jinak se pomalu sám točí.
export default function ConfiguratorCanvas({ color, scale = 1 }) {
  return (
    <Canvas camera={{ position: [0, 0.2, 6], fov: 32 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <Studio />
      <group scale={scale} position={[0, 0.15, 0]}>
        <Bottle colorHex={color.hex} metalness={color.metalness} roughness={color.roughness} />
      </group>
      <ContactShadows position={[0, -1.75, 0]} opacity={0.45} scale={9} blur={2.8} far={4} color="#000000" />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.9}
        enableDamping
        minPolarAngle={Math.PI * 0.32}
        maxPolarAngle={Math.PI * 0.62}
      />
    </Canvas>
  );
}
