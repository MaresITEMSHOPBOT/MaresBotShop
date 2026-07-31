'use strict';
/* Civilizace: sídla s vlastní populací (klidně statisíce lidí), hospodářství,
   technologie od kamene po vesmír, války, zákony a dějiny.
   Po mapě chodí jen vzorek panáčků – zbytek lidí je v číslech sídel. */

const RACES = {
    human: { id: 'human', name: 'Lidé', emoji: '🧑', skin: '#f0c9a0', speed: 0.30, str: 1.0, fert: 1.0, sci: 1.15, maxAge: 1500, homes: [T.GRASS, T.FOREST, T.SAND, T.FARM, T.HILL] },
    orc: { id: 'orc', name: 'Orkové', emoji: '👹', skin: '#8bbf63', speed: 0.31, str: 1.6, fert: 1.2, sci: 0.75, maxAge: 1100, homes: [T.GRASS, T.HILL, T.ASH, T.SAND] },
    elf: { id: 'elf', name: 'Elfové', emoji: '🧝', skin: '#f6e2c8', speed: 0.36, str: 0.85, fert: 0.7, sci: 1.35, maxAge: 2800, homes: [T.FOREST, T.GRASS] },
    dwarf: { id: 'dwarf', name: 'Trpaslíci', emoji: '🧔', skin: '#dda879', speed: 0.25, str: 1.35, fert: 0.85, sci: 1.1, maxAge: 1900, homes: [T.HILL, T.MOUNT, T.SNOW, T.GRASS] }
};
const ANIMALS = {
    sheep: { id: 'sheep', name: 'Ovce', emoji: '🐑', color: '#efece2', speed: 0.14, str: 0.15, maxAge: 900, prey: true },
    deer: { id: 'deer', name: 'Jeleni', emoji: '🦌', color: '#b98a5a', speed: 0.24, str: 0.4, maxAge: 1000, prey: true },
    wolf: { id: 'wolf', name: 'Vlci', emoji: '🐺', color: '#7b8090', speed: 0.34, str: 1.1, maxAge: 1100, prey: false },
    bear: { id: 'bear', name: 'Medvědi', emoji: '🐻', color: '#6b4b32', speed: 0.26, str: 2.6, maxAge: 1500, prey: false },
    dragon: { id: 'dragon', name: 'Drak', emoji: '🐉', color: '#b4453a', speed: 0.42, str: 9, maxAge: 6000, prey: false }
};

/* deset dob – od kamene až na Měsíc */
const ERAS = [
    { name: 'Doba kamenná', short: 'kamenná', cost: 0, house: 16, food: 1.0, army: 1.0, icon: '🪨' },
    { name: 'Doba bronzová', short: 'bronzová', cost: 900, house: 30, food: 1.4, army: 1.25, icon: '🗡️' },
    { name: 'Doba železná', short: 'železná', cost: 3200, house: 55, food: 1.9, army: 1.6, icon: '⚒️' },
    { name: 'Středověk', short: 'středověk', cost: 9000, house: 110, food: 2.6, army: 2.1, icon: '🏰' },
    { name: 'Renesance', short: 'renesance', cost: 22000, house: 240, food: 3.6, army: 2.7, icon: '🎨' },
    { name: 'Průmyslová revoluce', short: 'průmysl', cost: 55000, house: 420, food: 5.2, army: 3.6, icon: '🏭' },
    { name: 'Věk elektřiny', short: 'elektřina', cost: 130000, house: 900, food: 7.4, army: 4.8, icon: '💡' },
    { name: 'Atomový věk', short: 'atom', cost: 300000, house: 1800, food: 10.5, army: 6.4, icon: '☢️' },
    { name: 'Informační věk', short: 'informace', cost: 700000, house: 2200, food: 15, army: 8.5, icon: '💻' },
    { name: 'Kosmický věk', short: 'vesmír', cost: 1600000, house: 3600, food: 22, army: 11, icon: '🚀' }
];

const LEVELS = [
    { name: 'Osada', min: 0, urban: 0 },
    { name: 'Vesnice', min: 180, urban: 1 },
    { name: 'Městečko', min: 700, urban: 1 },
    { name: 'Město', min: 2500, urban: 2 },
    { name: 'Velkoměsto', min: 9000, urban: 3 },
    { name: 'Metropole', min: 30000, urban: 4 },
    { name: 'Megapole', min: 90000, urban: 5 }
];

const BUILDINGS = {
    castle: { name: 'Hrad', hp: 140, wood: 0, gold: 0, era: 0, cap: 40, icon: '🏰' },
    house: { name: 'Domy', hp: 45, wood: 8, gold: 0, era: 0, cap: 1, icon: '🏠' },
    farm: { name: 'Pole', hp: 0, wood: 0, gold: 0, era: 0, cap: 0, icon: '🌾' },
    sawmill: { name: 'Pila', hp: 40, wood: 10, gold: 2, era: 0, cap: 0, icon: '🪵' },
    mine: { name: 'Důl', hp: 55, wood: 16, gold: 4, era: 0, cap: 0, icon: '⛏️' },
    market: { name: 'Tržiště', hp: 45, wood: 20, gold: 8, era: 1, cap: 0, icon: '🛒' },
    temple: { name: 'Chrám', hp: 65, wood: 26, gold: 14, era: 1, cap: 0, icon: '⛪' },
    barracks: { name: 'Kasárna', hp: 80, wood: 24, gold: 12, era: 2, cap: 0, icon: '🛡️' },
    walls: { name: 'Hradby', hp: 160, wood: 40, gold: 20, era: 2, cap: 0, icon: '🧱' },
    university: { name: 'Univerzita', hp: 70, wood: 40, gold: 40, era: 3, cap: 0, icon: '🎓' },
    harbor: { name: 'Přístav', hp: 60, wood: 35, gold: 25, era: 4, cap: 0, icon: '⚓' },
    factory: { name: 'Továrna', hp: 90, wood: 60, gold: 70, era: 5, cap: 0, icon: '🏭' },
    power: { name: 'Elektrárna', hp: 95, wood: 50, gold: 140, era: 6, cap: 0, icon: '⚡' },
    lab: { name: 'Laboratoř', hp: 85, wood: 45, gold: 220, era: 7, cap: 0, icon: '🔬' },
    airport: { name: 'Letiště', hp: 90, wood: 60, gold: 320, era: 8, cap: 0, icon: '✈️' },
    spaceport: { name: 'Kosmodrom', hp: 120, wood: 90, gold: 900, era: 9, cap: 0, icon: '🚀' }
};

const LAWS = [
    { id: 'tax', name: 'Daně', icon: '🪙', opts: ['Žádné', 'Nízké', 'Vysoké'], def: 1, desc: 'Kolik zlata odvádějí města králi. Vysoké daně plní pokladnu, ale lidi štvou.' },
    { id: 'army', name: 'Branná povinnost', icon: '⚔️', opts: ['Žádná', 'Malá', 'Velká'], def: 1, desc: 'Jak velkou část obyvatel pošle město do války.' },
    { id: 'birth', name: 'Porodnost', icon: '👶', opts: ['Volná', 'Podporovaná', 'Omezená'], def: 1, desc: 'Podpora rodin zrychlí růst měst, omezení šetří jídlo.' },
    { id: 'forest', name: 'Kácení lesů', icon: '🪵', opts: ['Zakázáno', 'Povolené'], def: 1, desc: 'Bez dřeva se nestaví. Kácení ale mění lesy v holé pláně.' },
    { id: 'trade', name: 'Obchod', icon: '🛒', opts: ['Zákaz', 'Volný'], def: 1, desc: 'Volný obchod nosí zlato ze sousedních měst, se kterými je mír.' },
    { id: 'faith', name: 'Povinná víra', icon: '🙏', opts: ['Ne', 'Ano'], def: 0, desc: 'Všichni musí věřit v tebe. Roste ti víra, klesá spokojenost.' },
    { id: 'war', name: 'Zahraniční politika', icon: '🏳️', opts: ['Mírová', 'Běžná', 'Dobyvačná'], def: 1, desc: 'Jak často si říše vyhlašují války a jak tvrdě dobývají.' },
    { id: 'science', name: 'Podpora vědy', icon: '📜', opts: ['Ne', 'Základní', 'Masivní'], def: 1, desc: 'Rychlost postupu dobami – až ke kosmodromu a letu na Měsíc.' },
    { id: 'health', name: 'Zdravotnictví', icon: '🏥', opts: ['Ne', 'Ano'], def: 0, desc: 'Stojí zlato, ale lidé žijí déle a města rostou rychleji.' }
];

