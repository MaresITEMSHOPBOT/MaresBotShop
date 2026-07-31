'use strict';
/* Vykreslování. Terén se kreslí do vyrovnávací plochy a překresluje se jen tam,
   kde se něco změnilo. Panáčci se mezi tiky plynule dopočítávají. */

let TPX = 14;                        // velikost dlaždice ve vyrovnávací ploše (px)
function setTilePx(worldW) { TPX = Math.round(clamp(2400 / worldW, 7, 14)); }

const MAP_MODES = [
    { id: 'normal', name: 'Krajina', icon: '🗺️' },
    { id: 'realms', name: 'Říše', icon: '👑' },
    { id: 'temp', name: 'Teplota', icon: '🌡️' },
    { id: 'space', name: 'Vesmír', icon: '🌌' }
];

function hash01(i) { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }

class Renderer {
    constructor(canvas, mini, world, life) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.mini = mini;
        this.mctx = mini.getContext('2d');
        this.world = world;
        this.life = life;
        this.mode = 'normal';

        setTilePx(world.w);
        this.buf = document.createElement('canvas');
        this.buf.width = world.w * TPX; this.buf.height = world.h * TPX;
        this.bctx = this.buf.getContext('2d');

        this.clouds = document.createElement('canvas');     // mraky na hrubé mřížce
        this.clouds.width = world.cw; this.clouds.height = world.ch;
        this.cctx = this.clouds.getContext('2d');
        this.cimg = this.cctx.createImageData(world.cw, world.ch);

        this.terr = document.createElement('canvas');       // hranice království
        this.terr.width = world.w * TPX; this.terr.height = world.h * TPX;
        this.tctx = this.terr.getContext('2d');

        this.cam = { x: world.w / 2, y: world.h / 2, zoom: 8 };
        this.particles = [];
        this.frame = 0;
        this.dpr = Math.min(2, window.devicePixelRatio || 1);
        this.brush = { x: 0, y: 0, r: 4, show: false, color: '#fff' };
        this.selected = null;
        this.selectedUid = 0;
        this.labels = true;
        this.terrDirty = true;
        this.resize();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.vw = Math.max(200, rect.width);
        this.vh = Math.max(200, rect.height);
        this.canvas.width = Math.floor(this.vw * this.dpr);
        this.canvas.height = Math.floor(this.vh * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.minZoom = Math.min(this.vw / this.world.w, this.vh / this.world.h);
        this.cam.zoom = clamp(this.cam.zoom, this.minZoom, 30);
        this.clampCam();
    }

    clampCam() {
        const hw = this.vw / (2 * this.cam.zoom), hh = this.vh / (2 * this.cam.zoom);
        this.cam.x = clamp(this.cam.x, hw, this.world.w - hw);
        this.cam.y = clamp(this.cam.y, hh, this.world.h - hh);
        if (this.world.w * this.cam.zoom < this.vw) this.cam.x = this.world.w / 2;
        if (this.world.h * this.cam.zoom < this.vh) this.cam.y = this.world.h / 2;
    }

    w2sx(x) { return (x - this.cam.x) * this.cam.zoom + this.vw / 2; }
    w2sy(y) { return (y - this.cam.y) * this.cam.zoom + this.vh / 2; }
    s2wx(x) { return (x - this.vw / 2) / this.cam.zoom + this.cam.x; }
    s2wy(y) { return (y - this.vh / 2) / this.cam.zoom + this.cam.y; }

    zoomAt(sx, sy, f) {
        const wx = this.s2wx(sx), wy = this.s2wy(sy);
        this.cam.zoom = clamp(this.cam.zoom * f, this.minZoom, 30);
        this.cam.x = wx - (sx - this.vw / 2) / this.cam.zoom;
        this.cam.y = wy - (sy - this.vh / 2) / this.cam.zoom;
        this.clampCam();
    }

    select(u) { this.selected = u || null; this.selectedUid = u ? u.uid : 0; }

    validSelection() {
        const s = this.selected;
        if (!s) return null;
        if (s.kind === 'village') { if (s.v.dead) { this.selected = null; return null; } return s; }
        if (s.alive && s.uid === this.selectedUid) return s;
        this.selected = null;
        return null;
    }

    /* ---------------- kreslení dlaždic ---------------- */

