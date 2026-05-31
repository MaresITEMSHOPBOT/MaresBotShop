/* ==========================================================================
   MARES CASINO – Chicken Road. Slepice skáče přes pruhy s auty.
   Každý pruh zvedne násobič, ale hrozí sražení. Vyber výhru včas.
   Násobič_k = 0.97 / s^k  → RTP ~97 % (s = šance přežití na pruh).
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    var fmt = Casino.util.fmt;
    function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
    var BETS = [10, 20, 50, 100, 250, 500];
    var LANES = 16, EDGE = 0.97;
    var DIFF = {
        easy: { label: 'Lehká', s: 0.95 },
        medium: { label: 'Střední', s: 0.86 },
        hard: { label: 'Těžká', s: 0.75 }
    };
    function mults(s) { var a = []; for (var k = 1; k <= LANES; k++) { var m = EDGE / Math.pow(s, k); a.push(m >= 10 ? Math.round(m) : Math.round(m * 100) / 100); } return a; }

    Casino.Chicken = { open: function (m, o) { return new Chicken(m, o); } };
    function Chicken(mount, opts) { this.opts = opts || {}; this.betIndex = 3; this.diff = 'medium'; this.state = 'bet'; this.pos = 0; this.build(mount); }
    Chicken.prototype.bet = function () { return BETS[this.betIndex]; };
    Chicken.prototype.M = function () { return mults(DIFF[this.diff].s); };

    Chicken.prototype.build = function (mount) {
        var self = this;
        var theme = { a: '#ffd24a', b: '#ff7a1a', bg: 'linear-gradient(180deg, #1a1f3a, #07030f)' };
        var f = Casino.UI.gameFrame(mount, { emoji: '🐔', name: 'Chicken Road', subtitle: 'Přeskákej pruhy a vyber výhru než tě srazí auto', theme: theme, bg: theme.bg, onExit: this.opts.onExit, onInfo: function () { self.info(); } });
        this.frame = f;
        this.msgEl = el('div', 'chick-msg', 'Vyber obtížnost, vsaď a klikni SKOČ.'); f.stage.appendChild(this.msgEl);
        this.road = el('div', 'chick-road'); f.stage.appendChild(this.road);
        this.renderRoad();
        var c = f.controls;
        c.innerHTML =
            '<div class="ctrl-cell ctrl-bet"><button class="bet-dn">−</button><div class="bet-val"><label>Sázka</label><b class="c-bet">' + fmt(this.bet()) + '</b></div><button class="bet-up">+</button></div>' +
            '<div class="risk-seg chick-diff">' + Object.keys(DIFF).map(function (d) { return '<button data-d="' + d + '"' + (d === 'medium' ? ' class="on"' : '') + '>' + DIFF[d].label + '</button>'; }).join('') + '</div>' +
            '<button class="deal-btn chick-jump">SKOČ 🐔</button>' +
            '<button class="play-btn chick-cash hidden">VYBRAT</button>';
        this.betEl = c.querySelector('.c-bet'); this.jumpBtn = c.querySelector('.chick-jump'); this.cashBtn = c.querySelector('.chick-cash');
        c.querySelector('.bet-dn').onclick = function () { self.changeBet(-1); };
        c.querySelector('.bet-up').onclick = function () { self.changeBet(1); };
        c.querySelectorAll('.chick-diff button').forEach(function (b) { b.onclick = function () { if (self.state !== 'bet') return; self.diff = b.dataset.d; c.querySelectorAll('.chick-diff button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); Casino.Sound.click(); self.renderRoad(); }; });
        this.jumpBtn.onclick = function () { Casino.Sound.unlock(); self.jump(); };
        this.cashBtn.onclick = function () { self.cashout(); };
    };
    Chicken.prototype.changeBet = function (d) { if (this.state !== 'bet') return; var n = this.betIndex + d; if (n < 0 || n >= BETS.length) return; this.betIndex = n; Casino.Sound.click(); this.betEl.textContent = fmt(this.bet()); };

    Chicken.prototype.renderRoad = function () {
        var self = this, M = this.M();
        this.road.innerHTML = '';
        var start = el('div', 'lane start' + (this.pos === 0 ? ' cur' : ''));
        start.innerHTML = '<div class="lane-mult">START</div><div class="lane-body">' + (this.pos === 0 ? '<span class="chick">🐔</span>' : '🟩') + '</div>';
        this.road.appendChild(start);
        for (var k = 1; k <= LANES; k++) {
            var lane = el('div', 'lane' + (k === this.pos ? ' cur' : '') + (k < this.pos ? ' done' : '') + (k === this.crashLane ? ' crash' : ''));
            var body = k === this.pos ? '<span class="chick">🐔</span>' : (k === this.crashLane ? '🚗💥' : (k < this.pos ? '✅' : '🚗'));
            lane.innerHTML = '<div class="lane-mult">' + M[k - 1] + '×</div><div class="lane-body">' + body + '</div>';
            this.road.appendChild(lane);
        }
        // posuň pohled na aktuální pruh
        var cur = this.road.querySelector('.cur');
        if (cur) cur.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    };

    Chicken.prototype.setMode = function (m) {
        this.jumpBtn.classList.toggle('hidden', m !== 'play' && m !== 'bet');
        this.jumpBtn.textContent = m === 'bet' ? 'SKOČ 🐔' : 'SKOČ 🐔';
        this.cashBtn.classList.toggle('hidden', m !== 'play' || this.pos < 1);
    };

    Chicken.prototype.jump = function () {
        var self = this;
        if (this.state === 'bet') {
            var bet = this.bet();
            if (!Casino.Account.debit(bet)) { Casino.UI.toast('Nedostatek kreditu!', ''); if (this.opts.onBroke) this.opts.onBroke(); return; }
            this.stake = bet; this.pos = 0; this.crashLane = -1; this.state = 'play';
            this.renderRoad(); Casino.Sound.click();
        }
        if (this.state !== 'play') return;
        // pokus o přeskok na další pruh
        var s = DIFF[this.diff].s;
        if (Math.random() < s) {
            this.pos++; Casino.Sound.reelStop(2);
            this.renderRoad();
            var m = this.M()[this.pos - 1];
            this.cashBtn.textContent = 'VYBRAT ' + fmt(Math.round(this.stake * m));
            this.msgEl.textContent = 'Pruh ' + this.pos + ' · ×' + m + ' — skoč dál, nebo vyber!';
            this.setMode('play');
            if (this.pos >= LANES) this.cashout(); // dosažen konec → auto výběr
        } else {
            this.crashLane = this.pos + 1; this.state = 'bet';
            this.renderRoad(); Casino.Sound.lose();
            Casino.Account.recordSpin('chicken', this.stake, 0);
            this.msgEl.textContent = '💥 Auto! Slepice to nedala. Prohra ' + fmt(this.stake) + '.';
            this.jumpBtn.textContent = 'SKOČ 🐔'; this.setMode('bet'); this.cashBtn.classList.add('hidden');
        }
    };

    Chicken.prototype.cashout = function () {
        if (this.state !== 'play' || this.pos < 1) return;
        var m = this.M()[this.pos - 1], win = Math.round(this.stake * m);
        Casino.Account.credit(win); Casino.Account.recordSpin('chicken', this.stake, win);
        Casino.Sound.win(m >= 10 ? 3 : 2);
        this.state = 'bet';
        this.msgEl.textContent = '🐔 Bezpečně! ×' + m + ' → +' + fmt(win);
        this.setMode('bet'); this.cashBtn.classList.add('hidden');
    };

    Chicken.prototype.info = function () { Casino.UI.modal({ title: '🐔 Chicken Road', body: '<p style="color:var(--muted);line-height:1.7">Vsaď a klikni <b>SKOČ</b>. Slepice přeskakuje pruhy s auty — každý zdolaný pruh zvedne násobič. Kdykoliv můžeš <b>VYBRAT</b> (sázka × aktuální násobič). Když tě srazí auto, sázka propadá.</p><p style="color:var(--muted);margin-top:8px">Obtížnost mění riziko i násobiče: Lehká (bezpečná, malé ×), Těžká (riskantní, až ' + Math.round(EDGE / Math.pow(DIFF.hard.s, LANES)) + '×). RTP ≈ 97 %.</p>' }); };
    Chicken.prototype.destroy = function () { };

    Casino.registry.push({ id: 'chicken', name: 'Chicken Road', emoji: '🐔', category: 'arcade', tagline: 'Přeskákej auta a vyber výhru včas', theme: { a: '#ffd24a', b: '#ff7a1a', bg: 'linear-gradient(180deg, #1a1f3a, #07030f)' }, badges: ['RTP ~97%', 'Arkáda'], meta: '3 obtížnosti · cash-out kdykoliv', open: function (m, o) { return Casino.Chicken.open(m, o); } });
})(typeof window !== 'undefined' ? window : global);
