'use strict';
/* Propojení simulace s uživatelským rozhraním. */

const WORLD_W = 320, WORLD_H = 200;
const $ = id => document.getElementById(id);

let world, sim, renderer;
let speed = 1;
let power = 'bless';
let brushR = 8;
let held = false, panning = false, spaceDown = false;
let lastPointer = { x: 0, y: 0 };
let logIndex = 0;
let hotkeys = [];

/* ---------------- start ---------------- */

function newWorld(seed) {
    world = new World(WORLD_W, WORLD_H, seed >>> 0);
    sim = new Sim(world, seed >>> 0);
    world.rain = parseInt($('rain').value, 10) / 100;
    world.climate = parseFloat($('climate').value);
    sim.mutationRate = parseInt($('mut').value, 10) / 100;
    sim.seedLife(180);
    const zoom = renderer ? renderer.cam.zoom : 0;
    renderer = new Renderer($('world'), $('minimap'), world, sim);
    renderer.cam.zoom = zoom ? Math.max(zoom, renderer.minZoom) : renderer.minZoom;
    renderer.clampCam();
    renderer.overlay = document.querySelector('.overlay-bar button.active')?.dataset.ov || 'normal';
    logIndex = 0;
    $('log').innerHTML = '';
    renderer.select(null);
    $('inspector').hidden = true;
    sim.log('🌍 Zrodil se nový svět. Semínko: ' + (seed >>> 0), 'good');
}

function boot() {
    buildPowers();
    buildOverlays();
    buildTabs();
    bindControls();
    bindCanvas();
    newWorld(parseInt($('seed').value, 10) || 1);
    selectPower('bless');
    if (!localStorage.getItem('bs-help-seen')) $('help').hidden = false;
    requestAnimationFrame(loop);
}

/* ---------------- panely ---------------- */

function buildPowers() {
    const groups = { create: $('powers-create'), terra: $('powers-terra'), doom: $('powers-doom') };
    hotkeys = [];
    for (const p of POWERS) {
        const el = document.createElement('button');
        el.className = 'power';
        el.dataset.id = p.id;
        const key = hotkeys.length < 10 ? (hotkeys.length + 1) % 10 : '';
        if (key !== '') hotkeys.push(p.id);
        el.innerHTML = `${p.emoji}${p.cost ? `<b>${p.cost}</b>` : ''}${key !== '' ? `<u>${key}</u>` : ''}`;
        el.title = `${p.name}${p.cost ? ' – ' + p.cost + ' víry' : ''}`;
        el.addEventListener('click', () => selectPower(p.id));
        el.addEventListener('mouseenter', () => showDesc(p));
        groups[p.group].appendChild(el);
    }
    $('powers-create').parentElement.addEventListener('mouseleave', () => showDesc(POWER_MAP[power]));
}

function showDesc(p) {
    $('power-desc').innerHTML = `<b>${p.emoji} ${p.name}${p.cost ? ` · ${p.cost} víry` : ''}</b>${p.desc}${p.hold ? '<br><i style="color:#7cc4ff">Můžeš držet a táhnout.</i>' : ''}`;
}

function selectPower(id) {
    power = id;
    document.querySelectorAll('.power').forEach(el => el.classList.toggle('active', el.dataset.id === id));
    showDesc(POWER_MAP[id]);
    const p = POWER_MAP[id];
    renderer.brush.color = p.group === 'doom' ? '#ff9a9a' : p.group === 'terra' ? '#b0e0a0' : '#ffe6a0';
}

function buildOverlays() {
    const bar = $('overlay-bar');
    for (const o of OVERLAYS) {
        const b = document.createElement('button');
        b.textContent = `${o.icon} ${o.name}`;
        b.dataset.ov = o.id;
        if (o.id === 'normal') b.classList.add('active');
        b.addEventListener('click', () => {
            renderer.overlay = o.id;
            bar.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
        });
        bar.appendChild(b);
    }
}

