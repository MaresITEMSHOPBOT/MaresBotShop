'use strict';
/* Základní matematika, generátor náhody a šum. Bez DOM – aby šlo testovat i v Node. */

function makeRNG(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(e0, e1, x) {
    const t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
}
function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }

/* Perlinův šum s permutační tabulkou podle semínka */
class Noise {
    constructor(seed) {
        const rng = makeRNG(seed);
        const perm = new Uint8Array(256);
        for (let i = 0; i < 256; i++) perm[i] = i;
        for (let i = 255; i > 0; i--) {
            const j = (rng() * (i + 1)) | 0;
            const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
        }
        this.p = new Uint8Array(512);
        for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
    }
    grad(hash, x, y) {
        switch (hash & 7) {
            case 0: return x + y;
            case 1: return x - y;
            case 2: return -x + y;
            case 3: return -x - y;
            case 4: return x;
            case 5: return -x;
            case 6: return y;
            default: return -y;
        }
    }
    noise2(x, y) {
        const p = this.p;
        const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
        const xf = x - Math.floor(x), yf = y - Math.floor(y);
        const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
        const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
        const aa = p[p[X] + Y], ab = p[p[X] + Y + 1];
        const ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
        const x1 = lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
        const x2 = lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);
        return lerp(x1, x2, v);
    }
    fbm(x, y, oct = 5, lac = 2, gain = 0.5) {
        let sum = 0, amp = 1, freq = 1, norm = 0;
        for (let i = 0; i < oct; i++) {
            sum += this.noise2(x * freq, y * freq) * amp;
            norm += amp;
            amp *= gain; freq *= lac;
        }
        return sum / norm;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { makeRNG, clamp, lerp, smoothstep, dist2, Noise };
}
