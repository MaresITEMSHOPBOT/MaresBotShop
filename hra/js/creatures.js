'use strict';
/* Život: geny, chování, rozmnožování, evoluce, druhy, civilizace a víra. Bez DOM. */

const G_SIZE = 0, G_SPEED = 1, G_VISION = 2, G_METAB = 3, G_FERT = 4, G_AGGR = 5,
    G_HEAT = 6, G_COLD = 7, G_SWIM = 8, G_INTEL = 9, G_LIFE = 10;
const GENE_COUNT = 11;

const GENE_INFO = [
    { key: 'size', name: 'Velikost', icon: '📏' },
    { key: 'speed', name: 'Rychlost', icon: '💨' },
    { key: 'vision', name: 'Zrak', icon: '👁️' },
    { key: 'metab', name: 'Metabolismus', icon: '🔋' },
    { key: 'fert', name: 'Plodnost', icon: '🥚' },
    { key: 'aggr', name: 'Dravost', icon: '🦷' },
    { key: 'heat', name: 'Odolnost vůči teplu', icon: '🔥' },
    { key: 'cold', name: 'Odolnost vůči zimě', icon: '❄️' },
    { key: 'swim', name: 'Plavání', icon: '🌊' },
    { key: 'intel', name: 'Inteligence', icon: '🧠' },
    { key: 'life', name: 'Délka života', icon: '⏳' }
];

/* Váhy pro určení, jak moc se dva genomy liší (dravost a plavání dělají nové druhy snáz) */
const SPECIATION_W = [1, 1, 0.7, 0.8, 0.8, 1.6, 1, 1, 1.5, 1.2, 0.7];

const SYL_A = ['Gra', 'Mor', 'Zel', 'Kra', 'Ven', 'Lup', 'Ort', 'Byš', 'Nur', 'Tar', 'Hel', 'Sar', 'Dro', 'Pyr', 'Ves', 'Klo', 'Ryn', 'Ozz', 'Fen', 'Chy'];
const SYL_B = ['bar', 'don', 'mir', 'tak', 'lus', 'nex', 'pod', 'ryt', 'sil', 'vor', 'zim', 'gan', 'kul', 'ther', 'mos', 'dar', 'fix', 'pil', 'ork', 'nis'];
const SYL_C = ['us', 'ix', 'on', 'ar', 'is', 'ek', 'or', 'yn', 'an', 'ul'];

const BAL = {
    maxPop: 2600,
    eatRate: 0.16,           // kolik vegetace sežere za tik
    foodEnergy: 14,          // energie z jednotky vegetace
    baseCost: 0.78,
    sizeCost: 0.38,
    speedCost: 1.6,
    visionCost: 0.03,
    brainCost: 0.05,
    tempCost: 0.055,
    matureAge: 55,
    birthCost: 0.50,         // podíl maximální energie, který stojí zplození
    speciationDist: 0.66,
    minSpeciesPop: 20
};

class Species {
    constructor(id, name, genes, year, parent, hue) {
        this.id = id;
        this.name = name;
        this.genes = Float32Array.from(genes);
        this.born = year;
        this.parent = parent;
        this.hue = hue;
        this.count = 0;
        this.peak = 0;
        this.extinct = false;
        this.extinctYear = null;
        this.color = `hsl(${hue}, 72%, 60%)`;
        this.colorDark = `hsl(${hue}, 60%, 34%)`;
    }
}

class Sim {
    constructor(world, seed) {
        this.world = world;
        this.rng = makeRNG((seed ^ 0x51f3a2) >>> 0);
        this.list = [];
        this.freeList = [];
        this.count = 0;
        this.uid = 0;
        this.born = 0;
        this.died = 0;
        this.generation = 0;

        this.species = [];
        this.nextSpeciesId = 1;

        this.structures = [];
        this.structAt = new Int32Array(world.n);   // 0 = nic, jinak index+1

        this.mutationRate = 0.06;
        this.faith = 80;
        this.faithMax = 200;
        this.love = 0;
        this.fear = 0;
        this.believers = 0;
        this.prayers = 0;

        this.fx = [];           // vizuální efekty pro renderer
        this.zones = [];        // dočasné oblasti (déšť, mráz, požehnání)
        this.tornados = [];
        this.volcanoes = [];
        this.meteors = [];

        this.events = [];
        this.history = { pop: [], species: [], intel: [], carn: [], faith: [] };
        this.peakPop = 0;
        this.milestones = { hut: false, village: false, temple: false, carn: false, swim: false, smart: false };

        // prostorová mřížka pro rychlé hledání sousedů
        this.cell = 4;
        this.cw = Math.ceil(world.w / this.cell);
        this.ch = Math.ceil(world.h / this.cell);
        this.head = new Int32Array(this.cw * this.ch).fill(-1);
        this.nextIdx = new Int32Array(BAL.maxPop + 64).fill(-1);
    }