    paintTile(i) {
        const w = this.world, c = this.bctx;
        const x = (i % w.w) * TPX, y = ((i / w.w) | 0) * TPX;
        const t = w.type[i];
        const r1 = hash01(i), r2 = hash01(i * 3 + 1), r3 = hash01(i * 7 + 5);

        switch (t) {
            case T.DEEP: {
                const d = clamp((w.seaLevel - w.height[i]) * 3, 0, 1);
                c.fillStyle = `rgb(${(18 - d * 8) | 0}, ${(52 - d * 20) | 0}, ${(92 - d * 26) | 0})`;
                c.fillRect(x, y, TPX, TPX);
                if (r1 > 0.93) { c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(x + 2, y + TPX * 0.5, TPX - 4, 1.5); }
                break;
            }
            case T.WATER: {
                c.fillStyle = '#2f6f9e';
                c.fillRect(x, y, TPX, TPX);
                if (r1 > 0.6) { c.fillStyle = 'rgba(255,255,255,0.09)'; c.fillRect(x + 2, y + 3 + r2 * (TPX - 6), TPX * 0.45, 1.4); }
                break;
            }
            case T.SAND: {
                c.fillStyle = '#dcc78c';
                c.fillRect(x, y, TPX, TPX);
                c.fillStyle = 'rgba(160,135,80,0.35)';
                c.fillRect(x + r1 * (TPX - 3), y + r2 * (TPX - 3), 2, 1.5);
                c.fillRect(x + r3 * (TPX - 3), y + r1 * (TPX - 3), 1.5, 1.5);
                break;
            }
            case T.GRASS: {
                const v = w.veg[i], n = (r2 - 0.5) * 12;
                c.fillStyle = `rgb(${(104 - v * 26 + n) | 0}, ${(152 + v * 10 + n) | 0}, ${(62 - v * 6 + n * 0.6) | 0})`;
                c.fillRect(x, y, TPX, TPX);
                c.fillStyle = 'rgba(60,105,40,0.4)';
                c.fillRect(x + 2 + r1 * (TPX - 5), y + 3 + r2 * (TPX - 6), 1.4, 2.4);
                c.fillRect(x + 2 + r3 * (TPX - 5), y + 2 + r1 * (TPX - 6), 1.4, 2);
                break;
            }
            case T.FOREST: {
                c.fillStyle = '#5b8f3e';
                c.fillRect(x, y, TPX, TPX);
                const trees = 2 + (r1 > 0.55 ? 1 : 0);
                for (let k = 0; k < trees; k++) {
                    const hx = x + 2.5 + hash01(i * 13 + k * 31) * (TPX - 6);
                    const hy = y + 3 + hash01(i * 17 + k * 11) * (TPX - 7);
                    const s = TPX * 0.26;
                    c.fillStyle = 'rgba(20,40,15,0.35)';
                    c.beginPath(); c.ellipse(hx, hy + s * 0.9, s * 0.8, s * 0.35, 0, 0, 6.3); c.fill();
                    c.fillStyle = '#5a4224';
                    c.fillRect(hx - 0.8, hy, 1.6, s * 0.9);
                    c.fillStyle = k % 2 ? '#2f6b2a' : '#3b7d31';
                    c.beginPath();
                    c.moveTo(hx, hy - s * 1.35); c.lineTo(hx + s, hy + s * 0.25); c.lineTo(hx - s, hy + s * 0.25);
                    c.closePath(); c.fill();
                }
                break;
            }
            case T.HILL: {
                const n = (r2 - 0.5) * 10;
                c.fillStyle = `rgb(${(126 + n) | 0}, ${(146 + n) | 0}, ${(78 + n * 0.6) | 0})`;
                c.fillRect(x, y, TPX, TPX);
                c.fillStyle = 'rgba(108,120,72,0.85)';
                c.beginPath();
                c.moveTo(x + TPX * 0.15, y + TPX * 0.8);
                c.quadraticCurveTo(x + TPX * 0.5, y + TPX * 0.28, x + TPX * 0.85, y + TPX * 0.8);
                c.closePath(); c.fill();
                c.fillStyle = 'rgba(255,255,255,0.13)';
                c.beginPath();
                c.moveTo(x + TPX * 0.3, y + TPX * 0.62);
                c.quadraticCurveTo(x + TPX * 0.5, y + TPX * 0.34, x + TPX * 0.6, y + TPX * 0.6);
                c.closePath(); c.fill();
                if (r1 > 0.5) { c.fillStyle = 'rgba(120,116,104,0.9)'; c.fillRect(x + r3 * (TPX - 4), y + TPX * 0.72, 2.5, 2); }
                break;
            }
            case T.MOUNT: {
                c.fillStyle = '#6f6d6b';
                c.fillRect(x, y, TPX, TPX);
                c.fillStyle = '#8d8b88';
                c.beginPath();
                c.moveTo(x + TPX * 0.5, y + TPX * 0.12);
                c.lineTo(x + TPX * 0.95, y + TPX * 0.9);
                c.lineTo(x + TPX * 0.05, y + TPX * 0.9);
                c.closePath(); c.fill();
                c.fillStyle = w.tempAt(i) < 4 ? '#f2f6fb' : '#a9a7a3';
                c.beginPath();
                c.moveTo(x + TPX * 0.5, y + TPX * 0.12);
                c.lineTo(x + TPX * 0.68, y + TPX * 0.42);
                c.lineTo(x + TPX * 0.32, y + TPX * 0.42);
                c.closePath(); c.fill();
                break;
            }
            case T.SNOW: {
                c.fillStyle = '#e6eef6';
                c.fillRect(x, y, TPX, TPX);
                c.fillStyle = 'rgba(160,190,220,0.5)';
                c.fillRect(x + r1 * (TPX - 3), y + r2 * (TPX - 3), 2, 1.5);
                break;
            }
            case T.LAVA: {
                const p = (w.tick * 0.12 + i) % 1;
                c.fillStyle = '#d63a10';
                c.fillRect(x, y, TPX, TPX);
                c.fillStyle = `rgba(255,${(170 + Math.sin(p * 6.3) * 50) | 0},60,0.85)`;
                c.beginPath(); c.ellipse(x + TPX * 0.5, y + TPX * 0.5, TPX * 0.34, TPX * 0.28, 0, 0, 6.3); c.fill();
                break;
            }
            case T.ASH: {
                c.fillStyle = '#4a423d';
                c.fillRect(x, y, TPX, TPX);
                c.fillStyle = 'rgba(20,18,16,0.7)';
                c.fillRect(x + r1 * (TPX - 4), y + r2 * (TPX - 4), 2.5, 2);
                break;
            }
            case T.CITY: {
                const d = w.dens[i] || 1;
                c.fillStyle = d >= 3 ? '#5f5b57' : '#7a736a';
                c.fillRect(x, y, TPX, TPX);
                c.fillStyle = 'rgba(0,0,0,0.18)';
                c.fillRect(x, y + TPX * 0.82, TPX, TPX * 0.18);
                const n = d + 1;
                for (let k = 0; k < n; k++) {
                    const hh = hash01(i * 31 + k * 17);
                    const bw = TPX * (0.2 + hh * 0.16);
                    const bx = x + 1 + hash01(i * 7 + k * 13) * (TPX - bw - 2);
                    const bh = TPX * (0.22 + d * 0.14 + hh * 0.16);
                    const by = y + TPX - bh - 1;
                    c.fillStyle = d >= 4 ? '#b9c3d2' : d >= 3 ? '#c7bda9' : '#c9a06a';
                    c.fillRect(bx, by, bw, bh);
                    c.fillStyle = 'rgba(0,0,0,0.28)';
                    c.fillRect(bx, by, bw, TPX * 0.06);
                    if (d >= 3 && TPX >= 10) {
                        c.fillStyle = 'rgba(255,225,140,0.85)';
                        for (let wy2 = by + 2; wy2 < by + bh - 1.5; wy2 += 3) {
                            for (let wx2 = bx + 1; wx2 < bx + bw - 1.5; wx2 += 3) {
                                if (hash01((wx2 * 13 + wy2 * 7) | 0) > 0.45) c.fillRect(wx2, wy2, 1.2, 1.2);
                            }
                        }
                    }
                }
                break;
            }
            case T.ROAD: {
                c.fillStyle = '#8a8177';
                c.fillRect(x, y, TPX, TPX);
                c.fillStyle = 'rgba(60,54,48,0.5)';
                c.fillRect(x, y + TPX * 0.42, TPX, TPX * 0.16);
                break;
            }
            case T.FARM: {
                c.fillStyle = '#b98c4a';
                c.fillRect(x, y, TPX, TPX);
                c.fillStyle = 'rgba(90,60,30,0.5)';
                for (let k = 2; k < TPX; k += 4) c.fillRect(x + 1, y + k, TPX - 2, 1.2);
                const v = w.veg[i];
                if (v > 0.2) {
                    c.fillStyle = `rgba(120,180,60,${0.3 + v * 0.5})`;
                    for (let k = 3; k < TPX; k += 4) c.fillRect(x + 2, y + k - 1, TPX - 4, 1.6);
                }
                break;
            }
        }

        // stínování svahů – mapa dostane hloubku
        if (t !== T.DEEP && t !== T.WATER && (i % w.w) > 0 && i >= w.w) {
            const dh = w.height[i] - w.height[i - w.w - 1];
            if (dh > 0.012) { c.fillStyle = `rgba(255,255,235,${Math.min(0.10, dh * 0.9)})`; c.fillRect(x, y, TPX, TPX); }
            else if (dh < -0.012) { c.fillStyle = `rgba(0,0,25,${Math.min(0.12, -dh * 1.1)})`; c.fillRect(x, y, TPX, TPX); }
        }

        // pobřeží: světlý lem tam, kde se voda potkává se souší
        if (t === T.WATER || t === T.DEEP) {
            let coast = false;
            w.neighbors(i, j => { if (!w.isWater(j)) coast = true; });
            if (coast) { c.fillStyle = 'rgba(190,220,240,0.20)'; c.fillRect(x, y, TPX, TPX); }
        }

        if (w.fire[i]) {
            const p = (w.tick * 0.2 + hash01(i) * 6) % 1;
            c.fillStyle = `rgba(255,${(120 + p * 90) | 0},40,0.85)`;
            c.beginPath();
            c.moveTo(x + TPX * 0.5, y + TPX * (0.08 + p * 0.1));
            c.lineTo(x + TPX * 0.82, y + TPX * 0.85);
            c.lineTo(x + TPX * 0.18, y + TPX * 0.85);
            c.closePath(); c.fill();
            c.fillStyle = 'rgba(255,235,150,0.9)';
            c.beginPath(); c.ellipse(x + TPX * 0.5, y + TPX * 0.65, TPX * 0.14, TPX * 0.2, 0, 0, 6.3); c.fill();
        }
    }

