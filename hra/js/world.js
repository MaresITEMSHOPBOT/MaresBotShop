'use strict';
/* Svět: terén, voda, vegetace, klima, oheň a láva. Čistá simulace bez DOM. */

const TICKS_PER_YEAR = 100;

class World {
    constructor(w, h, seed) {
        this.w = w; this.h = h; this.n = w * h;
        this.seed = seed >>> 0;

        this.height = new Float32Array(this.n);   // 0..1 nadmořská výška
        this.water = new Float32Array(this.n);    // hloubka vody nad terénem
        this.veg = new Float32Array(this.n);      // 0..1 vegetace (potrava)
        this.fert = new Float32Array(this.n);     // 0..1 úrodnost půdy
        this.moist = new Float32Array(this.n);    // 0..1 vlhkost
        this.fire = new Float32Array(this.n);     // 0..1 hoření
        this.lava = new Float32Array(this.n);     // 0..1 láva
        this.rad = new Float32Array(this.n);      // 0..1 radiace

        this.baseSea = 0.555;
        this.seaLevel = 0.555;
        this.climate = 0;      // globální posun teploty (°C)
        this.dust = 0;         // popel v atmosféře po dopadech (ochlazuje svět)
        this.rain = 0.5;       // 0..1 srážky
        this.season = 0;       // 0..1 fáze roku
        this.tick = 0;
        this.stripe = 0;

        this.fireSet = new Set();
        this.lavaSet = new Set();

        this.generate(this.seed);
    }

