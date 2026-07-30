'use strict';
/* Propojení světa s rozhraním. Simulace běží v pevném tempu 8 tiků za vteřinu,
   snímky se mezi tiky dopočítávají – proto je obraz klidný. */

const WORLD_W = 144, WORLD_H = 90;
const TICK_MS = 125;
const $ = id => document.getElementById(id);

const JOBS = { child: 'dítě', worker: 'dělník', soldier: 'voják', wanderer: 'tulák', wild: 'divoké' };
const STATES = { idle: 'rozmýšlí se', gather: 'sbírá jídlo', return: 'nese jídlo domů', build: 'staví' };
const GROUP_TITLE = { hand: 'Ruka', land: 'Krajina', life: 'Život', bless: 'Zázraky', doom: 'Zkáza' };

let world, life, renderer;
let speed = 1, tool = 'hand', brushR = 4;
let held = false, panning = false, spaceDown = false;
let lastPointer = { x: 0, y: 0 };
let logIndex = 0, lastApply = 0;
let hotkeys = [];

const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { } }
};

/* ---------------- start ---------------- */

function newWorld(seed, withLife = true) {
    world = new World(WORLD_W, WORLD_H, seed >>> 0);
    life = new Life(world, seed >>> 0);
    const zoom = renderer ? renderer.cam.zoom : 0;
    renderer = new Renderer($('world'), $('minimap'), world, life);
    renderer.cam.zoom = zoom || Math.max(renderer.minZoom, 7);
    renderer.clampCam();
    renderer.brush.r = brushR;
    logIndex = 0;
    $('log').innerHTML = '';
    $('card').hidden = true;
    life.log('🌍 Zrodil se nový svět', 'good');
    if (withLife) {
        const races = ['human', 'orc', 'elf'];
        for (const r of races) {
            const spot = life.homeSpot(r);
            if (spot) life.seedTribe(spot.x, spot.y, r, 6);
        }
        for (let k = 0; k < 26; k++) {
            const s = life.homeSpot('human');
            if (s) life.spawnAnimal(s.x, s.y, k % 9 === 0 ? 'wolf' : 'sheep');
        }
        life.updateTerritory();
        renderer.terrDirty = true;
    }
    selectTool(tool);
}

function boot() {
    buildTools();
    buildModes();
    bindUI();
    bindCanvas();
    newWorld(parseInt($('seed').value, 10) || 12345);
    if (!store.get('bs2-help')) $('help').hidden = false;
    requestAnimationFrame(loop);
}

/* ---------------- nástroje ---------------- */

function buildTools() {
    const box = $('tools');
    box.innerHTML = '';
    hotkeys = [];
    let group = null;
    for (const t of TOOLS) {
        if (t.group !== group) {
            group = t.group;
            const h = document.createElement('div');
            h.className = 'tool-group';
            h.innerHTML = `<span>${GROUP_TITLE[group]}</span>`;
            box.appendChild(h);
            const grid = document.createElement('div');
            grid.className = 'tool-grid';
            grid.id = 'grid-' + group;
            box.appendChild(grid);
        }
        const key = hotkeys.length < 10 ? (hotkeys.length + 1) % 10 : '';
        if (key !== '') hotkeys.push(t.id);
        const b = document.createElement('button');
        b.className = 'tool';
        b.dataset.id = t.id;
        b.innerHTML = `<i>${t.emoji}</i><span>${t.name}</span>` +
            (t.cost ? `<b>${t.cost}</b>` : '') + (key !== '' ? `<u>${key}</u>` : '');
        b.addEventListener('click', () => selectTool(t.id));
        $('grid-' + t.group).appendChild(b);
    }
}

function selectTool(id) {
    tool = id;
    const t = TOOL_MAP[id];
    document.querySelectorAll('.tool').forEach(e => e.classList.toggle('active', e.dataset.id === id));
    $('tool-desc').innerHTML = `<b>${t.emoji} ${t.name}${t.cost ? ` · ${t.cost} víry` : ''}</b>${t.desc}` +
        (t.hold ? '<i>Můžeš držet a táhnout.</i>' : '');
    renderer.brush.color = t.group === 'doom' ? '#ff9a9a' : t.group === 'land' ? '#a8e0ff'
        : t.group === 'life' ? '#b6f5a0' : '#ffe6a0';
    renderer.brush.show = t.id !== 'hand';
    $('world').style.cursor = t.id === 'hand' ? 'default' : 'crosshair';
}

function buildModes() {
    const bar = $('modes');
    for (const m of MAP_MODES) {
        const b = document.createElement('button');
        b.textContent = `${m.icon} ${m.name}`;
        if (m.id === 'normal') b.classList.add('active');
        b.addEventListener('click', () => {
            renderer.mode = m.id;
            bar.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
        });
        bar.appendChild(b);
    }
}

