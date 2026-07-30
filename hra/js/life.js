'use strict';
/* Panáčci, zvířata, vesnice a království. Simulace běží v pevných ticích (8× za vteřinu),
   vykreslování mezi tiky dopočítává mezipolohy – proto se nic netřese. */

const RACES = {
    human: { id: 'human', name: 'Lidé', emoji: '🧑', skin: '#f0c9a0', color: '#4f86e8', speed: 0.30, str: 1.0, fert: 1.0, maxAge: 1500, homes: [T.GRASS, T.FOREST, T.SAND, T.FARM, T.HILL] },
    orc: { id: 'orc', name: 'Orkové', emoji: '👹', skin: '#8bbf63', color: '#c8452f', speed: 0.31, str: 1.6, fert: 1.15, maxAge: 1100, homes: [T.GRASS, T.HILL, T.ASH, T.SAND] },
    elf: { id: 'elf', name: 'Elfové', emoji: '🧝', skin: '#f6e2c8', color: '#2fae86', speed: 0.36, str: 0.85, fert: 0.75, maxAge: 2800, homes: [T.FOREST, T.GRASS] },
    dwarf: { id: 'dwarf', name: 'Trpaslíci', emoji: '🧔', skin: '#dda879', color: '#d79a2b', speed: 0.25, str: 1.35, fert: 0.9, maxAge: 1900, homes: [T.HILL, T.MOUNT, T.SNOW, T.GRASS] }
};
const ANIMALS = {
    sheep: { id: 'sheep', name: 'Ovce', emoji: '🐑', color: '#efece2', speed: 0.14, str: 0.15, maxAge: 900, prey: true },
    wolf: { id: 'wolf', name: 'Vlci', emoji: '🐺', color: '#7b8090', speed: 0.34, str: 1.1, maxAge: 1100, prey: false }
};

const REALM_COLORS = ['#4f86e8', '#c8452f', '#2fae86', '#d79a2b', '#9b5de5', '#f15bb5', '#00bbf9', '#8ac926', '#ff924c', '#59c3c3'];

const MAX_UNITS = 1100;
const MAX_VILLAGES = 48;

class Life {
    constructor(world, seed) {
        this.world = world;
        this.rng = makeRNG((seed ^ 0x77aa11) >>> 0);
        this.units = [];
        this.free = [];
        this.villages = [];
        this.realms = [];
        this.buildings = [];
        this.nextRealm = 1;
        this.nextVillage = 1;
        this.nextUnit = 1;
        this.tick = 0;
        this.events = [];
        this.dirtyLog = false;
        this.fx = [];
        this.history = { pop: [], realms: [], villages: [] };
        this.stats = { born: 0, died: 0, killed: 0, peak: 0 };
        this.faith = 60;
        this.faithMax = 200;
        this.believers = 0;

        this.head = new Int32Array(world.n).fill(-1);
        this.next = new Int32Array(MAX_UNITS + 8).fill(-1);
    }

    /* ---------------- pomůcky ---------------- */

    log(text, kind = 'info') {
        this.events.push({ tick: this.tick, year: Math.floor(this.tick / 60), text, kind });
        if (this.events.length > 200) this.events.shift();
        this.dirtyLog = true;
    }

    realmById(id) { return this.realms.find(r => r.id === id && !r.dead) || null; }
    villageById(id) { return this.villages.find(v => v.id === id && !v.dead) || null; }

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

    spawnPerson(x, y, raceId, realm, village) {
        if (this.countAlive() >= MAX_UNITS) return null;
        const race = RACES[raceId];
        const p = personName(this.rng, raceId);
        const u = this.newUnit();
        Object.assign(u, {
            alive: true, kind: 'person', race: raceId, name: p.name, female: p.female,
            x, y, ox: x, oy: y, hp: 12 * race.str + 8, maxHp: 12 * race.str + 8,
            food: 0.8, age: 0, maxAge: race.maxAge * (0.8 + this.rng() * 0.4),
            realm: realm ? realm.id : 0, village: village ? village.id : 0,
            job: 'child', state: 'idle', timer: 0, carry: 0, goal: -1, phase: this.rng() * 6.28,
            faith: 0, str: race.str * (0.85 + this.rng() * 0.3), speed: race.speed * (0.9 + this.rng() * 0.2)
        });
        this.stats.born++;
        return u;
    }