const REALM_COLORS = ['#4f86e8', '#c8452f', '#2fae86', '#d79a2b', '#9b5de5', '#f15bb5', '#00bbf9', '#8ac926', '#ff924c', '#59c3c3', '#e56b6f', '#b8f2e6'];

let MAX_UNITS = 900;
let MAX_VILLAGES = 90;

function setWorldLimits(w, h) {
    const tiles = w * h;
    MAX_UNITS = Math.round(clamp(tiles * 0.05, 500, 1400));
    MAX_VILLAGES = Math.round(clamp(tiles / 190, 40, 260));
}

function fmt(n) {
    n = Math.round(n);
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + ' mil.';
    if (n >= 10000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1) + ' tis.';
    return n.toLocaleString('cs-CZ');
}

class Life {
    constructor(world, seed) {
        this.world = world;
        this.rng = makeRNG((seed ^ 0x77aa11) >>> 0);
        this.units = [];
        this.free = [];
        this.villages = [];
        this.realms = [];
        this.buildings = [];
        this.armies = [];
        this.rockets = [];
        this.nextRealm = 1; this.nextVillage = 1; this.nextUnit = 1;
        this.tick = 0;

        this.events = [];
        this.dirtyLog = false;
        this.fx = [];
        this.stats = { born: 0, died: 0, warDead: 0, godDead: 0, peak: 0, built: 0, wars: 0, captured: 0, moon: 0 };
        this.milestones = {};
        this.faith = 80; this.faithMax = 200; this.believers = 0;
        this.godMode = false;

        this.laws = {};
        for (const l of LAWS) this.laws[l.id] = l.def;

        this.hist = { t: [], pop: [], villages: [], gold: [], food: [], wood: [], wars: [], era: [], realms: new Map() };

        this.head = new Int32Array(world.n).fill(-1);
        this.next = new Int32Array(MAX_UNITS + 16).fill(-1);
    }

    get year() { return Math.floor(this.tick / 60); }

    log(text, kind = 'info') {
        this.events.push({ tick: this.tick, year: this.year, text, kind });
        if (this.events.length > 300) this.events.shift();
        this.dirtyLog = true;
    }

    milestone(key, text) {
        if (this.milestones[key]) return;
        this.milestones[key] = this.year;
        this.log(text, 'good');
    }

    realmById(id) { for (const r of this.realms) if (r.id === id && !r.dead) return r; return null; }
    villageById(id) { for (const v of this.villages) if (v.id === id && !v.dead) return v; return null; }

    tileAt(x, y) {
        const xi = clamp(x | 0, 0, this.world.w - 1), yi = clamp(y | 0, 0, this.world.h - 1);
        return yi * this.world.w + xi;
    }
    walkableAt(x, y) {
        if (x < 0.2 || y < 0.2 || x > this.world.w - 1.2 || y > this.world.h - 1.2) return false;
        return this.world.walkable(this.tileAt(x, y));
    }

    rebuildIndex() {
        this.head.fill(-1);
        for (let k = 0; k < this.units.length; k++) {
            const u = this.units[k];
            if (!u.alive) continue;
            const i = this.tileAt(u.x, u.y);
            this.next[k] = this.head[i];
            this.head[i] = k;
        }
    }

    forEachNear(x, y, r, fn) {
        const w = this.world;
        const x0 = Math.max(0, (x - r) | 0), x1 = Math.min(w.w - 1, (x + r) | 0);
        const y0 = Math.max(0, (y - r) | 0), y1 = Math.min(w.h - 1, (y + r) | 0);
        const r2 = r * r;
        for (let ty = y0; ty <= y1; ty++) {
            for (let tx = x0; tx <= x1; tx++) {
                let k = this.head[ty * w.w + tx];
                while (k !== -1) {
                    const u = this.units[k];
                    if (u.alive) {
                        const d2 = dist2(u.x, u.y, x, y);
                        if (d2 <= r2 && fn(u, d2) === false) return;
                    }
                    k = this.next[k];
                }
            }
        }
    }

    /* ---------------- panáčci (vzorek populace) ---------------- */

    newUnit() {
        if (this.free.length) {
            const u = this.units[this.free.pop()];
            u.uid = ++this.nextUnit;
            return u;
        }
        const u = { slot: this.units.length, uid: ++this.nextUnit };
        this.units.push(u);
        if (this.units.length > this.next.length) {
            const n = new Int32Array(this.units.length + 128).fill(-1);
            n.set(this.next); this.next = n;
        }
        return u;
    }

    get count() { let n = 0; for (const u of this.units) if (u.alive) n++; return n; }

    spawnPerson(x, y, raceId, realm, village, job) {
        if (this.count >= MAX_UNITS) return null;
        const race = RACES[raceId] || RACES.human;
        const p = personName(this.rng, race.id);
        const u = this.newUnit();
        Object.assign(u, {
            alive: true, kind: 'person', race: race.id, name: p.name, female: p.female,
            x, y, ox: x, oy: y, hp: 14 * race.str, maxHp: 14 * race.str,
            food: 0.9, age: 0, maxAge: race.maxAge,
            realm: realm ? realm.id : 0, village: village ? village.id : 0,
            job: job || 'worker', state: 'idle', timer: 0, goal: -1,
            phase: this.rng() * 6.28, faith: 0, sick: 0, zombie: 0, kills: 0,
            strength: 0, str: race.str, speed: race.speed * (0.9 + this.rng() * 0.2)
        });
        return u;
    }

    spawnAnimal(x, y, kindId, genes) {
        if (this.count >= MAX_UNITS) return null;
        const a = ANIMALS[kindId];
        if (!a) return null;
        const u = this.newUnit();
        const g = genes ? {
            size: clamp(genes.size + (this.rng() - 0.5) * 0.16, 0.4, 2.2),
            speed: clamp(genes.speed + (this.rng() - 0.5) * 0.16, 0.4, 2.2),
            fert: clamp(genes.fert + (this.rng() - 0.5) * 0.16, 0.4, 2.2)
        } : { size: 1, speed: 1, fert: 1 };
        Object.assign(u, {
            alive: true, kind: 'animal', race: kindId, name: a.name, female: this.rng() < 0.5,
            x, y, ox: x, oy: y, genes: g,
            hp: (8 * a.str + 4) * g.size, maxHp: (8 * a.str + 4) * g.size,
            food: 0.9, age: 0, maxAge: a.maxAge * (0.8 + this.rng() * 0.4),
            realm: 0, village: 0, job: 'wild', state: 'idle', timer: 0, goal: -1,
            phase: this.rng() * 6.28, faith: 0, sick: 0, zombie: 0,
            str: a.str * g.size, speed: a.speed * g.speed
        });
        return u;
    }

    kill(u, cause) {
        if (!u.alive) return;
        u.alive = false;
        this.free.push(u.slot);
        this.stats.died++;
        if (cause === 'war') this.stats.warDead++;
        if (cause === 'god') this.stats.godDead++;
        if (u.kind === 'person' && !u.zombie && cause === 'zombie') {
            const z = this.spawnPerson(u.x, u.y, u.race, null, null, 'zombie');
            if (z) { z.zombie = 1; z.name = 'Nemrtvý ' + z.name; }
        }
    }

