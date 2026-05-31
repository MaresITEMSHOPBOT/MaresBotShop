/* ==========================================================================
   MARES CASINO – Mines. Odkrývej políčka, vyhýbej se minám, vyber výhru včas.
   Násobič = férový (0.99) součin (N-i)/(N-M-i) za každé bezpečné políčko.
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    var fmt = Casino.util.fmt;
    function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
    var N = 25, BETS = [10, 20, 50, 100, 250, 500], MINES = [1, 3, 5, 10];
    var EDGE = 0.99;

    function multiplier(M, k) { var m = EDGE; for (var i = 0; i < k; i++) m *= (N - i) / (N - M - i); return Math.round(m * 100) / 100; }

    Casino.Mines = { open: function (m, o) { return new Mines(m, o); } };
    function Mines(mount, opts) { this.opts = opts || {}; this.betIndex = 3; this.mines = 3; this.state = 'bet'; this.build(mount); }
    Mines.prototype.bet = function () { return BETS[this.betIndex]; };

    Mines.prototype.build = function (mount) {
        var self = this;
        var theme = { a: '#ff9b21', b: '#34e3ff', bg: 'radial-gradient(circle at 50% 0%, #161a2e, #06070f)' };
        var f = Casino.UI.gameFrame(mount, { emoji: '💣', name: 'Mines', subtitle: 'Odkrývej drahokamy, vyhni se minám', theme: theme, bg: theme.bg, onExit: this.opts.onExit, onInfo: function () { self.info(); } });
        this.frame = f;
        var info = el('div', 'mines-top'); info.innerHTML = '<div class="mines-mult">Násobič: <b class="cur">1.00×</b></div><div class="mines-next">Další: <b class="nxt">—</b></div>'; f.stage.appendChild(info);
        this.curEl = info.querySelector('.cur'); this.nxtEl = info.querySelector('.nxt');
        this.grid = el('div', 'mines-grid'); f.stage.appendChild(this.grid);
        this.tiles = [];
        for (var i = 0; i < N; i++) { var tile = el('button', 'mine-tile'); tile.dataset.i = i; (function (idx, tl) { tl.onclick = function () { self.reveal(idx); }; })(i, tile); this.grid.appendChild(tile); this.tiles.push(tile); }
        this.msgEl = el('div', 'vp-msg', 'Vyber počet min a stiskni HRÁT.'); f.stage.appendChild(this.msgEl);
        var c = f.controls;
        c.innerHTML =
            '<div class="ctrl-cell ctrl-bet"><button class="bet-dn">−</button><div class="bet-val"><label>Sázka</label><b class="c-bet">' + fmt(this.bet()) + '</b></div><button class="bet-up">+</button></div>' +
            '<div class="risk-seg mines-seg">' + MINES.map(function (m) { return '<button data-m="' + m + '"' + (m === 3 ? ' class="on"' : '') + '>' + m + ' 💣</button>'; }).join('') + '</div>' +
            '<button class="deal-btn mines-start">HRÁT</button>' +
            '<button class="play-btn mines-cash hidden">VYBRAT</button>';
        this.betEl = c.querySelector('.c-bet'); this.startBtn = c.querySelector('.mines-start'); this.cashBtn = c.querySelector('.mines-cash');
        c.querySelector('.bet-dn').onclick = function () { self.changeBet(-1); };
        c.querySelector('.bet-up').onclick = function () { self.changeBet(1); };
        c.querySelectorAll('.mines-seg button').forEach(function (b) { b.onclick = function () { if (self.state !== 'bet') return; self.mines = +b.dataset.m; c.querySelectorAll('.mines-seg button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); Casino.Sound.click(); }; });
        this.startBtn.onclick = function () { Casino.Sound.unlock(); self.start(); };
        this.cashBtn.onclick = function () { self.cashout(); };
    };
    Mines.prototype.changeBet = function (d) { if (this.state !== 'bet') return; var n = this.betIndex + d; if (n < 0 || n >= BETS.length) return; this.betIndex = n; Casino.Sound.click(); this.betEl.textContent = fmt(this.bet()); };

    Mines.prototype.start = function () {
        var bet = this.bet();
        if (!Casino.Account.debit(bet)) { Casino.UI.toast('Nedostatek kreditu!', ''); if (this.opts.onBroke) this.opts.onBroke(); return; }
        this.stake = bet; this.picked = 0; this.state = 'play';
        // rozmísti miny
        this.mineSet = {}; var placed = 0;
        while (placed < this.mines) { var r = Math.floor(Math.random() * N); if (!this.mineSet[r]) { this.mineSet[r] = true; placed++; } }
        this.tiles.forEach(function (t) { t.className = 'mine-tile'; t.textContent = ''; t.disabled = false; });
        this.curEl.textContent = '1.00×'; this.nxtEl.textContent = multiplier(this.mines, 1).toFixed(2) + '×';
        this.startBtn.classList.add('hidden'); this.cashBtn.classList.remove('hidden'); this.cashBtn.textContent = 'VYBRAT';
        this.msgEl.textContent = 'Odkrývej políčka. Vyber výhru, než šlápneš na minu!';
    };

    Mines.prototype.reveal = function (i) {
        if (this.state !== 'play' || this.tiles[i].classList.contains('open')) return;
        var t = this.tiles[i]; t.classList.add('open'); t.disabled = true;
        if (this.mineSet[i]) {
            t.classList.add('mine'); t.textContent = '💣'; Casino.Sound.lose();
            this.bust();
        } else {
            this.picked++; t.classList.add('gem'); t.textContent = '💎'; Casino.Sound.tick();
            var mult = multiplier(this.mines, this.picked);
            this.curEl.textContent = mult.toFixed(2) + '×';
            this.cashBtn.textContent = 'VYBRAT ' + fmt(Math.round(this.stake * mult));
            var safeLeft = (N - this.mines) - this.picked;
            if (safeLeft <= 0) { this.cashout(); return; }
            this.nxtEl.textContent = multiplier(this.mines, this.picked + 1).toFixed(2) + '×';
            Casino.Sound.win(0);
        }
    };

    Mines.prototype.bust = function () {
        var self = this; this.state = 'bet';
        this.tiles.forEach(function (t, i) { if (self.mineSet[i] && !t.classList.contains('mine')) { t.classList.add('open', 'mine-shown'); t.textContent = '💣'; } t.disabled = true; });
        Casino.Account.recordSpin('mines', this.stake, 0);
        this.msgEl.textContent = '💥 Bum! Šlápl jsi na minu. Prohra ' + fmt(this.stake) + '.';
        this.cashBtn.classList.add('hidden'); this.startBtn.classList.remove('hidden');
    };

    Mines.prototype.cashout = function () {
        if (this.state !== 'play' || this.picked === 0) { if (this.picked === 0) Casino.UI.toast('Odkryj aspoň jedno políčko.', ''); return; }
        var mult = multiplier(this.mines, this.picked), win = Math.round(this.stake * mult);
        Casino.Account.credit(win); Casino.Account.recordSpin('mines', this.stake, win);
        Casino.Sound.win(mult >= 5 ? 3 : 2);
        var self = this; this.state = 'bet';
        this.tiles.forEach(function (t, i) { if (self.mineSet[i]) { t.classList.add('open', 'mine-shown'); t.textContent = '💣'; } t.disabled = true; });
        this.msgEl.textContent = '💰 Vybráno ' + mult.toFixed(2) + '× → +' + fmt(win) + '!';
        this.cashBtn.classList.add('hidden'); this.startBtn.classList.remove('hidden');
    };

    Mines.prototype.info = function () { Casino.UI.modal({ title: '💣 Mines — jak hrát', body: '<p style="color:var(--muted);line-height:1.7">Na mřížce 5×5 je schováno ' + 'několik min. Odkrývej políčka — každý nalezený drahokam 💎 zvedne násobič. Kdykoliv můžeš <b>VYBRAT</b> výhru (sázka × násobič). Když odkryješ minu 💣, prohráváš sázku.</p><p style="color:var(--muted);margin-top:8px">Víc min = vyšší násobiče, ale větší riziko. RTP ≈ 99 %.</p>' }); };
    Mines.prototype.destroy = function () { this.state = 'done'; };

    Casino.registry.push({ id: 'mines', name: 'Mines', emoji: '💣', category: 'arcade', tagline: 'Odkrývej drahokamy, vyhni se minám', theme: { a: '#ff9b21', b: '#34e3ff', bg: 'radial-gradient(circle at 50% 0%, #161a2e, #06070f)' }, badges: ['RTP ~99%', 'Arkáda'], meta: '5×5 · vyber výhru včas', open: function (m, o) { return Casino.Mines.open(m, o); } });
})(typeof window !== 'undefined' ? window : global);
