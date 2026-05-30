import { Environment, Lightformer } from '@react-three/drei';

// Sdílené studiové osvětlení + HDRI z „lightformerů“ (generuje se procedurálně,
// bez stahování souborů) — dává kovu realistické odrazy.
export function Studio() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} />
      <directionalLight position={[-6, 2, -4]} intensity={0.8} color="#79e3ff" />

      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 3, 5]} scale={[8, 6, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[-5, 1, 2]} scale={[4, 8, 1]} color="#9fdcff" />
        <Lightformer form="ring" intensity={2.2} position={[5, 2, -3]} scale={3} color="#e6a16a" />
        <Lightformer form="rect" intensity={1} position={[0, -3, 2]} scale={[6, 3, 1]} />
      </Environment>
    </>
  );
}