    idx(x, y) { return y * this.w + x; }
    inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }

    get year() { return Math.floor(this.tick / TICKS_PER_YEAR); }

    generate(seed) {
        this.seed = seed >>> 0;
        const rng = makeRNG(this.seed);
        const nBase = new Noise(this.seed);
        const nWarp = new Noise((this.seed ^ 0x9e3779b9) >>> 0);
        const nCont = new Noise((this.seed * 7 + 13) >>> 0);
        const nFert = new Noise((this.seed ^ 0x51ab3f) >>> 0);
        const { w, h, height } = this;

        for (let y = 0; y < h; y++) {
            const ny = y / h;
            for (let x = 0; x < w; x++) {
                const i = y * w + x;
                const nx = x / w;
                // deformace domény -> členitější pobřeží
                const wx = nx * 4.2 + 0.7 * nWarp.fbm(nx * 2.6, ny * 2.6, 3);
                const wy = ny * 3.0 + 0.7 * nWarp.fbm(nx * 2.6 + 5.2, ny * 2.6 + 1.3, 3);

                let e = nBase.fbm(wx, wy, 6, 2.0, 0.5) * 0.5 + 0.5;
                const cont = nCont.fbm(nx * 1.7, ny * 1.4, 2) * 0.5 + 0.5;
                e = e * 0.6 + cont * 0.5;

                // hory na vyvýšeninách
                const ridge = 1 - Math.abs(nBase.fbm(wx * 1.7 + 9, wy * 1.7 - 4, 4));
                e += Math.pow(Math.max(0, e - 0.55), 1.15) * ridge * 0.8;

                // okraje mapy stahujeme do hlubokého oceánu – svět je uzavřený box
                const dx = Math.abs(nx * 2 - 1), dy = Math.abs(ny * 2 - 1);
                const fall = smoothstep(0.70, 1.0, Math.max(dx, dy));
                e = e * (1 - fall) + 0.13 * fall;

                height[i] = clamp(e, 0, 1);
                this.fert[i] = clamp(0.45 + nFert.fbm(nx * 6, ny * 6, 3) * 0.9, 0.05, 1);
            }
        }

        // voda, vlhkost, počáteční vegetace
        for (let i = 0; i < this.n; i++) {
            this.water[i] = this.height[i] < this.seaLevel ? this.seaLevel - this.height[i] : 0;
            this.moist[i] = this.water[i] > 0 ? 1 : 0;
            this.veg[i] = 0; this.fire[i] = 0; this.lava[i] = 0; this.rad[i] = 0;
        }
        this.fireSet.clear(); this.lavaSet.clear();

        // vlhkost necháme rozlít a zeleň narůst do rovnováhy
        for (let k = 0; k < 26; k++) this.stepMoisture(0, this.h);
        for (let k = 0; k < 30; k++) this.stepVegetation(0, this.h, 3);
        rng();
    }

    tempAt(x, y, i) {
        const lat = (y / this.h) * 2 - 1;
        let t = 31 - 62 * Math.pow(Math.abs(lat), 1.5);
        t -= Math.max(0, this.height[i] - this.seaLevel) * 58;
        t += this.climate - this.dust;
        t += Math.sin(this.season * Math.PI * 2) * 7 * lat;      // roční období (opačná na polokoulích)
        if (this.water[i] > 0.05) t += 2.5;                       // voda teplotu tlumí
        if (this.lava[i] > 0.02) t += 40 * this.lava[i];
        return t;
    }

    tempAtIdx(i) { return this.tempAt(i % this.w, (i / this.w) | 0, i); }

    /* ---------- jednotlivé kroky simulace ---------- */

    stepWater(y0, y1) {
        const { w, height, water } = this;
        for (let y = y0; y < y1; y++) {
            for (let x = 0; x < w; x++) {
                const i = y * w + x;
                const wv = water[i];
                if (wv <= 1e-4) continue;
                const lvl = height[i] + wv;
                let total = 0;
                const dl = this._dl || (this._dl = new Float32Array(4));
                const nb = this._nb || (this._nb = new Int32Array(4));
                let cnt = 0;
                if (x > 0) { const j = i - 1; const d = lvl - (height[j] + water[j]); if (d > 0) { dl[cnt] = d; nb[cnt++] = j; total += d; } }
                if (x < w - 1) { const j = i + 1; const d = lvl - (height[j] + water[j]); if (d > 0) { dl[cnt] = d; nb[cnt++] = j; total += d; } }
                if (y > 0) { const j = i - w; const d = lvl - (height[j] + water[j]); if (d > 0) { dl[cnt] = d; nb[cnt++] = j; total += d; } }
                if (y < this.h - 1) { const j = i + w; const d = lvl - (height[j] + water[j]); if (d > 0) { dl[cnt] = d; nb[cnt++] = j; total += d; } }
                if (!cnt) continue;
                const move = Math.min(wv, total * 0.22);
                for (let k = 0; k < cnt; k++) {
                    const t = move * (dl[k] / total);
                    water[nb[k]] += t;
                    water[i] -= t;
                }
            }
        }
        // oceán = nekonečný zdroj i odtok, drží hladinu
        for (let y = y0; y < y1; y++) {
            for (let x = 0; x < w; x++) {
                const i = y * w + x;
                if (height[i] < this.seaLevel) {
                    water[i] = this.seaLevel - height[i];
                } else if (water[i] > 0) {
                    const t = this.tempAt(x, y, i);
                    const evap = t > 0 ? 0.004 + t * 0.0004 : 0.001;
                    water[i] = Math.max(0, water[i] - evap);
                }
            }
        }
    }

    stepMoisture(y0, y1) {
        const { w, h, moist, water } = this;
        for (let y = y0; y < y1; y++) {
            for (let x = 0; x < w; x++) {
                const i = y * w + x;
                let target;
                if (water[i] > 0.03) target = 1;
                else {
                    const l = x > 0 ? moist[i - 1] : moist[i];
                    const r = x < w - 1 ? moist[i + 1] : moist[i];
                    const u = y > 0 ? moist[i - w] : moist[i];
                    const d = y < h - 1 ? moist[i + w] : moist[i];
                    target = Math.min(1, (l + r + u + d) * 0.243 + this.rain * 0.30);
                }
                moist[i] += (target - moist[i]) * 0.18;
            }
        }
    }

    stepVegetation(y0, y1, mult = 1) {
        const { w, veg, fert, moist, water, height, rad } = this;
        for (let y = y0; y < y1; y++) {
            for (let x = 0; x < w; x++) {
                const i = y * w + x;
                if (this.lava[i] > 0.01) { veg[i] = 0; continue; }
                const depth = water[i];
                if (depth > 0.16) { veg[i] = 0; continue; }              // hlubina je pustá
                if (depth > 0.10) {                                      // zatopeno – rostliny hnijí
                    veg[i] = Math.max(0, veg[i] - 0.02 * mult);
                    continue;
                }
                const t = this.tempAt(x, y, i);
                let tf = 1 - Math.abs(t - 21) / 27;
                if (t < -3 || t > 47) tf = -0.6;
                const wf = Math.min(1, moist[i] * 1.15);
                const rf = 1 - rad[i] * 0.9;
                let g = fert[i] * tf * wf * rf;
                if (depth > 0.02) g *= 0.55;                             // mělčiny: řasy a plankton
                if (g > 0) veg[i] = Math.min(1, veg[i] + g * (1 - veg[i]) * 0.013 * mult);
                else veg[i] = Math.max(0, veg[i] + g * 0.02 * mult);

                // úrodnost se pomalu obnovuje, radiace ji ničí
                if (fert[i] < 0.62) fert[i] = Math.min(0.62, fert[i] + 0.0004 * mult);
                if (rad[i] > 0.01) fert[i] = Math.max(0.03, fert[i] - rad[i] * 0.0025 * mult);
            }
        }
    }

    stepFire(rng) {
        if (!this.fireSet.size) return;
        const { w, h, veg, fire, water, moist, fert } = this;
        const done = [];
        for (const i of this.fireSet) {
            const x = i % w, y = (i / w) | 0;
            if (water[i] > 0.02) { fire[i] = 0; done.push(i); continue; }
            veg[i] = Math.max(0, veg[i] - 0.09);
            fert[i] = Math.min(1, fert[i] + 0.004);   // popel hnojí
            fire[i] -= 0.018 + moist[i] * 0.02;
            if (fire[i] <= 0 || veg[i] <= 0.01) { fire[i] = 0; done.push(i); continue; }
            // šíření
            for (let k = 0; k < 4; k++) {
                const nx = x + (k === 0 ? -1 : k === 1 ? 1 : 0);
                const ny = y + (k === 2 ? -1 : k === 3 ? 1 : 0);
                if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                const j = ny * w + nx;
                if (fire[j] > 0 || water[j] > 0.02 || veg[j] < 0.12) continue;
                if (rng() < veg[j] * 0.17 * (1 - moist[j] * 0.55)) {
                    fire[j] = 1; this.fireSet.add(j);
                }
            }
        }
        for (const i of done) this.fireSet.delete(i);
    }

    stepLava(rng) {
        if (!this.lavaSet.size) return;
        const { w, h, height, water, veg, lava, fert } = this;
        const done = [];
        const added = [];
        for (const i of this.lavaSet) {
            const x = i % w, y = (i / w) | 0;
            let l = lava[i];
            if (water[i] > 0.02) { water[i] = Math.max(0, water[i] - 0.05); l -= 0.05; }
            // tečení do nižšího souseda
            if (l > 0.22) {
                let best = -1, bestLvl = height[i] + lava[i] * 0.35;
                for (let k = 0; k < 4; k++) {
                    const nx = x + (k === 0 ? -1 : k === 1 ? 1 : 0);
                    const ny = y + (k === 2 ? -1 : k === 3 ? 1 : 0);
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                    const j = ny * w + nx;
                    const lvl = height[j] + lava[j] * 0.35;
                    if (lvl < bestLvl - 0.001) { bestLvl = lvl; best = j; }
                }
                if (best >= 0) {
                    const t = l * 0.34;
                    lava[best] += t; l -= t;
                    added.push(best);
                }
            }
            // zapaluje okolí
            for (let k = 0; k < 4; k++) {
                const nx = x + (k === 0 ? -1 : k === 1 ? 1 : 0);
                const ny = y + (k === 2 ? -1 : k === 3 ? 1 : 0);
                if (!this.inside(nx, ny)) continue;
                const j = ny * w + nx;
                if (veg[j] > 0.15 && this.fire[j] === 0 && rng() < 0.25) { this.fire[j] = 1; this.fireSet.add(j); }
            }
            veg[i] = 0;
            l -= 0.012;                       // tuhne
            if (l <= 0.02) {
                lava[i] = 0;
                height[i] = clamp(height[i] + 0.012, 0, 1);   // nová sopečná hornina
                fert[i] = clamp(fert[i] + 0.25, 0, 1);        // úrodná sopečná půda
                done.push(i);
            } else lava[i] = l;
        }
        for (const i of done) this.lavaSet.delete(i);
        for (const i of added) if (this.lava[i] > 0.02) this.lavaSet.add(i);
    }

    stepRadiation(y0, y1) {
        const { w, rad } = this;
        for (let y = y0; y < y1; y++) {
            for (let x = 0; x < w; x++) {
                const i = y * w + x;
                if (rad[i] > 0) rad[i] = Math.max(0, rad[i] - 0.0009);
            }
        }
    }

    step(rng) {
        this.tick++;
        this.season = (this.tick % TICKS_PER_YEAR) / TICKS_PER_YEAR;

        // těžké průchody rozdělíme do 4 pruhů, každý tik jeden
        const bands = 4;
        const bandH = Math.ceil(this.h / bands);
        const y0 = this.stripe * bandH;
        const y1 = Math.min(this.h, y0 + bandH);
        this.stripe = (this.stripe + 1) % bands;

        this.stepWater(y0, y1);
        this.stepMoisture(y0, y1);
        this.stepVegetation(y0, y1, bands);
        this.stepRadiation(y0, y1);
        this.stepFire(rng);
        this.stepLava(rng);

        // popel z dopadů se pomalu usazuje
        if (this.dust > 0) this.dust = Math.max(0, this.dust - 0.005);

        // tání ledovců / růst hladiny podle klimatu
        const targetSea = this.baseSea + clamp(this.climate, -12, 18) * 0.0016;
        this.seaLevel += (targetSea - this.seaLevel) * 0.004;
    }

    /* ---------- pomocné operace pro boží zásahy ---------- */

    forEachInRadius(cx, cy, r, fn) {
        const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(this.w - 1, Math.ceil(cx + r));
        const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(this.h - 1, Math.ceil(cy + r));
        const r2 = r * r;
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                const d2 = dist2(x + 0.5, y + 0.5, cx, cy);
                if (d2 > r2) continue;
                fn(y * this.w + x, x, y, Math.sqrt(d2) / r);
            }
        }
    }

    ignite(i) { if (this.veg[i] > 0.08 && this.water[i] < 0.02) { this.fire[i] = 1; this.fireSet.add(i); } }
    addLava(i, amount) { this.lava[i] = Math.min(1.6, this.lava[i] + amount); this.lavaSet.add(i); }
}

if (typeof module !== 'undefined') {
    module.exports = { World, TICKS_PER_YEAR };
}
