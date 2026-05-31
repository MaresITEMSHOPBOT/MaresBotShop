/* ==========================================================================
   MARES CASINO – herní automat (vykreslení + animace + herní smyčka)
   Používá čistý Casino.Engine pro logiku, Casino.Account pro kredit,
   Casino.Sound pro zvuky. Žádné externí závislosti.
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    var Engine = Casino.Engine, util = Casino.util, fmt = util.fmt;

    /* ----- časování ----- */
    var T = {
        spin: 900, stagger: 165, fillers: 16, trail: 4,
        turboSpin: 360, turboStagger: 60,
        fsDelay: 720, fsTurbo: 300,
        cascade: 560, cascadeTurbo: 240
    };

    /* ----- drobné DOM helpery ----- */
    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html != null) e.innerHTML = html;
        return e;
    }
    function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    function winLevel(win, bet) {
        if (bet <= 0) return win > 0 ? 1 : -1;
        var x = win / bet;
        if (x >= 25) return 3;
        if (x >= 10) return 2;
        if (x >= 3) return 1;
        if (x > 0) return 0;
        return -1;
    }

    // počítadlo s tikáním
    function countUp(node, from, to, dur, tickEnd) {
        from = from || 0;
        var start = performance.now(), lastTick = 0;
        return new Promise(function (resolve) {
            function frame(now) {
                var p = Math.min(1, (now - start) / dur);
                var e = 1 - Math.pow(1 - p, 3);
                var v = from + (to - from) * e;
                node.textContent = fmt(v);
                if (now - lastTick > 55 && p < 1) { Casino.Sound.tick(); lastTick = now; }
                if (p < 1) requestAnimationFrame(frame);
                else { node.textContent = fmt(to); if (tickEnd) tickEnd(); resolve(); }
            }
            requestAnimationFrame(frame);
        });
    }

    // buňka se symbolem
    function cellEl(game, data) {
        var sym = Engine.symById(game, data.id);
        var c = el('div', 'cell');
        var s = sym;
        c.classList.add('sym-' + data.id);
        if (s.wild) c.classList.add('is-wild');
        if (s.scatter) c.classList.add('is-scatter');
        if (s.orb || data.m) c.classList.add('is-orb');
        var icon = el('span', 'sym', s.icon);
        c.appendChild(icon);
        if (data.wm) { var b = el('span', 'wm-badge', 'x' + data.wm); c.appendChild(b); }
        if (data.m) { var o = el('span', 'orb-badge', 'x' + data.m); c.appendChild(o); }
        if (data.mv) { c.classList.add('is-money'); var mvb = el('span', 'money-badge', data.mv + '×'); c.appendChild(mvb); }
        return c;
    }

    /* ======================================================================
       Factory
       ===================================================================== */
    Casino.Slot = {
        open: function (game, mount, opts) {
            opts = opts || {};
            var inst = new Machine(game, mount, opts);
            inst.build();
            return inst;
        }
    };

    function Machine(game, mount, opts) {
        this.game = game;
        this.mount = mount;
        this.opts = opts;
        this.betIndex = Math.min(2, game.bets.length - 1);
        this.turbo = false;
        this.spinning = false;
        this.auto = 0;            // zbývající autospiny (-1 = nekonečno)
        this.fsMode = false;
        this.reels = [];
        this._onBalance = null;
        this._destroyed = false;
    }

    Machine.prototype.bet = function () { return this.game.bets[this.betIndex]; };

    Machine.prototype.build = function () {
        var self = this, game = this.game, th = game.theme;
        var root = el('div', 'machine');
        root.dataset.type = game.type;
        root.style.setProperty('--accent', th.a);
        root.style.setProperty('--accent2', th.b);

        // horní lišta
        var top = el('div', 'machine-top');
        var back = el('button', 'btn-ghost', '← Lobby');
        back.onclick = function () { Casino.Sound.click(); self.destroy(); if (self.opts.onExit) self.opts.onExit(); };
        var title = el('div', 'machine-title',
            '<span class="m-emoji">' + game.emoji + '</span>' +
            '<span><b>' + game.name + '</b><small>RTP ' + game.rtp + '% · Volatilita: ' + game.volatility + '</small></span>');
        var ptBtn = el('button', 'btn-ghost', '📜 Výplaty');
        ptBtn.onclick = function () { Casino.Sound.click(); self.showPaytable(); };
        top.appendChild(back); top.appendChild(title); top.appendChild(ptBtn);

        // scéna
        var stage = el('div', 'machine-stage');
        stage.style.background = th.bg;
        var fsBanner = el('div', 'fs-banner hidden');
        var reelsWrap = el('div', 'reels-wrap');
        var reels = el('div', 'reels');
        reels.style.setProperty('--rows', game.rows);
        reels.style.setProperty('--reels', game.reels);
        if (game.type === 'tumble') reels.classList.add('tumble-grid');
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'paylines-svg');
        var winOverlay = el('div', 'bigwin-overlay hidden');
        reelsWrap.appendChild(reels); reelsWrap.appendChild(svg); reelsWrap.appendChild(winOverlay);
        stage.appendChild(fsBanner); stage.appendChild(reelsWrap);

        // ovládání
        var controls = el('div', 'machine-controls');
        controls.innerHTML =
            '<div class="ctrl-cell ctrl-balance"><label>Kredit</label><b class="c-balance">' + fmt(Casino.Account.getBalance()) + '</b></div>' +
            '<div class="ctrl-cell ctrl-bet">' +
            '<button class="bet-dn" title="Snížit sázku">−</button>' +
            '<div class="bet-val"><label>Sázka</label><b class="c-bet">' + fmt(this.bet()) + '</b></div>' +
            '<button class="bet-up" title="Zvýšit sázku">+</button>' +
            '<button class="bet-max" title="Maximální sázka">MAX</button>' +
            '</div>' +
            '<div class="ctrl-cell ctrl-win"><label>Výhra</label><b class="c-win">0</b></div>' +
            '<button class="spin-btn"><span>SPIN</span></button>' +
            '<div class="ctrl-extra">' +
            '<button class="auto-btn" title="Automatické hraní">AUTO</button>' +
            '<button class="turbo-btn" title="Rychlé točení">⚡</button>' +
            '<button class="sound-btn" title="Zvuk">' + (Casino.Account.isSoundOn() ? '🔊' : '🔇') + '</button>' +
            '</div>';

        var msg = el('div', 'machine-msg');

        root.appendChild(top); root.appendChild(stage); root.appendChild(controls); root.appendChild(msg);
        this.mount.innerHTML = '';
        this.mount.appendChild(root);

        // refs
        this.root = root; this.reelsEl = reels; this.svg = svg; this.stage = stage;
        this.fsBanner = fsBanner; this.winOverlay = winOverlay; this.msgEl = msg;
        this.balEl = controls.querySelector('.c-balance');
        this.betEl = controls.querySelector('.c-bet');
        this.winEl = controls.querySelector('.c-win');
        this.spinBtn = controls.querySelector('.spin-btn');
        this.autoBtn = controls.querySelector('.auto-btn');

        // události
        controls.querySelector('.bet-dn').onclick = function () { self.changeBet(-1); };
        controls.querySelector('.bet-up').onclick = function () { self.changeBet(1); };
        controls.querySelector('.bet-max').onclick = function () { Casino.Sound.click(); self.betIndex = game.bets.length - 1; self.updateBet(); };
        this.spinBtn.onclick = function () { self.onSpinClick(); };
        this.autoBtn.onclick = function () { self.toggleAuto(); };
        controls.querySelector('.turbo-btn').onclick = function (e) {
            self.turbo = !self.turbo; e.currentTarget.classList.toggle('on', self.turbo); Casino.Sound.toggle();
        };
        controls.querySelector('.sound-btn').onclick = function (e) {
            var on = !Casino.Account.isSoundOn(); Casino.Account.setSound(on);
            e.currentTarget.textContent = on ? '🔊' : '🔇'; if (on) Casino.Sound.toggle();
        };

        // lišta funkcí: Ante Bet (vyšší šance) + Koupit bonus
        if ((game.freeSpins && game.freeSpins.buyCost) || (game.holdwin && game.holdwin.buyCost) || game.ante) {
            var fb = el('div', 'feature-bar');
            if (game.ante) {
                var anteBtn = el('button', 'feat-btn ante-btn', '⚡ Vyšší šance +' + Math.round((game.ante.mult - 1) * 100) + '%');
                anteBtn.onclick = function () {
                    if (self.spinning || self.fsMode) return;
                    self.ante = !self.ante; anteBtn.classList.toggle('on', self.ante); Casino.Sound.click(); self.updateBet();
                };
                fb.appendChild(anteBtn); this.anteBtn = anteBtn;
            }
            if ((game.freeSpins && game.freeSpins.buyCost) || (game.holdwin && game.holdwin.buyCost)) {
                var buyBtn = el('button', 'feat-btn buy-btn', '');
                buyBtn.onclick = function () { Casino.Sound.unlock(); self.buyBonus(); };
                fb.appendChild(buyBtn); this.buyBtn = buyBtn;
            }
            root.insertBefore(fb, controls);
            this.updateFeatureBar();
        }

        // klávesa mezerník = spin
        this._key = function (e) {
            if (e.code === 'Space' && !self.spinning && !self.fsMode) { e.preventDefault(); self.onSpinClick(); }
        };
        document.addEventListener('keydown', this._key);

        // aktualizace kreditu z busu
        this._onBalance = function (b) { if (self.balEl) self.balEl.textContent = fmt(b); };
        Casino.bus.on('balance', this._onBalance);

        // úvodní (klidové) vykreslení
        if (game.type === 'tumble') this.renderTumble(Engine.generateTumbleGrid(game), null);
        else this.idleLines();

        this.message('Hodně štěstí! Zatoč si tlačítkem SPIN.');
    };

    Machine.prototype.destroy = function () {
        this._destroyed = true;
        this.auto = 0;
        document.removeEventListener('keydown', this._key);
        // odhlásíme náš balance listener
        if (Casino.bus._h.balance) {
            var i = Casino.bus._h.balance.indexOf(this._onBalance);
            if (i >= 0) Casino.bus._h.balance.splice(i, 1);
        }
    };

    Machine.prototype.message = function (txt) { if (this.msgEl) this.msgEl.textContent = txt; };

    // skutečná velikost buňky se měří z reálného válce (clamp() nejde z getComputedStyle)
    Machine.prototype.cellPx = function () {
        if (this.reels[0] && this.reels[0].el) {
            var w = this.reels[0].el.getBoundingClientRect().width;
            if (w) return w;
        }
        var v = parseFloat(getComputedStyle(this.reelsEl).getPropertyValue('--cell'));
        return v || 84;
    };

    Machine.prototype.changeBet = function (dir) {
        if (this.spinning || this.fsMode) return;
        var n = this.betIndex + dir;
        if (n < 0 || n >= this.game.bets.length) return;
        this.betIndex = n; Casino.Sound.click(); this.updateBet();
    };
    Machine.prototype.updateBet = function () {
        this.betEl.textContent = fmt(this.bet());
        this.updateFeatureBar();
    };
    Machine.prototype.updateFeatureBar = function () {
        if (this.buyBtn) this.buyBtn.textContent = '🛒 Koupit bonus (' + fmt(this.bet() * (this.game.holdwin || this.game.freeSpins).buyCost) + ')';
        if (this.anteBtn) this.anteBtn.classList.toggle('on', !!this.ante);
        // ukaž efektivní sázku při Ante
        if (this.betEl) this.betEl.textContent = this.ante && this.game.ante ? fmt(this.effectiveBet()) : fmt(this.bet());
    };

    /* ---------------- LINIOVÉ HRY ---------------- */
    Machine.prototype.buildStrip = function (reelObj, targetCol, fillers) {
        var game = this.game, strip = reelObj.strip;
        strip.innerHTML = '';
        strip.style.transition = 'none';
        strip.style.transform = 'translateY(0)';
        for (var i = 0; i < fillers; i++) {
            strip.appendChild(cellEl(game, { id: util.weightedPick(game.symbols).id }));
        }
        reelObj.targetEls = [];
        for (var y = 0; y < targetCol.length; y++) {
            var ce = cellEl(game, targetCol[y]);
            reelObj.targetEls.push(ce);
            strip.appendChild(ce);
        }
        // koncové výplně, aby přesah (overshoot) neodhalil prázdné místo
        for (var t = 0; t < T.trail; t++) {
            strip.appendChild(cellEl(game, { id: util.weightedPick(game.symbols).id }));
        }
        reelObj.fillers = fillers;
    };

    Machine.prototype.idleLines = function () {
        var game = this.game;
        this.reelsEl.innerHTML = '';
        this.reels = [];
        // 1) nejdřív vytvoř DOM válců (aby se rozměr buňky vyřešil z CSS)
        for (var r = 0; r < game.reels; r++) {
            var reelEl = el('div', 'reel');
            var strip = el('div', 'strip');
            reelEl.appendChild(strip);
            this.reelsEl.appendChild(reelEl);
            this.reels.push({ el: reelEl, strip: strip });
        }
        // 2) změř a naplň
        var cell = this.cellPx();
        for (var i = 0; i < this.reels.length; i++) {
            var col = [];
            for (var y = 0; y < game.rows; y++) col.push({ id: util.weightedPick(game.symbols).id });
            this.buildStrip(this.reels[i], col, T.fillers);
            this.reels[i].strip.style.transform = 'translateY(' + (-(T.fillers * cell)) + 'px)';
        }
    };

    Machine.prototype.spinReel = function (reelObj, targetCol, idx, dur, stg) {
        var self = this, cell = this.cellPx();
        var K = T.fillers;
        this.buildStrip(reelObj, targetCol, K);
        reelObj.el.offsetHeight; // reflow
        reelObj.strip.classList.add('blur');
        var landing = -(K * cell);
        var overshoot = cell * 0.55;
        return new Promise(function (resolve) {
            setTimeout(function () {
                reelObj.strip.style.transition = 'transform ' + dur + 'ms cubic-bezier(.18,.66,.2,1)';
                reelObj.strip.style.transform = 'translateY(' + (landing - overshoot) + 'px)';
            }, idx * stg);
            setTimeout(function () {
                reelObj.strip.classList.remove('blur');
                reelObj.strip.style.transition = 'transform 150ms cubic-bezier(.3,1.4,.5,1)';
                reelObj.strip.style.transform = 'translateY(' + landing + 'px)';
                Casino.Sound.reelStop(idx);
                reelObj.el.classList.add('reel-bounce');
                setTimeout(function () { reelObj.el.classList.remove('reel-bounce'); resolve(); }, 160);
            }, idx * stg + dur);
        });
    };

    Machine.prototype.spinLines = function (grid, fsOpts) {
        var self = this, game = this.game;
        var dur = this.turbo ? T.turboSpin : T.spin;
        var stg = this.turbo ? T.turboStagger : T.stagger;
        var proms = [];
        for (var r = 0; r < game.reels; r++) {
            proms.push(this.spinReel(this.reels[r], grid[r], r, dur, stg));
        }
        return Promise.all(proms);
    };

    Machine.prototype.highlightLines = function (game, result, betPerLine) {
        var self = this;
        // zvýrazni buňky
        result.wins.forEach(function (w) {
            w.cells.forEach(function (rc) {
                var reelObj = self.reels[rc[0]];
                var winEl = reelObj.targetEls[rc[1]];
                if (winEl) winEl.classList.add('win');
            });
        });
        // scatter buňky
        (result.scatterCells || []).forEach(function (rc) {
            var reelObj = self.reels[rc[0]];
            var winEl = reelObj.targetEls[rc[1]];
            if (winEl) winEl.classList.add('win', 'scatter-win');
        });
        // nakresli výherní linie
        this.drawPaylines(result);
    };

    Machine.prototype.drawPaylines = function (result) {
        var svg = this.svg, game = this.game;
        svg.innerHTML = '';
        var lineWins = result.wins.filter(function (w) { return w.type === 'line'; });
        if (!lineWins.length) return;
        var wrapRect = this.reelsEl.getBoundingClientRect();
        svg.setAttribute('viewBox', '0 0 ' + wrapRect.width + ' ' + wrapRect.height);
        var colors = ['#ffd24a', '#00e5ff', '#ff5db1', '#7CFF6B', '#ff8a3d', '#b48bff'];
        lineWins.forEach(function (w, i) {
            var line = game.paylines[w.line];
            var pts = [];
            for (var r = 0; r < w.count; r++) {
                var reelObj = this.reels[r];
                var ce = reelObj.targetEls[line[r]];
                if (!ce) continue;
                var rc = ce.getBoundingClientRect();
                pts.push(((rc.left + rc.right) / 2 - wrapRect.left) + ',' + ((rc.top + rc.bottom) / 2 - wrapRect.top));
            }
            if (pts.length < 2) return;
            var pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            pl.setAttribute('points', pts.join(' '));
            pl.setAttribute('fill', 'none');
            pl.setAttribute('stroke', colors[i % colors.length]);
            pl.setAttribute('stroke-width', '4');
            pl.setAttribute('stroke-linejoin', 'round');
            pl.setAttribute('stroke-linecap', 'round');
            pl.setAttribute('class', 'payline-draw');
            pl.setAttribute('opacity', '0.9');
            svg.appendChild(pl);
        }, this);
    };

    Machine.prototype.clearWins = function () {
        this.svg.innerHTML = '';
        this.reels.forEach(function (r) {
            (r.targetEls || []).forEach(function (c) { c.classList.remove('win', 'scatter-win'); });
        });
        if (this.reelsEl.classList.contains('tumble-grid')) {
            Array.prototype.forEach.call(this.reelsEl.querySelectorAll('.cell.win'), function (c) { c.classList.remove('win'); });
        }
    };

    /* ---------------- TUMBLE HRA ---------------- */
    Machine.prototype.renderTumble = function (grid, winCells, animate) {
        var game = this.game;
        this.reelsEl.innerHTML = '';
        var winSet = {};
        (winCells || []).forEach(function (c) { winSet[c[0] + ':' + c[1]] = true; });
        // CSS grid: sloupce = reels, řádky = rows; iterujeme po řádcích
        for (var y = 0; y < game.rows; y++) {
            for (var r = 0; r < game.reels; r++) {
                var data = grid[r][y];
                var c = cellEl(game, data);
                if (winSet[r + ':' + y]) c.classList.add('win');
                if (animate) {
                    c.classList.add('drop');
                    c.style.animationDelay = (r * 25 + y * 12) + 'ms';
                }
                this.reelsEl.appendChild(c);
            }
        }
    };

    Machine.prototype.runTumble = function (result) {
        var self = this, game = this.game;
        var casc = this.turbo ? T.cascadeTurbo : T.cascade;
        var steps = result.steps;
        var running = 0;
        var seq = Promise.resolve();
        steps.forEach(function (step, i) {
            seq = seq.then(function () {
                self.renderTumble(step.grid, step.winCells, true);
                return delay(self.turbo ? 130 : 230);
            }).then(function () {
                if (step.winCells && step.winCells.length) {
                    Casino.Sound.cascade(i);
                    running += step.stepWin;
                    self.winEl.textContent = fmt(running);
                    self.winEl.parentNode.classList.add('flash');
                    return delay(casc).then(function () { self.winEl.parentNode.classList.remove('flash'); });
                }
            });
        });
        return seq.then(function () { return running; });
    };

    /* ---------------- společný spin ---------------- */
    Machine.prototype.onSpinClick = function () {
        if (this.spinning || this.fsMode) return;
        if (this.auto) { this.stopAuto(); return; }
        this.doSpin();
    };

    Machine.prototype.setBusy = function (b) {
        this.spinning = b;
        this.root.classList.toggle('busy', b);
        this.spinBtn.classList.toggle('spinning', b);
    };

    Machine.prototype.effectiveBet = function () {
        var g = this.game; return (this.ante && g.ante) ? Math.round(this.bet() * g.ante.mult) : this.bet();
    };

    Machine.prototype.doSpin = function () {
        var self = this, game = this.game, bet = this.bet();
        Casino.Sound.unlock();
        if (!Casino.Account.debit(this.effectiveBet())) {
            this.message('Nedostatek kreditu! Vyber si bonus.');
            this.stopAuto();
            if (this.opts.onBroke) this.opts.onBroke();
            return;
        }
        this.setBusy(true);
        this.clearWins();
        this.winEl.textContent = '0';
        this.message('Točím…');
        Casino.Sound.spin();

        if (game.type === 'tumble') return this.spinTumbleFlow(bet);
        return this.spinLinesFlow(bet);
    };

    Machine.prototype.spinLinesFlow = function (bet) {
        var self = this, game = this.game;
        var betPerLine = bet / game.paylines.length;
        var sm = (this.ante && game.ante) ? game.ante.scatterMult : 1;
        var grid = Engine.generateLineGrid(game, { scatterMult: sm });
        var result = Engine.evaluateLines(game, grid, { betPerLine: betPerLine, totalBet: bet, freeSpin: false });
        return this.spinLines(grid).then(function () {
            return self.presentLines(result, bet, betPerLine, false);
        }).then(function () {
            if (game.respin && !result.freeSpinsAwarded) return self.runRespins(grid, bet, betPerLine);
        }).then(function () {
            if (game.holdwin && self.countCoins(grid) >= game.holdwin.trigger) {
                return self.runHoldWin(grid, bet).then(function () { self.endSpin(); });
            }
            return self.afterBaseSpin(result, bet);
        });
    };

    Machine.prototype.countCoins = function (grid) {
        var id = this.game.holdwin.coinId, n = 0;
        for (var r = 0; r < this.game.reels; r++) for (var y = 0; y < this.game.rows; y++) if (grid[r][y].id === id) n++;
        return n;
    };

    /* ---------------- RESPIN (lepící se žolíci) ---------------- */
    Machine.prototype.runRespins = function (grid, bet, betPerLine) {
        var self = this, game = this.game, holdId = game.respin.holdId, max = game.respin.max || 5;
        function held(g) { var c = []; for (var r = 0; r < game.reels; r++) for (var y = 0; y < game.rows; y++) if (g[r][y].id === holdId) c.push([r, y]); return c; }
        var first = held(grid);
        if (!first.length) return Promise.resolve();
        var count = 0;
        function step(prevHeld) {
            if (self._destroyed || count >= max) return Promise.resolve();
            count++;
            self.clearWins();
            self.message('🃏 Respin! Žolíci drží…');
            var ng = Engine.generateLineGrid(game);
            prevHeld.forEach(function (rc) { ng[rc[0]][rc[1]] = { id: holdId }; });
            var res = Engine.evaluateLines(game, ng, { betPerLine: betPerLine, totalBet: bet, freeSpin: false });
            return self.spinLines(ng).then(function () {
                prevHeld.forEach(function (rc) { var te = self.reels[rc[0]].targetEls[rc[1]]; if (te) te.classList.add('held'); });
                if (res.totalWin > 0) {
                    self.highlightLines(game, res, betPerLine);
                    Casino.Account.credit(res.totalWin); Casino.Account.recordSpin(game.id, 0, res.totalWin);
                    Casino.Sound.win(winLevel(res.totalWin, bet)); self.winEl.textContent = fmt(res.totalWin);
                }
                var now = held(ng);
                return delay(self.turbo ? 300 : 600).then(function () {
                    if (now.length > prevHeld.length) return step(now);
                });
            });
        }
        return step(first);
    };

    Machine.prototype.presentLines = function (result, bet, betPerLine, isFs) {
        var self = this;
        Casino.Account.recordSpin(this.game.id, isFs ? 0 : bet, result.totalWin);
        if (result.totalWin > 0) {
            this.highlightLines(this.game, result, betPerLine);
            Casino.Account.credit(result.totalWin);
            var lvl = winLevel(result.totalWin, bet);
            Casino.Sound.win(lvl);
            this.message(self.winMessage(result));
            return countUp(this.winEl, 0, result.totalWin, this.turbo ? 500 : 1000)
                .then(function () { if (lvl >= 2) return self.bigWin(result.totalWin, lvl); });
        } else {
            Casino.Sound.lose();
            this.message('Bez výhry – zkus to znovu!');
            return Promise.resolve();
        }
    };

    Machine.prototype.spinTumbleFlow = function (bet) {
        var self = this, game = this.game;
        var result = Engine.spinTumble(game, { totalBet: bet });
        return this.runTumble(result).then(function (baseRunning) {
            Casino.Account.recordSpin(game.id, bet, result.totalWin);
            // ukaž finální obraz s násobiči
            var last = result.steps[result.steps.length - 1];
            self.renderTumble(last.grid, null, false);
            if (result.totalWin <= 0) { Casino.Sound.lose(); self.message('Bez výhry – zkus to znovu!'); return; }
            Casino.Account.credit(result.totalWin);
            var lvl = winLevel(result.totalWin, bet);
            // aplikuj násobič koulí
            var afterMult = Promise.resolve();
            if (result.multiplier > 1 && result.baseWin > 0) {
                self.flashOrbs();
                self.message('Násobič koulí: x' + result.multiplier + '!');
                afterMult = countUp(self.winEl, result.baseWin, result.baseWin * result.multiplier, 800);
            } else {
                afterMult = countUp(self.winEl, 0, result.baseWin, self.turbo ? 400 : 800);
            }
            return afterMult.then(function () {
                if (result.scatterWin > 0) self.winEl.textContent = fmt(result.totalWin);
                Casino.Sound.win(lvl);
                self.message(self.winMessageTumble(result));
                if (lvl >= 2) return self.bigWin(result.totalWin, lvl);
            });
        }).then(function () {
            return self.afterBaseSpin(result, bet);
        });
    };

    Machine.prototype.flashOrbs = function () {
        Array.prototype.forEach.call(this.reelsEl.querySelectorAll('.is-orb'), function (o) {
            o.classList.add('orb-flash');
        });
    };

    /* ---------------- po základním spinu: free spins / autoplay ---------------- */
    Machine.prototype.afterBaseSpin = function (result, bet) {
        var self = this;
        var fs = result.freeSpinsAwarded;
        if (fs && !this.fsMode) {
            return this.runFreeSpins(bet).then(function () { self.endSpin(); });
        }
        this.endSpin();
        return Promise.resolve();
    };

    Machine.prototype.endSpin = function () {
        var self = this;
        this.setBusy(false);
        if (this.auto && !this._destroyed) {
            if (this.auto > 0) { this.auto--; this.updateAutoBtn(); }
            if (Casino.Account.getBalance() < this.bet()) { this.stopAuto(); this.message('Došel kredit – autoplay zastaven.'); return; }
            if (this.auto !== 0) setTimeout(function () { if (self.auto && !self.spinning) self.doSpin(); }, self.turbo ? 250 : 500);
            else this.stopAuto();
        }
    };

    /* ---------------- FREE SPINS ---------------- */
    Machine.prototype.runFreeSpins = function (bet, bought) {
        var self = this, game = this.game, fsCfg = game.freeSpins;
        this.fsMode = true;
        Casino.Sound.freeSpins();
        var total = 0, remaining = fsCfg.count;
        var betPerLine = bet / (game.paylines ? game.paylines.length : 1);
        var expanding = null;
        var persistent = 0;                              // tumble persistentMult
        var fishermenTotal = 0, tierMult = 1, tiersHit = 0; // Big Bass

        this.fsBanner.classList.remove('hidden');
        function banner(extra) { self.updateFsBanner(remaining, total, extra || ''); }

        var pre = Promise.resolve();
        if (fsCfg.expanding) pre = this.chooseExpanding().then(function (id) { expanding = id; });

        return pre.then(function () {
            return self.bigWin('FREE SPINS!', -1, fsCfg.count + ' zatočení zdarma');
        }).then(function () {
            function step() {
                if (self._destroyed || remaining <= 0) return Promise.resolve();
                remaining--;
                self.clearWins(); self.winEl.textContent = fmt(total); Casino.Sound.spin();

                /* --- Big Bass: sběr peněžních ryb rybářem --- */
                if (fsCfg.collect) {
                    var bg = Engine.generateLineGrid(game, { moneyId: fsCfg.moneyId, moneyValues: fsCfg.moneyValues });
                    return self.spinLines(bg).then(function () {
                        var fishermen = 0, sum = 0;
                        for (var r = 0; r < game.reels; r++) for (var y = 0; y < game.rows; y++) {
                            var cell = bg[r][y];
                            if (cell.id === fsCfg.collectorId) fishermen++;
                            if (cell.id === fsCfg.moneyId && cell.mv) sum += cell.mv;
                        }
                        var res = Engine.evaluateLines(game, bg, { betPerLine: betPerLine, totalBet: bet, freeSpin: true, excludeId: fsCfg.moneyId });
                        if (res.totalWin > 0) self.highlightLines(game, res, betPerLine);
                        var collectWin = (fishermen > 0 && sum > 0) ? Math.round(sum * bet * tierMult) : 0;
                        if (collectWin > 0) self.flashCollect();
                        var win = res.totalWin + collectWin;
                        if (win > 0) { Casino.Account.credit(win); Casino.Account.recordSpin(game.id, 0, win); total += win; Casino.Sound.win(winLevel(win, bet)); }
                        if (fishermen > 0) {
                            fishermenTotal += fishermen;
                            while (tiersHit < fsCfg.tiers.length && fishermenTotal >= fsCfg.tiers[tiersHit][0]) {
                                tierMult = fsCfg.tiers[tiersHit][1]; remaining += 10; tiersHit++; self.flashFsRetrigger();
                            }
                        }
                        if (res.freeSpinsAwarded) { remaining += fsCfg.count; self.flashFsRetrigger(); }
                        self.winEl.textContent = fmt(total);
                        banner('🎣 Rybáři: ' + fishermenTotal + ' · Násobič x' + tierMult);
                        return delay(self.turbo ? T.fsTurbo : T.fsDelay);
                    }).then(step);
                }

                /* --- Tumble (Olympus/Candy) – persistentní násobič --- */
                if (game.type === 'tumble') {
                    var tr = Engine.spinTumble(game, { totalBet: bet });
                    return self.runTumble(tr).then(function () {
                        var last = tr.steps[tr.steps.length - 1]; self.renderTumble(last.grid, null, false);
                        var win;
                        if (fsCfg.persistentMult) {
                            persistent += tr.orbSum;
                            win = tr.baseWin > 0 ? Math.round(tr.baseWin * Math.max(persistent, 1)) + tr.scatterWin : tr.scatterWin;
                            if (tr.orbSum > 0) self.flashOrbs();
                        } else win = tr.totalWin;
                        if (win > 0) { Casino.Account.credit(win); Casino.Account.recordSpin(game.id, 0, win); total += win; Casino.Sound.win(winLevel(win, bet)); }
                        if (tr.freeSpinsAwarded) { remaining += 5; self.flashFsRetrigger(); }
                        self.winEl.textContent = fmt(total);
                        banner(fsCfg.persistentMult ? ' · Násobič x' + Math.max(persistent, 1) : '');
                        return delay(self.turbo ? T.fsTurbo : T.fsDelay);
                    }).then(step);
                }

                /* --- Liniové: Book expanding / globální násobič --- */
                var lgrid = Engine.generateLineGrid(game);
                var lres = Engine.evaluateLines(game, lgrid, { betPerLine: betPerLine, totalBet: bet, freeSpin: true, expandingSymbol: expanding });
                return self.spinLines(lgrid).then(function () {
                    if (lres.totalWin > 0) {
                        self.highlightLines(game, lres, betPerLine);
                        Casino.Account.credit(lres.totalWin); Casino.Account.recordSpin(game.id, 0, lres.totalWin);
                        total += lres.totalWin; Casino.Sound.win(winLevel(lres.totalWin, bet));
                    }
                    if (lres.freeSpinsAwarded) { remaining += fsCfg.count; self.flashFsRetrigger(); }
                    self.winEl.textContent = fmt(total);
                    banner(expanding ? (' · Symbol ' + Engine.symById(game, expanding).icon) : (fsCfg.globalMultiplier ? ' · Násobič x' + fsCfg.globalMultiplier : ''));
                    return delay(self.turbo ? T.fsTurbo : T.fsDelay);
                }).then(step);
            }
            return step();
        }).then(function () {
            self.fsMode = false;
            self.fsBanner.classList.add('hidden');
            self.message('Free spins skončily! Celkem získáno: ' + fmt(total) + ' kreditů.');
            return self.bigWin(total, total > bet * 10 ? 3 : 2, 'Výhra z free spinů');
        });
    };

    Machine.prototype.updateFsBanner = function (remaining, total, extra) {
        this.fsBanner.innerHTML = '🎁 FREE SPINS — zbývá <b>' + remaining + '</b>' + (extra || '') +
            ' · Výhra: <b>' + fmt(total) + '</b>';
    };

    Machine.prototype.flashCollect = function () {
        Array.prototype.forEach.call(this.reelsEl.querySelectorAll('.sym-fish, .sym-fisher'), function (o) { o.classList.add('orb-flash'); });
    };

    /* ---------------- nákup bonusu ---------------- */
    Machine.prototype.buyBonus = function () {
        if (this.spinning || this.fsMode) return;
        var self = this, bet = this.bet();
        var cfg = this.game.holdwin || this.game.freeSpins;
        var cost = Math.round(bet * cfg.buyCost);
        var what = this.game.holdwin ? 'Hold & Win' : 'free spiny';
        Casino.UI.modal({
            title: '🛒 Koupit bonus',
            body: 'Spustit ' + what + ' okamžitě za <b>🪙 ' + fmt(cost) + '</b> kreditů? (' + cfg.buyCost + '× sázka)',
            actions: [{ label: 'Zrušit' }, { label: 'Koupit za ' + fmt(cost), primary: true, onClick: function () { self.doBuyBonus(bet, cost); } }]
        });
    };
    Machine.prototype.doBuyBonus = function (bet, cost) {
        var self = this, game = this.game;
        if (!Casino.Account.debit(cost)) { Casino.UI.toast('Nedostatek kreditu!', ''); if (this.opts.onBroke) this.opts.onBroke(); return; }
        Casino.Account.recordSpin(game.id, cost, 0);
        Casino.Sound.unlock();
        this.setBusy(true); this.clearWins(); this.winEl.textContent = '0';
        if (game.holdwin) {
            // vynuť mřížku s dostatkem mincí pro spuštění Hold & Win
            var grid = Engine.generateLineGrid(game), placed = 0;
            for (var r = 0; r < game.reels && placed < game.holdwin.trigger; r++) { grid[r][0] = { id: game.holdwin.coinId }; placed++; }
            for (var r2 = 0; r2 < game.reels && placed < game.holdwin.trigger; r2++) { grid[r2][1] = { id: game.holdwin.coinId }; placed++; }
            this.runHoldWin(grid, bet).then(function () { self.endSpin(); });
        } else {
            this.runFreeSpins(bet, true).then(function () { self.endSpin(); });
        }
    };

    /* ---------------- HOLD & WIN (Piggy / Wolf, lepící se mince + jackpoty) ---------------- */
    function assignCoin(game, bet) {
        var kind = util.weightedValue(game.holdwin.jpWeights, Math.random);
        if (kind === 'value') return { value: util.weightedValue(game.holdwin.coinValues, Math.random) };
        return { jackpot: kind };
    }
    Machine.prototype.runHoldWin = function (grid, bet) {
        var self = this, game = this.game, hw = game.holdwin;
        this.fsMode = true;
        Casino.Sound.freeSpins();
        var total = game.reels * game.rows;       // počet pozic
        var cells = new Array(total);             // null nebo {value} / {jackpot}
        var locked = 0;
        var idx = function (r, y) { return r * game.rows + y; };
        for (var r = 0; r < game.reels; r++) for (var y = 0; y < game.rows; y++) {
            if (grid[r][y].id === hw.coinId) { cells[idx(r, y)] = assignCoin(game, bet); locked++; }
        }
        var ov = el('div', 'holdwin-overlay');
        this.stage.appendChild(ov);
        ov.innerHTML =
            '<div class="hw-head">' + game.emoji + ' HOLD & WIN — respiny: <b class="hw-re">' + hw.respins + '</b></div>' +
            '<div class="hw-jackpots">' + ['grand', 'major', 'minor', 'mini'].map(function (t) {
                return '<span class="hw-jp jp-' + t + '">' + Casino.Jackpots.LABEL[t] + ' <b>' + fmt(Casino.Jackpots.value(t)) + '</b></span>';
            }).join('') + '</div>' +
            '<div class="hw-grid"></div>' +
            '<div class="hw-total">Výhra: <b class="hw-sum">0</b></div>';
        var gridEl = ov.querySelector('.hw-grid');
        gridEl.style.setProperty('--reels', game.reels);

        function valOf(c) { return c ? (c.value ? c.value * bet : 0) : 0; }
        function render(flashSet) {
            gridEl.innerHTML = '';
            for (var yy = 0; yy < game.rows; yy++) for (var rr = 0; rr < game.reels; rr++) {
                var c = cells[idx(rr, yy)];
                var d = document.createElement('div');
                d.className = 'hw-cell' + (c ? ' coin' : ' empty') + (c && c.jackpot ? ' jp jp-' + c.jackpot : '') + (flashSet && flashSet[idx(rr, yy)] ? ' new' : '');
                if (c && c.jackpot) d.innerHTML = '<span class="hw-coin">' + game.symbols.filter(function (s) { return s.id === hw.coinId; })[0].icon + '</span><span class="hw-lab">' + Casino.Jackpots.LABEL[c.jackpot] + '</span>';
                else if (c) d.innerHTML = '<span class="hw-coin">' + game.symbols.filter(function (s) { return s.id === hw.coinId; })[0].icon + '</span><span class="hw-val">' + fmt(c.value * bet) + '</span>';
                gridEl.appendChild(d);
            }
        }
        var reEl = ov.querySelector('.hw-re'), sumEl = ov.querySelector('.hw-sum');
        function curSum() { var s = 0; for (var i = 0; i < total; i++) s += valOf(cells[i]); return s; }
        render(null); sumEl.textContent = fmt(curSum());

        var respins = hw.respins;
        function step() {
            if (self._destroyed) return Promise.resolve();
            if (respins <= 0 || locked >= total) return Promise.resolve();
            respins--;
            Casino.Sound.spin();
            // dober prázdné pozice
            var flash = {}, gotNew = false;
            for (var r = 0; r < game.reels; r++) for (var y = 0; y < game.rows; y++) {
                var i = idx(r, y);
                if (cells[i]) continue;
                // šance na novou minci v respinu
                if (Math.random() < 0.2) { cells[i] = assignCoin(game, bet); locked++; flash[i] = true; gotNew = true; }
            }
            if (gotNew) { respins = hw.respins; Casino.Sound.reelStop(2); }
            reEl.textContent = respins;
            render(flash); sumEl.textContent = fmt(curSum());
            return delay(self.turbo ? 320 : 620).then(step);
        }

        return delay(700).then(step).then(function () {
            // vyhodnocení
            var win = 0, tiers = {};
            for (var i = 0; i < total; i++) {
                var c = cells[i]; if (!c) continue;
                if (c.value) win += c.value * bet;
                else if (c.jackpot) tiers[c.jackpot] = true;
            }
            if (locked >= total) tiers.grand = true;   // plná mřížka = GRAND
            var jpWin = 0, jpNames = [];
            Object.keys(tiers).forEach(function (t) { var v = Casino.Jackpots.win(t); jpWin += v; jpNames.push(Casino.Jackpots.LABEL[t]); });
            win += jpWin;
            if (win > 0) { Casino.Account.credit(win); Casino.Account.recordSpin(game.id, 0, win); }
            sumEl.textContent = fmt(win);
            if (jpNames.length) { self.coinRain(); Casino.Sound.bigWinFanfare(); }
            else if (win > bet * 10) { self.coinRain(); Casino.Sound.win(3); }
            else Casino.Sound.win(2);
            self.message('Hold & Win: +' + fmt(win) + (jpNames.length ? ' · JACKPOT ' + jpNames.join(', ') + '!' : ''));
            self.winEl.textContent = fmt(win);
            return delay(self.turbo ? 1300 : 2400);
        }).then(function () {
            self.fsMode = false;
            ov.remove();
        });
    };

    Machine.prototype.flashFsRetrigger = function () {
        Casino.Sound.freeSpins();
        this.fsBanner.classList.add('retrigger');
        var b = this.fsBanner;
        setTimeout(function () { b.classList.remove('retrigger'); }, 800);
    };

    // animace výběru expandujícího symbolu (Book of Egypt)
    Machine.prototype.chooseExpanding = function () {
        var self = this, game = this.game;
        var pool = game.symbols.filter(function (s) { return !s.scatter; });
        var chosen = pool[util.randInt(0, pool.length - 1)];
        return new Promise(function (resolve) {
            var ov = self.winOverlay;
            ov.className = 'bigwin-overlay choosing';
            ov.innerHTML = '<div class="bw-title">Speciální symbol</div><div class="bw-symbol">❓</div>';
            var symEl = ov.querySelector('.bw-symbol');
            var n = 0, max = 18;
            var iv = setInterval(function () {
                symEl.textContent = pool[n % pool.length].icon; n++;
                Casino.Sound.tick();
                if (n >= max) {
                    clearInterval(iv);
                    symEl.textContent = chosen.icon;
                    symEl.classList.add('locked');
                    Casino.Sound.win(2);
                    setTimeout(function () { ov.classList.add('hidden'); resolve(chosen.id); }, 1100);
                }
            }, 90);
        });
    };

    /* ---------------- velká výhra / overlay ---------------- */
    Machine.prototype.bigWin = function (amount, level, subtitle) {
        var self = this;
        var ov = this.winOverlay;
        var titles = { 1: 'PĚKNÁ VÝHRA', 2: 'VELKÁ VÝHRA', 3: 'MEGA VÝHRA' };
        var title = level === -1 ? amount : (titles[level] || 'VÝHRA');
        ov.className = 'bigwin-overlay lvl' + (level < 0 ? 2 : level);
        ov.innerHTML = '<div class="bw-inner">' +
            '<div class="bw-title">' + title + '</div>' +
            (level === -1 ? '' : '<div class="bw-amount">+' + fmt(amount) + '</div>') +
            (subtitle ? '<div class="bw-sub">' + subtitle + '</div>' : '') +
            '</div>';
        if (level >= 2) { Casino.Sound.bigWinFanfare(); this.coinRain(); }
        return new Promise(function (resolve) {
            var dur = level === -1 ? 1500 : (self.turbo ? 1100 : 1900);
            setTimeout(function () { ov.classList.add('hidden'); resolve(); }, dur);
        });
    };

    Machine.prototype.coinRain = function () {
        var wrap = this.stage;
        for (var i = 0; i < 26; i++) {
            (function (i) {
                var coin = el('div', 'coin', '🪙');
                coin.style.left = (Math.random() * 100) + '%';
                coin.style.animationDuration = (1 + Math.random() * 1.2) + 's';
                coin.style.animationDelay = (Math.random() * 0.5) + 's';
                coin.style.fontSize = (18 + Math.random() * 22) + 'px';
                wrap.appendChild(coin);
                setTimeout(function () { coin.remove(); }, 2600);
            })(i);
        }
    };

    /* ---------------- autoplay ---------------- */
    Machine.prototype.toggleAuto = function () {
        var self = this;
        if (this.fsMode) return;
        if (this.auto) { this.stopAuto(); return; }
        // jednoduché menu
        var menu = el('div', 'auto-menu');
        [['10', 10], ['25', 25], ['50', 50], ['100', 100], ['∞', -1]].forEach(function (o) {
            var b = el('button', null, o[0]);
            b.onclick = function (e) { e.stopPropagation(); self.startAuto(o[1]); menu.remove(); };
            menu.appendChild(b);
        });
        this.autoBtn.parentNode.appendChild(menu);
        var close = function () { menu.remove(); document.removeEventListener('click', close); };
        setTimeout(function () { document.addEventListener('click', close); }, 10);
    };
    Machine.prototype.startAuto = function (n) {
        this.auto = n; Casino.Sound.click(); this.updateAutoBtn();
        if (!this.spinning) this.doSpin();
    };
    Machine.prototype.stopAuto = function () { this.auto = 0; this.updateAutoBtn(); };
    Machine.prototype.updateAutoBtn = function () {
        if (this.auto) { this.autoBtn.classList.add('on'); this.autoBtn.textContent = this.auto < 0 ? '∞ STOP' : (this.auto + ' ◼'); }
        else { this.autoBtn.classList.remove('on'); this.autoBtn.textContent = 'AUTO'; }
    };

    /* ---------------- texty výher ---------------- */
    Machine.prototype.winMessage = function (result) {
        var parts = [];
        var lines = result.wins.filter(function (w) { return w.type === 'line'; }).length;
        if (lines) parts.push(lines + (lines === 1 ? ' výherní linie' : ' výherních linií'));
        if (result.wins.some(function (w) { return w.type === 'expand'; })) parts.push('expandující symbol');
        if (result.scatterWin > 0) parts.push('scatter výhra');
        return 'Výhra! ' + (parts.join(' + ') || '') + ' → +' + fmt(result.totalWin);
    };
    Machine.prototype.winMessageTumble = function (result) {
        var m = result.multiplier > 1 ? (' · násobič x' + result.multiplier) : '';
        return 'Výhra! Padající symboly' + m + ' → +' + fmt(result.totalWin);
    };

    /* ---------------- paytable modal ---------------- */
    Machine.prototype.showPaytable = function () {
        var game = this.game;
        var wrap = el('div', 'paytable');
        var intro = el('p', 'pt-intro', game.tagline + ' · RTP ' + game.rtp + '% · Volatilita: ' + game.volatility +
            (game.type === 'tumble' ? ' · Výhry kdekoliv od ' + game.cluster + ' shodných symbolů, padající symboly a násobící koule.'
                : ' · ' + game.paylines.length + ' výherních linií, výhra zleva doprava.'));
        wrap.appendChild(intro);
        var grid = el('div', 'pt-grid');
        game.symbols.forEach(function (s) {
            var card = el('div', 'pt-card');
            var pays = '';
            if (s.orb) pays = '<span class="pt-special">Násobí výhru (x2 – x250)</span>';
            else if (s.pays) {
                var keys = Object.keys(s.pays).map(Number).sort(function (a, b) { return a - b; });
                pays = keys.map(function (k) { return '<span><i>' + k + '×</i> ' + s.pays[k] + '×</span>'; }).join('');
            }
            var tags = [];
            if (s.wild) tags.push('WILD');
            if (s.scatter) tags.push('SCATTER');
            card.innerHTML = '<div class="pt-ico">' + s.icon + '</div>' +
                '<div class="pt-info"><b>' + s.name + '</b>' +
                (tags.length ? '<span class="pt-tags">' + tags.join(' · ') + '</span>' : '') +
                '<div class="pt-pays">' + pays + '</div></div>';
            grid.appendChild(card);
        });
        wrap.appendChild(grid);
        var feat = [];
        if (game.freeSpins) {
            if (game.type === 'tumble') feat.push('<b>Free spins:</b> ' + game.freeSpins.trigger + '+ scatterů spustí ' + game.freeSpins.count + ' zatočení zdarma.');
            else if (game.freeSpins.expanding) feat.push('<b>Free spins:</b> ' + game.freeSpins.trigger + ' knihy spustí ' + game.freeSpins.count + ' zatočení s expandujícím speciálním symbolem.');
            else feat.push('<b>Free spins:</b> ' + game.freeSpins.trigger + ' scatterů spustí ' + game.freeSpins.count + ' zatočení' + (game.freeSpins.globalMultiplier ? ' s násobičem x' + game.freeSpins.globalMultiplier : '') + '.');
        }
        if (game.multiplierWild) feat.push('<b>Násobící Wild:</b> wild násobí výhru linie (x' + game.multiplierWild.join('/x') + ').');
        if (feat.length) { var f = el('div', 'pt-features', '<h4>Speciální funkce</h4>' + feat.map(function (x) { return '<p>' + x + '</p>'; }).join('')); wrap.appendChild(f); }
        Casino.UI.modal({ title: game.emoji + ' ' + game.name + ' — Výplatní tabulka', body: wrap });
    };

})(typeof window !== 'undefined' ? window : global);