    spawnAnimal(x, y, kindId) {
        if (this.countAlive() >= MAX_UNITS) return null;
        const a = ANIMALS[kindId];
        const u = this.newUnit();
        Object.assign(u, {
            alive: true, kind: 'animal', race: kindId, name: a.name, female: this.rng() < 0.5,
            x, y, ox: x, oy: y, hp: 8 * a.str + 4, maxHp: 8 * a.str + 4,
            food: 0.9, age: 0, maxAge: a.maxAge * (0.8 + this.rng() * 0.4),
            realm: 0, village: 0, job: 'wild', state: 'idle', timer: 0, carry: 0, goal: -1,
            phase: this.rng() * 6.28, faith: 0, str: a.str, speed: a.speed
        });
        return u;
    }

    newUnit() {
        if (this.free.length) {
            const k = this.free.pop();
            const u = this.units[k];
            u.uid = ++this.nextUnit;
            return u;
        }
        const u = { slot: this.units.length, uid: ++this.nextUnit };
        this.units.push(u);
        if (this.units.length > this.next.length) {
            const n = new Int32Array(this.units.length + 32).fill(-1);
            n.set(this.next); this.next = n;
        }
        return u;
    }

    kill(u, cause) {
        if (!u.alive) return;
        u.alive = false;
        this.free.push(u.slot);
        this.stats.died++;
        if (cause === 'god' || cause === 'war') this.stats.killed++;
    }

    countAlive() {
        let n = 0;
        for (const u of this.units) if (u.alive) n++;
        return n;
    }

    /* ---------------- království a vesnice ---------------- */

    foundRealm(raceId) {
        const id = this.nextRealm++;
        const realm = {
            id, name: realmName(this.rng), race: raceId,
            color: REALM_COLORS[(id - 1) % REALM_COLORS.length],
            villages: [], wars: new Set(), born: this.tick, dead: false, capital: 0
        };
        this.realms.push(realm);
        return realm;
    }

    foundVillage(x, y, realm) {
        if (this.villages.filter(v => !v.dead).length >= MAX_VILLAGES) return null;
        const v = {
            id: this.nextVillage++, name: villageName(this.rng), x: x | 0, y: y | 0,
            realm: realm.id, houses: [], food: 14, pop: 0, dead: false, born: this.tick, soldiers: 0
        };
        this.villages.push(v);
        realm.villages.push(v.id);
        if (!realm.capital) realm.capital = v.id;
        this.addBuilding(v, realm.capital === v.id ? 'castle' : 'house');
        return v;
    }

