/* ==========================================================================
   MARES CASINO – Three Card Poker (proti dealerovi, který mluví)
   Ante + Play, volitelný Pair Plus. Dealer kvalifikuje od dámy výš.
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    var fmt = Casino.util.fmt;
    function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }

    var BETS = [10, 20, 50, 100, 250, 500];
    var SUITS = ['♠', '♥', '♦', '♣'];
    var RANK_NAME = { 0: 'Vysoká karta', 1: 'Pár', 2: 'Barva', 3: 'Postupka', 4: 'Trojice', 5: 'Postupka v barvě' };
    var ANTE_BONUS = { 3: 1, 4: 4, 5: 5 };          // postupka/trojice/postupka v barvě
    var PLUS_PAY = { 1: 1, 2: 3, 3: 6, 4: 30, 5: 40 }; // Pair Plus

    function valStr(v) { return v <= 10 ? '' + v : { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }[v]; }

    function deck() {
        var d = [];
        for (var s = 0; s < 4; s++) for (var v = 2; v <= 14; v++) d.push({ v: v, s: s });
        for (var i = d.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = d[i]; d[i] = d[j]; d[j] = t; }
        return d;
    }

    function evaluate(cards) {
        var vs = cards.map(function (c) { return c.v; }).sort(function (a, b) { return b - a; });
        var flush = cards[0].s === cards[1].s && cards[1].s === cards[2].s;
        var a23 = vs[0] === 14 && vs[1] === 3 && vs[2] === 2;
        var straight = (vs[0] - 1 === vs[1] && vs[1] - 1 === vs[2]) || a23;
        var sHigh = a23 ? 3 : vs[0];
        var trips = vs[0] === vs[1] && vs[1] === vs[2];
        var pairVal = 0, kicker = 0;
        if (!trips) {
            if (vs[0] === vs[1]) { pairVal = vs[0]; kicker = vs[2]; }
            else if (vs[1] === vs[2]) { pairVal = vs[1]; kicker = vs[0]; }
        }
        if (straight && flush) return { rank: 5, tb: [sHigh] };
        if (trips) return { rank: 4, tb: [vs[0]] };
        if (straight) return { rank: 3, tb: [sHigh] };
        if (flush) return { rank: 2, tb: vs };
        if (pairVal) return { rank: 1, tb: [pairVal, kicker] };
        return { rank: 0, tb: vs };
    }
    function cmp(a, b) {
        if (a.rank !== b.rank) return a.rank - b.rank;
        for (var i = 0; i < Math.max(a.tb.length, b.tb.length); i++) {
            var d = (a.tb[i] || 0) - (b.tb[i] || 0); if (d) return d;
        }
        return 0;
    }
    function qualifies(h) { return h.rank >= 1 || (h.rank === 0 && h.tb[0] >= 12); }

    var TALK = {
        deal: ['Rozdávám karty. Hodně štěstí!', 'Tři karty pro vás, tři pro mě.', 'Ať vám karta přeje!'],
        decide: ['Hrajete, nebo balíte?', 'Co na to říkáte — play, nebo fold?', 'Rozmyslete si to dobře.'],
        fold: ['Balíte. Někdy je to moudré.', 'Skládáte. Beru ante.', 'Fold. Příště to vyjde.'],
        noQual: ['Nekvalifikoval jsem se — ante vám platí.', 'Mám míň než dámu, ante hraje ve váš prospěch.'],
        win: ['Vyhráváte! Gratuluji.', 'Pěkná ruka, berete to!', 'To je výhra, klobouk dolů!'],
        lose: ['Dům bere. Příště!', 'Tentokrát mám lepší ruku.', 'Beru to já, smůla.'],
        push: ['Shoda — nikdo nebere.', 'Remíza, sázky se vrací.'],
        plus: ['A Pair Plus vám taky platí!', 'Bonus Pair Plus letí k vám!']
    };
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

    Casino.Poker = { open: function (mount, opts) { return new Poker(mount, opts); } };

    function Poker(mount, opts) {
        this.opts = opts || {};
        this.betIndex = 2;
        this.pairPlus = false;
        this.state = 'idle';
        this.destroyed = false;
        this.build(mount);
    }
    Poker.prototype.ante = function () { return BETS[this.betIndex]; };

    Poker.prototype.build = function (mount) {
        var self = this;
        var theme = { a: '#19a86b', b: '#ffd24a', bg: 'radial-gradient(circle at 50% 0%, #0a3b2a, #04130d)' };
        var f = Casino.UI.gameFrame(mount, {
            emoji: '🃏', name: 'Three Card Poker', subtitle: 'Tři karty proti živému dealerovi',
            theme: theme, bg: theme.bg, onExit: function () { Casino.Dealer.stop(); self.opts.onExit && self.opts.onExit(); },
            onInfo: function () { self.info(); }
        });
        this.frame = f;

        var stage = f.stage;
        var dealerRow = el('div', 'poker-dealer');
        dealerRow.innerHTML = '<div class="dealer-av">🤵</div><div class="speech hidden"></div>';
        stage.appendChild(dealerRow);
        this.speech = dealerRow.querySelector('.speech');

        this.dealerCards = el('div', 'card-row dealer-cards'); stage.appendChild(this.labelRow('Dealer', this.dealerCards));
        this.result = el('div', 'poker-result'); stage.appendChild(this.result);
        this.playerCards = el('div', 'card-row player-cards'); stage.appendChild(this.labelRow('Ty', this.playerCards));

        var c = f.controls;
        c.innerHTML =
            '<div class="ctrl-cell ctrl-bet"><button class="bet-dn">−</button>' +
            '<div class="bet-val"><label>Ante</label><b class="c-bet">' + fmt(this.ante()) + '</b></div>' +
            '<button class="bet-up">+</button></div>' +
            '<label class="auto-cash pp-toggle"><input type="checkbox" class="pp"> Pair Plus</label>' +
            '<div class="poker-actions">' +
            '<button class="deal-btn">ROZDAT 🃏</button>' +
            '<button class="fold-btn hidden">SLOŽIT</button>' +
            '<button class="play-btn hidden">HRÁT</button>' +
            '</div>';
        this.betEl = c.querySelector('.c-bet');
        c.querySelector('.bet-dn').onclick = function () { self.changeBet(-1); };
        c.querySelector('.bet-up').onclick = function () { self.changeBet(1); };
        c.querySelector('.pp').onchange = function (e) { self.pairPlus = e.target.checked; };
        this.dealBtn = c.querySelector('.deal-btn');
        this.foldBtn = c.querySelector('.fold-btn');
        this.playBtn = c.querySelector('.play-btn');
        this.dealBtn.onclick = function () { Casino.Sound.unlock(); self.deal(); };
        this.foldBtn.onclick = function () { self.fold(); };
        this.playBtn.onclick = function () { self.play(); };

        this.renderCards(this.dealerCards, null, 3);
        this.renderCards(this.playerCards, null, 3);
        Casino.Dealer.say(this.speech, 'Vítejte u stolu! Vsaďte ante a rozdáme.');
    };

    Poker.prototype.labelRow = function (label, cardsEl) {
        var w = el('div', 'card-area'); w.appendChild(el('div', 'card-area-label', label)); w.appendChild(cardsEl); return w;
    };

    Poker.prototype.changeBet = function (d) {
        if (this.state !== 'idle') return;
        var n = this.betIndex + d; if (n < 0 || n >= BETS.length) return;
        this.betIndex = n; Casino.Sound.click(); this.betEl.textContent = fmt(this.ante());
    };

    Poker.prototype.renderCards = function (container, cards, count) {
        container.innerHTML = '';
        for (var i = 0; i < count; i++) {
            var c = el('div', 'pcard down');
            if (cards && cards[i]) { c = this.faceCard(cards[i]); }
            container.appendChild(c);
        }
    };
    Poker.prototype.faceCard = function (card) {
        var red = card.s === 1 || card.s === 2;
        var c = el('div', 'pcard' + (red ? ' red' : ''));
        c.innerHTML = '<span class="pc-v">' + valStr(card.v) + '</span><span class="pc-s">' + SUITS[card.s] + '</span>';
        return c;
    };

    Poker.prototype.deal = function () {
        var ante = this.ante();
        var cost = ante + (this.pairPlus ? ante : 0);
        if (!Casino.Account.debit(cost)) { Casino.UI.toast('Nedostatek kreditu!', ''); if (this.opts.onBroke) this.opts.onBroke(); return; }
        this.anteAmt = ante; this.ppAmt = this.pairPlus ? ante : 0;
        var d = deck();
        this.player = [d.pop(), d.pop(), d.pop()];
        this.dealer = [d.pop(), d.pop(), d.pop()];
        this.state = 'decide';
        this.result.textContent = '';
        Casino.Sound.click();

        this.renderCards(this.dealerCards, null, 3);
        // postupně otoč hráčské karty
        var self = this;
        this.renderCards(this.playerCards, null, 3);
        this.player.forEach(function (card, i) {
            setTimeout(function () {
                if (self.destroyed) return;
                self.playerCards.children[i].replaceWith(self.faceCard(card));
                Casino.Sound.reelStop(i);
            }, 180 * (i + 1));
        });
        this.dealBtn.classList.add('hidden');
        this.foldBtn.classList.remove('hidden');
        this.playBtn.classList.remove('hidden');
        setTimeout(function () { if (!self.destroyed) Casino.Dealer.say(self.speech, pick(TALK.decide)); }, 800);
    };

    Poker.prototype.revealDealer = function () {
        var self = this;
        this.dealer.forEach(function (card, i) {
            setTimeout(function () {
                if (self.destroyed) return;
                self.dealerCards.children[i].replaceWith(self.faceCard(card));
                Casino.Sound.reelStop(i + 1);
            }, 160 * i);
        });
    };

    Poker.prototype.resolvePairPlus = function (ph) {
        if (!this.ppAmt) return 0;
        var mult = PLUS_PAY[ph.rank];
        return mult ? this.ppAmt * (mult + 1) : 0;
    };

    Poker.prototype.fold = function () {
        if (this.state !== 'decide') return;
        this.state = 'idle';
        Casino.Sound.lose();
        var ph = evaluate(this.player);
        var ppReturn = this.resolvePairPlus(ph);   // Pair Plus se řeší dle tvých karet
        if (ppReturn > 0) Casino.Account.credit(ppReturn);
        Casino.Account.recordSpin('poker', this.anteAmt + this.ppAmt, ppReturn);
        this.revealDealer();
        Casino.Dealer.say(this.speech, pick(TALK.fold) + (ppReturn > 0 ? ' Ale Pair Plus platí!' : ''));
        this.showResult('Složil jsi. ' + (ppReturn > 0 ? 'Pair Plus +' + fmt(ppReturn) : 'Ante propadá.'), ppReturn > 0);
        this.endHand();
    };

    Poker.prototype.play = function () {
        if (this.state !== 'decide') return;
        var play = this.anteAmt;
        if (!Casino.Account.debit(play)) { Casino.UI.toast('Nedostatek kreditu na Play sázku!', ''); return; }
        this.state = 'reveal';
        this.revealDealer();
        var self = this;
        setTimeout(function () { if (!self.destroyed) self.showdown(play); }, 700);
    };

    Poker.prototype.showdown = function (play) {
        var ph = evaluate(this.player), dh = evaluate(this.dealer);
        var dq = qualifies(dh);
        var mainReturn = 0, outcome = '', win = false;

        if (!dq) {
            mainReturn = this.anteAmt * 2 + play; // ante 1:1, play push
            outcome = 'Dealer nekvalifikoval (' + RANK_NAME[dh.rank] + '). Ante platí 1:1, Play se vrací.';
            win = true;
            Casino.Dealer.say(this.speech, pick(TALK.noQual));
        } else {
            var r = cmp(ph, dh);
            if (r > 0) { mainReturn = this.anteAmt * 2 + play * 2; outcome = 'Tvá ' + RANK_NAME[ph.rank] + ' poráží dealerovu ' + RANK_NAME[dh.rank] + '!'; win = true; Casino.Dealer.say(this.speech, pick(TALK.win)); }
            else if (r === 0) { mainReturn = this.anteAmt + play; outcome = 'Shoda — sázky se vrací.'; Casino.Dealer.say(this.speech, pick(TALK.push)); }
            else { mainReturn = 0; outcome = 'Dealerova ' + RANK_NAME[dh.rank] + ' bere nad tvou ' + RANK_NAME[ph.rank] + '.'; Casino.Dealer.say(this.speech, pick(TALK.lose)); }
        }
        var bonusMult = ANTE_BONUS[ph.rank] || 0;
        var bonus = bonusMult ? this.anteAmt * bonusMult : 0;
        var ppReturn = this.resolvePairPlus(ph);
        var totalReturn = mainReturn + bonus + ppReturn;
        if (totalReturn > 0) Casino.Account.credit(totalReturn);
        Casino.Account.recordSpin('poker', this.anteAmt + play + this.ppAmt, totalReturn);

        var extra = [];
        if (bonus) extra.push('Ante bonus +' + fmt(bonus) + ' (' + RANK_NAME[ph.rank] + ')');
        if (ppReturn) extra.push('Pair Plus +' + fmt(ppReturn));
        var net = totalReturn - (this.anteAmt + play + this.ppAmt);
        this.showResult(outcome + (extra.length ? ' · ' + extra.join(' · ') : '') + '  →  ' + (net >= 0 ? '+' : '') + fmt(net), net >= 0);
        if (net > 0) Casino.Sound.win(net >= this.anteAmt * 4 ? 3 : 2); else if (net === 0) Casino.Sound.win(0); else Casino.Sound.lose();
        this.state = 'idle';
        this.endHand();
    };

    Poker.prototype.showResult = function (txt, good) {
        this.result.textContent = txt;
        this.result.className = 'poker-result show ' + (good ? 'good' : 'bad');
    };
    Poker.prototype.endHand = function () {
        this.foldBtn.classList.add('hidden');
        this.playBtn.classList.add('hidden');
        this.dealBtn.classList.remove('hidden');
    };

    Poker.prototype.info = function () {
        Casino.UI.modal({
            title: '🃏 Three Card Poker — pravidla',
            body: '<p style="color:var(--muted);line-height:1.7">Vsadíš <b>Ante</b> a dostaneš 3 karty (dealer taky). Pak se rozhodneš <b>HRÁT</b> (přidáš stejnou Play sázku) nebo <b>SLOŽIT</b>.</p>' +
                '<ul style="color:var(--muted);line-height:1.8;margin-left:18px">' +
                '<li>Dealer kvalifikuje od <b>dámy</b> výš.</li>' +
                '<li>Nekvalifikuje → Ante platí 1:1, Play se vrací.</li>' +
                '<li>Kvalifikuje → porovnání rukou (výhra 1:1 na obě sázky).</li>' +
                '<li><b>Ante bonus:</b> postupka 1:1, trojice 4:1, postupka v barvě 5:1.</li>' +
                '<li><b>Pair Plus</b> (volitelně): pár 1:1, barva 3:1, postupka 6:1, trojice 30:1, postupka v barvě 40:1.</li></ul>' +
                '<p style="color:var(--muted);margin-top:8px">Pořadí rukou: postupka v barvě > trojice > postupka > barva > pár > vysoká karta.</p>'
        });
    };

    Poker.prototype.destroy = function () { this.destroyed = true; Casino.Dealer.stop(); };

    Casino.registry.push({
        id: 'poker', name: 'Three Card Poker', emoji: '🃏', category: 'table',
        tagline: 'Tři karty proti dealerovi, který mluví',
        theme: { a: '#19a86b', b: '#ffd24a', bg: 'radial-gradient(circle at 50% 0%, #0a3b2a, #04130d)' },
        badges: ['RTP ~96.6%', 'Stolní'], meta: 'Živý dealer · Pair Plus 40:1',
        open: function (mount, opts) { return Casino.Poker.open(mount, opts); }
    });

})(typeof window !== 'undefined' ? window : global);