    /* ---------------- říše a sídla ---------------- */

    newRuler(realm, why) {
        const p = personName(this.rng, realm.race);
        realm.ruler = { name: p.name, female: p.female, since: this.year, age: 300 + this.rng() * 900 };
        if (why) this.log(`👑 ${realm.name}: ${p.female ? 'novou královnou' : 'novým králem'} je ${p.name}`, 'info');
    }

    foundRealm(raceId) {
        const id = this.nextRealm++;
        const realm = {
            id, name: realmName(this.rng), race: raceId,
            color: REALM_COLORS[(id - 1) % REALM_COLORS.length],
            villages: [], wars: new Set(), born: this.tick, dead: false, capital: 0,
            gold: 40, research: 0, era: 0, ruler: null, peak: 0, pop: 0, moon: false, space: 0
        };
        this.newRuler(realm);
        this.realms.push(realm);
        return realm;
    }

    foundVillage(x, y, realm, pop) {
        if (this.villages.filter(v => !v.dead).length >= MAX_VILLAGES) return null;
        const v = {
            id: this.nextVillage++, name: villageName(this.rng), x: x | 0, y: y | 0,
            realm: realm.id, houses: [], farms: 0, urban: 0,
            pop: pop || 30, food: 60, wood: 30, gold: 10,
            happy: 0.6, dead: false, born: this.tick, level: 0, army: 0, sprites: 0
        };
        this.villages.push(v);
        realm.villages.push(v.id);
        if (!realm.capital) realm.capital = v.id;
        this.addBuilding(v, realm.capital === v.id ? 'castle' : 'house');
        return v;
    }

    freeSpot(v, radius = 5) {
        const w = this.world;
        for (let k = 0; k < 50; k++) {
            const a = this.rng() * Math.PI * 2, d = 1 + this.rng() * radius;
            const x = clamp((v.x + Math.cos(a) * d) | 0, 1, w.w - 2);
            const y = clamp((v.y + Math.sin(a) * d) | 0, 1, w.h - 2);
            const i = y * w.w + x;
            if (w.build[i]) continue;
            const t = w.type[i];
            if (t === T.GRASS || t === T.SAND || t === T.FOREST || t === T.HILL || t === T.SNOW || t === T.ASH || t === T.CITY || t === T.FARM) return { i, x, y };
        }
        return null;
    }

    addBuilding(v, type, spot) {
        const def = BUILDINGS[type];
        if (!def) return null;
        const s = spot || this.freeSpot(v, type === 'castle' ? 2 : 3 + v.urban * 2);
        if (!s) return null;
        const realm = this.realmById(v.realm);
        const hp = def.hp * (1 + (realm ? realm.era : 0) * 0.15);
        const b = { i: s.i, x: s.x, y: s.y, type, village: v.id, realm: v.realm, hp, maxHp: hp, dead: false };
        this.buildings.push(b);
        this.world.build[s.i] = this.buildings.length;
        this.world.mark(s.i);
        v.houses.push(this.buildings.length - 1);
        this.stats.built++;
        return b;
    }

    countBuild(v, type) {
        let n = 0;
        for (const bi of v.houses) { const b = this.buildings[bi]; if (b && !b.dead && b.type === type) n++; }
        return n;
    }

    destroyBuilding(bi, quiet) {
        const b = this.buildings[bi];
        if (!b || b.dead) return;
        b.dead = true;
        if (this.world.build[b.i] === bi + 1) this.world.build[b.i] = 0;
        this.world.mark(b.i);
        const v = this.villageById(b.village);
        if (v) {
            v.houses = v.houses.filter(h => h !== bi);
            if (!v.houses.length) this.destroyVillage(v, quiet, 'war');
        }
    }

    destroyVillage(v, quiet, reason) {
        if (v.dead) return;
        v.dead = true;
        for (const bi of v.houses.slice()) this.destroyBuilding(bi, true);
        this.clearUrban(v);
        const r = this.realmById(v.realm);
        if (r) {
            r.villages = r.villages.filter(id => id !== v.id);
            if (!quiet) this.log(reason === 'empty' ? `🏚️ ${v.name} vymřelo` : `🔥 ${v.name} bylo srovnáno se zemí`, 'bad');
            if (!r.villages.length) {
                r.dead = true;
                for (const o of this.realms) o.wars.delete(r.id);
                r.wars.clear();
                this.log(`👑 Říše ${r.name} zanikla (${Math.floor(r.born / 60)}–${this.year})`, 'bad');
                for (let i = 0; i < this.world.n; i++) if (this.world.owner[i] === r.id) this.world.owner[i] = 0;
                this.territoryDirty = true;
            } else if (r.capital === v.id) {
                r.capital = r.villages[0];
                const cap = this.villageById(r.capital);
                if (cap) this.log(`🏰 ${r.name} má nové hlavní město: ${cap.name}`, 'info');
            }
        }
        for (const u of this.units) if (u.alive && u.village === v.id) this.kill(u, 'war');
    }

    clearUrban(v) {
        const w = this.world;
        w.forEachInRadius(v.x, v.y, 9, i => {
            if (w.type[i] === T.CITY) { w.dens[i] = 0; w.type[i] = T.GRASS; w.veg[i] = 0.3; w.mark(i); }
        });
    }

    homeSpot(raceId) {
        const w = this.world, race = RACES[raceId] || RACES.human;
        for (let k = 0; k < 800; k++) {
            const x = 3 + ((this.rng() * (w.w - 6)) | 0);
            const y = 3 + ((this.rng() * (w.h - 6)) | 0);
            const i = y * w.w + x;
            if (!race.homes.includes(w.type[i]) || w.build[i]) continue;
            let land = 0;
            w.forEachInRadius(x, y, 3, j => { if (w.walkable(j)) land++; });
            if (land < 20) continue;
            let close = false;
            for (const v of this.villages) if (!v.dead && dist2(v.x, v.y, x, y) < 420) { close = true; break; }
            if (close) continue;
            return { x, y, i };
        }
        return null;
    }

    seedTribe(x, y, raceId, pop = 40) {
        if (!this.world.walkable(this.tileAt(x, y))) return null;
        const realm = this.foundRealm(raceId);
        const v = this.foundVillage(x, y, realm, pop);
        if (!v) return null;
        this.territoryDirty = true;
        this.log(`👑 Vzniklo království ${realm.name} (${RACES[raceId].name}) – vládne ${realm.ruler.name}`, 'good');
        return realm;
    }

    /* ---------------- hlavní tik ---------------- */

    step() {
        this.tick++;
        this.world.step(this.rng);
        this.rebuildIndex();

        let believers = 0, animals = 0;
        for (const u of this.units) {
            if (!u.alive) continue;
            u.ox = u.x; u.oy = u.y;
            this.stepUnit(u);
            if (!u.alive) continue;
            if (u.faith > 0.3) believers++;
            if (u.kind === 'animal') animals++;
        }
        this.believers = believers;
        this.animalCount = animals;

        if (typeof stepHazards === 'function') stepHazards(this);
        this.stepArmies();
        if (this.tick % 10 === 0) this.stepSettlements();
        if (this.tick % 10 === 5) this.stepRealms();
        if (this.tick % 30 === 0) this.updateTerritory();
        if (this.tick % 240 === 0) this.diplomacy();
        if (this.tick % 20 === 0) this.record();
        this.stepRockets();

        this.faithMax = 200 + believers * 2 + this.totalPop() * 0.002;
        if (this.godMode) this.faith = this.faithMax;
        else this.faith = Math.min(this.faithMax, this.faith + 0.05 + believers * 0.01 + this.templeFaith);
    }

    totalPop() {
        let p = 0;
        for (const v of this.villages) if (!v.dead) p += v.pop;
        return p;
    }

