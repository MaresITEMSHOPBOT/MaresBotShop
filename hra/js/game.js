'use strict';
/* Propojení světa s rozhraním. Simulace běží v pevném tempu 8 tiků za vteřinu,
   snímky se mezi tiky dopočítávají – proto je obraz klidný. */

const MAP_SIZES = [
    { id: 's', name: 'Malý', w: 128, h: 80 },
    { id: 'm', name: 'Střední', w: 176, h: 110 },
    { id: 'l', name: 'Velký', w: 240, h: 150 },
    { id: 'xl', name: 'Obří', w: 340, h: 212 },
    { id: 'xxl', name: 'Kontinent', w: 440, h: 275 },
    { id: 'planet', name: 'Planeta', w: 560, h: 350 }
];
const TICK_MS = 125;
const $ = id => document.getElementById(id);

const JOBS = { child: 'dítě', worker: 'dělník', soldier: 'voják', wanderer: 'tulák', wild: 'divoké', zombie: 'nemrtvý' };
const STATES = { idle: 'rozmýšlí se', gather: 'sbírá jídlo', chop: 'kácí dřevo', return: 'nese náklad domů', build: 'staví' };
const GROUP_TITLE = { hand: 'Ruka', land: 'Krajina', life: 'Život', weather: 'Počasí', bless: 'Dary a zázraky', doom: 'Zkáza' };

let world, life, renderer;
let speed = 1, tool = 'hand', brushR = 4, mapSize = 'm';
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
    const size = MAP_SIZES.find(s => s.id === mapSize) || MAP_SIZES[1];
    setWorldLimits(size.w, size.h);
    const godMode = life ? life.godMode : false;
    const laws = life ? { ...life.laws } : null;

    world = new World(size.w, size.h, seed >>> 0);
    life = new Life(world, seed >>> 0);
    life.godMode = godMode;
    if (laws) life.laws = laws;

    renderer = new Renderer($('world'), $('minimap'), world, life);
    renderer.cam.zoom = Math.max(renderer.minZoom, 7);
    renderer.clampCam();
    renderer.brush.r = brushR;
    logIndex = 0;
    $('log').innerHTML = '';
    $('card').hidden = true;
    life.log(`🌍 Zrodil se nový svět (${size.name.toLowerCase()}, ${size.w}×${size.h})`, 'good');

    if (withLife) {
        const races = ['human', 'orc', 'elf', 'dwarf'];
        const n = size.w > 420 ? 8 : size.w > 300 ? 6 : size.w > 200 ? 5 : size.w > 150 ? 4 : 3;
        for (let k = 0; k < n; k++) {
            const r = races[k % races.length];
            const spot = life.homeSpot(r);
            if (spot) life.seedTribe(spot.x, spot.y, r, 6);
        }
        const animals = Math.round(size.w * size.h / 700);
        for (let k = 0; k < animals; k++) {
            const s = life.homeSpot('human');
            if (s) life.spawnAnimal(s.x, s.y, k % 9 === 0 ? 'wolf' : 'sheep');
        }
        life.updateTerritory();
        renderer.terrDirty = true;
    }
    selectTool(tool);
    renderLaws();
}