    /* ---------- druhy ---------- */

    randomName() {
        const r = this.rng;
        const a = SYL_A[(r() * SYL_A.length) | 0];
        const b = SYL_B[(r() * SYL_B.length) | 0];
        const c = r() < 0.45 ? SYL_C[(r() * SYL_C.length) | 0] : '';
        return a + b + c;
    }

    createSpecies(genes, parent) {
        const hue = parent ? (parent.hue + 40 + this.rng() * 90) % 360 : this.rng() * 360;
        const sp = new Species(this.nextSpeciesId++, this.randomName(), genes, this.world.year, parent ? parent.id : null, hue);
        this.species.push(sp);
        return sp;
    }

    getSpecies(id) {
        for (let i = 0; i < this.species.length; i++) if (this.species[i].id === id) return this.species[i];
        return null;
    }

    geneDistance(a, b) {
        let s = 0;
        for (let k = 0; k < GENE_COUNT; k++) {
            const d = (a[k] - b[k]) * SPECIATION_W[k];
            s += d * d;
        }
        return Math.sqrt(s);
    }

    /* ---------- tvorové ---------- */

    derive(c) {
        const g = c.g;
        c.size = 0.35 + g[G_SIZE] * 1.7;
        c.speedT = 0.045 + g[G_SPEED] * 0.30;
        c.vision = 2 + g[G_VISION] * 12;
        c.eff = 0.6 + g[G_METAB] * 0.75 + g[G_INTEL] * 0.22;
        c.repThresh = 0.80 - 0.30 * g[G_FERT];
        c.repCool = 90 - 55 * g[G_FERT];
        c.carn = g[G_AGGR] > 0.55;
        c.tMax = 19 + g[G_HEAT] * 29;
        c.tMin = 13 - g[G_COLD] * 46;
        c.swimDepth = 0.03 + g[G_SWIM] * 0.75;
        c.intel = g[G_INTEL];
        c.lifespan = 220 + g[G_LIFE] * 780;
        c.maxE = 30 + c.size * 70;
        c.cost = BAL.baseCost + BAL.sizeCost * (c.size - 0.35) + BAL.speedCost * c.speedT * c.speedT * c.size
            + BAL.visionCost * g[G_VISION] + BAL.brainCost * c.intel * c.intel;
    }

    newCreature() {
        if (this.freeList.length) {
            const i = this.freeList.pop();
            return { slot: i, obj: this.list[i] };
        }
        if (this.list.length >= BAL.maxPop) return null;
        const c = { g: new Float32Array(GENE_COUNT) };
        this.list.push(c);
        if (this.list.length > this.nextIdx.length) {
            const n = new Int32Array(this.list.length + 64).fill(-1);
            n.set(this.nextIdx); this.nextIdx = n;
        }
        return { slot: this.list.length - 1, obj: c };
    }

    spawn(x, y, genes, species) {
        const slotObj = this.newCreature();
        if (!slotObj) return null;
        const c = slotObj.obj;
        c.slot = slotObj.slot;
        c.uid = ++this.uid;          // volné sloty se recyklují, proto má každý tvor vlastní číslo
        c.alive = true;
        c.x = x; c.y = y;
        c.dx = this.rng() * 2 - 1; c.dy = this.rng() * 2 - 1;
        const l = Math.hypot(c.dx, c.dy) || 1; c.dx /= l; c.dy /= l;
        for (let k = 0; k < GENE_COUNT; k++) c.g[k] = clamp(genes[k], 0, 1);
        this.derive(c);
        c.energy = c.maxE * 0.62;
        c.age = 0;
        c.cool = BAL.matureAge;
        c.sp = species.id;
        c.faith = 0;
        c.sick = 0;
        c.imm = 0;
        c.hurt = 0;
        c.gen = 0;
        this.count++;
        this.born++;
        species.count++;
        return c;
    }

