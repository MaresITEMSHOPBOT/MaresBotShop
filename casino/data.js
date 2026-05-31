/* ==========================================================================
   MARES CASINO – definice her (data-driven sloty)
   Tento soubor neobsahuje žádnou DOM logiku, jen data + drobné utility,
   aby šel načíst i v Node.js (kvůli simulaci RTP).
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    Casino.registry = Casino.registry || [];   // katalog všech her (sloty + arkády + stolní)

    /* ---------- Utility ---------- */
    var nf = (typeof Intl !== 'undefined')
        ? new Intl.NumberFormat('cs-CZ')
        : { format: function (n) { return String(Math.round(n)); } };

    Casino.util = {
        // formát kreditů (celé číslo, oddělené tisíce)
        fmt: function (n) { return nf.format(Math.round(n)); },
        // náhodné celé číslo <min, max>
        randInt: function (min, max) { return min + Math.floor(Math.random() * (max - min + 1)); },
        clamp: function (n, a, b) { return Math.max(a, Math.min(b, n)); },
        // vážený výběr z pole {weight}
        weightedPick: function (arr, rng) {
            rng = rng || Math.random;
            var total = 0, i;
            for (i = 0; i < arr.length; i++) total += (arr[i].weight || 1);
            var r = rng() * total;
            for (i = 0; i < arr.length; i++) {
                r -= (arr[i].weight || 1);
                if (r <= 0) return arr[i];
            }
            return arr[arr.length - 1];
        },
        // vážený výběr z pole dvojic [hodnota, váha]
        weightedValue: function (pairs, rng) {
            rng = rng || Math.random;
            var total = 0, i;
            for (i = 0; i < pairs.length; i++) total += pairs[i][1];
            var r = rng() * total;
            for (i = 0; i < pairs.length; i++) {
                r -= pairs[i][1];
                if (r <= 0) return pairs[i][0];
            }
            return pairs[pairs.length - 1][0];
        }
    };

    /* ---------- Pomocné generátory výherních linií ---------- */
    // pro 3 válce / 3 řady – 5 linií
    var LINES_3x3 = [
        [1, 1, 1],       // střed
        [0, 0, 0],       // horní
        [2, 2, 2],       // dolní
        [0, 1, 2],       // diagonála \
        [2, 1, 0]        // diagonála /
    ];

    // pro 5 válců / 3 řady – až 20 linií (běžné video-slot vzory)
    var LINES_5x3 = [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
        [2, 2, 2, 2, 2],
        [0, 1, 2, 1, 0],
        [2, 1, 0, 1, 2],
        [0, 0, 1, 2, 2],
        [2, 2, 1, 0, 0],
        [1, 0, 0, 0, 1],
        [1, 2, 2, 2, 1],
        [0, 1, 1, 1, 0],
        [2, 1, 1, 1, 2],
        [1, 0, 1, 2, 1],
        [1, 2, 1, 0, 1],
        [0, 1, 0, 1, 0],
        [2, 1, 2, 1, 2],
        [1, 1, 0, 1, 1],
        [1, 1, 2, 1, 1],
        [0, 0, 2, 0, 0],
        [2, 2, 0, 2, 2],
        [0, 2, 0, 2, 0]
    ];

    function takeLines(base, n) { return base.slice(0, n); }

    /* ========================================================================
       DEFINICE AUTOMATŮ
       Každý symbol: {id, icon, name, weight, pays:{count:multiplikátor}}
       pays je násobek sázky NA LINII (u scatteru násobek CELKOVÉ sázky).
       ===================================================================== */
    Casino.GAMES = [

        /* ---- 1) Klasický ovocný automat (3x3, 5 linií) ---- */
        {
            id: 'fruit-classic',
            type: 'lines',
            name: 'Ovocný Klasik',
            tagline: 'Tradiční ovoce, jednoduché výhry',
            emoji: '🍒',
            volatility: 'Nízká',
            rtp: 96,
            reels: 3, rows: 3,
            paylines: LINES_3x3,
            theme: { a: '#ff4d6d', b: '#ffd23f', bg: 'radial-gradient(circle at 50% 0%, #3a1020, #150208)' },
            bets: [10, 20, 50, 100, 250, 500, 1000],
            symbols: [
                { id: 'cherry', icon: '🍒', name: 'Třešně', weight: 28, pays: { 2: 1, 3: 5 } },
                { id: 'lemon', icon: '🍋', name: 'Citron', weight: 24, pays: { 3: 9 } },
                { id: 'orange', icon: '🍊', name: 'Pomeranč', weight: 20, pays: { 3: 14 } },
                { id: 'grape', icon: '🍇', name: 'Hrozny', weight: 16, pays: { 3: 20 } },
                { id: 'bell', icon: '🔔', name: 'Zvonek', weight: 12, pays: { 3: 36 } },
                { id: 'seven', icon: '7️⃣', name: 'Sedmička', weight: 8, pays: { 3: 72 } },
                { id: 'wild', icon: '⭐', name: 'Hvězda (Wild)', weight: 6, wild: true, pays: { 2: 5, 3: 110 } }
            ]
        },

        /* ---- 2) Lucky 7s Deluxe (3x3, 5 linií, vyšší volatilita) ---- */
        {
            id: 'lucky7',
            type: 'lines',
            name: 'Lucky 7s Deluxe',
            tagline: 'Vsaď na sedmičky a velký jackpot',
            emoji: '7️⃣',
            volatility: 'Vysoká',
            rtp: 95,
            reels: 3, rows: 3,
            paylines: LINES_3x3,
            theme: { a: '#ffd700', b: '#ff7b00', bg: 'radial-gradient(circle at 50% 0%, #2a1c00, #0d0700)' },
            bets: [10, 20, 50, 100, 250, 500, 1000, 2000],
            symbols: [
                { id: 'clover', icon: '🍀', name: 'Čtyřlístek', weight: 30, pays: { 3: 3 } },
                { id: 'cherry', icon: '🍒', name: 'Třešně', weight: 24, pays: { 2: 1, 3: 7 } },
                { id: 'bell', icon: '🔔', name: 'Zvonek', weight: 18, pays: { 3: 13 } },
                { id: 'gem', icon: '💎', name: 'Diamant', weight: 14, pays: { 3: 28 } },
                { id: 'bar', icon: '🅱️', name: 'BAR', weight: 12, pays: { 3: 45 } },
                { id: 'wild', icon: '⭐', name: 'Hvězda (Wild)', weight: 6, wild: true, pays: { 2: 5, 3: 90 } },
                { id: 'seven', icon: '7️⃣', name: 'Lucky 7', weight: 6, pays: { 3: 150 } }
            ]
        },

        /* ---- 3) Book of Egypt (5x3, 10 linií, free spins + expandující symbol) ---- */
        {
            id: 'book-egypt',
            type: 'lines',
            name: 'Book of Egypt',
            tagline: 'Najdi knihu a odhal poklad faraonů',
            emoji: '📖',
            volatility: 'Vysoká',
            rtp: 95,
            reels: 5, rows: 3,
            paylines: takeLines(LINES_5x3, 10),
            theme: { a: '#e6b800', b: '#c97f1a', bg: 'radial-gradient(circle at 50% 0%, #2b1d05, #0c0700)' },
            bets: [10, 20, 50, 100, 250, 500, 1000],
            freeSpins: { trigger: 3, count: 10, scatterIsWild: true, expanding: true, buyCost: 13 }, ante: { mult: 1.25, scatterMult: 1.2 },
            symbols: [
                { id: 'c1', icon: '🔶', name: 'A', weight: 24, pays: { 3: 1, 4: 4, 5: 10 } },
                { id: 'c2', icon: '🔷', name: 'K', weight: 24, pays: { 3: 1, 4: 4, 5: 10 } },
                { id: 'c3', icon: '🟢', name: 'Q', weight: 22, pays: { 3: 1, 4: 4, 5: 13 } },
                { id: 'c4', icon: '🔴', name: 'J', weight: 22, pays: { 3: 1, 4: 4, 5: 13 } },
                { id: 'cat', icon: '🐈', name: 'Kočka', weight: 14, pays: { 2: 1, 3: 8, 4: 25, 5: 100 } },
                { id: 'falcon', icon: '🦅', name: 'Sokol', weight: 12, pays: { 2: 1, 3: 10, 4: 30, 5: 140 } },
                { id: 'scarab', icon: '🪲', name: 'Skarab', weight: 10, pays: { 2: 1, 3: 15, 4: 50, 5: 220 } },
                { id: 'pharaoh', icon: '🤴', name: 'Faraon', weight: 8, pays: { 3: 30, 4: 120, 5: 600 } },
                { id: 'book', icon: '📖', name: 'Kniha (Wild+Scatter)', weight: 7, wild: true, scatter: true, pays: { 3: 2, 4: 20, 5: 200 } }
            ]
        },

        /* ---- 4) Cosmic Fortune (5x3, 20 linií, násobící wild + free spins) ---- */
        {
            id: 'cosmic',
            type: 'lines',
            name: 'Cosmic Fortune',
            tagline: 'Vesmírné výhry s násobícími wildy',
            emoji: '🚀',
            volatility: 'Střední',
            rtp: 96,
            reels: 5, rows: 3,
            paylines: takeLines(LINES_5x3, 20),
            theme: { a: '#7b61ff', b: '#00e5ff', bg: 'radial-gradient(circle at 50% 0%, #0b0a2e, #03040f)' },
            bets: [20, 40, 100, 200, 400, 1000, 2000],
            multiplierWild: [2, 3],
            freeSpins: { trigger: 3, count: 12, globalMultiplier: 2, buyCost: 16 }, ante: { mult: 1.25, scatterMult: 1.2 },
            symbols: [
                { id: 'p1', icon: '🔵', name: 'Modrá', weight: 24, pays: { 3: 1, 4: 4, 5: 12 } },
                { id: 'p2', icon: '🟣', name: 'Fialová', weight: 22, pays: { 3: 1, 4: 4, 5: 12 } },
                { id: 'p3', icon: '🟢', name: 'Zelená', weight: 20, pays: { 3: 2, 4: 6, 5: 16 } },
                { id: 'p4', icon: '🔴', name: 'Červená', weight: 18, pays: { 3: 2, 4: 6, 5: 16 } },
                { id: 'ufo', icon: '🛸', name: 'UFO', weight: 14, pays: { 3: 6, 4: 18, 5: 70 } },
                { id: 'comet', icon: '☄️', name: 'Kometa', weight: 12, pays: { 3: 8, 4: 24, 5: 100 } },
                { id: 'alien', icon: '👽', name: 'Mimozemšťan', weight: 10, pays: { 3: 12, 4: 50, 5: 180 } },
                { id: 'wild', icon: '🌟', name: 'Hvězda (Wild x2/x3)', weight: 6, wild: true, pays: { 3: 18, 4: 90, 5: 360 } },
                { id: 'scatter', icon: '🪐', name: 'Planeta (Scatter)', weight: 6, scatter: true, pays: { 3: 2, 4: 12, 5: 60 } }
            ]
        },

        /* ---- 5) Wild West Gold (5x3, 40 linií, hodně akce) ---- */
        {
            id: 'wildwest',
            type: 'lines',
            name: 'Wild West Gold',
            tagline: 'Divoký západ a zlaté pytle',
            emoji: '🤠',
            volatility: 'Střední',
            rtp: 96,
            reels: 5, rows: 3,
            paylines: takeLines(LINES_5x3, 20),  // 20 vzorů (graficky stejné, 40 by se opakovalo)
            theme: { a: '#d98a2b', b: '#ffcf5c', bg: 'radial-gradient(circle at 50% 0%, #2a1a08, #0d0600)' },
            bets: [20, 40, 100, 200, 400, 1000, 2000],
            multiplierWild: [2, 3],
            freeSpins: { trigger: 3, count: 8, globalMultiplier: 2, buyCost: 11 }, ante: { mult: 1.25, scatterMult: 1.2 },
            symbols: [
                { id: 'beer', icon: '🍺', name: 'Pivo', weight: 24, pays: { 3: 1, 4: 4, 5: 10 } },
                { id: 'cactus', icon: '🌵', name: 'Kaktus', weight: 22, pays: { 3: 1, 4: 4, 5: 10 } },
                { id: 'horse', icon: '🐎', name: 'Kůň', weight: 20, pays: { 3: 2, 4: 6, 5: 18 } },
                { id: 'gun', icon: '🔫', name: 'Kolt', weight: 18, pays: { 3: 2, 4: 6, 5: 18 } },
                { id: 'cowboy', icon: '🤠', name: 'Kovboj', weight: 12, pays: { 3: 6, 4: 18, 5: 70 } },
                { id: 'sheriff', icon: '🎖️', name: 'Šerif', weight: 10, pays: { 3: 8, 4: 28, 5: 110 } },
                { id: 'wild', icon: '💰', name: 'Pytel zlata (Wild)', weight: 6, wild: true, pays: { 3: 14, 4: 70, 5: 350 } },
                { id: 'scatter', icon: '💵', name: 'Bankovky (Scatter)', weight: 6, scatter: true, pays: { 3: 2, 4: 8, 5: 40 } }
            ]
        },

        /* ---- 6) Gates of Olympus (6x5, výhry kdekoliv + kaskády + násobiče) ---- */
        {
            id: 'olympus',
            type: 'tumble',
            name: 'Gates of Olympus',
            tagline: 'Padající výhry a božské násobiče',
            emoji: '⚡',
            volatility: 'Velmi vysoká',
            rtp: 96,
            reels: 6, rows: 5,
            cluster: 9,                // minimální počet stejných symbolů pro výhru
            buckets: [9, 11, 13],      // hranice výplatních pásem
            theme: { a: '#ffd24a', b: '#9b5cff', bg: 'radial-gradient(circle at 50% 0%, #1a0b33, #05030f)' },
            bets: [20, 40, 100, 200, 400, 1000, 2000],
            freeSpins: { trigger: 4, count: 15, persistentMult: true, buyCost: 78 },
            // hodnoty násobících koulí (vážené – malé hodnoty výrazně častěji)
            orbValues: [[2, 42], [3, 25], [4, 12], [5, 7], [6, 4], [8, 2.2], [10, 1.4], [15, 0.7], [20, 0.4], [25, 0.2], [50, 0.07], [100, 0.025], [250, 0.006], [500, 0.0015]],
            symbols: [
                { id: 'g1', icon: '🟦', name: 'Modrý', weight: 24, pays: { 9: 0.25, 11: 0.5, 13: 1.2 } },
                { id: 'g2', icon: '🟩', name: 'Zelený', weight: 22, pays: { 9: 0.3, 11: 0.6, 13: 1.5 } },
                { id: 'g3', icon: '🟪', name: 'Fialový', weight: 20, pays: { 9: 0.4, 11: 0.8, 13: 2 } },
                { id: 'g4', icon: '🟥', name: 'Červený', weight: 18, pays: { 9: 0.5, 11: 1, 13: 2.5 } },
                { id: 'ring', icon: '💍', name: 'Prsten', weight: 12, pays: { 9: 0.8, 11: 1.5, 13: 4 } },
                { id: 'goblet', icon: '🏆', name: 'Pohár', weight: 9, pays: { 9: 1.2, 11: 2.5, 13: 6 } },
                { id: 'crown', icon: '👑', name: 'Koruna', weight: 6, pays: { 9: 2, 11: 4, 13: 10 } },
                { id: 'orb', icon: '⚡', name: 'Násobící koule', weight: 2.2, orb: true },
                { id: 'scatter', icon: '🔮', name: 'Koule Dia (Scatter)', weight: 2.0, scatter: true, pays: { 4: 2, 5: 5, 6: 50 } }
            ]
        },

        /* ---- 7) Candy Bonanza (6x5 tumble, cukrové bomby s velkými násobiči) ---- */
        {
            id: 'candy',
            type: 'tumble',
            name: 'Candy Bonanza',
            tagline: 'Sladké kaskády a cukrové bomby až x100',
            emoji: '🍭',
            volatility: 'Velmi vysoká',
            rtp: 96,
            reels: 6, rows: 5,
            cluster: 9,
            buckets: [9, 11, 13],
            theme: { a: '#ff6fd5', b: '#7ad7ff', bg: 'radial-gradient(circle at 50% 0%, #3a1140, #140319)' },
            bets: [20, 40, 100, 200, 400, 1000, 2000],
            freeSpins: { trigger: 4, count: 12, persistentMult: true, buyCost: 55 },
            orbValues: [[2, 40], [3, 24], [4, 13], [5, 8], [6, 4.5], [8, 2.6], [10, 1.7], [15, 0.9], [20, 0.5], [25, 0.3], [50, 0.1], [100, 0.04]],
            symbols: [
                { id: 's1', icon: '💜', name: 'Fialový bonbón', weight: 24, pays: { 9: 0.25, 11: 0.5, 13: 1.2 } },
                { id: 's2', icon: '💙', name: 'Modrý bonbón', weight: 22, pays: { 9: 0.3, 11: 0.6, 13: 1.5 } },
                { id: 's3', icon: '💚', name: 'Zelený bonbón', weight: 20, pays: { 9: 0.4, 11: 0.8, 13: 2 } },
                { id: 's4', icon: '❤️', name: 'Červené srdce', weight: 18, pays: { 9: 0.5, 11: 1, 13: 2.5 } },
                { id: 'plum', icon: '🍇', name: 'Hrozny', weight: 12, pays: { 9: 0.8, 11: 1.5, 13: 4 } },
                { id: 'apple', icon: '🍎', name: 'Jablko', weight: 9, pays: { 9: 1.2, 11: 2.5, 13: 6 } },
                { id: 'melon', icon: '🍉', name: 'Meloun', weight: 6, pays: { 9: 2, 11: 4, 13: 10 } },
                { id: 'bomb', icon: '💣', name: 'Cukrová bomba (násobič)', weight: 2.2, orb: true },
                { id: 'scatter', icon: '🍬', name: 'Bonbón (Scatter)', weight: 2.2, scatter: true, pays: { 4: 3, 5: 5, 6: 50 } }
            ]
        },

        /* ---- 8) Respin Joker (5x3, lepící se žolíci + respiny) ---- */
        {
            id: 'joker',
            type: 'lines',
            name: 'Respin Joker',
            tagline: 'Žolíci se lepí a spouští respiny',
            emoji: '🃏',
            volatility: 'Střední',
            rtp: 96,
            reels: 5, rows: 3,
            paylines: takeLines(LINES_5x3, 20),
            theme: { a: '#ff3b6b', b: '#9b5cff', bg: 'radial-gradient(circle at 50% 0%, #2a0a2e, #0b0312)' },
            bets: [20, 40, 100, 200, 400, 1000, 2000],
            respin: { holdId: 'joker', max: 3 },
            symbols: [
                { id: 'cherry', icon: '🍒', name: 'Třešně', weight: 26, pays: { 3: 1, 4: 3, 5: 9 } },
                { id: 'lemon', icon: '🍋', name: 'Citron', weight: 24, pays: { 3: 1, 4: 3, 5: 9 } },
                { id: 'melon', icon: '🍉', name: 'Meloun', weight: 22, pays: { 3: 2, 4: 6, 5: 16 } },
                { id: 'bell', icon: '🔔', name: 'Zvonek', weight: 16, pays: { 3: 4, 4: 10, 5: 28 } },
                { id: 'star', icon: '⭐', name: 'Hvězda', weight: 12, pays: { 3: 6, 4: 18, 5: 60 } },
                { id: 'seven', icon: '7️⃣', name: 'Sedmička', weight: 9, pays: { 3: 12, 4: 36, 5: 140 } },
                { id: 'joker', icon: '🃏', name: 'Žolík (Wild)', weight: 5, wild: true, pays: { 3: 18, 4: 70, 5: 280 } }
            ]
        },

        /* ---- 9) Big Bass Splash (5x3, 10 linií, sběr peněžních ryb ve free spins) ---- */
        {
            id: 'bigbass',
            type: 'lines',
            name: 'Big Bass Splash',
            tagline: 'Rybář sbírá peněžní ryby ve free spinech',
            emoji: '🎣',
            volatility: 'Vysoká',
            rtp: 96,
            reels: 5, rows: 3,
            paylines: takeLines(LINES_5x3, 10),
            theme: { a: '#1fb6ff', b: '#2bd44f', bg: 'radial-gradient(circle at 50% 0%, #06324d, #03141f)' },
            bets: [10, 20, 50, 100, 250, 500, 1000],
            freeSpins: {
                trigger: 3, count: 10, collect: true, moneyId: 'fish', collectorId: 'fisher', buyCost: 180,
                moneyValues: [[0.6, 40], [1.2, 26], [2, 16], [4, 9], [6, 4], [12, 1.5], [20, 0.5], [40, 0.12]],
                tiers: [[4, 2], [6, 3], [9, 5]]
            },
            ante: { mult: 1.25, scatterMult: 1.2 },
            symbols: [
                { id: 'b1', icon: '🔵', name: 'Modrá', weight: 24, pays: { 3: 1, 4: 2, 5: 5 } },
                { id: 'b2', icon: '🟢', name: 'Zelená', weight: 22, pays: { 3: 1, 4: 2, 5: 5 } },
                { id: 'b3', icon: '🟡', name: 'Žlutá', weight: 20, pays: { 3: 1, 4: 3, 5: 8 } },
                { id: 'b4', icon: '🔴', name: 'Červená', weight: 18, pays: { 3: 1, 4: 3, 5: 8 } },
                { id: 'worm', icon: '🪱', name: 'Žížala', weight: 14, pays: { 3: 3, 4: 8, 5: 25 } },
                { id: 'box', icon: '🧰', name: 'Bedna', weight: 11, pays: { 3: 5, 4: 12, 5: 40 } },
                { id: 'fish', icon: '🐟', name: 'Ryba (peněžní)', weight: 10, pays: { 3: 4, 4: 10, 5: 30 } },
                { id: 'fisher', icon: '🎣', name: 'Rybář (Wild + sběrač)', weight: 6, wild: true, pays: { 3: 10, 4: 50, 5: 200 } },
                { id: 'scatter', icon: '🎏', name: 'Návnada (Scatter)', weight: 3, scatter: true, pays: { 3: 2, 4: 5, 5: 25 } }
            ]
        }
    ];

    Casino.getGame = function (id) {
        for (var i = 0; i < Casino.GAMES.length; i++) if (Casino.GAMES[i].id === id) return Casino.GAMES[i];
        return null;
    };

    // metadata libovolné hry (i ne-slotové) z katalogu, fallback na slot
    Casino.metaById = function (id) {
        for (var i = 0; i < Casino.registry.length; i++) if (Casino.registry[i].id === id) return Casino.registry[i];
        var g = Casino.getGame(id);
        return g ? { id: g.id, name: g.name, emoji: g.emoji } : null;
    };

})(typeof window !== 'undefined' ? window : global);

if (typeof module !== 'undefined' && module.exports) module.exports = (typeof window !== 'undefined' ? window : global).Casino;
