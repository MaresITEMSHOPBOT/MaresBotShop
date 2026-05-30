// Sdílený mutovatelný stav, který DOM/animace zapisují a 3D scéna čte
// (přes useFrame), aniž by se kvůli tomu překresloval React strom.
export const scrollState = { y: 0, progress: 0, velocity: 0 };
export const pointerState = { x: 0, y: 0 };
