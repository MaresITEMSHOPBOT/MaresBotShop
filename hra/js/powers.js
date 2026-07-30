'use strict';
/* Nástroje hráče: štětce na krajinu, sázení národů a zvířat, katastrofy a zázraky. */

function fx(life, o) { life.fx.push(o); }

const TOOLS = [
    /* ---------- ruka ---------- */
    { id: 'hand', group: 'hand', name: 'Ruka', emoji: '🖐️', cost: 0, desc: 'Klikni na panáčka, vesnici nebo krajinu a prohlédni si je.' },

    /* ---------- krajina ---------- */
    { id: 'water', group: 'land', name: 'Voda', emoji: '🌊', cost: 0, hold: true, tile: T.WATER, desc: 'Maluje moře a jezera. Kdo neumí plavat, utopí se.' },
    { id: 'sand', group: 'land', name: 'Písek', emoji: '🏜️', cost: 0, hold: true, tile: T.SAND, desc: 'Pláže a pouště.' },
    { id: 'grass', group: 'land', name: 'Louka', emoji: '🌿', cost: 0, hold: true, tile: T.GRASS, desc: 'Úrodná tráva – základ pro vesnice a stáda.' },
    { id: 'forest', group: 'land', name: 'Les', emoji: '🌲', cost: 0, hold: true, tile: T.FOREST, desc: 'Les dává nejvíc jídla. Taky ale nejlíp hoří.' },
    { id: 'hill', group: 'land', name: 'Kopce', emoji: '🌄', cost: 0, hold: true, tile: T.HILL, desc: 'Kopce – domov trpaslíků.' },
    { id: 'mount', group: 'land', name: 'Hory', emoji: '⛰️', cost: 0, hold: true, tile: T.MOUNT, desc: 'Neprůchodné hory. Dají se z nich stavět hranice mezi říšemi.' },
    { id: 'snow', group: 'land', name: 'Sníh', emoji: '❄️', cost: 0, hold: true, tile: T.SNOW, desc: 'Ledová pustina.' },

    /* ---------- život ---------- */
    {
        id: 'human', group: 'life', name: 'Lidé', emoji: '🧑', cost: 25, spawnRace: 'human',
        desc: 'Založí nové království lidí. Šikovní stavitelé, rychle se množí.'
    },
    {
        id: 'orc', group: 'life', name: 'Orkové', emoji: '👹', cost: 25, spawnRace: 'orc',
        desc: 'Silní a hádaví. Válku vyhlásí skoro každému sousedovi.'
    },
    {
        id: 'elf', group: 'life', name: 'Elfové', emoji: '🧝', cost: 25, spawnRace: 'elf',
        desc: 'Žijí dlouho, množí se pomalu, milují lesy.'
    },
    {
        id: 'dwarf', group: 'life', name: 'Trpaslíci', emoji: '🧔', cost: 25, spawnRace: 'dwarf',
        desc: 'Houževnatí horalé. Snesou zimu i kámen.'
    },
    { id: 'sheep', group: 'life', name: 'Ovce', emoji: '🐑', cost: 4, spawnAnimal: 'sheep', desc: 'Pasou se na trávě. Potrava pro vlky.' },
    { id: 'wolf', group: 'life', name: 'Vlci', emoji: '🐺', cost: 6, spawnAnimal: 'wolf', desc: 'Loví ovce i osamělé vesničany.' },

    /* ---------- zázraky ---------- */
    {
        id: 'bless', group: 'bless', name: 'Požehnání', emoji: '✨', cost: 6, hold: true,
        desc: 'Uzdraví a nasytí panáčky, zúrodní půdu. Kdo tě zažil, začne v tebe věřit – a víra je tvá mana.'
    },
    {
        id: 'rain', group: 'bless', name: 'Déšť', emoji: '🌧️', cost: 5, hold: true,
        desc: 'Uhasí požáry a zavlaží krajinu, takže rychleji zaroste.'
    },
    {
        id: 'war', group: 'bless', name: 'Válka', emoji: '⚔️', cost: 20,
        desc: 'Klikni na území království – vyhlásí válku nejbližšímu sousedovi.'
    },
    {
        id: 'peace', group: 'bless', name: 'Mír', emoji: '🕊️', cost: 15,
        desc: 'Klikni na území království – ukončí všechny jeho války.'
    },

    /* ---------- zkáza ---------- */
    { id: 'lightning', group: 'doom', name: 'Blesk', emoji: '⚡', cost: 4, desc: 'Zabije, koho trefí, a zapálí porost.' },
    { id: 'fire', group: 'doom', name: 'Požár', emoji: '🔥', cost: 6, hold: true, desc: 'Oheň se sám šíří po lese a trávě. Zastaví ho voda, skála nebo déšť.' },
    { id: 'bomb', group: 'doom', name: 'Bomba', emoji: '💣', cost: 14, desc: 'Výbuch: spáleniště, mrtví a zbořené domy.' },
    { id: 'meteor', group: 'doom', name: 'Meteorit', emoji: '☄️', cost: 45, desc: 'Padá z nebe. Po dopadu kráter, ohnivá bouře a jezero lávy.' },
    { id: 'volcano', group: 'doom', name: 'Sopka', emoji: '🌋', cost: 35, desc: 'Otevře sopouch, ze kterého teče láva po svahu dolů.' },
    { id: 'flood', group: 'doom', name: 'Povodeň', emoji: '💧', cost: 18, hold: true, desc: 'Vylije vodu, která teče podle terénu a topí, co jí stojí v cestě.' },
    { id: 'plague', group: 'doom', name: 'Mor', emoji: '🦠', cost: 22, desc: 'Nemoc, která oslabí a postupně vybíjí obyvatele okolí.' },
    { id: 'smite', group: 'doom', name: 'Boží hněv', emoji: '☠️', cost: 10, hold: true, desc: 'Přesná poprava všech v okruhu.' }
];

