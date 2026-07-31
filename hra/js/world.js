'use strict';
/* Svět jako mapa dlaždic. Terén se mění jen když se opravdu něco stane –
   žádné překreslování každý snímek, žádné kmitání. */

const T = { DEEP: 0, WATER: 1, SAND: 2, GRASS: 3, FOREST: 4, HILL: 5, MOUNT: 6, SNOW: 7, LAVA: 8, ASH: 9, FARM: 10 };
const TILE_NAME = ['hlubina', 'mělčina', 'písek', 'louka', 'les', 'kopce', 'hory', 'sníh', 'láva', 'spáleniště', 'pole'];
const WATER_TILE = [true, true, false, false, false, false, false, false, false, false, false];
const WALK_COST = [99, 99, 1.3, 1, 1.25, 1.6, 2.6, 1.5, 99, 1.1, 1];
/* kolik jídla se dá z dlaždice získat */
const FOOD_TILE = [0, 0.4, 0, 0.5, 1, 0.3, 0, 0.1, 0, 0, 2.2];

class World {
    constructor(w, h, seed) {
        this.w = w; this.h = h; this.n = w * h;
        this.seed = seed >>> 0;

        this.type = new Uint8Array(this.n);
        this.height = new Float32Array(this.n);
        this.moist = new Float32Array(this.n);
        this.veg = new Float32Array(this.n);      // zásoba porostu (těží se z ní jídlo)
        this.wet = new Float32Array(this.n);      // rozlitá voda z povodní
        this.fire = new Uint8Array(this.n);       // zbývající tiky hoření
        this.lava = new Uint8Array(this.n);
        this.build = new Int16Array(this.n);      // index stavby + 1
        this.owner = new Int16Array(this.n);      // id říše, 0 = nikoho

        this.seaLevel = 0.46;
        this.climate = 0;
        this.tick = 0;

        this.fireSet = new Set();
        this.lavaSet = new Set();
        this.wetSet = new Set();
        this.dirty = new Set();                   // dlaždice k překreslení
        this.allDirty = true;
        this.scan = 0;

        this.generate(this.seed);
    }

    idx(x, y) { return y * this.w + x; }
    inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    isWater(i) { return WATER_TILE[this.type[i]]; }
    walkable(i) { return WALK_COST[this.type[i]] < 90; }
    mark(i) { this.dirty.add(i); }

    tempAt(i) {
        const y = (i / this.w) | 0;
        const lat = (y / this.h) * 2 - 1;
        return 30 - 58 * Math.pow(Math.abs(lat), 1.45) - Math.max(0, this.height[i] - this.seaLevel) * 46 + this.climate;
    }

    /* ---------------- generování ---------------- */