    kill(c, cause) {
        if (!c.alive) return;
        c.alive = false;
        this.count--;
        this.died++;
        const sp = this.getSpecies(c.sp);
        if (sp) sp.count--;
        this.freeList.push(c.slot);
        // mrtvola pohnojí půdu
        const w = this.world;
        const xi = c.x | 0, yi = c.y | 0;
        if (w.inside(xi, yi)) {
            const idx = yi * w.w + xi;
            w.fert[idx] = Math.min(1, w.fert[idx] + 0.006 * c.size);
        }
        if (cause === 'god') { this.fear = Math.min(1, this.fear + 0.004 * (1 + c.faith)); }
    }

    seedLife(n = 160) {
        const w = this.world;
        const base = new Float32Array(GENE_COUNT);
        base[G_SIZE] = 0.3; base[G_SPEED] = 0.35; base[G_VISION] = 0.35; base[G_METAB] = 0.5;
        base[G_FERT] = 0.55; base[G_AGGR] = 0.15; base[G_HEAT] = 0.4; base[G_COLD] = 0.35;
        base[G_SWIM] = 0.15; base[G_INTEL] = 0.2; base[G_LIFE] = 0.35;
        const sp = this.createSpecies(base, null);
        sp.name = 'Prapůvodník';
        let placed = 0, guard = 0;
        const g = new Float32Array(GENE_COUNT);
        while (placed < n && guard++ < n * 400) {
            const x = this.rng() * w.w, y = this.rng() * w.h;
            const i = (y | 0) * w.w + (x | 0);
            if (w.water[i] > 0.02 || w.veg[i] < 0.25) continue;
            const t = w.tempAtIdx(i);
            if (t < 5 || t > 35) continue;
            for (let k = 0; k < GENE_COUNT; k++) g[k] = clamp(base[k] + (this.rng() * 2 - 1) * 0.08, 0, 1);
            if (this.spawn(x, y, g, sp)) placed++;
        }
        this.log(`✨ Na svět byl seslán první život – druh ${sp.name} (${placed} jedinců)`, 'good');
        return placed;
    }

    /* ---------- prostorová mřížka ---------- */

    rebuildHash() {
        this.head.fill(-1);
        const cw = this.cw, cell = this.cell;
        for (let i = 0; i < this.list.length; i++) {
            const c = this.list[i];
            if (!c.alive) continue;
            const cx = Math.min(this.cw - 1, (c.x / cell) | 0);
            const cy = Math.min(this.ch - 1, (c.y / cell) | 0);
            const h = cy * cw + cx;
            this.nextIdx[i] = this.head[h];
            this.head[h] = i;
        }
    }

    forEachNear(x, y, r, fn) {
        const cell = this.cell;
        const cx0 = Math.max(0, ((x - r) / cell) | 0), cx1 = Math.min(this.cw - 1, ((x + r) / cell) | 0);
        const cy0 = Math.max(0, ((y - r) / cell) | 0), cy1 = Math.min(this.ch - 1, ((y + r) / cell) | 0);
        const r2 = r * r;
        for (let cy = cy0; cy <= cy1; cy++) {
            for (let cx = cx0; cx <= cx1; cx++) {
                let i = this.head[cy * this.cw + cx];
                while (i !== -1) {
                    const o = this.list[i];
                    if (o.alive) {
                        const d2 = dist2(o.x, o.y, x, y);
                        if (d2 <= r2 && fn(o, d2) === false) return;
                    }
                    i = this.nextIdx[i];
                }
            }
        }
    }

    /* ---------- hlavní krok ---------- */

