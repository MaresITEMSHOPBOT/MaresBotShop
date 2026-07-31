/* Test simulace bez prohlížeče:  node hra/test/sim-test.js [tiků] [semínko]
   Ověřuje, že národy rostou, zakládají vesnice, válčí – a že tik stíhá běžet včas. */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'js');
const src = ['core.js', 'world.js', 'life.js', 'powers.js']
    .map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const api = new Function(`${src}\nreturn { World, Life, T, TILE_NAME, TOOLS, applyTool, RACES, ERAS, setWorldLimits, fmt };`)();

const ticks = parseInt(process.argv[2] || '4000', 10);
const seed = parseInt(process.argv[3] || '12345', 10);

const t0 = Date.now();
const W = parseInt(process.argv[4] || '176', 10), H = Math.round(W * 0.625);
api.setWorldLimits(W, H);
const world = new api.World(W, H, seed);
const life = new api.Life(world, seed);
console.log(`generace světa: ${Date.now() - t0} ms`);

const counts = {};
for (let i = 0; i < world.n; i++) counts[world.type[i]] = (counts[world.type[i]] || 0) + 1;
console.log('krajina: ' + Object.entries(counts)
    .map(([t, n]) => `${api.TILE_NAME[t]} ${(100 * n / world.n).toFixed(0)} %`).join(', '));

for (const r of ['human', 'orc', 'elf', 'dwarf']) {
    const s = life.homeSpot(r);
    if (s) life.seedTribe(s.x, s.y, r, 60);
    else console.log('!! nenašel jsem místo pro ' + r);
}
for (let k = 0; k < 40; k++) {
    const s = life.homeSpot('human');
    if (s) life.spawnAnimal(s.x, s.y, k % 9 === 0 ? 'wolf' : k % 7 === 0 ? 'deer' : 'sheep');
}

const t1 = Date.now();
for (let t = 1; t <= ticks; t++) {
    life.step();
    if (t % Math.max(1, Math.floor(ticks / 10)) === 0) {
        const s = life.summary();
        console.log(`rok ${String(Math.floor(life.tick / 60)).padStart(4)}` +
            ` | lidí ${api.fmt(s.pop).padStart(9)} | říší ${s.realms.length} | sídel ${String(s.villages).padStart(3)}` +
            ` | měst ${String(s.cities).padStart(2)} | staveb ${String(s.houses).padStart(4)} | zlato ${api.fmt(s.gold).padStart(8)}` +
            ` | válek ${s.wars} | doba ${api.ERAS[s.era].short}${s.moon ? ' 🚀MĚSÍC' : ''}`);
    }
}
const simT = Date.now() - t1;
console.log(`\n${ticks} tiků za ${simT} ms → ${(simT / ticks).toFixed(2)} ms/tik (hra běží 8 tiků/s, takže je potřeba < 15 ms)`);

const s = life.summary();
for (const r of s.realms) {
    console.log(`  👑 ${r.name} (${api.RACES[r.race].name}): ${r.villages.length} sídel, ${api.fmt(r.pop)} lidí, ${api.ERAS[r.era].name}${r.moon ? ', byli na Měsíci 🚀' : ''}`);
}

// všechny nástroje musí projít bez pádu
life.faith = 100000;
for (const tool of api.TOOLS) {
    const x = 20 + Math.random() * 100, y = 15 + Math.random() * 60;
    api.applyTool(life, tool.id, Math.floor(x), Math.floor(y), 5);
}
for (let t = 0; t < 400; t++) life.step();
const s2 = life.summary();
console.log(`po všech nástrojích: lidí ${api.fmt(s2.pop)}, sídel ${s2.villages}, říší ${s2.realms.length}, ohňů ${world.fireSet.size}, lávy ${world.lavaSet.size}`);
console.log('\nkronika:');
life.events.slice(-12).forEach(e => console.log(`  [${e.year}. rok] ${e.text}`));
