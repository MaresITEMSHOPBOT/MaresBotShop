import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- Silueta moderní prémiové termoláhve (x = poloměr, y = výška) ---------
// Otočením profilu kolem osy Y vznikne hladké rotační těleso (LatheGeometry).
const BODY_PROFILE = [
  [0.0, 0.0],
  [0.30, 0.0],
  [0.44, 0.012],
  [0.51, 0.05],
  [0.542, 0.12],
  [0.55, 0.22],
  [0.55, 1.86],
  [0.547, 1.99],
  [0.534, 2.13],
  [0.503, 2.3],
  [0.452, 2.47],
  [0.386, 2.62],
  [0.31, 2.73],
  [0.262, 2.81],
  [0.246, 2.87],
  [0.243, 2.95],
  [0.247, 2.99],
  [0.236, 3.01],
];

// Víčko (matné, tmavší) – posazené na hrdlo.
const CAP_PROFILE = [
  [0.0, 0.0],
  [0.252, 0.0],
  [0.262, 0.05],
  [0.262, 0.28],
  [0.253, 0.33],
  [0.21, 0.37],
  [0.12, 0.4],
  [0.0, 0.405],
];

const CAP_Y = 2.9;

function lathe(profile, segments = 160) {
  const pts = profile.map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(pts, segments);
  geo.computeVertexNormals();
  return geo;
}

// Čistě vizuální komponenta láhve. Transformaci řídí rodič (ref).
// Barva se plynule „přelévá" (lerp) k cílové → hladké přepnutí odstínu.
export const Bottle = forwardRef(function Bottle(
  { colorHex = '#2c2e33', metalness = 0.85, roughness = 0.3, ...props },
  ref,
) {
  const bodyGeo = useMemo(() => lathe(BODY_PROFILE), []);
  const capGeo = useMemo(() => lathe(CAP_PROFILE, 96), []);
  const matRef = useRef();
  const target = useMemo(() => new THREE.Color(colorHex), []);

  useEffect(
    () => () => {
      bodyGeo.dispose();
      capGeo.dispose();
    },
    [bodyGeo, capGeo],
  );

  useEffect(() => {
    target.set(colorHex);
    if (matRef.current) {
      matRef.current.metalness = metalness;
      matRef.current.roughness = roughness;
    }
  }, [colorHex, metalness, roughness, target]);

  useFrame(() => {
    if (matRef.current) matRef.current.color.lerp(target, 0.16);
  });

  return (
    <group ref={ref} {...props}>
      <group position={[0, -1.66, 0]}>
        {/* tělo láhve – leštěný / práškově lakovaný kov s clearcoat vrstvou */}
        <mesh geometry={bodyGeo} castShadow>
          <meshPhysicalMaterial
            ref={matRef}
            color={colorHex}
            metalness={metalness}
            roughness={roughness}
            clearcoat={0.6}
            clearcoatRoughness={0.28}
            envMapIntensity={1.5}
            reflectivity={0.6}
          />
        </mesh>

        {/* závitový kroužek pod víčkem */}
        <mesh position={[0, 2.86, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.247, 0.018, 16, 80]} />
          <meshStandardMaterial color="#0c0d10" metalness={0.5} roughness={0.5} />
        </mesh>

        {/* víčko – matný tmavý kov */}
        <mesh geometry={capGeo} position={[0, CAP_Y, 0]} castShadow>
          <meshPhysicalMaterial color="#1a1b1f" metalness={0.55} roughness={0.55} clearcoat={0.25} />
        </mesh>

        {/* jemný úchopový prstenec na víčku */}
        <mesh position={[0, CAP_Y + 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.258, 0.012, 12, 64]} />
          <meshStandardMaterial color="#0a0b0e" metalness={0.4} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
});