    step() {
        const w = this.world;
        const rng = this.rng;
        w.step(rng);
        this.rebuildHash();
        this.updateZones();
        this.updateHazards();

        let faithIncome = 0, believers = 0;
        const list = this.list;

        for (let li = 0; li < list.length; li++) {
            const c = list[li];
            if (!c.alive) continue;

            const xi = clamp(c.x | 0, 0, w.w - 1), yi = clamp(c.y | 0, 0, w.h - 1);
            const idx = yi * w.w + xi;
            const depth = w.water[idx];
            const temp = w.tempAt(xi, yi, idx);

            /* --- smrtelná prostředí --- */
            if (w.lava[idx] > 0.02) { this.kill(c, 'lava'); continue; }
            if (w.fire[idx] > 0.1) { c.energy -= 6; c.hurt = 1; }
            if (depth > c.swimDepth) {
                c.energy -= 2.5 + (depth - c.swimDepth) * 22;   // topí se
                c.hurt = 1;
            }
            if (w.rad[idx] > 0.05) c.energy -= w.rad[idx] * 2.2;

            /* --- teplotní stres (stavby chrání) --- */
            const sheltered = this.structAt[idx] > 0;
            let stress = 0;
            if (temp > c.tMax) stress = temp - c.tMax;
            else if (temp < c.tMin) stress = c.tMin - temp;
            if (sheltered) stress *= 0.45;

            /* --- energie --- */
            let cost = c.cost + stress * BAL.tempCost;
            if (c.sick > 0) cost += 0.55;
            c.energy -= cost;

            /* --- příjem potravy --- */
            if (c.carn) {
                let prey = null, bestD = 1e9;
                this.forEachNear(c.x, c.y, c.vision, (o, d2) => {
                    if (o === c || o.carn) return;
                    if (d2 < bestD) { bestD = d2; prey = o; }
                });
                if (prey) {
                    const d = Math.sqrt(bestD);
                    if (d < 0.9 + c.size * 0.2) {
                        const win = c.size * (0.6 + c.speedT) > prey.size * (0.55 + prey.speedT * 0.9) * (0.7 + rng() * 0.6);
                        if (win) {
                            c.energy = Math.min(c.maxE, c.energy + prey.energy * 0.55 + prey.size * 26);
                            if (prey.sick > 0 && !c.imm && rng() < 0.5) c.sick = 1;
                            this.kill(prey, 'hunt');
                        } else {
                            c.energy -= 6; prey.energy -= 10; prey.hurt = 1;
                        }
                    } else {
                        c.dx = (prey.x - c.x) / d; c.dy = (prey.y - c.y) / d;
                    }
                } else {
                    // dravec bez kořisti se spokojí i s mršinou/rostlinami, ale málo
                    const bite = Math.min(w.veg[idx], BAL.eatRate * 0.35);
                    if (bite > 0) { w.veg[idx] -= bite; c.energy += bite * BAL.foodEnergy * 0.4 * c.eff; }
                    this.forage(c, xi, yi, false);
                }
            } else {
                const bite = Math.min(w.veg[idx], BAL.eatRate * (0.5 + c.size * 0.5));
                if (bite > 0.0005) {
                    w.veg[idx] -= bite;
                    let gain = bite * BAL.foodEnergy * c.eff;
                    if (this.structAt[idx] > 0) gain *= 1.6;       // pole u vesnic
                    c.energy += gain;
                }
                // všežravec: při troše dravosti si troufne i na sousedy
                if (c.g[G_AGGR] > 0.3 && rng() < 0.25) {
                    let prey = null, bestD = 1e9;
                    this.forEachNear(c.x, c.y, 1.6 + c.size, (o, d2) => {
                        if (o === c || o.sp === c.sp) return;
                        if (d2 < bestD) { bestD = d2; prey = o; }
                    });
                    if (prey && c.size * (0.5 + c.g[G_AGGR]) > prey.size * (0.5 + prey.g[G_AGGR] * 0.6) * (0.8 + rng() * 0.5)) {
                        c.energy = Math.min(c.maxE, c.energy + prey.energy * 0.4 + prey.size * 18);
                        this.kill(prey, 'hunt');
                    }
                }
                this.forage(c, xi, yi, w.veg[idx] > 0.35);
            }
            if (c.energy > c.maxE) c.energy = c.maxE;

            /* --- pohyb --- */
            let sp = c.speedT;
            if (depth > 0.02) sp *= (0.25 + c.g[G_SWIM] * 0.85);
            if (stress > 0) sp *= 0.85;
            if (c.energy < c.maxE * 0.15) sp *= 0.7;
            c.x += c.dx * sp; c.y += c.dy * sp;
            if (c.x < 0.5) { c.x = 0.5; c.dx = Math.abs(c.dx); }
            if (c.y < 0.5) { c.y = 0.5; c.dy = Math.abs(c.dy); }
            if (c.x > w.w - 0.5) { c.x = w.w - 0.5; c.dx = -Math.abs(c.dx); }
            if (c.y > w.h - 0.5) { c.y = w.h - 0.5; c.dy = -Math.abs(c.dy); }

            /* --- nemoc --- */
            if (c.sick > 0) {
                c.sick++;
                if (rng() < 0.02) {
                    this.forEachNear(c.x, c.y, 2.2, (o) => {
                        if (o !== c && !o.sick && !o.imm && rng() < 0.35) o.sick = 1;
                    });
                }
                if (rng() < 0.006) { this.kill(c, 'mor'); continue; }
                if (c.sick > 260) { c.sick = 0; c.imm = 1; }
            }

            /* --- víra --- */
            if (c.faith > 0) {
                c.faith = Math.max(0, c.faith - 0.0003);
                faithIncome += c.faith * (0.0016 + c.intel * 0.004);
                if (c.faith > 0.3) believers++;
            }

            /* --- stárnutí a smrt --- */
            c.age++;
            if (c.energy <= 0) { this.kill(c, 'hlad'); continue; }
            if (c.age > c.lifespan && rng() < 0.02 + (c.age - c.lifespan) / 4000) { this.kill(c, 'stáří'); continue; }

            /* --- rozmnožování --- */
            if (c.cool > 0) c.cool--;
            else if (c.age > BAL.matureAge && c.energy > c.maxE * c.repThresh && this.count < BAL.maxPop) {
                if (this.count > BAL.maxPop * 0.88 && rng() < 0.7) { /* přelidněno */ }
                else this.tryReproduce(c);
            }

            /* --- stavby --- */
            if (c.intel > 0.45 && !c.carn && depth < 0.02 && c.energy > c.maxE * 0.5 && rng() < 0.004) {
                this.tryBuild(c, idx, xi, yi);
            }
            c.hurt = 0;
        }

        this.believers = believers;
        this.updateStructures();
        this.faith = Math.min(this.faithMax, this.faith + faithIncome + 0.035);
        this.prayers = faithIncome;
        this.love = Math.max(0, this.love - 0.0006);
        this.fear = Math.max(0, this.fear - 0.0009);
        this.faithMax = 200 + believers * 0.35;

        if (w.tick % 25 === 0) this.updateSpecies();
        if (w.tick % 10 === 0) this.recordHistory();
    }