    generate(seed) {
        this.seed = seed >>> 0;
        const nBase = new Noise(this.seed);
        const nWarp = new Noise((this.seed ^ 0x9e3779b9) >>> 0);
        const nCont = new Noise((this.seed * 7 + 13) >>> 0);
        const nMoist = new Noise((this.seed ^ 0x51ab3f) >>> 0);
        const { w, h } = this;

        for (let y = 0; y < h; y++) {
            const ny = y / h;
            for (let x = 0; x < w; x++) {
                const i = y * w + x, nx = x / w;
                const wx = nx * 3.4 + 0.55 * nWarp.fbm(nx * 2.4, ny * 2.4, 3);
                const wy = ny * 2.6 + 0.55 * nWarp.fbm(nx * 2.4 + 5.2, ny * 2.4 + 1.3, 3);

                let e = nBase.fbm(wx, wy, 5, 2, 0.5) * 0.5 + 0.5;
                e = e * 0.6 + (nCont.fbm(nx * 1.5, ny * 1.3, 2) * 0.5 + 0.5) * 0.5;
                const ridge = 1 - Math.abs(nBase.fbm(wx * 1.6 + 9, wy * 1.6 - 4, 3));
                e += Math.pow(Math.max(0, e - 0.5), 1.15) * ridge * 1.05;

                // okraje světa stahujeme do moře, aby byl svět uzavřený v krabici
                const d = Math.max(Math.abs(nx * 2 - 1), Math.abs(ny * 2 - 1));
                const fall = smoothstep(0.68, 1, d);
                e = e * (1 - fall) + 0.12 * fall;

                this.height[i] = clamp(e, 0, 1);
                this.moist[i] = clamp(0.5 + nMoist.fbm(nx * 4, ny * 4, 3) * 1.1, 0, 1);
                this.wet[i] = 0; this.fire[i] = 0; this.lava[i] = 0;
                this.build[i] = 0; this.owner[i] = 0;
            }
        }

        // vlhkost stoupá u vody (jednoduché rozostření směrem od moře)
        for (let pass = 0; pass < 3; pass++) {
            const src = Float32Array.from(this.moist);
            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    const i = y * w + x;
                    const sea = this.height[i] < this.seaLevel ? 1 : 0;
                    const avg = (src[i - 1] + src[i + 1] + src[i - w] + src[i + w]) * 0.25;
                    this.moist[i] = clamp(Math.max(sea, avg * 0.85 + src[i] * 0.15), 0, 1);
                }
            }
        }

        for (let i = 0; i < this.n; i++) {
            const t = this.tempAt(i);
            this.veg[i] = this.height[i] < this.seaLevel ? 0
                : clamp(this.moist[i] * 1.05 - Math.max(0, (t - 28) / 14) - Math.max(0, (2 - t) / 12), 0, 1);
            this.classify(i);
        }
        this.fireSet.clear(); this.lavaSet.clear(); this.wetSet.clear();
        this.allDirty = true;
    }

    /* podle výšky, teploty, vláhy a porostu určí, co na dlaždici je */
    classify(i) {
        const h = this.height[i];
        let t;
        if (this.lava[i] > 0) t = T.LAVA;
        else if (h < this.seaLevel - 0.055) t = T.DEEP;
        else if (h < this.seaLevel) t = T.WATER;
        else if (this.wet[i] > 0.12) t = T.WATER;
        else {
            const temp = this.tempAt(i);
            if (h > 0.75) t = T.MOUNT;
            else if (temp < -5) t = T.SNOW;
            else if (h > 0.645) t = T.HILL;
            else if (h < this.seaLevel + 0.012) t = T.SAND;
            else if (this.moist[i] < 0.3 && temp > 15) t = T.SAND;
            else if (this.veg[i] > 0.6) t = T.FOREST;
            else t = T.GRASS;
        }
        if (this.type[i] !== t) { this.type[i] = t; this.mark(i); return true; }
        return false;
    }

    setType(i, t) {
        if (this.type[i] === t) return;
        this.type[i] = t;
        this.mark(i);
    }

    /* natvrdo přemaluje dlaždici (štětce hráče) */
    paint(i, t) {
        const sea = this.seaLevel;
        if (t === T.DEEP) { this.height[i] = sea - 0.12; this.wet[i] = 0; }
        else if (t === T.WATER) { this.height[i] = sea - 0.02; this.wet[i] = 0; }
        else if (t === T.MOUNT) this.height[i] = 0.86;
        else if (t === T.HILL) this.height[i] = 0.74;
        else if (this.height[i] < sea + 0.02) this.height[i] = sea + 0.05;
        if (t === T.FOREST) this.veg[i] = 1;
        if (t === T.GRASS) this.veg[i] = 0.35;
        if (t === T.SAND) { this.veg[i] = 0; this.moist[i] = Math.min(this.moist[i], 0.25); }
        if (t === T.SNOW) this.veg[i] = 0;
        this.lava[i] = 0; this.fire[i] = 0;
        this.lavaSet.delete(i); this.fireSet.delete(i);
        this.setType(i, t);
    }

    ignite(i) {
        const t = this.type[i];
        if (t !== T.FOREST && t !== T.GRASS && t !== T.FARM) return false;
        if (this.fire[i]) return false;
        this.fire[i] = 26 + (t === T.FOREST ? 22 : 0);
        this.fireSet.add(i);
        this.mark(i);
        return true;
    }

    addLava(i) {
        this.lava[i] = 45;
        this.lavaSet.add(i);
        this.fire[i] = 0; this.fireSet.delete(i);
        this.veg[i] = 0;
        this.setType(i, T.LAVA);
    }

    addWater(i, amount) {
        if (this.height[i] < this.seaLevel) return;
        this.wet[i] += amount;
        this.wetSet.add(i);
        this.classify(i);
    }

    neighbors(i, fn) {
        const x = i % this.w, y = (i / this.w) | 0;
        if (x > 0) fn(i - 1, x - 1, y);
        if (x < this.w - 1) fn(i + 1, x + 1, y);
        if (y > 0) fn(i - this.w, x, y - 1);
        if (y < this.h - 1) fn(i + this.w, x, y + 1);
    }

    forEachInRadius(cx, cy, r, fn) {
        const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(this.w - 1, Math.ceil(cx + r));
        const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(this.h - 1, Math.ceil(cy + r));
        const r2 = r * r;
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                const d2 = dist2(x + 0.5, y + 0.5, cx + 0.5, cy + 0.5);
                if (d2 <= r2) fn(y * this.w + x, x, y, Math.sqrt(d2) / r);
            }
        }
    }

    /* ---------------- běh světa ---------------- */

    step(rng) {
        this.tick++;
        this.stepFire(rng);
        this.stepLava(rng);
        this.stepWater();
        this.stepGrowth(rng);
    }

    stepFire(rng) {
        if (!this.fireSet.size) return;
        const done = [];
        for (const i of this.fireSet) {
            if (--this.fire[i] <= 0) {
                this.fire[i] = 0;
                this.veg[i] = 0;
                this.setType(i, T.ASH);
                done.push(i);
                continue;
            }
            if ((this.tick & 1) === 0) this.mark(i);          // pomalé mihotání plamene
            if (rng() < 0.07) this.neighbors(i, j => { if (rng() < 0.4) this.ignite(j); });
        }
        for (const i of done) this.fireSet.delete(i);
    }

    stepLava(rng) {
        if (!this.lavaSet.size) return;
        const done = [], add = [];
        for (const i of this.lavaSet) {
            if (rng() < 0.10) {
                let best = -1, bestH = this.height[i];
                this.neighbors(i, j => { if (this.height[j] < bestH && !this.lava[j]) { bestH = this.height[j]; best = j; } });
                if (best >= 0 && rng() < 0.6) add.push(best);
            }
            this.neighbors(i, j => { if (rng() < 0.08) this.ignite(j); });
            if (--this.lava[i] <= 0) {
                this.lava[i] = 0;
                this.height[i] = Math.min(1, this.height[i] + 0.03);
                this.moist[i] = Math.min(1, this.moist[i] + 0.1);   // sopečná půda je úrodná
                this.veg[i] = 0.2;
                this.classify(i);
                done.push(i);
            } else if ((this.tick % 3) === 0) this.mark(i);
        }
        for (const i of done) this.lavaSet.delete(i);
        for (const i of add) this.addLava(i);
    }

    stepWater() {
        if (!this.wetSet.size) return;
        const done = [];
        for (const i of this.wetSet) {
            const wv = this.wet[i];
            if (wv <= 0.01) { this.wet[i] = 0; this.classify(i); done.push(i); continue; }
            const lvl = this.height[i] + wv;
            this.neighbors(i, j => {
                if (this.height[j] < this.seaLevel) { this.wet[i] = Math.max(0, this.wet[i] - wv * 0.3); return; }
                const dl = lvl - (this.height[j] + this.wet[j]);
                if (dl > 0.02) {
                    const move = Math.min(this.wet[i], dl * 0.22);
                    this.wet[i] -= move; this.wet[j] += move;
                    this.wetSet.add(j); this.classify(j);
                }
            });
            this.wet[i] = Math.max(0, this.wet[i] - 0.006);
            this.classify(i);
        }
        for (const i of done) this.wetSet.delete(i);
    }

    /* pomalý růst porostu – projde vždy kousek mapy, aby se svět měnil klidně */
    stepGrowth(rng) {
        for (let k = 0; k < 260; k++) {
            const i = (this.scan = (this.scan + 7919) % this.n);
            const t = this.type[i];
            if (t === T.DEEP || t === T.WATER || t === T.MOUNT || t === T.LAVA || t === T.FARM) continue;
            const temp = this.tempAt(i);
            const good = temp > 0 && temp < 34 ? this.moist[i] : 0;
            if (t === T.ASH) {
                this.veg[i] += 0.05 * good;
                if (this.veg[i] > 0.25) this.classify(i);
                continue;
            }
            this.veg[i] = clamp(this.veg[i] + (good * 0.95 - this.veg[i]) * 0.04, 0, 1);
            if (rng() < 0.3) this.classify(i);
        }
    }

    /* změna klimatu překreslí celou mapu naráz */
    reclassifyAll() {
        for (let i = 0; i < this.n; i++) this.classify(i);
        this.allDirty = true;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { World, T, TILE_NAME, WATER_TILE, WALK_COST, FOOD_TILE };
}
