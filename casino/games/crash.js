/* ==========================================================================
   MARES CASINO – To the Moon (crash / raketa). Vyber cash-out než spadne.
   Crash bod: m = 0.99/(1-r) => ~1% house edge (RTP ~99% při výběru).
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    var fmt = Casino.util.fmt;
    function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }

    var BETS = [10, 20, 50, 100, 250, 500, 1000];
    var K = 0.32; // růst násobiče (e^(K*t))

    function crashPoint() {
        var r = Math.random();
        var m = 0.99 / (1 - r);
        if (m < 1) m = 1.0;
        m = Math.min(m, 100000);
        return Math.floor(m * 100) / 100;
    }

    Casino.Crash = { open: function (mount, opts) { return new Crash(mount, opts); } };

    function Crash(mount, opts) {
        this.opts = opts || {};
        this.betIndex = 3;
        this.state = 'idle';
        this.history = [];
        this.autoOn = false; this.autoTarget = 2.0;
        this.pts = [];
        this.destroyed = false;
        this.build(mount);
    }
    Crash.prototype.bet = function () { return BETS[this.betIndex]; };

    Crash.prototype.build = function (mount) {
        var self = this;
        var theme = { a: '#ff5d6c', b: '#ffd24a', bg: 'radial-gradient(circle at 50% 10%, #0b1233, #05030f)' };
        var f = Casino.UI.gameFrame(mount, {
            emoji: '🚀', name: 'To the Moon', subtitle: 'Vyber výhru než raketa vybuchne',
            theme: theme, bg: theme.bg, onExit: this.opts.onExit, onInfo: function () { self.info(); }
        });
        this.frame = f;

        this.histEl = el('div', 'crash-hist'); f.stage.appendChild(this.histEl);
        var holder = el('div', 'crash-canvas-holder');
        this.canvas = el('canvas'); this.W = 540; this.H = 360;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = this.W * dpr; this.canvas.height = this.H * dpr;
        this.canvas.style.width = '100%'; this.canvas.style.maxWidth = this.W + 'px';
        this.ctx = this.canvas.getContext('2d'); this.ctx.scale(dpr, dpr);
        holder.appendChild(this.canvas);
        this.multEl = el('div', 'crash-mult', '1.00×');
        holder.appendChild(this.multEl);
        f.stage.appendChild(holder);

        var c = f.controls;
        c.innerHTML =
            '<div class="ctrl-cell ctrl-bet"><button class="bet-dn">−</button>' +
            '<div class="bet-val"><label>Sázka</label><b class="c-bet">' + fmt(this.bet()) + '</b></div>' +
            '<button class="bet-up">+</button></div>' +
            '<label class="auto-cash"><input type="checkbox" class="ac-on"> Auto výběr ×<input type="number" class="ac-val" value="2.00" step="0.1" min="1.01"></label>' +
            '<button class="crash-btn idle">VSADIT</button>';
        this.betEl = c.querySelector('.c-bet');
        c.querySelector('.bet-dn').onclick = function () { self.changeBet(-1); };
        c.querySelector('.bet-up').onclick = function () { self.changeBet(1); };
        this.acOn = c.querySelector('.ac-on'); this.acVal = c.querySelector('.ac-val');
        this.acOn.onchange = function () { self.autoOn = self.acOn.checked; };
        this.acVal.onchange = function () { self.autoTarget = Math.max(1.01, parseFloat(self.acVal.value) || 2); self.acVal.value = self.autoTarget.toFixed(2); };
        this.btn = c.querySelector('.crash-btn');
        this.btn.onclick = function () { Casino.Sound.unlock(); self.onButton(); };

        this.draw();
        this.loop = function (ts) { self.tick(ts); };
        this.raf = requestAnimationFrame(this.loop);
    };

    Crash.prototype.changeBet = function (d) {
        if (this.state !== 'idle') return;
        var n = this.betIndex + d; if (n < 0 || n >= BETS.length) return;
        this.betIndex = n; Casino.Sound.click(); this.betEl.textContent = fmt(this.bet());
    };

    Crash.prototype.onButton = function () {
        if (this.state === 'idle') this.startRound();
        else if (this.state === 'running' && !this.cashed) this.cashOut(this.mult);
    };

    Crash.prototype.startRound = function () {
        var bet = this.bet();
        if (!Casino.Account.debit(bet)) { Casino.UI.toast('Nedostatek kreditu!', ''); if (this.opts.onBroke) this.opts.onBroke(); return; }
        this.roundBet = bet;
        this.crash = crashPoint();
        this.startT = performance.now();
        this.mult = 1.0; this.cashed = false; this.cashedAt = 0; this.pts = [];
        this.state = 'running';
        this.btn.className = 'crash-btn cash';
        Casino.Sound.spin();
    };

    Crash.prototype.cashOut = function (atMult) {
        if (this.cashed) return;
        this.cashed = true; this.cashedAt = atMult;
        var win = Math.round(this.roundBet * atMult);
        this.winAmount = win;
        Casino.Account.credit(win);
        Casino.Sound.win(atMult >= 10 ? 3 : atMult >= 3 ? 2 : 1);
        this.btn.className = 'crash-btn done';
        this.btn.textContent = 'VYBRÁNO ×' + atMult.toFixed(2);
        Casino.UI.toast('Výběr ×' + atMult.toFixed(2) + ' → +' + fmt(win), 'good');
    };

    Crash.prototype.endRound = function () {
        this.state = 'crashed';
        var win = this.cashed ? this.winAmount : 0;
        Casino.Account.recordSpin('crash', this.roundBet, win);
        this.history.unshift(this.crash); this.history = this.history.slice(0, 16);
        this.renderHist();
        if (!this.cashed) { Casino.Sound.lose(); }
        this.crashT = performance.now();
    };

    Crash.prototype.tick = function (ts) {
        if (this.destroyed) return;
        if (this.state === 'running') {
            var tSec = (ts - this.startT) / 1000;
            this.mult = Math.exp(K * tSec);
            if (!this.cashed && this.autoOn && this.mult >= this.autoTarget && this.autoTarget <= this.crash) {
                this.cashOut(this.autoTarget);
            }
            if (this.mult >= this.crash) { this.mult = this.crash; this.endRound(); }
            else { this.pts.push({ t: tSec, m: this.mult }); if (this.pts.length > 1200) this.pts.shift(); }
        } else if (this.state === 'crashed') {
            if (ts - this.crashT > 1500) this.reset();
        }
        this.draw();
        this.raf = requestAnimationFrame(this.loop);
    };

    Crash.prototype.reset = function () {
        this.state = 'idle';
        this.btn.className = 'crash-btn idle'; this.btn.textContent = 'VSADIT';
        this.multEl.textContent = '1.00×'; this.multEl.style.color = '';
    };

    Crash.prototype.draw = function () {
        var ctx = this.ctx, W = this.W, H = this.H, pad = 30;
        ctx.clearRect(0, 0, W, H);
        // mřížka
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
        for (var gx = 0; gx <= 5; gx++) { var x = pad + (W - 2 * pad) * gx / 5; ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke(); }
        for (var gy = 0; gy <= 4; gy++) { var y = pad + (H - 2 * pad) * gy / 4; ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke(); }

        var running = this.state === 'running', crashed = this.state === 'crashed';
        var curMult = this.mult || 1;
        var tmax = Math.max(this.pts.length ? this.pts[this.pts.length - 1].t : 1, 3);
        var mmax = Math.max(curMult, 2);
        var self = this;
        function px(t) { return pad + (W - 2 * pad) * (t / tmax); }
        function py(m) { return (H - pad) - (H - 2 * pad) * ((m - 1) / (mmax - 1)); }

        if (this.pts.length > 1) {
            ctx.beginPath(); ctx.moveTo(px(0), py(1));
            for (var i = 0; i < this.pts.length; i++) ctx.lineTo(px(this.pts[i].t), py(this.pts[i].m));
            var grad = ctx.createLinearGradient(0, 0, W, 0);
            grad.addColorStop(0, '#ffd24a'); grad.addColorStop(1, crashed ? '#ff3b3b' : (this.cashed ? '#7CFF6B' : '#ff7a1a'));
            ctx.strokeStyle = grad; ctx.lineWidth = 4; ctx.lineJoin = 'round';
            ctx.shadowColor = crashed ? '#ff3b3b' : '#ffd24a'; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;
            // plocha pod křivkou
            ctx.lineTo(px(this.pts[this.pts.length - 1].t), H - pad); ctx.lineTo(px(0), H - pad); ctx.closePath();
            ctx.fillStyle = 'rgba(255,210,74,0.08)'; ctx.fill();
            // raketa / exploze na hlavě
            var hx = px(this.pts[this.pts.length - 1].t), hy = py(this.pts[this.pts.length - 1].m);
            ctx.font = '26px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(crashed ? '💥' : '🚀', hx, hy - 4);
        }
        // text násobiče
        this.multEl.textContent = curMult.toFixed(2) + '×';
        this.multEl.style.color = crashed && !this.cashed ? 'var(--red)' : (this.cashed ? 'var(--green)' : '#fff');
        if (crashed) this.multEl.textContent = '💥 ' + this.crash.toFixed(2) + '×';
        if (running && !this.cashed) this.btn.textContent = 'VYBER ×' + curMult.toFixed(2);
    };

    Crash.prototype.renderHist = function () {
        this.histEl.innerHTML = this.history.map(function (m) {
            var col = m >= 10 ? '#ff3b3b' : m >= 2 ? '#7CFF6B' : '#ff7a1a';
            return '<span class="ch" style="color:' + col + ';border-color:' + col + '">' + m.toFixed(2) + '×</span>';
        }).join('');
    };

    Crash.prototype.info = function () {
        Casino.UI.modal({
            title: '🚀 To the Moon — jak hrát',
            body: '<p style="color:var(--muted);line-height:1.6">Vsaď a raketa odstartuje. Násobič roste — klikni <b>VYBER</b>, než raketa vybuchne, a získáš sázku × aktuální násobič. ' +
                'Když vybuchne dřív, sázka propadá.</p>' +
                '<p style="color:var(--muted);margin-top:10px">Můžeš zapnout <b>Auto výběr</b> na zvolený násobič. Crash může přijít kdykoliv (i hned na 1.00×). RTP ≈ 99 %.</p>'
        });
    };

    Crash.prototype.destroy = function () { this.destroyed = true; if (this.raf) cancelAnimationFrame(this.raf); };

    Casino.registry.push({
        id: 'crash', name: 'To the Moon', emoji: '🚀', category: 'arcade',
        tagline: 'Raketa stoupá — vyber než vybuchne',
        theme: { a: '#ff5d6c', b: '#ffd24a', bg: 'radial-gradient(circle at 50% 10%, #0b1233, #05030f)' },
        badges: ['RTP ~99%', 'Crash'], meta: 'Násobič bez stropu · auto výběr',
        open: function (mount, opts) { return Casino.Crash.open(mount, opts); }
    });

})(typeof window !== 'undefined' ? window : global);
