/* Rychlý test simulace bez prohlížeče:  node hra/test/sim-test.js [tiků] [semínko]
   Ověřuje, že svět a život běží a populace se ustálí (nevyhyne ani nepřeteče). */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'js');
const src = ['core.js', 'world.js', 'creatures.js', 'powers.js']
    .map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');

const api = new Function(`${src}\nreturn {World, Sim, POWERS, usePower, GENE_INFO, TICKS_PER_YEAR, BAL};`)();

const ticks = parseInt(process.argv[2] || '4000', 10);
const seed = parseInt(process.argv[3] || '12345', 10);

const t0 = Date.now();
const world = new api.World(320, 200, seed);
const sim = new api.Sim(world, seed);
const genT = Date.now() - t0;

let land = 0, veg = 0;
for (let i = 0; i < world.n; i++) { if (world.height[i] >= world.seaLevel) land++; veg += world.veg[i]; }
console.log(`generace světa: ${genT} ms, souš ${(100 * land / world.n).toFixed(1)} %, průměrná vegetace ${(veg / world.n).toFixed(3)}`);

sim.seedLife(180);

const t1 = Date.now();
for (let t = 1; t <= ticks; t++) {
    sim.step();
    if (t % Math.max(1, Math.floor(ticks / 10)) === 0) {
        const s = sim.stats();
        console.log(`tik ${String(t).padStart(6)} | rok ${String(world.year).padStart(4)} | pop ${String(s.pop).padStart(5)} | druhů ${String(s.species).padStart(3)} | dravců ${String(s.carn).padStart(4)} | int ${s.avgIntel.toFixed(2)} | vel ${s.avgSize.toFixed(2)} | staveb ${s.structures} | víra ${sim.faith.toFixed(0)} | generací ${sim.generation}`);
    }
}
const simT = Date.now() - t1;
console.log(`\n${ticks} tiků za ${simT} ms → ${(simT / ticks).toFixed(2)} ms/tik (60 FPS potřebuje < 8 ms)`);
console.log(`vrchol populace: ${sim.peakPop}, celkem narozeno ${sim.born}, zemřelo ${sim.died}, druhů celkem ${sim.species.length}`);

// zkouška božích schopností – nic nesmí spadnout
sim.faith = 100000;
for (const p of api.POWERS) {
    const x = 40 + Math.random() * 240, y = 30 + Math.random() * 130;
    api.usePower(sim, p.id, x, y, 8, 1);
}
for (let t = 0; t < 400; t++) sim.step();
const s2 = sim.stats();
console.log(`po všech zásazích: pop ${s2.pop}, druhů ${s2.species}, ohně ${world.fireSet.size}, lávy ${world.lavaSet.size}, efektů ${sim.fx.length}`);
console.log('poslední události:');
sim.events.slice(-8).forEach(e => console.log(`  [${e.year}] ${e.text}`));
