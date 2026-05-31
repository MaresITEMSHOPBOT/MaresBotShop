/* ==========================================================================
   MARES CASINO – účet hráče + ukládání do localStorage + event bus
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};

    /* ----- mini event bus (pro aktualizaci hlavičky atd.) ----- */
    Casino.bus = {
        _h: {},
        on: function (ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); },
        emit: function (ev) {
            var args = Array.prototype.slice.call(arguments, 1);
            (this._h[ev] || []).forEach(function (fn) { try { fn.apply(null, args); } catch (e) { console.error(e); } });
        }
    };

    var KEY = 'mares-casino-v1';
    var START_BALANCE = 5000;
    var DAILY_AMOUNT = 2000;
    var DAILY_MS = 24 * 60 * 60 * 1000;
    var RESCUE_AMOUNT = 1000;
    var RESCUE_BELOW = 500;

    var state = { current: null, sound: true, accounts: {} };

    function load() {
        try {
            var raw = localStorage.getItem(KEY);
            if (raw) state = Object.assign({ current: null, sound: true, accounts: {} }, JSON.parse(raw));
        } catch (e) { /* ignore */ }
    }
    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    }

    function freshAccount(name) {
        return {
            name: name,
            balance: START_BALANCE,
            created: Date.now(),
            lastDaily: 0,
            stats: { spins: 0, wagered: 0, won: 0, biggest: 0, byGame: {} },
            history: []
        };
    }

    var Account = Casino.Account = {
        init: function () { load(); },
        save: save,
        isSoundOn: function () { return !!state.sound; },
        setSound: function (on) { state.sound = !!on; save(); },

        listAccounts: function () {
            return Object.keys(state.accounts).map(function (k) { return state.accounts[k]; })
                .sort(function (a, b) { return b.created - a.created; });
        },
        currentName: function () { return state.current; },
        current: function () { return state.current ? state.accounts[state.current] : null; },
        isLoggedIn: function () { return !!Account.current(); },

        login: function (name) {
            name = (name || '').trim().slice(0, 18) || 'Hráč';
            if (!state.accounts[name]) state.accounts[name] = freshAccount(name);
            state.current = name;
            save();
            Casino.bus.emit('login', state.accounts[name]);
            Casino.bus.emit('balance', Account.getBalance());
            return state.accounts[name];
        },
        logout: function () { state.current = null; save(); Casino.bus.emit('logout'); },
        deleteAccount: function (name) {
            delete state.accounts[name];
            if (state.current === name) state.current = null;
            save();
        },

        getBalance: function () { var a = Account.current(); return a ? a.balance : 0; },
        setBalance: function (n) {
            var a = Account.current(); if (!a) return;
            a.balance = Math.max(0, Math.round(n)); save();
            Casino.bus.emit('balance', a.balance);
        },
        credit: function (n) { Account.setBalance(Account.getBalance() + n); },
        debit: function (n) {
            var a = Account.current(); if (!a) return false;
            if (a.balance < n) return false;
            Account.setBalance(a.balance - n);
            return true;
        },

        /* ---- bonusy (aby hráč nikdy neuvízl) ---- */
        bonusState: function () {
            var a = Account.current(); if (!a) return { daily: false, rescue: false, dailyIn: 0 };
            var now = Date.now();
            var daily = (now - (a.lastDaily || 0)) >= DAILY_MS;
            return {
                daily: daily,
                rescue: a.balance < RESCUE_BELOW,
                dailyIn: daily ? 0 : DAILY_MS - (now - a.lastDaily),
                dailyAmount: DAILY_AMOUNT,
                rescueAmount: RESCUE_AMOUNT
            };
        },
        claimDaily: function () {
            var a = Account.current(); if (!a) return 0;
            if ((Date.now() - (a.lastDaily || 0)) < DAILY_MS) return 0;
            a.lastDaily = Date.now();
            Account.credit(DAILY_AMOUNT);
            return DAILY_AMOUNT;
        },
        claimRescue: function () {
            var a = Account.current(); if (!a) return 0;
            if (a.balance >= RESCUE_BELOW) return 0;
            Account.credit(RESCUE_AMOUNT);
            return RESCUE_AMOUNT;
        },

        /* ---- statistiky ---- */
        recordSpin: function (gameId, bet, win) {
            var a = Account.current(); if (!a) return;
            var s = a.stats;
            s.spins++; s.wagered += bet; s.won += win;
            if (win > s.biggest) s.biggest = win;
            var g = s.byGame[gameId] = s.byGame[gameId] || { spins: 0, wagered: 0, won: 0, biggest: 0 };
            g.spins++; g.wagered += bet; g.won += win;
            if (win > g.biggest) g.biggest = win;
            if (win > 0) {
                a.history.unshift({ t: Date.now(), g: gameId, bet: bet, win: win });
                a.history = a.history.slice(0, 60);
            }
            save();
        }
    };

})(typeof window !== 'undefined' ? window : global);
