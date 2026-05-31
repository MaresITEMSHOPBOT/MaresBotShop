/* ==========================================================================
   MARES CASINO – Plinko (padající kulička, canvas animace)
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    var fmt = Casino.util.fmt;
    function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }

    var ROWS = 16, BUCKETS = 17;
    var PROFILES = {
        low: { label: 'Nízké', m: [9, 3.4, 1.7, 1.4, 1.2, 1.1, 1, 0.9, 0.79, 0.9, 1, 1.1, 1.2, 1.4, 1.7, 3.4, 9] },
        med: { label: 'Střední', m: [106, 24, 7.9, 4, 1.9, 1.5, 0.93, 0.66, 0.53, 0.66, 0.93, 1.5, 1.9, 4, 7.9, 24, 106] },
        high: { label: 'Vysoké', m: [557, 111, 37, 11, 3.7, 1.3, 0.37, 0.19, 0.19, 0.19, 0.37, 1.3, 3.7, 11, 37, 111, 557] }
    };
    var BETS = [10, 20, 50, 100, 250, 500, 1000];

    function bucketColor(mult) {
        if (mult >= 50) return '#ff3b3b';
        if (mult >= 10) return '#ff7a1a';
        if (mult >= 3) return '#ffb01a';
        if (mult >= 1.2) return '#ffe14a';
        if (mult >= 1) return '#7CFF6B';
        return '#3aa0ff';
    }

    Casino.Plinko = {
        open: function (mount, opts) { return new Plinko(mount, opts); }
    };

    function Plinko(mount, opts) {
        this.opts = opts || {};
        this.risk = 'med';
        this.betIndex = 3;
        this.balls = [];
        this.history = [];
        this.raf = null;
        this.last = 0;
        this.destroyed = false;
        this.auto = 0;
        this.build(mount);
    }

    Plinko.prototype.bet = function () { return BETS[this.betIndex]; };

    Plinko.prototype.build = function (mount) {
        var self = this;
        var theme = { a: '#34e3ff', b: '#7b61ff', bg: 'radial-gradient(circle at 50% 0%, #10183a, #05030f)' };
        var f = Casino.UI.gameFrame(mount, {
            emoji: '🎯', name: 'Plinko', subtitle: 'Pusť kuličku — krajní jamky platí nejvíc',
            theme: theme, bg: theme.bg, onExit: this.opts.onExit,
            onInfo: function () { self.info(); }
        });
        this.frame = f;

        // recent výsledky
        this.histEl = el('div', 'plinko-hist');
        f.stage.appendChild(this.histEl);

        // canvas
        var holder = el('div', 'plinko-canvas-holder');
        this.canvas = el('canvas');
        this.W = 520; this.H = 560;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = this.W * dpr; this.canvas.height = this.H * dpr;
        this.canvas.style.width = '100%'; this.canvas.style.maxWidth = this.W + 'px';
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(dpr, dpr);
        holder.appendChild(this.canvas);
        f.stage.appendChild(holder);

        this.winLabel = el('div', 'plinko-win', '');
        f.stage.appendChild(this.winLabel);

        // ovládání
        var c = f.controls;
        c.innerHTML =
            '<div class="ctrl-cell ctrl-bet"><button class="bet-dn">−</button>' +
            '<div class="bet-val"><label>Sázka</label><b class="c-bet">' + fmt(this.bet()) + '</b></div>' +
            '<button class="bet-up">+</button></div>' +
            '<div class="risk-seg" role="group">' +
            ['low', 'med', 'high'].map(function (r) { return '<button data-r="' + r + '"' + (r === 'med' ? ' class="on"' : '') + '>' + PROFILES[r].label + '</button>'; }).join('') +
            '</div>' +
            '<button class="drop-btn">PUSŤ 🎯</button>' +
            '<button class="auto-btn ctrl-mini">AUTO</button>';
        this.betEl = c.querySelector('.c-bet');
        c.querySelector('.bet-dn').onclick = function () { self.changeBet(-1); };
        c.querySelector('.bet-up').onclick = function () { self.changeBet(1); };
        c.querySelectorAll('.risk-seg button').forEach(function (b) {
            b.onclick = function () { Casino.Sound.click(); self.risk = b.dataset.r; c.querySelectorAll('.risk-seg button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); self.draw(); };
        });
        c.querySelector('.drop-btn').onclick = function () { Casino.Sound.unlock(); self.drop(); };
        this.autoBtn = c.querySelector('.auto-btn');
        this.autoBtn.onclick = function () { self.toggleAuto(); };

        this.geom();
        this.draw();
        this.loop = function (ts) { self.tick(ts); };
        this.raf = requestAnimationFrame(this.loop);
    };

    Plinko.prototype.geom = function () {
        this.top = 42; this.bucketH = 60;
        this.sx = 28; this.center = this.W / 2;
        this.rowH = (this.H - this.top - this.bucketH) / ROWS;
    };
    Plinko.prototype.node = function (row, k) {
        return { x: this.center + (k - row / 2) * this.sx, y: this.top + row * this.rowH };
    };

    Plinko.prototype.changeBet = function (d) {
        var n = this.betIndex + d; if (n < 0 || n >= BETS.length) return;
        this.betIndex = n; Casino.Sound.click(); this.betEl.textContent = fmt(this.bet());
    };

    Plinko.prototype.drop = function () {
        var bet = this.bet();
        if (!Casino.Account.debit(bet)) { Casino.UI.toast('Nedostatek kreditu!', ''); this.stopAuto(); if (this.opts.onBroke) this.opts.onBroke(); return; }
        var dirs = [], k = 0;
        for (var i = 0; i < ROWS; i++) { var d = Math.random() < 0.5 ? 0 : 1; dirs.push(d); k += d; }
        var nodeK = [0]; for (i = 0; i < ROWS; i++) nodeK.push(nodeK[i] + dirs[i]);
        var mult = PROFILES[this.risk].m[k];
        this.balls.push({ nodeK: nodeK, seg: 0, t: 0, bet: bet, mult: mult, bucket: k, landed: false, lastSeg: -1 });
        Casino.Sound.click();
    };

    Plinko.prototype.toggleAuto = function () {
        if (this.auto) { this.stopAuto(); return; }
        this.auto = 1; this.autoBtn.classList.add('on'); this.autoBtn.textContent = 'STOP';
        this.autoAcc = 0;
    };
    Plinko.prototype.stopAuto = function () { this.auto = 0; if (this.autoBtn) { this.autoBtn.classList.remove('on'); this.autoBtn.textContent = 'AUTO'; } };

    Plinko.prototype.tick = function (ts) {
        if (this.destroyed) return;
        var dt = this.last ? Math.min(50, ts - this.last) : 16; this.last = ts;
        var segDur = 88;

        if (this.auto) {
            this.autoAcc += dt;
            if (this.autoAcc >= 360) { this.autoAcc = 0; if (Casino.Account.getBalance() >= this.bet()) this.drop(); else this.stopAuto(); }
        }

        for (var bi = this.balls.length - 1; bi >= 0; bi--) {
            var b = this.balls[bi];
            if (b.landed) { b.flash -= dt; if (b.flash <= 0) this.balls.splice(bi, 1); continue; }
            b.t += dt / segDur;
            if (Math.floor(b.seg) !== b.lastSeg) { b.lastSeg = Math.floor(b.seg); Casino.Sound.tick(); }
            while (b.t >= 1 && b.seg < ROWS) { b.t -= 1; b.seg++; if (b.seg < ROWS) Casino.Sound.tick(); }
            if (b.seg >= ROWS) this.land(b);
        }
        this.draw();
        this.raf = requestAnimationFrame(this.loop);
    };

    Plinko.prototype.land = function (b) {
        b.landed = true; b.flash = 600;
        var win = Math.round(b.bet * b.mult);
        if (win > 0) Casino.Account.credit(win);
        Casino.Account.recordSpin('plinko', b.bet, win);
        this.history.unshift({ mult: b.mult }); this.history = this.history.slice(0, 14);
        this.renderHist();
        var net = win - b.bet;
        this.winLabel.textContent = (net >= 0 ? '+' : '') + fmt(net) + ' (×' + b.mult + ')';
        this.winLabel.style.color = net >= 0 ? 'var(--green)' : 'var(--red)';
        if (b.mult >= 10) { Casino.Sound.win(b.mult >= 50 ? 3 : 2); }
        else if (b.mult >= 1) Casino.Sound.win(0);
        else Casino.Sound.lose();
        this.flashBucket = { i: b.bucket, t: 600 };
    };

    Plinko.prototype.draw = function () {
        var ctx = this.ctx, W = this.W, H = this.H;
        ctx.clearRect(0, 0, W, H);
        // pegy
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (var r = 1; r < ROWS; r++) for (var k = 0; k <= r; k++) {
            var p = this.node(r, k);
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill();
        }
        // buckety
        var m = PROFILES[this.risk].m;
        for (var i = 0; i < BUCKETS; i++) {
            var bc = this.node(ROWS, i);
            var x = bc.x - this.sx / 2 + 1, y = this.top + ROWS * this.rowH + 4, w = this.sx - 2, h = this.bucketH - 8;
            var flashing = this.flashBucket && this.flashBucket.i === i && this.flashBucket.t > 0;
            ctx.fillStyle = bucketColor(m[i]);
            ctx.globalAlpha = flashing ? 1 : 0.85;
            roundRect(ctx, x, y, w, h, 5); ctx.fill();
            if (flashing) { ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); }
            ctx.globalAlpha = 1;
            ctx.fillStyle = m[i] >= 1.2 ? '#2a1700' : '#06223a';
            ctx.font = '700 ' + (m[i] >= 100 ? 8 : 9) + 'px Segoe UI, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText((m[i] >= 10 ? Math.round(m[i]) : m[i]) + '×', bc.x, y + h / 2);
        }
        if (this.flashBucket) { this.flashBucket.t -= 16; if (this.flashBucket.t <= 0) this.flashBucket = null; }
        // kuličky
        for (var bi = 0; bi < this.balls.length; bi++) {
            var b = this.balls[bi];
            var seg = Math.min(b.seg, ROWS - 1);
            var n0 = this.node(seg, b.nodeK[seg]);
            var n1 = this.node(seg + 1, b.nodeK[seg + 1]);
            var t = b.landed ? 1 : b.t;
            var bx = n0.x + (n1.x - n0.x) * t;
            var by = n0.y + (n1.y - n0.y) * t - Math.sin(t * Math.PI) * 6;
            if (b.landed) { var lp = this.node(ROWS, b.bucket); bx = lp.x; by = this.top + ROWS * this.rowH + 14; }
            var g = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, 8);
            g.addColorStop(0, '#fff7d6'); g.addColorStop(1, '#ffb01a');
            ctx.fillStyle = g; ctx.shadowColor = '#ffd24a'; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(bx, by, 7, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        }
    };

    Plinko.prototype.renderHist = function () {
        this.histEl.innerHTML = this.history.map(function (h) {
            return '<span class="ph" style="background:' + bucketColor(h.mult) + ';color:' + (h.mult >= 1.2 ? '#2a1700' : '#06223a') + '">' + (h.mult >= 10 ? Math.round(h.mult) : h.mult) + '×</span>';
        }).join('');
    };

    Plinko.prototype.info = function () {
        var m = PROFILES[this.risk].m;
        Casino.UI.modal({
            title: '🎯 Plinko — jak hrát',
            body: '<p style="color:var(--muted);line-height:1.6">Pusť kuličku z vrcholu. Odráží se mezi kolíky a spadne do jedné z ' + BUCKETS + ' jamek. ' +
                'Výhra = sázka × násobič jamky. <b>Krajní jamky platí nejvíc</b> (až 557× na vysoké riziko), ale jsou nejméně pravděpodobné.</p>' +
                '<p style="color:var(--muted);margin-top:10px">Riziko mění rozložení násobičů. RTP ≈ 96–98 %. Tlačítko AUTO pouští kuličky automaticky.</p>'
        });
    };

    Plinko.prototype.destroy = function () {
        this.destroyed = true; this.auto = 0;
        if (this.raf) cancelAnimationFrame(this.raf);
    };

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }

    Casino.registry.push({
        id: 'plinko', name: 'Plinko', emoji: '🎯', category: 'arcade',
        tagline: 'Pusť kuličku a sleduj, kam spadne',
        theme: { a: '#34e3ff', b: '#7b61ff', bg: 'radial-gradient(circle at 50% 0%, #10183a, #05030f)' },
        badges: ['RTP ~97%', 'Arkáda'], meta: '16 řad · jamky až 557×',
        open: function (mount, opts) { return Casino.Plinko.open(mount, opts); }
    });

})(typeof window !== 'undefined' ? window : global);
