/* ==========================================================================
   MARES CASINO – aplikace: přihlášení, lobby, navigace, hlavička, bonusy
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};
    var Account = Casino.Account, fmt = Casino.util.fmt, GAMES = Casino.GAMES;

    function $(s, p) { return (p || document).querySelector(s); }
    function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

    /* ======================================================================
       UI helpery: modal / toast / confirm
       ===================================================================== */
    Casino.UI = {
        modal: function (o) {
            var rootEl = $('#modal-root');
            var ov = el('div', 'modal-ov');
            var card = el('div', 'modal-card');
            var head = el('div', 'modal-head', '<h3>' + (o.title || '') + '</h3>');
            var close = el('button', 'modal-x', '✕');
            head.appendChild(close);
            var body = el('div', 'modal-body');
            if (o.body instanceof Node) body.appendChild(o.body); else body.innerHTML = o.body || '';
            card.appendChild(head); card.appendChild(body);
            if (o.actions) {
                var foot = el('div', 'modal-foot');
                o.actions.forEach(function (a) {
                    var b = el('button', a.primary ? 'btn-primary' : 'btn-secondary', a.label);
                    b.onclick = function () { if (a.onClick) a.onClick(); if (!a.keepOpen) destroy(); };
                    foot.appendChild(b);
                });
                card.appendChild(foot);
            }
            ov.appendChild(card); rootEl.appendChild(ov);
            requestAnimationFrame(function () { ov.classList.add('show'); });
            function destroy() { ov.classList.remove('show'); setTimeout(function () { ov.remove(); }, 250); }
            close.onclick = destroy;
            ov.onclick = function (e) { if (e.target === ov && o.dismissable !== false) destroy(); };
            return { close: destroy, card: card };
        },
        toast: function (msg, type) {
            var r = $('#toast-root');
            var t = el('div', 'toast' + (type ? ' ' + type : ''), msg);
            r.appendChild(t);
            requestAnimationFrame(function () { t.classList.add('show'); });
            setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 2600);
        }
    };

    /* ======================================================================
       Hlavička + kredit
       ===================================================================== */
    function animateBalance(to) {
        var node = $('#hdr-balance'); if (!node) return;
        var from = parseFloat(node.dataset.v || '0') || 0;
        node.dataset.v = to;
        var chip = $('#balance-chip');
        if (chip) { chip.classList.remove('up', 'down'); void chip.offsetWidth; chip.classList.add(to >= from ? 'up' : 'down'); }
        var start = performance.now(), dur = 650;
        function frame(now) {
            var p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
            node.textContent = fmt(from + (to - from) * e);
            if (p < 1) requestAnimationFrame(frame); else node.textContent = fmt(to);
        }
        requestAnimationFrame(frame);
    }

    function refreshHeader() {
        var a = Account.current();
        $('#topbar').classList.toggle('hidden', !a);
        if (!a) return;
        $('#hdr-name').textContent = a.name;
        animateBalance(a.balance);
        refreshBonusBtn();
    }

    function refreshBonusBtn() {
        var st = Account.bonusState();
        var btn = $('#btn-bonus');
        if (!btn) return;
        var hot = st.daily || st.rescue;
        btn.classList.toggle('hot', hot);
        btn.innerHTML = '🎁 Bonus' + (hot ? ' <span class="dot"></span>' : '');
    }

    /* ======================================================================
       Obrazovky
       ===================================================================== */
    function show(screen) {
        ['login', 'lobby', 'game'].forEach(function (s) {
            $('#screen-' + s).classList.toggle('hidden', s !== screen);
        });
        $('#btn-lobby').classList.toggle('hidden', screen !== 'game');
    }

    /* ---------- Přihlášení ---------- */
    function renderLogin() {
        var scr = $('#screen-login');
        scr.innerHTML = '';
        var box = el('div', 'login-box');
        box.appendChild(el('div', 'login-logo', '🎰'));
        box.appendChild(el('h1', null, 'MARES CASINO'));
        box.appendChild(el('p', 'login-sub', 'Roztoč automaty a sbírej kredity. Vytvoř si účet nebo pokračuj.'));

        var accs = Account.listAccounts();
        if (accs.length) {
            var list = el('div', 'acc-list');
            list.appendChild(el('div', 'acc-list-title', 'Tvé účty'));
            accs.forEach(function (a) {
                var row = el('button', 'acc-row');
                row.innerHTML = '<span class="acc-av">' + a.name.charAt(0).toUpperCase() + '</span>' +
                    '<span class="acc-meta"><b>' + a.name + '</b><small>🪙 ' + fmt(a.balance) + ' · ' + a.stats.spins + ' zatočení</small></span>' +
                    '<span class="acc-go">▶</span>';
                row.onclick = function () { Casino.Sound.unlock(); doLogin(a.name); };
                var del = el('button', 'acc-del', '🗑');
                del.title = 'Smazat účet';
                del.onclick = function (e) {
                    e.stopPropagation();
                    Casino.UI.modal({
                        title: 'Smazat účet?', body: 'Opravdu smazat účet <b>' + a.name + '</b> a jeho kredit?',
                        actions: [{ label: 'Zrušit' }, { label: 'Smazat', primary: true, onClick: function () { Account.deleteAccount(a.name); renderLogin(); } }]
                    });
                };
                var wrap = el('div', 'acc-row-wrap'); wrap.appendChild(row); wrap.appendChild(del);
                list.appendChild(wrap);
            });
            box.appendChild(list);
            box.appendChild(el('div', 'or-divider', '<span>nebo nový účet</span>'));
        }

        var form = el('form', 'login-form');
        var input = el('input', 'login-input');
        input.placeholder = 'Zadej přezdívku…'; input.maxLength = 18;
        var btn = el('button', 'btn-primary login-btn', 'Vytvořit účet a hrát ▶');
        form.appendChild(input); form.appendChild(btn);
        form.onsubmit = function (e) {
            e.preventDefault();
            Casino.Sound.unlock();
            var name = input.value.trim() || ('Hráč' + Casino.util.randInt(100, 999));
            doLogin(name);
        };
        box.appendChild(form);
        box.appendChild(el('p', 'login-note', '🎮 Hra je čistě pro zábavu, za virtuální kredity bez jakékoliv reálné hodnoty. Nový účet startuje s 5 000 kredity.'));
        scr.appendChild(box);
    }

    function doLogin(name) {
        var fresh = !Account.listAccounts().some(function (a) { return a.name === name; });
        Account.login(name);
        refreshHeader();
        goLobby();
        if (fresh) Casino.UI.toast('Vítej, ' + name + '! Máš 5 000 kreditů na startenku. 🎉', 'good');
        else Casino.UI.toast('Vítej zpět, ' + name + '! 👋', 'good');
        // nabídni denní bonus
        var st = Account.bonusState();
        if (st.daily) setTimeout(openBonus, 600);
    }

    /* ---------- Lobby ---------- */
    function gameTypeLabel(g) {
        if (g.type === 'tumble') return g.reels + '×' + g.rows + ' · padající symboly';
        return g.reels + '×' + g.rows + ' · ' + g.paylines.length + ' linií';
    }

    function goLobby() {
        renderLobby();
        show('lobby');
    }

    function renderLobby() {
        var a = Account.current(); if (!a) return;
        var scr = $('#screen-lobby');
        scr.innerHTML = '';

        var hero = el('div', 'lobby-hero');
        hero.innerHTML =
            '<div class="hero-text"><h1>Ahoj, ' + a.name + '! 🎰</h1>' +
            '<p>Vyber si jeden z ' + GAMES.length + ' automatů a roztoč štěstí. Hodně zdaru!</p></div>' +
            '<div class="hero-stats">' +
            '<div class="hs"><label>Kredit</label><b>🪙 ' + fmt(a.balance) + '</b></div>' +
            '<div class="hs"><label>Zatočení</label><b>' + fmt(a.stats.spins) + '</b></div>' +
            '<div class="hs"><label>Největší výhra</label><b>' + fmt(a.stats.biggest) + '</b></div>' +
            '</div>';
        scr.appendChild(hero);

        scr.appendChild(el('h2', 'section-title', '🎰 Herna — automaty'));
        var grid = el('div', 'game-grid');
        GAMES.forEach(function (g) {
            var card = el('button', 'game-card');
            card.style.setProperty('--a', g.theme.a);
            card.style.setProperty('--b', g.theme.b);
            card.style.background = g.theme.bg;
            card.innerHTML =
                '<div class="gc-badges"><span class="gc-rtp">RTP ' + g.rtp + '%</span><span class="gc-vol">' + g.volatility + '</span></div>' +
                '<div class="gc-emoji">' + g.emoji + '</div>' +
                '<div class="gc-name">' + g.name + '</div>' +
                '<div class="gc-tag">' + g.tagline + '</div>' +
                '<div class="gc-meta">' + gameTypeLabel(g) + (g.freeSpins ? ' · 🎁 free spins' : '') + '</div>' +
                '<div class="gc-play">HRÁT ▶</div>';
            card.onclick = function () { Casino.Sound.unlock(); Casino.Sound.click(); openGame(g); };
            grid.appendChild(card);
        });
        scr.appendChild(grid);

        // poslední výhry
        if (a.history && a.history.length) {
            scr.appendChild(el('h2', 'section-title', '🏆 Tvé poslední výhry'));
            var ticker = el('div', 'win-ticker');
            a.history.slice(0, 12).forEach(function (h) {
                var g = Casino.getGame(h.g);
                ticker.appendChild(el('div', 'wt-item', (g ? g.emoji : '🎰') + ' <b>+' + fmt(h.win) + '</b> <small>' + (g ? g.name : '') + '</small>'));
            });
            scr.appendChild(ticker);
        }

        scr.appendChild(el('p', 'lobby-disclaimer',
            '⚠️ Pouze pro zábavu — hraje se za virtuální kredity bez reálné hodnoty. Žádné skutečné peníze.'));
    }

    /* ---------- Hra ---------- */
    var currentMachine = null;
    function openGame(g) {
        show('game');
        var mount = $('#machine-mount');
        if (currentMachine) currentMachine.destroy();
        currentMachine = Casino.Slot.open(g, mount, {
            onExit: function () { currentMachine = null; goLobby(); },
            onBroke: function () { openBonus(); }
        });
    }

    /* ======================================================================
       Bonus
       ===================================================================== */
    function openBonus() {
        var st = Account.bonusState();
        var body = el('div', 'bonus-box');
        var html = '<p>Tvůj kredit: <b>🪙 ' + fmt(Account.getBalance()) + '</b></p>';
        body.innerHTML = html;

        var dailyBtn = el('button', 'bonus-claim' + (st.daily ? '' : ' done'),
            st.daily ? '🎁 Denní bonus: +' + fmt(st.dailyAmount) : '✓ Denní bonus vyzvednut');
        dailyBtn.disabled = !st.daily;
        dailyBtn.onclick = function () {
            var got = Account.claimDaily();
            if (got) { refreshHeader(); Casino.UI.toast('Denní bonus +' + fmt(got) + ' 🎉', 'good'); Casino.Sound.win(2); }
            dailyBtn.disabled = true; dailyBtn.classList.add('done'); dailyBtn.textContent = '✓ Denní bonus vyzvednut';
            refreshBonusBtn();
        };
        body.appendChild(dailyBtn);

        if (!st.daily) {
            var h = Math.ceil(st.dailyIn / 3600000);
            body.appendChild(el('p', 'bonus-timer', 'Další denní bonus za ~' + h + ' h.'));
        }

        var rescueBtn = el('button', 'bonus-claim' + (st.rescue ? '' : ' done'),
            st.rescue ? '🆘 Záchranný balíček: +' + fmt(st.rescueAmount) : 'Záchrana dostupná pod ' + fmt(500) + ' kredity');
        rescueBtn.disabled = !st.rescue;
        rescueBtn.onclick = function () {
            var got = Account.claimRescue();
            if (got) { refreshHeader(); Casino.UI.toast('Záchranný balíček +' + fmt(got) + ' 💪', 'good'); Casino.Sound.win(1); }
            rescueBtn.disabled = true; rescueBtn.classList.add('done');
            refreshBonusBtn();
        };
        body.appendChild(rescueBtn);
        body.appendChild(el('p', 'bonus-note', 'Bonusy zajišťují, že si vždycky můžeš zahrát dál. 😉'));

        Casino.UI.modal({ title: '🎁 Bonusy', body: body });
    }

    /* ======================================================================
       Statistiky
       ===================================================================== */
    function openStats() {
        var a = Account.current(); if (!a) return;
        var s = a.stats;
        var net = s.won - s.wagered;
        var body = el('div', 'stats-box');
        body.innerHTML =
            '<div class="stat-grid">' +
            '<div class="st"><label>Zatočení</label><b>' + fmt(s.spins) + '</b></div>' +
            '<div class="st"><label>Vsazeno</label><b>' + fmt(s.wagered) + '</b></div>' +
            '<div class="st"><label>Vyhráno</label><b>' + fmt(s.won) + '</b></div>' +
            '<div class="st"><label>Bilance</label><b class="' + (net >= 0 ? 'pos' : 'neg') + '">' + (net >= 0 ? '+' : '') + fmt(net) + '</b></div>' +
            '<div class="st"><label>Největší výhra</label><b>' + fmt(s.biggest) + '</b></div>' +
            '<div class="st"><label>Kredit</label><b>🪙 ' + fmt(a.balance) + '</b></div>' +
            '</div>';
        var byGame = Object.keys(s.byGame);
        if (byGame.length) {
            var tbl = el('table', 'stats-table');
            tbl.innerHTML = '<thead><tr><th>Automat</th><th>Zatočení</th><th>Bilance</th></tr></thead>';
            var tb = el('tbody');
            byGame.forEach(function (id) {
                var g = Casino.getGame(id), gg = s.byGame[id], n = gg.won - gg.wagered;
                var tr = el('tr', null, '<td>' + (g ? g.emoji + ' ' + g.name : id) + '</td><td>' + fmt(gg.spins) +
                    '</td><td class="' + (n >= 0 ? 'pos' : 'neg') + '">' + (n >= 0 ? '+' : '') + fmt(n) + '</td>');
                tb.appendChild(tr);
            });
            tbl.appendChild(tb);
            body.appendChild(el('h4', null, 'Podle automatu'));
            body.appendChild(tbl);
        }
        Casino.UI.modal({ title: '📊 Statistiky — ' + a.name, body: body });
    }

    /* ======================================================================
       Účet menu
       ===================================================================== */
    function openUserMenu() {
        var a = Account.current();
        var body = el('div', 'user-menu');
        body.innerHTML = '<p>Přihlášen jako <b>' + a.name + '</b></p>';
        var bSwitch = el('button', 'btn-secondary', '🔁 Přepnout / nový účet');
        bSwitch.onclick = function () { m.close(); Account.logout(); refreshHeader(); renderLogin(); show('login'); };
        var bLogout = el('button', 'btn-secondary', '🚪 Odhlásit se');
        bLogout.onclick = function () { m.close(); Account.logout(); refreshHeader(); renderLogin(); show('login'); };
        body.appendChild(bSwitch); body.appendChild(bLogout);
        var m = Casino.UI.modal({ title: '👤 Účet', body: body });
    }

    /* ======================================================================
       Init
       ===================================================================== */
    function init() {
        Account.init();

        // hlavička – tlačítka
        $('#brand').onclick = function () { if (Account.isLoggedIn()) { if (currentMachine) { currentMachine.destroy(); currentMachine = null; } goLobby(); } };
        $('#btn-lobby').onclick = function () { Casino.Sound.click(); if (currentMachine) { currentMachine.destroy(); currentMachine = null; } goLobby(); };
        $('#btn-bonus').onclick = function () { Casino.Sound.unlock(); Casino.Sound.click(); openBonus(); };
        $('#btn-stats').onclick = function () { Casino.Sound.click(); openStats(); };
        $('#btn-user').onclick = function () { Casino.Sound.click(); openUserMenu(); };

        // aktualizace kreditu při změně
        Casino.bus.on('balance', function (b) { animateBalance(b); });

        // odemkni zvuk na první interakci
        var unlock = function () { Casino.Sound.unlock(); document.removeEventListener('pointerdown', unlock); };
        document.addEventListener('pointerdown', unlock);

        if (Account.isLoggedIn()) { refreshHeader(); goLobby(); }
        else { renderLogin(); show('login'); }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})(typeof window !== 'undefined' ? window : global);
