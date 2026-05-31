/* ==========================================================================
   MARES CASINO – herní engine (čistá logika, bez DOM)
   Lze spustit i v Node.js (kvůli simulaci RTP). Veškerá náhoda jde přes
   Casino.Engine.rng, takže se dá nahradit seedovaným generátorem.
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    var util = Casino.util;

    var Engine = Casino.Engine = {
        rng: Math.random
    };

    /* ----- pomocné ----- */
    function symById(game, id) {
        for (var i = 0; i < game.symbols.length; i++) if (game.symbols[i].id === id) return game.symbols[i];
        return null;
    }
    // největší výplatní hladina <= count
    function payFor(sym, count) {
        if (!sym || !sym.pays) return 0;
        var best = 0;
        for (var k in sym.pays) { var kn = +k; if (kn <= count && kn > best) best = kn; }
        return best ? sym.pays[best] : 0;
    }
    Engine.symById = symById;

    // vážený výběr jednoho symbolu (volitelně s vyloučením některých id)
    function pickSymbol(game, exclude) {
        var pool = game.symbols;
        if (exclude && exclude.length) {
            pool = pool.filter(function (s) { return exclude.indexOf(s.id) === -1; });
        }
        return util.weightedPick(pool, Engine.rng);
    }

    // vytvoří jednu buňku (objekt) z daného symbolu
    function makeCell(game, sym) {
        var cell = { id: sym.id };
        if (sym.orb) cell.m = util.weightedValue(game.orbValues, Engine.rng);  // hodnota násobiče
        return cell;
    }

    /* ======================================================================
       LINIOVÉ HRY (klasik / video sloty)
       grid[reel][row] = {id, wm?}
       ===================================================================== */
    Engine.generateLineGrid = function (game) {
        var grid = [];
        for (var r = 0; r < game.reels; r++) {
            var col = [];
            for (var y = 0; y < game.rows; y++) {
                var sym = pickSymbol(game);
                var cell = { id: sym.id };
                // násobící wild – přiřadíme náhodný násobič
                if (sym.wild && game.multiplierWild) {
                    cell.wm = game.multiplierWild[util.randInt(0, game.multiplierWild.length - 1)];
                }
                col.push(cell);
            }
            grid.push(col);
        }
        return grid;
    };

    // vyhodnocení jednoho roztočení liniové hry
    // opts: { betPerLine, totalBet, freeSpin(bool), expandingSymbol(id) }
    Engine.evaluateLines = function (game, grid, opts) {
        var betPerLine = opts.betPerLine, totalBet = opts.totalBet;
        var wildId = null, scatterId = null;
        game.symbols.forEach(function (s) { if (s.wild) wildId = s.id; if (s.scatter) scatterId = s.id; });

        var result = { wins: [], lineWin: 0, scatterWin: 0, totalWin: 0, scatterCount: 0, freeSpinsAwarded: 0, scatterCells: [] };

        /* --- Book: expandující symbol ve free spinech --- */
        if (opts.freeSpin && game.freeSpins && game.freeSpins.expanding && opts.expandingSymbol) {
            var exId = opts.expandingSymbol;
            var reelsWith = [];
            for (var er = 0; er < game.reels; er++) {
                var has = false;
                for (var ey = 0; ey < game.rows; ey++) {
                    if (grid[er][ey].id === exId || (scatterId && game.freeSpins.scatterIsWild && grid[er][ey].id === scatterId && exId === scatterId)) has = true;
                }
                if (has) reelsWith.push(er);
            }
            if (reelsWith.length >= 2) {
                var exSym = symById(game, exId);
                var exPay = payFor(exSym, reelsWith.length);
                if (exPay > 0) {
                    var amount = exPay * betPerLine * game.paylines.length;
                    var cells = [];
                    reelsWith.forEach(function (rr) { for (var yy = 0; yy < game.rows; yy++) cells.push([rr, yy]); });
                    result.wins.push({ type: 'expand', symbol: exId, count: reelsWith.length, cells: cells, amount: amount });
                    result.lineWin += amount;
                }
            }
        }

        /* --- klasické výherní linie --- */
        if (!(opts.freeSpin && game.freeSpins && game.freeSpins.expanding)) {
            for (var li = 0; li < game.paylines.length; li++) {
                var line = game.paylines[li];
                // symboly na lince
                var lineCells = [];
                for (var c = 0; c < line.length; c++) lineCells.push(grid[c][line[c]]);

                // urči "platící" symbol = první ne-wild
                var baseId = null;
                for (var i = 0; i < lineCells.length; i++) {
                    if (lineCells[i].id !== wildId) { baseId = lineCells[i].id; break; }
                }
                if (baseId === null) baseId = wildId; // samé wildy

                // scatter neplatí po linii
                if (baseId === scatterId) continue;

                // spočítej souvislou řadu od válce 0
                var count = 0, wildMult = 1, runCells = [];
                for (var j = 0; j < lineCells.length; j++) {
                    var cid = lineCells[j].id;
                    if (cid === baseId || cid === wildId) {
                        count++;
                        runCells.push([j, line[j]]);
                        // násobící wild – bereme nejvyšší (ne součin, ten exploduje)
                        if (cid === wildId && lineCells[j].wm) wildMult = Math.max(wildMult, lineCells[j].wm);
                    } else break;
                }

                var sym = symById(game, baseId);
                var pay = payFor(sym, count);
                // varianta: linie samých wildů platí dle wildu
                if (wildId) {
                    var wcount = 0;
                    for (var w = 0; w < lineCells.length; w++) { if (lineCells[w].id === wildId) wcount++; else break; }
                    var wpay = payFor(symById(game, wildId), wcount);
                    if (wpay * 1 > pay * 1 && wcount > 0) { /* wild linie lepší – necháme základ, wild se stejně počítá */ }
                }
                if (pay > 0) {
                    var amt = pay * betPerLine * wildMult;
                    result.wins.push({ type: 'line', line: li, symbol: baseId, count: count, cells: runCells, amount: amt, mult: wildMult });
                    result.lineWin += amt;
                }
            }
        }

        /* --- scatter (kdekoliv) --- */
        if (scatterId) {
            var sc = 0, scCells = [];
            for (var sr = 0; sr < game.reels; sr++) for (var sy = 0; sy < game.rows; sy++) {
                if (grid[sr][sy].id === scatterId) { sc++; scCells.push([sr, sy]); }
            }
            result.scatterCount = sc;
            result.scatterCells = scCells;
            var scSym = symById(game, scatterId);
            var scPay = payFor(scSym, sc);
            if (scPay > 0) { result.scatterWin = scPay * totalBet; }
            if (game.freeSpins && sc >= game.freeSpins.trigger) {
                result.freeSpinsAwarded = game.freeSpins.count;
            }
        }

        // globální násobič ve free spinech
        var gm = (opts.freeSpin && game.freeSpins && game.freeSpins.globalMultiplier) ? game.freeSpins.globalMultiplier : 1;
        result.lineWin *= gm;
        result.totalWin = result.lineWin + result.scatterWin;
        result.globalMult = gm;
        return result;
    };

    /* ======================================================================
       TUMBLE HRA (výhry kdekoliv + kaskády + násobící koule)
       ===================================================================== */
    Engine.generateTumbleGrid = function (game) {
        var grid = [];
        for (var r = 0; r < game.reels; r++) {
            var col = [];
            for (var y = 0; y < game.rows; y++) col.push(makeCell(game, pickSymbol(game)));
            grid.push(col);
        }
        return grid;
    };

    // najde výherní symboly (>=cluster) – vrací {symbolId: [cells]}
    function findClusters(game, grid) {
        var counts = {}, cells = {};
        for (var r = 0; r < game.reels; r++) for (var y = 0; y < game.rows; y++) {
            var cell = grid[r][y];
            var sym = symById(game, cell.id);
            if (sym.orb || sym.scatter) continue;
            counts[cell.id] = (counts[cell.id] || 0) + 1;
            (cells[cell.id] = cells[cell.id] || []).push([r, y]);
        }
        var out = {};
        for (var id in counts) if (counts[id] >= game.cluster) out[id] = cells[id];
        return out;
    }

    // gravitace + doplnění – odstraní zadané buňky, zbytek spadne dolů
    function cascade(game, grid, removeSet) {
        for (var r = 0; r < game.reels; r++) {
            var survivors = [];
            for (var y = 0; y < game.rows; y++) {
                if (!removeSet[r + ':' + y]) survivors.push(grid[r][y]);
            }
            var need = game.rows - survivors.length;
            var newCol = [];
            for (var n = 0; n < need; n++) newCol.push(makeCell(game, pickSymbol(game)));
            grid[r] = newCol.concat(survivors);
        }
    }

    // jedno celé roztočení tumble hry -> vrací popis kaskád pro animaci
    // opts: { totalBet }
    Engine.spinTumble = function (game, opts) {
        var totalBet = opts.totalBet;
        var grid = Engine.generateTumbleGrid(game);

        // scatter trigger počítáme z prvního obrazu
        var scCount = 0, scCells = [];
        for (var r = 0; r < game.reels; r++) for (var y = 0; y < game.rows; y++)
            if (symById(game, grid[r][y].id).scatter) { scCount++; scCells.push([r, y]); }

        var steps = [];
        var totalBase = 0;        // výhra před násobiči
        var safety = 0;
        while (safety++ < 40) {
            var clusters = findClusters(game, grid);
            var ids = Object.keys(clusters);
            if (!ids.length) break;

            var stepWin = 0, winCells = [], removeSet = {};
            ids.forEach(function (id) {
                var cs = clusters[id];
                var pay = payFor(symById(game, id), cs.length);
                stepWin += pay * totalBet;
                cs.forEach(function (rc) { winCells.push([rc[0], rc[1], id]); removeSet[rc[0] + ':' + rc[1]] = true; });
            });
            totalBase += stepWin;

            // hluboká kopie gridu pro krok (popis pro animaci)
            steps.push({
                grid: grid.map(function (col) { return col.map(function (c) { return { id: c.id, m: c.m }; }); }),
                winCells: winCells,
                stepWin: stepWin
            });
            cascade(game, grid, removeSet);
        }

        // posbírej násobící koule z finálního obrazu
        var orbSum = 0, orbCells = [];
        for (var or = 0; or < game.reels; or++) for (var oy = 0; oy < game.rows; oy++) {
            if (grid[or][oy].m) { orbSum += grid[or][oy].m; orbCells.push([or, oy, grid[or][oy].m]); }
        }

        // finální obraz (po poslední kaskádě) přidáme jako poslední krok bez výhry
        steps.push({
            grid: grid.map(function (col) { return col.map(function (c) { return { id: c.id, m: c.m }; }); }),
            winCells: [], stepWin: 0, final: true
        });

        var mult = (totalBase > 0 && orbSum > 0) ? orbSum : 1;
        var scSym = symById(game, (game.symbols.filter(function (s) { return s.scatter; })[0] || {}).id);
        var scatterWin = scSym ? payFor(scSym, scCount) * totalBet : 0;

        return {
            steps: steps,
            baseWin: totalBase,
            orbSum: orbSum,
            orbCells: orbCells,
            multiplier: mult,
            totalWin: totalBase * mult + scatterWin,
            scatterCount: scCount,
            scatterCells: scCells,
            scatterWin: scatterWin,
            freeSpinsAwarded: (game.freeSpins && scCount >= game.freeSpins.trigger) ? game.freeSpins.count : 0
        };
    };

})(typeof window !== 'undefined' ? window : global);

if (typeof module !== 'undefined' && module.exports) module.exports = (typeof window !== 'undefined' ? window : global).Casino;