    flushTiles() {
        const w = this.world;
        if (w.allDirty) {
            for (let i = 0; i < w.n; i++) this.paintTile(i);
            w.allDirty = false;
            w.dirty.clear();
            this.terrDirty = true;
            return;
        }
        if (!w.dirty.size) return;
        for (const i of w.dirty) this.paintTile(i);
        w.dirty.clear();
    }

    /* ---------------- hranice království ---------------- */

    paintTerritory() {
        const w = this.world, c = this.tctx, life = this.life;
        c.clearRect(0, 0, this.terr.width, this.terr.height);
        const colors = new Map();
        for (const r of life.realms) if (!r.dead) colors.set(r.id, r.color);
        const b = Math.max(2, TPX * 0.16);
        for (let i = 0; i < w.n; i++) {
            const o = w.owner[i];
            if (!o) continue;
            const col = colors.get(o);
            if (!col) continue;
            const x = (i % w.w) * TPX, y = ((i / w.w) | 0) * TPX;
            c.globalAlpha = 0.16;
            c.fillStyle = col;
            c.fillRect(x, y, TPX, TPX);
            c.globalAlpha = 0.95;
            if ((i % w.w) === 0 || w.owner[i - 1] !== o) c.fillRect(x, y, b, TPX);
            if ((i % w.w) === w.w - 1 || w.owner[i + 1] !== o) c.fillRect(x + TPX - b, y, b, TPX);
            if (i < w.w || w.owner[i - w.w] !== o) c.fillRect(x, y, TPX, b);
            if (i >= w.n - w.w || w.owner[i + w.w] !== o) c.fillRect(x, y + TPX - b, TPX, b);
        }
        c.globalAlpha = 1;
        this.terrDirty = false;
    }

    /* ---------------- hlavní snímek ---------------- */

    draw(alpha, paused) {
        this.frame++;
        const ctx = this.ctx, cam = this.cam;
        if (this.mode === 'space') { this.flushTiles(); this.drawSpace(); this.drawGlass(); return; }
        this.flushTiles();
        if (this.life.territoryDirty) { this.life.territoryDirty = false; this.terrDirty = true; }
        if (this.terrDirty) this.paintTerritory();

        ctx.fillStyle = '#070a12';
        ctx.fillRect(0, 0, this.vw, this.vh);

        const sx = this.w2sx(0), sy = this.w2sy(0);
        const sw = this.world.w * cam.zoom, sh = this.world.h * cam.zoom;
        ctx.imageSmoothingEnabled = cam.zoom < TPX;
        ctx.drawImage(this.buf, sx, sy, sw, sh);

        if (this.mode === 'temp') this.drawTempOverlay();
        else {
            ctx.globalAlpha = this.mode === 'realms' ? 1 : 0.5;
            ctx.drawImage(this.terr, sx, sy, sw, sh);
            ctx.globalAlpha = 1;
        }
        ctx.imageSmoothingEnabled = true;

        this.drawClouds();
        this.drawHazards();
        this.drawBuildings();
        this.drawUnits(alpha);
        this.drawArmies();
        this.drawRockets();
        this.drawLabels();
        this.drawEffects(paused);
        this.drawBrush();
        this.drawGlass();
        if (this.frame % 10 === 0) this.drawMinimap();
    }

