import { Environment, Lightformer } from '@react-three/drei';

// Studiové osvětlení pro realistický kov. HDRI se skládá procedurálně
// z „lightformerů" (žádné stahování souboru → funguje i offline / z file://).
// Cíl: světlý gradient shora + svislé highlight pruhy = produktový „studio" odraz.
export function Studio() {
  return (
    <>
      <ambientLight intensity={0.18} />

      <Environment resolution={512} frames={1}>
        {/* tmavé pozadí scény → kov má kontrast (tmavé dno odrazu) */}
        <Lightformer form="rect" intensity={0.35} position={[0, 0, -7]} scale={[24, 24, 1]} color="#1b1c22" />

        {/* velký horní softbox (hlavní světlo) */}
        <Lightformer
          form="rect"
          intensity={3.4}
          position={[0, 6, 2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[12, 12, 1]}
          color="#ffffff"
        />

        {/* svislé highlight pruhy – kresba na boku láhve */}
        <Lightformer form="rect" intensity={5.5} position={[-2.6, 1.2, 3.2]} scale={[0.55, 6.5, 1]} color="#e2f4ff" />
        <Lightformer form="rect" intensity={2.6} position={[2.8, 0.6, 2.6]} scale={[0.4, 5.5, 1]} color="#ffffff" />

        {/* studený fill zleva + teplý rim zezadu vpravo */}
        <Lightformer form="rect" intensity={1.4} position={[-4.2, 0.4, 1]} scale={[3.5, 7, 1]} color="#a6dcff" />
        <Lightformer form="ring" intensity={2.6} position={[4.2, 2.2, -3]} scale={2.4} color="#e6a16a" />
      </Environment>

      {/* directional pro vržený kontaktní stín */}
      <directionalLight position={[4, 7, 4]} intensity={1.0} castShadow shadow-mapSize={[1024, 1024]} />
    </>
  );
}