function boot() {
    buildTools();
    buildModes();
    buildSizes();
    bindUI();
    bindCanvas();
    newWorld(parseInt($('seed').value, 10) || 12345);
    if (!store.get('bs3-help')) $('help').hidden = false;
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
        : t.group === 'life' ? '#b6f5a0' : t.group === 'weather' ? '#cfe8ff' : '#ffe6a0';
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

function buildSizes() {
    const sel = $('mapsize');
    for (const s of MAP_SIZES) {
        const o = document.createElement('option');
        o.value = s.id;
        o.textContent = `${s.name} · ${s.w}×${s.h}`;
        if (s.id === mapSize) o.selected = true;
        sel.appendChild(o);
    }
}

/* ---------------- zákony ---------------- */

function renderLaws() {
    const el = $('tab-laws');
    let html = '<div class="laws-intro">Zákony platí pro celý svět. Můžeš je měnit kdykoli – království se přizpůsobí.</div>';
    for (const l of LAWS) {
        html += `<div class="law"><div class="law-head">${l.icon} <b>${l.name}</b></div>
            <div class="law-opts" data-law="${l.id}">` +
            l.opts.map((o, k) => `<button data-v="${k}" class="${life.laws[l.id] === k ? 'on' : ''}">${o}</button>`).join('') +
            `</div><div class="law-desc">${l.desc}</div></div>`;
    }
    el.innerHTML = html;
    el.querySelectorAll('.law-opts').forEach(row => {
        row.addEventListener('click', e => {
            const b = e.target.closest('button');
            if (!b) return;
            const id = row.dataset.law, v = parseInt(b.dataset.v, 10);
            life.laws[id] = v;
            row.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
            const law = LAWS.find(x => x.id === id);
            life.log(`📜 Vyhlášen zákon: ${law.name} – ${law.opts[v]}`, 'info');
        });
    });
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
    $('godmode').addEventListener('click', () => {
        life.godMode = !life.godMode;
        $('godmode').classList.toggle('on', life.godMode);
        toast(life.godMode ? '♾️ Nekonečná víra zapnuta – dělej si, co chceš' : 'Víra se zase počítá');
    });
    $('climate').addEventListener('change', e => {
        world.climate = parseFloat(e.target.value);
        world.reclassifyAll();
    });
    $('climate').addEventListener('input', e => {
        $('climate-val').textContent = (parseFloat(e.target.value) > 0 ? '+' : '') + e.target.value + ' °C';
    });
    $('mapsize').addEventListener('change', e => { mapSize = e.target.value; });
    $('sun').addEventListener('input', e => {
        world.sun = parseInt(e.target.value, 10) / 100;
        $('sun-val').textContent = Math.round(world.sun * 100) + ' %';
    });
    $('sun').addEventListener('change', () => world.reclassifyAll());
    $('humid').addEventListener('input', e => {
        world.humidity = parseInt(e.target.value, 10) / 100;
        $('humid-val').textContent = e.target.value + ' %';
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
    $('help-close').addEventListener('click', () => { $('help').hidden = true; store.set('bs3-help', '1'); });
    $('tabs').addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        $('tabs').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
        for (const t of ['state', 'realms', 'laws', 'charts', 'miles', 'log']) $('tab-' + t).hidden = t !== b.dataset.tab;
        if (b.dataset.tab === 'charts') renderCharts();
        if (b.dataset.tab === 'miles') renderMiles();
        if (b.dataset.tab === 'state') renderState();
    });

    window.addEventListener('resize', () => renderer.resize());
    window.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        if (e.code === 'Space') { e.preventDefault(); spaceDown = true; setSpeed(speed === 0 ? 1 : 0); }
        if (e.key === 'h' || e.key === 'H') $('help').hidden = !$('help').hidden;
        if (e.key === 'g' || e.key === 'G') $('godmode').click();
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
    if (renderer.mode === 'space') { toast('Ve vesmírném pohledu se nedá zasahovat – přepni na 🗺️ Krajinu'); return; }
    if (wx < 0 || wy < 0 || wx >= world.w || wy >= world.h) return;
    if (tool === 'hand') {
        renderer.select(renderer.pick(wx, wy));
        renderCard();
        return;
    }
    const res = applyTool(life, tool, Math.floor(wx), Math.floor(wy), brushR);
    if (res === 'faith') {
        toast('🙏 Málo víry – požehnej lidem, nebo zapni ♾️ nahoře');
        const bar = $('faith-bar');
        bar.classList.remove('flash'); void bar.offsetWidth; bar.classList.add('flash');
    } else if (res === 'blocked') toast('Sem to nejde – zkus jiné místo');
    else if (res === 'nothing') toast('Klikni na území království nebo blízko vesnice');
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
    if (realm) text += `\n👑 ${realm.name} · ${ERAS[realm.era].name}`;
    const u = renderer.pick(wx, wy);
    if (u) {
        if (u.kind === 'village') text += `\n🏘️ ${LEVELS[u.v.level].name} ${u.v.name} – ${fmt(u.v.pop)} obyvatel`;
        else if (u.kind === 'person') text += `\n${u.zombie ? '🧟' : RACES[u.race].emoji} ${u.name} · ${JOBS[u.job] || u.job}`;
        else text += `\n${ANIMALS[u.race].emoji} ${ANIMALS[u.race].name}`;
    }
    tip.textContent = text;
    tip.style.display = 'block';
    const box = $('box').getBoundingClientRect();
    tip.style.left = Math.min(sx + 16, box.width - 210) + 'px';
    tip.style.top = Math.min(sy + 16, box.height - 90) + 'px';
}

/* ---------------- karty a panely ---------------- */

function renderCard() {
    const el = $('card');
    const s = renderer.validSelection();
    if (!s) { el.hidden = true; return; }
    if (s.kind === 'village') {
        const v = s.v, realm = life.realmById(v.realm);
        const types = {};
        for (const bi of v.houses) { const b = life.buildings[bi]; if (b && !b.dead) types[b.type] = (types[b.type] || 0) + 1; }
        const list = Object.entries(types).map(([t, n]) => `${BUILDINGS[t].icon}${n}`).join(' ') || '–';
        el.innerHTML = `<h5><span class="chip" style="background:${realm ? realm.color : '#888'}"></span>${LEVELS[v.level].name} ${v.name}
            <button class="close">✕</button></h5>
            <div class="row"><span>říše</span><b>${realm ? realm.name : '–'}</b></div>
            <div class="row"><span>obyvatel</span><b>${fmt(v.pop)}</b></div>
            <div class="row"><span>🌾 jídlo / pole</span><b>${fmt(v.food)} / ${v.farms}</b></div>
            <div class="row"><span>🪵 dřevo · 🪙 zlato</span><b>${fmt(v.wood)} · ${fmt(v.gold)}</b></div>
            ${v.army > 1 ? `<div class="row"><span>⚔️ branná síla</span><b>${fmt(v.army)}</b></div>` : ''}
            <div class="bar-row"><span>nálada</span><div class="bar"><i style="width:${(v.happy * 100) | 0}%;background:${v.happy > 0.5 ? '#7cc46a' : v.happy > 0.25 ? '#e8b84a' : '#e05555'}"></i></div></div>
            <div class="row"><span>stavby</span><b>${list}</b></div>
            <div class="row"><span>založeno</span><b>${Math.floor(v.born / 60)}. rok</b></div>`;
    } else if (s.kind === 'person') {
        const realm = life.realmById(s.realm), v = life.villageById(s.village);
        el.innerHTML = `<h5><span class="chip" style="background:${realm ? realm.color : '#888'}"></span>${s.zombie ? '🧟' : RACES[s.race].emoji} ${s.name}
            <button class="close">✕</button></h5>
            <div class="row"><span>rod</span><b>${RACES[s.race].name}</b></div>
            <div class="row"><span>království</span><b>${realm ? realm.name : 'bez domova'}</b></div>
            <div class="row"><span>domov</span><b>${v ? v.name : '–'}</b></div>
            <div class="row"><span>povolání</span><b>${JOBS[s.job] || s.job}</b></div>
            <div class="row"><span>zrovna</span><b>${STATES[s.state] || '–'}</b></div>
            <div class="row"><span>věk</span><b>${Math.floor(s.age / 60)} let</b></div>
            ${s.kills ? `<div class="row"><span>zabil</span><b>${s.kills}</b></div>` : ''}
            <div class="bar-row"><span>zdraví</span><div class="bar"><i style="width:${(100 * s.hp / s.maxHp) | 0}%;background:#e05555"></i></div></div>
            <div class="bar-row"><span>sytost</span><div class="bar"><i style="width:${(100 * s.food) | 0}%;background:#7cc46a"></i></div></div>
            <div class="bar-row"><span>víra</span><div class="bar"><i style="width:${(100 * s.faith) | 0}%;background:#ffd166"></i></div></div>`;
    } else {
        const g = s.genes || { size: 1, speed: 1, fert: 1 };
        el.innerHTML = `<h5>${ANIMALS[s.race].emoji} ${ANIMALS[s.race].name}<button class="close">✕</button></h5>
            <div class="row"><span>věk</span><b>${Math.floor(s.age / 60)} let</b></div>
            <div class="row"><span>🧬 geny</span><b>vel. ${(g.size * 100) | 0} % · rych. ${(g.speed * 100) | 0} % · plod. ${(g.fert * 100) | 0} %</b></div>
            <div class="bar-row"><span>zdraví</span><div class="bar"><i style="width:${(100 * s.hp / s.maxHp) | 0}%;background:#e05555"></i></div></div>`;
    }
    el.hidden = false;
    el.querySelector('.close').addEventListener('click', () => { renderer.select(null); el.hidden = true; });
}

function renderHud() {
    const s = life.summary();
    $('hud-year').textContent = life.year;
    $('hud-pop').textContent = fmt(s.pop);
    $('hud-realms').textContent = s.realms.length;
    $('hud-villages').textContent = s.villages;
    $('hud-cities').textContent = s.cities;
    $('hud-era').textContent = ERAS[s.era].short;
    $('hud-wars').textContent = s.wars;
    const spaceInfo = $('hud-space');
    if (s.moonBases || s.marsBases) {
        spaceInfo.parentElement.style.display = '';
        spaceInfo.textContent = fmt(s.moonPop + s.marsPop);
    } else spaceInfo.parentElement.style.display = 'none';
    const al = $('alien-note');
    if (s.aliens) {
        al.style.display = '';
        al.textContent = s.aliens.state === 'approach' ? '🛸 Něco se blíží…'
            : s.aliens.friendly ? '🛸 Mimozemšťané obchodují' : '🛸 Mimozemský útok!';
        al.className = 'alien-note ' + (s.aliens.friendly ? 'good' : 'bad');
    } else al.style.display = 'none';

    $('faith-fill').style.width = (life.godMode ? 100 : clamp(life.faith / life.faithMax, 0, 1) * 100) + '%';
    $('faith-text').textContent = life.godMode ? '♾️ nekonečná víra' : `${life.faith | 0} / ${life.faithMax | 0} víry`;
    $('believers').textContent = life.believers;

    document.querySelectorAll('.tool').forEach(e => {
        e.classList.toggle('locked', !life.godMode && TOOL_MAP[e.dataset.id].cost > life.faith);
    });
    if (!$('tab-realms').hidden) renderRealms(s);
    if (!$('tab-state').hidden) renderState();
}

function renderState() {
    const el = $('tab-state');
    const r = life.player;
    if (!r) {
        el.innerHTML = `<div class="empty"><b>Zatím nemáš vlastní stát.</b><br><br>
            Vezmi nástroj 🏳️ <b>Můj stát</b> a klikni na cizí říši (převezmeš vládu),
            nebo na prázdnou souš (založíš vlastní).<br><br>
            Pak si tady stavíš armádu a nástrojem 🎯 <b>Útok</b> ji posíláš na nepřátele.</div>`;
        return;
    }
    let cities = 0, pop = 0;
    for (const vid of r.villages) { const v = life.villageById(vid); if (v) { cities++; pop += v.pop; } }
    let myArmies = 0, myPower = 0;
    for (const a of life.armies) if (!a.dead && a.realm === r.id) { myArmies++; myPower += a.strength; }

    let html = `<div class="mystate" style="border-color:${r.color}">
        <div class="realm-head"><span class="chip" style="background:${r.color}"></span><b>${r.name}</b><em>${RACES[r.race].emoji}</em></div>
        <div class="realm-sub">${r.ruler ? (r.ruler.female ? 'královna ' : 'král ') + r.ruler.name : ''} · ${ERAS[r.era].icon} ${ERAS[r.era].name}</div>
        <div class="stats-row">
            <div><b>${fmt(pop)}</b><span>obyvatel</span></div>
            <div><b>${cities}</b><span>měst</span></div>
            <div><b>${fmt(r.gold)}</b><span>🪙 zlato</span></div>
            <div><b>${fmt(myPower)}</b><span>⚔️ síla (${myArmies})</span></div>
        </div></div>`;

    html += '<h4>Výroba jednotek</h4><div class="units">';
    for (const [k, u] of Object.entries(UNIT_KINDS)) {
        const locked = r.era < u.era;
        const poor = !life.godMode && r.gold < u.gold;
        html += `<button class="unit ${locked ? 'locked' : poor ? 'poor' : ''}" data-unit="${k}"
            title="${locked ? 'Odemkne se v době: ' + ERAS[u.era].name : 'Síla ' + u.pow + '×'}">
            <i>${u.icon}</i><span>${u.name}</span><b>${fmt(u.gold)} 🪙</b></button>`;
    }
    html += '</div>';

    const enemies = life.realms.filter(x => !x.dead && x.id !== r.id);
    html += '<h4>Diplomacie</h4>';
    if (!enemies.length) html += '<div class="empty">Nikdo jiný na světě není.</div>';
    for (const e of enemies.slice(0, 10)) {
        const war = r.wars.has(e.id);
        html += `<div class="diplo"><span class="chip" style="background:${e.color}"></span>
            <b>${e.name}</b><em>${fmt(e.pop || 0)}</em>
            <button data-diplo="${e.id}" class="${war ? 'war' : ''}">${war ? '🕊️ mír' : '⚔️ válku'}</button></div>`;
    }
    html += `<button class="wide" id="btn-gift">💰 Vzít si 5 000 zlata (boží dar)</button>`;
    el.innerHTML = html;

    el.querySelectorAll('.unit').forEach(b => b.addEventListener('click', () => {
        const res = life.produceUnit(b.dataset.unit);
        if (res === 'era') toast('Tuhle techniku tvá říše ještě neumí – potřebuješ vyšší dobu');
        else if (res === 'gold') toast('Málo zlata v pokladně');
        else if (res === 'norealm') toast('Nemáš vlastní stát');
        else { toast('Jednotka postavena – pošli ji nástrojem 🎯 Útok'); renderState(); }
    }));
    el.querySelectorAll('[data-diplo]').forEach(b => b.addEventListener('click', () => {
        const e = life.realmById(parseInt(b.dataset.diplo, 10));
        if (!e) return;
        if (r.wars.has(e.id)) life.makePeace(r, e); else life.declareWar(r, e);
        renderState();
    }));
    $('btn-gift').addEventListener('click', () => { r.gold += 5000; renderState(); toast('💰 Pokladna posílena'); });
}

function renderRealms(s) {
    const el = $('tab-realms');
    let html = '';
    if (!s.realms.length) html += '<div class="empty">Zatím tu není žádné království.<br>Vezmi 🧑 <b>Lidi</b> a klikni na souš.</div>';
    for (const r of s.realms.slice().sort((a, b) => b.villages.length - a.villages.length)) {
        const wars = [...r.wars].map(id => { const o = life.realmById(id); return o ? o.name : null; }).filter(Boolean);
        const next = ERAS[r.era + 1];
        const prog = next ? clamp((r.research - ERAS[r.era].cost) / (next.cost - ERAS[r.era].cost), 0, 1) : (r.moon ? 1 : clamp(r.space / 100, 0, 1));
        html += `<div class="realm" data-realm="${r.id}">
            <div class="realm-head"><span class="chip" style="background:${r.color}"></span>
                <b>${r.player ? '⭐ ' : ''}${r.name}</b><em>${RACES[r.race].emoji}${r.moon ? ' 🚀' : ''}</em></div>
            <div class="realm-sub">${r.ruler ? (r.ruler.female ? 'královna ' : 'král ') + r.ruler.name : ''} · ${ERAS[r.era].icon} ${ERAS[r.era].name}</div>
            <div class="realm-meta">
                <span>🏘️ ${r.villages.length}</span><span>🧑 ${fmt(r.pop || 0)}</span>
                <span>🪙 ${fmt(r.gold)}</span><span>🔫 ${WEAPONS[r.era]}</span>
                ${r.moonBase ? `<span>🌕 ${r.moonBase}</span>` : ''}${r.marsBase ? `<span>🔴 ${r.marsBase}</span>` : ''}</div>
            <div class="era-bar"><i style="width:${(prog * 100) | 0}%;background:${r.color}"></i></div>
            ${wars.length ? `<div class="war">⚔️ válka: ${wars.join(', ')}</div>` : '<div class="peace">🕊️ mír</div>'}
        </div>`;
    }
    html += `<div class="side-stats">
        <div><b>${fmt(s.pop)}</b><span>obyvatel</span></div>
        <div><b>${fmt(s.army)}</b><span>⚔️ v poli</span></div>
        <div><b>${s.houses}</b><span>staveb</span></div>
        <div><b>${s.farms}</b><span>🌾 polí</span></div>
        <div><b>${fmt(s.gold)}</b><span>🪙 zlato</span></div>
        <div><b>${fmt(s.wood)}</b><span>🪵 dřevo</span></div>
        <div><b>${s.animals}</b><span>zvířat</span></div>
        ${s.zombies ? `<div><b>${s.zombies}</b><span>🧟 nemrtvých</span></div>` : ''}
        <div><b>${fmt(life.stats.peak)}</b><span>vrchol populace</span></div>
        <div><b>${fmt(life.stats.warDead)}</b><span>padlých ve válce</span></div>
        <div><b>${fmt(life.stats.godDead)}</b><span>od tvé ruky</span></div>
        <div><b>${life.stats.captured}</b><span>dobytých měst</span></div>
        <div><b>${life.stats.wars}</b><span>válek celkem</span></div>
        <div><b>${s.moon}</b><span>🚀 říší ve vesmíru</span></div>
        <div><b>${fmt(s.moonPop + s.marsPop)}</b><span>🌕 lidí v koloniích</span></div>
    </div>`;
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

/* ---------------- grafy ---------------- */

function drawChart(canvas, series, opts = {}) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, 0, W, H);
    let max = opts.min || 1;
    for (const s of series) for (const v of s.data) if (v > max) max = v;
    const n = Math.max(...series.map(s => s.data.length), 2);
    // mřížka
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) {
        const y = H * k / 4;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (const s of series) {
        if (s.data.length < 2) continue;
        ctx.beginPath();
        for (let i = 0; i < s.data.length; i++) {
            const x = (i / (n - 1)) * W, y = H - (s.data[i] / max) * (H - 6) - 3;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width || 1.6;
        ctx.stroke();
        if (s.fill) {
            ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
            ctx.fillStyle = s.fill; ctx.fill();
        }
    }
    ctx.fillStyle = 'rgba(223,230,247,0.55)';
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillText('max ' + Math.round(max), 4, 11);
}

function renderCharts() {
    if ($('tab-charts').hidden) return;
    const h = life.hist;
    if (!h.t.length) return;

    const realmSeries = [];
    for (const [id, s] of h.realms) {
        if (s.data.every(v => v === 0)) continue;
        realmSeries.push({ data: s.data, color: s.color, name: s.name });
    }
    drawChart($('chart-realms'), realmSeries.length ? realmSeries : [{ data: h.pop, color: '#6ee7a8' }]);
    drawChart($('chart-pop'), [
        { data: h.pop, color: '#6ee7a8', fill: 'rgba(110,231,168,0.14)' },
        { data: h.villages.map(v => v * 5), color: '#7cc4ff' }
    ]);
    drawChart($('chart-eco'), [
        { data: h.gold, color: '#ffd166' },
        { data: h.food, color: '#8ac926' },
        { data: h.wood, color: '#c98f5a' }
    ]);
    drawChart($('chart-wars'), [{ data: h.wars, color: '#ff7b7b', fill: 'rgba(255,123,123,0.15)' }], { min: 2 });

    const legend = realmSeries.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('');
    $('legend-realms').innerHTML = legend || '<span>zatím nikdo</span>';
    $('charts-note').textContent = `${h.t.length} záznamů · poslední rok ${h.t[h.t.length - 1]}`;
}

const MILE_ORDER = [
    ['city', '🏙️ První velké město'], ['metro', '🌆 První metropole'], ['uni', '🎓 První univerzita'],
    ['factory', '🏭 První továrna'], ['spaceport', '🚀 První kosmodrom'], ['moon', '🌕 Přistání na Měsíci']
];

function renderMiles() {
    if ($('tab-miles').hidden) return;
    let html = '<h4>Dějinné milníky</h4>';
    for (let e = 0; e < ERAS.length; e++) {
        const y = life.milestones['era' + e];
        html += `<div class="mile ${y !== undefined || e === 0 ? 'done' : ''}">
            <span>${ERAS[e].icon}</span><b>${ERAS[e].name}</b>
            <em>${e === 0 ? 'od počátku' : (y !== undefined ? y + '. rok' : '–')}</em></div>`;
    }
    html += '<h4>Události</h4>';
    for (const [key, label] of MILE_ORDER) {
        const y = life.milestones[key];
        html += `<div class="mile ${y !== undefined ? 'done' : ''}"><span></span><b>${label}</b>
            <em>${y !== undefined ? y + '. rok' : '–'}</em></div>`;
    }
    const moonRealms = life.realms.filter(r => r.moon && !r.dead);
    if (moonRealms.length) html += `<div class="mile done"><span>🌕</span><b>Na Měsíci byli:</b><em>${moonRealms.map(r => r.name).join(', ')}</em></div>`;
    $('tab-miles').innerHTML = html;
}

function renderLog() {
    const el = $('log');
    while (logIndex < life.events.length) {
        const e = life.events[logIndex++];
        const d = document.createElement('div');
        d.className = 'ev ' + e.kind;
        d.innerHTML = `<time>${e.year}. rok</time>${e.text}`;
        el.appendChild(d);
        if (el.children.length > 160) el.removeChild(el.firstChild);
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
        const budget = performance.now() + 14;
        while (acc >= TICK_MS && steps < 24) {
            life.step(); acc -= TICK_MS; steps++;
            if (performance.now() > budget) { acc = 0; break; }
        }
    } else acc = 0;

    if (held && TOOL_MAP[tool].hold && now - lastApply > 90) {
        lastApply = now;
        use(renderer.brush.x + 0.5, renderer.brush.y + 0.5);
    }

    renderer.draw(speed > 0 ? clamp(acc / TICK_MS, 0, 1) : 1, speed === 0);

    if (frame % 12 === 0) renderHud();
    if (frame % 20 === 0 && renderer.selected) renderCard();
    if (frame % 30 === 0) { renderCharts(); renderMiles(); }
    if (life.dirtyLog) { renderLog(); life.dirtyLog = false; }
}

document.addEventListener('DOMContentLoaded', boot);