/* ---------------- ovládací prvky ---------------- */

function bindUI() {
    $('brush').addEventListener('input', e => {
        brushR = parseInt(e.target.value, 10);
        $('brush-val').textContent = brushR;
        renderer.brush.r = brushR;
    });
    $('speeds').addEventListener('click', e => {
        const b = e.target.closest('button[data-speed]');
        if (b) setSpeed(parseInt(b.dataset.speed, 10));
    });
    $('climate').addEventListener('change', e => {
        world.climate = parseFloat(e.target.value);
        $('climate-val').textContent = (world.climate > 0 ? '+' : '') + world.climate + ' °C';
        world.reclassifyAll();
    });
    $('climate').addEventListener('input', e => {
        $('climate-val').textContent = (parseFloat(e.target.value) > 0 ? '+' : '') + e.target.value + ' °C';
    });
    $('btn-new').addEventListener('click', () => {
        newWorld(parseInt($('seed').value, 10) || (Date.now() & 0xffff));
        toast('🌍 Nový svět je hotový');
    });
    $('btn-random').addEventListener('click', () => {
        const s = (Math.random() * 99999) | 0;
        $('seed').value = s;
        newWorld(s);
        toast('🎲 Náhodný svět');
    });
    $('btn-empty').addEventListener('click', () => {
        newWorld(parseInt($('seed').value, 10) || 1, false);
        toast('🗺️ Prázdný svět – národy si zasaď sám');
    });
    $('btn-help').addEventListener('click', () => { $('help').hidden = false; });
    $('help-close').addEventListener('click', () => { $('help').hidden = true; store.set('bs2-help', '1'); });
    $('tabs').addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        $('tabs').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
        for (const t of ['realms', 'log']) $('tab-' + t).hidden = t !== b.dataset.tab;
    });

    window.addEventListener('resize', () => renderer.resize());
    window.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT') return;
        if (e.code === 'Space') { e.preventDefault(); spaceDown = true; setSpeed(speed === 0 ? 1 : 0); }
        if (e.key === 'h' || e.key === 'H') $('help').hidden = !$('help').hidden;
        const n = parseInt(e.key, 10);
        if (!isNaN(n) && e.key.length === 1) {
            const id = hotkeys[n === 0 ? 9 : n - 1];
            if (id) selectTool(id);
        }
    });
    window.addEventListener('keyup', e => { if (e.code === 'Space') spaceDown = false; });
    $('minimap').addEventListener('click', e => {
        const r = e.target.getBoundingClientRect();
        renderer.cam.x = (e.clientX - r.left) / r.width * world.w;
        renderer.cam.y = (e.clientY - r.top) / r.height * world.h;
        renderer.clampCam();
    });
}

function setSpeed(s) {
    speed = s;
    $('speeds').querySelectorAll('button[data-speed]').forEach(x =>
        x.classList.toggle('active', parseInt(x.dataset.speed, 10) === s));
}

/* ---------------- myš ---------------- */

function bindCanvas() {
    const cv = $('world');
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('pointerdown', e => {
        cv.setPointerCapture(e.pointerId);
        lastPointer = { x: e.offsetX, y: e.offsetY };
        if (e.button === 2 || e.button === 1 || spaceDown) { panning = true; return; }
        use(renderer.s2wx(e.offsetX), renderer.s2wy(e.offsetY));
        held = true;
    });
    cv.addEventListener('pointermove', e => {
        const wx = renderer.s2wx(e.offsetX), wy = renderer.s2wy(e.offsetY);
        renderer.brush.x = Math.floor(wx); renderer.brush.y = Math.floor(wy);
        if (panning) {
            renderer.cam.x -= (e.offsetX - lastPointer.x) / renderer.cam.zoom;
            renderer.cam.y -= (e.offsetY - lastPointer.y) / renderer.cam.zoom;
            renderer.clampCam();
        }
        lastPointer = { x: e.offsetX, y: e.offsetY };
        showTip(e.offsetX, e.offsetY, wx, wy);
    });
    const stop = () => { held = false; panning = false; };
    cv.addEventListener('pointerup', stop);
    cv.addEventListener('pointercancel', stop);
    cv.addEventListener('pointerleave', () => { stop(); $('tip').style.display = 'none'; });
    cv.addEventListener('wheel', e => {
        e.preventDefault();
        renderer.zoomAt(e.offsetX, e.offsetY, e.deltaY < 0 ? 1.15 : 1 / 1.15);
    }, { passive: false });
}

