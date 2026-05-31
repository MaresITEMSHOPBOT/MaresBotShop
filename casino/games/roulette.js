/* ==========================================================================
   MARES CASINO – Evropská ruleta (jedno zero). Sázecí stůl + kolo + dealer.
   Výplaty: plné číslo 35:1, tucty/sloupce 2:1, jednoduché šance 1:1.
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    var fmt = Casino.util.fmt;
    function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }

    var WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
    var RED = { 1: 1, 3: 1, 5: 1, 7: 1, 9: 1, 12: 1, 14: 1, 16: 1, 18: 1, 19: 1, 21: 1, 23: 1, 25: 1, 27: 1, 30: 1, 32: 1, 34: 1, 36: 1 };
    var CHIPS = [10, 50, 100, 500];
    function isRed(n) { return !!RED[n]; }
    function colorOf(n) { return n === 0 ? 'green' : (isRed(n) ? 'red' : 'black'); }

    var TALK = {
        place: ['Sázky, prosím!', 'Vsaďte si, dámy a pánové.', 'Kam dnes vsadíte?'],
        spin: ['Roztáčím kolečko… nic už nepřijímám!', 'Kulička letí!', 'A je to v pohybu!'],
        winBig: ['Gratuluji, pěkná výhra!', 'To je terno!', 'Dnes vám to sype!'],
        winSmall: ['Výhra! Dobrá volba.', 'Trefa!', 'Sedlo to.'],
        lose: ['Smůla, příště to vyjde.', 'Tentokrát nic, zkuste to znovu.', 'Dům bere. Hlavu vzhůru!']
    };
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

    Casino.Roulette = { open: function (mount, opts) { return new Roulette(mount, opts); } };

    function Roulette(mount, opts) {
        this.opts = opts || {};
        this.chip = 50;
        this.bets = {}; this.total = 0; this.lastBets = null;
        this.rot = 0; this.spinning = false; this.destroyed = false;
        this.history = [];
        this.build(mount);
    }

    Roulette.prototype.build = function (mount) {
        var self = this;
        var theme = { a: '#27c46b', b: '#ffd24a', bg: 'radial-gradient(circle at 50% 0%, #0c3a23, #04140c)' };
        var f = Casino.UI.gameFrame(mount, {
            emoji: '🎡', name: 'Ruleta', subtitle: 'Evropská ruleta s živým dealerem',
            theme: theme, bg: theme.bg, onExit: function () { Casino.Dealer.stop(); self.opts.onExit && self.opts.onExit(); },
            onInfo: function () { self.info(); }
        });
        this.frame = f;

        // dealer + výsledky
        var topRow = el('div', 'roul-top');
        topRow.innerHTML = '<div class="dealer"><div class="dealer-av">🤵</div><div class="speech hidden"></div></div><div class="roul-hist"></div>';
        f.stage.appendChild(topRow);
        this.speech = topRow.querySelector('.speech');
        this.histEl = topRow.querySelector('.roul-hist');

        // kolo
        var wheelWrap = el('div', 'wheel-wrap');
        this.canvas = el('canvas'); this.WS = 260;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = this.WS * dpr; this.canvas.height = this.WS * dpr;
        this.canvas.style.width = this.WS + 'px'; this.canvas.style.height = this.WS + 'px';
        this.ctx = this.canvas.getContext('2d'); this.ctx.scale(dpr, dpr);
        wheelWrap.appendChild(this.canvas);
        wheelWrap.innerHTML += '<div class="wheel-pointer">▼</div>';
        wheelWrap.insertBefore(this.canvas, wheelWrap.firstChild);
        f.stage.appendChild(wheelWrap);
        this.drawWheel(0);

        // sázecí stůl
        this.board = el('div', 'roul-board');
        this.buildBoard();
        f.stage.appendChild(this.board);

        // výběr žetonu
        var chips = el('div', 'chip-row');
        CHIPS.forEach(function (v) {
            var b = el('button', 'chip chip-' + v + (v === self.chip ? ' on' : ''), fmt(v));
            b.onclick = function () { Casino.Sound.click(); self.chip = v; chips.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); };
            chips.appendChild(b);
        });
        f.stage.appendChild(chips);

        // ovládání
        var c = f.controls;
        c.innerHTML =
            '<div class="ctrl-cell"><label>Vsazeno</label><b class="c-total">0</b></div>' +
            '<button class="btn-secondary clear-btn">🗑 Smazat</button>' +
            '<button class="btn-secondary rebet-btn">↺ Opakovat</button>' +
            '<button class="spin-roul">ROZTOČIT 🎡</button>';
        this.totalEl = c.querySelector('.c-total');
        c.querySelector('.clear-btn').onclick = function () { self.clearBets(); };
        c.querySelector('.rebet-btn').onclick = function () { self.rebet(); };
        c.querySelector('.spin-roul').onclick = function () { Casino.Sound.unlock(); self.spin(); };
        this.spinBtn = c.querySelector('.spin-roul');

        Casino.Dealer.say(this.speech, pick(TALK.place));
    };

    Roulette.prototype.cell = function (key, label, cls, gc, gr) {
        var self = this;
        var d = el('div', 'rb-cell ' + (cls || ''), '<span class="rb-label">' + label + '</span><span class="rb-chip"></span>');
        d.style.gridColumn = gc; d.style.gridRow = gr;
        d.dataset.key = key;
        d.onclick = function () { self.placeBet(key, d); };
        this.board.appendChild(d);
        return d;
    };

    Roulette.prototype.buildBoard = function () {
        this.board.innerHTML = '';
        this.cell('straight:0', '0', 'num green', '1', '1 / span 3');
        for (var j = 0; j < 12; j++) {
            for (var r = 0; r < 3; r++) {
                var n = 3 * (j + 1) - r; // r0=top(3..36), r1(2..35), r2(1..34)
                this.cell('straight:' + n, '' + n, 'num ' + colorOf(n), (j + 2) + '', (r + 1) + '');
            }
        }
        // sloupce 2:1 (vpravo)
        this.cell('col:3', '2:1', 'side', '14', '1');
        this.cell('col:2', '2:1', 'side', '14', '2');
        this.cell('col:1', '2:1', 'side', '14', '3');
        // tucty
        this.cell('dozen:1', '1. tucet', 'side', '2 / span 4', '4');
        this.cell('dozen:2', '2. tucet', 'side', '6 / span 4', '4');
        this.cell('dozen:3', '3. tucet', 'side', '10 / span 4', '4');
        // jednoduché šance
        this.cell('low', '1–18', 'side', '2 / span 2', '5');
        this.cell('even', 'Sudá', 'side', '4 / span 2', '5');
        this.cell('red', '◆', 'side red', '6 / span 2', '5');
        this.cell('black', '◆', 'side black', '8 / span 2', '5');
        this.cell('odd', 'Lichá', 'side', '10 / span 2', '5');
        this.cell('high', '19–36', 'side', '12 / span 2', '5');
    };

    Roulette.prototype.placeBet = function (key, cellEl) {
        if (this.spinning) return;
        if (!Casino.Account.debit(this.chip)) { Casino.UI.toast('Nedostatek kreditu!', ''); if (this.opts.onBroke) this.opts.onBroke(); return; }
        this.bets[key] = (this.bets[key] || 0) + this.chip;
        this.total += this.chip;
        Casino.Sound.click();
        this.refreshChips(); this.totalEl.textContent = fmt(this.total);
    };

    Roulette.prototype.refreshChips = function () {
        var bets = this.bets;
        this.board.querySelectorAll('.rb-cell').forEach(function (d) {
            var v = bets[d.dataset.key] || 0;
            var chip = d.querySelector('.rb-chip');
            if (v) { chip.textContent = fmt(v); chip.classList.add('on'); }
            else { chip.textContent = ''; chip.classList.remove('on'); }
        });
    };

    Roulette.prototype.clearBets = function () {
        if (this.spinning || !this.total) return;
        Casino.Account.credit(this.total);
        this.bets = {}; this.total = 0;
        Casino.Sound.click(); this.refreshChips(); this.totalEl.textContent = '0';
    };

    Roulette.prototype.rebet = function () {
        if (this.spinning || !this.lastBets) return;
        var sum = 0; for (var k in this.lastBets) sum += this.lastBets[k];
        if (Casino.Account.getBalance() < sum) { Casino.UI.toast('Nedostatek kreditu na opakování.', ''); return; }
        Casino.Account.debit(sum);
        for (var k2 in this.lastBets) this.bets[k2] = (this.bets[k2] || 0) + this.lastBets[k2];
        this.total += sum; Casino.Sound.click();
        this.refreshChips(); this.totalEl.textContent = fmt(this.total);
    };

    Roulette.prototype.wins = function (key, n) {
        var t = key.split(':'); var kind = t[0];
        switch (kind) {
            case 'straight': return +t[1] === n;
            case 'red': return isRed(n); case 'black': return n !== 0 && !isRed(n);
            case 'even': return n !== 0 && n % 2 === 0; case 'odd': return n % 2 === 1;
            case 'low': return n >= 1 && n <= 18; case 'high': return n >= 19 && n <= 36;
            case 'dozen': { var d = +t[1]; return n >= (d - 1) * 12 + 1 && n <= d * 12; }
            case 'col': { var c = +t[1]; return n !== 0 && ((n - 1) % 3) === (c - 1); }
        }
        return false;
    };
    function odds(key) {
        var kind = key.split(':')[0];
        if (kind === 'straight') return 35;
        if (kind === 'dozen' || kind === 'col') return 2;
        return 1;
    }

    Roulette.prototype.spin = function () {
        var self = this;
        if (this.spinning) return;
        if (!this.total) { Casino.UI.toast('Nejdřív vsaď žetony na stůl.', ''); return; }
        this.spinning = true; this.spinBtn.disabled = true;
        this.lastBets = JSON.parse(JSON.stringify(this.bets));
        Casino.Dealer.say(this.speech, pick(TALK.spin));
        Casino.Sound.spin();

        var result = Math.floor(Math.random() * 37);
        var idx = WHEEL.indexOf(result);
        var seg = (Math.PI * 2) / 37;
        // cílová rotace: střed segmentu idx nahoru (-PI/2), + několik otáček
        var target = (-Math.PI / 2) - idx * seg;
        var turns = 5 + Math.floor(Math.random() * 2);
        var start = this.rot;
        // normalizuj tak, aby šel vždy dopředu
        var end = target - turns * Math.PI * 2;
        while (end > start) end -= Math.PI * 2;
        var dur = 4200, t0 = performance.now(), last = 0;
        function frame(now) {
            if (self.destroyed) return;
            var p = Math.min(1, (now - t0) / dur);
            var e = 1 - Math.pow(1 - p, 3);
            self.rot = start + (end - start) * e;
            var Rb = self.WS / 2 - 4;
            // kulička obíhá opačně a spirálovitě zapadá ke kapse nahoře (kde končí výsledek)
            self._ball = { a: -Math.PI / 2 - (1 - e) * (7 * Math.PI), r: (self.WS / 2 - 8) - ((self.WS / 2 - 8) - Rb * 0.74) * e };
            self.drawWheel(self.rot);
            if (now - last > 90 && p < 0.92) { Casino.Sound.tick(); last = now; }
            if (p < 1) requestAnimationFrame(frame);
            else self.resolve(result);
        }
        requestAnimationFrame(frame);
    };

    Roulette.prototype.resolve = function (n) {
        var self = this;
        var totalReturn = 0, anyWin = false;
        for (var key in this.bets) {
            var stake = this.bets[key];
            if (this.wins(key, n)) { totalReturn += stake * (odds(key) + 1); anyWin = true; }
        }
        if (totalReturn > 0) Casino.Account.credit(totalReturn);
        Casino.Account.recordSpin('roulette', this.total, totalReturn);

        this.history.unshift(n); this.history = this.history.slice(0, 14); this.renderHist();
        var net = totalReturn - this.total;
        var col = colorOf(n);
        var colCs = col === 'red' ? 'červená' : col === 'black' ? 'černá' : 'zelená';
        var phrase = n + ', ' + colCs + '. ';
        if (anyWin && net > 0) { phrase += pick(net >= this.total * 3 ? TALK.winBig : TALK.winSmall); Casino.Sound.win(net >= this.total * 3 ? 3 : 2); }
        else { phrase += pick(TALK.lose); Casino.Sound.lose(); }
        Casino.Dealer.say(this.speech, phrase);
        Casino.UI.toast('Padlo ' + n + ' (' + colCs + ') · ' + (net >= 0 ? '+' : '') + fmt(net), net >= 0 ? 'good' : '');

        // vyřeš žetony
        this.bets = {}; this.total = 0; this.refreshChips(); this.totalEl.textContent = '0';
        this.spinning = false; this.spinBtn.disabled = false;
    };

    Roulette.prototype.renderHist = function () {
        this.histEl.innerHTML = this.history.map(function (n) {
            return '<span class="rh ' + colorOf(n) + '">' + n + '</span>';
        }).join('');
    };

    Roulette.prototype.drawWheel = function (rot) {
        var ctx = this.ctx, S = this.WS, cx = S / 2, cy = S / 2, R = S / 2 - 4;
        var seg = (Math.PI * 2) / 37;
        ctx.clearRect(0, 0, S, S);
        for (var i = 0; i < 37; i++) {
            var n = WHEEL[i];
            var a0 = rot + i * seg - seg / 2, a1 = a0 + seg;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath();
            ctx.fillStyle = n === 0 ? '#1ea65a' : (isRed(n) ? '#d4213d' : '#1c1c24');
            ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.stroke();
            // číslo
            var am = a0 + seg / 2;
            ctx.save(); ctx.translate(cx + Math.cos(am) * (R - 13), cy + Math.sin(am) * (R - 13));
            ctx.rotate(am + Math.PI / 2);
            ctx.fillStyle = '#fff'; ctx.font = '700 9px Segoe UI, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('' + n, 0, 0); ctx.restore();
        }
        // střed
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.45, 0, 7); ctx.fillStyle = '#2a1a08'; ctx.fill();
        ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#ffd24a'; ctx.font = '700 14px Segoe UI'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🎡', cx, cy);
        // kulička
        if (this._ball) {
            var bx = cx + Math.cos(this._ball.a) * this._ball.r, by = cy + Math.sin(this._ball.a) * this._ball.r;
            ctx.beginPath(); ctx.arc(bx, by, 5, 0, 7); ctx.fillStyle = '#fff';
            ctx.shadowColor = '#fff'; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
        }
    };

    Roulette.prototype.info = function () {
        Casino.UI.modal({
            title: '🎡 Ruleta — výplaty',
            body: '<p style="color:var(--muted);line-height:1.7">Evropská ruleta (čísla 0–36, jedno zelené zero).</p>' +
                '<ul style="color:var(--muted);line-height:1.8;margin-left:18px">' +
                '<li><b>Plné číslo</b> (klik na číslo): 35:1</li>' +
                '<li><b>Tucet / Sloupec</b> (2:1)</li>' +
                '<li><b>Červená/Černá, Sudá/Lichá, 1–18/19–36</b>: 1:1</li></ul>' +
                '<p style="color:var(--muted);margin-top:10px">Vyber hodnotu žetonu, klikáním přidávej sázky na stůl, pak roztoč. RTP ≈ 97,3 %.</p>'
        });
    };

    Roulette.prototype.destroy = function () { this.destroyed = true; Casino.Dealer.stop(); };

    Casino.registry.push({
        id: 'roulette', name: 'Ruleta', emoji: '🎡', category: 'table',
        tagline: 'Vsaď na číslo nebo barvu a roztoč kolo',
        theme: { a: '#27c46b', b: '#ffd24a', bg: 'radial-gradient(circle at 50% 0%, #0c3a23, #04140c)' },
        badges: ['RTP 97.3%', 'Stolní'], meta: 'Evropská · živý dealer',
        open: function (mount, opts) { return Casino.Roulette.open(mount, opts); }
    });

})(typeof window !== 'undefined' ? window : global);
