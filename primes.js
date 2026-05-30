'use strict';

/**
 * Algoritmus na hledání prvočísel.
 * Čísla v rozsahu 0–1000 se ignorují — pracuje se pouze s čísly > 1000.
 */

const IGNORE_BELOW = 1000; // hranice: čísla 0..1000 (včetně) ignorujeme

/**
 * Vrátí všechna prvočísla v intervalu (1000, limit] pomocí Eratosthenova síta.
 * @param {number} limit horní mez (včetně)
 * @returns {number[]} pole prvočísel větších než 1000
 */
function primesIgnoringFirst1000(limit) {
    if (!Number.isInteger(limit) || limit <= IGNORE_BELOW) {
        return [];
    }

    // Eratosthenovo síto do horní meze (0 = neznámo/prvočíslo, 1 = složené)
    const isComposite = new Uint8Array(limit + 1);
    for (let p = 2; p * p <= limit; p++) {
        if (!isComposite[p]) {
            for (let multiple = p * p; multiple <= limit; multiple += p) {
                isComposite[multiple] = 1;
            }
        }
    }

    // Sběr prvočísel, čísla <= 1000 přeskakujeme (ignorujeme)
    const primes = [];
    for (let n = IGNORE_BELOW + 1; n <= limit; n++) {
        if (!isComposite[n]) {
            primes.push(n);
        }
    }
    return primes;
}

/**
 * Otestuje, zda je jediné číslo prvočíslo. Čísla <= 1000 jsou ignorována
 * (vrací false), protože spadají do ignorovaného rozsahu 0–1000.
 * @param {number} n testované číslo
 * @returns {boolean} true, pokud je n prvočíslo větší než 1000
 */
function isPrimeIgnoringFirst1000(n) {
    if (!Number.isInteger(n) || n <= IGNORE_BELOW) {
        return false; // ignorováno
    }
    if (n % 2 === 0) {
        return false; // sudé číslo > 1000 nikdy není prvočíslo
    }
    for (let d = 3; d * d <= n; d += 2) {
        if (n % d === 0) {
            return false;
        }
    }
    return true;
}

// Export pro použití jako modul (Node), pokud je dostupný module.exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { primesIgnoringFirst1000, isPrimeIgnoringFirst1000, IGNORE_BELOW };
}

// Spuštění z příkazové řádky: node primes.js [limit]
if (typeof require !== 'undefined' && require.main === module) {
    const limit = Number(process.argv[2]) || 2000;
    const result = primesIgnoringFirst1000(limit);
    console.log(`Prvočísla v intervalu (1000, ${limit}]: ${result.length} ks`);
    console.log(result.join(', '));
}