    /* ---------------- panáčci ---------------- */

    stepUnit(u) {
        const w = this.world;
        const i = this.tileAt(u.x, u.y);
        if (w.lava[i]) { this.kill(u, 'lava'); return; }
        if (u.race !== 'dragon') {
            if (w.isWater(i)) { u.hp -= 3; if (u.hp <= 0) { this.kill(u, 'voda'); return; } }
            if (w.fire[i]) { u.hp -= 2; if (u.hp <= 0) { this.kill(u, 'oheň'); return; } }
        }
        u.age++;
        if (u.kind === 'animal' && u.age > u.maxAge) { this.kill(u, 'stáří'); return; }
        if (u.zombie) { this.stepZombie(u); return; }
        if (u.sick > 0) {
            u.sick--; u.hp -= 0.1;
            if (this.rng() < 0.008) this.forEachNear(u.x, u.y, 1.6, o => { if (o.kind === 'person' && !o.sick && this.rng() < 0.3) o.sick = 400; });
            if (u.hp <= 0) { this.kill(u, 'mor'); return; }
        }
        if (u.faith > 0) u.faith = Math.max(0, u.faith - 0.0003);

        if (u.kind === 'animal') this.stepAnimal(u, i);
        else if (u.job === 'soldier') this.stepSoldier(u);
        else this.stepCitizen(u, i);
    }

    stepZombie(u) {
        let prey = null, best = 1e9;
        this.forEachNear(u.x, u.y, 8, o => {
            if (o === u || o.zombie || o.kind !== 'person') return;
            const d = dist2(o.x, o.y, u.x, u.y);
            if (d < best) { best = d; prey = o; }
        });
        if (prey) {
            if (best < 0.8) { prey.hp -= 3; if (prey.hp <= 0) this.kill(prey, 'zombie'); }
            else this.moveTo(u, prey.x, prey.y, 0.2);
        } else {
            // nakazí nejbližší město
            const v = this.nearestVillage(u.x, u.y, 64);
            if (v && this.rng() < 0.02) {
                const dead = Math.min(v.pop * 0.02, 60);
                v.pop -= dead;
                if (this.rng() < 0.3) this.log(`🧟 Nemrtví napadli ${v.name}`, 'bad');
            }
            this.wander(u);
        }
        if (this.rng() < 0.0006) this.kill(u, 'rozpad');
    }

    stepAnimal(u, i) {
        const w = this.world, a = ANIMALS[u.race];
        if (u.race === 'dragon') { this.stepDragon(u, i); return; }
        u.food -= 0.0012;
        if (u.food <= 0) { u.food = 0; u.hp -= 0.15; if (u.hp <= 0) { this.kill(u, 'hlad'); return; } }

        if (u.food > 0.8 && u.age > 150 && this.tick % 8 === 0 && (this.animalCount || 0) < 160 && this.count < MAX_UNITS) {
            let near = 0;
            this.forEachNear(u.x, u.y, 6, o => { if (o.race === u.race) near++; });
            if (near < (a.prey ? 7 : 3) && this.rng() < (a.prey ? 0.05 : 0.02) * (u.genes ? u.genes.fert : 1)) {
                const baby = this.spawnAnimal(u.x + this.rng() - 0.5, u.y + this.rng() - 0.5, u.race, u.genes);
                if (baby) { u.food -= 0.3; baby.food = 0.7; }
            }
        }
        if (a.prey) {
            if (u.food < 0.9 && w.veg[i] > 0.12 && !w.isWater(i)) {
                w.veg[i] -= 0.015; u.food = Math.min(1, u.food + 0.02); w.classify(i); return;
            }
            let danger = null;
            this.forEachNear(u.x, u.y, 5, o => { if ((o.kind === 'animal' && !ANIMALS[o.race].prey) || o.zombie) { danger = o; return false; } });
            if (danger) { this.moveDir(u, u.x - danger.x, u.y - danger.y, u.speed * 1.3); return; }
        } else {
            let prey = null, best = 1e9;
            this.forEachNear(u.x, u.y, 7, o => {
                if (o === u || (o.kind === 'animal' && !ANIMALS[o.race].prey)) return;
                const score = dist2(o.x, o.y, u.x, u.y) * (o.kind === 'person' ? 4 : 1);
                if (score < best) { best = score; prey = o; }
            });
            if (prey) {
                if (dist2(prey.x, prey.y, u.x, u.y) < 0.8) {
                    prey.hp -= 3 * u.str;
                    if (prey.kind === 'person') { u.hp -= prey.str * 2; if (u.hp <= 0) { this.kill(u, 'obrana'); return; } }
                    if (prey.hp <= 0) { this.kill(prey, 'lov'); u.food = 1; }
                } else this.moveTo(u, prey.x, prey.y, u.speed);
                return;
            }
        }
        this.wander(u);
    }

    stepDragon(u, i) {
        const w = this.world;
        u.food = 1;
        if (this.rng() < 0.03) { w.ignite(i); if (this.rng() < 0.3) w.neighbors(i, j => { if (this.rng() < 0.3) w.ignite(j); }); }
        const v = this.nearestVillage(u.x, u.y, 900);
        if (v) {
            if (dist2(u.x, u.y, v.x, v.y) < 9) {
                v.pop = Math.max(0, v.pop - v.pop * 0.01 - 3);
                if (v.houses.length && this.rng() < 0.06) this.destroyBuilding(v.houses[(this.rng() * v.houses.length) | 0]);
                if (this.rng() < 0.01) this.log(`🐉 Drak pustoší ${v.name}`, 'bad');
                this.moveDirFly(u, this.rng() - 0.5, this.rng() - 0.5, u.speed * 0.5);
            } else this.moveDirFly(u, v.x - u.x, v.y - u.y, u.speed);
        } else this.wander(u);
        this.forEachNear(u.x, u.y, 1.6, o => { if (o !== u && o.race !== 'dragon') this.kill(o, 'drak'); });
    }

    /* obyčejný panáček je jen vzorek – chodí kolem svého města a pracuje */
    stepCitizen(u, i) {
        const v = u.village ? this.villageById(u.village) : null;
        if (!v) { this.wander(u); if (this.rng() < 0.004) this.kill(u, 'odešel'); return; }
        if (u.goal < 0 || this.tick % 90 === 0) {
            const w = this.world;
            const r = 3 + v.urban * 2;
            const a = this.rng() * Math.PI * 2, d = 1 + this.rng() * r;
            const x = clamp((v.x + Math.cos(a) * d) | 0, 0, w.w - 1);
            const y = clamp((v.y + Math.sin(a) * d) | 0, 0, w.h - 1);
            u.goal = y * w.w + x;
        }
        const w = this.world;
        const gx = u.goal % w.w + 0.5, gy = ((u.goal / w.w) | 0) + 0.5;
        if (dist2(u.x, u.y, gx, gy) < 0.6) {
            u.timer++;
            if (u.timer > 10) { u.timer = 0; u.goal = -1; }
        } else this.moveTo(u, gx, gy, u.speed * 0.8);
    }

    stepSoldier(u) {
        const army = u.army;
        if (!army || army.dead) { u.job = 'worker'; u.goal = -1; return; }
        u.x = army.x + (u.off ? u.off.x : 0);
        u.y = army.y + (u.off ? u.off.y : 0);
        u.dir = army.dx < 0 ? -1 : 1;
        u.phase += 0.25;
    }

    nearestVillage(x, y, maxD2 = 1e9, realmFilter) {
        let best = null, bd = maxD2;
        for (const v of this.villages) {
            if (v.dead) continue;
            if (realmFilter && !realmFilter(v)) continue;
            const d = dist2(v.x, v.y, x, y);
            if (d < bd) { bd = d; best = v; }
        }
        return best;
    }

    /* ---------------- pohyb ---------------- */

