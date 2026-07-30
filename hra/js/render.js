'use strict';
/* Vykreslování: terén přes ImageData, tvorové, efekty, box kolem světa a minimapa. */

const OVERLAYS = [
    { id: 'normal', name: 'Svět', icon: '🌍' },
    { id: 'temp', name: 'Teplota', icon: '🌡️' },
    { id: 'moist', name: 'Vláha', icon: '💧' },
    { id: 'fert', name: 'Úrodnost', icon: '🌾' },
    { id: 'rad', name: 'Radiace', icon: '☢️' },
    { id: 'species', name: 'Druhy', icon: '🧬' },
    { id: 'faith', name: 'Víra', icon: '🙏' }
];

function rgb(r, g, b) { return (255 << 24) | (b << 16) | (g << 8) | r; }

class Renderer {
    constructor(canvas, mini, world, sim) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.mini = mini;
        this.mctx = mini.getContext('2d');
        this.world = world;
        this.sim = sim;
        this.overlay = 'normal';
        this.showGrid = false;

        this.terrain = document.createElement('canvas');
        this.terrain.width = world.w; this.terrain.height = world.h;
        this.tctx = this.terrain.getContext('2d');
        this.img = this.tctx.createImageData(world.w, world.h);
        this.buf = new Uint32Array(this.img.data.buffer);