    /* Výběr směru: osm směrů, hodnotíme potravu a nebezpečí */
    forage(c, xi, yi, satisfied) {
        const w = this.world;
        const rng = this.rng;
        if (satisfied && rng() < 0.75) return;                      // má co žrát, zůstává
        const r = Math.max(2, c.vision * (0.5 + c.intel * 0.5));
        let bestScore = -1e9, bx = c.dx, by = c.dy;
        const steps = c.intel > 0.5 ? 8 : 6;
        const rot = rng() * Math.PI * 2;
        for (let k = 0; k < steps; k++) {
            const a = rot + (k / steps) * Math.PI * 2;
            const dx = Math.cos(a), dy = Math.sin(a);
            const tx = clamp((xi + dx * r) | 0, 0, w.w - 1);
            const ty = clamp((yi + dy * r) | 0, 0, w.h - 1);
            const ti = ty * w.w + tx;
            const depth = w.water[ti];
            let s = w.veg[ti] * 10;
            if (depth > c.swimDepth) s -= 40 + depth * 60;
            else if (depth > 0.02) s -= 3;
            if (w.fire[ti] > 0) s -= 60;
            if (w.lava[ti] > 0) s -= 200;
            if (w.rad[ti] > 0.05) s -= w.rad[ti] * 45;
            const t = w.tempAt(tx, ty, ti);
            if (t > c.tMax) s -= (t - c.tMax) * 1.4;
            if (t < c.tMin) s -= (c.tMin - t) * 1.4;
            if (this.structAt[ti] > 0) s += 3 * c.intel;
            s += (c.dx * dx + c.dy * dy) * 2.5;                     // setrvačnost
            s += rng() * 2.5;
            if (s > bestScore) { bestScore = s; bx = dx; by = dy; }
        }
        c.dx = bx; c.dy = by;
    }

    tryReproduce(c) {
        const rng = this.rng;
        let mate = null;
        this.forEachNear(c.x, c.y, 4.5, (o) => {
            if (o === c || o.sp !== c.sp) return;
            if (o.age < BAL.matureAge || o.cool > 0) return;
            if (o.energy < o.maxE * 0.45) return;
            mate = o; return false;
        });
        // bez partnera se po dlouhém čekání rozdělí sám (aby život nevyhynul)
        if (!mate && !(c.energy > c.maxE * 0.95 && rng() < 0.05)) return;

        const child = new Float32Array(GENE_COUNT);
        const w = this.world;
        const idx = clamp(c.y | 0, 0, w.h - 1) * w.w + clamp(c.x | 0, 0, w.w - 1);
        const mut = this.mutationRate * (1 + w.rad[idx] * 6);
        for (let k = 0; k < GENE_COUNT; k++) {
            let v = mate ? (rng() < 0.5 ? c.g[k] : mate.g[k]) : c.g[k];
            if (rng() < mut) v += (rng() * 2 - 1) * 0.16;
            child[k] = clamp(v, 0, 1);
        }

        let sp = this.getSpecies(c.sp);
        if (sp && sp.count >= BAL.minSpeciesPop && this.geneDistance(child, sp.genes) > BAL.speciationDist) {
            const nsp = this.createSpecies(child, sp);
            nsp.parentName = sp.name;
            sp = nsp;
            this.checkGeneMilestones(child);
        }

        const baby = this.spawn(c.x + (rng() - 0.5), c.y + (rng() - 0.5), child, sp);
        if (!baby) return;
        baby.energy = baby.maxE * 0.40;      // mládě dostane míň, než rodiče zaplatí – energie se nesmí tvořit z ničeho
        baby.gen = (c.gen || 0) + 1;
        if (baby.gen > this.generation) this.generation = baby.gen;
        baby.faith = c.faith * 0.6;      // víra se dědí po rodičích
        c.energy -= c.maxE * BAL.birthCost;
        c.cool = c.repCool;
        if (mate) { mate.energy -= mate.maxE * BAL.birthCost * 0.6; mate.cool = mate.repCool; }
    }

