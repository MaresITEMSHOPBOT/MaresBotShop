/* ==========================================================================
   MARES CASINO – Kolo štěstí. Roztoč kolo a vyhraj násobič pod ukazatelem.
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    var fmt = Casino.util.fmt;
    function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
    var BETS = [10, 20, 50, 100, 250, 500, 1000];
    // 16 segmentů, RTP ~95 %
    var SEG = [0, 1.2, 0, 1.5, 0, 1.6, 0, 1.4, 0, 2.4, 0, 1.5, 0, 1.6, 0, 4];
    function segColor(m) { return m === 0 ? '#3a2150' : m >= 4 ? '#ff3b3b' : m >= 2 ? '#ff7a1a' : m >= 1.5 ? '#ffd24a' : '#7CFF6B'; }

    Casino.Wheel = { open: function (m, o) { return new Wheel(m, o); } };
    function Wheel(mount, opts) { this.opts = opts || {}; this.betIndex = 3; this.rot = 0; this.spinning = false; this.history = []; this.build(mount); }
    Wheel.prototype.bet = function () { return BETS[this.betIndex]; };

    Wheel.prototype.build = function (mount) {
        var self = this;
        var theme = { a: '#ff5db1', b: '#ffd24a', bg: 'radial-gradient(circle at 50% 0%, #2a0e3a, #0a0414)' };
        var f = Casino.UI.gameFrame(mount, { emoji: '🎡', name: 'Kolo štěstí', subtitle: 'Roztoč a vyhraj násobič', theme: theme, bg: theme.bg, onExit: this.opts.onExit, onInfo: function () { self.info(); } });
        this.frame = f;
        this.histEl = el('div', 'crash-hist'); f.stage.appendChild(this.histEl);
        var wrap = el('div', 'wheel-wrap');
        this.canvas = el('canvas'); this.WS = 300;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = this.WS * dpr; this.canvas.height = this.WS * dpr; this.canvas.style.width = this.WS + 'px'; this.canvas.style.height = this.WS + 'px';
        this.ctx = this.canvas.getContext('2d'); this.ctx.scale(dpr, dpr);
        wrap.appendChild(this.canvas); wrap.appendChild(el('div', 'wheel-pointer', '▼'));
        f.stage.appendChild(wrap);
        this.winLabel = el('div', 'plinko-win', ''); f.stage.appendChild(this.winLabel);
        this.draw(0);
        var c = f.controls;
        c.innerHTML = '<div class="ctrl-cell ctrl-bet"><button class="bet-dn">−</button><div class="bet-val"><label>Sázka</label><b class="c-bet">' + fmt(this.bet()) + '</b></div><button class="bet-up">+</button></div><button class="spin-roul wheel-spin">ROZTOČIT 🎡</button>';
        this.betEl = c.querySelector('.c-bet'); this.spinBtn = c.querySelector('.wheel-spin');
        c.querySelector('.bet-dn').onclick = function () { self.changeBet(-1); };
        c.querySelector('.bet-up').onclick = function () { self.changeBet(1); };
        this.spinBtn.onclick = function () { Casino.Sound.unlock(); self.spin(); };
    };
    Wheel.prototype.changeBet = function (d) { if (this.spinning) return; var n = this.betIndex + d; if (n < 0 || n >= BETS.length) return; this.betIndex = n; Casino.Sound.click(); this.betEl.textContent = fmt(this.bet()); };

    Wheel.prototype.spin = function () {
        if (this.spinning) return;
        var bet = this.bet();
        if (!Casino.Account.debit(bet)) { Casino.UI.toast('Nedostatek kreditu!', ''); if (this.opts.onBroke) this.opts.onBroke(); return; }
        this.spinning = true; this.spinBtn.disabled = true; Casino.Sound.spin();
        var idx = Math.floor(Math.random() * SEG.length);
        var seg = (Math.PI * 2) / SEG.length;
        var target = (-Math.PI / 2) - idx * seg;
        var turns = 5 + Math.floor(Math.random() * 2);
        var start = this.rot, end = target - turns * Math.PI * 2; while (end > start) end -= Math.PI * 2;
        var self = this, t0 = performance.now(), dur = 4000, last = 0;
        function frame(now) {
            if (self.destroyed) return;
            var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
            self.rot = start + (end - start) * e; self.draw(self.rot);
            if (now - last > 90 && p < 0.92) { Casino.Sound.tick(); last = now; }
            if (p < 1) requestAnimationFrame(frame); else self.resolve(idx, bet);
        }
        requestAnimationFrame(frame);
    };

    Wheel.prototype.resolve = function (idx, bet) {
        var mult = SEG[idx], win = Math.round(bet * mult);
        if (win > 0) Casino.Account.credit(win);
        Casino.Account.recordSpin('wheel', bet, win);
        this.history.unshift(mult); this.history = this.history.slice(0, 14); this.renderHist();
        var net = win - bet;
        this.winLabel.textContent = (net >= 0 ? '+' : '') + fmt(net) + ' (' + mult + '×)';
        this.winLabel.style.color = net >= 0 ? 'var(--green)' : 'var(--red)';
        if (mult >= 4) Casino.Sound.win(3); else if (mult >= 1.5) Casino.Sound.win(2); else if (mult > 0) Casino.Sound.win(0); else Casino.Sound.lose();
        this.spinning = false; this.spinBtn.disabled = false;
    };
    Wheel.prototype.renderHist = function () { this.histEl.innerHTML = this.history.map(function (m) { var c = segColor(m); return '<span class="ch" style="color:' + c + ';border-color:' + c + '">' + m + '×</span>'; }).join(''); };

    Wheel.prototype.draw = function (rot) {
        var ctx = this.ctx, S = this.WS, cx = S / 2, cy = S / 2, R = S / 2 - 4, seg = (Math.PI * 2) / SEG.length;
        ctx.clearRect(0, 0, S, S);
        for (var i = 0; i < SEG.length; i++) {
            var a0 = rot + i * seg - seg / 2, a1 = a0 + seg;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath();
            ctx.fillStyle = segColor(SEG[i]); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.5; ctx.stroke();
            var am = a0 + seg / 2;
            ctx.save(); ctx.translate(cx + Math.cos(am) * (R - 18), cy + Math.sin(am) * (R - 18)); ctx.rotate(am + Math.PI / 2);
            ctx.fillStyle = SEG[i] === 0 ? '#9a8' : '#1a1030'; ctx.font = '700 12px Segoe UI'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(SEG[i] === 0 ? '✕' : SEG[i] + '×', 0, 0); ctx.restore();
        }
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.16, 0, 7); ctx.fillStyle = '#2a1a08'; ctx.fill(); ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 3; ctx.stroke();
    };

    Wheel.prototype.info = function () { Casino.UI.modal({ title: '🎡 Kolo štěstí', body: '<p style="color:var(--muted);line-height:1.7">Vsaď a roztoč kolo. Kde se zastaví ukazatel, takový násobič dostaneš (výhra = sázka × násobič). Pole ✕ znamená prohru. Top výhra 4×, RTP ≈ 95 %.</p>' }); };
    Wheel.prototype.destroy = function () { this.destroyed = true; };

    Casino.registry.push({ id: 'wheel', name: 'Kolo štěstí', emoji: '🎡', category: 'arcade', tagline: 'Roztoč kolo a chytni násobič', theme: { a: '#ff5db1', b: '#ffd24a', bg: 'radial-gradient(circle at 50% 0%, #2a0e3a, #0a0414)' }, badges: ['RTP ~95%', 'Arkáda'], meta: '16 polí · až 4×', open: function (m, o) { return Casino.Wheel.open(m, o); } });
})(typeof window !== 'undefined' ? window : global);