function use(wx, wy) {
    if (wx < 0 || wy < 0 || wx >= world.w || wy >= world.h) return;
    if (tool === 'hand') {
        renderer.select(renderer.pick(wx, wy));
        renderCard();
        return;
    }
    const res = applyTool(life, tool, Math.floor(wx), Math.floor(wy), brushR);
    if (res === 'faith') {
        toast('🙏 Málo víry – požehnej lidem, ať v tebe věří');
        const bar = $('faith-bar');
        bar.classList.remove('flash');
        void bar.offsetWidth;
        bar.classList.add('flash');
    } else if (res === 'blocked') toast('Sem se národ usadit nemůže – zkus souš');
    else if (res === 'nothing') toast('Klikni na území nějakého království');
}

let toastTimer = null;
function toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

function showTip(sx, sy, wx, wy) {
    const tip = $('tip');
    if (wx < 0 || wy < 0 || wx >= world.w || wy >= world.h) { tip.style.display = 'none'; return; }
    const i = life.tileAt(wx, wy);
    const realm = life.realmById(world.owner[i]);
    let text = `${TILE_NAME[world.type[i]]}   ${world.tempAt(i).toFixed(0)} °C`;
    if (realm) text += `\n👑 ${realm.name}`;
    const u = renderer.pick(wx, wy);
    if (u) {
        if (u.kind === 'village') text += `\n🏘️ ${u.v.name} – ${u.v.pop} obyvatel`;
        else if (u.kind === 'person') text += `\n${RACES[u.race].emoji} ${u.name} · ${JOBS[u.job] || u.job}`;
        else text += `\n${ANIMALS[u.race].emoji} ${ANIMALS[u.race].name}`;
    }
    tip.textContent = text;
    tip.style.display = 'block';
    const box = $('box').getBoundingClientRect();
    tip.style.left = Math.min(sx + 16, box.width - 175) + 'px';
    tip.style.top = Math.min(sy + 16, box.height - 80) + 'px';
}

/* ---------------- panely ---------------- */

function renderCard() {
    const el = $('card');
    const s = renderer.validSelection();
    if (!s) { el.hidden = true; return; }
    if (s.kind === 'village') {
        const v = s.v, realm = life.realmById(v.realm);
        el.innerHTML = `<h5><span class="chip" style="background:${realm ? realm.color : '#888'}"></span>🏘️ ${v.name}
            <button class="close">✕</button></h5>
            <div class="row"><span>království</span><b>${realm ? realm.name : '–'}</b></div>
            <div class="row"><span>obyvatel</span><b>${v.pop}</b></div>
            <div class="row"><span>vojáků</span><b>${v.soldiers}</b></div>
            <div class="row"><span>domů</span><b>${v.houses.length}</b></div>
            <div class="row"><span>zásoby jídla</span><b>${v.food | 0}</b></div>
            <div class="row"><span>založena</span><b>${Math.floor(v.born / 60)}. rok</b></div>`;
    } else if (s.kind === 'person') {
        const realm = life.realmById(s.realm), v = life.villageById(s.village);
        el.innerHTML = `<h5><span class="chip" style="background:${realm ? realm.color : '#888'}"></span>${RACES[s.race].emoji} ${s.name}
            <button class="close">✕</button></h5>
            <div class="row"><span>rod</span><b>${RACES[s.race].name}</b></div>
            <div class="row"><span>království</span><b>${realm ? realm.name : 'bez domova'}</b></div>
            <div class="row"><span>domov</span><b>${v ? v.name : '–'}</b></div>
            <div class="row"><span>povolání</span><b>${JOBS[s.job] || s.job}</b></div>
            <div class="row"><span>zrovna</span><b>${STATES[s.state] || '–'}</b></div>
            <div class="row"><span>věk</span><b>${Math.floor(s.age / 60)} let</b></div>
            <div class="bar-row"><span>zdraví</span><div class="bar"><i style="width:${(100 * s.hp / s.maxHp) | 0}%;background:#e05555"></i></div></div>
            <div class="bar-row"><span>sytost</span><div class="bar"><i style="width:${(100 * s.food) | 0}%;background:#7cc46a"></i></div></div>
            <div class="bar-row"><span>víra</span><div class="bar"><i style="width:${(100 * s.faith) | 0}%;background:#ffd166"></i></div></div>`;
    } else {
        el.innerHTML = `<h5>${ANIMALS[s.race].emoji} ${ANIMALS[s.race].name}<button class="close">✕</button></h5>
            <div class="row"><span>věk</span><b>${Math.floor(s.age / 60)} let</b></div>
            <div class="bar-row"><span>zdraví</span><div class="bar"><i style="width:${(100 * s.hp / s.maxHp) | 0}%;background:#e05555"></i></div></div>
            <div class="bar-row"><span>sytost</span><div class="bar"><i style="width:${(100 * s.food) | 0}%;background:#7cc46a"></i></div></div>`;
    }
    el.hidden = false;
    el.querySelector('.close').addEventListener('click', () => { renderer.select(null); el.hidden = true; });
}

