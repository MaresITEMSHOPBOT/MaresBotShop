/* ==========================================================================
   MARES CASINO – progresivní jackpoty (Mini / Minor / Major / Grand).
   Rostou z každé sázky, sdílené globálně, ukládají se do localStorage.
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    var KEY = 'mares-casino-jp-v1';
    var TIERS = ['mini', 'minor', 'major', 'grand'];
    var SEED = { mini: 500, minor: 2500, major: 12000, grand: 60000 };
    var RATE = { mini: 0.004, minor: 0.0022, major: 0.0012, grand: 0.0006 };
    var LABEL = { mini: 'MINI', minor: 'MINOR', major: 'MAJOR', grand: 'GRAND' };

    var state = load();
    function load() { try { var r = localStorage.getItem(KEY); if (r) { var p = JSON.parse(r); TIERS.forEach(function (t) { if (typeof p[t] !== 'number') p[t] = SEED[t]; }); return p; } } catch (e) { } return { mini: SEED.mini, minor: SEED.minor, major: SEED.major, grand: SEED.grand }; }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { } }

    Casino.Jackpots = {
        TIERS: TIERS, LABEL: LABEL, SEED: SEED,
        all: function () { return state; },
        value: function (t) { return Math.round(state[t] || SEED[t]); },
        grow: function (bet) {
            if (!bet || bet <= 0) return;
            TIERS.forEach(function (t) { state[t] = (state[t] || SEED[t]) + bet * RATE[t]; });
            save();
            if (Casino.bus) Casino.bus.emit('jackpot', state);
        },
        win: function (t) {
            var v = Math.round(state[t] || SEED[t]);
            state[t] = SEED[t]; save();
            if (Casino.bus) Casino.bus.emit('jackpot', state);
            return v;
        }
    };
})(typeof window !== 'undefined' ? window : global);