    moveTo(u, tx, ty, speed) { this.moveDir(u, tx - u.x, ty - u.y, speed); }

    moveDir(u, dx, dy, speed) {
        const d = Math.hypot(dx, dy);
        if (d < 1e-4) return;
        const ang = Math.atan2(dy, dx);
        for (const off of [0, 0.8, -0.8, 1.7, -1.7, 2.6, -2.6]) {
            const a = ang + off;
            const nx = u.x + Math.cos(a) * speed, ny = u.y + Math.sin(a) * speed;
            if (this.walkableAt(nx, ny)) {
                u.x = nx; u.y = ny;
                u.dir = Math.cos(a) < 0 ? -1 : 1;
                u.phase += speed * 3;
                return;
            }
        }
    }

    moveDirFly(u, dx, dy, speed) {
        const d = Math.hypot(dx, dy) || 1;
        u.x = clamp(u.x + dx / d * speed, 0.5, this.world.w - 1.5);
        u.y = clamp(u.y + dy / d * speed, 0.5, this.world.h - 1.5);
        u.dir = dx < 0 ? -1 : 1;
        u.phase += speed * 3;
    }

    wander(u) {
        if (this.rng() < 0.06 || u.wx === undefined) {
            const a = this.rng() * Math.PI * 2;
            u.wx = Math.cos(a); u.wy = Math.sin(a);
        }
        if (u.race === 'dragon') this.moveDirFly(u, u.wx, u.wy, u.speed * 0.6);
        else this.moveDir(u, u.wx, u.wy, u.speed * 0.55);
    }

    /* ---------------- sídla: růst, stavby, hospodářství ---------------- */

    stepSettlements() {
        const taxRate = [0, 0.15, 0.35][this.laws.tax];
        const birth = [1, 1.45, 0.55][this.laws.birth];
        this.templeFaith = 0;

        for (const v of this.villages) {
            if (v.dead) continue;
            const realm = this.realmById(v.realm);
            if (!realm) { this.destroyVillage(v, true); continue; }
            const era = ERAS[realm.era];

            /* --- stavby a jejich výnosy --- */
            let houses = 0, mills = 0, mines = 0, markets = 0, temples = 0, unis = 0, factories = 0,
                powers = 0, labs = 0, airports = 0, spaceports = 0, walls = 0, barracks = 0, harbors = 0;
            for (const bi of v.houses) {
                const b = this.buildings[bi];
                if (!b || b.dead) continue;
                switch (b.type) {
                    case 'house': case 'castle': houses++; break;
                    case 'sawmill': mills++; break;
                    case 'mine': mines++; break;
                    case 'market': markets++; break;
                    case 'temple': temples++; break;
                    case 'university': unis++; break;
                    case 'factory': factories++; break;
                    case 'power': powers++; break;
                    case 'lab': labs++; break;
                    case 'airport': airports++; break;
                    case 'spaceport': spaceports++; break;
                    case 'walls': walls++; break;
                    case 'barracks': barracks++; break;
                    case 'harbor': harbors++; break;
                }
            }
            v.stat = { houses, mills, mines, markets, temples, unis, factories, powers, labs, airports, spaceports, walls, barracks, harbors };

            const capacity = houses * era.house + 40;
            const foodProd = (v.farms * 6 + 8) * era.food * (1 + factories * 0.35 + powers * 0.5);
            const foodUse = v.pop * 0.03;
            v.food += foodProd - foodUse;
            v.wood += mills * (3 + era.army) + (this.laws.forest ? v.pop * 0.002 : 0) - 0.5;
            v.gold += mines * (2 + realm.era * 0.6) + markets * (2 + this.tradePartners(v) * 1.2)
                + factories * 6 + harbors * 4 + v.pop * 0.004 - (this.laws.health ? v.pop * 0.002 : 0);
            v.wood = Math.max(0, v.wood);
            v.gold = Math.max(0, v.gold);

            if (temples) {
                this.templeFaith += temples * 0.25;
                this.forEachNear(v.x, v.y, 8, o => { if (o.kind === 'person') o.faith = Math.min(1, o.faith + 0.02); });
            }
            if (this.laws.faith) this.forEachNear(v.x, v.y, 7, o => { if (o.kind === 'person') o.faith = Math.min(1, o.faith + 0.03); });

            /* --- daně --- */
            if (taxRate > 0) { const t = v.gold * taxRate; v.gold -= t; realm.gold += t; }

            /* --- spokojenost --- */
            let h = 0.45;
            h += v.food > v.pop * 0.5 ? 0.2 : -0.25;
            h += temples * 0.05 + markets * 0.04 + (this.laws.health ? 0.12 : 0);
            h += [0.12, 0, -0.16][this.laws.tax];
            h += this.laws.birth === 2 ? 0.05 : this.laws.birth === 1 ? -0.03 : 0;
            h += this.laws.faith ? -0.08 : 0;
            h += realm.wars.size ? -0.14 : 0.05;
            h += realm.era * 0.02;
            h -= Math.max(0, (v.pop / Math.max(1, capacity)) - 0.95) * 0.6;
            const cap0 = this.villageById(realm.capital);
            if (cap0 && cap0 !== v) {
                const far = Math.sqrt(dist2(cap0.x, cap0.y, v.x, v.y));
                h -= clamp((far - 45) / 260, 0, 0.14) * (1 - realm.era * 0.07);   // vzdálenost od trůnu
            }
            h -= clamp((realm.villages.length - 22) * 0.006, 0, 0.1);              // příliš velká říše
            v.happy = clamp(lerp(v.happy, clamp(h, 0, 1), 0.2), 0, 1);

            /* --- růst populace --- */
            if (v.food > 0) {
                const room = clamp(1 - v.pop / Math.max(1, capacity), 0, 1);
                const rate = 0.016 * birth * RACES[realm.race].fert * (0.4 + v.happy) * room
                    * (this.laws.health ? 1.25 : 1);
                v.pop += v.pop * rate + 0.4;
                if (v.food > v.pop * 3) v.food = v.pop * 3;
            } else {
                v.food = 0;
                v.pop *= 0.985;
                if (this.rng() < 0.02) this.log(`🍂 V ${v.name} je hlad`, 'bad');
            }
            if (v.pop < 1 && this.rng() < 0.2) { this.destroyVillage(v, false, 'empty'); continue; }

            /* --- úroveň sídla a rozrůstání města --- */
            let lvl = 0;
            for (let k = LEVELS.length - 1; k >= 0; k--) if (v.pop >= LEVELS[k].min) { lvl = k; break; }
            if (lvl !== v.level) {
                v.level = lvl;
                if (lvl >= 2) this.log(`🏙️ ${v.name} vyrostlo na ${LEVELS[lvl].name.toLowerCase()} (${fmt(v.pop)} obyvatel)`, 'good');
                if (lvl >= 3) this.milestone('city', `🏙️ Vzniklo první velké město: ${v.name}`);
                if (lvl >= 5) this.milestone('metro', `🌆 ${v.name} je první metropolí světa`);
            }
            this.growUrban(v, realm);
            if (this.tick % 600 === 0) v.farmFail = 0;   // zkusí to znovu, krajina se mohla změnit

            /* --- stavění --- */
            const wants = this.chooseBuilding(v, realm);
            if (wants) {
                const def = BUILDINGS[wants];
                // na drahé stavby (kosmodrom, elektrárna…) přispěje královská pokladna
                if (def.gold > 0 && v.gold < def.gold && realm.gold > def.gold * 1.2) {
                    const give = Math.min(realm.gold - def.gold * 0.2, def.gold - v.gold + 10);
                    realm.gold -= give; v.gold += give;
                }
                const speedFactor = 1 + Math.log10(1 + v.pop) * 0.5;
                if (v.wood >= def.wood && v.gold >= def.gold && this.rng() < 0.35 * speedFactor) {
                    if (wants === 'farm') {
                        if (this.addFarm(v)) { v.farms++; v.farmFail = 0; }
                        else v.farmFail = (v.farmFail || 0) + 1;
                    } else if (this.addBuilding(v, wants)) {
                        v.wood -= def.wood; v.gold -= def.gold;
                        if (wants === 'university') this.milestone('uni', `🎓 ${realm.name} otevřeli první univerzitu`);
                        if (wants === 'factory') this.milestone('factory', `🏭 ${realm.name} zapálili první továrnu`);
                        if (wants === 'spaceport') this.milestone('spaceport', `🚀 ${realm.name} postavili kosmodrom`);
                    }
                }
            }

            /* --- armáda --- */
            const conscript = [0, 0.02, 0.05][this.laws.army];
            v.army = realm.wars.size ? v.pop * conscript * (1 + barracks * 0.5) * era.army : 0;
            if (realm.wars.size && v.army > 40 && this.armies.filter(a => a.from === v.id).length < 2 && this.rng() < 0.25) {
                this.launchArmy(v, realm);
            }

            /* --- povstání --- */
            if (v.happy < 0.14 && v.pop > 500 && realm.villages.length > 2 && this.rng() < 0.02) this.rebel(v, realm);

            /* --- kolonizace --- */
            if (v.pop > 400 && v.food > v.pop * 0.6 && this.villages.filter(x => !x.dead).length < MAX_VILLAGES && this.rng() < 0.25) {
                const spot = this.colonySpot(v);
                if (spot) {
                    const nv = this.foundVillage(spot.x, spot.y, realm, Math.min(200, v.pop * 0.15));
                    if (nv) {
                        v.pop -= nv.pop;
                        this.buildRoad(v, nv);
                        this.log(`🏘️ ${realm.name}: založeno sídlo ${nv.name}`, 'good');
                        this.territoryDirty = true;
                    }
                }
            }

            /* --- viditelní panáčci --- */
            this.syncSprites(v, realm);
        }
    }

