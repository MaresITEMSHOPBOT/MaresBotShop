'use strict';
/* Boží schopnosti – zásahy do světa. Nic tu nekreslí, jen mění stav a hlásí efekty. */

function fx(sim, o) { sim.fx.push(o); }

function killIn(sim, x, y, r, chance, cause) {
    let n = 0;
    sim.forEachNear(x, y, r, (c, d2) => {
        const t = 1 - Math.sqrt(d2) / r;
        if (sim.rng() < chance * (0.35 + t)) { sim.kill(c, cause); n++; }
    });
    return n;
}

function crater(world, x, y, r, depth) {
    world.forEachInRadius(x, y, r, (i, tx, ty, t) => {
        const f = 1 - t;
        if (world.height[i] > world.seaLevel - 0.05) {
            world.height[i] = clamp(world.height[i] - depth * f * f + depth * 0.22 * t, 0.02, 1);
        }
        world.veg[i] = Math.max(0, world.veg[i] - f);
        world.fert[i] = Math.max(0.02, world.fert[i] - 0.4 * f);
    });
}

function wreckStructures(sim, x, y, r, chance) {
    for (let k = 0; k < sim.structures.length; k++) {
        const s = sim.structures[k];
        if (s.alive && dist2(s.x, s.y, x, y) < r * r && sim.rng() < chance) sim.destroyStructure(k, true);
    }
}

