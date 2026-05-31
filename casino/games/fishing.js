/* ==========================================================================
   MARES CASINO – Velký úlovek (rybaření). Nahoď, navíjej, chyť rybu.
   RTP ~96 % (váhy výsledků odladěny).
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    var util = Casino.util, fmt = util.fmt;
    function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }

    var BETS = [10, 20, 50, 100, 250, 500, 1000];
    var OUTCOMES = [
        { icon: '🥾', name: 'Stará bota', mult: 0, weight: 26 },
        { icon: '🌿', name: 'Mořská řasa', mult: 0, weight: 24 },
        { icon: '🥫', name: 'Plechovka', mult: 0, weight: 20 },
        { icon: '🦐', name: 'Kreveta', mult: 1.2, weight: 26 },
        { icon: '🐟', name: 'Rybka', mult: 1.5, weight: 18 },
        { icon: '🐠', name: 'Tropická ryba', mult: 2, weight: 11 },
        { icon: '🐡', name: 'Čtverzubec', mult: 3, weight: 6 },
        { icon: '🦀', name: 'Krab', mult: 5, weight: 2.6 },
        { icon: '🐙', name: 'Chobotnice', mult: 10, weight: 0.8 },
        { icon: '🦈', name: 'Žralok', mult: 25, weight: 0.22 },
        { icon: '🐋', name: 'Velryba', mult: 50, weight: 0.06 },
        { icon: '💎', name: 'Truhla pokladů', mult: 100, weight: 0.015 }
    ];

    Casino.Fishing = { open: function (mount, opts) { return new Fishing(mount, opts); } };

    function Fishing(mount, opts) {
        this.opts = opts || {};
        this.betIndex = 3;
        this.busy = false;
        this.destroyed = false;
        this.timers = [];
        this.build(mount);
    }
    Fishing.prototype.bet = function () { return BETS[this.betIndex]; };
    Fishing.prototype.after = function (ms, fn) { var id = setTimeout(fn, ms); this.timers.push(id); return id; };

    Fishing.prototype.build = function (mount) {
        var self = this;
        var theme = { a: '#27d3c4', b: '#1a73ff', bg: 'linear-gradient(180deg, #0a2a45 0%, #062033 100%)' };
        var f = Casino.UI.gameFrame(mount, {
            emoji: '🎣', name: 'Velký úlovek', subtitle: 'Nahoď a chyť, co se dá — velryba i poklad čekají',
            theme: theme, bg: theme.bg, onExit: this.opts.onExit, onInfo: function () { self.info(); }
        });
        this.frame = f;

        var scene = el('div', 'fishing-scene');
        scene.innerHTML =
            '<div class="boat">🚤</div>' +
            '<div class="fish-line"><div class="hook"><span class="hook-ico">🪝</span><span class="hook-fish"></span></div></div>' +
            '<div class="water-deco"></div>';
        // dekorativní ryby
        var deco = scene.querySelector('.water-deco');
        ['🐟', '🐠', '🐡', '🦐', '🐙'].forEach(function (fi, i) {
            var d = el('span', 'deco-fish', fi);
            d.style.top = (40 + i * 13) + '%';
            d.style.animationDuration = (8 + i * 2.5) + 's';
            d.style.animationDelay = (-i * 2) + 's';
            if (i % 2) d.classList.add('rev');
            deco.appendChild(d);
        });
        f.stage.appendChild(scene);
        this.scene = scene;
        this.line = scene.querySelector('.fish-line');
        this.hookFish = scene.querySelector('.hook-fish');

        this.reveal = el('div', 'catch-reveal hidden');
        f.stage.appendChild(this.reveal);

        var c = f.controls;
        c.innerHTML =
            '<div class="ctrl-cell ctrl-bet"><button class="bet-dn">−</button>' +
            '<div class="bet-val"><label>Sázka</label><b class="c-bet">' + fmt(this.bet()) + '</b></div>' +
            '<button class="bet-up">+</button></div>' +
            '<div class="ctrl-cell ctrl-win"><label>Úlovek</label><b class="c-win">—</b></div>' +
            '<button class="cast-btn">NAHODIT 🎣</button>';
        this.betEl = c.querySelector('.c-bet'); this.winEl = c.querySelector('.c-win');
        c.querySelector('.bet-dn').onclick = function () { self.changeBet(-1); };
        c.querySelector('.bet-up').onclick = function () { self.changeBet(1); };
        this.castBtn = c.querySelector('.cast-btn');
        this.castBtn.onclick = function () { Casino.Sound.unlock(); self.cast(); };
    };

    Fishing.prototype.changeBet = function (d) {
        if (this.busy) return;
        var n = this.betIndex + d; if (n < 0 || n >= BETS.length) return;
        this.betIndex = n; Casino.Sound.click(); this.betEl.textContent = fmt(this.bet());
    };

    Fishing.prototype.cast = function () {
        if (this.busy) return;
        var bet = this.bet();
        if (!Casino.Account.debit(bet)) { Casino.UI.toast('Nedostatek kreditu!', ''); if (this.opts.onBroke) this.opts.onBroke(); return; }
        this.busy = true; this.castBtn.disabled = true; this.castBtn.classList.add('busy');
        this.reveal.classList.add('hidden');
        this.winEl.textContent = '…';
        var outcome = util.weightedPick(OUTCOMES);
        var self = this;
        Casino.Sound.spin();

        // hák dolů
        this.line.classList.add('cast-down');
        this.after(750, function () {
            // zachyť
            self.hookFish.textContent = outcome.icon;
            self.line.classList.add('tug'); Casino.Sound.reelStop(2);
            self.after(350, function () {
                self.line.classList.remove('tug');
                // navíjení nahoru
                self.line.classList.remove('cast-down');
                self.after(700, function () {
                    self.hookFish.textContent = '';
                    self.finish(outcome, bet);
                });
            });
        });
    };

    Fishing.prototype.finish = function (outcome, bet) {
        var win = Math.round(bet * outcome.mult);
        if (win > 0) Casino.Account.credit(win);
        Casino.Account.recordSpin('fishing', bet, win);
        var net = win - bet;
        this.winEl.textContent = win > 0 ? '+' + fmt(win) : '0';
        this.winEl.style.color = win > 0 ? 'var(--green)' : 'var(--red)';

        var big = outcome.mult >= 10;
        this.reveal.className = 'catch-reveal' + (big ? ' big' : '') + (outcome.mult === 0 ? ' junk' : '');
        this.reveal.innerHTML =
            '<div class="cr-ico">' + outcome.icon + '</div>' +
            '<div class="cr-name">' + outcome.name + '</div>' +
            (outcome.mult > 0
                ? '<div class="cr-mult">×' + outcome.mult + '</div><div class="cr-win">+' + fmt(win) + '</div>'
                : '<div class="cr-mult">Smůla! Jen smetí.</div>');
        if (outcome.mult >= 25) { Casino.Sound.bigWinFanfare(); }
        else if (outcome.mult >= 3) Casino.Sound.win(2);
        else if (outcome.mult > 0) Casino.Sound.win(0);
        else Casino.Sound.lose();

        var self = this;
        this.after(150, function () { self.busy = false; self.castBtn.disabled = false; self.castBtn.classList.remove('busy'); });
    };

    Fishing.prototype.info = function () {
        var rows = OUTCOMES.filter(function (o) { return o.mult > 0; }).sort(function (a, b) { return b.mult - a.mult; })
            .map(function (o) { return '<div class="pt-card"><div class="pt-ico">' + o.icon + '</div><div class="pt-info"><b>' + o.name + '</b><div class="pt-pays">×' + o.mult + '</div></div></div>'; }).join('');
        Casino.UI.modal({
            title: '🎣 Velký úlovek — výplaty',
            body: '<p style="color:var(--muted);line-height:1.6">Nahoď udici a navíjej. Co chytíš, to máš: výhra = sázka × násobič ryby. ' +
                'Občas se chytí jen stará bota nebo řasa (prohra). Pozor na žraloka, velrybu a truhlu pokladů (×100)! RTP ≈ 96 %.</p>' +
                '<div class="pt-grid" style="margin-top:12px">' + rows + '</div>'
        });
    };

    Fishing.prototype.destroy = function () { this.destroyed = true; this.timers.forEach(clearTimeout); };

    Casino.registry.push({
        id: 'fishing', name: 'Velký úlovek', emoji: '🎣', category: 'arcade',
        tagline: 'Nahoď udici a chyť velký úlovek',
        theme: { a: '#27d3c4', b: '#1a73ff', bg: 'linear-gradient(180deg, #0a2a45, #062033)' },
        badges: ['RTP ~96%', 'Arkáda'], meta: 'Chytni rybu · poklad až 100×',
        open: function (mount, opts) { return Casino.Fishing.open(mount, opts); }
    });

})(typeof window !== 'undefined' ? window : global);