    drawTempOverlay() {
        const w = this.world, ctx = this.ctx, z = this.cam.zoom;
        const x0 = clamp(Math.floor(this.s2wx(0)), 0, w.w - 1), x1 = clamp(Math.ceil(this.s2wx(this.vw)), 1, w.w);
        const y0 = clamp(Math.floor(this.s2wy(0)), 0, w.h - 1), y1 = clamp(Math.ceil(this.s2wy(this.vh)), 1, w.h);
        ctx.globalAlpha = 0.55;
        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
                const t = w.tempAt(y * w.w + x);
                const f = clamp((t + 25) / 65, 0, 1);
                ctx.fillStyle = `rgb(${(255 * clamp(f * 1.7 - 0.3, 0, 1)) | 0},${(255 * clamp(1 - Math.abs(f - 0.5) * 2.2, 0, 1)) | 0},${(255 * clamp(1.4 - f * 2.2, 0, 1)) | 0})`;
                ctx.fillRect(this.w2sx(x), this.w2sy(y), z + 1, z + 1);
            }
        }
        ctx.globalAlpha = 1;
    }

    drawClouds() {
        const w = this.world, img = this.cimg, d = img.data;
        for (let i = 0; i < w.cloud.length; i++) {
            const c = clamp(w.cloud[i], 0, 1.4);
            const p = i * 4;
            const rain = w.rainfall[i] > 0.2;
            d[p] = rain ? 150 : 245; d[p + 1] = rain ? 158 : 248; d[p + 2] = rain ? 175 : 255;
            d[p + 3] = Math.min(215, c * 165) | 0;
        }
        this.cctx.putImageData(img, 0, 0);
        const ctx = this.ctx, z = this.cam.zoom;
        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(this.clouds, this.w2sx(0), this.w2sy(0), w.w * z, w.h * z);
        ctx.restore();
    }

    /* pohled do vesmíru: Země, Měsíc s koloniemi, Mars a lodě mezi nimi */
    drawSpace() {
        const ctx = this.ctx, life = this.life, W = this.vw, H = this.vh;
        ctx.fillStyle = '#03040a';
        ctx.fillRect(0, 0, W, H);
        if (!this.stars) {
            this.stars = [];
            for (let k = 0; k < 260; k++) this.stars.push({ x: Math.random(), y: Math.random(), s: Math.random() * 1.6 + 0.3 });
        }
        ctx.fillStyle = '#fff';
        for (const st of this.stars) {
            ctx.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(this.frame * 0.01 + st.x * 20));
            ctx.fillRect(st.x * W, st.y * H, st.s, st.s);
        }
        ctx.globalAlpha = 1;

        const s = life.summary();
        const ex = W * 0.32, ey = H * 0.55, er = Math.min(W, H) * 0.19;
        // Země – uvnitř koule je skutečná mapa světa
        ctx.save();
        ctx.beginPath(); ctx.arc(ex, ey, er, 0, 6.3); ctx.clip();
        ctx.drawImage(this.buf, ex - er, ey - er * 0.62, er * 2, er * 1.24);
        ctx.globalAlpha = 0.55;
        ctx.drawImage(this.clouds, ex - er, ey - er * 0.62, er * 2, er * 1.24);
        ctx.globalAlpha = 1;
        const g = ctx.createRadialGradient(ex - er * 0.3, ey - er * 0.3, er * 0.1, ex, ey, er);
        g.addColorStop(0, 'rgba(255,255,255,0.18)');
        g.addColorStop(0.75, 'rgba(0,0,20,0.1)');
        g.addColorStop(1, 'rgba(0,0,25,0.85)');
        ctx.fillStyle = g; ctx.fillRect(ex - er, ey - er, er * 2, er * 2);
        ctx.restore();
        ctx.strokeStyle = 'rgba(120,180,255,0.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ex, ey, er, 0, 6.3); ctx.stroke();

        const label = (x, y, t1, t2) => {
            ctx.textAlign = 'center';
            ctx.font = '700 14px system-ui, sans-serif';
            ctx.fillStyle = '#fff'; ctx.fillText(t1, x, y);
            ctx.font = '11px system-ui, sans-serif';
            ctx.fillStyle = 'rgba(200,215,240,0.85)'; ctx.fillText(t2, x, y + 15);
            ctx.textAlign = 'left';
        };
        label(ex, ey + er + 24, '🌍 Země', `${fmt(s.pop)} obyvatel`);

        // Měsíc
        const mx = W * 0.63, my = H * 0.3, mr = Math.min(W, H) * 0.075;
        ctx.fillStyle = '#c9c6c0';
        ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.3); ctx.fill();
        ctx.fillStyle = 'rgba(120,116,110,0.6)';
        for (let k = 0; k < 7; k++) {
            const a = k * 1.7, d = mr * (0.2 + (k % 3) * 0.25);
            ctx.beginPath(); ctx.arc(mx + Math.cos(a) * d, my + Math.sin(a) * d, mr * (0.08 + (k % 4) * 0.04), 0, 6.3); ctx.fill();
        }
        let bi = 0;
        for (const r of life.realms) {
            if (r.dead || !r.moonBase) continue;
            for (let k = 0; k < r.moonBase; k++) {
                const a = -2.6 + bi * 0.28;
                const bx = mx + Math.cos(a) * mr * 0.82, by = my + Math.sin(a) * mr * 0.82;
                ctx.fillStyle = r.color;
                ctx.beginPath(); ctx.arc(bx, by, 4, Math.PI, 0); ctx.fill();
                ctx.fillRect(bx - 4, by, 8, 2);
                bi++;
            }
        }
        label(mx, my + mr + 22, '🌕 Měsíc', s.moonBases ? `${s.moonBases} základen · ${fmt(s.moonPop)} lidí` : 'zatím pustý');

        // Mars
        const rx = W * 0.82, ry = H * 0.56, rr = Math.min(W, H) * 0.09;
        const rg = ctx.createRadialGradient(rx - rr * 0.3, ry - rr * 0.3, rr * 0.2, rx, ry, rr);
        rg.addColorStop(0, '#e08b5a'); rg.addColorStop(1, '#8d3d24');
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(rx, ry, rr, 0, 6.3); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.ellipse(rx, ry - rr * 0.8, rr * 0.35, rr * 0.15, 0, 0, 6.3); ctx.fill();
        let mi = 0;
        for (const r of life.realms) {
            if (r.dead || !r.marsBase) continue;
            for (let k = 0; k < r.marsBase; k++) {
                const a = -2.2 + mi * 0.3;
                const bx = rx + Math.cos(a) * rr * 0.85, by = ry + Math.sin(a) * rr * 0.85;
                ctx.fillStyle = r.color;
                ctx.beginPath(); ctx.arc(bx, by, 4, Math.PI, 0); ctx.fill();
                mi++;
            }
        }
        label(rx, ry + rr + 22, '🔴 Mars', s.marsBases ? `${s.marsBases} základen · ${fmt(s.marsPop)} lidí` : 'nedotčený');

        // lodě mezi tělesy
        for (const sh of life.ships) {
            const tx = sh.to === 'mars' ? rx : mx, ty = sh.to === 'mars' ? ry : my;
            const px = lerp(ex, tx, sh.t), py = lerp(ey, ty, sh.t) - Math.sin(sh.t * Math.PI) * 60;
            ctx.strokeStyle = 'rgba(255,220,150,0.5)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(px, py); ctx.stroke();
            ctx.fillStyle = sh.color || '#fff';
            ctx.beginPath(); ctx.arc(px, py, 4, 0, 6.3); ctx.fill();
        }

        // mimozemská loď
        if (life.aliens) {
            const a = life.aliens;
            const ax = W * 0.5 + Math.cos(this.frame * 0.01) * W * 0.2;
            const ay = H * 0.18 + Math.sin(this.frame * 0.013) * 30;
            this.drawUfo(ax, ay, 22, a.friendly);
            label(ax, ay + 40, '🛸 Mimozemská loď',
                a.state === 'approach' ? 'blíží se…' : a.friendly ? 'obchoduje' : 'útočí');
        }

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText('Vesmírný pohled – přepni zpět na 🗺️ Krajina', 16, H - 16);
    }

    drawUfo(sx, sy, s, friendly) {
        const ctx = this.ctx;
        ctx.fillStyle = friendly === false ? 'rgba(255,110,110,0.25)' : 'rgba(140,255,210,0.22)';
        ctx.beginPath(); ctx.ellipse(sx, sy, s * 1.6, s * 0.5, 0, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#9fb2c9';
        ctx.beginPath(); ctx.ellipse(sx, sy, s, s * 0.32, 0, 0, 6.3); ctx.fill();
        ctx.fillStyle = friendly === false ? '#ff8a8a' : '#8ef7d2';
        ctx.beginPath(); ctx.ellipse(sx, sy - s * 0.22, s * 0.45, s * 0.3, 0, Math.PI, 0); ctx.fill();
        for (let k = 0; k < 5; k++) {
            const a = this.frame * 0.06 + k * 1.25;
            ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.5 * Math.sin(a)})`;
            ctx.fillRect(sx + Math.cos(a) * s * 0.8 - 1.5, sy + s * 0.12, 3, 3);
        }
    }

    drawHazards() {
        const ctx = this.ctx, z = this.cam.zoom, life = this.life;
        for (const t of (life.tornados || [])) {
            const sx = this.w2sx(t.x + 0.5), sy = this.w2sy(t.y + 0.5), r = t.r * z;
            const g = ctx.createRadialGradient(sx, sy, r * 0.05, sx, sy, r);
            g.addColorStop(0, 'rgba(40,42,55,0.85)');
            g.addColorStop(0.3, 'rgba(215,218,232,0.75)');
            g.addColorStop(1, 'rgba(120,124,150,0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.3); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.75)';
            ctx.lineWidth = 1.5;
            for (let k = 0; k < 4; k++) {
                ctx.beginPath();
                const a0 = this.frame * 0.14 + k * 1.6;
                for (let p = 0; p <= 14; p++) {
                    const f = p / 14, ang = a0 + f * 7, rr = r * (0.12 + f * 0.88);
                    const px = sx + Math.cos(ang) * rr, py = sy + Math.sin(ang) * rr * 0.6;
                    p === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.stroke();
            }
        }
        if (life.aliens && life.aliens.state !== 'approach') {
            const a = life.aliens;
            this.drawUfo(this.w2sx(a.x + 0.5), this.w2sy(a.y + 0.5), Math.max(10, z * 1.4), a.friendly);
        } else if (life.aliens) {
            const a = life.aliens;
            this.drawUfo(this.w2sx(a.x + 0.5), this.w2sy(Math.max(-2, a.y)), Math.max(8, z), a.friendly);
        }
        for (const s2 of (life.storms || [])) {
            const sx = this.w2sx(s2.x + 0.5), sy = this.w2sy(s2.y + 0.5), r = s2.r * z;
            const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
            g.addColorStop(0, 'rgba(225,240,255,0.42)');
            g.addColorStop(1, 'rgba(200,225,255,0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.3); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            for (let k = 0; k < 16; k++) {
                const a = (this.frame * 0.02 + k) % 6.283, d = ((this.frame * 2 + k * 37) % (r || 1));
                ctx.fillRect(sx + Math.cos(a) * d, sy + Math.sin(a) * d * 0.7, 2, 2);
            }
        }
    }

    drawArmies() {
        const ctx = this.ctx, z = this.cam.zoom, life = this.life;
        for (const a of life.armies) {
            if (a.dead) continue;
            const sx = this.w2sx(a.x + 0.5), sy = this.w2sy(a.y + 0.5);
            if (sx < -30 || sy < -30 || sx > this.vw + 30 || sy > this.vh + 30) continue;
            const s = Math.max(6, z * 0.9);
            ctx.fillStyle = 'rgba(0,0,0,0.28)';
            ctx.beginPath(); ctx.ellipse(sx, sy + s * 0.36, s * 0.5, s * 0.18, 0, 0, 6.3); ctx.fill();
            ctx.fillStyle = '#5b5148';
            ctx.fillRect(sx - s * 0.04, sy - s * 0.95, s * 0.08, s * 1.1);
            ctx.fillStyle = a.color;
            ctx.beginPath();
            ctx.moveTo(sx + s * 0.04, sy - s * 0.95);
            ctx.lineTo(sx + s * 0.6, sy - s * 0.75);
            ctx.lineTo(sx + s * 0.04, sy - s * 0.55);
            ctx.closePath(); ctx.fill();
            if (z >= 6) {
                const label = typeof fmt === 'function' ? fmt(a.strength) : Math.round(a.strength);
                ctx.font = `700 ${clamp(z * 0.6, 9, 13)}px system-ui, sans-serif`;
                ctx.textAlign = 'center';
                ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                ctx.strokeText('⚔ ' + label, sx, sy + s * 0.95);
                ctx.fillStyle = '#fff';
                ctx.fillText('⚔ ' + label, sx, sy + s * 0.95);
                ctx.textAlign = 'left';
            }
        }
    }

    drawRockets() {
        const ctx = this.ctx, z = this.cam.zoom;
        for (const r of this.life.rockets) {
            const p = r.t / 150;
            const sx = this.w2sx(r.x + 0.5);
            const sy = this.w2sy(r.y + 0.5) - p * p * this.vh * 1.4;
            const s = Math.max(10, z * 1.6);
            ctx.fillStyle = 'rgba(255,220,150,' + (0.5 * (1 - p)) + ')';
            ctx.beginPath();
            ctx.moveTo(sx - s * 0.22, sy + s * 0.4);
            ctx.lineTo(sx, sy + s * (1.2 + Math.random() * 0.9));
            ctx.lineTo(sx + s * 0.22, sy + s * 0.4);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#e8ecf4';
            ctx.beginPath();
            ctx.moveTo(sx, sy - s * 0.7);
            ctx.lineTo(sx + s * 0.22, sy + s * 0.4);
            ctx.lineTo(sx - s * 0.22, sy + s * 0.4);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#c8453a';
            ctx.fillRect(sx - s * 0.26, sy + s * 0.22, s * 0.52, s * 0.14);
            if (r.t % 3 === 0) this.particles.push({
                x: r.x + 0.5, y: r.y + 0.5 - (sy - this.w2sy(r.y + 0.5)) / z * -1,
                vx: (Math.random() - 0.5) * 0.4, vy: 0.2, life: 26, max: 26, size: 3, color: 'rgba(220,220,230,0.7)', grav: 0
            });
        }
    }

    drawBuildings() {
        const ctx = this.ctx, z = this.cam.zoom, life = this.life;
        if (z < 7) return;   // z dálky město tvoří samotné dlaždice
        for (const b of life.buildings) {
            if (b.dead) continue;
            const sx = this.w2sx(b.x + 0.5), sy = this.w2sy(b.y + 0.5);
            if (sx < -20 || sy < -20 || sx > this.vw + 20 || sy > this.vh + 20) continue;
            const realm = life.realmById(b.realm);
            const col = realm ? realm.color : '#999';
            const s = Math.max(3, z * (b.type === 'castle' ? 1.25 : b.type === 'temple' || b.type === 'barracks' ? 1.0 : 0.85));

            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.ellipse(sx, sy + s * 0.45, s * 0.55, s * 0.22, 0, 0, 6.3); ctx.fill();

            if (b.type === 'castle') {
                ctx.fillStyle = '#b9b3aa';
                ctx.fillRect(sx - s * 0.45, sy - s * 0.35, s * 0.9, s * 0.75);
                ctx.fillStyle = '#8f8981';
                for (let k = 0; k < 3; k++) ctx.fillRect(sx - s * 0.45 + k * s * 0.33, sy - s * 0.55, s * 0.2, s * 0.25);
                ctx.fillStyle = '#6b655e';
                ctx.fillRect(sx + s * 0.06, sy - s * 1.15, s * 0.07, s * 0.8);
                ctx.fillStyle = col;
                ctx.fillRect(sx + s * 0.12, sy - s * 1.12, s * 0.38, s * 0.3);
            } else if (b.type === 'temple') {
                ctx.fillStyle = '#e8e2d2';
                ctx.fillRect(sx - s * 0.38, sy - s * 0.15, s * 0.76, s * 0.55);
                ctx.fillStyle = '#f2d98a';
                ctx.beginPath();
                ctx.moveTo(sx - s * 0.46, sy - s * 0.12); ctx.lineTo(sx, sy - s * 0.7); ctx.lineTo(sx + s * 0.46, sy - s * 0.12);
                ctx.closePath(); ctx.fill();
                if (z > 9) { ctx.fillStyle = '#ffd24a'; ctx.fillRect(sx - s * 0.05, sy - s * 1.0, s * 0.1, s * 0.3); }
            } else if (b.type === 'market') {
                ctx.fillStyle = '#c9a06a';
                ctx.fillRect(sx - s * 0.4, sy - s * 0.05, s * 0.8, s * 0.42);
                for (let k = 0; k < 4; k++) {
                    ctx.fillStyle = k % 2 ? '#e05555' : '#f4f0e6';
                    ctx.fillRect(sx - s * 0.44 + k * s * 0.22, sy - s * 0.42, s * 0.22, s * 0.38);
                }
            } else if (b.type === 'mine') {
                ctx.fillStyle = '#7c7772';
                ctx.beginPath();
                ctx.moveTo(sx - s * 0.42, sy + s * 0.34); ctx.lineTo(sx, sy - s * 0.5); ctx.lineTo(sx + s * 0.42, sy + s * 0.34);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#2a2622';
                ctx.beginPath(); ctx.arc(sx, sy + s * 0.2, s * 0.2, Math.PI, 0); ctx.fill();
                ctx.fillRect(sx - s * 0.2, sy + s * 0.18, s * 0.4, s * 0.18);
            } else if (b.type === 'sawmill') {
                ctx.fillStyle = '#a9744a';
                ctx.fillRect(sx - s * 0.38, sy - s * 0.18, s * 0.76, s * 0.55);
                ctx.fillStyle = '#6b4a2c';
                ctx.fillRect(sx - s * 0.42, sy - s * 0.3, s * 0.84, s * 0.14);
                if (z > 9) {
                    ctx.strokeStyle = '#d8d4cc'; ctx.lineWidth = Math.max(1, s * 0.07);
                    ctx.beginPath(); ctx.arc(sx + s * 0.14, sy + s * 0.08, s * 0.17, 0, 6.3); ctx.stroke();
                }
            } else if (b.type === 'barracks') {
                ctx.fillStyle = '#6f7480';
                ctx.fillRect(sx - s * 0.42, sy - s * 0.25, s * 0.84, s * 0.62);
                ctx.fillStyle = col;
                ctx.beginPath();
                ctx.moveTo(sx, sy - s * 0.62); ctx.lineTo(sx + s * 0.26, sy - s * 0.3); ctx.lineTo(sx - s * 0.26, sy - s * 0.3);
                ctx.closePath(); ctx.fill();
                if (z > 9) {
                    ctx.strokeStyle = '#e8eaf0'; ctx.lineWidth = Math.max(1, s * 0.08);
                    ctx.beginPath(); ctx.moveTo(sx - s * 0.16, sy + s * 0.28); ctx.lineTo(sx + s * 0.16, sy - s * 0.1); ctx.stroke();
                }
            } else {
                ctx.fillStyle = '#c9a06a';
                ctx.fillRect(sx - s * 0.35, sy - s * 0.1, s * 0.7, s * 0.5);
                ctx.fillStyle = col;
                ctx.beginPath();
                ctx.moveTo(sx - s * 0.48, sy - s * 0.08);
                ctx.lineTo(sx, sy - s * 0.62);
                ctx.lineTo(sx + s * 0.48, sy - s * 0.08);
                ctx.closePath(); ctx.fill();
                if (z > 10) { ctx.fillStyle = 'rgba(60,40,20,0.8)'; ctx.fillRect(sx - s * 0.08, sy + s * 0.12, s * 0.16, s * 0.28); }
            }
            if (b.hp < (b.maxHp || 45) * 0.6) {
                ctx.fillStyle = 'rgba(40,40,40,0.45)';
                ctx.fillRect(sx - s * 0.4, sy - s * 0.5, s * 0.8, s * 0.4);
            }
        }
    }

    drawUnits(alpha) {
        const ctx = this.ctx, z = this.cam.zoom, life = this.life;
        const sel = this.validSelection();
        for (const u of life.units) {
            if (!u.alive) continue;
            const x = lerp(u.ox, u.x, alpha), y = lerp(u.oy, u.y, alpha);
            const sx = this.w2sx(x + 0.5), sy = this.w2sy(y + 0.5);
            if (sx < -20 || sy < -20 || sx > this.vw + 20 || sy > this.vh + 20) continue;

            const s = Math.max(4.5, z * 0.66);
            const bob = Math.abs(Math.sin(u.phase || 0)) * s * 0.07;

            ctx.fillStyle = 'rgba(0,0,0,0.28)';
            ctx.beginPath(); ctx.ellipse(sx, sy + s * 0.42, s * 0.3, s * 0.12, 0, 0, 6.3); ctx.fill();

            if (u.kind === 'animal') {
                const a = ANIMALS[u.race];
                ctx.fillStyle = a.color;
                if (u.race === 'dragon') {
                    const ds = s * 1.9;
                    ctx.fillStyle = 'rgba(0,0,0,0.25)';
                    ctx.beginPath(); ctx.ellipse(sx, sy + ds * 0.5, ds * 0.5, ds * 0.18, 0, 0, 6.3); ctx.fill();
                    const flap = Math.sin(this.frame * 0.25) * ds * 0.25;
                    ctx.fillStyle = '#8e2f28';
                    ctx.beginPath();
                    ctx.moveTo(sx, sy - ds * 0.1);
                    ctx.lineTo(sx - ds * 0.75, sy - ds * 0.4 - flap);
                    ctx.lineTo(sx - ds * 0.2, sy + ds * 0.12);
                    ctx.closePath(); ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(sx, sy - ds * 0.1);
                    ctx.lineTo(sx + ds * 0.75, sy - ds * 0.4 - flap);
                    ctx.lineTo(sx + ds * 0.2, sy + ds * 0.12);
                    ctx.closePath(); ctx.fill();
                    ctx.fillStyle = a.color;
                    ctx.beginPath(); ctx.ellipse(sx, sy - ds * 0.05, ds * 0.32, ds * 0.2, 0, 0, 6.3); ctx.fill();
                    ctx.beginPath(); ctx.arc(sx + (u.dir || 1) * ds * 0.34, sy - ds * 0.16, ds * 0.14, 0, 6.3); ctx.fill();
                    ctx.fillStyle = '#ffd24a';
                    ctx.fillRect(sx + (u.dir || 1) * ds * 0.44, sy - ds * 0.18, ds * 0.12, ds * 0.06);
                    if (sel === u) this.ring(sx, sy, ds);
                    continue;
                }
                if (u.race === 'sheep') {
                    ctx.beginPath(); ctx.ellipse(sx, sy - s * 0.12 - bob, s * 0.32, s * 0.24, 0, 0, 6.3); ctx.fill();
                    ctx.fillStyle = '#3c3a38';
                    ctx.beginPath(); ctx.arc(sx + (u.dir || 1) * s * 0.28, sy - s * 0.22 - bob, s * 0.12, 0, 6.3); ctx.fill();
                } else {
                    ctx.beginPath(); ctx.ellipse(sx, sy - s * 0.14 - bob, s * 0.36, s * 0.2, 0, 0, 6.3); ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(sx + (u.dir || 1) * s * 0.3, sy - s * 0.22 - bob);
                    ctx.lineTo(sx + (u.dir || 1) * s * 0.62, sy - s * 0.34 - bob);
                    ctx.lineTo(sx + (u.dir || 1) * s * 0.34, sy - s * 0.02 - bob);
                    ctx.closePath(); ctx.fill();
                }
                if (sel === u) this.ring(sx, sy, s);
                continue;
            }

            const race = RACES[u.race];
            const realm = u.realm ? life.realmById(u.realm) : null;
            const cloth = u.zombie ? '#4d6b3a' : (realm ? realm.color : '#9aa3b5');
            const skin = u.zombie ? '#8fb56a' : race.skin;

            if (z >= 5) {
                ctx.strokeStyle = '#3b3227';
                ctx.lineWidth = Math.max(1, s * 0.1);
                const legSwing = Math.sin(u.phase || 0) * s * 0.12;
                ctx.beginPath();
                ctx.moveTo(sx - s * 0.1, sy + s * 0.12); ctx.lineTo(sx - s * 0.1 + legSwing, sy + s * 0.4);
                ctx.moveTo(sx + s * 0.1, sy + s * 0.12); ctx.lineTo(sx + s * 0.1 - legSwing, sy + s * 0.4);
                ctx.stroke();
            }
            ctx.fillStyle = cloth;
            ctx.fillRect(sx - s * 0.19, sy - s * 0.2 - bob, s * 0.38, s * 0.36);
            ctx.fillStyle = skin;
            ctx.beginPath(); ctx.arc(sx, sy - s * 0.36 - bob, s * 0.2, 0, 6.3); ctx.fill();
            if (u.zombie && z >= 6) { ctx.fillStyle = '#c8f06a'; ctx.fillRect(sx - s * 0.1, sy - s * 0.4 - bob, s * 0.06, s * 0.06); ctx.fillRect(sx + s * 0.05, sy - s * 0.4 - bob, s * 0.06, s * 0.06); }

            if (u.job === 'soldier' && z >= 6) {
                const era = realm ? realm.era : 0;
                ctx.strokeStyle = era >= 9 ? '#7cffcf' : era >= 5 ? '#3f4650' : '#e8eaf0';
                ctx.lineWidth = Math.max(1, s * 0.09);
                ctx.beginPath();
                ctx.moveTo(sx + (u.dir || 1) * s * 0.24, sy + s * 0.04);
                ctx.lineTo(sx + (u.dir || 1) * s * 0.34, sy - s * 0.42);
                ctx.stroke();
            }
            if (u.carry > 0 && z >= 8) {
                ctx.fillStyle = '#e0b055';
                ctx.fillRect(sx - s * 0.12, sy - s * 0.62 - bob, s * 0.24, s * 0.16);
            }
            if (u.sick && z >= 6) {
                ctx.fillStyle = 'rgba(140,220,90,0.85)';
                ctx.beginPath(); ctx.arc(sx + s * 0.26, sy - s * 0.52 - bob, s * 0.1, 0, 6.3); ctx.fill();
            }
            if (u.faith > 0.3 && z >= 6) {
                ctx.strokeStyle = 'rgba(255,220,130,0.9)';
                ctx.lineWidth = Math.max(1, s * 0.07);
                ctx.beginPath(); ctx.ellipse(sx, sy - s * 0.64 - bob, s * 0.2, s * 0.08, 0, 0, 6.3); ctx.stroke();
            }
            if (u.hp < u.maxHp * 0.5 && z >= 7) {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(sx - s * 0.25, sy - s * 0.74 - bob, s * 0.5, s * 0.09);
                ctx.fillStyle = '#e05555';
                ctx.fillRect(sx - s * 0.25, sy - s * 0.74 - bob, s * 0.5 * (u.hp / u.maxHp), s * 0.09);
            }
            if (sel === u) this.ring(sx, sy, s);
        }
    }

    ring(sx, sy, s) {
        const ctx = this.ctx;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.ellipse(sx, sy + s * 0.42, s * 0.62, s * 0.3, 0, 0, 6.3); ctx.stroke();
    }

    drawLabels() {
        if (!this.labels || this.cam.zoom < 4) return;
        const ctx = this.ctx, life = this.life;
        ctx.textAlign = 'center';
        const fs = clamp(this.cam.zoom * 0.85, 9, 15);
        ctx.font = `600 ${fs}px system-ui, sans-serif`;
        for (const v of life.villages) {
            if (v.dead) continue;
            if (this.cam.zoom < 6 && v.level < 2) continue;
            const sx = this.w2sx(v.x + 0.5), sy = this.w2sy(v.y + 0.5);
            if (sx < 0 || sy < 0 || sx > this.vw || sy > this.vh) continue;
            const realm = life.realmById(v.realm);
            const isCapital = realm && realm.capital === v.id;
            const ty = sy - this.cam.zoom * 1.15;
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(0,0,0,0.75)';
            const popTxt = typeof fmt === 'function' ? fmt(v.pop) : Math.round(v.pop);
            const label = (isCapital ? '♛ ' : '') + v.name + (this.cam.zoom > 7 ? `  ${popTxt}` : '');
            ctx.strokeText(label, sx, ty);
            ctx.fillStyle = realm ? realm.color : '#ddd';
            ctx.fillText(label, sx, ty);
            if (isCapital && realm) {
                ctx.font = `700 ${fs * 1.15}px system-ui, sans-serif`;
                ctx.strokeText(realm.name, sx, ty - fs * 1.25);
                ctx.fillStyle = '#fff';
                ctx.fillText(realm.name, sx, ty - fs * 1.25);
                ctx.font = `600 ${fs}px system-ui, sans-serif`;
            }
        }
        ctx.textAlign = 'left';
    }

    /* ---------------- efekty ---------------- */

    spawnParticles(x, y, n, o) {
        for (let k = 0; k < n; k++) {
            const a = Math.random() * 6.283, sp = (o.speed || 0.6) * (0.3 + Math.random());
            this.particles.push({
                x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                life: o.life || 26, max: o.life || 26, size: o.size || 2.2, color: o.color || '#ffb15c', grav: o.grav || 0
            });
        }
    }

    drawEffects(paused) {
        const ctx = this.ctx, life = this.life, z = this.cam.zoom;
        for (let k = life.fx.length - 1; k >= 0; k--) {
            const f = life.fx[k];
            const p = 1 - f.life / f.max;
            const sx = this.w2sx(f.x + 0.5), sy = this.w2sy(f.y + 0.5);
            switch (f.type) {
                case 'boom': {
                    const r = f.r * z * (0.3 + p * 1.1);
                    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
                    const a = 1 - p;
                    g.addColorStop(0, `rgba(255,255,220,${a})`);
                    g.addColorStop(0.4, `rgba(255,160,50,${a * 0.8})`);
                    g.addColorStop(1, 'rgba(90,30,10,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.3); ctx.fill();
                    if (f.life === f.max) this.spawnParticles(f.x, f.y, 34, { speed: f.r * 0.1, life: 34, color: '#ffcb7a', grav: 0.006 });
                    break;
                }
                case 'shock': {
                    ctx.strokeStyle = `rgba(255,255,255,${(1 - p) * 0.5})`;
                    ctx.lineWidth = 2 + (1 - p) * 4;
                    ctx.beginPath(); ctx.arc(sx, sy, f.r * z * p, 0, 6.3); ctx.stroke();
                    break;
                }
                case 'splash': {
                    ctx.strokeStyle = `rgba(150,220,255,${(1 - p) * 0.8})`;
                    ctx.lineWidth = 2.5;
                    ctx.beginPath(); ctx.arc(sx, sy, f.r * z * (0.3 + p), 0, 6.3); ctx.stroke();
                    break;
                }
                case 'sparkle': {
                    ctx.fillStyle = f.color;
                    ctx.globalAlpha = (1 - p) * 0.9;
                    for (let s = 0; s < 10; s++) {
                        const a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * f.r * z;
                        ctx.fillRect(sx + Math.cos(a) * d, sy + Math.sin(a) * d, 2.4, 2.4);
                    }
                    ctx.globalAlpha = 1;
                    break;
                }
                case 'beam': {
                    const r = f.r * z;
                    const g = ctx.createLinearGradient(sx, sy - this.vh, sx, sy);
                    g.addColorStop(0, 'rgba(255,90,90,0)');
                    g.addColorStop(1, `rgba(255,90,90,${(1 - p) * 0.5})`);
                    ctx.fillStyle = g;
                    ctx.fillRect(sx - r * 0.5, sy - this.vh, r, this.vh);
                    break;
                }
                case 'bolt': {
                    ctx.strokeStyle = `rgba(255,255,255,${1 - p})`;
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    let px = sx + (Math.random() - 0.5) * 16;
                    ctx.moveTo(px, sy - this.vh);
                    for (let s = 1; s <= 8; s++) {
                        px = lerp(px, sx, 0.5) + (Math.random() - 0.5) * 22 * (1 - s / 8);
                        ctx.lineTo(px, sy - this.vh * (1 - s / 8));
                    }
                    ctx.lineTo(sx, sy);
                    ctx.stroke();
                    ctx.strokeStyle = `rgba(170,210,255,${(1 - p) * 0.5})`;
                    ctx.lineWidth = 7; ctx.stroke();
                    break;
                }
                case 'rain': {
                    ctx.save();
                    ctx.beginPath(); ctx.arc(sx, sy, f.r * z, 0, 6.3); ctx.clip();
                    ctx.strokeStyle = 'rgba(150,200,255,0.5)'; ctx.lineWidth = 1;
                    const off = (this.frame * 6) % 20;
                    for (let s = -14; s < 28; s++) {
                        const lx = sx - f.r * z + s * 8 + off;
                        ctx.beginPath(); ctx.moveTo(lx, sy - f.r * z); ctx.lineTo(lx - 7, sy + f.r * z); ctx.stroke();
                    }
                    ctx.restore();
                    break;
                }
                case 'laser': {
                    ctx.strokeStyle = f.color || '#7cffcf';
                    ctx.lineWidth = 3 + (1 - p) * 4;
                    ctx.globalAlpha = 1 - p;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(this.w2sx(f.tx + 0.5), this.w2sy(f.ty + 0.5));
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                    break;
                }
                case 'clash': {
                    ctx.strokeStyle = `rgba(255,220,120,${1 - p})`;
                    ctx.lineWidth = 2;
                    for (let k = 0; k < 4; k++) {
                        const a = Math.random() * 6.3, d2 = (0.3 + Math.random()) * z;
                        ctx.beginPath();
                        ctx.moveTo(sx, sy);
                        ctx.lineTo(sx + Math.cos(a) * d2 * 2, sy + Math.sin(a) * d2 * 2);
                        ctx.stroke();
                    }
                    break;
                }
                case 'meteor': {
                    const d = (f.life / f.max) * Math.max(this.vw, this.vh);
                    const px = sx - d * 0.75, py = sy - d;
                    const g = ctx.createLinearGradient(px - 60, py - 70, px, py);
                    g.addColorStop(0, 'rgba(255,180,60,0)');
                    g.addColorStop(1, 'rgba(255,235,160,0.95)');
                    ctx.strokeStyle = g; ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.moveTo(px - 60, py - 70); ctx.lineTo(px, py); ctx.stroke();
                    ctx.fillStyle = '#ffe9b0';
                    ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.3); ctx.fill();
                    ctx.strokeStyle = 'rgba(255,120,60,0.8)'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.arc(sx, sy, 22, 0, 6.3); ctx.stroke();
                    break;
                }
            }
            if (!paused) { f.life--; if (f.life <= 0) life.fx.splice(k, 1); }
        }

        for (let k = this.particles.length - 1; k >= 0; k--) {
            const p = this.particles[k];
            ctx.globalAlpha = p.life / p.max;
            ctx.fillStyle = p.color;
            ctx.fillRect(this.w2sx(p.x), this.w2sy(p.y), p.size, p.size);
            ctx.globalAlpha = 1;
            if (!paused) {
                p.x += p.vx * 0.1; p.y += p.vy * 0.1;
                p.vy += p.grav; p.vx *= 0.96; p.vy *= 0.96;
                if (--p.life <= 0) this.particles.splice(k, 1);
            }
        }
    }

    drawBrush() {
        if (!this.brush.show) return;
        const ctx = this.ctx;
        const sx = this.w2sx(this.brush.x + 0.5), sy = this.w2sy(this.brush.y + 0.5);
        const r = Math.max(this.brush.r * this.cam.zoom, 6);
        ctx.save();
        ctx.strokeStyle = this.brush.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.lineDashOffset = -this.frame * 0.3;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.3); ctx.stroke();
        ctx.globalAlpha = 0.10;
        ctx.fillStyle = this.brush.color;
        ctx.fill();
        ctx.restore();
    }

    drawGlass() {
        const ctx = this.ctx;
        const g = ctx.createLinearGradient(0, 0, this.vw * 0.65, this.vh);
        g.addColorStop(0, 'rgba(255,255,255,0.055)');
        g.addColorStop(0.3, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.vw, this.vh);
        const v = ctx.createRadialGradient(this.vw / 2, this.vh / 2, Math.min(this.vw, this.vh) * 0.42,
            this.vw / 2, this.vh / 2, Math.max(this.vw, this.vh) * 0.8);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(1, 'rgba(0,0,8,0.45)');
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, this.vw, this.vh);
    }

    drawMinimap() {
        const m = this.mini, c = this.mctx, w = this.world;
        const want = 200;
        if (m.width !== want) { m.width = want; m.height = Math.round(want * w.h / w.w); }
        c.imageSmoothingEnabled = true;
        c.drawImage(this.buf, 0, 0, m.width, m.height);
        c.globalAlpha = 0.55;
        c.drawImage(this.terr, 0, 0, m.width, m.height);
        c.globalAlpha = 1;
        for (const v of this.life.villages) {
            if (v.dead) continue;
            const r = this.life.realmById(v.realm);
            c.fillStyle = r ? r.color : '#fff';
            c.fillRect(v.x / w.w * m.width - 1.5, v.y / w.h * m.height - 1.5, 3, 3);
        }
        const x = (this.cam.x - this.vw / (2 * this.cam.zoom)) / w.w * m.width;
        const y = (this.cam.y - this.vh / (2 * this.cam.zoom)) / w.h * m.height;
        c.strokeStyle = 'rgba(255,255,255,0.9)';
        c.lineWidth = 1;
        c.strokeRect(x, y, this.vw / this.cam.zoom / w.w * m.width, this.vh / this.cam.zoom / w.h * m.height);
    }

    /* co je pod kurzorem: nejdřív panáček, pak vesnice */
    pick(wx, wy) {
        let best = null, bd = Math.max(0.8, 9 / this.cam.zoom);
        bd *= bd;
        this.life.forEachNear(wx, wy, 2.5, (u, d2) => { if (d2 < bd) { bd = d2; best = u; } });
        if (best) return best;
        for (const v of this.life.villages) {
            if (!v.dead && dist2(v.x + 0.5, v.y + 0.5, wx, wy) < 4) return { kind: 'village', v, uid: -v.id, alive: true };
        }
        return null;
    }
}