    /* najde volnou dlaždici pro stavbu poblíž vesnice */
    freeSpot(v, radius = 4) {
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
        const s = spot || this.freeSpot(v, type === 'castle' ? 2 : 5);
        if (!s) return null;
        const b = { i: s.i, x: s.x, y: s.y, type, village: v.id, realm: v.realm, hp: type === 'castle' ? 120 : 45, dead: false };
        this.buildings.push(b);
        this.world.build[s.i] = this.buildings.length;
        this.world.mark(s.i);
        v.houses.push(this.buildings.length - 1);
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
            if (!v.houses.length) this.destroyVillage(v, quiet);
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
                this.log(`👑 Království ${r.name} zaniklo`, 'bad');
                for (let i = 0; i < this.world.n; i++) if (this.world.owner[i] === r.id) this.world.owner[i] = 0;
                this.territoryDirty = true;
            } else if (r.capital === v.id) r.capital = r.villages[0];
        }
        for (const u of this.units) if (u.alive && u.village === v.id) { u.village = 0; u.job = 'wanderer'; }
    }

    /* založí národ: království + vesnice + první obyvatelé */
    seedTribe(x, y, raceId, count = 6) {
        const w = this.world;
        const i = this.tileAt(x, y);
        if (!w.walkable(i)) return null;
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
        this.log(`👑 Vzniklo království ${realm.name} (${RACES[raceId].name}) – hlavní vesnice ${v.name}`, 'good');
        return realm;
    }

    /* najde vhodné místo pro nový národ – souš, kterou má rasa ráda, daleko od cizích vesnic */
    homeSpot(raceId) {
        const w = this.world, race = RACES[raceId] || RACES.human;
        for (let k = 0; k < 600; k++) {
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
        this.faithMax = 200 + believers * 0.6;
        this.faith = Math.min(this.faithMax, this.faith + 0.05 + believers * 0.006);

        if (typeof stepHazards === 'function') stepHazards(this);
        if (this.tick % 10 === 0) this.stepVillages();
        if (this.tick % 40 === 0) this.updateTerritory();
        if (this.tick % 260 === 0) this.diplomacy();
        if (this.tick % 20 === 0) this.record();
    }

    /* ---------------- chování panáčka ---------------- */

    stepUnit(u) {
        const w = this.world;
        const i = this.tileAt(u.x, u.y);

        // prostředí
        if (w.lava[i]) { this.kill(u, 'lava'); return; }
        if (w.isWater(i)) { u.hp -= 3; if (u.hp <= 0) { this.kill(u, 'voda'); return; } }
        if (w.fire[i]) { u.hp -= 2; if (u.hp <= 0) { this.kill(u, 'oheň'); return; } }

        u.age++;
        if (u.age > u.maxAge) { this.kill(u, 'stáří'); return; }
        u.food -= u.kind === 'person' ? 0.0016 : 0.0012;
        if (u.food <= 0) {
            u.food = 0; u.hp -= 0.15;
            if (u.hp <= 0) { this.kill(u, 'hlad'); return; }
        } else if (u.hp < u.maxHp) u.hp = Math.min(u.maxHp, u.hp + 0.05);
        if (u.faith > 0) u.faith = Math.max(0, u.faith - 0.0004);

        if (u.kind === 'animal') this.stepAnimal(u, i);
        else this.stepPerson(u, i);
    }

    stepAnimal(u, i) {
        const w = this.world, a = ANIMALS[u.race];
        // mláďata
        if (u.food > 0.8 && u.age > 150 && this.tick % 8 === 0 && (this.animalCount || 0) < 150 && this.countAlive() < MAX_UNITS) {
            let near = 0;
            this.forEachNear(u.x, u.y, 6, o => { if (o.race === u.race) near++; });
            const limit = a.prey ? 7 : 3;
            if (near < limit && this.rng() < (a.prey ? 0.05 : 0.02)) {
                const baby = this.spawnAnimal(u.x + this.rng() - 0.5, u.y + this.rng() - 0.5, u.race);
                if (baby) { u.food -= 0.3; baby.food = 0.7; }
            }
        }
        if (a.prey) {
            if (u.food < 0.9 && w.veg[i] > 0.12 && !w.isWater(i)) {
                w.veg[i] -= 0.015; u.food = Math.min(1, u.food + 0.02);
                w.classify(i);
                return;                                   // pase se, nikam nejde
            }
            // vlk poblíž? uteč
            let danger = null;
            this.forEachNear(u.x, u.y, 5, o => { if (o.race === 'wolf') { danger = o; return false; } });
            if (danger) {
                this.moveDir(u, u.x - danger.x, u.y - danger.y, u.speed * 1.3);
                return;
            }
        } else {
            // vlk loví hlavně zvěř; na člověka si troufne, jen když není nic lepšího – a ten se brání
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
                    if (human) {
                        u.hp -= prey.str * 2.2;                       // vesničan se ubrání
                        if (u.hp <= 0) { this.kill(u, 'obrana'); return; }
                    }
                    if (prey.hp <= 0) { this.kill(prey, 'lov'); u.food = 1; }
                } else this.moveTo(u, prey.x, prey.y, u.speed);
                return;
            }
        }
        this.wander(u);
    }

    stepPerson(u, i) {
        const w = this.world;
        const v = u.village ? this.villageById(u.village) : null;
        if (!v && u.job !== 'wanderer') { u.job = 'wanderer'; u.village = 0; }

        // dospívání
        if (u.job === 'child') {
            if (u.age > 240) { u.job = 'worker'; u.state = 'idle'; }
            if (v) this.stayNear(u, v.x, v.y, 3);
            return;
        }

        if (u.job === 'soldier') { this.stepSoldier(u, v); return; }

        if (u.job === 'wanderer') {
            // hledá nový domov: přidá se k nejbližší vesnici svého rodu
            if (this.tick % 20 === 0) {
                let best = null, bd = 900;
                for (const vv of this.villages) {
                    if (vv.dead) continue;
                    const r = this.realmById(vv.realm);
                    if (!r || r.race !== u.race) continue;
                    const d = dist2(vv.x, vv.y, u.x, u.y);
                    if (d < bd) { bd = d; best = vv; }
                }
                if (best) { u.village = best.id; u.realm = best.realm; u.job = 'worker'; }
            }
            this.wander(u);
            return;
        }

        if (!v) { this.wander(u); return; }

        // hlad: doma se najím
        if (u.food < 0.35 && v.food > 1 && dist2(u.x, u.y, v.x, v.y) < 9) {
            v.food -= 1; u.food = 1;
            return;
        }

        switch (u.state) {
            case 'idle': {
                if (u.carry > 0) { u.state = 'return'; break; }
                if (v.buildOrder > 0) { u.state = 'build'; u.goal = -1; v.buildOrder--; break; }
                u.state = 'gather'; u.goal = -1;
                break;
            }
            case 'gather': {
                if (u.goal < 0 || !this.goodFood(u.goal)) {
                    u.goal = this.findFood(v, u);
                    if (u.goal < 0) { this.stayNear(u, v.x, v.y, 5); return; }
                }
                const gx = u.goal % w.w + 0.5, gy = ((u.goal / w.w) | 0) + 0.5;
                if (dist2(u.x, u.y, gx, gy) < 0.7) {
                    u.timer++;
                    if (u.timer > 6) {
                        const t = w.type[u.goal];
                        const yield_ = FOOD_TILE[t] * 3;
                        w.veg[u.goal] = Math.max(0, w.veg[u.goal] - (t === T.FARM ? 0.5 : 0.7));
                        w.classify(u.goal);
                        u.carry = yield_;
                        u.timer = 0; u.state = 'return'; u.goal = -1;
                    }
                } else this.moveTo(u, gx, gy, u.speed);
                break;
            }
            case 'return': {
                if (dist2(u.x, u.y, v.x + 0.5, v.y + 0.5) < 2.2) {
                    v.food += u.carry; u.carry = 0; u.state = 'idle';
                } else this.moveTo(u, v.x + 0.5, v.y + 0.5, u.speed);
                break;
            }
            case 'build': {
                if (u.goal < 0) {
                    const spot = this.freeSpot(v, 5);
                    if (!spot) { u.state = 'idle'; break; }
                    u.goal = spot.i;
                }
                const gx = u.goal % w.w + 0.5, gy = ((u.goal / w.w) | 0) + 0.5;
                if (dist2(u.x, u.y, gx, gy) < 0.8) {
                    u.timer++;
                    if (u.timer > 14) {
                        if (!w.build[u.goal] && v.food >= 8) {
                            v.food -= 8;
                            const gxi = u.goal % w.w, gyi = (u.goal / w.w) | 0;
                            if (this.rng() < 0.35 && (w.type[u.goal] === T.GRASS || w.type[u.goal] === T.FOREST)) {
                                w.paint(u.goal, T.FARM);       // pole kolem vesnice
                                w.veg[u.goal] = 0.9;
                            } else {
                                this.addBuilding(v, 'house', { i: u.goal, x: gxi, y: gyi });
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

    stepSoldier(u, v) {
        const realm = this.realmById(u.realm);
        if (!realm || !realm.wars.size) {
            u.job = 'worker'; u.state = 'idle';
            return;
        }
        // nepřítel na dosah?
        let foe = null, best = 1e9;
        this.forEachNear(u.x, u.y, 6, o => {
            if (!o.alive || o.kind !== 'person') return;
            if (!o.realm || o.realm === u.realm || !realm.wars.has(o.realm)) return;
            const d = dist2(o.x, o.y, u.x, u.y);
            if (d < best) { best = d; foe = o; }
        });
        if (foe) {
            if (best < 0.9) {
                foe.hp -= 2.5 * u.str;
                u.hp -= foe.str * (foe.job === 'soldier' ? 1.6 : 0.7);   // i dělník se brání
                u.attackFx = 3;
                if (u.hp <= 0) { this.kill(u, 'war'); return; }
                if (foe.hp <= 0) { this.kill(foe, 'war'); u.kills = (u.kills || 0) + 1; }
            } else this.moveTo(u, foe.x, foe.y, u.speed * 1.1);
            return;
        }
        // jinak pochoduje na nejbližší nepřátelskou vesnici
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
            // bourá stavby
            if (tv.houses.length && this.rng() < 0.18) {
                const bi = tv.houses[(this.rng() * tv.houses.length) | 0];
                const b = this.buildings[bi];
                if (b && !b.dead) {
                    b.hp -= 3 * u.str;
                    this.world.mark(b.i);
                    if (b.hp <= 0) this.destroyBuilding(bi);
                }
            }
        } else this.moveTo(u, tv.x + 0.5, tv.y + 0.5, u.speed);
    }

    goodFood(i) {
        const t = this.world.type[i];
        return FOOD_TILE[t] > 0 && this.world.veg[i] > 0.25;
    }

    findFood(v, u) {
        const w = this.world;
        let best = -1, bestScore = -1;
        for (let k = 0; k < 26; k++) {
            const a = this.rng() * Math.PI * 2, d = 1 + this.rng() * 9;
            const x = clamp((v.x + Math.cos(a) * d) | 0, 0, w.w - 1);
            const y = clamp((v.y + Math.sin(a) * d) | 0, 0, w.h - 1);
            const i = y * w.w + x;
            if (!this.goodFood(i) || w.build[i]) continue;
            const score = FOOD_TILE[w.type[i]] * w.veg[i] * 10 - Math.sqrt(dist2(x, y, u.x, u.y)) * 0.35;
            if (score > bestScore) { bestScore = score; best = i; }
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

    wander(u) {
        if (this.rng() < 0.06 || u.wx === undefined) {
            const a = this.rng() * Math.PI * 2;
            u.wx = Math.cos(a); u.wy = Math.sin(a);
        }
        this.moveDir(u, u.wx, u.wy, u.speed * 0.55);
    }

    stayNear(u, x, y, r) {
        if (dist2(u.x, u.y, x, y) > r * r) this.moveTo(u, x + 0.5, y + 0.5, u.speed * 0.8);
        else this.wander(u);
    }

    /* ---------------- vesnice ---------------- */

    stepVillages() {
        for (const v of this.villages) {
            if (v.dead) continue;
            const realm = this.realmById(v.realm);
            if (!realm) { this.destroyVillage(v, true); continue; }

            let pop = 0, soldiers = 0, workers = [];
            for (const u of this.units) {
                if (!u.alive || u.village !== v.id) continue;
                pop++;
                if (u.job === 'soldier') soldiers++;
                else if (u.job === 'worker') workers.push(u);
            }
            v.pop = pop; v.soldiers = soldiers;
            const cap = 3 + v.houses.length * 3;

            // narození
            if (pop < cap && v.food > 16 && this.countAlive() < MAX_UNITS) {
                const fert = RACES[realm.race].fert;
                if (this.rng() < 0.35 * fert) {
                    v.food -= 8;
                    const baby = this.spawnPerson(v.x + this.rng() - 0.5, v.y + this.rng() - 0.5, realm.race, realm, v);
                    if (baby) baby.job = 'child';
                }
            }
            // stavba
            if (v.food > 22 && v.houses.length < 14 && pop >= v.houses.length * 2) v.buildOrder = (v.buildOrder || 0) + 1;

            // vojáci ve válce
            const wantSoldiers = realm.wars.size ? Math.min(6, 1 + Math.floor(pop * 0.35)) : 0;
            if (soldiers < wantSoldiers && workers.length > 1) {
                const u = workers[0];
                u.job = 'soldier'; u.state = 'idle'; u.goal = -1;
            } else if (!realm.wars.size && soldiers > 0) {
                for (const u of this.units) if (u.alive && u.village === v.id && u.job === 'soldier') { u.job = 'worker'; u.state = 'idle'; break; }
            }

            // kolonizace – nová vesnice opodál
            if (pop >= 12 && v.food > 60 && v.houses.length >= 4 && this.villages.filter(x => !x.dead).length < MAX_VILLAGES) {
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

    colonySpot(v) {
        const w = this.world;
        for (let k = 0; k < 30; k++) {
            const a = this.rng() * Math.PI * 2, d = 12 + this.rng() * 12;
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

    /* ---------------- území a diplomacie ---------------- */

    updateTerritory() {
        const w = this.world;
        const dist = this.terrDist || (this.terrDist = new Float32Array(w.n));
        dist.fill(1e9);
        const prev = this.prevOwner || (this.prevOwner = new Int16Array(w.n));
        prev.set(w.owner);
        w.owner.fill(0);
        for (const v of this.villages) {
            if (v.dead) continue;
            const r = 6 + Math.min(9, v.houses.length * 1.2);
            w.forEachInRadius(v.x, v.y, r, (i, x, y, t) => {
                if (w.type[i] === T.DEEP) return;
                const d = t;
                if (d < dist[i]) { dist[i] = d; w.owner[i] = v.realm; }
            });
        }
        for (let i = 0; i < w.n; i++) if (prev[i] !== w.owner[i]) { this.territoryDirty = true; return; }
    }

    diplomacy() {
        const live = this.realms.filter(r => !r.dead);
        for (const a of live) {
            for (const b of live) {
                if (a.id >= b.id) continue;
                const touching = this.realmsTouch(a, b);
                if (!touching) continue;
                if (a.wars.has(b.id)) {
                    if (this.rng() < 0.3) {                      // občas se uzavře mír
                        a.wars.delete(b.id); b.wars.delete(a.id);
                        this.log(`🕊️ ${a.name} a ${b.name} uzavřeli mír`, 'good');
                    }
                } else {
                    const hostile = (a.race === 'orc' || b.race === 'orc') ? 0.24 : 0.1;
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
                if (v2 && dist2(v1.x, v1.y, v2.x, v2.y) < 900) return true;
            }
        }
        return false;
    }

    declareWar(a, b) {
        if (!a || !b || a.dead || b.dead || a.wars.has(b.id)) return;
        a.wars.add(b.id); b.wars.add(a.id);
        this.log(`⚔️ ${a.name} vyhlásili válku království ${b.name}`, 'bad');
    }

    makePeace(a, b) {
        if (!a || !b) return;
        a.wars.delete(b.id); b.wars.delete(a.id);
        this.log(`🕊️ ${a.name} a ${b.name} uzavřeli mír`, 'good');
    }

    /* ---------------- statistiky ---------------- */

    record() {
        let pop = 0;
        for (const u of this.units) if (u.alive && u.kind === 'person') pop++;
        const h = this.history;
        h.pop.push(pop);
        h.realms.push(this.realms.filter(r => !r.dead).length);
        h.villages.push(this.villages.filter(v => !v.dead).length);
        for (const k in h) if (h[k].length > 260) h[k].shift();
        if (pop > this.stats.peak) this.stats.peak = pop;
    }

    summary() {
        let people = 0, animals = 0, soldiers = 0;
        const byRace = {};
        for (const u of this.units) {
            if (!u.alive) continue;
            if (u.kind === 'person') {
                people++;
                byRace[u.race] = (byRace[u.race] || 0) + 1;
                if (u.job === 'soldier') soldiers++;
            } else animals++;
        }
        return {
            people, animals, soldiers, byRace,
            realms: this.realms.filter(r => !r.dead),
            villages: this.villages.filter(v => !v.dead).length,
            houses: this.buildings.filter(b => !b.dead).length,
            wars: this.realms.reduce((n, r) => n + (r.dead ? 0 : r.wars.size), 0) / 2
        };
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Life, RACES, ANIMALS, MAX_UNITS };
}