const TOOL_MAP = {};
for (const t of TOOLS) TOOL_MAP[t.id] = t;

/* ------------------------------------------------------------------ */

function applyTool(life, id, wx, wy, radius) {
    const tool = TOOL_MAP[id];
    if (!tool) return false;
    if (tool.cost > life.faith) return 'faith';
    const w = life.world;
    const rng = life.rng;
    const x = clamp(wx, 0, w.w - 1), y = clamp(wy, 0, w.h - 1);
    const i = life.tileAt(x, y);

    /* --- štětce na krajinu --- */
    if (tool.tile !== undefined) {
        w.forEachInRadius(x, y, radius, (j) => {
            if (w.build[j]) {
                const b = life.buildings[w.build[j] - 1];
                if (b && !b.dead && (tool.tile === T.WATER || tool.tile === T.MOUNT)) life.destroyBuilding(w.build[j] - 1);
                else return;
            }
            w.paint(j, tool.tile);
            if (tool.tile === T.WATER) {
                life.forEachNear(j % w.w + 0.5, ((j / w.w) | 0) + 0.5, 0.9, u => life.kill(u, 'voda'));
            }
        });
        return true;
    }

    /* --- nové národy a zvířata --- */
    if (tool.spawnRace) {
        if (!w.walkable(i)) return 'blocked';
        const realm = life.seedTribe(x, y, tool.spawnRace, 6);
        if (!realm) return 'blocked';
        fx(life, { type: 'sparkle', x, y, r: 3, life: 26, max: 26, color: realm.color });
        life.faith -= tool.cost;
        return true;
    }
    if (tool.spawnAnimal) {
        let placed = 0;
        for (let k = 0; k < 20 && placed < 5; k++) {
            const a = rng() * Math.PI * 2, d = rng() * Math.max(1, radius * 0.6);
            const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
            if (!life.walkableAt(px, py)) continue;
            if (life.spawnAnimal(px, py, tool.spawnAnimal)) placed++;
        }
        life.faith -= tool.cost;
        return placed > 0;
    }

    /* --- zázraky --- */
    switch (id) {
        case 'bless': {
            w.forEachInRadius(x, y, radius, j => {
                w.moist[j] = Math.min(1, w.moist[j] + 0.06);
                if (w.veg[j] < 1) { w.veg[j] = Math.min(1, w.veg[j] + 0.25); w.classify(j); }
                if (w.fire[j]) { w.fire[j] = 0; w.fireSet.delete(j); w.classify(j); }
            });
            life.forEachNear(x, y, radius, u => {
                u.hp = u.maxHp; u.food = 1;
                if (u.kind === 'person') u.faith = Math.min(1, u.faith + 0.5);
            });
            fx(life, { type: 'sparkle', x, y, r: radius, life: 24, max: 24, color: '#ffe9a8' });
            life.faith -= tool.cost;
            return true;
        }
        case 'rain': {
            w.forEachInRadius(x, y, radius, j => {
                w.moist[j] = Math.min(1, w.moist[j] + 0.14);
                if (w.fire[j]) { w.fire[j] = 0; w.fireSet.delete(j); w.classify(j); }
                if (w.veg[j] < 1) { w.veg[j] = Math.min(1, w.veg[j] + 0.06); w.classify(j); }
            });
            fx(life, { type: 'rain', x, y, r: radius, life: 90, max: 90 });
            life.faith -= tool.cost;
            return true;
        }
        case 'war': {
            const realm = life.realmById(w.owner[i]);
            if (!realm) return 'nothing';
            let target = null, bd = 1e9;
            for (const other of life.realms) {
                if (other.dead || other.id === realm.id) continue;
                for (const vid of other.villages) {
                    const v = life.villageById(vid);
                    if (!v) continue;
                    const d = dist2(v.x, v.y, x, y);
                    if (d < bd) { bd = d; target = other; }
                }
            }
            if (!target) return 'nothing';
            life.declareWar(realm, target);
            life.faith -= tool.cost;
            return true;
        }
        case 'peace': {
            const realm = life.realmById(w.owner[i]);
            if (!realm || !realm.wars.size) return 'nothing';
            for (const id2 of [...realm.wars]) life.makePeace(realm, life.realmById(id2));
            life.faith -= tool.cost;
            return true;
        }
    }

    /* --- katastrofy --- */
    switch (id) {
        case 'lightning': {
            life.forEachNear(x, y, Math.max(1, radius * 0.4), u => life.kill(u, 'god'));
            w.forEachInRadius(x, y, Math.max(1, radius * 0.4), j => { if (rng() < 0.6) w.ignite(j); });
            fx(life, { type: 'bolt', x, y, life: 14, max: 14 });
            break;
        }
        case 'fire': {
            w.forEachInRadius(x, y, radius, j => { if (rng() < 0.7) w.ignite(j); });
            break;
        }
        case 'bomb': {
            explode(life, x, y, radius, 1);
            break;
        }
        case 'smite': {
            life.forEachNear(x, y, radius, u => life.kill(u, 'god'));
            fx(life, { type: 'beam', x, y, r: radius, life: 18, max: 18 });
            break;
        }
        case 'plague': {
            let n = 0;
            life.forEachNear(x, y, radius, u => { if (u.kind === 'person') { u.sick = 500; n++; } });
            if (n) life.log(`🦠 V okolí vypukl mor – nakaženo ${n} obyvatel`, 'bad');
            fx(life, { type: 'sparkle', x, y, r: radius, life: 30, max: 30, color: '#9ee86a' });
            break;
        }
        case 'flood': {
            w.forEachInRadius(x, y, radius, (j, jx, jy, t) => w.addWater(j, 0.5 * (1 - t * 0.6)));
            fx(life, { type: 'splash', x, y, r: radius, life: 20, max: 20 });
            break;
        }
        case 'volcano': {
            w.forEachInRadius(x, y, Math.max(1, radius * 0.35), j => w.addLava(j));
            life.volcanoes = life.volcanoes || [];
            life.volcanoes.push({ x: x | 0, y: y | 0, life: 200 });
            life.log('🌋 Probudila se sopka', 'bad');
            break;
        }
        case 'meteor': {
            life.meteors = life.meteors || [];
            life.meteors.push({ x, y, r: radius * 1.6, life: 40, max: 40 });
            fx(life, { type: 'meteor', x, y, life: 40, max: 40 });
            break;
        }
        default: return false;
    }
    life.faith -= tool.cost;
    life.fearShown = true;
    return true;
}