    chooseBuilding(v, realm) {
        const era = realm.era;
        const s = v.stat || {};
        const capacity = (s.houses || 0) * ERAS[era].house + 40;
        if (v.farms < Math.min(45, 3 + v.pop / 120) && (v.farmFail || 0) < 6) return 'farm';
        // nejdřív to, co město ještě nemá – jinak by stavělo jen další a další domy
        if (!s.mills && this.laws.forest) return 'sawmill';
        if (!s.mines && this.nearTile(v, [T.HILL, T.MOUNT], 7)) return 'mine';
        if (era >= 1 && !s.markets) return 'market';
        if (era >= 1 && !s.temples && this.believers > 3) return 'temple';
        if (era >= 2 && realm.wars.size && !s.barracks) return 'barracks';
        if (era >= 2 && realm.wars.size && !s.walls) return 'walls';
        if (era >= 3 && !s.unis) return 'university';
        if (era >= 4 && !s.harbors && this.nearTile(v, [T.WATER, T.DEEP], 6)) return 'harbor';
        if (era >= 5 && !s.factories) return 'factory';
        if (era >= 6 && !s.powers) return 'power';
        if (era >= 7 && !s.labs) return 'lab';
        if (era >= 8 && !s.airports && v.pop > 1200) return 'airport';
        if (era >= 9 && !s.spaceports && v.pop > 2500) return 'spaceport';
        if (v.pop > capacity * 0.7) return 'house';
        // pak se rozšiřuje to, co se vyplácí
        if (era >= 0 && (s.mills || 0) < 1 + Math.floor(v.pop / 6000) && this.laws.forest) return 'sawmill';
        if (era >= 5 && (s.factories || 0) < 1 + Math.floor(v.pop / 4000)) return 'factory';
        if (era >= 6 && (s.powers || 0) < 1 + Math.floor(v.pop / 10000)) return 'power';
        if (era >= 3 && (s.unis || 0) < 1 + Math.floor(v.level / 2)) return 'university';
        if ((s.markets || 0) < 1 + Math.floor(v.level / 2)) return 'market';
        if ((s.mines || 0) < 1 + (era >= 5 ? 2 : 0) && this.nearTile(v, [T.HILL, T.MOUNT], 7)) return 'mine';
        return 'house';
    }

    addFarm(v) {
        const w = this.world;
        for (let k = 0; k < 30; k++) {
            const a = this.rng() * Math.PI * 2, d = 1.5 + this.rng() * (4 + v.urban * 2);
            const x = clamp((v.x + Math.cos(a) * d) | 0, 1, w.w - 2);
            const y = clamp((v.y + Math.sin(a) * d) | 0, 1, w.h - 2);
            const i = y * w.w + x;
            const t = w.type[i];
            if (w.build[i]) continue;
            if (t === T.GRASS || t === T.FOREST || t === T.ASH || t === T.SAND) {
                w.paint(i, T.FARM);
                w.veg[i] = 0.9;
                return true;
            }
        }
        return false;
    }

    nearTile(v, types, r) {
        const w = this.world;
        let found = false;
        w.forEachInRadius(v.x, v.y, r, j => { if (types.includes(w.type[j])) found = true; });
        return found;
    }

    /* město se rozlévá po mapě podle počtu obyvatel */
    growUrban(v, realm) {
        const w = this.world;
        const target = LEVELS[v.level].urban;
        if (target <= 0) return;
        if (v.urban >= target && this.tick % 60 !== 0) return;
        v.urban = Math.max(v.urban, Math.min(target, v.urban + 1));
        const era = realm ? realm.era : 0;
        w.forEachInRadius(v.x, v.y, v.urban, (i, x, y, t) => {
            if (w.isWater(i) || w.type[i] === T.MOUNT || w.type[i] === T.LAVA) return;
            if (w.type[i] === T.FARM && t > 0.4) return;
            const dens = clamp(Math.round((1 - t) * (1.2 + v.level * 0.6) + (era >= 6 ? 1 : 0)), 1, 4);
            if (w.type[i] !== T.CITY || w.dens[i] !== dens) {
                w.type[i] = T.CITY;
                w.dens[i] = dens;
                w.mark(i);
            }
        });
    }

    buildRoad(a, b) {
        const w = this.world;
        let x = a.x, y = a.y;
        const dx = Math.sign(b.x - a.x), dy = Math.sign(b.y - a.y);
        let guard = 0;
        while ((x !== b.x || y !== b.y) && guard++ < 400) {
            if (x !== b.x && (y === b.y || this.rng() < 0.5)) x += dx; else y += dy;
            const i = y * w.w + x;
            if (w.isWater(i) || w.type[i] === T.CITY || w.build[i]) continue;
            if (w.type[i] === T.MOUNT) continue;
            w.type[i] = T.ROAD;
            w.mark(i);
        }
    }

    tradePartners(v) {
        let n = 0;
        const realm = this.realmById(v.realm);
        for (const o of this.villages) {
            if (o.dead || o.id === v.id) continue;
            if (dist2(o.x, o.y, v.x, v.y) > 1200) continue;
            if (o.realm !== v.realm && realm && realm.wars.has(o.realm)) continue;
            n++;
        }
        return Math.min(6, n) * (this.laws.trade ? 1 : 0.2);
    }

    /* pár viditelných panáčků kolem sídla */
    syncSprites(v, realm) {
        const want = Math.min(8, 1 + v.level + (v.pop > 100 ? 1 : 0));
        let have = 0;
        for (const u of this.units) if (u.alive && u.village === v.id && u.kind === 'person' && u.job !== 'soldier') have++;
        if (have < want && this.count < MAX_UNITS) {
            const a = this.rng() * Math.PI * 2, d = this.rng() * (1 + v.urban);
            const x = clamp(v.x + Math.cos(a) * d, 1, this.world.w - 2);
            const y = clamp(v.y + Math.sin(a) * d, 1, this.world.h - 2);
            if (this.walkableAt(x, y)) this.spawnPerson(x, y, realm.race, realm, v, 'worker');
        }
    }