function renderHud() {
    const s = life.summary();
    $('hud-year').textContent = Math.floor(life.tick / 60);
    $('hud-pop').textContent = s.people;
    $('hud-realms').textContent = s.realms.length;
    $('hud-villages').textContent = s.villages;
    $('hud-animals').textContent = s.animals;

    $('faith-fill').style.width = clamp(life.faith / life.faithMax, 0, 1) * 100 + '%';
    $('faith-text').textContent = `${life.faith | 0} / ${life.faithMax | 0} víry`;
    $('believers').textContent = life.believers;

    document.querySelectorAll('.tool').forEach(e => {
        e.classList.toggle('locked', TOOL_MAP[e.dataset.id].cost > life.faith);
    });
    if (!$('tab-realms').hidden) renderRealms(s);
}

function renderRealms(s) {
    const el = $('tab-realms');
    let html = '';
    if (!s.realms.length) html += '<div class="empty">Zatím tu není žádné království.<br>Vezmi 🧑 <b>Lidi</b> a klikni na souš.</div>';
    for (const r of s.realms.slice().sort((a, b) => b.villages.length - a.villages.length)) {
        let pop = 0, soldiers = 0;
        for (const u of life.units) if (u.alive && u.realm === r.id) { pop++; if (u.job === 'soldier') soldiers++; }
        const wars = [...r.wars].map(id => { const o = life.realmById(id); return o ? o.name : null; }).filter(Boolean);
        html += `<div class="realm" data-realm="${r.id}">
            <div class="realm-head"><span class="chip" style="background:${r.color}"></span>
                <b>${r.name}</b><em>${RACES[r.race].emoji}</em></div>
            <div class="realm-meta">
                <span>🏘️ ${r.villages.length}</span><span>🧑 ${pop}</span><span>⚔️ ${soldiers}</span>
                <span>od ${Math.floor(r.born / 60)}. roku</span></div>
            ${wars.length ? `<div class="war">⚔️ ve válce s: ${wars.join(', ')}</div>` : '<div class="peace">🕊️ mír</div>'}
        </div>`;
    }
    html += `<div class="side-stats">
        <div><b>${s.houses}</b><span>staveb</span></div>
        <div><b>${life.stats.born}</b><span>narozených</span></div>
        <div><b>${life.stats.died}</b><span>mrtvých</span></div>
        <div><b>${life.stats.peak}</b><span>vrchol populace</span></div></div>`;
    el.innerHTML = html;
    el.querySelectorAll('.realm').forEach(row => row.addEventListener('click', () => {
        const r = life.realmById(parseInt(row.dataset.realm, 10));
        const v = r && life.villageById(r.capital);
        if (v) {
            renderer.cam.x = v.x; renderer.cam.y = v.y;
            renderer.cam.zoom = Math.max(renderer.cam.zoom, 12);
            renderer.clampCam();
            renderer.select({ kind: 'village', v, uid: -v.id, alive: true });
            renderCard();
        }
    }));
}

function renderLog() {
    const el = $('log');
    while (logIndex < life.events.length) {
        const e = life.events[logIndex++];
        const d = document.createElement('div');
        d.className = 'ev ' + e.kind;
        d.innerHTML = `<time>${e.year}. rok</time>${e.text}`;
        el.appendChild(d);
        if (el.children.length > 140) el.removeChild(el.firstChild);
    }
}

/* ---------------- smyčka ---------------- */

let lastTime = performance.now(), acc = 0, frame = 0;
function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(300, now - lastTime);
    lastTime = now;
    frame++;

    if (speed > 0) {
        acc += dt * speed;
        let steps = 0;
        while (acc >= TICK_MS && steps < 6) { life.step(); acc -= TICK_MS; steps++; }
        if (acc > TICK_MS * 3) acc = 0;
    } else acc = 0;

    if (held && TOOL_MAP[tool].hold && now - lastApply > 90) {
        lastApply = now;
        use(renderer.brush.x + 0.5, renderer.brush.y + 0.5);
    }

    renderer.draw(speed > 0 ? clamp(acc / TICK_MS, 0, 1) : 1, speed === 0);

    if (frame % 12 === 0) renderHud();
    if (frame % 20 === 0 && renderer.selected) renderCard();
    if (life.dirtyLog) { renderLog(); life.dirtyLog = false; }
}

document.addEventListener('DOMContentLoaded', boot);