function explode(life, x, y, radius, power) {
    const w = life.world;
    w.forEachInRadius(x, y, radius, (j, jx, jy, t) => {
        if (w.build[j]) life.destroyBuilding(w.build[j] - 1);
        if (t < 0.55) {
            w.veg[j] = 0;
            if (!w.isWater(j)) w.paint(j, T.ASH);
        } else if (life.rng() < 0.5) w.ignite(j);
    });
    life.forEachNear(x, y, radius * 1.1, u => life.kill(u, 'god'));
    fx(life, { type: 'boom', x, y, r: radius * 1.4, life: 26, max: 26, power });
}

/* meteority a sopky dobíhají samy */
function stepHazards(life) {
    const w = life.world;
    if (life.meteors) {
        for (let k = life.meteors.length - 1; k >= 0; k--) {
            const m = life.meteors[k];
            if (--m.life <= 0) {
                explode(life, m.x, m.y, m.r, 2);
                w.forEachInRadius(m.x, m.y, m.r * 0.35, j => w.addLava(j));
                w.forEachInRadius(m.x, m.y, m.r * 2, j => { if (life.rng() < 0.35) w.ignite(j); });
                fx(life, { type: 'shock', x: m.x, y: m.y, r: m.r * 3.5, life: 34, max: 34 });
                life.log('☄️ Dopadl meteorit', 'bad');
                life.meteors.splice(k, 1);
            }
        }
    }
    if (life.volcanoes) {
        for (let k = life.volcanoes.length - 1; k >= 0; k--) {
            const v = life.volcanoes[k];
            v.life--;
            if (life.rng() < 0.4) {
                const a = life.rng() * Math.PI * 2, d = life.rng() * 2.5;
                const px = clamp((v.x + Math.cos(a) * d) | 0, 0, w.w - 1);
                const py = clamp((v.y + Math.sin(a) * d) | 0, 0, w.h - 1);
                w.addLava(py * w.w + px);
            }
            if (v.life <= 0) life.volcanoes.splice(k, 1);
        }
    }
    // nemoc
    if (life.tick % 8 === 0) {
        for (const u of life.units) {
            if (!u.alive || !u.sick) continue;
            u.sick--;
            u.hp -= 0.5;
            if (life.rng() < 0.05) life.forEachNear(u.x, u.y, 1.6, o => { if (o.kind === 'person' && !o.sick && life.rng() < 0.3) o.sick = 400; });
            if (u.hp <= 0) life.kill(u, 'mor');
        }
    }
}

if (typeof module !== 'undefined') {
    module.exports = { TOOLS, TOOL_MAP, applyTool, stepHazards };
}