    rebel(v, realm) {
        const nr = this.foundRealm(realm.race);
        realm.villages = realm.villages.filter(id => id !== v.id);
        if (realm.capital === v.id) realm.capital = realm.villages[0];
        v.realm = nr.id;
        nr.villages.push(v.id);
        nr.capital = v.id;
        nr.era = realm.era;
        nr.research = realm.research * 0.6;
        for (const bi of v.houses) { const b = this.buildings[bi]; if (b) b.realm = nr.id; }
        for (const u of this.units) if (u.alive && u.village === v.id) u.realm = nr.id;
        v.happy = 0.6;
        nr.wars.add(realm.id); realm.wars.add(nr.id);
        this.territoryDirty = true;
        this.log(`🔥 ${v.name} se vzbouřilo a založilo říši ${nr.name}!`, 'bad');
    }

    colonySpot(v) {
        const w = this.world;
        for (let k = 0; k < 50; k++) {
            const a = this.rng() * Math.PI * 2, d = 22 + this.rng() * 22;
            const x = clamp((v.x + Math.cos(a) * d) | 0, 2, w.w - 3);
            const y = clamp((v.y + Math.sin(a) * d) | 0, 2, w.h - 3);
            const i = y * w.w + x;
            const t = w.type[i];
            if (t !== T.GRASS && t !== T.FOREST && t !== T.SAND && t !== T.HILL && t !== T.SNOW) continue;
            if (w.build[i]) continue;
            let tooClose = false;
            for (const o of this.villages) if (!o.dead && dist2(o.x, o.y, x, y) < 420) { tooClose = true; break; }
            if (tooClose) continue;
            if (w.owner[i] && w.owner[i] !== v.realm) continue;
            return { x, y, i };
        }
        return null;
    }

    /* ---------------- armády a války ---------------- */

    launchArmy(v, realm) {
        const target = this.nearestVillage(v.x, v.y, 1e9, o => realm.wars.has(o.realm));
        if (!target) return;
        const strength = v.army;
        v.pop = Math.max(0, v.pop - strength * 0.6);
        const army = {
            id: ++this.nextUnit, x: v.x + 0.5, y: v.y + 0.5, dx: 0, dy: 0,
            realm: realm.id, color: realm.color, from: v.id, target: target.id,
            strength, dead: false, sprites: []
        };
        this.armies.push(army);
        const n = clamp(Math.round(Math.log10(strength + 10) * 2), 1, 5);
        for (let k = 0; k < n; k++) {
            const u = this.spawnPerson(army.x, army.y, realm.race, realm, v, 'soldier');
            if (!u) break;
            u.army = army;
            u.off = { x: (this.rng() - 0.5) * 1.4, y: (this.rng() - 0.5) * 1.4 };
            army.sprites.push(u);
        }
    }

    stepArmies() {
        for (let k = this.armies.length - 1; k >= 0; k--) {
            const a = this.armies[k];
            const realm = this.realmById(a.realm);
            const target = this.villageById(a.target);
            if (a.dead || !realm || !target || a.strength <= 0) { this.disbandArmy(k); continue; }

            // bitva s nepřátelskou armádou v cestě
            for (const b of this.armies) {
                if (b === a || b.dead || b.realm === a.realm) continue;
                if (!realm.wars.has(b.realm)) continue;
                if (dist2(a.x, a.y, b.x, b.y) < 4) {
                    const la = Math.min(a.strength, b.strength) * 0.12;
                    a.strength -= la; b.strength -= la;
                    this.stats.warDead += la * 2;
                    if (this.tick % 20 === 0) this.fx.push({ type: 'clash', x: a.x, y: a.y, life: 10, max: 10 });
                    if (a.strength <= 0) { this.disbandArmy(this.armies.indexOf(a)); }
                    if (b.strength <= 0) { this.disbandArmy(this.armies.indexOf(b)); }
                    break;
                }
            }
            if (a.dead) continue;

            const d = Math.hypot(target.x - a.x, target.y - a.y);
            if (d < 1.5) {
                this.assault(a, target, realm);
                this.disbandArmy(this.armies.indexOf(a));
                continue;
            }
            const sp = 0.10 + realm.era * 0.012;
            a.dx = (target.x - a.x) / d; a.dy = (target.y - a.y) / d;
            a.x += a.dx * sp; a.y += a.dy * sp;
        }
    }

    disbandArmy(k) {
        const a = this.armies[k];
        if (!a) return;
        a.dead = true;
        for (const u of a.sprites) if (u.alive) this.kill(u, 'war');
        this.armies.splice(k, 1);
    }

    assault(army, v, realm) {
        const defRealm = this.realmById(v.realm);
        const era = defRealm ? ERAS[defRealm.era] : ERAS[0];
        const defense = v.pop * 0.03 * era.army * (1 + (v.stat ? v.stat.walls * 0.8 + v.stat.barracks * 0.4 : 0));
        this.stats.warDead += Math.min(army.strength, defense);
        if (army.strength > defense) {
            const losses = Math.min(v.pop * 0.5, v.pop * 0.25 + defense);
            v.pop = Math.max(0, v.pop - losses);
            for (let k = 0; k < 3 && v.houses.length; k++) {
                if (this.rng() < 0.6) this.destroyBuilding(v.houses[(this.rng() * v.houses.length) | 0]);
            }
            if (v.dead) return;
            if (v.pop < 60 || this.rng() < 0.5) {
                // dobytí města – mění majitele
                if (defRealm) {
                    defRealm.villages = defRealm.villages.filter(id => id !== v.id);
                    if (defRealm.capital === v.id) defRealm.capital = defRealm.villages[0];
                    if (!defRealm.villages.length) this.destroyVillage(v, true, 'war');
                }
                if (!v.dead) {
                    v.realm = realm.id;
                    realm.villages.push(v.id);
                    v.happy = 0.3;
                    v.pop = Math.max(30, v.pop);
                    for (const bi of v.houses) { const b = this.buildings[bi]; if (b) b.realm = realm.id; }
                    for (const u of this.units) if (u.alive && u.village === v.id) u.realm = realm.id;
                    this.stats.captured++;
                    this.territoryDirty = true;
                    this.log(`🏴 ${realm.name} dobyli ${v.name}!`, 'bad');
                }
                if (defRealm && !defRealm.villages.length && !defRealm.dead) {
                    defRealm.dead = true;
                    for (const o of this.realms) o.wars.delete(defRealm.id);
                    this.log(`👑 Říše ${defRealm.name} padla`, 'bad');
                    this.territoryDirty = true;
                }
            } else {
                this.log(`⚔️ ${realm.name} vyplenili ${v.name}`, 'bad');
            }
        } else {
            v.pop = Math.max(0, v.pop - army.strength * 0.4);
            if (this.rng() < 0.4) this.log(`🛡️ ${v.name} ubránilo hradby`, 'info');
        }
        this.fx.push({ type: 'clash', x: v.x, y: v.y, life: 16, max: 16 });
    }

    /* ---------------- říše ---------------- */