function buildTabs() {
    $('tabs').addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        $('tabs').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
        for (const t of ['world', 'species', 'log']) $('tab-' + t).hidden = t !== b.dataset.tab;
    });
}

function bindControls() {
    $('brush').addEventListener('input', e => {
        brushR = parseInt(e.target.value, 10);
        $('brush-val').textContent = brushR;
        renderer.brush.r = brushR;
    });
    $('climate').addEventListener('input', e => {
        world.climate = parseFloat(e.target.value);
        $('climate-val').textContent = (world.climate > 0 ? '+' : '') + world.climate + ' °C';
    });
    $('rain').addEventListener('input', e => {
        world.rain = parseInt(e.target.value, 10) / 100;
        $('rain-val').textContent = e.target.value + ' %';
    });
    $('mut').addEventListener('input', e => {
        sim.mutationRate = parseInt(e.target.value, 10) / 100;
        $('mut-val').textContent = e.target.value + ' %';
    });
    $('speeds').addEventListener('click', e => {
        const b = e.target.closest('button[data-speed]');
        if (!b) return;
        speed = parseInt(b.dataset.speed, 10);
        $('speeds').querySelectorAll('button[data-speed]').forEach(x => x.classList.toggle('active', x === b));
    });
    $('btn-new').addEventListener('click', () => {
        newWorld(parseInt($('seed').value, 10) || Date.now() & 0xffff);
        toast('🌍 Nový svět je na světě');
    });
    $('btn-life').addEventListener('click', () => {
        sim.seedLife(180);
        toast('🐣 Zasel jsi nový život');
    });
    $('btn-help').addEventListener('click', () => { $('help').hidden = false; });
    $('help-close').addEventListener('click', () => {
        $('help').hidden = true;
        localStorage.setItem('bs-help-seen', '1');
    });

    window.addEventListener('resize', () => renderer.resize());
    window.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT') return;
        if (e.code === 'Space') { e.preventDefault(); spaceDown = true; togglePause(); }
        if (e.key === 'h' || e.key === 'H') $('help').hidden = !$('help').hidden;
        if (e.key === 'Tab') { e.preventDefault(); cycleOverlay(); }
        const n = parseInt(e.key, 10);
        if (!isNaN(n) && e.key.length === 1) {
            const idx = n === 0 ? 9 : n - 1;
            if (hotkeys[idx]) selectPower(hotkeys[idx]);
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

function togglePause() {
    speed = speed === 0 ? 1 : 0;
    $('speeds').querySelectorAll('button[data-speed]').forEach(x =>
        x.classList.toggle('active', parseInt(x.dataset.speed, 10) === speed));
}

function cycleOverlay() {
    const bar = $('overlay-bar');
    const btns = [...bar.querySelectorAll('button')];
    const i = btns.findIndex(b => b.classList.contains('active'));
    btns[(i + 1) % btns.length].click();
}

/* ---------------- ovládání myší ---------------- */

function bindCanvas() {
    const cv = $('world');
    cv.addEventListener('contextmenu', e => e.preventDefault());

    cv.addEventListener('pointerdown', e => {
        cv.setPointerCapture(e.pointerId);
        lastPointer = { x: e.offsetX, y: e.offsetY };
        if (e.button === 2 || e.button === 1 || spaceDown) { panning = true; return; }
        const wx = renderer.s2wx(e.offsetX), wy = renderer.s2wy(e.offsetY);
        applyAt(wx, wy);
        held = true;
    });

    cv.addEventListener('pointermove', e => {
        const wx = renderer.s2wx(e.offsetX), wy = renderer.s2wy(e.offsetY);
        renderer.brush.x = wx; renderer.brush.y = wy; renderer.brush.show = true;
        if (panning) {
            renderer.cam.x -= (e.offsetX - lastPointer.x) / renderer.cam.zoom;
            renderer.cam.y -= (e.offsetY - lastPointer.y) / renderer.cam.zoom;
            renderer.clampCam();
        }
        lastPointer = { x: e.offsetX, y: e.offsetY };
        updateTooltip(e.offsetX, e.offsetY, wx, wy);
    });

    const stop = () => { held = false; panning = false; };
    cv.addEventListener('pointerup', stop);
    cv.addEventListener('pointercancel', stop);
    cv.addEventListener('pointerleave', () => {
        stop();
        renderer.brush.show = false;
        $('tooltip').style.display = 'none';
    });

    cv.addEventListener('wheel', e => {
        e.preventDefault();
        renderer.zoomAt(e.offsetX, e.offsetY, e.deltaY < 0 ? 1.16 : 1 / 1.16);
    }, { passive: false });
}

function applyAt(wx, wy) {
    if (wx < 0 || wy < 0 || wx >= world.w || wy >= world.h) return;
    const p = POWER_MAP[power];
    if (p.id === 'inspect') {
        renderer.select(renderer.creatureAt(wx, wy));
        renderInspector();
        return;
    }
    if (sim.faith < p.cost) {
        toast('🙏 Málo víry – získej věřící zázraky nebo počkej na modlitby');
        $('faith-bar').classList.remove('flash');
        void $('faith-bar').offsetWidth;
        $('faith-bar').classList.add('flash');
        return;
    }
    usePower(sim, power, wx, wy, brushR, 1);
}

let toastTimer = null;
function toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function updateTooltip(sx, sy, wx, wy) {
    const tip = $('tooltip');
    if (wx < 0 || wy < 0 || wx >= world.w || wy >= world.h) { tip.style.display = 'none'; return; }
    const xi = wx | 0, yi = wy | 0, i = yi * world.w + xi;
    const alt = Math.round((world.height[i] - world.seaLevel) * 4000);
    const t = world.tempAt(xi, yi, i);
    const c = renderer.creatureAt(wx, wy);
    let text = `${alt >= 0 ? '⛰️ ' + alt + ' m n. m.' : '🌊 ' + (-alt) + ' m pod hladinou'}\n` +
        `🌡️ ${t.toFixed(1)} °C   🌿 ${(world.veg[i] * 100) | 0} %\n` +
        `💧 vláha ${(world.moist[i] * 100) | 0} %   🌾 půda ${(world.fert[i] * 100) | 0} %`;
    if (world.water[i] > 0.02) text += `\n🌊 hloubka ${(world.water[i] * 4000) | 0} m`;
    if (world.rad[i] > 0.02) text += `\n☢️ radiace ${(world.rad[i] * 100) | 0} %`;
    if (c) {
        const sp = sim.getSpecies(c.sp);
        text += `\n──────────\n${c.carn ? '🦷' : '🌿'} ${sp ? sp.name : '?'} · ${c.gen}. generace\n` +
            `❤️ ${(100 * c.energy / c.maxE) | 0} %  ⏳ ${c.age}/${c.lifespan | 0}${c.sick ? '  🦠 nemocný' : ''}${c.faith > 0.35 ? '  🙏 věřící' : ''}`;
    }
    tip.textContent = text;
    tip.style.display = 'block';
    const box = $('box').getBoundingClientRect();
    tip.style.left = Math.min(sx + 16, box.width - 190) + 'px';
    tip.style.top = Math.min(sy + 16, box.height - 100) + 'px';
}

/* ---------------- vykreslování panelů ---------------- */

function renderInspector() {
    const el = $('inspector');
    const c = renderer.validSelection();
    if (!c) { el.hidden = true; return; }
    const sp = sim.getSpecies(c.sp);
    let genes = '';
    for (let k = 0; k < GENE_COUNT; k++) {
        genes += `<div class="gene"><span>${GENE_INFO[k].icon} ${GENE_INFO[k].name}</span>` +
            `<div class="bar"><i style="width:${(c.g[k] * 100) | 0}%"></i></div><em>${(c.g[k] * 100) | 0}</em></div>`;
    }
    el.innerHTML = `<h5><span class="chip" style="background:${sp ? sp.color : '#fff'}"></span>${sp ? sp.name : '?'}
        <button class="close" title="Zavřít">✕</button></h5>
        <div class="row"><span>strava</span><b>${c.carn ? 'masožravec' : c.g[G_AGGR] > 0.3 ? 'všežravec' : 'býložravec'}</b></div>
        <div class="row"><span>generace</span><b>${c.gen}.</b></div>
        <div class="row"><span>věk</span><b>${c.age} / ${c.lifespan | 0}</b></div>
        <div class="row"><span>energie</span><b>${(100 * c.energy / c.maxE) | 0} %</b></div>
        <div class="row"><span>víra</span><b>${(c.faith * 100) | 0} %</b></div>
        <div class="row"><span>stav</span><b>${c.sick ? '🦠 nemocný' : c.imm ? '💪 imunní' : 'zdravý'}</b></div>
        <div style="margin-top:.4rem">${genes}</div>`;
    el.hidden = false;
    el.querySelector('.close').addEventListener('click', () => { renderer.select(null); el.hidden = true; });
}

function renderHud() {
    const s = sim.stats();
    $('hud-year').textContent = world.year;
    $('hud-pop').textContent = s.pop;
    $('hud-species').textContent = s.species;
    $('hud-gen').textContent = sim.generation;
    $('hud-believers').textContent = sim.believers;

    let tsum = 0, n = 0;
    for (let y = 4; y < world.h; y += 9) for (let x = 4; x < world.w; x += 9) { tsum += world.tempAt(x, y, y * world.w + x); n++; }
    $('hud-temp').textContent = (tsum / n).toFixed(1) + ' °C';

    const pct = clamp(sim.faith / sim.faithMax, 0, 1) * 100;
    $('faith-fill').style.width = pct + '%';
    $('faith-text').textContent = `${sim.faith | 0} / ${sim.faithMax | 0} víry`;
    $('align-love').style.setProperty('--v', (sim.love * 100) + '%');
    $('align-fear').style.setProperty('--v', (sim.fear * 100) + '%');
    $('align-label').textContent =
        sim.love < 0.04 && sim.fear < 0.04 ? 'neznámý bůh' :
        sim.love > sim.fear * 1.6 ? 'milovaný bůh' :
        sim.fear > sim.love * 1.6 ? 'obávaný bůh' : 'rozporuplný bůh';

    document.querySelectorAll('.power').forEach(el => {
        el.classList.toggle('locked', POWER_MAP[el.dataset.id].cost > sim.faith);
    });

    $('stats').innerHTML = [
        ['vrchol populace', sim.peakPop], ['narozeno celkem', sim.born],
        ['zemřelo celkem', sim.died], ['dravců', s.carn],
        ['nemocných', s.sick], ['sídel', s.structures],
        ['chrámů', s.temples], ['modlitby', sim.prayers.toFixed(2) + '/tik'],
        ['hladina moře', ((world.seaLevel - world.baseSea) * 4000).toFixed(0) + ' m'],
        ['popel v ovzduší', world.dust.toFixed(1) + ' °C']
    ].map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('');

    let genes = '';
    for (let k = 0; k < GENE_COUNT; k++) {
        const v = (s.genes[k] * 100) | 0;
        genes += `<div class="gene"><span>${GENE_INFO[k].icon} ${GENE_INFO[k].name}</span>` +
            `<div class="bar"><i style="width:${v}%"></i></div><em>${v}</em></div>`;
    }
    $('genes').innerHTML = genes;

    const b = $('banner');
    if (s.pop === 0) {
        b.textContent = '☠️ Svět je bez života. Vyber 🐣 Stvořit život a klikni na souš.';
        b.classList.add('show');
    } else b.classList.remove('show');
}

function renderSpecies() {
    const el = $('tab-species');
    if (el.hidden) return;
    const live = sim.species.filter(s => !s.extinct && s.count > 0).sort((a, b) => b.count - a.count);
    const dead = sim.species.filter(s => s.extinct && s.peak >= 8).length;
    let html = `<h4>Žijící druhy (${live.length})</h4>`;
    if (!live.length) html += '<div class="card">Nikdo tu není. Zkus stvořit život.</div>';
    for (const sp of live.slice(0, 14)) {
        const carn = sp.genes[G_AGGR] > 0.55;
        html += `<div class="sp-row" data-sp="${sp.id}">
            <div class="sp-head"><span class="chip" style="background:${sp.color}"></span>
                <b>${carn ? '🦷 ' : ''}${sp.name}</b><em>${sp.count}</em></div>
            <div class="sp-meta"><span>vznik: ${sp.born}. rok</span><span>vrchol: ${sp.peak}</span>
                <span>${sp.genes[G_SWIM] > 0.6 ? '🌊 vodní' : sp.genes[G_INTEL] > 0.55 ? '🧠 chytrý' : ''}</span></div>
            <div class="sp-bars">
                ${[G_SIZE, G_SPEED, G_INTEL, G_AGGR, G_COLD, G_HEAT, G_SWIM].map(g =>
                    `<i title="${GENE_INFO[g].name}: ${(sp.genes[g] * 100) | 0}%" style="--v:${(sp.genes[g] * 100) | 0}%"></i>`).join('')}
            </div></div>`;
    }
    html += `<h4>Vyhynulé druhy: ${dead}</h4>`;
    el.innerHTML = html;
    el.querySelectorAll('.sp-row').forEach(row => row.addEventListener('click', () => {
        const id = parseInt(row.dataset.sp, 10);
        for (const c of sim.list) {
            if (c.alive && c.sp === id) {
                renderer.cam.x = c.x; renderer.cam.y = c.y;
                renderer.cam.zoom = Math.max(renderer.cam.zoom, 7);
                renderer.clampCam();
                renderer.select(c);
                renderInspector();
                break;
            }
        }
    }));
}

function renderLog() {
    const el = $('log');
    while (logIndex < sim.events.length) {
        const e = sim.events[logIndex++];
        const d = document.createElement('div');
        d.className = 'ev ' + e.kind;
        d.innerHTML = `<time>${e.year}. rok</time>${e.text}`;
        el.appendChild(d);
        if (el.children.length > 160) el.removeChild(el.firstChild);
    }
}

function renderGraph() {
    const cv = $('graph'), ctx = cv.getContext('2d');
    const h = sim.history;
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    if (h.pop.length < 2) return;
    const n = h.pop.length;
    const maxPop = Math.max(10, ...h.pop);
    const maxSp = Math.max(3, ...h.species);
    const line = (arr, max, color, fill) => {
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const x = i / (n - 1) * W, y = H - (arr[i] / max) * (H - 6) - 3;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
        if (fill) {
            ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
            ctx.fillStyle = fill; ctx.fill();
        }
    };
    line(h.pop, maxPop, '#6ee7a8', 'rgba(110,231,168,0.12)');
    line(h.species, maxSp, '#7cc4ff');
    line(h.faith, Math.max(50, sim.faithMax), '#ffd166');
    ctx.fillStyle = 'rgba(223,230,247,0.5)';
    ctx.font = '9px sans-serif';
    ctx.fillText('max ' + maxPop, 4, 10);
}

/* ---------------- smyčka ---------------- */

let frame = 0;
function loop() {
    requestAnimationFrame(loop);
    frame++;

    if (speed > 0) {
        const t0 = performance.now();
        for (let i = 0; i < speed; i++) {
            sim.step();
            if (performance.now() - t0 > 22) break;    // radši nižší rychlost než trhání
        }
    }
    if (held && POWER_MAP[power].hold && frame % 6 === 0) applyAt(renderer.brush.x, renderer.brush.y);

    renderer.draw(speed === 0);

    if (frame % 10 === 0) renderHud();
    if (frame % 30 === 0) { renderSpecies(); renderGraph(); }
    if (sim.dirtyLog) { renderLog(); sim.dirtyLog = false; }
    if (frame % 15 === 0 && renderer.selected) renderInspector();
}

document.addEventListener('DOMContentLoaded', boot);