const POWERS = [
    /* ---------------- STVOŘENÍ ---------------- */
    {
        id: 'inspect', name: 'Zkoumat', emoji: '🔍', cost: 0, group: 'create', hold: false,
        desc: 'Prohlédni si tvora nebo políčko světa.',
        apply() { }
    },
    {
        id: 'spawn', name: 'Stvořit život', emoji: '🐣', cost: 10, group: 'create', hold: false,
        desc: 'Vysadí hrst nových tvorů. Když svět osiří, začni tímhle.',
        apply(sim, x, y, r) {
            const w = sim.world;
            let sp = null, best = 0;
            sim.forEachNear(x, y, 30, (c) => { const s = sim.getSpecies(c.sp); if (s && s.count > best) { best = s.count; sp = s; } });
            const genes = new Float32Array(GENE_COUNT);
            if (sp) genes.set(sp.genes);
            else {
                const base = [0.3, 0.35, 0.35, 0.5, 0.55, 0.15, 0.4, 0.35, 0.15, 0.2, 0.35];
                for (let k = 0; k < GENE_COUNT; k++) genes[k] = base[k];
                sp = sim.createSpecies(genes, null);
                sim.log(`✨ Stvořil jsi nový rod ${sp.name}`, 'good');
            }
            let placed = 0;
            const g = new Float32Array(GENE_COUNT);
            for (let k = 0; k < 60 && placed < 14; k++) {
                const a = sim.rng() * Math.PI * 2, d = sim.rng() * r;
                const px = clamp(x + Math.cos(a) * d, 1, w.w - 2), py = clamp(y + Math.sin(a) * d, 1, w.h - 2);
                const i = (py | 0) * w.w + (px | 0);
                if (w.water[i] > sp.genes[G_SWIM] * 0.6 + 0.03) continue;
                for (let q = 0; q < GENE_COUNT; q++) g[q] = clamp(genes[q] + (sim.rng() * 2 - 1) * 0.07, 0, 1);
                if (sim.spawn(px, py, g, sp)) placed++;
            }
            fx(sim, { type: 'sparkle', x, y, r, life: 40, max: 40, color: '#7dffc4' });
            sim.love = Math.min(1, sim.love + 0.01);
            return placed > 0;
        }
    },
    {
        id: 'bless', name: 'Požehnání', emoji: '✨', cost: 8, group: 'create', hold: true,
        desc: 'Uzdravuje, sytí, léčí nemoci a rozdmýchává víru. Věřící ti vracejí víru zpět.',
        apply(sim, x, y, r) {
            sim.zones.push({ type: 'bless', x, y, r, life: 130 });
            fx(sim, { type: 'sparkle', x, y, r, life: 50, max: 50, color: '#ffe89a' });
            sim.love = Math.min(1, sim.love + 0.02);
            sim.forEachNear(x, y, r, (c) => { c.faith = Math.min(1, c.faith + 0.45); });
            return true;
        }
    },
    {
        id: 'rain', name: 'Déšť', emoji: '🌧️', cost: 5, group: 'create', hold: true,
        desc: 'Zavlaží krajinu, uhasí požáry a nastartuje růst rostlin.',
        apply(sim, x, y, r) {
            sim.zones.push({ type: 'rain', x, y, r, life: 170 });
            fx(sim, { type: 'rain', x, y, r, life: 170, max: 170 });
            sim.love = Math.min(1, sim.love + 0.008);
            return true;
        }
    },
    {
        id: 'grow', name: 'Rozkvět', emoji: '🌱', cost: 4, group: 'create', hold: true,
        desc: 'Okamžitě vyžene vegetaci a obnoví úrodnost půdy.',
        apply(sim, x, y, r) {
            const w = sim.world;
            w.forEachInRadius(x, y, r, (i, tx, ty, t) => {
                if (w.water[i] > 0.16) return;
                w.veg[i] = Math.min(1, w.veg[i] + 0.5 * (1 - t));
                w.fert[i] = Math.min(1, w.fert[i] + 0.12 * (1 - t));
                w.rad[i] = Math.max(0, w.rad[i] - 0.02);
            });
            fx(sim, { type: 'sparkle', x, y, r, life: 26, max: 26, color: '#8ef07a' });
            sim.love = Math.min(1, sim.love + 0.006);
            return true;
        }
    },
    {
        id: 'reveal', name: 'Zjevení', emoji: '👁️', cost: 14, group: 'create', hold: false,
        desc: 'Zjevíš se tvorům. Získáš věřící – a ti ti pak posílají víru (tvou manu).',
        apply(sim, x, y, r) {
            let n = 0;
            sim.forEachNear(x, y, r * 1.6, (c) => { c.faith = Math.min(1, c.faith + 0.55 + c.intel * 0.3); n++; });
            fx(sim, { type: 'beam', x, y, r: r * 1.6, life: 60, max: 60, color: '#ffe9a8' });
            sim.love = Math.min(1, sim.love + 0.03);
            if (n > 0) sim.log(`👁️ Zjevil ses ${n} tvorům`, 'good');
            return true;
        }
    },
    {
        id: 'mutate', name: 'Mutace', emoji: '🧬', cost: 16, group: 'create', hold: false,
        desc: 'Zamíchá geny všech tvorů v okolí. Rychlá cesta k novým druhům – i k monstrům.',
        apply(sim, x, y, r) {
            let n = 0;
            sim.forEachNear(x, y, r, (c) => {
                for (let k = 0; k < GENE_COUNT; k++) c.g[k] = clamp(c.g[k] + (sim.rng() * 2 - 1) * 0.22, 0, 1);
                sim.derive(c);
                c.energy = Math.min(c.energy, c.maxE);
                n++;
            });
            fx(sim, { type: 'sparkle', x, y, r, life: 34, max: 34, color: '#d08cff' });
            if (n) sim.log(`🧬 Zasáhl jsi do genů ${n} tvorů`, 'evo');
            return true;
        }
    },

    /* ---------------- ZEMĚ ---------------- */
    {
        id: 'raise', name: 'Zvednout zemi', emoji: '⛰️', cost: 3, group: 'terra', hold: true,
        desc: 'Vytáhne pevninu vzhůru – nové ostrovy, hory a hráze proti vodě.',
        apply(sim, x, y, r, s) {
            const w = sim.world;
            w.forEachInRadius(x, y, r, (i, tx, ty, t) => {
                const f = (1 - t) * (1 - t);
                w.height[i] = clamp(w.height[i] + 0.02 * f * s, 0, 1);
                if (w.height[i] > w.seaLevel && w.water[i] > 0) w.water[i] = Math.max(0, w.water[i] - 0.02 * f);
            });
            return true;
        }
    },
    {
        id: 'lower', name: 'Prohloubit', emoji: '🕳️', cost: 3, group: 'terra', hold: true,
        desc: 'Propadne terén dolů. Pod hladinou vznikne moře, na souši údolí a jezera.',
        apply(sim, x, y, r, s) {
            const w = sim.world;
            w.forEachInRadius(x, y, r, (i, tx, ty, t) => {
                const f = (1 - t) * (1 - t);
                w.height[i] = clamp(w.height[i] - 0.02 * f * s, 0.01, 1);
            });
            return true;
        }
    },
    {
        id: 'flood', name: 'Povodeň', emoji: '🌊', cost: 12, group: 'terra', hold: true,
        desc: 'Vylije obrovské množství vody. Ta pak teče podle terénu a topí vše, co neumí plavat.',
        apply(sim, x, y, r) {
            const w = sim.world;
            w.forEachInRadius(x, y, r, (i, tx, ty, t) => {
                w.water[i] += 0.35 * (1 - t);
                w.moist[i] = 1;
                if (w.fire[i] > 0) { w.fire[i] = 0; w.fireSet.delete(i); }
            });
            fx(sim, { type: 'splash', x, y, r, life: 34, max: 34 });
            sim.fear = Math.min(1, sim.fear + 0.02);
            return true;
        }
    },
    {
        id: 'dry', name: 'Vysušit', emoji: '🏜️', cost: 8, group: 'terra', hold: true,
        desc: 'Odsaje vodu a vláhu. Z jezer jsou pláně, z pralesů poušť.',
        apply(sim, x, y, r) {
            const w = sim.world;
            w.forEachInRadius(x, y, r, (i, tx, ty, t) => {
                const f = 1 - t;
                if (w.height[i] > w.seaLevel) w.water[i] = Math.max(0, w.water[i] - 0.3 * f);
                w.moist[i] = Math.max(0, w.moist[i] - 0.5 * f);
            });
            return true;
        }
    },

    /* ---------------- ZKÁZA ---------------- */
    {
        id: 'lightning', name: 'Blesk', emoji: '⚡', cost: 4, group: 'doom', hold: false,
        desc: 'Úder z nebes. Zabíjí na místě a zapaluje suchý porost.',
        apply(sim, x, y, r) {
            const w = sim.world;
            killIn(sim, x, y, Math.max(1.5, r * 0.35), 0.95, 'god');
            w.forEachInRadius(x, y, r * 0.5, (i) => { if (sim.rng() < 0.5) w.ignite(i); });
            fx(sim, { type: 'bolt', x, y, life: 18, max: 18 });
            sim.fear = Math.min(1, sim.fear + 0.006);
            return true;
        }
    },
    {
        id: 'fire', name: 'Požár', emoji: '🔥', cost: 7, group: 'doom', hold: true,
        desc: 'Zapálí krajinu. Oheň se sám šíří po vegetaci – zastaví ho jen voda nebo poušť.',
        apply(sim, x, y, r) {
            const w = sim.world;
            w.forEachInRadius(x, y, r, (i) => { if (sim.rng() < 0.65) w.ignite(i); });
            fx(sim, { type: 'sparkle', x, y, r, life: 20, max: 20, color: '#ff9a3c' });
            sim.fear = Math.min(1, sim.fear + 0.008);
            return true;
        }
    },
    {
        id: 'bomb', name: 'Bomba', emoji: '💣', cost: 15, group: 'doom', hold: false,
        desc: 'Klasika. Kráter, tlaková vlna, mrtví a hořící okolí.',
        apply(sim, x, y, r) {
            const w = sim.world;
            crater(w, x, y, r, 0.05);
            killIn(sim, x, y, r * 1.15, 0.95, 'god');
            wreckStructures(sim, x, y, r * 1.2, 0.9);
            w.forEachInRadius(x, y, r * 1.5, (i) => { if (sim.rng() < 0.3) w.ignite(i); });
            fx(sim, { type: 'boom', x, y, r: r * 1.6, life: 34, max: 34 });
            sim.fear = Math.min(1, sim.fear + 0.03);
            return true;
        }
    },
    {
        id: 'nuke', name: 'Jaderná puma', emoji: '☢️', cost: 45, group: 'doom', hold: false,
        desc: 'Obří kráter a radioaktivní spad. Radiace zabíjí, ale také prudce zrychluje mutace.',
        apply(sim, x, y, r) {
            const w = sim.world;
            const R = r * 2.2;
            crater(w, x, y, R, 0.09);
            killIn(sim, x, y, R * 1.2, 1.0, 'god');
            wreckStructures(sim, x, y, R * 1.3, 1);
            w.forEachInRadius(x, y, R * 1.6, (i, tx, ty, t) => {
                w.rad[i] = Math.min(1, w.rad[i] + 0.9 * (1 - t));
                if (sim.rng() < 0.5 * (1 - t)) w.ignite(i);
            });
            fx(sim, { type: 'boom', x, y, r: R * 1.8, life: 60, max: 60, nuke: true });
            sim.fear = Math.min(1, sim.fear + 0.12);
            sim.log('☢️ Jaderný výbuch zamořil krajinu', 'bad');
            return true;
        }
    },
    {
        id: 'meteor', name: 'Meteorit', emoji: '☄️', cost: 60, group: 'doom', hold: false,
        desc: 'Padá z nebe pár vteřin. Po dopadu obří kráter, ohnivá bouře a zatmění – doba ledová.',
        apply(sim, x, y, r) {
            const R = r * 2.6;
            sim.meteors.push({
                x, y, r: R, life: 46, max: 46,
                onImpact: (m) => {
                    const w = sim.world;
                    crater(w, m.x, m.y, R, 0.14);
                    killIn(sim, m.x, m.y, R * 1.4, 1.0, 'god');
                    wreckStructures(sim, m.x, m.y, R * 1.5, 1);
                    w.forEachInRadius(m.x, m.y, R * 2.2, (i, tx, ty, t) => {
                        if (sim.rng() < 0.75 * (1 - t)) w.ignite(i);
                        w.fert[i] = Math.min(1, w.fert[i] + 0.15 * (1 - t));
                    });
                    for (let k = 0; k < 6; k++) {
                        const a = sim.rng() * Math.PI * 2, d = R * (1 + sim.rng() * 2);
                        const px = clamp(m.x + Math.cos(a) * d, 1, w.w - 2), py = clamp(m.y + Math.sin(a) * d, 1, w.h - 2);
                        w.forEachInRadius(px, py, R * 0.3, (i) => w.ignite(i));
                        fx(sim, { type: 'boom', x: px, y: py, r: R * 0.5, life: 26, max: 26 });
                    }
                    w.dust = Math.min(22, w.dust + 11);
                    fx(sim, { type: 'boom', x: m.x, y: m.y, r: R * 2.4, life: 80, max: 80 });
                    fx(sim, { type: 'shock', x: m.x, y: m.y, r: R * 6, life: 70, max: 70 });
                    sim.log('☄️ Meteorit dopadl! Obloha potemněla popelem.', 'bad');
                }
            });
            fx(sim, { type: 'meteor', x, y, life: 46, max: 46 });
            sim.fear = Math.min(1, sim.fear + 0.15);
            return true;
        }
    },
    {
        id: 'volcano', name: 'Sopka', emoji: '🌋', cost: 40, group: 'doom', hold: false,
        desc: 'Otevře sopouch. Láva teče z kopce, spaluje vše – a po vychladnutí tvoří úrodnou půdu.',
        apply(sim, x, y, r) {
            sim.volcanoes.push({ x: Math.floor(x), y: Math.floor(y), life: 220 + r * 12 });
            sim.world.forEachInRadius(x, y, Math.max(1, r * 0.4), (i) => sim.world.addLava(i, 0.6));
            fx(sim, { type: 'boom', x, y, r: r * 1.2, life: 40, max: 40 });
            sim.fear = Math.min(1, sim.fear + 0.05);
            sim.log('🌋 Ze země se probudila sopka', 'bad');
            return true;
        }
    },
    {
        id: 'tornado', name: 'Tornádo', emoji: '🌪️', cost: 25, group: 'doom', hold: false,
        desc: 'Vypustí smršť, která si sama bloudí krajinou, ničí sídla a rozhazuje tvory.',
        apply(sim, x, y, r) {
            sim.tornados.push({ x, y, dx: 0.4, dy: 0.2, r: Math.max(3.5, r * 0.85), life: 420 });
            sim.fear = Math.min(1, sim.fear + 0.03);
            sim.log('🌪️ Krajinou se prohnalo tornádo', 'bad');
            return true;
        }
    },
    {
        id: 'freeze', name: 'Mráz', emoji: '❄️', cost: 20, group: 'doom', hold: true,
        desc: 'Ledová vichřice. Kdo nemá odolnost vůči zimě, zmrzne – ostatní zesílí.',
        apply(sim, x, y, r) {
            sim.zones.push({ type: 'freeze', x, y, r, life: 210 });
            fx(sim, { type: 'frost', x, y, r, life: 210, max: 210 });
            sim.fear = Math.min(1, sim.fear + 0.02);
            return true;
        }
    },
    {
        id: 'plague', name: 'Mor', emoji: '🦠', cost: 30, group: 'doom', hold: false,
        desc: 'Nakazí tvory nemocí, která se sama šíří dotykem. Kdo přežije, získá imunitu.',
        apply(sim, x, y, r) {
            let n = 0;
            sim.forEachNear(x, y, r, (c) => { if (!c.imm) { c.sick = 1; n++; } });
            fx(sim, { type: 'sparkle', x, y, r, life: 40, max: 40, color: '#9ee86a' });
            sim.fear = Math.min(1, sim.fear + 0.05);
            if (n) sim.log(`🦠 Vypukl mor – nakaženo ${n} tvorů`, 'bad');
            return true;
        }
    },
    {
        id: 'quake', name: 'Zemětřesení', emoji: '〰️', cost: 35, group: 'doom', hold: false,
        desc: 'Rozláme zemi, srovná sídla se zemí a otevře trhliny, do kterých se valí voda.',
        apply(sim, x, y, r) {
            const w = sim.world;
            const R = r * 2;
            const a = sim.rng() * Math.PI;
            const nx = Math.cos(a), ny = Math.sin(a);
            w.forEachInRadius(x, y, R, (i, tx, ty, t) => {
                const rel = (tx - x) * ny - (ty - y) * nx;              // vzdálenost od zlomu
                const f = (1 - t) * Math.exp(-Math.abs(rel) * 0.55);
                w.height[i] = clamp(w.height[i] - 0.09 * f + (sim.rng() - 0.5) * 0.01 * (1 - t), 0.01, 1);
            });
            killIn(sim, x, y, R, 0.45, 'god');
            wreckStructures(sim, x, y, R, 0.85);
            fx(sim, { type: 'shock', x, y, r: R * 1.6, life: 45, max: 45 });
            sim.fear = Math.min(1, sim.fear + 0.06);
            sim.log('〰️ Zemí otřáslo zemětřesení', 'bad');
            return true;
        }
    },
    {
        id: 'smite', name: 'Boží hněv', emoji: '☠️', cost: 12, group: 'doom', hold: true,
        desc: 'Přesná poprava. Tvorové v okruhu prostě zmizí – ostatní se tě začnou bát.',
        apply(sim, x, y, r) {
            const n = killIn(sim, x, y, r, 1.0, 'god');
            fx(sim, { type: 'beam', x, y, r, life: 26, max: 26, color: '#ff6b6b' });
            sim.fear = Math.min(1, sim.fear + 0.02 + n * 0.002);
            return true;
        }
    }
];

const POWER_MAP = {};
for (const p of POWERS) POWER_MAP[p.id] = p;

function usePower(sim, id, x, y, radius, strength = 1) {
    const p = POWER_MAP[id];
    if (!p) return false;
    if (p.cost > 0 && sim.faith < p.cost) return false;
    const ok = p.apply(sim, x, y, radius, strength);
    if (ok !== false && p.cost > 0) sim.faith -= p.cost;
    return ok !== false;
}

if (typeof module !== 'undefined') {
    module.exports = { POWERS, POWER_MAP, usePower };
}