    checkGeneMilestones(g) {
        if (!this.milestones.carn && g[G_AGGR] > 0.55) {
            this.milestones.carn = true;
            this.log('🦷 Poprvé se objevil masožravec – potravní řetězec se rozvětvil', 'evo');
        }
        if (!this.milestones.swim && g[G_SWIM] > 0.7) {
            this.milestones.swim = true;
            this.log('🌊 Život se naučil plavat a vydal se do moří', 'evo');
        }
        if (!this.milestones.smart && g[G_INTEL] > 0.6) {
            this.milestones.smart = true;
            this.log('🧠 Zrodila se skutečná inteligence', 'evo');
        }
    }

    /* ---------- civilizace ---------- */

    tryBuild(c, idx, xi, yi) {
        const w = this.world;
        if (this.structAt[idx] > 0) {
            const s = this.structures[this.structAt[idx] - 1];
            if (!s || !s.alive) return;
            // vylepšení
            let near = 0, faithSum = 0;
            this.forEachNear(c.x, c.y, 6, (o) => { near++; faithSum += o.faith; });
            if (s.type === 1 && near >= 6 && c.intel > 0.5) {
                s.type = 2; this.milestone('village', `🏘️ Vyrostla první vesnice (${this.world.year}. rok)`);
            } else if (s.type === 2 && near >= 8 && c.intel > 0.56 && faithSum / Math.max(1, near) > 0.3) {
                s.type = 3; this.milestone('temple', '⛪ Byl postaven první chrám k tvé poctě – modlitby ti nesou víru');
            }
            return;
        }
        if (this.structures.length > 420) return;
        if (w.veg[idx] < 0.2) return;
        let near = 0, tooClose = false;
        this.forEachNear(c.x, c.y, 5, () => { near++; });
        if (near < 4) return;
        for (let k = 0; k < this.structures.length; k++) {
            const s = this.structures[k];
            if (s.alive && dist2(s.x, s.y, xi, yi) < 16) { tooClose = true; break; }
        }
        if (tooClose) return;
        const s = { x: xi, y: yi, type: 1, alive: true, sp: c.sp, born: w.year };
        this.structures.push(s);
        this.structAt[idx] = this.structures.length;
        this.milestone('hut', '🛖 Tvorové postavili první obydlí');
    }

    milestone(key, text) {
        if (this.milestones[key]) return;
        this.milestones[key] = true;
        this.log(text, 'evo');
    }

    updateStructures() {
        const w = this.world;
        if (w.tick % 12 !== 0) return;
        for (let k = 0; k < this.structures.length; k++) {
            const s = this.structures[k];
            if (!s.alive) continue;
            const idx = s.y * w.w + s.x;
            if (w.lava[idx] > 0.01 || w.water[idx] > 0.12 || w.fire[idx] > 0.2) {
                this.destroyStructure(k, true);
                continue;
            }
            // pole kolem sídla zvyšují úrodnost
            w.forEachInRadius(s.x + 0.5, s.y + 0.5, 1.5 + s.type, (i) => {
                if (w.height[i] > w.seaLevel) w.fert[i] = Math.min(1, w.fert[i] + 0.004 * s.type);
            });
            if (s.type === 3) {
                this.faith = Math.min(this.faithMax, this.faith + 0.25);
                this.forEachNear(s.x, s.y, 8, (o) => { o.faith = Math.min(1, o.faith + 0.006); });
            }
            // opuštěná sídla zanikají
            let pop = 0;
            this.forEachNear(s.x, s.y, 7, () => { pop++; });
            if (pop === 0 && this.rng() < 0.25) this.destroyStructure(k, false);
        }
    }

