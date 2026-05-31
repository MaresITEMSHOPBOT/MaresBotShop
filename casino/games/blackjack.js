/* ==========================================================================
   MARES CASINO – Blackjack (21) proti dealerovi, který mluví.
   Blackjack platí 3:2, dealer dobírá do 17. Hit / Stand / Double.
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    var fmt = Casino.util.fmt;
    function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
    var SUITS = ['♠', '♥', '♦', '♣'];
    var BETS = [10, 20, 50, 100, 250, 500];
    function valStr(v) { return v <= 10 ? '' + v : { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }[v]; }
    function deck() { var d = []; for (var n = 0; n < 4; n++) for (var s = 0; s < 4; s++) for (var v = 2; v <= 14; v++) d.push({ v: v, s: s }); for (var i = d.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = d[i]; d[i] = d[j]; d[j] = t; } return d; }
    function cardVal(c) { if (c.v >= 14) return 11; if (c.v >= 11) return 10; return c.v; }
    function handVal(cards) { var sum = 0, aces = 0; cards.forEach(function (c) { sum += cardVal(c); if (c.v === 14) aces++; }); while (sum > 21 && aces > 0) { sum -= 10; aces--; } return sum; }
    function isBJ(cards) { return cards.length === 2 && handVal(cards) === 21; }

    var TALK = {
        deal: ['Karty na stole. Hodně štěstí!', 'Rozdávám.', 'Vsadíme si?'],
        bust: ['Přetáhl jsi, mrzí mě to.', 'Bum, přes 21.'],
        dealerBust: ['Přetáhl jsem! Bereš to.', 'Já jdu přes — výhra je tvá.'],
        win: ['Vyhráváš, gratuluji!', 'Lepší ruka bere, pěkně.'],
        lose: ['Beru to já.', 'Dnes má navrch dům.'],
        push: ['Shoda — sázka se vrací.', 'Remíza.'],
        bj: ['Blackjack! Platím jedna a půl!', 'Černý jack! Pěkné.']
    };
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

    Casino.Blackjack = { open: function (m, o) { return new BJ(m, o); } };
    function BJ(mount, opts) { this.opts = opts || {}; this.betIndex = 3; this.state = 'bet'; this.build(mount); }
    BJ.prototype.bet = function () { return BETS[this.betIndex]; };

    BJ.prototype.build = function (mount) {
        var self = this;
        var theme = { a: '#d4213d', b: '#ffd24a', bg: 'radial-gradient(ellipse at 50% 40%, #0c5236, #062017)' };
        var f = Casino.UI.gameFrame(mount, { emoji: '🂡', name: 'Blackjack', subtitle: '21 proti dealerovi · BJ platí 3:2', theme: theme, bg: theme.bg, onExit: function () { Casino.Dealer.stop(); self.opts.onExit && self.opts.onExit(); }, onInfo: function () { self.info(); } });
        this.frame = f;
        var stage = f.stage;
        var drow = el('div', 'bj-dealer'); drow.innerHTML = '<div class="dealer-av">🤵</div><div class="speech hidden"></div>'; stage.appendChild(drow); this.speech = drow.querySelector('.speech');
        this.dealerCards = el('div', 'card-row'); stage.appendChild(this.labelRow('Dealer', this.dealerCards, 'dval'));
        this.result = el('div', 'poker-result'); stage.appendChild(this.result);
        this.playerCards = el('div', 'card-row'); stage.appendChild(this.labelRow('Ty', this.playerCards, 'pval'));
        var c = f.controls;
        c.innerHTML =
            '<div class="ctrl-cell ctrl-bet"><button class="bet-dn">−</button><div class="bet-val"><label>Sázka</label><b class="c-bet">' + fmt(this.bet()) + '</b></div><button class="bet-up">+</button></div>' +
            '<div class="poker-actions">' +
            '<button class="deal-btn bj-deal">ROZDAT</button>' +
            '<button class="call-btn bj-hit hidden">HIT</button>' +
            '<button class="play-btn bj-stand hidden">STÁT</button>' +
            '<button class="feat-btn bj-double hidden">ZDVOJIT</button>' +
            '</div>';
        this.betEl = c.querySelector('.c-bet');
        c.querySelector('.bet-dn').onclick = function () { self.changeBet(-1); };
        c.querySelector('.bet-up').onclick = function () { self.changeBet(1); };
        this.dealBtn = c.querySelector('.bj-deal'); this.hitBtn = c.querySelector('.bj-hit'); this.standBtn = c.querySelector('.bj-stand'); this.dblBtn = c.querySelector('.bj-double');
        this.dealBtn.onclick = function () { Casino.Sound.unlock(); self.deal(); };
        this.hitBtn.onclick = function () { self.hit(); };
        this.standBtn.onclick = function () { self.stand(); };
        this.dblBtn.onclick = function () { self.double(); };
        this.renderCards(this.dealerCards, [], true, 'dval'); this.renderCards(this.playerCards, [], false, 'pval');
        Casino.Dealer.say(this.speech, 'Vítej u Blackjacku! Vsaď a rozdáme.');
    };
    BJ.prototype.labelRow = function (label, cardsEl, valCls) { var w = el('div', 'card-area'); w.appendChild(el('div', 'card-area-label', label + ' <span class="' + valCls + '"></span>')); w.appendChild(cardsEl); return w; };
    BJ.prototype.changeBet = function (d) { if (this.state !== 'bet') return; var n = this.betIndex + d; if (n < 0 || n >= BETS.length) return; this.betIndex = n; Casino.Sound.click(); this.betEl.textContent = fmt(this.bet()); };

    BJ.prototype.cardHtml = function (cd) { var red = cd.s === 1 || cd.s === 2; return '<div class="pcard' + (red ? ' red' : '') + '"><span class="pc-v">' + valStr(cd.v) + '</span><span class="pc-s">' + SUITS[cd.s] + '</span></div>'; };
    BJ.prototype.renderCards = function (container, cards, hideHole, valCls) {
        container.innerHTML = cards.map(function (cd, i) { return (hideHole && i === 1 && !this.revealed) ? '<div class="pcard down"></div>' : this.cardHtml(cd); }, this).join('') || '<div class="pcard down"></div><div class="pcard down"></div>';
        var vEl = this.frame.stage.querySelector('.' + valCls);
        if (vEl) { if (!cards.length) vEl.textContent = ''; else if (hideHole && !this.revealed) vEl.textContent = '(' + (cardVal(cards[0]) === 11 ? 'A' : handVal([cards[0]])) + ')'; else vEl.textContent = handVal(cards); }
    };

    BJ.prototype.setButtons = function (mode) {
        this.dealBtn.classList.toggle('hidden', mode !== 'bet');
        this.hitBtn.classList.toggle('hidden', mode !== 'play');
        this.standBtn.classList.toggle('hidden', mode !== 'play');
        this.dblBtn.classList.toggle('hidden', mode !== 'play' || this.player.length !== 2 || !this.canDouble);
    };

    BJ.prototype.deal = function () {
        var bet = this.bet();
        if (!Casino.Account.debit(bet)) { Casino.UI.toast('Nedostatek kreditu!', ''); if (this.opts.onBroke) this.opts.onBroke(); return; }
        this.stake = bet; this.canDouble = Casino.Account.getBalance() >= bet;
        this.deck = deck(); this.revealed = false;
        this.player = [this.deck.pop(), this.deck.pop()];
        this.dealer = [this.deck.pop(), this.deck.pop()];
        this.state = 'play'; this.result.className = 'poker-result';
        Casino.Dealer.say(this.speech, pick(TALK.deal)); Casino.Sound.reelStop(1);
        this.renderCards(this.dealerCards, this.dealer, true, 'dval'); this.renderCards(this.playerCards, this.player, false, 'pval');
        if (isBJ(this.player) || isBJ(this.dealer)) return this.finish();
        this.setButtons('play');
    };
    BJ.prototype.hit = function () {
        this.player.push(this.deck.pop()); this.canDouble = false; Casino.Sound.reelStop(2);
        this.renderCards(this.playerCards, this.player, false, 'pval');
        if (handVal(this.player) > 21) { this.setButtons('none'); this.finish(); } else this.setButtons('play');
    };
    BJ.prototype.double = function () {
        if (!Casino.Account.debit(this.stake)) { Casino.UI.toast('Málo kreditu na zdvojení.', ''); return; }
        this.stake *= 2; this.player.push(this.deck.pop()); Casino.Sound.reelStop(2);
        this.renderCards(this.playerCards, this.player, false, 'pval'); this.setButtons('none');
        this.stand();
    };
    BJ.prototype.stand = function () { this.setButtons('none'); this.dealerPlay(); };

    BJ.prototype.dealerPlay = function () {
        var self = this; this.revealed = true; this.renderCards(this.dealerCards, this.dealer, true, 'dval');
        function step() {
            if (self.destroyed) return;
            if (handVal(self.dealer) < 17 && handVal(self.player) <= 21) {
                self.dealer.push(self.deck.pop()); self.renderCards(self.dealerCards, self.dealer, true, 'dval'); Casino.Sound.reelStop(2);
                setTimeout(step, 600);
            } else self.finish();
        }
        if (handVal(this.player) > 21) this.finish(); else setTimeout(step, 600);
    };

    BJ.prototype.finish = function () {
        this.revealed = true; this.renderCards(this.dealerCards, this.dealer, true, 'dval');
        var pv = handVal(this.player), dv = handVal(this.dealer);
        var pBJ = isBJ(this.player), dBJ = isBJ(this.dealer);
        var ret = 0, msg, good = false;
        if (pBJ && !dBJ) { ret = this.stake * 2.5; msg = 'Blackjack! +' + fmt(ret - this.stake); good = true; Casino.Dealer.say(this.speech, pick(TALK.bj)); }
        else if (pBJ && dBJ) { ret = this.stake; msg = 'Oba Blackjack — push.'; Casino.Dealer.say(this.speech, pick(TALK.push)); }
        else if (pv > 21) { ret = 0; msg = 'Přetažení (' + pv + '). Prohra.'; Casino.Dealer.say(this.speech, pick(TALK.bust)); }
        else if (dv > 21) { ret = this.stake * 2; msg = 'Dealer přetáhl (' + dv + ')! +' + fmt(this.stake); good = true; Casino.Dealer.say(this.speech, pick(TALK.dealerBust)); }
        else if (pv > dv) { ret = this.stake * 2; msg = 'Tvých ' + pv + ' poráží ' + dv + '! +' + fmt(this.stake); good = true; Casino.Dealer.say(this.speech, pick(TALK.win)); }
        else if (pv < dv) { ret = 0; msg = 'Dealer má ' + dv + ' proti ' + pv + '. Prohra.'; Casino.Dealer.say(this.speech, pick(TALK.lose)); }
        else { ret = this.stake; msg = 'Shoda na ' + pv + ' — push.'; Casino.Dealer.say(this.speech, pick(TALK.push)); }
        if (ret > 0) Casino.Account.credit(ret);
        Casino.Account.recordSpin('blackjack', this.stake, ret);
        var net = ret - this.stake;
        this.result.className = 'poker-result show ' + (net > 0 ? 'good' : net < 0 ? 'bad' : '');
        this.result.textContent = msg;
        if (net > 0) Casino.Sound.win(pBJ ? 3 : 2); else if (net < 0) Casino.Sound.lose(); else Casino.Sound.click();
        this.state = 'bet'; this.setButtons('bet');
    };

    BJ.prototype.info = function () { Casino.UI.modal({ title: '🂡 Blackjack — pravidla', body: '<p style="color:var(--muted);line-height:1.7">Cílem je být blíž k 21 než dealer, ale nepřetáhnout. Obrázky = 10, eso = 1 nebo 11.</p><ul style="color:var(--muted);line-height:1.8;margin-left:18px"><li><b>HIT</b> = další karta, <b>STÁT</b> = končíš, <b>ZDVOJIT</b> = dvojnásobná sázka + 1 karta.</li><li>Dealer dobírá do 17.</li><li>Blackjack (eso + desítka) platí <b>3:2</b>, běžná výhra 1:1.</li></ul><p style="color:var(--muted);margin-top:6px">RTP ~99,5 % při základní strategii.</p>' }); };
    BJ.prototype.destroy = function () { this.destroyed = true; Casino.Dealer.stop(); };

    Casino.registry.push({ id: 'blackjack', name: 'Blackjack', emoji: '🂡', category: 'table', tagline: '21 proti dealerovi, který mluví', theme: { a: '#d4213d', b: '#ffd24a', bg: 'radial-gradient(ellipse at 50% 40%, #0c5236, #062017)' }, badges: ['RTP ~99.5%', 'Stolní'], meta: 'Hit/Stand/Double · BJ 3:2', open: function (m, o) { return Casino.Blackjack.open(m, o); } });
})(typeof window !== 'undefined' ? window : global);
