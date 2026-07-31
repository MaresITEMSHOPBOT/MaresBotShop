'use strict';
/* Panáčci, zvířata, vesnice, království, hospodářství, zákony a dějiny.
   Simulace běží v pevných ticích (8× za vteřinu), vykreslování mezi tiky
   dopočítává mezipolohy – proto se nic netřese. */

const RACES = {
    human: { id: 'human', name: 'Lidé', emoji: '🧑', skin: '#f0c9a0', speed: 0.30, str: 1.0, fert: 1.0, maxAge: 1500, work: 1.1, homes: [T.GRASS, T.FOREST, T.SAND, T.FARM, T.HILL] },
    orc: { id: 'orc', name: 'Orkové', emoji: '👹', skin: '#8bbf63', speed: 0.31, str: 1.6, fert: 1.15, maxAge: 1100, work: 0.85, homes: [T.GRASS, T.HILL, T.ASH, T.SAND] },
    elf: { id: 'elf', name: 'Elfové', emoji: '🧝', skin: '#f6e2c8', speed: 0.36, str: 0.85, fert: 0.75, maxAge: 2800, work: 1.0, homes: [T.FOREST, T.GRASS] },
    dwarf: { id: 'dwarf', name: 'Trpaslíci', emoji: '🧔', skin: '#dda879', speed: 0.25, str: 1.35, fert: 0.9, maxAge: 1900, work: 1.25, homes: [T.HILL, T.MOUNT, T.SNOW, T.GRASS] }
};
const ANIMALS = {
    sheep: { id: 'sheep', name: 'Ovce', emoji: '🐑', color: '#efece2', speed: 0.14, str: 0.15, maxAge: 900, prey: true },
    wolf: { id: 'wolf', name: 'Vlci', emoji: '🐺', color: '#7b8090', speed: 0.34, str: 1.1, maxAge: 1100, prey: false },
    dragon: { id: 'dragon', name: 'Drak', emoji: '🐉', color: '#b4453a', speed: 0.42, str: 9, maxAge: 6000, prey: false }
};

const ERAS = ['Doba kamenná', 'Doba bronzová', 'Doba železná', 'Středověk', 'Renesance'];
const ERA_COST = [0, 350, 1100, 2600, 5200];

/* zákony světa – hráč je vyhlašuje pro celý svět */
const LAWS = [
    {
        id: 'tax', name: 'Daně', icon: '🪙', opts: ['Žádné', 'Nízké', 'Vysoké'], def: 1,
        desc: 'Kolik zlata odvádějí vesnice králi. Vysoké daně plní pokladnu, ale lidé je nemají rádi.'
    },
    {
        id: 'army', name: 'Branná povinnost', icon: '⚔️', opts: ['Žádná', 'Malá', 'Velká'], def: 1,
        desc: 'Kolik obyvatel se ve válce stane vojáky. Velká armáda vítězí, ale nikdo nesbírá jídlo.'
    },
    {
        id: 'birth', name: 'Porodnost', icon: '👶', opts: ['Volná', 'Podporovaná', 'Omezená'], def: 0,
        desc: 'Podpora rodin zrychlí růst, omezení šetří jídlo a lidé jsou klidnější.'
    },
    {
        id: 'forest', name: 'Kácení lesů', icon: '🪵', opts: ['Zakázáno', 'Povolené'], def: 1,
        desc: 'Bez dřeva se nestaví. Kácení ale mění lesy v holé louky.'
    },
    {
        id: 'trade', name: 'Obchod', icon: '🛒', opts: ['Zákaz', 'Volný'], def: 1,
        desc: 'Volný obchod nosí zlato ze sousedních měst, se kterými má království mír.'
    },
    {
        id: 'faith', name: 'Povinná víra', icon: '🙏', opts: ['Ne', 'Ano'], def: 0,
        desc: 'Všichni musí věřit v tebe. Roste ti víra, klesá spokojenost.'
    },
    {
        id: 'war', name: 'Zahraniční politika', icon: '🏳️', opts: ['Mírová', 'Běžná', 'Dobyvačná'], def: 1,
        desc: 'Určuje, jak často si království vyhlašují války.'
    },
    {
        id: 'science', name: 'Podpora vědy', icon: '📜', opts: ['Ne', 'Ano'], def: 1,
        desc: 'Vědou se postupuje do dalších dob – lepší stavby, silnější vojáci, vyšší výnosy.'
    }
];

const REALM_COLORS = ['#4f86e8', '#c8452f', '#2fae86', '#d79a2b', '#9b5de5', '#f15bb5', '#00bbf9', '#8ac926', '#ff924c', '#59c3c3', '#e56b6f', '#b8f2e6'];

const BUILDINGS = {
    castle: { name: 'Hrad', hp: 130, wood: 0, food: 0, era: 0 },
    house: { name: 'Dům', hp: 45, wood: 6, food: 8, era: 0 },
    sawmill: { name: 'Pila', hp: 40, wood: 8, food: 4, era: 0 },
    mine: { name: 'Důl', hp: 50, wood: 14, food: 6, era: 0 },
    market: { name: 'Tržiště', hp: 45, wood: 18, food: 10, era: 1 },
    temple: { name: 'Chrám', hp: 60, wood: 24, food: 14, era: 1 },
    barracks: { name: 'Kasárna', hp: 70, wood: 20, food: 12, era: 2 },
    farm: { name: 'Pole', hp: 0, wood: 0, food: 4, era: 0 }
};

let MAX_UNITS = 2200;
let MAX_VILLAGES = 90;