    destroyStructure(k, violent) {
        const s = this.structures[k];
        if (!s || !s.alive) return;
        s.alive = false;
        const idx = s.y * this.world.w + s.x;
        if (this.structAt[idx] === k + 1) this.structAt[idx] = 0;
        if (violent && s.type === 3) this.log('💔 Chrám byl zničen', 'bad');
    }

    /* ---------- dočasné jevy ---------- */

    updateZones() {
        const w = this.world;
        for (let k = this.zones.length - 1; k >= 0; k--) {
            const z = this.zones[k];
            z.life--;
            if (z.life <= 0) { this.zones.splice(k, 1); continue; }
            if (z.type === 'rain') {
                w.forEachInRadius(z.x, z.y, z.r, (i) => {
                    w.moist[i] = Math.min(1, w.moist[i] + 0.05);
                    if (w.height[i] > w.seaLevel) w.water[i] += 0.0018;
                    if (w.fire[i] > 0) { w.fire[i] = 0; w.fireSet.delete(i); }
                });
            } else if (z.type === 'freeze') {
                w.forEachInRadius(z.x, z.y, z.r, (i) => {
                    w.veg[i] = Math.max(0, w.veg[i] - 0.012);
                    if (w.fire[i] > 0) { w.fire[i] = 0; w.fireSet.delete(i); }
                });
                this.forEachNear(z.x, z.y, z.r, (o) => {
                    const tol = o.g[G_COLD];
                    o.energy -= 1.6 * (1 - tol * 0.9);
                    if (o.energy <= 0) this.kill(o, 'god');
                });
            } else if (z.type === 'bless') {
                w.forEachInRadius(z.x, z.y, z.r, (i) => {
                    w.veg[i] = Math.min(1, w.veg[i] + 0.02);
                    w.fert[i] = Math.min(1, w.fert[i] + 0.004);
                    w.rad[i] = Math.max(0, w.rad[i] - 0.01);
                });
                this.forEachNear(z.x, z.y, z.r, (o) => {
                    o.energy = Math.min(o.maxE, o.energy + 1.2);
                    if (o.sick > 0 && this.rng() < 0.06) { o.sick = 0; o.imm = 1; }
                    o.faith = Math.min(1, o.faith + 0.01);
                });
            }
        }
    }

    updateHazards() {
        const w = this.world, rng = this.rng;

        for (let k = this.tornados.length - 1; k >= 0; k--) {
            const t = this.tornados[k];
            t.life--;
            t.dx += (rng() - 0.5) * 0.25; t.dy += (rng() - 0.5) * 0.25;
            const l = Math.hypot(t.dx, t.dy) || 1;
            t.dx = t.dx / l * 0.55; t.dy = t.dy / l * 0.55;
            t.x = clamp(t.x + t.dx, 0, w.w - 1); t.y = clamp(t.y + t.dy, 0, w.h - 1);
            t.ang = (t.ang || 0) + 0.5;
            w.forEachInRadius(t.x, t.y, t.r, (i) => {
                w.veg[i] = Math.max(0, w.veg[i] - 0.05);
                if (w.fire[i] > 0 && rng() < 0.4) { w.fire[i] = 0; w.fireSet.delete(i); }
            });
            this.forEachNear(t.x, t.y, t.r, (o) => {
                const ang = rng() * Math.PI * 2;
                o.x = clamp(o.x + Math.cos(ang) * 1.6, 0, w.w - 1);
                o.y = clamp(o.y + Math.sin(ang) * 1.6, 0, w.h - 1);
                o.energy -= 5;
                if (o.energy <= 0) this.kill(o, 'god');
            });
            for (let s = 0; s < this.structures.length; s++) {
                const st = this.structures[s];
                if (st.alive && dist2(st.x, st.y, t.x, t.y) < t.r * t.r && rng() < 0.25) this.destroyStructure(s, true);
            }
            if (t.life <= 0) this.tornados.splice(k, 1);
        }

        for (let k = this.volcanoes.length - 1; k >= 0; k--) {
            const v = this.volcanoes[k];
            v.life--;
            const i = (v.y | 0) * w.w + (v.x | 0);
            w.addLava(i, 0.5);
            w.height[i] = clamp(w.height[i] + 0.0012, 0, 1);
            if (rng() < 0.5) {
                const a = rng() * Math.PI * 2, d = rng() * 2.2;
                const nx = clamp((v.x + Math.cos(a) * d) | 0, 0, w.w - 1);
                const ny = clamp((v.y + Math.sin(a) * d) | 0, 0, w.h - 1);
                w.addLava(ny * w.w + nx, 0.35);
            }
            if (v.life <= 0) this.volcanoes.splice(k, 1);
        }

        for (let k = this.meteors.length - 1; k >= 0; k--) {
            const m = this.meteors[k];
            m.life--;
            if (m.life <= 0) {
                if (m.onImpact) m.onImpact(m);
                this.meteors.splice(k, 1);
            }
        }
    }

