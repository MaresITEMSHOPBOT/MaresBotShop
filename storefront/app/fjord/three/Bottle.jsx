import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Profil řezu láhve (x = poloměr, y = výška) — otočením kolem osy Y vznikne těleso.
const PROFILE = [
  [0.0, 0.0],
  [0.32, 0.0],
  [0.47, 0.03],
  [0.515, 0.1],
  [0.52, 0.22],
  [0.52, 1.92],
  [0.515, 2.02],
  [0.498, 2.16],
  [0.46, 2.34],
  [0.4, 2.52],
  [0.32, 2.68],
  [0.25, 2.8],
  [0.212, 2.9],
  [0.205, 3.0],
  [0.206, 3.1],
  [0.215, 3.15],
  [0.205, 3.17],
];

function makeBottleGeometry() {
  const pts = PROFILE.map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(pts, 96);
  geo.computeVertexNormals();
  return geo;
}

// Čistě vizuální komponenta láhve. Transformaci (rotace/pozice/scale) řídí rodič.
// Barva se plynule „přelévá“ (lerp) k cílové, takže přepnutí odstínu je hladké.
export const Bottle = forwardRef(function Bottle(
  { colorHex = '#2c2e33', metalness = 0.9, roughness = 0.35, ...props },
  ref,
) {
  const geometry = useMemo(makeBottleGeometry, []);
  const matRef = useRef();
  const target = useMemo(() => new THREE.Color(colorHex), []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    target.set(colorHex);
    if (matRef.current) {
      matRef.current.metalness = metalness;
      matRef.current.roughness = roughness;
    }
  }, [colorHex, metalness, roughness, target]);

  useFrame(() => {
    if (matRef.current) matRef.current.color.lerp(target, 0.14);
  });

  return (
    <group ref={ref} {...props}>
      <group position={[0, -1.7, 0]}>
        {/* tělo láhve */}
        <mesh geometry={geometry}>
          <meshPhysicalMaterial
            ref={matRef}
            color={colorHex}
            metalness={metalness}
            roughness={roughness}
            clearcoat={0.5}
            clearcoatRoughness={0.35}
            envMapIntensity={1}
          />
        </mesh>

        {/* závitový kroužek pod víčkem */}
        <mesh position={[0, 2.96, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.214, 0.016, 12, 64]} />
          <meshStandardMaterial color="#0e0f12" metalness={0.4} roughness={0.6} />
        </mesh>

        {/* víčko */}
        <mesh position={[0, 3.2, 0]}>
          <cylinderGeometry args={[0.23, 0.23, 0.36, 64]} />
          <meshPhysicalMaterial color="#1b1c20" metalness={0.35} roughness={0.5} clearcoat={0.3} />
        </mesh>

        {/* poutko na víčku */}
        <mesh position={[0, 3.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.07, 0.02, 14, 40]} />
          <meshStandardMaterial color="#1b1c20" metalness={0.3} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
});