/* limity se přizpůsobí velikosti mapy */
function setWorldLimits(w, h) {
    const tiles = w * h;
    MAX_UNITS = Math.round(clamp(tiles * 0.14, 900, 3200));
    MAX_VILLAGES = Math.round(clamp(tiles / 230, 40, 220));
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
        this.nextRealm = 1; this.nextVillage = 1; this.nextUnit = 1;
        this.tick = 0;

        this.events = [];
        this.dirtyLog = false;
        this.fx = [];
        this.stats = { born: 0, died: 0, warDead: 0, godDead: 0, peak: 0, builtTotal: 0, wars: 0 };
        this.faith = 80;
        this.faithMax = 200;
        this.believers = 0;
        this.godMode = false;

        this.laws = {};
        for (const l of LAWS) this.laws[l.id] = l.def;

        this.hist = { t: [], pop: [], villages: [], gold: [], food: [], wood: [], wars: [], realms: new Map() };

        this.head = new Int32Array(world.n).fill(-1);
        this.next = new Int32Array(MAX_UNITS + 8).fill(-1);
    }

    /* ---------------- pomůcky ---------------- */

    get year() { return Math.floor(this.tick / 60); }

    log(text, kind = 'info') {
        this.events.push({ tick: this.tick, year: this.year, text, kind });
        if (this.events.length > 260) this.events.shift();
        this.dirtyLog = true;
    }

    realmById(id) { for (const r of this.realms) if (r.id === id && !r.dead) return r; return null; }
    villageById(id) { for (const v of this.villages) if (v.id === id && !v.dead) return v; return null; }
    law(id) { return this.laws[id]; }

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

    /* ---------------- tvorové ---------------- */

    newUnit() {
        if (this.free.length) {
            const u = this.units[this.free.pop()];
            u.uid = ++this.nextUnit;
            return u;
        }
        const u = { slot: this.units.length, uid: ++this.nextUnit };
        this.units.push(u);
        if (this.units.length > this.next.length) {
            const n = new Int32Array(this.units.length + 64).fill(-1);
            n.set(this.next); this.next = n;
        }
        return u;
    }

    spawnPerson(x, y, raceId, realm, village) {
        if (this.count >= MAX_UNITS) return null;
        const race = RACES[raceId];
        const p = personName(this.rng, raceId);
        const u = this.newUnit();
        Object.assign(u, {
            alive: true, kind: 'person', race: raceId, name: p.name, female: p.female,
            x, y, ox: x, oy: y, hp: 12 * race.str + 8, maxHp: 12 * race.str + 8,
            food: 0.8, age: 0, maxAge: race.maxAge * (0.8 + this.rng() * 0.4),
            realm: realm ? realm.id : 0, village: village ? village.id : 0,
            job: 'child', state: 'idle', timer: 0, carry: 0, carryType: 'food', goal: -1,
            phase: this.rng() * 6.28, faith: 0, sick: 0, zombie: 0, kills: 0,
            str: race.str * (0.85 + this.rng() * 0.3), speed: race.speed * (0.9 + this.rng() * 0.2)
        });
        this.stats.born++;
        return u;
    }

    spawnAnimal(x, y, kindId) {
        if (this.count >= MAX_UNITS) return null;
        const a = ANIMALS[kindId];
        const u = this.newUnit();
        Object.assign(u, {
            alive: true, kind: 'animal', race: kindId, name: a.name, female: this.rng() < 0.5,
            x, y, ox: x, oy: y, hp: 8 * a.str + 4, maxHp: 8 * a.str + 4,
            food: 0.9, age: 0, maxAge: a.maxAge * (0.8 + this.rng() * 0.4),
            realm: 0, village: 0, job: 'wild', state: 'idle', timer: 0, carry: 0, goal: -1,
            phase: this.rng() * 6.28, faith: 0, sick: 0, zombie: 0, str: a.str, speed: a.speed
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
        if (u.kind === 'person' && u.zombie === 0 && cause === 'zombie') {
            const z = this.spawnPerson(u.x, u.y, u.race, null, null);
            if (z) { z.zombie = 1; z.job = 'zombie'; z.realm = 0; z.village = 0; z.name = 'Nemrtvý ' + z.name; z.hp = z.maxHp; }
        }
    }

    get count() {
        let n = 0;
        for (const u of this.units) if (u.alive) n++;
        return n;
    }

    /* ---------------- království a vesnice ---------------- */

    newRuler(realm, why) {
        const p = personName(this.rng, realm.race);
        realm.ruler = { name: p.name, female: p.female, since: this.year, age: 200 + this.rng() * 900 };
        if (why) this.log(`👑 ${realm.name}: ${p.female ? 'novou královnou' : 'novým králem'} je ${p.name}`, 'info');
    }

    foundRealm(raceId) {
        const id = this.nextRealm++;
        const realm = {
            id, name: realmName(this.rng), race: raceId,
            color: REALM_COLORS[(id - 1) % REALM_COLORS.length],
            villages: [], wars: new Set(), born: this.tick, dead: false, capital: 0,
            gold: 20, research: 0, era: 0, ruler: null, peak: 0
        };
        this.newRuler(realm);
        this.realms.push(realm);
        return realm;
    }

    foundVillage(x, y, realm) {
        if (this.villages.filter(v => !v.dead).length >= MAX_VILLAGES) return null;
        const v = {
            id: this.nextVillage++, name: villageName(this.rng), x: x | 0, y: y | 0,
            realm: realm.id, houses: [], food: 16, wood: 10, gold: 5,
            pop: 0, soldiers: 0, happy: 0.6, dead: false, born: this.tick, buildOrder: 0
        };
        this.villages.push(v);
        realm.villages.push(v.id);
        if (!realm.capital) realm.capital = v.id;
        this.addBuilding(v, realm.capital === v.id ? 'castle' : 'house');
        return v;
    }

    freeSpot(v, radius = 5) {
        const w = this.world;
        for (let k = 0; k < 40; k++) {
            const a = this.rng() * Math.PI * 2, d = 1 + this.rng() * radius;
            const x = clamp((v.x + Math.cos(a) * d) | 0, 1, w.w - 2);
            const y = clamp((v.y + Math.sin(a) * d) | 0, 1, w.h - 2);
            const i = y * w.w + x;
            if (w.build[i]) continue;
            const t = w.type[i];
            if (t === T.GRASS || t === T.SAND || t === T.FOREST || t === T.HILL || t === T.SNOW || t === T.ASH) return { i, x, y };
        }
        return null;
    }

    addBuilding(v, type, spot) {
        const def = BUILDINGS[type];
        const s = spot || this.freeSpot(v, type === 'castle' ? 2 : 6);
        if (!s) return null;
        const realm = this.realmById(v.realm);
        const hp = def.hp * (1 + (realm ? realm.era : 0) * 0.2);
        const b = { i: s.i, x: s.x, y: s.y, type, village: v.id, realm: v.realm, hp, maxHp: hp, dead: false };
        this.buildings.push(b);
        this.world.build[s.i] = this.buildings.length;
        this.world.mark(s.i);
        v.houses.push(this.buildings.length - 1);
        this.stats.builtTotal++;
        return b;
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
        const r = this.realmById(v.realm);
        if (r) {
            r.villages = r.villages.filter(id => id !== v.id);
            if (!quiet) this.log(reason === 'empty'
                ? `🏚️ Vesnice ${v.name} vymřela`
                : `🔥 Vesnice ${v.name} byla srovnána se zemí`, 'bad');
            if (!r.villages.length) {
                r.dead = true;
                for (const o of this.realms) o.wars.delete(r.id);
                r.wars.clear();
                this.log(`👑 Království ${r.name} zaniklo (${Math.floor(r.born / 60)}–${this.year})`, 'bad');
                for (let i = 0; i < this.world.n; i++) if (this.world.owner[i] === r.id) this.world.owner[i] = 0;
                this.territoryDirty = true;
            } else if (r.capital === v.id) {
                r.capital = r.villages[0];
                this.newRuler(r, true);
                const cap = this.villageById(r.capital);
                if (cap) this.log(`🏰 ${r.name} má nové hlavní město: ${cap.name}`, 'info');
            }
        }
        for (const u of this.units) if (u.alive && u.village === v.id) { u.village = 0; u.job = 'wanderer'; }
    }

    homeSpot(raceId) {
        const w = this.world, race = RACES[raceId] || RACES.human;
        for (let k = 0; k < 700; k++) {
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

    seedTribe(x, y, raceId, count = 6) {
        const w = this.world;
        if (!w.walkable(this.tileAt(x, y))) return null;
        const realm = this.foundRealm(raceId);
        const v = this.foundVillage(x, y, realm);
        if (!v) return null;
        for (let k = 0; k < count; k++) {
            const a = this.rng() * Math.PI * 2, d = this.rng() * 2.5;
            const px = clamp(x + Math.cos(a) * d, 1, w.w - 2), py = clamp(y + Math.sin(a) * d, 1, w.h - 2);
            if (!this.walkableAt(px, py)) continue;
            const u = this.spawnPerson(px, py, raceId, realm, v);
            if (u) { u.job = 'worker'; u.age = 260 + this.rng() * 200; }
        }
        this.territoryDirty = true;
        this.log(`👑 Vzniklo království ${realm.name} (${RACES[raceId].name}) – vládne ${realm.ruler.name}`, 'good');
        return realm;
    }

    /* ---------------- hlavní tik ---------------- */

    step() {
        this.tick++;
        this.world.step(this.rng);
        this.rebuildIndex();

        let believers = 0, animals = 0, people = 0;
        for (const u of this.units) {
            if (!u.alive) continue;
            u.ox = u.x; u.oy = u.y;
            this.stepUnit(u);
            if (!u.alive) continue;
            if (u.faith > 0.3) believers++;
            if (u.kind === 'animal') animals++; else people++;
        }
        this.believers = believers;
        this.animalCount = animals;
        this.peopleCount = people;
        if (people > this.stats.peak) this.stats.peak = people;

        if (typeof stepHazards === 'function') stepHazards(this);
        if (this.tick % 10 === 0) this.stepVillages();
        if (this.tick % 10 === 5) this.stepRealms();
        if (this.tick % 40 === 0) this.updateTerritory();
        if (this.tick % 260 === 0) this.diplomacy();
        if (this.tick % 20 === 0) this.record();

        this.faithMax = 200 + believers * 0.8;
        if (this.godMode) this.faith = this.faithMax;
        else this.faith = Math.min(this.faithMax, this.faith + 0.05 + believers * 0.006);
    }

    /* ---------------- chování panáčka ---------------- */

    stepUnit(u) {
        const w = this.world;
        const i = this.tileAt(u.x, u.y);

        if (w.lava[i]) { this.kill(u, 'lava'); return; }
        if (u.race !== 'dragon') {
            if (w.isWater(i)) { u.hp -= 3; if (u.hp <= 0) { this.kill(u, 'voda'); return; } }
            if (w.fire[i]) { u.hp -= 2; if (u.hp <= 0) { this.kill(u, 'oheň'); return; } }
        }

        u.age++;
        if (u.age > u.maxAge) { this.kill(u, 'stáří'); return; }
        if (u.zombie) {
            this.stepZombie(u);
            return;
        }
        u.food -= u.kind === 'person' ? 0.0016 : 0.0012;
        if (u.food <= 0) {
            u.food = 0; u.hp -= 0.15;
            if (u.hp <= 0) { this.kill(u, 'hlad'); return; }
        } else if (u.hp < u.maxHp) u.hp = Math.min(u.maxHp, u.hp + 0.05);
        if (u.sick > 0) {
            u.sick--;
            u.hp -= 0.12;
            if (this.rng() < 0.01) this.forEachNear(u.x, u.y, 1.6, o => { if (o.kind === 'person' && !o.sick && this.rng() < 0.3) o.sick = 420; });
            if (u.hp <= 0) { this.kill(u, 'mor'); return; }
        }
        if (u.faith > 0) u.faith = Math.max(0, u.faith - 0.0003);

        if (u.kind === 'animal') this.stepAnimal(u, i);
        else this.stepPerson(u, i);
    }

    stepZombie(u) {
        let prey = null, best = 1e9;
        this.forEachNear(u.x, u.y, 8, o => {
            if (o === u || o.zombie || o.kind !== 'person') return;
            const d = dist2(o.x, o.y, u.x, u.y);
            if (d < best) { best = d; prey = o; }
        });
        if (prey) {
            if (best < 0.8) {
                prey.hp -= 3;
                if (prey.hp <= 0) this.kill(prey, 'zombie');
            } else this.moveTo(u, prey.x, prey.y, 0.2);
        } else this.wander(u);
        if (this.rng() < 0.0008) this.kill(u, 'rozpad');
    }

    stepAnimal(u, i) {
        const w = this.world, a = ANIMALS[u.race];
        if (u.race === 'dragon') { this.stepDragon(u, i); return; }

        if (u.food > 0.8 && u.age > 150 && this.tick % 8 === 0 && (this.animalCount || 0) < 150 && this.count < MAX_UNITS) {
            let near = 0;
            this.forEachNear(u.x, u.y, 6, o => { if (o.race === u.race) near++; });
            if (near < (a.prey ? 7 : 3) && this.rng() < (a.prey ? 0.05 : 0.02)) {
                const baby = this.spawnAnimal(u.x + this.rng() - 0.5, u.y + this.rng() - 0.5, u.race);
                if (baby) { u.food -= 0.3; baby.food = 0.7; }
            }
        }

        if (a.prey) {
            if (u.food < 0.9 && w.veg[i] > 0.12 && !w.isWater(i)) {
                w.veg[i] -= 0.015; u.food = Math.min(1, u.food + 0.02);
                w.classify(i);
                return;
            }
            let danger = null;
            this.forEachNear(u.x, u.y, 5, o => { if (o.race === 'wolf' || o.zombie) { danger = o; return false; } });
            if (danger) { this.moveDir(u, u.x - danger.x, u.y - danger.y, u.speed * 1.3); return; }
        } else {
            let prey = null, best = 1e9, human = false;
            this.forEachNear(u.x, u.y, 7, o => {
                if (o === u || o.race === 'wolf') return;
                const person = o.kind === 'person';
                if (person && o.job === 'soldier') return;
                const score = dist2(o.x, o.y, u.x, u.y) * (person ? 4 : 1);
                if (score < best) { best = score; prey = o; human = person; }
            });
            if (prey) {
                if (dist2(prey.x, prey.y, u.x, u.y) < 0.8) {
                    prey.hp -= (human ? 1.5 : 4) * u.str;
                    if (human) { u.hp -= prey.str * 2.2; if (u.hp <= 0) { this.kill(u, 'obrana'); return; } }
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
        if (this.rng() < 0.035) {
            w.ignite(i);
            if (this.rng() < 0.4) w.neighbors(i, j => { if (this.rng() < 0.3) w.ignite(j); });
        }
        let prey = null, best = 1e9;
        this.forEachNear(u.x, u.y, 14, o => {
            if (o === u || o.race === 'dragon') return;
            const d = dist2(o.x, o.y, u.x, u.y);
            if (d < best) { best = d; prey = o; }
        });
        if (prey) {
            if (best < 1.6) { this.kill(prey, 'drak'); u.kills = (u.kills || 0) + 1; }
            else { this.moveDirFly(u, prey.x - u.x, prey.y - u.y, u.speed); return; }
        }
        // občas zapálí nejbližší stavbu
        if (this.rng() < 0.02) {
            for (const b of this.buildings) {
                if (b.dead) continue;
                if (dist2(b.x, b.y, u.x, u.y) < 100) { b.hp -= 12; w.mark(b.i); if (b.hp <= 0) this.destroyBuilding(this.buildings.indexOf(b)); break; }
            }
        }
        this.moveDirFly(u, (this.rng() - 0.5), (this.rng() - 0.5), u.speed * 0.6);
    }

    stepPerson(u, i) {
        const w = this.world;
        const v = u.village ? this.villageById(u.village) : null;
        if (!v && u.job !== 'wanderer') { u.job = 'wanderer'; u.village = 0; }

        if (u.job === 'child') {
            if (u.age > 240) { u.job = 'worker'; u.state = 'idle'; }
            if (v) this.stayNear(u, v.x, v.y, 3);
            return;
        }
        if (u.job === 'soldier') { this.stepSoldier(u, v); return; }
        if (u.job === 'wanderer') {
            if (this.tick % 20 === 0) {
                let best = null, bd = 1400;
                for (const vv of this.villages) {
                    if (vv.dead) continue;
                    const r = this.realmById(vv.realm);
                    if (!r || r.race !== u.race) continue;
                    const d = dist2(vv.x, vv.y, u.x, u.y);
                    if (d < bd) { bd = d; best = vv; }
                }
                if (best) { u.village = best.id; u.realm = best.realm; u.job = 'worker'; u.state = 'idle'; }
            }
            this.wander(u);
            return;
        }
        if (!v) { this.wander(u); return; }

        if (u.food < 0.35 && v.food > 1 && dist2(u.x, u.y, v.x, v.y) < 9) { v.food -= 0.7; u.food = 1; return; }

        switch (u.state) {
            case 'idle': {
                if (u.carry > 0) { u.state = 'return'; break; }
                if (v.buildOrder > 0) { v.buildOrder--; u.state = 'build'; u.goal = -1; break; }
                if (v.wood < 6 + v.houses.length && this.laws.forest === 1 && this.rng() < 0.3) { u.state = 'chop'; u.goal = -1; break; }
                u.state = 'gather'; u.goal = -1;
                break;
            }
            case 'gather': case 'chop': {
                const wantWood = u.state === 'chop';
                if (u.goal < 0 || !(wantWood ? this.world.type[u.goal] === T.FOREST : this.goodFood(u.goal))) {
                    u.goal = wantWood ? this.findForest(v, u) : this.findFood(v, u);
                    if (u.goal < 0) { u.state = 'gather'; this.stayNear(u, v.x, v.y, 5); return; }
                }
                const gx = u.goal % w.w + 0.5, gy = ((u.goal / w.w) | 0) + 0.5;
                if (dist2(u.x, u.y, gx, gy) < 0.7) {
                    u.timer++;
                    const race = RACES[u.race];
                    if (u.timer > 7 / race.work) {
                        const realm = this.realmById(u.realm);
                        const eraBonus = 1 + (realm ? realm.era : 0) * 0.12;
                        if (wantWood) {
                            w.veg[u.goal] = 0.15;
                            w.paint(u.goal, T.GRASS);
                            u.carry = 5 * eraBonus; u.carryType = 'wood';
                        } else {
                            const t = w.type[u.goal];
                            w.veg[u.goal] = Math.max(0, w.veg[u.goal] - (t === T.FARM ? 0.5 : 0.7));
                            w.classify(u.goal);
                            u.carry = FOOD_TILE[t] * 3 * eraBonus; u.carryType = 'food';
                        }
                        u.timer = 0; u.state = 'return'; u.goal = -1;
                    }
                } else this.moveTo(u, gx, gy, u.speed);
                break;
            }
            case 'return': {
                if (dist2(u.x, u.y, v.x + 0.5, v.y + 0.5) < 2.2) {
                    if (u.carryType === 'wood') v.wood += u.carry; else v.food += u.carry;
                    u.carry = 0; u.state = 'idle';
                } else this.moveTo(u, v.x + 0.5, v.y + 0.5, u.speed);
                break;
            }
            case 'build': {
                if (u.goal < 0) {
                    const spot = this.freeSpot(v, 6);
                    if (!spot) { u.state = 'idle'; break; }
                    u.goal = spot.i;
                    u.buildType = this.chooseBuilding(v);
                }
                const gx = u.goal % w.w + 0.5, gy = ((u.goal / w.w) | 0) + 0.5;
                if (dist2(u.x, u.y, gx, gy) < 0.8) {
                    u.timer++;
                    if (u.timer > 12) {
                        const type = u.buildType || 'house';
                        const def = BUILDINGS[type];
                        if (!w.build[u.goal] && v.food >= def.food && v.wood >= def.wood) {
                            const gxi = u.goal % w.w, gyi = (u.goal / w.w) | 0;
                            const t2 = w.type[u.goal];
                            if (type === 'farm') {
                                if (t2 === T.GRASS || t2 === T.FOREST || t2 === T.ASH || t2 === T.SAND) {
                                    v.food -= def.food;
                                    w.paint(u.goal, T.FARM);
                                    w.veg[u.goal] = 0.9;
                                    v.farmCount = (v.farmCount || 0) + 1;
                                }
                            } else {
                                v.food -= def.food; v.wood -= def.wood;
                                this.addBuilding(v, type, { i: u.goal, x: gxi, y: gyi });
                            }
                        }
                        u.timer = 0; u.goal = -1; u.state = 'idle';
                    }
                } else this.moveTo(u, gx, gy, u.speed);
                break;
            }
            default: u.state = 'idle';
        }
    }

    chooseBuilding(v) {
        const realm = this.realmById(v.realm);
        const era = realm ? realm.era : 0;
        const have = {};
        for (const bi of v.houses) { const b = this.buildings[bi]; if (b && !b.dead) have[b.type] = (have[b.type] || 0) + 1; }
        const cap = 3 + (have.house || 0) * 3;
        if ((v.farmCount || 0) < Math.min(12, 2 + v.pop / 2.5)) return 'farm';
        if (v.pop >= cap) return 'house';
        if (!(have.sawmill) && this.laws.forest === 1) return 'sawmill';
        if ((have.mine || 0) < 1 && this.nearTile(v, [T.HILL, T.MOUNT], 6)) return 'mine';
        if (era >= 1 && !(have.market)) return 'market';
        if (era >= 1 && !(have.temple) && this.believers > 4) return 'temple';
        if (era >= 2 && !(have.barracks) && realm && realm.wars.size) return 'barracks';
        return 'house';
    }

    nearTile(v, types, r) {
        const w = this.world;
        let found = false;
        w.forEachInRadius(v.x, v.y, r, j => { if (types.includes(w.type[j])) found = true; });
        return found;
    }

    stepSoldier(u, v) {
        const realm = this.realmById(u.realm);
        if (!realm || !realm.wars.size) { u.job = 'worker'; u.state = 'idle'; return; }
        let foe = null, best = 1e9;
        this.forEachNear(u.x, u.y, 6, o => {
            if (!o.alive || o.kind !== 'person') return;
            if (o.zombie) { if (dist2(o.x, o.y, u.x, u.y) < best) { best = dist2(o.x, o.y, u.x, u.y); foe = o; } return; }
            if (!o.realm || o.realm === u.realm || !realm.wars.has(o.realm)) return;
            const d = dist2(o.x, o.y, u.x, u.y);
            if (d < best) { best = d; foe = o; }
        });
        const power = u.str * (1 + realm.era * 0.15) * (this.hasBarracks(v) ? 1.25 : 1);
        if (foe) {
            if (best < 0.9) {
                foe.hp -= 2.5 * power;
                u.hp -= foe.str * (foe.job === 'soldier' ? 1.6 : 0.7);
                u.attackFx = 3;
                if (u.hp <= 0) { this.kill(u, 'war'); return; }
                if (foe.hp <= 0) { this.kill(foe, 'war'); u.kills = (u.kills || 0) + 1; }
            } else this.moveTo(u, foe.x, foe.y, u.speed * 1.1);
            return;
        }
        if (u.goal < 0 || this.tick % 40 === 0) {
            let target = null, bd = 1e9;
            for (const vv of this.villages) {
                if (vv.dead || !realm.wars.has(vv.realm)) continue;
                const d = dist2(vv.x, vv.y, u.x, u.y);
                if (d < bd) { bd = d; target = vv; }
            }
            u.goal = target ? target.id : -1;
        }
        const tv = u.goal > 0 ? this.villageById(u.goal) : null;
        if (!tv) { u.job = 'worker'; u.state = 'idle'; u.goal = -1; return; }
        if (dist2(u.x, u.y, tv.x + 0.5, tv.y + 0.5) < 2.5) {
            if (tv.houses.length && this.rng() < 0.18) {
                const bi = tv.houses[(this.rng() * tv.houses.length) | 0];
                const b = this.buildings[bi];
                if (b && !b.dead) {
                    b.hp -= 3 * power;
                    this.world.mark(b.i);
                    if (b.hp <= 0) this.destroyBuilding(bi);
                }
            }
            if (tv.gold > 0 && this.rng() < 0.05) {           // rabování
                const loot = Math.min(tv.gold, 2);
                tv.gold -= loot;
                if (realm) realm.gold += loot;
            }
        } else this.moveTo(u, tv.x + 0.5, tv.y + 0.5, u.speed);
    }

    hasBarracks(v) {
        if (!v) return false;
        for (const bi of v.houses) { const b = this.buildings[bi]; if (b && !b.dead && b.type === 'barracks') return true; }
        return false;
    }

    goodFood(i) {
        const t = this.world.type[i];
        return FOOD_TILE[t] > 0 && this.world.veg[i] > 0.25;
    }

    findFood(v, u) {
        const w = this.world;
        let best = -1, bestScore = -1;
        for (let k = 0; k < 26; k++) {
            const a = this.rng() * Math.PI * 2, d = 1 + this.rng() * 10;
            const x = clamp((v.x + Math.cos(a) * d) | 0, 0, w.w - 1);
            const y = clamp((v.y + Math.sin(a) * d) | 0, 0, w.h - 1);
            const i = y * w.w + x;
            if (!this.goodFood(i) || w.build[i]) continue;
            const score = FOOD_TILE[w.type[i]] * w.veg[i] * 10 - Math.sqrt(dist2(x, y, u.x, u.y)) * 0.35;
            if (score > bestScore) { bestScore = score; best = i; }
        }
        return best;
    }

    findForest(v, u) {
        const w = this.world;
        let best = -1, bd = 1e9;
        for (let k = 0; k < 26; k++) {
            const a = this.rng() * Math.PI * 2, d = 1 + this.rng() * 11;
            const x = clamp((v.x + Math.cos(a) * d) | 0, 0, w.w - 1);
            const y = clamp((v.y + Math.sin(a) * d) | 0, 0, w.h - 1);
            const i = y * w.w + x;
            if (w.type[i] !== T.FOREST || w.build[i]) continue;
            const dd = dist2(x, y, u.x, u.y);
            if (dd < bd) { bd = dd; best = i; }
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

    /* drak létá i nad vodou a horami */
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

    stayNear(u, x, y, r) {
        if (dist2(u.x, u.y, x, y) > r * r) this.moveTo(u, x + 0.5, y + 0.5, u.speed * 0.8);
        else this.wander(u);
    }

    /* ---------------- vesnice ---------------- */

    stepVillages() {
        const taxRate = [0, 0.15, 0.35][this.laws.tax];
        const birthLaw = this.laws.birth;
        const armyLaw = this.laws.army;

        for (const v of this.villages) {
            if (v.dead) continue;
            const realm = this.realmById(v.realm);
            if (!realm) { this.destroyVillage(v, true); continue; }

            let pop = 0, soldiers = 0;
            const workers = [];
            for (const u of this.units) {
                if (!u.alive || u.village !== v.id || u.zombie) continue;
                pop++;
                if (u.job === 'soldier') soldiers++;
                else if (u.job === 'worker') workers.push(u);
            }
            v.pop = pop; v.soldiers = soldiers;

            // budovy vyrábějí
            let houses = 0, temples = 0, markets = 0, mines = 0, mills = 0;
            for (const bi of v.houses) {
                const b = this.buildings[bi];
                if (!b || b.dead) continue;
                if (b.type === 'house' || b.type === 'castle') houses++;
                else if (b.type === 'temple') temples++;
                else if (b.type === 'market') markets++;
                else if (b.type === 'mine') mines++;
                else if (b.type === 'sawmill') mills++;
            }
            const era = realm.era;
            v.wood += mills * (2.4 + era * 0.4);
            v.gold += mines * (0.9 + era * 0.2) + markets * (0.6 + (this.laws.trade ? this.tradePartners(v) * 0.35 : 0));
            if (temples) {
                this.faith = Math.min(this.faithMax, this.faith + temples * 0.35);
                this.forEachNear(v.x, v.y, 8, o => { if (o.kind === 'person') o.faith = Math.min(1, o.faith + 0.01); });
            }
            if (this.laws.faith) this.forEachNear(v.x, v.y, 7, o => { if (o.kind === 'person') o.faith = Math.min(1, o.faith + 0.02); });

            // daně
            if (taxRate > 0) { const t = v.gold * taxRate; v.gold -= t; realm.gold += t; }

            // spokojenost
            let h = 0.45;
            h += v.food > pop * 2 ? 0.2 : -0.15;
            h += temples * 0.08;
            h += [0.12, 0, -0.16][this.laws.tax];
            h += birthLaw === 2 ? 0.06 : birthLaw === 1 ? -0.04 : 0;
            h += this.laws.faith ? -0.08 : 0;
            h += realm.wars.size ? -0.16 : 0.05;
            h += markets * 0.05;
            h += era * 0.03;
            v.happy = clamp(lerp(v.happy, clamp(h, 0, 1), 0.25), 0, 1);

            // narození
            const cap = 3 + houses * 3;
            const birthChance = 0.35 * RACES[realm.race].fert * [1, 1.5, 0.5][birthLaw] * (0.6 + v.happy);
            if (pop < cap && v.food > 14 && this.count < MAX_UNITS && this.rng() < birthChance) {
                v.food -= 6;
                const baby = this.spawnPerson(v.x + this.rng() - 0.5, v.y + this.rng() - 0.5, realm.race, realm, v);
                if (baby) baby.job = 'child';
            }

            // stavby
            const def = BUILDINGS[this.chooseBuilding(v)];
            if (v.food > def.food + 10 && v.wood >= def.wood && v.houses.length < 22) v.buildOrder = Math.min(3, (v.buildOrder || 0) + 1);

            // vojáci
            const wantSoldiers = realm.wars.size ? Math.round(pop * [0, 0.3, 0.55][armyLaw]) : 0;
            if (soldiers < wantSoldiers && workers.length > 1) {
                workers[0].job = 'soldier'; workers[0].state = 'idle'; workers[0].goal = -1;
            } else if (soldiers > wantSoldiers) {
                for (const u of this.units) if (u.alive && u.village === v.id && u.job === 'soldier') { u.job = 'worker'; u.state = 'idle'; break; }
            }

            // povstání nespokojených
            if (v.happy < 0.18 && pop >= 6 && realm.villages.length > 1 && this.rng() < 0.04) this.rebel(v, realm);

            // kolonizace
            if (pop >= 10 && v.food > 45 && v.houses.length >= 3 && this.villages.filter(x => !x.dead).length < MAX_VILLAGES) {
                const spot = this.colonySpot(v);
                if (spot) {
                    v.food -= 45;
                    const nv = this.foundVillage(spot.x, spot.y, realm);
                    if (nv) {
                        let moved = 0;
                        for (const u of this.units) {
                            if (moved >= 3) break;
                            if (u.alive && u.village === v.id && u.job === 'worker') { u.village = nv.id; u.state = 'idle'; moved++; }
                        }
                        this.log(`🏘️ ${realm.name}: založena vesnice ${nv.name}`, 'good');
                        this.territoryDirty = true;
                    }
                }
            }
            if (pop === 0 && this.rng() < 0.05) this.destroyVillage(v, false, 'empty');
        }
    }

    tradePartners(v) {
        let n = 0;
        const realm = this.realmById(v.realm);
        for (const o of this.villages) {
            if (o.dead || o.id === v.id) continue;
            if (dist2(o.x, o.y, v.x, v.y) > 900) continue;
            if (o.realm !== v.realm && realm && realm.wars.has(o.realm)) continue;
            n++;
        }
        return Math.min(4, n);
    }

    rebel(v, realm) {
        const nr = this.foundRealm(realm.race);
        realm.villages = realm.villages.filter(id => id !== v.id);
        if (realm.capital === v.id) realm.capital = realm.villages[0];
        v.realm = nr.id;
        nr.villages.push(v.id);
        nr.capital = v.id;
        nr.era = realm.era;
        for (const bi of v.houses) { const b = this.buildings[bi]; if (b) b.realm = nr.id; }
        for (const u of this.units) if (u.alive && u.village === v.id) u.realm = nr.id;
        v.happy = 0.6;
        nr.wars.add(realm.id); realm.wars.add(nr.id);
        this.territoryDirty = true;
        this.log(`🔥 Vesnice ${v.name} se vzbouřila a založila království ${nr.name}!`, 'bad');
    }

    colonySpot(v) {
        const w = this.world;
        for (let k = 0; k < 45; k++) {
            const a = this.rng() * Math.PI * 2, d = 11 + this.rng() * 18;
            const x = clamp((v.x + Math.cos(a) * d) | 0, 2, w.w - 3);
            const y = clamp((v.y + Math.sin(a) * d) | 0, 2, w.h - 3);
            const i = y * w.w + x;
            const t = w.type[i];
            if (t !== T.GRASS && t !== T.FOREST && t !== T.SAND && t !== T.HILL) continue;
            if (w.build[i]) continue;
            let tooClose = false;
            for (const o of this.villages) if (!o.dead && dist2(o.x, o.y, x, y) < 100) { tooClose = true; break; }
            if (tooClose) continue;
            if (w.owner[i] && w.owner[i] !== v.realm) continue;
            return { x, y, i };
        }
        return null;
    }

    /* ---------------- království ---------------- */

    stepRealms() {
        for (const r of this.realms) {
            if (r.dead) continue;
            let pop = 0;
            for (const u of this.units) if (u.alive && u.realm === r.id && !u.zombie) pop++;
            r.pop = pop;
            if (pop > r.peak) r.peak = pop;

            // věda a doby
            const sci = this.laws.science ? 1 : 0.3;
            let soldiers = 0;
            for (const u of this.units) if (u.alive && u.realm === r.id && u.job === 'soldier') soldiers++;
            const upkeep = soldiers * 0.25 + r.villages.length * 0.15;      // žold a správa říše
            r.gold = Math.max(0, r.gold - upkeep);
            const invest = Math.min(r.gold, pop * 0.12) * sci;              // co se dá do vědy
            r.gold -= invest;
            r.research += pop * 0.02 * sci + invest * 0.6;
            while (r.era < ERAS.length - 1 && r.research >= ERA_COST[r.era + 1]) {
                r.era++;
                this.log(`📜 ${r.name} vstoupili do doby: ${ERAS[r.era]}`, 'good');
            }

            // panovník stárne
            if (r.ruler) {
                r.ruler.age -= 10;
                if (r.ruler.age <= 0) this.newRuler(r, true);
            }
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
            const r = 6 + Math.min(11, v.houses.length * 1.2) + (realm ? realm.era : 0);
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
                    const peace = policy === 0 ? 0.9 : policy === 2 ? 0.12 : 0.3;
                    if (this.rng() < peace) this.makePeace(a, b);
                } else if (policy > 0) {
                    let hostile = (a.race === 'orc' || b.race === 'orc') ? 0.24 : 0.1;
                    if (policy === 2) hostile *= 2.5;
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
                if (v2 && dist2(v1.x, v1.y, v2.x, v2.y) < 1100) return true;
            }
        }
        return false;
    }

    declareWar(a, b) {
        if (!a || !b || a.dead || b.dead || a.wars.has(b.id)) return;
        a.wars.add(b.id); b.wars.add(a.id);
        this.stats.wars++;
        this.log(`⚔️ ${a.name} vyhlásili válku království ${b.name}`, 'bad');
    }

    makePeace(a, b) {
        if (!a || !b || !a.wars.has(b.id)) return;
        a.wars.delete(b.id); b.wars.delete(a.id);
        this.log(`🕊️ ${a.name} a ${b.name} uzavřeli mír`, 'good');
    }

    /* ---------------- dějiny a statistiky ---------------- */

    record() {
        const h = this.hist;
        let pop = 0, gold = 0, food = 0, wood = 0, wars = 0;
        for (const u of this.units) if (u.alive && u.kind === 'person' && !u.zombie) pop++;
        for (const v of this.villages) if (!v.dead) { gold += v.gold; food += v.food; wood += v.wood; }
        for (const r of this.realms) if (!r.dead) { gold += r.gold; wars += r.wars.size; }
        h.t.push(this.year);
        h.pop.push(pop);
        h.villages.push(this.villages.filter(v => !v.dead).length);
        h.gold.push(gold);
        h.food.push(food);
        h.wood.push(wood);
        h.wars.push(wars / 2);
        for (const r of this.realms) {
            if (!h.realms.has(r.id)) h.realms.set(r.id, { color: r.color, name: r.name, data: new Array(h.t.length - 1).fill(0) });
            h.realms.get(r.id).data.push(r.dead ? 0 : (r.pop || 0));
        }
        const len = h.t.length;
        for (const [, s] of h.realms) while (s.data.length < len) s.data.push(0);
        if (len > 300) {
            for (const k of ['t', 'pop', 'villages', 'gold', 'food', 'wood', 'wars']) h[k].shift();
            for (const [, s] of h.realms) s.data.shift();
        }
    }

    summary() {
        let people = 0, animals = 0, soldiers = 0, zombies = 0, sick = 0, gold = 0, food = 0, wood = 0;
        const byRace = {};
        for (const u of this.units) {
            if (!u.alive) continue;
            if (u.kind === 'person') {
                if (u.zombie) { zombies++; continue; }
                people++;
                byRace[u.race] = (byRace[u.race] || 0) + 1;
                if (u.job === 'soldier') soldiers++;
                if (u.sick) sick++;
            } else animals++;
        }
        const realms = this.realms.filter(r => !r.dead);
        for (const r of realms) gold += r.gold;
        for (const v of this.villages) if (!v.dead) { gold += v.gold; food += v.food; wood += v.wood; }
        return {
            people, animals, soldiers, zombies, sick, byRace, realms,
            villages: this.villages.filter(v => !v.dead).length,
            houses: this.buildings.filter(b => !b.dead).length,
            wars: realms.reduce((n, r) => n + r.wars.size, 0) / 2,
            gold: Math.round(gold), food: Math.round(food), wood: Math.round(wood)
        };
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Life, RACES, ANIMALS, LAWS, ERAS, BUILDINGS, setWorldLimits };
}