    stepRealms() {
        for (const r of this.realms) {
            if (r.dead) continue;
            let pop = 0, unis = 0, labs = 0, spaceports = 0, cities = 0;
            for (const vid of r.villages) {
                const v = this.villageById(vid);
                if (!v) continue;
                pop += v.pop; cities++;
                if (v.stat) { unis += v.stat.unis; labs += v.stat.labs; spaceports += v.stat.spaceports; }
            }
            r.pop = pop;
            r.cities = cities;
            if (pop > r.peak) r.peak = pop;

            const sci = [0.25, 1, 1.8][this.laws.science] * RACES[r.race].sci;
            const upkeep = r.villages.length * 0.4 + (this.laws.health ? pop * 0.0005 : 0);
            r.gold = Math.max(0, r.gold - upkeep);
            const invest = Math.min(r.gold, 2 + pop * 0.002);
            r.gold -= invest;
            r.research += (Math.pow(Math.max(1, pop), 0.55) * 0.11 + unis * 1.6 + labs * 5 + invest * 0.25) * sci;

            while (r.era < ERAS.length - 1 && r.research >= ERAS[r.era + 1].cost) {
                r.era++;
                const e = ERAS[r.era];
                this.log(`${e.icon} ${r.name}: nastala ${e.name}`, 'good');
                this.milestone('era' + r.era, `${e.icon} Svět vstoupil do doby: ${e.name} (${r.name})`);
            }

            // vesmírný program
            if (r.era >= 9 && spaceports > 0) {
                r.space += 0.25 + spaceports * 0.15 + labs * 0.05;
                if (r.space >= 100 && !r.moon) {
                    r.moon = true;
                    this.stats.moon++;
                    const cap = this.villageById(r.capital);
                    if (cap) this.rockets.push({ x: cap.x, y: cap.y, t: 0, realm: r.id });
                    this.log(`🚀 ${r.name} vyslali první lidi na Měsíc!`, 'good');
                    this.milestone('moon', '🌕 Lidská noha poprvé stanula na Měsíci');
                }
            }
            if (r.ruler) {
                r.ruler.age -= 10;
                if (r.ruler.age <= 0) this.newRuler(r, true);
            }
        }
    }

    stepRockets() {
        for (let k = this.rockets.length - 1; k >= 0; k--) {
            const r = this.rockets[k];
            r.t++;
            if (r.t > 150) this.rockets.splice(k, 1);
        }
    }

    updateTerritory() {
        const w = this.world;
        const dist = this.terrDist || (this.terrDist = new Float32Array(w.n));
        dist.fill(1e9);
        const prev = this.prevOwner || (this.prevOwner = new Int16Array(w.n));
        prev.set(w.owner);
        w.owner.fill(0);
        for (const v of this.villages) {
            if (v.dead) continue;
            const realm = this.realmById(v.realm);
            const r = 5 + Math.min(16, Math.log10(1 + v.pop) * 5) + (realm ? realm.era * 0.4 : 0);
            w.forEachInRadius(v.x, v.y, r, (i, x, y, t) => {
                if (w.type[i] === T.DEEP) return;
                if (t < dist[i]) { dist[i] = t; w.owner[i] = v.realm; }
            });
        }
        for (let i = 0; i < w.n; i++) if (prev[i] !== w.owner[i]) { this.territoryDirty = true; return; }
    }

    diplomacy() {
        const live = this.realms.filter(r => !r.dead);
        const policy = this.laws.war;
        for (const a of live) {
            for (const b of live) {
                if (a.id >= b.id) continue;
                if (!this.realmsTouch(a, b)) continue;
                if (a.wars.has(b.id)) {
                    const peace = policy === 0 ? 0.95 : policy === 2 ? 0.2 : 0.5;
                    if (this.rng() < peace) this.makePeace(a, b);
                } else if (policy > 0) {
                    let hostile = (a.race === 'orc' || b.race === 'orc') ? 0.18 : 0.08;
                    hostile /= 1 + live.length * 0.06;                    // ve světě plném říší se tolik neválčí
                    if (policy === 2) hostile *= 3;
                    if (this.rng() < hostile) this.declareWar(a, b);
                }
            }
        }
    }

    realmsTouch(a, b) {
        for (const va of a.villages) {
            const v1 = this.villageById(va);
            if (!v1) continue;
            for (const vb of b.villages) {
                const v2 = this.villageById(vb);
                if (v2 && dist2(v1.x, v1.y, v2.x, v2.y) < 1600) return true;
            }
        }
        return false;
    }

    declareWar(a, b) {
        if (!a || !b || a.dead || b.dead || a.wars.has(b.id)) return;
        a.wars.add(b.id); b.wars.add(a.id);
        this.stats.wars++;
        this.log(`⚔️ ${a.name} vyhlásili válku říši ${b.name}`, 'bad');
    }

    makePeace(a, b) {
        if (!a || !b || !a.wars.has(b.id)) return;
        a.wars.delete(b.id); b.wars.delete(a.id);
        this.log(`🕊️ ${a.name} a ${b.name} uzavřeli mír`, 'good');
    }

    /* ---------------- boží zásahy do měst ---------------- */

    harmArea(x, y, r, fraction, cause) {
        let dead = 0;
        for (const v of this.villages) {
            if (v.dead) continue;
            const d = Math.sqrt(dist2(v.x, v.y, x, y));
            if (d > r) continue;
            const f = fraction * (1 - d / r * 0.6);
            const loss = v.pop * clamp(f, 0, 1);
            v.pop -= loss;
            dead += loss;
            if (v.pop < 1) this.destroyVillage(v, false, 'war');
        }
        if (dead > 0) {
            this.stats.godDead += dead;
            if (dead > 500) this.log(`💀 Tvůj zásah zabil ${fmt(dead)} lidí`, 'bad');
        }
        return dead;
    }

    /* ---------------- dějiny ---------------- */

    record() {
        const h = this.hist;
        let pop = 0, gold = 0, food = 0, wood = 0, wars = 0, era = 0;
        for (const v of this.villages) if (!v.dead) { pop += v.pop; gold += v.gold; food += v.food; wood += v.wood; }
        for (const r of this.realms) if (!r.dead) { gold += r.gold; wars += r.wars.size; era = Math.max(era, r.era); }
        if (pop > this.stats.peak) this.stats.peak = pop;
        h.t.push(this.year);
        h.pop.push(pop);
        h.villages.push(this.villages.filter(v => !v.dead).length);
        h.gold.push(gold);
        h.food.push(food);
        h.wood.push(wood);
        h.wars.push(wars / 2);
        h.era.push(era);
        for (const r of this.realms) {
            if (!h.realms.has(r.id)) h.realms.set(r.id, { color: r.color, name: r.name, data: new Array(Math.max(0, h.t.length - 1)).fill(0) });
            h.realms.get(r.id).data.push(r.dead ? 0 : (r.pop || 0));
        }
        const len = h.t.length;
        for (const [, s] of h.realms) while (s.data.length < len) s.data.push(0);
        if (len > 320) {
            for (const k of ['t', 'pop', 'villages', 'gold', 'food', 'wood', 'wars', 'era']) h[k].shift();
            for (const [, s] of h.realms) s.data.shift();
        }
    }

    summary() {
        let pop = 0, gold = 0, food = 0, wood = 0, cities = 0, farms = 0, army = 0;
        for (const v of this.villages) {
            if (v.dead) continue;
            pop += v.pop; gold += v.gold; food += v.food; wood += v.wood; farms += v.farms;
            if (v.level >= 3) cities++;
        }
        for (const a of this.armies) army += a.strength;
        const realms = this.realms.filter(r => !r.dead);
        for (const r of realms) gold += r.gold;
        let animals = 0, zombies = 0, sprites = 0;
        for (const u of this.units) {
            if (!u.alive) continue;
            if (u.kind === 'animal') animals++;
            else if (u.zombie) zombies++;
            else sprites++;
        }
        return {
            pop, realms, cities, farms, army, animals, zombies, sprites,
            villages: this.villages.filter(v => !v.dead).length,
            houses: this.buildings.filter(b => !b.dead).length,
            wars: realms.reduce((n, r) => n + r.wars.size, 0) / 2,
            era: realms.length ? Math.max(...realms.map(r => r.era)) : 0,
            moon: realms.filter(r => r.moon).length,
            gold: Math.round(gold), food: Math.round(food), wood: Math.round(wood)
        };
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Life, RACES, ANIMALS, LAWS, ERAS, LEVELS, BUILDINGS, setWorldLimits, fmt };
}
