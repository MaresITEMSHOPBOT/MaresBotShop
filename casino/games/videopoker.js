/* ==========================================================================
   MARES CASINO – Video Poker (Jacks or Better). Klasický pokerový automat.
   Rozdá 5 karet, podržíš co chceš, dobereš, platí podle kombinace.
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    var fmt = Casino.util.fmt;
    function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
    var SUITS = ['♠', '♥', '♦', '♣'];
    var BETS = [10, 20, 50, 100, 250, 500];
    function valStr(v) { return v <= 10 ? '' + v : { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }[v]; }
    function deck() { var d = []; for (var s = 0; s < 4; s++) for (var v = 2; v <= 14; v++) d.push({ v: v, s: s }); for (var i = d.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = d[i]; d[i] = d[j]; d[j] = t; } return d; }

    // výplatní tabulka (násobek sázky, včetně vrácení)
    var PAYTABLE = [
        ['Royal Flush', 250], ['Postupka v barvě', 50], ['Kareta', 25], ['Full House', 9],
        ['Barva', 6], ['Postupka', 4], ['Trojice', 3], ['Dva páry', 2], ['Páry J+', 1]
    ];
    function evalHand(cards) {
        var vs = cards.map(function (c) { return c.v; }).sort(function (a, b) { return a - b; });
        var flush = cards.every(function (c) { return c.s === cards[0].s; });
        var uniq = vs.filter(function (v, i) { return vs.indexOf(v) === i; });
        var straight = uniq.length === 5 && (vs[4] - vs[0] === 4 || (vs[0] === 2 && vs[1] === 3 && vs[2] === 4 && vs[3] === 5 && vs[4] === 14));
        var counts = {}; vs.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; });
        var cv = Object.keys(counts).map(function (k) { return counts[k]; }).sort(function (a, b) { return b - a; });
        var royal = straight && flush && vs[0] === 10;
        if (royal) return 0;
        if (straight && flush) return 1;
        if (cv[0] === 4) return 2;
        if (cv[0] === 3 && cv[1] === 2) return 3;
        if (flush) return 4;
        if (straight) return 5;
        if (cv[0] === 3) return 6;
        if (cv[0] === 2 && cv[1] === 2) return 7;
        if (cv[0] === 2) {
            var pv = +Object.keys(counts).filter(function (k) { return counts[k] === 2; })[0];
            if (pv >= 11 || pv === 14) return 8;
        }
        return -1;
    }

    Casino.VideoPoker = { open: function (m, o) { return new VP(m, o); } };
    function VP(mount, opts) { this.opts = opts || {}; this.betIndex = 3; this.state = 'deal'; this.hold = [false, false, false, false, false]; this.build(mount); }
    VP.prototype.bet = function () { return BETS[this.betIndex]; };

    VP.prototype.build = function (mount) {
        var self = this;
        var theme = { a: '#6c5cff', b: '#ffd24a', bg: 'radial-gradient(circle at 50% 0%, #161038, #07030f)' };
        var f = Casino.UI.gameFrame(mount, { emoji: '🂡', name: 'Video Poker', subtitle: 'Jacks or Better — podrž a dober', theme: theme, bg: theme.bg, onExit: this.opts.onExit, onInfo: function () { self.info(); } });
        this.frame = f;
        var pt = el('div', 'vp-paytable');
        pt.innerHTML = PAYTABLE.map(function (r, i) { return '<div class="vp-pt-row" data-i="' + i + '"><span>' + r[0] + '</span><b>' + r[1] + '×</b></div>'; }).join('');
        f.stage.appendChild(pt); this.ptEl = pt;
        var row = el('div', 'vp-cards card-row'); f.stage.appendChild(row); this.row = row;
        this.msgEl = el('div', 'vp-msg', 'Stiskni ROZDAT.'); f.stage.appendChild(this.msgEl);
        this.renderCards([null, null, null, null, null]);
        var c = f.controls;
        c.innerHTML =
            '<div class="ctrl-cell ctrl-bet"><button class="bet-dn">−</button><div class="bet-val"><label>Sázka</label><b class="c-bet">' + fmt(this.bet()) + '</b></div><button class="bet-up">+</button></div>' +
            '<div class="ctrl-cell ctrl-win"><label>Výhra</label><b class="c-win">0</b></div>' +
            '<button class="deal-btn vp-deal">ROZDAT</button>';
        this.betEl = c.querySelector('.c-bet'); this.winEl = c.querySelector('.c-win'); this.dealBtn = c.querySelector('.vp-deal');
        c.querySelector('.bet-dn').onclick = function () { self.changeBet(-1); };
        c.querySelector('.bet-up').onclick = function () { self.changeBet(1); };
        this.dealBtn.onclick = function () { Casino.Sound.unlock(); self.action(); };
    };
    VP.prototype.changeBet = function (d) { if (this.state !== 'deal') return; var n = this.betIndex + d; if (n < 0 || n >= BETS.length) return; this.betIndex = n; Casino.Sound.click(); this.betEl.textContent = fmt(this.bet()); };

    VP.prototype.renderCards = function (cards) {
        var self = this; this.row.innerHTML = '';
        cards.forEach(function (cd, i) {
            var wrap = el('div', 'vp-card-wrap');
            var card;
            if (!cd) card = el('div', 'pcard down');
            else { var red = cd.s === 1 || cd.s === 2; card = el('div', 'pcard' + (red ? ' red' : ''), '<span class="pc-v">' + valStr(cd.v) + '</span><span class="pc-s">' + SUITS[cd.s] + '</span>'); }
            if (self.hold[i]) wrap.classList.add('held');
            var hold = el('div', 'vp-hold', self.hold[i] ? 'DRŽÍM' : 'DRŽET');
            wrap.appendChild(card); wrap.appendChild(hold);
            if (self.state === 'draw') { wrap.onclick = function () { self.hold[i] = !self.hold[i]; self.renderCards(self.cards); Casino.Sound.click(); }; wrap.classList.add('clickable'); }
            self.row.appendChild(wrap);
        });
    };

    VP.prototype.action = function () {
        if (this.state === 'deal') {
            var bet = this.bet();
            if (!Casino.Account.debit(bet)) { Casino.UI.toast('Nedostatek kreditu!', ''); if (this.opts.onBroke) this.opts.onBroke(); return; }
            this.deck = deck(); this.cards = [this.deck.pop(), this.deck.pop(), this.deck.pop(), this.deck.pop(), this.deck.pop()];
            this.hold = [false, false, false, false, false];
            this.state = 'draw'; this.winEl.textContent = '0'; this.ptEl.querySelectorAll('.vp-pt-row').forEach(function (r) { r.classList.remove('on'); });
            this.renderCards(this.cards); this.dealBtn.textContent = 'DOBRAT'; this.msgEl.textContent = 'Vyber karty k držení a stiskni DOBRAT.';
            Casino.Sound.reelStop(1);
        } else {
            for (var i = 0; i < 5; i++) if (!this.hold[i]) this.cards[i] = this.deck.pop();
            this.state = 'deal';
            this.renderCards(this.cards);
            var rank = evalHand(this.cards);
            var bet = this.bet(), win = 0;
            if (rank >= 0) { win = bet * PAYTABLE[rank][1]; Casino.Account.credit(win); var rowEl = this.ptEl.querySelector('.vp-pt-row[data-i="' + rank + '"]'); if (rowEl) rowEl.classList.add('on'); }
            Casino.Account.recordSpin('videopoker', bet, win);
            this.winEl.textContent = win > 0 ? '+' + fmt(win) : '0';
            this.winEl.style.color = win > 0 ? 'var(--green)' : 'var(--muted)';
            if (rank === 0) { Casino.Sound.bigWinFanfare(); this.msgEl.textContent = '👑 ROYAL FLUSH! +' + fmt(win); }
            else if (rank >= 0) { Casino.Sound.win(win >= bet * 9 ? 3 : 2); this.msgEl.textContent = PAYTABLE[rank][0] + '! +' + fmt(win); }
            else { Casino.Sound.lose(); this.msgEl.textContent = 'Bez výhry. Zkus to znovu!'; }
            this.dealBtn.textContent = 'ROZDAT';
        }
    };

    VP.prototype.info = function () {
        Casino.UI.modal({ title: '🂡 Video Poker — Jacks or Better', body: '<p style="color:var(--muted);line-height:1.6">Dostaneš 5 karet. Klikni na karty, které chceš <b>DRŽET</b>, zbytek se dobere. Platí pokerová kombinace (páry až od kluků J výš).</p><div class="vp-pt-modal">' + PAYTABLE.map(function (r) { return '<div class="vp-pt-row"><span>' + r[0] + '</span><b>' + r[1] + '×</b></div>'; }).join('') + '</div><p style="color:var(--muted);margin-top:8px">Při dobré strategii RTP ~99 %.</p>' });
    };
    VP.prototype.destroy = function () { };

    Casino.registry.push({ id: 'videopoker', name: 'Video Poker', emoji: '🂡', category: 'table', tagline: 'Klasický pokerový automat (Jacks or Better)', theme: { a: '#6c5cff', b: '#ffd24a', bg: 'radial-gradient(circle at 50% 0%, #161038, #07030f)' }, badges: ['RTP ~99%', 'Poker'], meta: 'Drž & dober · Royal 250×', open: function (m, o) { return Casino.VideoPoker.open(m, o); } });
})(typeof window !== 'undefined' ? window : global);
