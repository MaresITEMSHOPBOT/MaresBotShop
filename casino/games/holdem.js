/* ==========================================================================
   MARES CASINO – Texas Hold'em proti dvěma botům (s žetony, sázením, AI).
   Buy-in z kreditu do žetonů; při odchodu se žetony vyplatí zpět.
   Zjednodušené side-poty (jeden hlavní pot). Dealer/komentátor mluví.
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    var fmt = Casino.util.fmt;
    function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
    function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    var SUITS = ['♠', '♥', '♦', '♣'];
    var SB = 10, BB = 20, BUYIN = 2000;

    function valStr(v) { return v <= 10 ? '' + v : { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }[v]; }
    function makeDeck() {
        var d = []; for (var s = 0; s < 4; s++) for (var v = 2; v <= 14; v++) d.push({ v: v, s: s });
        for (var i = d.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = d[i]; d[i] = d[j]; d[j] = t; } return d;
    }

    /* ---- vyhodnocení nejlepších 5 ze 7 karet ---- */
    function eval5(cards) {
        var vs = cards.map(function (c) { return c.v; }).sort(function (a, b) { return b - a; });
        var suits = cards.map(function (c) { return c.s; });
        var flush = suits.every(function (s) { return s === suits[0]; });
        var uniq = vs.filter(function (v, i) { return vs.indexOf(v) === i; });
        var straight = false, sHigh = 0;
        if (uniq.length === 5) {
            if (uniq[0] - uniq[4] === 4) { straight = true; sHigh = uniq[0]; }
            else if (uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2) { straight = true; sHigh = 5; }
        }
        var counts = {}; vs.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; });
        var groups = Object.keys(counts).map(function (v) { return [counts[v], +v]; })
            .sort(function (a, b) { return b[0] - a[0] || b[1] - a[1]; });
        var pattern = groups.map(function (g) { return g[0]; }).join('');
        var kick = groups.map(function (g) { return g[1]; });
        if (straight && flush) return [8, sHigh];
        if (pattern === '41') return [7, kick[0], kick[1]];
        if (pattern === '32') return [6, kick[0], kick[1]];
        if (flush) return [5].concat(vs);
        if (straight) return [4, sHigh];
        if (pattern === '311') return [3, kick[0], kick[1], kick[2]];
        if (pattern === '221') return [2, kick[0], kick[1], kick[2]];
        if (pattern === '2111') return [1, kick[0], kick[1], kick[2], kick[3]];
        return [0].concat(vs);
    }
    function cmpEval(a, b) { for (var i = 0; i < Math.max(a.length, b.length); i++) { var d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; }
    // nejlepší 5-karetní kombinace z N karet (funguje pro 5, 6 i 7 karet)
    function bestEval(cards) {
        var n = cards.length;
        if (n < 5) return [0].concat(cards.map(function (c) { return c.v; }).sort(function (a, b) { return b - a; }));
        if (n === 5) return eval5(cards);
        var best = null, c = [0, 1, 2, 3, 4];
        while (true) {
            var e = eval5([cards[c[0]], cards[c[1]], cards[c[2]], cards[c[3]], cards[c[4]]]);
            if (!best || cmpEval(e, best) > 0) best = e;
            var i = 4;
            while (i >= 0 && c[i] === n - 5 + i) i--;
            if (i < 0) break;
            c[i]++; for (var j = i + 1; j < 5; j++) c[j] = c[j - 1] + 1;
        }
        return best;
    }
    var HAND_NAME = { 0: 'vysoká karta', 1: 'pár', 2: 'dva páry', 3: 'trojice', 4: 'postupka', 5: 'barva', 6: 'full house', 7: 'kareta', 8: 'postupka v barvě' };

    var TALK = {
        deal: ['Nové rozdání, hodně štěstí!', 'Karty jsou v pohybu.', 'Sázejme!'],
        flop: ['Lízneme flop.', 'Tři karty na stole.'],
        turn: ['Turn.', 'Čtvrtá karta.'],
        river: ['River, poslední karta!', 'A je tu river.'],
        youWin: ['Bereš bank! Pěkně.', 'Vyhráváš, gratuluji!', 'Ten pot je tvůj!'],
        youLose: ['Bank bere soupeř.', 'Tentokrát smůla.', 'Příště to vyjde.']
    };
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

    Casino.Holdem = { open: function (mount, opts) { return new Holdem(mount, opts); } };

    function Holdem(mount, opts) {
        this.opts = opts || {};
        this.destroyed = false;
        this.netRecorded = 0;
        this.players = [
            { name: 'Ty', you: true, stack: 0 },
            { name: 'Bot Anna', you: false, stack: BUYIN },
            { name: 'Bot Karel', you: false, stack: BUYIN }
        ];
        this.button = 2;
        this.inHand = false;
        this.build(mount);
    }

    Holdem.prototype.build = function (mount) {
        var self = this;
        var theme = { a: '#19a86b', b: '#ffd24a', bg: 'radial-gradient(ellipse at 50% 40%, #0c5236, #062017)' };
        var f = Casino.UI.gameFrame(mount, {
            emoji: '♠️', name: "Texas Hold'em", subtitle: 'Ty proti dvěma botům · blindy ' + SB + '/' + BB,
            theme: theme, bg: theme.bg, onExit: function () { Casino.Dealer.stop(); self.cashOut(); self.opts.onExit && self.opts.onExit(); },
            onInfo: function () { self.info(); }
        });
        this.frame = f;

        // buy-in z kreditu
        var bal = Casino.Account.getBalance();
        var buy = Math.min(BUYIN, bal);
        if (buy < 100) { f.stage.appendChild(el('p', 'poker-result show bad', 'Na poker potřebuješ aspoň 100 kreditů. Vyber si bonus.')); if (this.opts.onBroke) this.opts.onBroke(); return; }
        Casino.Account.debit(buy); this.players[0].stack = buy; this.buyTotal = buy;

        var table = el('div', 'holdem-table');
        table.innerHTML =
            '<div class="seat seat-top seat1"></div>' +
            '<div class="seat seat-top seat2"></div>' +
            '<div class="board-area"><div class="pot-chip">Pot: <b class="pot">0</b></div><div class="board card-row"></div><div class="speech hidden dealer-speech"></div></div>' +
            '<div class="seat seat-you seat0"></div>';
        f.stage.appendChild(table);
        this.seatEls = [table.querySelector('.seat0'), table.querySelector('.seat1'), table.querySelector('.seat2')];
        this.boardEl = table.querySelector('.board');
        this.potEl = table.querySelector('.pot');
        this.speech = table.querySelector('.dealer-speech');

        var c = f.controls;
        c.innerHTML =
            '<div class="ctrl-cell"><label>Tvé žetony</label><b class="c-stack">' + fmt(buy) + '</b></div>' +
            '<div class="poker-actions hand-actions">' +
            '<button class="fold-btn">SLOŽIT</button>' +
            '<button class="call-btn">DOROVNAT</button>' +
            '<button class="raise-btn">NAVÝŠIT</button>' +
            '</div>' +
            '<button class="deal-btn next-hand">ROZDAT</button>';
        this.stackEl = c.querySelector('.c-stack');
        this.foldBtn = c.querySelector('.fold-btn');
        this.callBtn = c.querySelector('.call-btn');
        this.raiseBtn = c.querySelector('.raise-btn');
        this.dealBtn = c.querySelector('.next-hand');
        this.foldBtn.onclick = function () { self.playerAct('fold'); };
        this.callBtn.onclick = function () { self.playerAct('call'); };
        this.raiseBtn.onclick = function () { self.openRaise(); };
        this.dealBtn.onclick = function () { Casino.Sound.unlock(); self.startHand(); };
        this.setActions(false);

        this.renderSeats();
        Casino.Dealer.say(this.speech, 'Vítej u pokerového stolu! Klikni ROZDAT.');
    };

    Holdem.prototype.setActions = function (on) {
        this.handActionsOn = on;
        this.foldBtn.style.display = on ? '' : 'none';
        this.callBtn.style.display = on ? '' : 'none';
        this.raiseBtn.style.display = on ? '' : 'none';
        this.dealBtn.style.display = on ? 'none' : '';
        this.dealBtn.disabled = this.inHand;
    };

    Holdem.prototype.renderSeats = function () {
        var self = this;
        this.players.forEach(function (p, i) {
            var se = self.seatEls[i];
            var cards = '';
            if (p.hole) {
                if (p.you || p.reveal) cards = p.hole.map(function (cd) { return self.cardHtml(cd); }).join('');
                else cards = '<div class="pcard down"></div><div class="pcard down"></div>';
            }
            se.className = 'seat ' + (i === 0 ? 'seat-you' : 'seat-top') + ' seat' + i +
                (p.folded ? ' folded' : '') + (self.actor === i && self.inHand ? ' active' : '') + (p.you ? ' you' : '');
            se.innerHTML =
                '<div class="seat-info"><span class="seat-name">' + p.name + (i === self.button ? ' 🔘' : '') + '</span>' +
                '<span class="seat-stack">🪙 ' + fmt(p.stack) + '</span></div>' +
                '<div class="seat-cards card-row">' + cards + '</div>' +
                (p.betThis ? '<div class="seat-bet">' + fmt(p.betThis) + '</div>' : '') +
                (p.lastAction ? '<div class="seat-act">' + p.lastAction + '</div>' : '');
        });
        if (this.stackEl) this.stackEl.textContent = fmt(this.players[0].stack);
    };

    Holdem.prototype.cardHtml = function (cd) {
        var red = cd.s === 1 || cd.s === 2;
        return '<div class="pcard' + (red ? ' red' : '') + '"><span class="pc-v">' + valStr(cd.v) + '</span><span class="pc-s">' + SUITS[cd.s] + '</span></div>';
    };

    /* ---------------- průběh rozdání ---------------- */
    Holdem.prototype.startHand = function () {
        if (this.inHand) return;
        // hráči s 0 žetony – rebuy/konec
        if (this.players[0].stack <= 0) { this.offerRebuy(); return; }
        this.players[1].stack = Math.max(this.players[1].stack, BB * 2);
        this.players[2].stack = Math.max(this.players[2].stack, BB * 2);

        this.inHand = true; this.setActions(true);
        this.deck = makeDeck();
        this.board = [];
        this.pot = 0;
        this.street = 'preflop';
        this.button = (this.button + 1) % 3;
        var self = this;
        this.players.forEach(function (p) { p.hole = [self.deck.pop(), self.deck.pop()]; p.folded = false; p.allIn = false; p.betThis = 0; p.totalIn = 0; p.acted = false; p.reveal = false; p.lastAction = ''; });
        this.boardEl.innerHTML = '';

        // blindy
        var sb = (this.button + 1) % 3, bb = (this.button + 2) % 3;
        this.postBlind(sb, SB); this.postBlind(bb, BB);
        this.currentBet = BB; this.lastRaiseSize = BB; this.aggressor = bb;
        this.actor = (bb + 1) % 3; // UTG (3-handed = button)
        Casino.Dealer.say(this.speech, pick(TALK.deal));
        Casino.Sound.click();
        this.renderSeats();
        this.continueRound();
    };

    Holdem.prototype.postBlind = function (i, amt) {
        var p = this.players[i]; var a = Math.min(amt, p.stack);
        p.stack -= a; p.betThis += a; p.totalIn += a; this.pot += a; if (p.stack === 0) p.allIn = true;
        p.lastAction = (amt === SB ? 'SB ' : 'BB ') + fmt(a);
    };

    Holdem.prototype.activePlayers = function () { return this.players.filter(function (p) { return !p.folded; }); };
    Holdem.prototype.canAct = function (p) { return !p.folded && !p.allIn; };

    Holdem.prototype.continueRound = function () {
        var self = this;
        this.potEl.textContent = fmt(this.pot);
        // zůstal jediný hráč?
        if (this.activePlayers().length === 1) return this.endHand();
        // je kolo hotové?
        var needAct = this.players.filter(function (p) { return self.canAct(p) && (!p.acted || p.betThis !== self.currentBet); });
        if (needAct.length === 0) return this.nextStreet();

        // najdi dalšího, kdo může jednat
        var guard = 0;
        while (guard++ < 6 && !this.canAct(this.players[this.actor])) this.actor = (this.actor + 1) % 3;
        this.renderSeats();
        var p = this.players[this.actor];
        if (p.you) { this.promptPlayer(); }
        else { setTimeout(function () { if (!self.destroyed) self.botAct(self.actor); }, 750); }
    };

    Holdem.prototype.advance = function () { this.actor = (this.actor + 1) % 3; this.continueRound(); };

    Holdem.prototype.toCall = function (i) { return Math.max(0, this.currentBet - this.players[i].betThis); };

    Holdem.prototype.applyAction = function (i, type, raiseTo) {
        var p = this.players[i];
        var need = this.toCall(i);
        if (type === 'fold') { p.folded = true; p.lastAction = 'fold'; }
        else if (type === 'check') { p.lastAction = 'check'; }
        else if (type === 'call') {
            var a = Math.min(need, p.stack); p.stack -= a; p.betThis += a; p.totalIn += a; this.pot += a; if (p.stack === 0) p.allIn = true;
            p.lastAction = need === 0 ? 'check' : 'call ' + fmt(a);
        } else if (type === 'raise') {
            var target = Math.min(raiseTo, p.betThis + p.stack);
            var add = target - p.betThis; p.stack -= add; p.betThis += add; p.totalIn += add; this.pot += add;
            this.currentBet = p.betThis; this.lastRaiseSize = Math.max(BB, target - (this.currentBet - need));
            if (p.stack === 0) p.allIn = true;
            p.lastAction = (p.allIn ? 'ALL-IN ' : 'raise ') + fmt(p.betThis);
            // ostatní musí reagovat
            this.players.forEach(function (q, qi) { if (qi !== i && !q.folded && !q.allIn) q.acted = false; });
            this.aggressor = i;
        }
        p.acted = true;
        Casino.Sound.click();
    };

    /* ---------------- hráč ---------------- */
    Holdem.prototype.promptPlayer = function () {
        var i = 0, need = this.toCall(i);
        this.callBtn.textContent = need === 0 ? 'CHECK' : 'DOROVNAT ' + fmt(Math.min(need, this.players[i].stack));
        this.foldBtn.style.display = need === 0 ? 'none' : '';
        this.raiseBtn.style.display = this.players[i].stack > need ? '' : 'none';
        this.setActions(true);
        Casino.Dealer.say(this.speech, 'Jsi na tahu.');
    };
    Holdem.prototype.playerAct = function (type) {
        if (!this.inHand || this.actor !== 0) return;
        this.applyAction(0, type === 'call' && this.toCall(0) === 0 ? 'check' : type);
        this.setActions(true); this.foldBtn.style.display = 'none'; this.callBtn.style.display = 'none'; this.raiseBtn.style.display = 'none';
        this.advance();
    };
    Holdem.prototype.openRaise = function () {
        var self = this, i = 0, p = this.players[0], need = this.toCall(0);
        var minRaise = this.currentBet + this.lastRaiseSize;
        var pot = this.pot + need;
        var opts = [
            ['Min ' + fmt(minRaise), Math.min(minRaise, p.betThis + p.stack)],
            ['½ pot ' + fmt(this.currentBet + Math.round(pot / 2)), Math.min(this.currentBet + Math.round(pot / 2), p.betThis + p.stack)],
            ['Pot ' + fmt(this.currentBet + pot), Math.min(this.currentBet + pot, p.betThis + p.stack)],
            ['ALL-IN ' + fmt(p.betThis + p.stack), p.betThis + p.stack]
        ];
        var menu = el('div', 'auto-menu raise-menu');
        opts.forEach(function (o) {
            if (o[1] <= self.currentBet) return;
            var b = el('button', null, o[0]);
            b.onclick = function (e) { e.stopPropagation(); menu.remove(); self.applyAction(0, 'raise', o[1]); self.setActions(true); self.foldBtn.style.display = 'none'; self.callBtn.style.display = 'none'; self.raiseBtn.style.display = 'none'; self.advance(); };
            menu.appendChild(b);
        });
        this.raiseBtn.parentNode.appendChild(menu);
        var close = function () { menu.remove(); document.removeEventListener('click', close); };
        setTimeout(function () { document.addEventListener('click', close); }, 10);
    };

    /* ---------------- bot AI ---------------- */
    Holdem.prototype.handStrength = function (i) {
        var p = this.players[i];
        if (this.board.length === 0) {
            var a = p.hole[0].v, b = p.hole[1].v, hi = Math.max(a, b), lo = Math.min(a, b);
            var s = (hi + lo) / 28;
            if (a === b) s += 0.45;                       // pár
            if (p.hole[0].s === p.hole[1].s) s += 0.08;   // suited
            if (Math.abs(a - b) === 1) s += 0.05;         // connector
            if (hi >= 13) s += 0.08;
            return Math.min(1, s);
        }
        var e = bestEval(p.hole.concat(this.board));
        var base = [0.18, 0.42, 0.6, 0.72, 0.82, 0.88, 0.93, 0.98, 1][e[0]];
        return Math.min(1, base + (e[1] || 0) / 200);
    };
    Holdem.prototype.botAct = function (i) {
        if (this.destroyed || !this.inHand) return;
        var p = this.players[i], need = this.toCall(i), pot = this.pot;
        var str = this.handStrength(i) + (Math.random() - 0.5) * 0.12;
        var potOdds = need / (pot + need || 1);
        var type, raiseTo;
        if (need === 0) {
            if (str > 0.7 && Math.random() < 0.6) { type = 'raise'; raiseTo = this.currentBet + Math.round((pot) * (0.4 + Math.random() * 0.4)); }
            else type = 'check';
        } else {
            if (str < 0.32 && potOdds > 0.18) type = 'fold';
            else if (str > 0.8 && Math.random() < 0.7) { type = 'raise'; raiseTo = this.currentBet + Math.round((pot) * (0.5 + Math.random() * 0.6)); }
            else if (str < potOdds - 0.05 && Math.random() < 0.7) type = 'fold';
            else type = 'call';
        }
        if (type === 'raise') raiseTo = Math.max(raiseTo, this.currentBet + this.lastRaiseSize);
        this.applyAction(i, type, raiseTo);
        var p2 = this.players[i];
        Casino.Dealer.say(this.speech, p.name + ': ' + (p2.lastAction || type));
        this.advance();
    };

    /* ---------------- ulice ---------------- */
    Holdem.prototype.nextStreet = function () {
        var self = this;
        this.players.forEach(function (p) { p.betThis = 0; p.acted = false; });
        this.currentBet = 0; this.lastRaiseSize = BB;
        // postflop začíná SB (vlevo od buttonu)
        this.actor = (this.button + 1) % 3;
        if (this.street === 'preflop') { this.street = 'flop'; this.board.push(this.deck.pop(), this.deck.pop(), this.deck.pop()); Casino.Dealer.say(this.speech, pick(TALK.flop)); }
        else if (this.street === 'flop') { this.street = 'turn'; this.board.push(this.deck.pop()); Casino.Dealer.say(this.speech, pick(TALK.turn)); }
        else if (this.street === 'turn') { this.street = 'river'; this.board.push(this.deck.pop()); Casino.Dealer.say(this.speech, pick(TALK.river)); }
        else { return this.showdown(); }
        this.renderBoard();
        Casino.Sound.reelStop(2);
        // pokud zbývá jen 1 aktivní, nebo všichni all-in → dojeď
        var canActCount = this.players.filter(function (p) { return self.canAct(p); }).length;
        if (this.activePlayers().length === 1) return this.endHand();
        if (canActCount <= 1) { setTimeout(function () { self.nextStreet(); }, 700); return; }
        setTimeout(function () { self.continueRound(); }, 500);
    };
    Holdem.prototype.renderBoard = function () {
        this.boardEl.innerHTML = this.board.map(this.cardHtml).join('');
        this.potEl.textContent = fmt(this.pot);
    };

    /* ---------------- konec rozdání ---------------- */
    Holdem.prototype.endHand = function () { // jediný nesložený bere pot
        var winner = this.activePlayers()[0];
        winner.stack += this.pot;
        var wi = this.players.indexOf(winner);
        Casino.Dealer.say(this.speech, winner.you ? pick(TALK.youWin) : (winner.name + ' bere ' + fmt(this.pot) + ' (ostatní složili)'));
        if (winner.you) Casino.Sound.win(2);
        this.finishHand(wi, null);
    };
    Holdem.prototype.showdown = function () {
        var self = this;
        this.players.forEach(function (p) { if (!p.folded) p.reveal = true; });
        this.renderSeats();
        var contenders = this.players.map(function (p, i) { return { i: i, p: p }; }).filter(function (o) { return !o.p.folded; });
        contenders.forEach(function (o) { o.eval = bestEval(o.p.hole.concat(self.board)); });
        contenders.sort(function (a, b) { return cmpEval(b.eval, a.eval); });
        var best = contenders[0].eval;
        var winners = contenders.filter(function (o) { return cmpEval(o.eval, best) === 0; });
        var share = Math.floor(this.pot / winners.length);
        winners.forEach(function (o) { o.p.stack += share; });
        var youWon = winners.some(function (o) { return o.p.you; });
        var name = winners.map(function (o) { return o.p.name; }).join(' & ');
        Casino.Dealer.say(this.speech, name + ' vyhrává s ' + HAND_NAME[best[0]] + (youWon ? '! 🎉' : '.'));
        if (youWon) Casino.Sound.win(3); else Casino.Sound.lose();
        this.finishHand(this.players.indexOf(winners[0].p), HAND_NAME[best[0]]);
    };

    Holdem.prototype.finishHand = function (wi, handName) {
        this.inHand = false;
        this.pot = 0;
        this.renderSeats(); this.potEl.textContent = '0';
        this.setActions(false);
        this.dealBtn.disabled = false;
        this.dealBtn.textContent = 'DALŠÍ ROZDÁNÍ';
        if (this.players[0].stack <= 0) this.offerRebuy();
    };

    Holdem.prototype.offerRebuy = function () {
        var self = this, bal = Casino.Account.getBalance();
        if (bal < 100) { Casino.UI.toast('Došly žetony i kredit. Vyber si bonus.', ''); if (this.opts.onBroke) this.opts.onBroke(); return; }
        var buy = Math.min(BUYIN, bal);
        Casino.UI.modal({
            title: '♠️ Došly žetony', body: 'Dokoupit žetony za <b>🪙 ' + fmt(buy) + '</b> z kreditu?',
            actions: [{ label: 'Odejít', onClick: function () { if (self.opts.onExit) { self.cashOut(); self.opts.onExit(); } } },
            { label: 'Dokoupit', primary: true, onClick: function () { Casino.Account.debit(buy); self.players[0].stack += buy; self.buyTotal += buy; self.renderSeats(); } }]
        });
    };

    Holdem.prototype.cashOut = function () {
        if (this.netRecorded) return;
        this.netRecorded = 1;
        var stack = this.players[0].stack;
        if (stack > 0) Casino.Account.credit(stack);
        Casino.Account.recordSpin('holdem', this.buyTotal || 0, stack);
    };

    Holdem.prototype.info = function () {
        Casino.UI.modal({
            title: "♠️ Texas Hold'em — pravidla",
            body: '<p style="color:var(--muted);line-height:1.7">Hraješ proti dvěma botům. Buy-in ' + fmt(BUYIN) + ' kreditů se promění v žetony; při odchodu se žetony vrátí do kreditu.</p>' +
                '<ul style="color:var(--muted);line-height:1.8;margin-left:18px">' +
                '<li>Každý dostane 2 karty, na stůl přijde flop (3), turn (1) a river (1).</li>' +
                '<li>Sázecí kola: <b>Složit</b> / <b>Dorovnat/Check</b> / <b>Navýšit</b>.</li>' +
                '<li>Nejlepší kombinace 5 karet bere pot. Blindy ' + SB + '/' + BB + '.</li></ul>' +
                '<p style="color:var(--muted);margin-top:8px">Pořadí: postupka v barvě > kareta > full house > barva > postupka > trojice > dva páry > pár > vysoká karta.</p>'
        });
    };

    Holdem.prototype.destroy = function () { this.destroyed = true; Casino.Dealer.stop(); this.cashOut(); };

    Casino.registry.push({
        id: 'holdem', name: "Texas Hold'em", emoji: '♠️', category: 'table',
        tagline: 'Reálný poker proti dvěma botům',
        theme: { a: '#19a86b', b: '#ffd24a', bg: 'radial-gradient(ellipse at 50% 40%, #0c5236, #062017)' },
        badges: ['Poker', 'vs Boti'], meta: 'Buy-in ' + fmt(BUYIN) + ' · blindy ' + SB + '/' + BB,
        open: function (mount, opts) { return Casino.Holdem.open(mount, opts); }
    });

})(typeof window !== 'undefined' ? window : global);