        this.cam = { x: world.w / 2, y: world.h / 2, zoom: 4 };
        this.particles = [];
        this.frame = 0;
        this.dpr = Math.min(2, window.devicePixelRatio || 1);
        this.hover = null;
        this.brush = { x: 0, y: 0, r: 8, show: false, color: '#fff' };
        this.selected = null;
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
        this.cam.zoom = Math.max(this.cam.zoom, this.minZoom);
        this.clampCam();
    }

    clampCam() {
        const halfW = this.vw / (2 * this.cam.zoom), halfH = this.vh / (2 * this.cam.zoom);
        this.cam.x = clamp(this.cam.x, halfW, this.world.w - halfW);
        this.cam.y = clamp(this.cam.y, halfH, this.world.h - halfH);
        if (this.world.w * this.cam.zoom < this.vw) this.cam.x = this.world.w / 2;
        if (this.world.h * this.cam.zoom < this.vh) this.cam.y = this.world.h / 2;
    }

    w2sx(x) { return (x - this.cam.x) * this.cam.zoom + this.vw / 2; }
    w2sy(y) { return (y - this.cam.y) * this.cam.zoom + this.vh / 2; }
    s2wx(x) { return (x - this.vw / 2) / this.cam.zoom + this.cam.x; }
    s2wy(y) { return (y - this.vh / 2) / this.cam.zoom + this.cam.y; }

    zoomAt(sx, sy, factor) {
        const wx = this.s2wx(sx), wy = this.s2wy(sy);
        this.cam.zoom = clamp(this.cam.zoom * factor, this.minZoom, 22);
        this.cam.x = wx - (sx - this.vw / 2) / this.cam.zoom;
        this.cam.y = wy - (sy - this.vh / 2) / this.cam.zoom;
        this.clampCam();
    }

    viewBounds() {
        const x0 = clamp(Math.floor(this.s2wx(0)) - 1, 0, this.world.w - 1);
        const y0 = clamp(Math.floor(this.s2wy(0)) - 1, 0, this.world.h - 1);
        const x1 = clamp(Math.ceil(this.s2wx(this.vw)) + 1, 1, this.world.w);
        const y1 = clamp(Math.ceil(this.s2wy(this.vh)) + 1, 1, this.world.h);
        return { x0, y0, x1, y1 };
    }

    /* ---------- terén ---------- */

    paintTerrain(x0, y0, x1, y1) {
        const w = this.world, buf = this.buf, W = w.w;
        const seasonT = Math.sin(w.season * Math.PI * 2) * 7;
        const ov = this.overlay;
        const speciesTint = ov === 'species';

        for (let y = y0; y < y1; y++) {
            const lat = (y / w.h) * 2 - 1;
            const rowT = 31 - 62 * Math.pow(Math.abs(lat), 1.5) + w.climate - w.dust + seasonT * lat;
            for (let x = x0; x < x1; x++) {
                const i = y * W + x;
                const hgt = w.height[i], wat = w.water[i], veg = w.veg[i];
                const alt = hgt - w.seaLevel;
                let t = rowT - Math.max(0, alt) * 58 + (wat > 0.05 ? 2.5 : 0);
                let r, g, b;

                if (ov === 'temp') {
                    const f = clamp((t + 30) / 75, 0, 1);
                    r = (255 * clamp(f * 1.6 - 0.25, 0, 1)) | 0;
                    g = (255 * clamp(1 - Math.abs(f - 0.5) * 2.1, 0, 1)) | 0;
                    b = (255 * clamp(1.35 - f * 2.1, 0, 1)) | 0;
                } else if (ov === 'moist') {
                    const f = clamp(w.moist[i], 0, 1);
                    r = (200 - 170 * f) | 0; g = (170 - 40 * f) | 0; b = (110 + 130 * f) | 0;
                } else if (ov === 'fert') {
                    const f = clamp(w.fert[i], 0, 1);
                    r = (150 - 110 * f) | 0; g = (90 + 140 * f) | 0; b = (60 + 30 * f) | 0;
                } else if (ov === 'rad') {
                    const f = clamp(w.rad[i], 0, 1);
                    const base = 40 + veg * 40;
                    r = (base + f * 90) | 0; g = (base + f * 200) | 0; b = (base + 20) | 0;
                } else {
                    if (wat > 0.02) {
                        const d = clamp(wat / 0.28, 0, 1);
                        if (t < -2 && wat > 0.02) {           // led
                            const ice = clamp((-t - 2) / 8, 0, 1);
                            r = lerp(60 + 40 * (1 - d), 226, ice) | 0;
                            g = lerp(120 + 40 * (1 - d), 238, ice) | 0;
                            b = lerp(165 + 30 * (1 - d), 250, ice) | 0;
                        } else {
                            r = lerp(58, 8, d) | 0;
                            g = lerp(140, 34, d) | 0;
                            b = lerp(172, 74, d) | 0;
                            if (veg > 0.05 && d < 0.6) {       // řasy v mělčinách
                                const a = veg * 0.45 * (1 - d);
                                r = lerp(r, 46, a) | 0; g = lerp(g, 132, a) | 0; b = lerp(b, 96, a) | 0;
                            }
                        }
                    } else {
                        const dry = clamp(1 - w.moist[i] * 1.7, 0, 1);
                        // holá půda -> tráva -> les
                        let br = lerp(196 - 40 * (1 - dry), 92, clamp(veg * 1.4, 0, 1));
                        let bg = lerp(178 - 20 * (1 - dry), 138, clamp(veg * 1.4, 0, 1));
                        let bb = lerp(132 - 40 * (1 - dry), 74, clamp(veg * 1.4, 0, 1));
                        if (veg > 0.55) {
                            const f = (veg - 0.55) / 0.45;
                            br = lerp(br, 36, f); bg = lerp(bg, 88, f); bb = lerp(bb, 52, f);
                        }
                        if (alt > 0.16) {                       // skály
                            const f = clamp((alt - 0.16) / 0.18, 0, 1) * (1 - veg * 0.5);
                            br = lerp(br, 122, f); bg = lerp(bg, 116, f); bb = lerp(bb, 112, f);
                        }
                        if (t < 1) {                            // sníh
                            const f = clamp((1 - t) / 9, 0, 1);
                            br = lerp(br, 240, f); bg = lerp(bg, 244, f); bb = lerp(bb, 252, f);
                        }
                        r = br | 0; g = bg | 0; b = bb | 0;
                    }

                    // stínování svahů (světlo zleva shora)
                    if (x > 0 && y > 0) {
                        const dh = (hgt - w.height[i - W - 1]) * (wat > 0.02 ? 2 : 7);
                        const s = clamp(1 + dh, 0.62, 1.42);
                        r = clamp(r * s, 0, 255) | 0; g = clamp(g * s, 0, 255) | 0; b = clamp(b * s, 0, 255) | 0;
                    }

                    const rad = w.rad[i];
                    if (rad > 0.02) {
                        r = clamp(r * (1 - rad * 0.3), 0, 255) | 0;
                        g = clamp(g * (1 - rad * 0.1) + rad * 55, 0, 255) | 0;
                        b = clamp(b * (1 - rad * 0.5), 0, 255) | 0;
                    }
                }

                const lav = w.lava[i], fir = w.fire[i];
                if (lav > 0.01) {
                    const f = clamp(lav, 0, 1);
                    r = clamp(lerp(r, 255, f), 0, 255) | 0;
                    g = clamp(lerp(g, 90 + 120 * Math.min(1, lav), 0, 1) * 1, 0, 255) | 0;
                    b = clamp(lerp(b, 30, f), 0, 255) | 0;
                } else if (fir > 0.01) {
                    const f = clamp(fir, 0, 1) * 0.85;
                    r = clamp(lerp(r, 255, f), 0, 255) | 0;
                    g = clamp(lerp(g, 150, f), 0, 255) | 0;
                    b = clamp(lerp(b, 40, f), 0, 255) | 0;
                }
                if (speciesTint) { r = (r * 0.45) | 0; g = (g * 0.45) | 0; b = (b * 0.5) | 0; }
                buf[i] = rgb(r, g, b);
            }
        }
        this.tctx.putImageData(this.img, 0, 0, x0, y0, x1 - x0, y1 - y0);
    }

    /* ---------- hlavní kreslení ---------- */

    draw(paused) {
        this.frame++;
        const ctx = this.ctx, w = this.world, sim = this.sim, cam = this.cam;
        const v = this.viewBounds();

        ctx.fillStyle = '#05070d';
        ctx.fillRect(0, 0, this.vw, this.vh);

        this.paintTerrain(v.x0, v.y0, v.x1, v.y1);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.terrain, v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0,
            this.w2sx(v.x0), this.w2sy(v.y0), (v.x1 - v.x0) * cam.zoom, (v.y1 - v.y0) * cam.zoom);
        ctx.imageSmoothingEnabled = true;

        // hrana světa – aby bylo poznat, kde krabice končí
        ctx.strokeStyle = 'rgba(150,180,255,0.25)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.w2sx(0) - 1, this.w2sy(0) - 1, this.world.w * cam.zoom + 2, this.world.h * cam.zoom + 2);

        if (this.overlay === 'faith') this.drawFaithOverlay(v);
        this.drawStructures(v);
        this.drawCreatures(v);
        this.drawZones();
        this.drawEffects(paused);
        this.drawBrush();
        this.drawGlass();
        if (this.frame % 12 === 0) this.drawMinimap();
    }

    drawFaithOverlay(v) {
        const ctx = this.ctx, sim = this.sim;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < sim.list.length; i++) {
            const c = sim.list[i];
            if (!c.alive || c.faith < 0.05) continue;
            const sx = this.w2sx(c.x), sy = this.w2sy(c.y);
            if (sx < -30 || sy < -30 || sx > this.vw + 30 || sy > this.vh + 30) continue;
            const r = 6 + c.faith * 22;
            const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
            grd.addColorStop(0, `rgba(255,220,130,${0.28 * c.faith})`);
            grd.addColorStop(1, 'rgba(255,220,130,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
        }
        ctx.restore();
    }

    drawStructures(v) {
        const ctx = this.ctx, sim = this.sim, z = this.cam.zoom;
        for (let k = 0; k < sim.structures.length; k++) {
            const s = sim.structures[k];
            if (!s.alive) continue;
            if (s.x < v.x0 - 2 || s.x > v.x1 + 2 || s.y < v.y0 - 2 || s.y > v.y1 + 2) continue;
            const sx = this.w2sx(s.x + 0.5), sy = this.w2sy(s.y + 0.5);
            const size = Math.max(2.5, z * (s.type === 3 ? 1.7 : s.type === 2 ? 1.4 : 1.05));
            if (s.type === 3) {
                ctx.fillStyle = '#f4d47a';
                ctx.strokeStyle = 'rgba(80,50,10,0.8)'; ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(sx, sy - size); ctx.lineTo(sx + size * 0.75, sy); ctx.lineTo(sx + size * 0.5, sy + size * 0.8);
                ctx.lineTo(sx - size * 0.5, sy + size * 0.8); ctx.lineTo(sx - size * 0.75, sy);
                ctx.closePath(); ctx.fill();
                if (z > 3) {
                    ctx.fillStyle = 'rgba(255,255,255,0.85)';
                    ctx.fillRect(sx - size * 0.1, sy - size * 1.6, size * 0.2, size * 0.6);
                    ctx.fillRect(sx - size * 0.3, sy - size * 1.35, size * 0.6, size * 0.18);
                }
            } else {
                ctx.fillStyle = s.type === 2 ? '#c98f5a' : '#a9744a';
                ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
                if (z > 3) {
                    ctx.fillStyle = 'rgba(60,32,18,0.85)';
                    ctx.beginPath();
                    ctx.moveTo(sx - size * 0.62, sy - size * 0.45);
                    ctx.lineTo(sx, sy - size * 1.05);
                    ctx.lineTo(sx + size * 0.62, sy - size * 0.45);
                    ctx.closePath(); ctx.fill();
                }
            }
        }
    }

    drawCreatures(v) {
        const ctx = this.ctx, sim = this.sim, z = this.cam.zoom;
        const colors = new Map();
        for (const sp of sim.species) colors.set(sp.id, sp);
        const detail = z >= 3.2;

        for (let i = 0; i < sim.list.length; i++) {
            const c = sim.list[i];
            if (!c.alive) continue;
            if (c.x < v.x0 - 1 || c.x > v.x1 + 1 || c.y < v.y0 - 1 || c.y > v.y1 + 1) continue;
            const sx = this.w2sx(c.x), sy = this.w2sy(c.y);
            const sp = colors.get(c.sp);
            let col = sp ? sp.color : '#fff';
            if (c.sick > 0) col = '#a6e05a';

            const rad = Math.max(1.5, z * 0.34 * (0.5 + c.size * 0.6));
            if (!detail) {
                ctx.fillStyle = col;
                const d = Math.max(2, rad * 1.6);
                ctx.fillRect(sx - d * 0.5, sy - d * 0.5, d, d);
                continue;
            }
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath(); ctx.ellipse(sx, sy + rad * 0.75, rad * 0.95, rad * 0.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath();
            if (c.carn) {
                const a = Math.atan2(c.dy, c.dx);
                ctx.moveTo(sx + Math.cos(a) * rad * 1.7, sy + Math.sin(a) * rad * 1.7);
                ctx.lineTo(sx + Math.cos(a + 2.5) * rad * 1.2, sy + Math.sin(a + 2.5) * rad * 1.2);
                ctx.lineTo(sx + Math.cos(a - 2.5) * rad * 1.2, sy + Math.sin(a - 2.5) * rad * 1.2);
                ctx.closePath();
            } else {
                ctx.arc(sx, sy, rad, 0, Math.PI * 2);
            }
            ctx.fillStyle = col;
            ctx.fill();
            if (z > 4) {
                ctx.strokeStyle = sp ? sp.colorDark : '#333';
                ctx.lineWidth = Math.max(0.6, z * 0.06);
                ctx.stroke();
            }
            if (z > 6) {
                if (c.faith > 0.35) {                      // svatozář věřícího
                    ctx.strokeStyle = 'rgba(255,224,140,0.9)';
                    ctx.beginPath();
                    ctx.arc(sx, sy - rad * 1.3, rad * 0.7, Math.PI * 1.05, Math.PI * 1.95);
                    ctx.stroke();
                }
                if (c.energy < c.maxE * 0.22) {            // hlad
                    ctx.fillStyle = 'rgba(255,80,80,0.9)';
                    ctx.fillRect(sx - rad, sy - rad * 2.2, rad * 2 * (c.energy / (c.maxE * 0.22)), 1.6);
                }
            }
            if (this.selected === c && c.uid === this.selectedUid) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(sx, sy, rad * 2.6, 0, Math.PI * 2); ctx.stroke();
            }
        }
    }

    drawZones() {
        const ctx = this.ctx, sim = this.sim, z = this.cam.zoom;
        for (const t of sim.tornados) {
            const sx = this.w2sx(t.x), sy = this.w2sy(t.y), r = t.r * z;
            const grd = ctx.createRadialGradient(sx, sy, r * 0.05, sx, sy, r);
            grd.addColorStop(0, 'rgba(40,42,55,0.85)');
            grd.addColorStop(0.25, 'rgba(215,218,232,0.8)');
            grd.addColorStop(0.6, 'rgba(150,152,178,0.45)');
            grd.addColorStop(1, 'rgba(90,90,110,0)');
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 1.6;
            for (let k = 0; k < 4; k++) {
                ctx.beginPath();
                const a0 = (t.ang || 0) * 0.12 + k * 2.1;
                for (let s = 0; s <= 14; s++) {
                    const p = s / 14;
                    const ang = a0 + p * 7;
                    const rr = r * (0.15 + p * 0.85);
                    const px = sx + Math.cos(ang) * rr, py = sy + Math.sin(ang) * rr * 0.65;
                    s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.stroke();
            }
        }
        for (const zn of sim.zones) {
            const sx = this.w2sx(zn.x), sy = this.w2sy(zn.y), r = zn.r * z;
            if (zn.type === 'rain') {
                ctx.save();
                ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.clip();
                ctx.strokeStyle = 'rgba(150,200,255,0.55)'; ctx.lineWidth = 1;
                const off = (this.frame * 7) % 22;
                for (let k = -20; k < 40; k++) {
                    const px = sx - r + k * 7;
                    ctx.beginPath();
                    ctx.moveTo(px + off, sy - r); ctx.lineTo(px + off - 8, sy + r);
                    ctx.stroke();
                }
                ctx.restore();
                ctx.strokeStyle = 'rgba(140,190,255,0.35)';
                ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
            } else if (zn.type === 'freeze') {
                const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
                grd.addColorStop(0, 'rgba(190,235,255,0.35)');
                grd.addColorStop(1, 'rgba(150,210,255,0)');
                ctx.fillStyle = grd;
                ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
            } else if (zn.type === 'bless') {
                const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
                grd.addColorStop(0, 'rgba(255,236,170,0.30)');
                grd.addColorStop(1, 'rgba(255,220,120,0)');
                ctx.fillStyle = grd;
                ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
            }
        }
        for (const v of sim.volcanoes) {
            const sx = this.w2sx(v.x + 0.5), sy = this.w2sy(v.y + 0.5);
            const r = z * 2.5 * (1 + 0.15 * Math.sin(this.frame * 0.2));
            const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
            grd.addColorStop(0, 'rgba(255,220,120,0.9)');
            grd.addColorStop(0.4, 'rgba(255,120,40,0.55)');
            grd.addColorStop(1, 'rgba(120,30,10,0)');
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
        }
        for (const m of this.sim.meteors) {
            const p = 1 - m.life / m.max;
            const sx = this.w2sx(m.x), sy = this.w2sy(m.y);
            const d = (1 - p) * Math.max(this.vw, this.vh) * 0.9;
            const px = sx - d * 0.8, py = sy - d;
            const grd = ctx.createLinearGradient(px - 40, py - 50, px, py);
            grd.addColorStop(0, 'rgba(255,180,60,0)');
            grd.addColorStop(1, 'rgba(255,230,150,0.95)');
            ctx.strokeStyle = grd; ctx.lineWidth = 3 + p * 6;
            ctx.beginPath(); ctx.moveTo(px - 70, py - 88); ctx.lineTo(px, py); ctx.stroke();
            ctx.fillStyle = '#ffe9b0';
            ctx.beginPath(); ctx.arc(px, py, 3 + p * 7, 0, Math.PI * 2); ctx.fill();
            // cílový kříž
            ctx.strokeStyle = 'rgba(255,120,60,0.8)'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(sx, sy, m.r * this.cam.zoom * (0.6 + 0.4 * Math.sin(this.frame * 0.3)), 0, Math.PI * 2); ctx.stroke();
        }
    }

    spawnParticles(x, y, n, opts) {
        for (let k = 0; k < n; k++) {
            const a = Math.random() * Math.PI * 2;
            const sp = (opts.speed || 1) * (0.3 + Math.random());
            this.particles.push({
                x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                life: opts.life || 30, max: opts.life || 30,
                size: opts.size || 2, color: opts.color || '#ffb15c', grav: opts.grav || 0
            });
        }
    }

    drawEffects(paused) {
        const ctx = this.ctx, sim = this.sim, z = this.cam.zoom;
        for (let k = sim.fx.length - 1; k >= 0; k--) {
            const f = sim.fx[k];
            const p = 1 - f.life / f.max;
            const sx = this.w2sx(f.x), sy = this.w2sy(f.y);
            switch (f.type) {
                case 'boom': {
                    const r = f.r * z * (0.25 + p * 1.1);
                    const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
                    const a = (1 - p) * (f.nuke ? 0.95 : 0.85);
                    grd.addColorStop(0, `rgba(255,255,225,${a})`);
                    grd.addColorStop(0.35, `rgba(255,170,60,${a * 0.85})`);
                    grd.addColorStop(0.7, `rgba(180,60,20,${a * 0.5})`);
                    grd.addColorStop(1, 'rgba(60,20,10,0)');
                    ctx.fillStyle = grd;
                    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
                    if (f.life === f.max) this.spawnParticles(f.x, f.y, f.nuke ? 90 : 45, { speed: f.r * 0.09, life: 46, color: '#ffca7a', size: 2.4, grav: 0.004 });
                    break;
                }
                case 'shock': {
                    const r = f.r * z * p;
                    ctx.strokeStyle = `rgba(255,255,255,${(1 - p) * 0.55})`;
                    ctx.lineWidth = 2 + (1 - p) * 4;
                    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
                    break;
                }
                case 'splash': {
                    const r = f.r * z * (0.3 + p);
                    ctx.strokeStyle = `rgba(150,220,255,${(1 - p) * 0.8})`;
                    ctx.lineWidth = 2.5;
                    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
                    if (f.life === f.max) this.spawnParticles(f.x, f.y, 30, { speed: f.r * 0.06, life: 34, color: '#8fd6ff', size: 2, grav: 0.006 });
                    break;
                }
                case 'sparkle': {
                    const r = f.r * z;
                    ctx.fillStyle = f.color;
                    ctx.globalAlpha = (1 - p) * 0.9;
                    for (let s = 0; s < 14; s++) {
                        const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * r;
                        ctx.fillRect(sx + Math.cos(a) * d, sy + Math.sin(a) * d, 2.2, 2.2);
                    }
                    ctx.globalAlpha = 1;
                    break;
                }
                case 'beam': {
                    const r = f.r * z;
                    const grd = ctx.createLinearGradient(sx, sy - this.vh, sx, sy);
                    grd.addColorStop(0, 'rgba(255,255,255,0)');
                    grd.addColorStop(1, `rgba(255,235,170,${(1 - p) * 0.45})`);
                    ctx.fillStyle = grd;
                    ctx.fillRect(sx - r * 0.5, sy - this.vh, r, this.vh);
                    ctx.fillStyle = `rgba(255,255,255,${(1 - p) * 0.5})`;
                    ctx.beginPath(); ctx.ellipse(sx, sy, r * 0.6, r * 0.25, 0, 0, Math.PI * 2); ctx.fill();
                    break;
                }
                case 'bolt': {
                    ctx.strokeStyle = `rgba(255,255,255,${1 - p})`;
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    let px = sx + (Math.random() - 0.5) * 20, py = sy - this.vh;
                    ctx.moveTo(px, py);
                    const steps = 9;
                    for (let s = 1; s <= steps; s++) {
                        const tp = s / steps;
                        px = lerp(px, sx, 0.55) + (Math.random() - 0.5) * 26 * (1 - tp);
                        py = sy - this.vh * (1 - tp);
                        ctx.lineTo(px, py);
                    }
                    ctx.lineTo(sx, sy);
                    ctx.stroke();
                    ctx.strokeStyle = `rgba(180,220,255,${(1 - p) * 0.5})`;
                    ctx.lineWidth = 6; ctx.stroke();
                    break;
                }
                case 'frost': {
                    const r = f.r * z;
                    ctx.fillStyle = `rgba(220,245,255,${0.5 * (1 - p) * 0.5})`;
                    for (let s = 0; s < 10; s++) {
                        const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * r;
                        ctx.fillRect(sx + Math.cos(a) * d, sy + Math.sin(a) * d, 2, 2);
                    }
                    break;
                }
                case 'rain': break;   // kreslí se jako zóna
                case 'meteor': break; // kreslí se v drawZones
            }
            if (!paused) { f.life--; if (f.life <= 0) sim.fx.splice(k, 1); }
        }

        // částice
        for (let k = this.particles.length - 1; k >= 0; k--) {
            const p = this.particles[k];
            const sx = this.w2sx(p.x), sy = this.w2sy(p.y);
            const a = p.life / p.max;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = a;
            ctx.fillRect(sx, sy, p.size, p.size);
            ctx.globalAlpha = 1;
            if (!paused) {
                p.x += p.vx; p.y += p.vy;
                p.vy += p.grav; p.vx *= 0.97; p.vy *= 0.97;
                p.life--;
                if (p.life <= 0) this.particles.splice(k, 1);
            }
        }
        // dým z požárů
        if (this.world.fireSet.size && this.frame % 3 === 0) {
            let n = 0;
            for (const i of this.world.fireSet) {
                if (n++ > 6) break;
                const x = i % this.world.w, y = (i / this.world.w) | 0;
                this.particles.push({
                    x: x + Math.random(), y: y + Math.random(), vx: 0.01, vy: -0.03,
                    life: 40, max: 40, size: 2, color: 'rgba(90,80,80,0.7)', grav: -0.0015
                });
            }
        }
    }

    drawBrush() {
        if (!this.brush.show) return;
        const ctx = this.ctx;
        const sx = this.w2sx(this.brush.x), sy = this.w2sy(this.brush.y);
        const r = this.brush.r * this.cam.zoom;
        ctx.save();
        ctx.strokeStyle = this.brush.color;
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.lineDashOffset = -this.frame * 0.4;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = this.brush.color;
        ctx.fill();
        ctx.restore();
    }

    /* sklo a stíny boxu */
    drawGlass() {
        const ctx = this.ctx;
        const g = ctx.createLinearGradient(0, 0, this.vw * 0.7, this.vh);
        g.addColorStop(0, 'rgba(255,255,255,0.07)');
        g.addColorStop(0.25, 'rgba(255,255,255,0.02)');
        g.addColorStop(0.45, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.vw, this.vh);

        const v = ctx.createRadialGradient(this.vw / 2, this.vh / 2, Math.min(this.vw, this.vh) * 0.35,
            this.vw / 2, this.vh / 2, Math.max(this.vw, this.vh) * 0.78);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(1, 'rgba(0,0,10,0.55)');
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, this.vw, this.vh);
    }

    drawMinimap() {
        const m = this.mini, c = this.mctx;
        if (m.width !== 220) { m.width = 220; m.height = Math.round(220 * this.world.h / this.world.w); }
        this.paintTerrain(0, 0, this.world.w, this.world.h);
        c.imageSmoothingEnabled = false;
        c.drawImage(this.terrain, 0, 0, m.width, m.height);
        // sídla
        c.fillStyle = '#ffd97a';
        for (const s of this.sim.structures) {
            if (!s.alive) continue;
            c.fillRect(s.x / this.world.w * m.width - 1, s.y / this.world.h * m.height - 1, 2, 2);
        }
        // výřez
        const x = (this.cam.x - this.vw / (2 * this.cam.zoom)) / this.world.w * m.width;
        const y = (this.cam.y - this.vh / (2 * this.cam.zoom)) / this.world.h * m.height;
        const w = this.vw / this.cam.zoom / this.world.w * m.width;
        const h = this.vh / this.cam.zoom / this.world.h * m.height;
        c.strokeStyle = 'rgba(255,255,255,0.9)';
        c.lineWidth = 1;
        c.strokeRect(x, y, w, h);
    }

    select(c) { this.selected = c || null; this.selectedUid = c ? c.uid : 0; }

    /* vybraný tvor mohl umřít a jeho slot dostal někdo jiný – pak výběr zrušíme */
    validSelection() {
        const c = this.selected;
        if (c && c.alive && c.uid === this.selectedUid) return c;
        this.selected = null;
        return null;
    }

    creatureAt(wx, wy) {
        let best = null, bestD = 4 / this.cam.zoom + 0.8;
        bestD *= bestD;
        this.sim.forEachNear(wx, wy, 3, (c, d2) => {
            if (d2 < bestD) { bestD = d2; best = c; }
        });
        return best;
    }
}
