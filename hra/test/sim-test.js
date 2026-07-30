/* Test simulace bez prohlížeče:  node hra/test/sim-test.js [tiků] [semínko]
   Ověřuje, že národy rostou, zakládají vesnice, válčí – a že tik stíhá běžet včas. */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'js');
const src = ['core.js', 'world.js', 'life.js', 'powers.js']
    .map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const api = new Function(`${src}\nreturn { World, Life, T, TILE_NAME, TOOLS, applyTool, RACES };`)();

const ticks = parseInt(process.argv[2] || '4000', 10);
const seed = parseInt(process.argv[3] || '12345', 10);

const t0 = Date.now();
const world = new api.World(144, 90, seed);
const life = new api.Life(world, seed);
console.log(`generace světa: ${Date.now() - t0} ms`);

const counts = {};
for (let i = 0; i < world.n; i++) counts[world.type[i]] = (counts[world.type[i]] || 0) + 1;
console.log('krajina: ' + Object.entries(counts)
    .map(([t, n]) => `${api.TILE_NAME[t]} ${(100 * n / world.n).toFixed(0)} %`).join(', '));

for (const r of ['human', 'orc', 'elf']) {
    const s = life.homeSpot(r);
    if (s) life.seedTribe(s.x, s.y, r, 6);
    else console.log('!! nenašel jsem místo pro ' + r);
}
for (let k = 0; k < 26; k++) {
    const s = life.homeSpot('human');
    if (s) life.spawnAnimal(s.x, s.y, k % 9 === 0 ? 'wolf' : 'sheep');
}

const t1 = Date.now();
for (let t = 1; t <= ticks; t++) {
    life.step();
    if (t % Math.max(1, Math.floor(ticks / 10)) === 0) {
        const s = life.summary();
        console.log(`tik ${String(t).padStart(6)} | rok ${String(Math.floor(life.tick / 60)).padStart(4)}` +
            ` | lidí ${String(s.people).padStart(4)} | zvířat ${String(s.animals).padStart(3)}` +
            ` | království ${s.realms.length} | vesnic ${String(s.villages).padStart(2)} | staveb ${String(s.houses).padStart(3)}` +
            ` | vojáků ${String(s.soldiers).padStart(3)} | válek ${s.wars}`);
    }
}
const simT = Date.now() - t1;
console.log(`\n${ticks} tiků za ${simT} ms → ${(simT / ticks).toFixed(2)} ms/tik (hra běží 8 tiků/s, takže je potřeba < 15 ms)`);

const s = life.summary();
for (const r of s.realms) {
    console.log(`  👑 ${r.name} (${api.RACES[r.race].name}): ${r.villages.length} vesnic, války: ${r.wars.size}`);
}

// všechny nástroje musí projít bez pádu
life.faith = 100000;
for (const tool of api.TOOLS) {
    const x = 20 + Math.random() * 100, y = 15 + Math.random() * 60;
    api.applyTool(life, tool.id, Math.floor(x), Math.floor(y), 5);
}
for (let t = 0; t < 400; t++) life.step();
const s2 = life.summary();
console.log(`po všech nástrojích: lidí ${s2.people}, vesnic ${s2.villages}, království ${s2.realms.length}, ohňů ${world.fireSet.size}, lávy ${world.lavaSet.size}`);
console.log('\nkronika:');
life.events.slice(-12).forEach(e => console.log(`  [${e.year}. rok] ${e.text}`));
