'use strict';
/* Nástroje hráče: štětce na krajinu, sázení národů, dary, zázraky a katastrofy. */

function fx(life, o) { life.fx.push(o); }
function fmtNum(n) { return typeof fmt === 'function' ? fmt(n) : Math.round(n); }

const TOOLS = [
    { id: 'hand', group: 'hand', name: 'Ruka', emoji: '🖐️', cost: 0, desc: 'Klikni na panáčka, vesnici nebo krajinu a prohlédni si je.' },

    /* ---------- krajina ---------- */
    { id: 'water', group: 'land', name: 'Voda', emoji: '🌊', cost: 0, hold: true, tile: T.WATER, desc: 'Maluje moře a jezera. Kdo neumí plavat, utopí se.' },
    { id: 'sand', group: 'land', name: 'Písek', emoji: '🏜️', cost: 0, hold: true, tile: T.SAND, desc: 'Pláže a pouště.' },
    { id: 'grass', group: 'land', name: 'Louka', emoji: '🌿', cost: 0, hold: true, tile: T.GRASS, desc: 'Úrodná tráva – základ pro vesnice a stáda.' },
    { id: 'forest', group: 'land', name: 'Les', emoji: '🌲', cost: 0, hold: true, tile: T.FOREST, desc: 'Les dává nejvíc jídla a dřeva. Taky ale nejlíp hoří.' },
    { id: 'hill', group: 'land', name: 'Kopce', emoji: '🌄', cost: 0, hold: true, tile: T.HILL, desc: 'Kopce – domov trpaslíků a místo pro doly.' },
    { id: 'mount', group: 'land', name: 'Hory', emoji: '⛰️', cost: 0, hold: true, tile: T.MOUNT, desc: 'Neprůchodné hory. Dělají se z nich přirozené hranice.' },
    { id: 'snow', group: 'land', name: 'Sníh', emoji: '❄️', cost: 0, hold: true, tile: T.SNOW, desc: 'Ledová pustina.' },
    { id: 'farmland', group: 'land', name: 'Pole', emoji: '🌾', cost: 0, hold: true, tile: T.FARM, desc: 'Nejvydatnější zdroj jídla. Vesnice si je normálně staví samy.' },

    /* ---------- život ---------- */
    { id: 'human', group: 'life', name: 'Lidé', emoji: '🧑', cost: 25, spawnRace: 'human', desc: 'Založí království lidí. Šikovní stavitelé, rychle se množí.' },
    { id: 'orc', group: 'life', name: 'Orkové', emoji: '👹', cost: 25, spawnRace: 'orc', desc: 'Silní a hádaví. Válku vyhlásí skoro každému sousedovi.' },
    { id: 'elf', group: 'life', name: 'Elfové', emoji: '🧝', cost: 25, spawnRace: 'elf', desc: 'Žijí dlouho, množí se pomalu, milují lesy.' },
    { id: 'dwarf', group: 'life', name: 'Trpaslíci', emoji: '🧔', cost: 25, spawnRace: 'dwarf', desc: 'Houževnatí horalé. Nejlepší dělníci, snesou zimu i kámen.' },
    { id: 'sheep', group: 'life', name: 'Ovce', emoji: '🐑', cost: 4, spawnAnimal: 'sheep', desc: 'Pasou se na trávě. Potrava pro vlky.' },
    { id: 'deer', group: 'life', name: 'Jeleni', emoji: '🦌', cost: 5, spawnAnimal: 'deer', desc: 'Rychlá lesní zvěř. Geny se dědí a mutují.' },
    { id: 'wolf', group: 'life', name: 'Vlci', emoji: '🐺', cost: 6, spawnAnimal: 'wolf', desc: 'Loví ovce i osamělé vesničany.' },
    { id: 'bear', group: 'life', name: 'Medvědi', emoji: '🐻', cost: 10, spawnAnimal: 'bear', desc: 'Silná šelma, kterou jen tak něco nezastaví.' },
    { id: 'dragon', group: 'life', name: 'Drak', emoji: '🐉', cost: 70, spawnAnimal: 'dragon', desc: 'Létá nad krajinou, zapaluje ji a požírá všechno živé. Zastaví ho jen armáda.' },
    { id: 'zombie', group: 'life', name: 'Nemrtví', emoji: '🧟', cost: 45, desc: 'Nákaza, která mění mrtvé v nemrtvé. Ti pak loví další. Šíří se sama.' },

    /* ---------- dary a zázraky ---------- */
    { id: 'bless', group: 'bless', name: 'Požehnání', emoji: '✨', cost: 6, hold: true, desc: 'Uzdraví a nasytí panáčky, zúrodní půdu a udělá z nich věřící. Víra je tvá mana.' },
    { id: 'rain', group: 'bless', name: 'Déšť', emoji: '🌧️', cost: 5, hold: true, desc: 'Uhasí požáry a zavlaží krajinu, takže rychleji zaroste.' },
    { id: 'gold', group: 'bless', name: 'Zlato', emoji: '💰', cost: 20, desc: 'Naplní pokladnu království pod kurzorem. Zlato pohání vědu a obchod.' },
    { id: 'foodgift', group: 'bless', name: 'Jídlo', emoji: '🍞', cost: 12, desc: 'Doplní sýpky nejbližší vesnice. Hladomor odvrácen.' },
    { id: 'enlight', group: 'bless', name: 'Osvícení', emoji: '📜', cost: 60, desc: 'Posune království do další doby – lepší stavby, silnější vojáci, vyšší výnosy.' },
    { id: 'colony', group: 'bless', name: 'Vesnice', emoji: '🏘️', cost: 40, desc: 'Založí království pod kurzorem novou vesnici přesně tam, kam klikneš.' },
    { id: 'war', group: 'bless', name: 'Válka', emoji: '⚔️', cost: 20, desc: 'Klikni na území království – vyhlásí válku nejbližšímu sousedovi.' },
    { id: 'peace', group: 'bless', name: 'Mír', emoji: '🕊️', cost: 15, desc: 'Klikni na území království – ukončí všechny jeho války.' },

    /* ---------- zkáza ---------- */
    { id: 'lightning', group: 'doom', name: 'Blesk', emoji: '⚡', cost: 4, desc: 'Zabije, koho trefí, a zapálí porost.' },
    { id: 'fire', group: 'doom', name: 'Požár', emoji: '🔥', cost: 6, hold: true, desc: 'Oheň se sám šíří po lese a trávě. Zastaví ho voda, skála nebo déšť.' },
    { id: 'bomb', group: 'doom', name: 'Bomba', emoji: '💣', cost: 14, desc: 'Výbuch: spáleniště, mrtví a zbořené domy.' },
    { id: 'meteor', group: 'doom', name: 'Meteorit', emoji: '☄️', cost: 45, desc: 'Padá z nebe. Po dopadu kráter, ohnivá bouře a jezero lávy.' },
    { id: 'volcano', group: 'doom', name: 'Sopka', emoji: '🌋', cost: 35, desc: 'Otevře sopouch, ze kterého teče láva po svahu dolů.' },
    { id: 'flood', group: 'doom', name: 'Povodeň', emoji: '💧', cost: 18, hold: true, desc: 'Vylije vodu, která teče podle terénu a topí, co jí stojí v cestě.' },
    { id: 'tornado', group: 'doom', name: 'Tornádo', emoji: '🌪️', cost: 30, desc: 'Smršť, která si sama bloudí krajinou, láme lesy a bourá domy.' },
    { id: 'blizzard', group: 'doom', name: 'Vánice', emoji: '🌨️', cost: 25, desc: 'Ledová bouře. Zmrazí krajinu a vymrzne, kdo nemá kam utéct.' },
    { id: 'plague', group: 'doom', name: 'Mor', emoji: '🦠', cost: 22, desc: 'Nemoc, která se sama šíří dotykem a postupně vybíjí okolí.' },
    { id: 'smite', group: 'doom', name: 'Boží hněv', emoji: '☠️', cost: 10, hold: true, desc: 'Přesná poprava všech v okruhu.' }
];

