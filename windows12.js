// === Windows 12 — main script ===
(function () {
    'use strict';

    // ---------- State ----------
    const state = {
        windows: new Map(),
        nextId: 1,
        nextZ: 100,
        focusedId: null,
        theme: localStorage.getItem('w12-theme') || 'dark',
        wallpaper: localStorage.getItem('w12-wallpaper') || '1',
        toggles: {
            wifi: true,
            bt: false,
            flight: false,
            battery: false,
            night: false,
            theme: false
        }
    };

    // ---------- App registry ----------
    const apps = {
        notepad:    { name: 'Poznámkový blok', icon: '📝', factory: createNotepad,    w: 560, h: 420 },
        calculator: { name: 'Kalkulačka',      icon: '🧮', factory: createCalculator, w: 320, h: 460 },
        explorer:   { name: 'Průzkumník',      icon: '📁', factory: createExplorer,   w: 720, h: 480 },
        settings:   { name: 'Nastavení',       icon: '⚙️', factory: createSettings,   w: 760, h: 520 },
        browser:    { name: 'Edge',            icon: '🌐', factory: createBrowser,    w: 800, h: 560 },
        terminal:   { name: 'Terminal',        icon: '⌨️', factory: createTerminal,   w: 640, h: 400 },
        paint:      { name: 'Malování',        icon: '🎨', factory: createPaint,      w: 720, h: 520 },
        photos:     { name: 'Fotky',           icon: '🖼️', factory: createPhotos,     w: 640, h: 480 },
        clock:      { name: 'Hodiny',          icon: '🕒', factory: createClock,      w: 460, h: 420 },
        about:      { name: 'O systému',       icon: 'ⓘ',  factory: createAbout,      w: 580, h: 480 },
        store:      { name: 'Microsoft Store', icon: '🛍️', factory: createStore,      w: 720, h: 520 },
        game:       { name: 'Piškvorky',       icon: '🎮', factory: createGame,       w: 360, h: 480 },
        search:     { name: 'Hledat',          icon: '🔍', factory: createSearch,     w: 540, h: 360 }
    };

    const pinnedApps = ['notepad', 'calculator', 'explorer', 'browser', 'settings', 'paint',
                        'terminal', 'photos', 'clock', 'store', 'game', 'about'];
    const desktopApps = ['explorer', 'browser', 'notepad', 'calculator', 'paint', 'store'];

    // ---------- Helpers ----------
    const $ = id => document.getElementById(id);
    const make = (tag, attrs = {}, ...kids) => {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) {
            if (k === 'class') el.className = v;
            else if (k === 'html') el.innerHTML = v;
            else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
            else if (v === false || v == null) continue;
            else if (v === true) el.setAttribute(k, '');
            else el.setAttribute(k, v);
        }
        for (const k of kids) {
            if (k == null) continue;
            el.append(k instanceof Node ? k : document.createTextNode(String(k)));
        }
        return el;
    };

    function applyTheme() {
        document.body.classList.toggle('light', state.theme === 'light');
        state.toggles.theme = state.theme === 'light';
        localStorage.setItem('w12-theme', state.theme);
        updateActionCenterTiles();
    }

    function applyWallpaper() {
        const desk = $('desktop');
        if (desk) desk.dataset.wallpaper = state.wallpaper;
        localStorage.setItem('w12-wallpaper', state.wallpaper);
    }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function formatTime(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
    function formatTimeLong(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
    function formatDateShort(d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }
    function formatDateLong(d) {
        const days = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
        const months = ['ledna', 'února', 'března', 'dubna', 'května', 'června',
                        'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
        return days[d.getDay()] + ', ' + d.getDate() + '. ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    function toast(title, body) {
        const c = $('toast-container');
        if (!c) return;
        const t = make('div', { class: 'toast' },
            make('div', { class: 'toast-title' }, title),
            make('div', { class: 'toast-body' }, body || ''));
        c.append(t);
        setTimeout(() => {
            t.style.transition = 'opacity .3s, transform .3s';
            t.style.opacity = '0';
            t.style.transform = 'translateX(20px)';
            setTimeout(() => t.remove(), 320);
        }, 4000);
    }

    // ---------- Boot sequence ----------
    function boot() {
        applyTheme();
        applyWallpaper();
        setTimeout(() => {
            $('boot-screen').classList.add('hidden');
            showLockScreen();
        }, 1600);
    }

    function showLockScreen() {
        const lock = $('lock-screen');
        lock.classList.remove('hidden');
        updateLockClock();
        lock.onclick = unlockToLogin;
        document.addEventListener('keydown', lockKeyHandler);
    }

    function lockKeyHandler(e) {
        if ($('lock-screen').classList.contains('hidden')) return;
        if (e.key === 'Escape') return;
        unlockToLogin();
    }

    function unlockToLogin() {
        $('lock-screen').classList.add('hidden');
        document.removeEventListener('keydown', lockKeyHandler);
        const login = $('login-screen');
        login.classList.remove('hidden');
        const input = $('login-password');
        setTimeout(() => input.focus(), 50);
        const finish = () => {
            login.classList.add('hidden');
            showDesktop();
        };
        $('login-button').onclick = finish;
        input.onkeydown = e => { if (e.key === 'Enter') finish(); };
    }

    function updateLockClock() {
        const lc = $('lock-clock');
        const ld = $('lock-date');
        if (!lc) return;
        const d = new Date();
        lc.textContent = formatTime(d);
        ld.textContent = formatDateLong(d);
    }

    function showDesktop() {
        $('desktop').classList.remove('hidden');
        startClock();
        renderDesktopIcons();
        renderStartMenu();
        renderTaskbarPinnedApps();
        bindTaskbarEvents();
        bindGlobalEvents();
        toast('Vítejte ve Windows 12', 'Systém je připraven k použití.');
    }

    // ---------- Clock ----------
    function startClock() {
        const update = () => {
            const d = new Date();
            const t = $('tb-time');
            const dt = $('tb-date');
            if (t) t.textContent = formatTime(d);
            if (dt) dt.textContent = formatDateShort(d);
            updateLockClock();
            const cal = $('cal-time');
            const cald = $('cal-date');
            if (cal && !$('calendar-flyout').classList.contains('hidden')) {
                cal.textContent = formatTimeLong(d);
                cald.textContent = formatDateLong(d);
            }
        };
        update();
        setInterval(update, 1000);
    }

    // ---------- Desktop icons ----------
    function renderDesktopIcons() {
        const c = $('desktop-icons');
        c.innerHTML = '';
        const icons = [{ id: 'recycle', name: 'Koš', icon: '🗑️' }];
        desktopApps.forEach(id => {
            icons.push({ id: id, name: apps[id].name, icon: apps[id].icon });
        });
        icons.forEach(i => {
            const el = make('div', {
                class: 'desktop-icon',
                tabindex: '0',
                'data-app': i.id
            },
                make('div', { class: 'desktop-icon-img' }, i.icon),
                make('div', { class: 'desktop-icon-label' }, i.name));
            el.addEventListener('dblclick', () => {
                if (i.id === 'recycle') {
                    toast('Koš', 'Koš je prázdný.');
                } else {
                    openApp(i.id);
                }
            });
            el.addEventListener('click', ev => {
                document.querySelectorAll('.desktop-icon.selected').forEach(n => n.classList.remove('selected'));
                el.classList.add('selected');
                ev.stopPropagation();
            });
            c.append(el);
        });
    }

    // ---------- Start menu ----------
    function renderStartMenu() {
        const pinned = $('start-pinned');
        const recommended = $('start-recommended');
        pinned.innerHTML = '';
        recommended.innerHTML = '';

        pinnedApps.forEach(id => {
            const a = apps[id];
            if (!a) return;
            const tile = make('div', { class: 'start-tile', 'data-app': id },
                make('div', { class: 'start-tile-icon' }, a.icon),
                make('div', { class: 'start-tile-label' }, a.name));
            tile.addEventListener('click', () => {
                hideStartMenu();
                openApp(id);
            });
            pinned.append(tile);
        });

        const recent = ['notepad', 'browser', 'photos', 'clock'];
        recent.forEach(id => {
            const a = apps[id];
            if (!a) return;
            const it = make('div', { class: 'start-rec-item' },
                make('div', { class: 'start-rec-icon' }, a.icon),
                make('div', { class: 'start-rec-info' },
                    make('div', { class: 'start-rec-name' }, a.name),
                    make('div', { class: 'start-rec-meta' }, 'Naposledy použito')));
            it.addEventListener('click', () => {
                hideStartMenu();
                openApp(id);
            });
            recommended.append(it);
        });

        const search = $('start-search-input');
        search.addEventListener('input', () => {
            const q = search.value.trim().toLowerCase();
            if (!q) {
                Array.from(pinned.children).forEach(c => c.style.display = '');
                return;
            }
            Array.from(pinned.children).forEach(c => {
                const name = c.querySelector('.start-tile-label').textContent.toLowerCase();
                c.style.display = name.includes(q) ? '' : 'none';
            });
        });
        search.addEventListener('keydown', e => {
            if (e.key !== 'Enter') return;
            const visible = Array.from(pinned.children).find(c => c.style.display !== 'none');
            if (visible) {
                hideStartMenu();
                openApp(visible.dataset.app);
            }
        });
    }

    function showStartMenu() {
        hideAllFlyouts();
        const sm = $('start-menu');
        sm.classList.remove('hidden');
        $('tb-start').classList.add('active');
        const input = $('start-search-input');
        input.value = '';
        Array.from($('start-pinned').children).forEach(c => c.style.display = '');
        setTimeout(() => input.focus(), 50);
    }
    function hideStartMenu() {
        $('start-menu').classList.add('hidden');
        $('tb-start').classList.remove('active');
        $('power-menu').classList.add('hidden');
    }

    // ---------- Taskbar pinned apps ----------
    function renderTaskbarPinnedApps() {
        const c = $('tb-apps');
        c.innerHTML = '';
        ['explorer', 'browser', 'notepad', 'paint'].forEach(id => {
            const a = apps[id];
            if (!a) return;
            const btn = make('button', { class: 'tb-app', 'data-app': id, title: a.name }, a.icon);
            btn.addEventListener('click', () => toggleAppFromTaskbar(id));
            c.append(btn);
        });
    }

    function updateTaskbarAppState() {
        const buttons = $('tb-apps').querySelectorAll('.tb-app');
        const appWindowCounts = {};
        state.windows.forEach(w => {
            appWindowCounts[w.appId] = (appWindowCounts[w.appId] || 0) + 1;
        });
        buttons.forEach(b => {
            const id = b.dataset.app;
            b.classList.toggle('has-window', !!appWindowCounts[id]);
            const fw = state.focusedId ? state.windows.get(state.focusedId) : null;
            b.classList.toggle('focused', !!(fw && fw.appId === id));
        });
    }

    function toggleAppFromTaskbar(id) {
        const existing = [...state.windows.values()].filter(w => w.appId === id);
        if (existing.length === 0) {
            openApp(id);
            return;
        }
        const focused = state.focusedId && state.windows.get(state.focusedId);
        if (focused && focused.appId === id) {
            minimizeWindow(focused.id);
        } else {
            const target = existing.find(w => w.minimized) || existing[0];
            if (target.minimized) restoreWindow(target.id);
            focusWindow(target.id);
        }
    }

    // ---------- Flyouts ----------
    function hideAllFlyouts() {
        $('start-menu').classList.add('hidden');
        $('action-center').classList.add('hidden');
        $('calendar-flyout').classList.add('hidden');
        $('power-menu').classList.add('hidden');
        $('context-menu').classList.add('hidden');
        $('tb-start').classList.remove('active');
        $('tb-tray').classList.remove('active');
        $('tb-clock').classList.remove('active');
    }

    function bindTaskbarEvents() {
        $('tb-start').addEventListener('click', e => {
            e.stopPropagation();
            if ($('start-menu').classList.contains('hidden')) showStartMenu();
            else hideStartMenu();
        });

        $('tb-tray').addEventListener('click', e => {
            e.stopPropagation();
            const ac = $('action-center');
            if (ac.classList.contains('hidden')) {
                hideAllFlyouts();
                ac.classList.remove('hidden');
                $('tb-tray').classList.add('active');
                updateActionCenterTiles();
            } else {
                ac.classList.add('hidden');
                $('tb-tray').classList.remove('active');
            }
        });

        $('tb-clock').addEventListener('click', e => {
            e.stopPropagation();
            const cf = $('calendar-flyout');
            if (cf.classList.contains('hidden')) {
                hideAllFlyouts();
                cf.classList.remove('hidden');
                $('tb-clock').classList.add('active');
                renderCalendar();
            } else {
                cf.classList.add('hidden');
                $('tb-clock').classList.remove('active');
            }
        });

        $('tb-show-desktop').addEventListener('click', () => {
            const allMin = [...state.windows.values()].every(w => w.minimized);
            state.windows.forEach(w => {
                if (allMin) restoreWindow(w.id);
                else if (!w.minimized) minimizeWindow(w.id);
            });
        });

        $('tb-widgets').addEventListener('click', () => {
            toast('Widgety', 'Počasí, zprávy a kalendář.');
        });

        $('start-power').addEventListener('click', e => {
            e.stopPropagation();
            const pm = $('power-menu');
            pm.classList.toggle('hidden');
        });

        $('power-menu').addEventListener('click', e => {
            const item = e.target.closest('.power-item');
            if (!item) return;
            handlePower(item.dataset.power);
        });

        $('action-center').addEventListener('click', e => {
            const tile = e.target.closest('.ac-tile');
            if (!tile) return;
            toggleAcTile(tile.dataset.toggle);
        });

        $('ac-brightness').addEventListener('input', e => {
            const desk = $('desktop');
            desk.style.filter = `brightness(${(40 + +e.target.value * 0.6) / 100})`;
        });
        $('ac-volume').addEventListener('input', () => {});
    }

    function toggleAcTile(key) {
        if (key === 'theme') {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            applyTheme();
            return;
        }
        state.toggles[key] = !state.toggles[key];
        updateActionCenterTiles();
        if (key === 'flight' && state.toggles.flight) {
            state.toggles.wifi = false;
            state.toggles.bt = false;
            updateActionCenterTiles();
            toast('Letový režim', 'Bezdrátové připojení vypnuto.');
        }
        if (key === 'night') {
            document.body.style.filter = state.toggles.night ? 'sepia(.3) hue-rotate(-10deg)' : '';
        }
    }

    function updateActionCenterTiles() {
        document.querySelectorAll('.ac-tile').forEach(t => {
            t.classList.toggle('on', !!state.toggles[t.dataset.toggle]);
        });
    }

    function renderCalendar() {
        const grid = $('cal-grid');
        grid.innerHTML = '';
        const heads = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
        heads.forEach(h => grid.append(make('div', { class: 'cal-head' }, h)));
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDow = (first.getDay() + 6) % 7;
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        for (let i = firstDow - 1; i >= 0; i--) {
            grid.append(make('div', { class: 'cal-day muted' }, prevMonthDays - i));
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const cls = 'cal-day' + (d === now.getDate() ? ' today' : '');
            grid.append(make('div', { class: cls }, d));
        }
        const used = firstDow + daysInMonth;
        const trailing = (7 - (used % 7)) % 7;
        for (let i = 1; i <= trailing; i++) {
            grid.append(make('div', { class: 'cal-day muted' }, i));
        }
    }

    // ---------- Power ----------
    function handlePower(action) {
        hideAllFlyouts();
        if (action === 'lock') {
            $('desktop').classList.add('hidden');
            showLockScreen();
        } else if (action === 'sleep') {
            $('desktop').classList.add('hidden');
            showLockScreen();
        } else if (action === 'restart' || action === 'shutdown') {
            $('desktop').classList.add('hidden');
            const boot = $('boot-screen');
            boot.querySelector('.boot-text').textContent =
                action === 'shutdown' ? 'Vypínání...' : 'Restartování...';
            boot.classList.remove('hidden');
            if (action === 'restart') {
                setTimeout(() => location.reload(), 1500);
            }
        }
    }

    // ---------- Global events ----------
    function bindGlobalEvents() {
        const desk = $('desktop');

        desk.addEventListener('click', e => {
            if (e.target === desk || e.target.classList.contains('desktop-icons')) {
                hideAllFlyouts();
                document.querySelectorAll('.desktop-icon.selected').forEach(n => n.classList.remove('selected'));
            } else if (!e.target.closest('.start-menu, .action-center, .calendar-flyout, .taskbar, .power-menu, .context-menu, .window')) {
                hideAllFlyouts();
            }
        });

        desk.addEventListener('contextmenu', e => {
            if (e.target.closest('.window, .taskbar, .start-menu, .action-center, .calendar-flyout')) return;
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY);
        });

        $('context-menu').addEventListener('click', e => {
            const item = e.target.closest('.ctx-item');
            if (!item) return;
            handleContextAction(item.dataset.action);
            $('context-menu').classList.add('hidden');
        });

        document.addEventListener('keydown', e => {
            if ($('desktop').classList.contains('hidden')) return;
            if (e.key === 'Escape') {
                hideAllFlyouts();
            }
            // Super/Meta key or Ctrl+Esc opens Start
            if ((e.key === 'Meta' || (e.ctrlKey && e.key === 'Escape'))) {
                e.preventDefault();
                if ($('start-menu').classList.contains('hidden')) showStartMenu();
                else hideStartMenu();
            }
        });
    }

    function showContextMenu(x, y) {
        hideAllFlyouts();
        const m = $('context-menu');
        m.classList.remove('hidden');
        const rect = m.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width - 8;
        const maxY = window.innerHeight - rect.height - 8;
        m.style.left = Math.min(x, maxX) + 'px';
        m.style.top = Math.min(y, maxY) + 'px';
    }

    function handleContextAction(action) {
        if (action === 'refresh') {
            renderDesktopIcons();
            toast('Plocha', 'Plocha byla obnovena.');
        } else if (action === 'new-folder') {
            toast('Nová složka', 'Funkce v demu není dostupná.');
        } else if (action === 'theme') {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            applyTheme();
        } else if (action === 'wallpaper') {
            openApp('settings', { panel: 'personalization' });
        } else if (action === 'about') {
            openApp('about');
        }
    }

    // ---------- Window management ----------
    function openApp(appId, opts) {
        const app = apps[appId];
        if (!app) return;
        const id = state.nextId++;
        const container = $('window-container');

        const w = make('div', {
            class: 'window opening focused',
            'data-id': id,
            'data-app': appId
        });
        const z = ++state.nextZ;
        w.style.zIndex = z;

        const desk = $('desktop').getBoundingClientRect();
        const width = Math.min(app.w, desk.width - 40);
        const height = Math.min(app.h, desk.height - 80);
        const offset = (state.windows.size % 6) * 24;
        const left = Math.max(20, (desk.width - width) / 2 + offset - 60);
        const top = Math.max(20, (desk.height - height) / 2 + offset - 80);

        w.style.left = left + 'px';
        w.style.top = top + 'px';
        w.style.width = width + 'px';
        w.style.height = height + 'px';

        const titlebar = make('div', { class: 'window-titlebar' },
            make('div', { class: 'window-title' },
                make('span', { class: 'window-title-icon' }, app.icon),
                make('span', {}, app.name)
            ),
            make('div', { class: 'window-controls' },
                make('button', { class: 'win-ctrl min', title: 'Minimalizovat', html: '&#x2014;' }),
                make('button', { class: 'win-ctrl max', title: 'Maximalizovat', html: '&#x25A1;' }),
                make('button', { class: 'win-ctrl close', title: 'Zavřít', html: '&#x2715;' })
            )
        );
        const body = make('div', { class: 'window-body app-' + appId });
        w.append(titlebar, body);

        ['r-t', 'r-r', 'r-b', 'r-l', 'r-tl', 'r-tr', 'r-bl', 'r-br'].forEach(c => {
            w.append(make('div', { class: 'window-resize ' + c, 'data-dir': c.slice(2) }));
        });

        container.append(w);

        const winObj = { id, appId, el: w, body, title: app.name, minimized: false, maximized: false, savedRect: null };
        state.windows.set(id, winObj);

        // App content
        try {
            app.factory(body, winObj, opts || {});
        } catch (err) {
            body.innerHTML = '<div style="padding:20px;color:#ff6b6b">Chyba při načítání aplikace: ' + escapeHtml(err.message) + '</div>';
            console.error(err);
        }

        // Window event wiring
        titlebar.addEventListener('mousedown', e => {
            if (e.target.closest('.window-controls')) return;
            if (winObj.maximized) return;
            startDrag(winObj, e);
        });
        titlebar.addEventListener('dblclick', e => {
            if (e.target.closest('.window-controls')) return;
            toggleMaximize(winObj);
        });
        w.addEventListener('mousedown', () => focusWindow(id));

        titlebar.querySelector('.min').addEventListener('click', () => minimizeWindow(id));
        titlebar.querySelector('.max').addEventListener('click', () => toggleMaximize(winObj));
        titlebar.querySelector('.close').addEventListener('click', () => closeWindow(id));

        w.querySelectorAll('.window-resize').forEach(rz => {
            rz.addEventListener('mousedown', e => startResize(winObj, rz.dataset.dir, e));
        });

        setTimeout(() => w.classList.remove('opening'), 240);
        focusWindow(id);
        updateTaskbarAppState();
        return winObj;
    }

    function focusWindow(id) {
        const w = state.windows.get(id);
        if (!w) return;
        if (w.minimized) restoreWindow(id);
        state.focusedId = id;
        state.nextZ++;
        w.el.style.zIndex = state.nextZ;
        state.windows.forEach(other => other.el.classList.toggle('focused', other.id === id));
        updateTaskbarAppState();
    }

    function closeWindow(id) {
        const w = state.windows.get(id);
        if (!w) return;
        w.el.classList.add('closing');
        setTimeout(() => {
            w.el.remove();
            state.windows.delete(id);
            if (state.focusedId === id) {
                state.focusedId = null;
                const next = [...state.windows.values()].pop();
                if (next && !next.minimized) focusWindow(next.id);
            }
            updateTaskbarAppState();
        }, 180);
    }

    function minimizeWindow(id) {
        const w = state.windows.get(id);
        if (!w || w.minimized) return;
        w.el.classList.add('minimizing');
        setTimeout(() => {
            w.el.classList.remove('minimizing');
            w.el.style.display = 'none';
            w.minimized = true;
            if (state.focusedId === id) state.focusedId = null;
            updateTaskbarAppState();
        }, 220);
    }

    function restoreWindow(id) {
        const w = state.windows.get(id);
        if (!w) return;
        w.minimized = false;
        w.el.style.display = '';
        w.el.classList.add('opening');
        setTimeout(() => w.el.classList.remove('opening'), 240);
        focusWindow(id);
    }

    function toggleMaximize(w) {
        if (w.maximized) {
            w.maximized = false;
            w.el.classList.remove('maximized');
            if (w.savedRect) {
                w.el.style.left = w.savedRect.left;
                w.el.style.top = w.savedRect.top;
                w.el.style.width = w.savedRect.width;
                w.el.style.height = w.savedRect.height;
            }
        } else {
            w.savedRect = {
                left: w.el.style.left,
                top: w.el.style.top,
                width: w.el.style.width,
                height: w.el.style.height
            };
            w.maximized = true;
            w.el.classList.add('maximized');
        }
        focusWindow(w.id);
    }

    function startDrag(w, ev) {
        ev.preventDefault();
        const startX = ev.clientX;
        const startY = ev.clientY;
        const rect = w.el.getBoundingClientRect();
        const origLeft = rect.left;
        const origTop = rect.top;

        const onMove = e => {
            const nx = origLeft + (e.clientX - startX);
            const ny = origTop + (e.clientY - startY);
            const maxX = window.innerWidth - 80;
            const maxY = window.innerHeight - 80;
            w.el.style.left = Math.max(-rect.width + 80, Math.min(nx, maxX)) + 'px';
            w.el.style.top = Math.max(0, Math.min(ny, maxY)) + 'px';
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        focusWindow(w.id);
    }

    function startResize(w, dir, ev) {
        if (w.maximized) return;
        ev.preventDefault();
        ev.stopPropagation();
        const startX = ev.clientX;
        const startY = ev.clientY;
        const rect = w.el.getBoundingClientRect();
        const minW = 320;
        const minH = 200;
        const onMove = e => {
            let nx = rect.left, ny = rect.top, nw = rect.width, nh = rect.height;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (dir.includes('r')) nw = Math.max(minW, rect.width + dx);
            if (dir.includes('b')) nh = Math.max(minH, rect.height + dy);
            if (dir.includes('l')) {
                const candW = rect.width - dx;
                if (candW >= minW) { nw = candW; nx = rect.left + dx; }
            }
            if (dir.includes('t')) {
                const candH = rect.height - dy;
                if (candH >= minH) { nh = candH; ny = rect.top + dy; }
            }
            w.el.style.left = nx + 'px';
            w.el.style.top = ny + 'px';
            w.el.style.width = nw + 'px';
            w.el.style.height = nh + 'px';
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        focusWindow(w.id);
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ====================================================================
    //                              APPS
    // ====================================================================

    // ---------- Notepad ----------
    function createNotepad(body) {
        const saved = localStorage.getItem('w12-notepad') || '';
        const ta = make('textarea', {
            spellcheck: 'false',
            placeholder: 'Začněte psát...'
        });
        ta.value = saved;
        ta.addEventListener('input', () => {
            localStorage.setItem('w12-notepad', ta.value);
        });
        body.append(ta);
    }

    // ---------- Calculator ----------
    function createCalculator(body) {
        const root = make('div', { class: 'app-calculator' });
        const prev = make('div', { class: 'calc-prev' });
        const curr = make('div', { class: 'calc-curr' }, '0');
        root.append(make('div', { class: 'calc-display' }, prev, curr));
        const keysWrap = make('div', { class: 'calc-keys' });

        let display = '0';
        let firstOperand = null;
        let pendingOp = null;
        let waitingForSecond = false;

        function updateDisplay() {
            curr.textContent = display.length > 16 ? Number(display).toPrecision(10) : display;
        }
        function input(d) {
            if (waitingForSecond) { display = '0'; waitingForSecond = false; }
            if (d === '.') {
                if (!display.includes('.')) display += '.';
            } else if (display === '0') display = d;
            else display += d;
            updateDisplay();
        }
        function operate(op) {
            const v = parseFloat(display);
            if (pendingOp && !waitingForSecond) {
                const result = calc(firstOperand, v, pendingOp);
                display = String(result);
                firstOperand = result;
                updateDisplay();
            } else {
                firstOperand = v;
            }
            pendingOp = op;
            waitingForSecond = true;
            prev.textContent = formatNumber(firstOperand) + ' ' + opSym(op);
        }
        function equals() {
            if (pendingOp == null) return;
            const v = parseFloat(display);
            const result = calc(firstOperand, v, pendingOp);
            prev.textContent = formatNumber(firstOperand) + ' ' + opSym(pendingOp) + ' ' + formatNumber(v) + ' =';
            display = String(result);
            firstOperand = null;
            pendingOp = null;
            waitingForSecond = true;
            updateDisplay();
        }
        function calc(a, b, op) {
            if (op === '+') return a + b;
            if (op === '-') return a - b;
            if (op === '*') return a * b;
            if (op === '/') return b === 0 ? 'Nelze dělit nulou' : a / b;
            return b;
        }
        function opSym(op) { return { '+': '+', '-': '−', '*': '×', '/': '÷' }[op] || op; }
        function formatNumber(n) { return typeof n === 'number' ? +n.toPrecision(12) : n; }
        function clear() { display = '0'; firstOperand = null; pendingOp = null; waitingForSecond = false; prev.textContent = ''; updateDisplay(); }
        function backspace() {
            if (waitingForSecond) return;
            display = display.length <= 1 ? '0' : display.slice(0, -1);
            updateDisplay();
        }
        function negate() {
            if (display === '0') return;
            display = display.startsWith('-') ? display.slice(1) : '-' + display;
            updateDisplay();
        }
        function percent() {
            display = String(parseFloat(display) / 100);
            updateDisplay();
        }

        const keys = [
            ['C', 'clear', clear],
            ['±', 'fn', negate],
            ['%', 'fn', percent],
            ['÷', 'op', () => operate('/')],
            ['7', 'num', () => input('7')],
            ['8', 'num', () => input('8')],
            ['9', 'num', () => input('9')],
            ['×', 'op', () => operate('*')],
            ['4', 'num', () => input('4')],
            ['5', 'num', () => input('5')],
            ['6', 'num', () => input('6')],
            ['−', 'op', () => operate('-')],
            ['1', 'num', () => input('1')],
            ['2', 'num', () => input('2')],
            ['3', 'num', () => input('3')],
            ['+', 'op', () => operate('+')],
            ['⌫', 'fn', backspace],
            ['0', 'num', () => input('0')],
            ['.', 'num', () => input('.')],
            ['=', 'eq', equals]
        ];
        keys.forEach(([label, cls, fn]) => {
            const b = make('button', { class: 'calc-key ' + cls, type: 'button' }, label);
            b.addEventListener('click', fn);
            keysWrap.append(b);
        });
        root.append(keysWrap);
        body.append(root);
    }

    // ---------- Explorer ----------
    function createExplorer(body) {
        const tree = {
            'Tento počítač': {
                'Plocha': {
                    'Vítejte.txt': { type: 'file', icon: '📄', size: '1 KB' },
                    'Poznámky.txt': { type: 'file', icon: '📄', size: '2 KB' }
                },
                'Dokumenty': {
                    'Práce': {
                        'Projekt.docx': { type: 'file', icon: '📘', size: '24 KB' },
                        'Rozpočet.xlsx': { type: 'file', icon: '📊', size: '18 KB' }
                    },
                    'Život.docx': { type: 'file', icon: '📘', size: '12 KB' }
                },
                'Obrázky': {
                    'Krajinka.jpg': { type: 'file', icon: '🖼️', size: '1.2 MB' },
                    'Selfie.png': { type: 'file', icon: '🖼️', size: '850 KB' },
                    'Mem.gif': { type: 'file', icon: '🖼️', size: '420 KB' }
                },
                'Hudba': {
                    'Píseň.mp3': { type: 'file', icon: '🎵', size: '4.5 MB' }
                },
                'Stažené soubory': {
                    'instalator.exe': { type: 'file', icon: '⚙️', size: '12 MB' }
                }
            }
        };

        const root = make('div', { class: 'app-explorer' });
        const sidebar = make('div', { class: 'explorer-sidebar' });
        const main = make('div', { class: 'explorer-main' });
        root.append(sidebar, main);

        const sideItems = [
            { name: '🏠 Domů', path: ['Tento počítač'] },
            { name: '🖥️ Plocha', path: ['Tento počítač', 'Plocha'] },
            { name: '📄 Dokumenty', path: ['Tento počítač', 'Dokumenty'] },
            { name: '🖼️ Obrázky', path: ['Tento počítač', 'Obrázky'] },
            { name: '🎵 Hudba', path: ['Tento počítač', 'Hudba'] },
            { name: '⬇️ Stažené', path: ['Tento počítač', 'Stažené soubory'] }
        ];
        sideItems.forEach(it => {
            const el = make('div', { class: 'explorer-side-item' }, it.name);
            el.addEventListener('click', () => navigate(it.path));
            sidebar.append(el);
        });

        let path = ['Tento počítač'];
        const history = [path.slice()];
        let histIdx = 0;

        function getNode(p) {
            let n = tree;
            for (const seg of p) {
                if (n[seg] && (typeof n[seg] === 'object') && !n[seg].type) n = n[seg];
                else return null;
            }
            return n;
        }

        function navigate(p, pushHist = true) {
            path = p.slice();
            if (pushHist) {
                history.length = histIdx + 1;
                history.push(path.slice());
                histIdx = history.length - 1;
            }
            render();
        }

        function render() {
            main.innerHTML = '';
            const toolbar = make('div', { class: 'explorer-toolbar' });
            const back = make('button', { class: 'explorer-tb-btn' }, '←');
            const fwd = make('button', { class: 'explorer-tb-btn' }, '→');
            const up = make('button', { class: 'explorer-tb-btn' }, '↑');
            back.disabled = histIdx <= 0;
            fwd.disabled = histIdx >= history.length - 1;
            up.disabled = path.length <= 1;
            back.addEventListener('click', () => { if (histIdx > 0) { histIdx--; path = history[histIdx].slice(); render(); } });
            fwd.addEventListener('click', () => { if (histIdx < history.length - 1) { histIdx++; path = history[histIdx].slice(); render(); } });
            up.addEventListener('click', () => navigate(path.slice(0, -1)));
            const pathBox = make('div', { class: 'explorer-path' }, path.join(' › '));
            toolbar.append(back, fwd, up, pathBox);
            main.append(toolbar);

            sidebar.querySelectorAll('.explorer-side-item').forEach((it, i) => {
                it.classList.toggle('active', JSON.stringify(sideItems[i].path) === JSON.stringify(path));
            });

            const node = getNode(path);
            if (!node) {
                main.append(make('div', { class: '' }, 'Cesta nenalezena'));
                return;
            }
            const grid = make('div', { class: 'explorer-grid' });
            const entries = Object.entries(node);
            if (entries.length === 0) {
                grid.append(make('div', { style: 'color:var(--text-mute);font-size:12px' }, 'Tato složka je prázdná.'));
            }
            entries.forEach(([name, val]) => {
                const isFolder = val && typeof val === 'object' && !val.type;
                const it = make('div', { class: 'explorer-item' },
                    make('div', { class: 'explorer-item-icon' }, isFolder ? '📁' : (val.icon || '📄')),
                    make('div', { class: 'explorer-item-name' }, name));
                it.addEventListener('click', ev => {
                    grid.querySelectorAll('.explorer-item.selected').forEach(n => n.classList.remove('selected'));
                    it.classList.add('selected');
                    ev.stopPropagation();
                });
                it.addEventListener('dblclick', () => {
                    if (isFolder) navigate(path.concat([name]));
                    else toast(name, 'Náhled souboru není dostupný.');
                });
                grid.append(it);
            });
            main.append(grid);
        }

        body.append(root);
        render();
    }

    // ---------- Settings ----------
    function createSettings(body, win, opts) {
        const root = make('div', { class: 'app-settings' });
        const sidebar = make('div', { class: 'settings-sidebar' });
        const main = make('div', { class: 'settings-main' });
        root.append(sidebar, main);

        const panels = [
            { id: 'system',         name: '🖥️ Systém' },
            { id: 'personalization', name: '🎨 Přizpůsobení' },
            { id: 'apps',           name: '📦 Aplikace' },
            { id: 'accounts',       name: '👤 Účty' },
            { id: 'time',           name: '🕒 Čas a jazyk' },
            { id: 'network',        name: '🌐 Síť a internet' },
            { id: 'privacy',        name: '🔒 Soukromí' },
            { id: 'update',         name: '🔄 Windows Update' }
        ];
        let current = opts.panel || 'system';

        function render() {
            sidebar.innerHTML = '';
            panels.forEach(p => {
                const it = make('div', { class: 'settings-side-item' + (p.id === current ? ' active' : '') }, p.name);
                it.addEventListener('click', () => { current = p.id; render(); });
                sidebar.append(it);
            });
            main.innerHTML = '';
            const panel = panels.find(p => p.id === current);
            main.append(make('h2', {}, panel.name.replace(/^[^\s]+\s/, '')));
            renderPanel(current, main);
        }

        function renderPanel(id, m) {
            if (id === 'system') {
                m.append(settingsRow('Zvuk', 'Hlasitost, vstupní a výstupní zařízení', 'slider', 60));
                m.append(settingsRow('Notifikace', 'Povolit notifikace aplikací a systému', 'toggle', true));
                m.append(settingsRow('Úložiště', 'Použito 234 GB z 512 GB', 'info'));
                m.append(settingsRow('Multitasking', 'Snap rozložení, virtuální plochy', 'toggle', true));
                m.append(settingsRow('Napájení', 'Vyvážený režim', 'info'));
            } else if (id === 'personalization') {
                const section = make('div', {});
                section.append(make('div', { class: 'settings-row-title', style: 'margin-bottom:10px' }, 'Pozadí'));
                const wpGrid = make('div', { class: 'wallpaper-grid' });
                for (let i = 1; i <= 5; i++) {
                    const thumb = make('div', {
                        class: 'wallpaper-thumb' + (state.wallpaper === String(i) ? ' active' : ''),
                        'data-wp': String(i)
                    });
                    thumb.addEventListener('click', () => {
                        state.wallpaper = String(i);
                        applyWallpaper();
                        wpGrid.querySelectorAll('.wallpaper-thumb').forEach(w => w.classList.remove('active'));
                        thumb.classList.add('active');
                    });
                    wpGrid.append(thumb);
                }
                section.append(wpGrid);
                m.append(section);
                m.append(make('div', { style: 'height:14px' }));
                m.append(settingsRow('Tmavý motiv', 'Přepnutí mezi světlým a tmavým režimem', 'toggle', state.theme === 'dark', v => {
                    state.theme = v ? 'dark' : 'light';
                    applyTheme();
                }));
                m.append(settingsRow('Barvy se zvýrazněním', 'Použít barvu z pozadí pro akcent', 'toggle', false));
                m.append(settingsRow('Průhlednost', 'Efekty rozmazání pro okna a panel', 'toggle', true));
            } else if (id === 'apps') {
                Object.entries(apps).forEach(([id2, a]) => {
                    m.append(settingsRow(a.icon + '  ' + a.name, 'Verze 1.0.0', 'info'));
                });
            } else if (id === 'accounts') {
                m.append(settingsRow('Uživatel', 'Místní účet • U', 'info'));
                m.append(settingsRow('Heslo', 'Naposledy změněno: nikdy', 'info'));
                m.append(settingsRow('Synchronizace', 'Nastavení napříč zařízeními', 'toggle', false));
            } else if (id === 'time') {
                const now = new Date();
                m.append(settingsRow('Datum a čas', formatDateLong(now) + ' · ' + formatTimeLong(now), 'info'));
                m.append(settingsRow('Časové pásmo', '(UTC+01:00) Praha, Bratislava, Budapešť', 'info'));
                m.append(settingsRow('Letní čas', 'Automatické přepínání', 'toggle', true));
                m.append(settingsRow('Jazyk', 'Čeština (Česká republika)', 'info'));
            } else if (id === 'network') {
                m.append(settingsRow('Wi-Fi', state.toggles.wifi ? 'Připojeno · Domácí síť' : 'Vypnuto', 'toggle', state.toggles.wifi, v => {
                    state.toggles.wifi = v; updateActionCenterTiles();
                }));
                m.append(settingsRow('Bluetooth', state.toggles.bt ? 'Zapnuto' : 'Vypnuto', 'toggle', state.toggles.bt, v => {
                    state.toggles.bt = v; updateActionCenterTiles();
                }));
                m.append(settingsRow('VPN', 'Žádné připojené VPN', 'info'));
                m.append(settingsRow('Mobilní hotspot', 'Sdílejte své internetové připojení', 'toggle', false));
            } else if (id === 'privacy') {
                m.append(settingsRow('Poloha', 'Aplikace mohou používat polohu', 'toggle', false));
                m.append(settingsRow('Kamera', 'Aplikace mohou přistupovat ke kameře', 'toggle', false));
                m.append(settingsRow('Mikrofon', 'Aplikace mohou používat mikrofon', 'toggle', true));
                m.append(settingsRow('Diagnostická data', 'Volitelná diagnostika', 'toggle', false));
            } else if (id === 'update') {
                m.append(settingsRow('Stav', 'Vaše zařízení je aktuální · Windows 12 (sestavení 26100.1)', 'info'));
                const btn = make('button', { class: 'explorer-tb-btn', style: 'padding:8px 14px;margin-top:10px' }, '🔄 Zkontrolovat aktualizace');
                btn.addEventListener('click', () => toast('Windows Update', 'Vše je aktuální.'));
                m.append(btn);
            }
        }

        function settingsRow(title, sub, kind, value, onChange) {
            const row = make('div', { class: 'settings-row' });
            row.append(make('div', { class: 'settings-row-info' },
                make('div', { class: 'settings-row-title' }, title),
                make('div', { class: 'settings-row-sub' }, sub)));
            if (kind === 'toggle') {
                const t = make('div', { class: 'toggle' + (value ? ' on' : '') });
                t.addEventListener('click', () => {
                    t.classList.toggle('on');
                    if (onChange) onChange(t.classList.contains('on'));
                });
                row.append(t);
            } else if (kind === 'slider') {
                row.append(make('input', { type: 'range', min: '0', max: '100', value: String(value), style: 'width:140px' }));
            }
            return row;
        }

        body.append(root);
        render();
    }

    // ---------- Browser ----------
    function createBrowser(body) {
        const root = make('div', { class: 'app-browser' });
        const toolbar = make('div', { class: 'browser-toolbar' });
        const back = make('button', { class: 'browser-btn' }, '←');
        const fwd = make('button', { class: 'browser-btn' }, '→');
        const reload = make('button', { class: 'browser-btn' }, '⟳');
        const url = make('input', { class: 'browser-url', value: 'edge://newtab' });
        toolbar.append(back, fwd, reload, url);
        const content = make('div', { class: 'browser-content' });
        root.append(toolbar, content);

        const history = ['edge://newtab'];
        let idx = 0;

        function render() {
            url.value = history[idx];
            content.innerHTML = '';
            const u = history[idx];
            if (u === 'edge://newtab' || u === '' || u === 'about:home') {
                renderNewTab();
            } else if (u === 'edge://about' || u === 'about') {
                renderAbout();
            } else {
                renderSearchResults(u);
            }
        }
        function navigate(u) {
            history.length = idx + 1;
            history.push(u);
            idx = history.length - 1;
            render();
        }
        back.addEventListener('click', () => { if (idx > 0) { idx--; render(); } });
        fwd.addEventListener('click', () => { if (idx < history.length - 1) { idx++; render(); } });
        reload.addEventListener('click', render);
        url.addEventListener('keydown', e => {
            if (e.key === 'Enter') navigate(url.value.trim() || 'edge://newtab');
        });

        function renderNewTab() {
            const wrap = make('div', { class: 'browser-search' });
            wrap.append(make('div', { class: 'browser-search-logo' }, 'Hledej'));
            const input = make('input', { class: 'browser-search-bar', placeholder: 'Hledat na webu' });
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') navigate(input.value.trim() || 'edge://newtab');
            });
            wrap.append(input);
            const sites = ['anthropic.com', 'github.com', 'wikipedia.org', 'duckduckgo.com'];
            const list = make('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:24px' });
            sites.forEach(s => {
                const tile = make('button', {
                    style: 'padding:14px 18px;background:var(--glass-light);border:1px solid var(--glass-border);border-radius:8px;color:var(--text);cursor:pointer;font-size:13px'
                }, '🌐 ' + s);
                tile.addEventListener('click', () => navigate(s));
                list.append(tile);
            });
            wrap.append(list);
            content.append(wrap);
        }
        function renderAbout() {
            const wrap = make('div', { class: 'browser-page' });
            wrap.append(make('h1', {}, 'O Microsoft Edge'));
            wrap.append(make('p', {}, 'Verze 138.0.0.0 (oficiální sestavení) (64bitová)'));
            wrap.append(make('p', {}, 'Microsoft Edge je aktuální.'));
            content.append(wrap);
        }
        function renderSearchResults(q) {
            const wrap = make('div', { class: 'browser-page' });
            wrap.append(make('h1', {}, 'Výsledky pro „' + q + '"'));
            const results = [
                { title: q + ' — Wikipedie', url: 'wikipedia.org/wiki/' + q, desc: 'Encyklopedický článek s detailními informacemi o tématu „' + q + '". Včetně historie, definice a souvisejících odkazů.' },
                { title: 'Oficiální stránka — ' + q, url: q + '.com', desc: 'Domovská stránka. Najdete zde aktuální informace, novinky a kontaktní údaje.' },
                { title: 'Návod: ' + q + ' krok za krokem', url: 'tutorial.example/' + q, desc: 'Podrobný průvodce pro začátečníky i pokročilé. Obsahuje praktické tipy a triky.' }
            ];
            results.forEach(r => {
                const item = make('div', { style: 'margin:20px 0' },
                    make('a', { href: '#', style: 'font-size:18px;color:#4cc2ff;text-decoration:none' }, r.title),
                    make('div', { style: 'font-size:12px;color:var(--text-mute);margin:3px 0' }, r.url),
                    make('div', { style: 'font-size:14px;color:var(--text-dim);line-height:1.5' }, r.desc));
                wrap.append(item);
            });
            content.append(wrap);
        }
        body.append(root);
        render();
    }

    // ---------- Terminal ----------
    function createTerminal(body) {
        const root = make('div', { class: 'app-terminal' });
        body.append(root);

        const lines = [
            'Windows PowerShell',
            'Copyright (C) Microsoft Corporation. Všechna práva vyhrazena.',
            ''
        ];
        const cwd = ['C:', 'Users', 'User'];

        function prompt() { return 'PS ' + cwd.join('\\') + '>'; }

        function renderAll() {
            root.innerHTML = '';
            lines.forEach(l => {
                root.append(make('div', { class: 'term-line', html: l }));
            });
            const il = make('div', { class: 'term-line term-input-line' },
                make('span', { class: 'term-prompt' }, prompt()),
                make('input', { class: 'term-input', autocomplete: 'off', spellcheck: 'false' }));
            root.append(il);
            const input = il.querySelector('.term-input');
            input.focus();
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    const cmd = input.value;
                    lines.push(escapeHtml(prompt()) + ' ' + escapeHtml(cmd));
                    runCmd(cmd.trim());
                    renderAll();
                    root.scrollTop = root.scrollHeight;
                }
            });
            root.addEventListener('click', () => input.focus());
        }

        function runCmd(cmd) {
            if (!cmd) return;
            const parts = cmd.split(/\s+/);
            const c = parts[0].toLowerCase();
            if (c === 'help') {
                lines.push('Dostupné příkazy:');
                lines.push('  help           — tato nápověda');
                lines.push('  echo &lt;text&gt;    — vypíše text');
                lines.push('  date           — zobrazí datum');
                lines.push('  time           — zobrazí čas');
                lines.push('  ver            — verze systému');
                lines.push('  whoami         — aktuální uživatel');
                lines.push('  dir / ls       — výpis souborů');
                lines.push('  cls / clear    — vyčistí obrazovku');
                lines.push('  color          — náhodná barva pozadí');
                lines.push('  exit           — zavře okno');
            } else if (c === 'echo') {
                lines.push(escapeHtml(parts.slice(1).join(' ')));
            } else if (c === 'date') {
                lines.push(formatDateLong(new Date()));
            } else if (c === 'time') {
                lines.push(formatTimeLong(new Date()));
            } else if (c === 'ver') {
                lines.push('Microsoft Windows [verze 12.0.26100.1]');
            } else if (c === 'whoami') {
                lines.push(cwd.join('\\').toLowerCase() + '\\user');
            } else if (c === 'dir' || c === 'ls') {
                lines.push(' Volume v jednotce C nemá název.');
                lines.push(' Volume Serial Number is 0AB3-12CD');
                lines.push('');
                lines.push(' Directory of ' + cwd.join('\\'));
                lines.push('');
                lines.push(' &lt;DIR&gt;  Desktop');
                lines.push(' &lt;DIR&gt;  Documents');
                lines.push(' &lt;DIR&gt;  Downloads');
                lines.push(' &lt;DIR&gt;  Pictures');
                lines.push('       1 200  notes.txt');
                lines.push('       4 851  config.json');
            } else if (c === 'cls' || c === 'clear') {
                lines.length = 0;
            } else if (c === 'color') {
                const colors = ['#0c0c0c', '#001a33', '#1a0033', '#003319', '#330000'];
                root.style.background = colors[Math.floor(Math.random() * colors.length)];
                lines.push('Barva pozadí změněna.');
            } else if (c === 'exit') {
                const id = body.closest('.window').dataset.id;
                closeWindow(+id);
                return;
            } else {
                lines.push("'" + escapeHtml(cmd) + "' není rozpoznán jako interní nebo externí příkaz.");
                lines.push('Zadejte „help" pro seznam příkazů.');
            }
            lines.push('');
        }

        renderAll();
    }

    // ---------- Paint ----------
    function createPaint(body) {
        const root = make('div', { class: 'app-paint' });
        const toolbar = make('div', { class: 'paint-toolbar' });
        const canvas = make('canvas', { class: 'paint-canvas' });
        root.append(toolbar, canvas);
        body.append(root);

        const ctx = canvas.getContext('2d');
        let color = '#000000';
        let size = 4;
        let drawing = false;
        let lastX = 0, lastY = 0;

        function resize() {
            const r = canvas.getBoundingClientRect();
            const tmp = document.createElement('canvas');
            tmp.width = canvas.width || 1;
            tmp.height = canvas.height || 1;
            const tctx = tmp.getContext('2d');
            tctx.drawImage(canvas, 0, 0);
            canvas.width = r.width;
            canvas.height = r.height;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tmp, 0, 0);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
        setTimeout(resize, 80);
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);

        const colors = ['#000000', '#ffffff', '#e81123', '#f7630c', '#ffb900', '#00cc6a', '#0078d4', '#5c2d91', '#e74194'];
        const colorsBox = make('div', { class: 'paint-colors' });
        colors.forEach((c, i) => {
            const sw = make('div', { class: 'paint-color' + (i === 0 ? ' active' : ''), style: 'background:' + c });
            sw.addEventListener('click', () => {
                color = c;
                colorsBox.querySelectorAll('.paint-color').forEach(p => p.classList.remove('active'));
                sw.classList.add('active');
            });
            colorsBox.append(sw);
        });
        toolbar.append(colorsBox);

        const sizeLabel = make('span', { class: 'paint-size-label' }, 'Tloušťka: 4');
        const sizeInput = make('input', { type: 'range', min: '1', max: '40', value: '4' });
        sizeInput.addEventListener('input', () => {
            size = +sizeInput.value;
            sizeLabel.textContent = 'Tloušťka: ' + size;
        });
        toolbar.append(sizeLabel, sizeInput);

        const clearBtn = make('button', { class: 'explorer-tb-btn' }, '🗑️ Smazat');
        clearBtn.addEventListener('click', () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
        toolbar.append(clearBtn);

        function pos(e) {
            const r = canvas.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top };
        }
        canvas.addEventListener('mousedown', e => {
            drawing = true;
            const p = pos(e);
            lastX = p.x; lastY = p.y;
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        });
        canvas.addEventListener('mousemove', e => {
            if (!drawing) return;
            const p = pos(e);
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            lastX = p.x; lastY = p.y;
        });
        ['mouseup', 'mouseleave'].forEach(ev => canvas.addEventListener(ev, () => drawing = false));
    }

    // ---------- Photos ----------
    function createPhotos(body) {
        const root = make('div', { class: 'app-photos' });
        const gradients = [
            'linear-gradient(135deg, #ff6b6b, #ffa94d)',
            'linear-gradient(135deg, #4cc2ff, #0078d4)',
            'linear-gradient(135deg, #5a3fb8, #ff7eb6)',
            'linear-gradient(135deg, #00d4aa, #ffd166)',
            'linear-gradient(135deg, #232526, #414345)',
            'linear-gradient(135deg, #2d0066, #ff7eb6)',
            'linear-gradient(135deg, #003d2e, #00d4aa)',
            'linear-gradient(135deg, #1e5fc4, #4cb1ff)',
            'radial-gradient(circle at 30% 30%, #ffd166, #ff6b6b)',
            'conic-gradient(from 0deg, #ff6b6b, #ffa94d, #ffd166, #00d4aa, #4cc2ff, #5a3fb8, #ff7eb6, #ff6b6b)',
            'linear-gradient(135deg, #f43f5e, #8b5cf6)',
            'linear-gradient(135deg, #06b6d4, #14b8a6)'
        ];
        gradients.forEach((g, i) => {
            const t = make('div', { class: 'photo-thumb', style: 'background:' + g });
            t.addEventListener('click', () => toast('Fotka #' + (i + 1), 'Otevřeno v náhledu.'));
            root.append(t);
        });
        body.append(root);
    }

    // ---------- Clock ----------
    function createClock(body) {
        const root = make('div', { class: 'app-clock' });
        const time = make('div', { class: 'clock-time' });
        const date = make('div', { class: 'clock-date' });
        root.append(time, date);

        const zones = [
            { name: 'Praha', offset: 1 },
            { name: 'New York', offset: -5 },
            { name: 'Tokio', offset: 9 },
            { name: 'Sydney', offset: 11 }
        ];
        const zonesEl = make('div', { class: 'clock-zones' });
        zones.forEach(z => {
            const c = make('div', { class: 'clock-zone' },
                make('div', { class: 'clock-zone-time', 'data-offset': String(z.offset) }, '--:--'),
                make('div', { class: 'clock-zone-name' }, z.name));
            zonesEl.append(c);
        });
        root.append(zonesEl);
        body.append(root);

        function tick() {
            const now = new Date();
            time.textContent = formatTimeLong(now);
            date.textContent = formatDateLong(now);
            zonesEl.querySelectorAll('[data-offset]').forEach(el => {
                const off = +el.dataset.offset;
                const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                const d = new Date(utc + off * 3600000);
                el.textContent = formatTime(d);
            });
        }
        tick();
        const tid = setInterval(() => {
            if (!document.body.contains(root)) { clearInterval(tid); return; }
            tick();
        }, 1000);
    }

    // ---------- About ----------
    function createAbout(body) {
        const root = make('div', { class: 'app-about' });
        const hero = make('div', { class: 'about-hero' },
            make('div', { class: 'about-logo' },
                make('span'), make('span'), make('span'), make('span')),
            make('div', {},
                make('div', { class: 'about-title' }, 'Windows 12'),
                make('div', { class: 'about-sub' }, 'Vaše rychlejší, chytřejší a krásnější Windows')));
        root.append(hero);

        const dl = make('dl', { class: 'about-grid' });
        const info = {
            'Verze': 'Windows 12 Home',
            'Sestavení': '26100.1',
            'Procesor': 'Virtuální (Web Edition)',
            'Operační paměť': 'Sdíleno s prohlížečem',
            'Architektura': 'WebAssembly + JS',
            'Identifikace': 'PC-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            'Aktivace': 'Aktivováno (digitální licence)',
            'Rozlišení': window.innerWidth + ' × ' + window.innerHeight + ' px',
            'Jazyk': 'Čeština (Česká republika)',
            'Časové pásmo': '(UTC+01:00) Praha'
        };
        for (const [k, v] of Object.entries(info)) {
            dl.append(make('dt', {}, k));
            dl.append(make('dd', {}, v));
        }
        root.append(dl);
        body.append(root);
    }

    // ---------- Store ----------
    function createStore(body) {
        const root = make('div', { class: 'app-store' });
        const banner = make('div', { class: 'store-banner' },
            make('h2', {}, 'Najděte si svou další oblíbenou aplikaci'),
            make('p', {}, 'Tisíce aplikací, her a filmů na jednom místě.'));
        root.append(banner);

        const grid = make('div', { class: 'store-grid' });
        const items = [
            { name: 'Editor', icon: '📝', desc: 'Pokročilý editor textu', appId: 'notepad' },
            { name: 'Studio Paint', icon: '🎨', desc: 'Kresli a maluj', appId: 'paint' },
            { name: 'PowerCalc', icon: '🧮', desc: 'Vědecká kalkulačka', appId: 'calculator' },
            { name: 'Edge', icon: '🌐', desc: 'Rychlý prohlížeč', appId: 'browser' },
            { name: 'Foto+', icon: '🖼️', desc: 'Prohlížeč fotografií', appId: 'photos' },
            { name: 'Hodiny', icon: '🕒', desc: 'Časovače a budíky', appId: 'clock' },
            { name: 'PowerShell', icon: '⌨️', desc: 'Příkazový řádek', appId: 'terminal' },
            { name: 'Piškvorky', icon: '🎮', desc: 'Klasická hra X a O', appId: 'game' }
        ];
        items.forEach(it => {
            const card = make('div', { class: 'store-card' },
                make('div', { class: 'store-card-icon' }, it.icon),
                make('div', { class: 'store-card-name' }, it.name),
                make('div', { class: 'store-card-desc' }, it.desc));
            const btn = make('button', { class: 'store-card-btn' }, 'Otevřít');
            btn.addEventListener('click', e => {
                e.stopPropagation();
                if (apps[it.appId]) openApp(it.appId);
            });
            card.append(btn);
            card.addEventListener('click', () => { if (apps[it.appId]) openApp(it.appId); });
            grid.append(card);
        });
        root.append(grid);
        body.append(root);
    }

    // ---------- Tic-Tac-Toe ----------
    function createGame(body) {
        const root = make('div', { class: 'app-game' });
        const status = make('div', { class: 'game-status' }, 'Hraje X');
        const board = make('div', { class: 'game-board' });
        const restart = make('button', { class: 'game-restart' }, 'Restart');
        root.append(status, board, restart);
        body.append(root);

        let cells, turn, finished;
        function init() {
            board.innerHTML = '';
            cells = Array(9).fill('');
            turn = 'X';
            finished = false;
            status.textContent = 'Hraje X';
            for (let i = 0; i < 9; i++) {
                const c = make('button', { class: 'game-cell', type: 'button' });
                c.addEventListener('click', () => play(i, c));
                board.append(c);
            }
        }
        function play(i, c) {
            if (finished || cells[i]) return;
            cells[i] = turn;
            c.textContent = turn;
            c.classList.add(turn.toLowerCase());
            c.disabled = true;
            const winLines = [
                [0,1,2],[3,4,5],[6,7,8],
                [0,3,6],[1,4,7],[2,5,8],
                [0,4,8],[2,4,6]
            ];
            const win = winLines.find(l => l.every(k => cells[k] === turn));
            if (win) {
                finished = true;
                status.textContent = turn + ' vyhrává! 🎉';
                board.querySelectorAll('.game-cell').forEach(cc => cc.disabled = true);
                return;
            }
            if (cells.every(v => v)) {
                finished = true;
                status.textContent = 'Remíza!';
                return;
            }
            turn = turn === 'X' ? 'O' : 'X';
            status.textContent = 'Hraje ' + turn;
        }
        restart.addEventListener('click', init);
        init();
    }

    // ---------- Search ----------
    function createSearch(body) {
        const root = make('div', { style: 'padding:18px;display:flex;flex-direction:column;gap:12px;height:100%' });
        const input = make('input', {
            placeholder: 'Hledat aplikace…',
            style: 'padding:9px 14px;border:1px solid var(--glass-border);background:var(--glass-light);color:var(--text);border-radius:6px;font-size:14px;outline:none'
        });
        const results = make('div', { style: 'flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:4px' });
        root.append(input, results);

        function render(q) {
            results.innerHTML = '';
            const list = Object.entries(apps).filter(([, a]) =>
                !q || a.name.toLowerCase().includes(q.toLowerCase()));
            if (list.length === 0) {
                results.append(make('div', { style: 'color:var(--text-mute);padding:14px;text-align:center' }, 'Žádné výsledky'));
                return;
            }
            list.forEach(([id, a]) => {
                const it = make('div', {
                    style: 'padding:9px 12px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:10px;font-size:13px'
                }, make('span', { style: 'font-size:20px' }, a.icon), a.name);
                it.addEventListener('mouseenter', () => it.style.background = 'var(--glass-light)');
                it.addEventListener('mouseleave', () => it.style.background = '');
                it.addEventListener('click', () => openApp(id));
                results.append(it);
            });
        }
        input.addEventListener('input', () => render(input.value));
        render('');
        setTimeout(() => input.focus(), 100);
        body.append(root);
    }

    // ---------- Init ----------
    document.addEventListener('DOMContentLoaded', boot);
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        boot();
    }

})();