    /* ---------- statistiky ---------- */

    updateSpecies() {
        const sums = new Map();
        for (let i = 0; i < this.list.length; i++) {
            const c = this.list[i];
            if (!c.alive) continue;
            let e = sums.get(c.sp);
            if (!e) { e = { n: 0, g: new Float64Array(GENE_COUNT) }; sums.set(c.sp, e); }
            e.n++;
            for (let k = 0; k < GENE_COUNT; k++) e.g[k] += c.g[k];
        }
        for (const sp of this.species) {
            const e = sums.get(sp.id);
            const n = e ? e.n : 0;
            sp.count = n;
            if (n > 0) {
                for (let k = 0; k < GENE_COUNT; k++) sp.genes[k] = sp.genes[k] * 0.7 + (e.g[k] / n) * 0.3;
                if (n > sp.peak) sp.peak = n;
                if (!sp.announced && n >= 25) {          // hlásíme až druhy, které se opravdu uchytily
                    sp.announced = true;
                    if (sp.parentName) this.log(`🧬 Z druhu ${sp.parentName} se odštěpil nový druh ${sp.name}`, 'evo');
                }
                if (sp.extinct) { sp.extinct = false; sp.extinctYear = null; }
            } else if (!sp.extinct) {
                sp.extinct = true;
                sp.extinctYear = this.world.year;
                if (sp.peak >= 25) this.log(`☠️ Druh ${sp.name} vymřel (žil ${sp.born}–${sp.extinctYear})`, 'bad');
            }
        }
        if (this.count === 0 && this.lastCount > 0) {
            this.log('🕯️ Veškerý život ve světě vyhasl. Můžeš stvořit nový.', 'bad');
        }
        this.lastCount = this.count;
    }

    recordHistory() {
        let intel = 0, carn = 0, alive = 0;
        for (let i = 0; i < this.list.length; i++) {
            const c = this.list[i];
            if (!c.alive) continue;
            alive++; intel += c.intel; if (c.carn) carn++;
        }
        const h = this.history;
        h.pop.push(this.count);
        h.species.push(this.species.filter(s => !s.extinct).length);
        h.intel.push(alive ? intel / alive : 0);
        h.carn.push(carn);
        h.faith.push(this.faith);
        for (const k in h) if (h[k].length > 420) h[k].shift();
        if (this.count > this.peakPop) this.peakPop = this.count;
    }

    stats() {
        let intel = 0, size = 0, speed = 0, carn = 0, sick = 0, n = 0, oldest = 0;
        const g = new Float64Array(GENE_COUNT);
        for (let i = 0; i < this.list.length; i++) {
            const c = this.list[i];
            if (!c.alive) continue;
            n++; intel += c.intel; size += c.size; speed += c.speedT;
            if (c.carn) carn++;
            if (c.sick) sick++;
            if (c.age > oldest) oldest = c.age;
            for (let k = 0; k < GENE_COUNT; k++) g[k] += c.g[k];
        }
        if (n) for (let k = 0; k < GENE_COUNT; k++) g[k] /= n;
        return {
            pop: n, avgIntel: n ? intel / n : 0, avgSize: n ? size / n : 0, avgSpeed: n ? speed / n : 0,
            carn, sick, oldest, genes: g,
            species: this.species.filter(s => !s.extinct).length,
            structures: this.structures.filter(s => s.alive).length,
            temples: this.structures.filter(s => s.alive && s.type === 3).length
        };
    }

    log(text, kind = 'info') {
        this.events.push({ year: this.world.year, text, kind });
        if (this.events.length > 220) this.events.shift();
        this.dirtyLog = true;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Sim, Species, GENE_INFO, GENE_COUNT, BAL, G_SIZE, G_SPEED, G_VISION, G_METAB, G_FERT, G_AGGR, G_HEAT, G_COLD, G_SWIM, G_INTEL, G_LIFE };
}