const TOOL_MAP = {};
for (const t of TOOLS) TOOL_MAP[t.id] = t;

function realmAt(life, i) { return life.realmById(life.world.owner[i]); }

function nearestVillage(life, x, y, maxD2 = 900) {
    let best = null, bd = maxD2;
    for (const v of life.villages) {
        if (v.dead) continue;
        const d = dist2(v.x, v.y, x, y);
        if (d < bd) { bd = d; best = v; }
    }
    return best;
}

function applyTool(life, id, wx, wy, radius) {
    const tool = TOOL_MAP[id];
    if (!tool) return false;
    const free = life.godMode;
    if (!free && tool.cost > life.faith) return 'faith';
    const w = life.world;
    const rng = life.rng;
    const x = clamp(wx, 0, w.w - 1), y = clamp(wy, 0, w.h - 1);
    const i = life.tileAt(x, y);
    const pay = () => { if (!free) life.faith -= tool.cost; };

    /* --- štětce na krajinu --- */
    if (tool.tile !== undefined) {
        w.forEachInRadius(x, y, radius, (j) => {
            if (w.build[j]) {
                if (tool.tile === T.WATER || tool.tile === T.MOUNT) life.destroyBuilding(w.build[j] - 1);
                else return;
            }
            w.paint(j, tool.tile);
            if (tool.tile === T.FARM) w.veg[j] = 0.9;
            if (tool.tile === T.WATER) life.forEachNear(j % w.w + 0.5, ((j / w.w) | 0) + 0.5, 0.9, u => life.kill(u, 'voda'));
        });
        return true;
    }

    /* --- národy a zvířata --- */
    if (tool.spawnRace) {
        if (!w.walkable(i)) return 'blocked';
        const realm = life.seedTribe(x, y, tool.spawnRace, 60);
        if (!realm) return 'blocked';
        fx(life, { type: 'sparkle', x, y, r: 3, life: 26, max: 26, color: realm.color });
        pay();
        return true;
    }
    if (tool.spawnAnimal) {
        const many = tool.spawnAnimal === 'dragon' ? 1 : 5;
        let placed = 0;
        for (let k = 0; k < 24 && placed < many; k++) {
            const a = rng() * Math.PI * 2, d = rng() * Math.max(1, radius * 0.6);
            const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
            if (tool.spawnAnimal !== 'dragon' && !life.walkableAt(px, py)) continue;
            if (life.spawnAnimal(px, py, tool.spawnAnimal)) placed++;
        }
        if (!placed) return 'blocked';
        if (tool.spawnAnimal === 'dragon') life.log('🐉 Na obloze se objevil drak', 'bad');
        pay();
        return true;
    }

    switch (id) {
        /* --- dary a zázraky --- */
        case 'bless': {
            w.forEachInRadius(x, y, radius, j => {
                w.moist[j] = Math.min(1, w.moist[j] + 0.06);
                if (w.veg[j] < 1) { w.veg[j] = Math.min(1, w.veg[j] + 0.25); w.classify(j); }
                if (w.fire[j]) { w.fire[j] = 0; w.fireSet.delete(j); w.classify(j); }
            });
            life.forEachNear(x, y, radius, u => {
                if (u.zombie) { life.kill(u, 'god'); return; }
                u.hp = u.maxHp; u.food = 1; u.sick = 0;
                if (u.kind === 'person') u.faith = Math.min(1, u.faith + 0.5);
            });
            fx(life, { type: 'sparkle', x, y, r: radius, life: 24, max: 24, color: '#ffe9a8' });
            pay(); return true;
        }
        case 'rain': {
            w.forEachInRadius(x, y, radius, j => {
                w.moist[j] = Math.min(1, w.moist[j] + 0.14);
                if (w.fire[j]) { w.fire[j] = 0; w.fireSet.delete(j); w.classify(j); }
                if (w.veg[j] < 1) { w.veg[j] = Math.min(1, w.veg[j] + 0.06); w.classify(j); }
            });
            fx(life, { type: 'rain', x, y, r: radius, life: 90, max: 90 });
            pay(); return true;
        }
        case 'gold': {
            const realm = realmAt(life, i);
            if (!realm) return 'nothing';
            realm.gold += 250;
            life.log(`💰 ${realm.name} obdrželi 250 zlaťáků z nebes`, 'good');
            fx(life, { type: 'sparkle', x, y, r: Math.max(2, radius), life: 26, max: 26, color: '#ffd166' });
            pay(); return true;
        }
        case 'foodgift': {
            const v = nearestVillage(life, x, y, 400);
            if (!v) return 'nothing';
            v.food += 120; v.wood += 40;
            life.log(`🍞 ${v.name} dostala zásoby na horší časy`, 'good');
            fx(life, { type: 'sparkle', x: v.x, y: v.y, r: 3, life: 24, max: 24, color: '#9ee86a' });
            pay(); return true;
        }
        case 'enlight': {
            const realm = realmAt(life, i);
            if (!realm) return 'nothing';
            if (realm.era >= ERAS.length - 1) { realm.research += 500; return 'nothing'; }
            realm.era++;
            realm.research = ERA_COST[realm.era];
            life.log(`📜 ${realm.name} byli osvíceni – nastala ${ERAS[realm.era]}`, 'good');
            fx(life, { type: 'beam', x, y, r: 4, life: 26, max: 26, color: '#ffe9a8' });
            pay(); return true;
        }
        case 'colony': {
            const realm = realmAt(life, i) || (nearestVillage(life, x, y, 2500) && life.realmById(nearestVillage(life, x, y, 2500).realm));
            if (!realm || !w.walkable(i) || w.build[i]) return 'nothing';
            const v = life.foundVillage(x, y, realm);
            if (!v) return 'nothing';
            for (let k = 0; k < 4; k++) {
                const u = life.spawnPerson(x + rng() - 0.5, y + rng() - 0.5, realm.race, realm, v);
                if (u) { u.job = 'worker'; u.age = 300; }
            }
            life.territoryDirty = true;
            life.log(`🏘️ ${realm.name}: z boží vůle vznikla vesnice ${v.name}`, 'good');
            pay(); return true;
        }
        case 'war': {
            const realm = realmAt(life, i);
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
            pay(); return true;
        }
        case 'peace': {
            const realm = realmAt(life, i);
            if (!realm || !realm.wars.size) return 'nothing';
            for (const id2 of [...realm.wars]) life.makePeace(realm, life.realmById(id2));
            pay(); return true;
        }
        case 'zombie': {
            let n = 0;
            life.harmArea(x, y, Math.max(3, radius), 0.05);
            life.forEachNear(x, y, Math.max(2, radius), u => {
                if (u.kind !== 'person' || u.zombie || n >= 4) return;
                u.zombie = 1; u.job = 'zombie'; u.realm = 0; u.village = 0;
                u.name = 'Nemrtvý ' + u.name; n++;
            });
            if (!n) return 'nothing';
            life.log('🧟 Mrtví vstali z hrobů', 'bad');
            fx(life, { type: 'sparkle', x, y, r: radius, life: 30, max: 30, color: '#8ad46a' });
            pay(); return true;
        }

        /* --- katastrofy --- */
        case 'lightning': {
            life.forEachNear(x, y, Math.max(1, radius * 0.4), u => life.kill(u, 'god'));
            life.harmArea(x, y, Math.max(1.5, radius * 0.4), 0.06);
            w.forEachInRadius(x, y, Math.max(1, radius * 0.4), j => { if (rng() < 0.6) w.ignite(j); });
            fx(life, { type: 'bolt', x, y, life: 14, max: 14 });
            break;
        }
        case 'fire': {
            w.forEachInRadius(x, y, radius, j => { if (rng() < 0.7) w.ignite(j); });
            break;
        }
        case 'bomb': explode(life, x, y, radius, 1); break;
        case 'smite': {
            life.forEachNear(x, y, radius, u => life.kill(u, 'god'));
            life.harmArea(x, y, radius, 0.35);
            fx(life, { type: 'beam', x, y, r: radius, life: 18, max: 18, color: '#ff6b6b' });
            break;
        }
        case 'plague': {
            let n = 0;
            life.forEachNear(x, y, radius, u => { if (u.kind === 'person' && !u.zombie) { u.sick = 500; n++; } });
            const dead = life.harmArea(x, y, radius * 1.5, 0.25);
            life.log(`🦠 V okolí vypukl mor` + (dead > 1 ? ` – zemřelo ${fmtNum(dead)} lidí` : ''), 'bad');
            fx(life, { type: 'sparkle', x, y, r: radius, life: 30, max: 30, color: '#9ee86a' });
            break;
        }
        case 'flood': {
            w.forEachInRadius(x, y, radius, (j, jx, jy, t) => w.addWater(j, 0.5 * (1 - t * 0.6)));
            life.harmArea(x, y, radius, 0.3);
            fx(life, { type: 'splash', x, y, r: radius, life: 20, max: 20 });
            break;
        }
        case 'tornado': {
            life.tornados = life.tornados || [];
            life.tornados.push({ x, y, dx: rng() - 0.5, dy: rng() - 0.5, r: Math.max(2.5, radius * 0.8), life: 500 });
            life.log('🌪️ Krajinou se prohnalo tornádo', 'bad');
            break;
        }
        case 'blizzard': {
            life.storms = life.storms || [];
            life.storms.push({ x, y, r: Math.max(4, radius * 1.4), life: 260 });
            life.log('🌨️ Přišla ledová vánice', 'bad');
            break;
        }
        case 'volcano': {
            w.forEachInRadius(x, y, Math.max(1, radius * 0.35), j => w.addLava(j));
            life.volcanoes = life.volcanoes || [];
            life.volcanoes.push({ x: x | 0, y: y | 0, life: 220 });
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
    pay();
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
    life.harmArea(x, y, radius * 1.3, 0.55 * power);
    fx(life, { type: 'boom', x, y, r: radius * 1.4, life: 26, max: 26, power });
}

/* dobíhající jevy: meteory, sopky, tornáda, vánice */
function stepHazards(life) {
    const w = life.world, rng = life.rng;

    if (life.meteors) {
        for (let k = life.meteors.length - 1; k >= 0; k--) {
            const m = life.meteors[k];
            if (--m.life <= 0) {
                explode(life, m.x, m.y, m.r, 2);
                life.harmArea(m.x, m.y, m.r * 2.5, 0.7);
                w.forEachInRadius(m.x, m.y, m.r * 0.35, j => w.addLava(j));
                w.forEachInRadius(m.x, m.y, m.r * 2, j => { if (rng() < 0.35) w.ignite(j); });
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
            if (rng() < 0.4) {
                const a = rng() * Math.PI * 2, d = rng() * 2.5;
                const px = clamp((v.x + Math.cos(a) * d) | 0, 0, w.w - 1);
                const py = clamp((v.y + Math.sin(a) * d) | 0, 0, w.h - 1);
                w.addLava(py * w.w + px);
            }
            if (v.life <= 0) life.volcanoes.splice(k, 1);
        }
    }
    if (life.tornados) {
        for (let k = life.tornados.length - 1; k >= 0; k--) {
            const t = life.tornados[k];
            t.life--;
            t.dx += (rng() - 0.5) * 0.3; t.dy += (rng() - 0.5) * 0.3;
            const l = Math.hypot(t.dx, t.dy) || 1;
            t.dx = t.dx / l * 0.35; t.dy = t.dy / l * 0.35;
            t.x = clamp(t.x + t.dx, 0, w.w - 1); t.y = clamp(t.y + t.dy, 0, w.h - 1);
            t.ang = (t.ang || 0) + 0.6;
            w.forEachInRadius(t.x, t.y, t.r, j => {
                if (rng() < 0.12) {
                    if (w.type[j] === T.FOREST) w.paint(j, T.GRASS);
                    else if (w.veg[j] > 0.2) { w.veg[j] *= 0.5; w.classify(j); }
                }
                if (w.build[j] && rng() < 0.05) life.destroyBuilding(w.build[j] - 1);
            });
            if (life.tick % 10 === 0) life.harmArea(t.x, t.y, t.r + 1, 0.02);
            life.forEachNear(t.x, t.y, t.r, u => {
                const a = rng() * Math.PI * 2;
                u.x = clamp(u.x + Math.cos(a) * 1.4, 0, w.w - 1.2);
                u.y = clamp(u.y + Math.sin(a) * 1.4, 0, w.h - 1.2);
                u.hp -= 3;
                if (u.hp <= 0) life.kill(u, 'god');
            });
            if (t.life <= 0) life.tornados.splice(k, 1);
        }
    }
    if (life.storms) {
        for (let k = life.storms.length - 1; k >= 0; k--) {
            const s = life.storms[k];
            s.life--;
            s.x = clamp(s.x + (rng() - 0.5) * 0.3, 0, w.w - 1);
            s.y = clamp(s.y + (rng() - 0.5) * 0.3, 0, w.h - 1);
            w.forEachInRadius(s.x, s.y, s.r, j => {
                if (w.fire[j]) { w.fire[j] = 0; w.fireSet.delete(j); w.classify(j); }
                if (rng() < 0.03 && !w.isWater(j) && w.type[j] !== T.MOUNT && w.build[j] === 0) w.paint(j, T.SNOW);
            });
            if (life.tick % 10 === 0) life.harmArea(s.x, s.y, s.r, 0.012);
            life.forEachNear(s.x, s.y, s.r, u => {
                const cold = u.race === 'dwarf' ? 0.4 : 1;
                u.hp -= 0.7 * cold;
                u.food = Math.max(0, u.food - 0.004);
                if (u.hp <= 0) life.kill(u, 'god');
            });
            if (s.life <= 0) life.storms.splice(k, 1);
        }
    }
}

if (typeof module !== 'undefined') {
    module.exports = { TOOLS, TOOL_MAP, applyTool, stepHazards };
}
