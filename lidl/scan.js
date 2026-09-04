/* ==========================================================================
   Kontrola dat spotřeby – výběr místa, skenování kódu, zápis data.

   Čtečka kódů: používá se čtečka zabudovaná v prohlížeči (BarcodeDetector).
   Umí ji Chrome na Androidu. Kde není, zapíše se EAN ručně nebo se načte
   z vyfoceného kódu; ruční pole zvládne i klasickou pistolovou čtečku,
   která kód „napíše" a odešle Enterem.
   ========================================================================== */

let scanPlace = null;      /* id místa, kde se právě skenuje */
let scanSession = [];      /* co se zapsalo v tomhle kole */
let scanFilter = 'open';
let liveScan = null;       /* běžící kamera */
let lastSavedId = '';      /* poslední zápis – ať je na obrazovce vidět */

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'];

function hasBarcodeReader() {
    return typeof window.BarcodeDetector === 'function';
}

function newDetector() {
    try {
        return new window.BarcodeDetector({ formats: BARCODE_FORMATS });
    } catch {
        return new window.BarcodeDetector();
    }
}

/* --- Přehled kontrol --------------------------------------------------------- */

function checkRowHtml(check) {
    const status = expiryStatus(check.expiry);
    const element = mapElementById(check.elementId);
    const place = element ? element.name : 'Neznámé místo';
    const action = checkActionLabel(check.action);

    return `
        <div class="row ${check.done ? 'done-row' : ''} ${check.id === lastSavedId ? 'just-saved' : ''}">
            ${hasPhoto(check)
                ? `<img class="article-thumb" ${photoOf(check) ? `src="${esc(photoOf(check))}"` : 'data-photo-pending'}
                        data-photo-id="${esc(check.photoId || '')}" alt=""
                        data-scan-action="photo" data-id="${check.id}">`
                : '<span class="article-thumb empty">📅</span>'}
            <div class="row-main">
                <div class="row-title">${esc(check.name || check.ean || 'Bez názvu')}</div>
                <div class="row-sub">
                    ${check.expiry ? `<strong>${esc(formatDate(check.expiry))}</strong> · ` : ''}
                    ${esc(place)}${check.level ? ` · ${check.level}. police` : ''}
                    ${check.pieces ? ` · ${check.pieces} ks` : ''}
                </div>
                <div class="row-sub">
                    ${check.ean ? `EAN ${esc(check.ean)}` : ''}${check.note ? ` · ${esc(check.note)}` : ''}
                </div>
                <div class="tag-list">
                    <span class="pill ${status.pill}">${esc(status.label)}</span>
                    ${action ? `<span class="pill">${esc(action)}</span>` : ''}
                    ${check.done ? '<span class="pill success">Vyřešeno</span>' : ''}
                </div>
            </div>
            <div class="row-actions">
                <button class="btn-ghost" data-scan-action="toggle-done" data-id="${check.id}"
                        title="${check.done ? 'Vrátit mezi nevyřešené' : 'Označit jako vyřešené'}">
                    ${check.done ? '↩︎' : '✅'}</button>
                <button class="btn-ghost" data-scan-action="edit" data-id="${check.id}">✏️</button>
            </div>
        </div>`;
}

function renderChecks() {
    const summary = checkSummary();
    const rows = (scanFilter === 'all'
        ? [...DB.checks].sort((a, b) => (a.expiry || '9999').localeCompare(b.expiry || '9999'))
        : openChecks());

    view.innerHTML = `
        <div class="view-head">
            <div>
                <h2>Data spotřeby</h2>
                <div class="subtitle">${checkText(summary.celkem)} k řešení · celkem ${DB.checks.length}</div>
            </div>
            <button class="btn" data-scan-action="start">🔎 Začít kontrolu</button>
        </div>

        <div class="grid grid-3" style="margin-bottom: 0.9rem;">
            <div class="stat"><div class="stat-label">Prošlé</div>
                <div class="stat-value" style="color: var(--danger);">${summary.prosle}</div>
                <div class="stat-hint">pryč z regálu</div></div>
            <div class="stat"><div class="stat-label">Končí dnes</div>
                <div class="stat-value" style="color: var(--danger);">${summary.dnes}</div>
                <div class="stat-hint">do redukce</div></div>
            <div class="stat"><div class="stat-label">Do tří dnů</div>
                <div class="stat-value" style="color: var(--warning);">${summary.brzy}</div>
                <div class="stat-hint">hlídat</div></div>
            <div class="stat"><div class="stat-label">Do týdne</div>
                <div class="stat-value">${summary.tyden}</div>
                <div class="stat-hint">v pořádku</div></div>
        </div>

        <div class="card">
            <h3>${scanFilter === 'all' ? 'Všechny záznamy' : 'K řešení'} (${rows.length})
                <button class="btn-secondary" data-scan-action="filter">
                    ${scanFilter === 'all' ? 'Jen nevyřešené' : 'Zobrazit i vyřešené'}</button>
            </h3>
            ${rows.length ? rows.map(checkRowHtml).join('')
                : '<div class="empty">Nic k řešení. Kontrolu spustíš tlačítkem nahoře.</div>'}
        </div>`;

    attachScanHandlers();
    hydratePhotos(view);
}

/* --- Výběr místa -------------------------------------------------------------- */

function renderPlacePicker() {
    const groups = {};
    DB.map.elements
        .filter(element => element.type !== 'popisek')
        .forEach(element => {
            const type = mapTypeById(element.type);
            (groups[type.name] = groups[type.name] || []).push(element);
        });

    view.innerHTML = `
        <div class="view-head">
            <div>
                <h2>Kde budeš kontrolovat?</h2>
                <div class="subtitle">Vyber pokladnu nebo regál – zápisy se pak přiřadí k němu.</div>
            </div>
            <button class="btn-secondary" data-nav="data">← Zpět</button>
        </div>

        <div class="search-bar">
            <input type="search" placeholder="Hledat místo… např. pokladna 1" data-place-search>
        </div>

        <div id="place-list">
            ${Object.entries(groups).map(([name, elements]) => `
                <div class="card place-group">
                    <h3>${esc(name)}</h3>
                    <div class="place-grid">
                        ${elements.map(element => `
                            <button class="place-btn" data-scan-action="pick" data-id="${element.id}"
                                    data-name="${esc(element.name.toLowerCase())}">
                                <span class="place-name">${esc(element.name)}</span>
                                <span class="place-meta">${articleText(element.articles.length)}${
                                    checksForElement(element.id).length ? ` · ${checkText(checksForElement(element.id).length)}` : ''}</span>
                            </button>`).join('')}
                    </div>
                </div>`).join('')}
        </div>`;

    const search = view.querySelector('[data-place-search]');
    search.addEventListener('input', () => {
        const text = search.value.trim().toLowerCase();
        view.querySelectorAll('.place-btn').forEach(button => {
            button.hidden = Boolean(text) && !button.dataset.name.includes(text);
        });
        view.querySelectorAll('.place-group').forEach(group => {
            group.hidden = !group.querySelector('.place-btn:not([hidden])');
        });
    });
    search.focus();

    attachScanHandlers();
}

/* --- Skenování na místě -------------------------------------------------------- */

function renderScan(elementId) {
    const element = mapElementById(elementId);
    if (!element) { go('#/skenovat'); return; }
    scanPlace = elementId;

    const recent = checksForElement(elementId).slice(0, 8);
    const reader = hasBarcodeReader();
    const blocked = Boolean(DB.settings.cameraBlocked);

    view.innerHTML = `
        <div class="view-head">
            <div>
                <h2>${esc(element.name)}</h2>
                <div class="subtitle">Skenuj zboží a zapisuj datum spotřeby.</div>
            </div>
            <div class="btn-row">
                <button class="btn-secondary" data-scan-action="change-place">Změnit místo</button>
                <button class="btn-secondary" data-nav="data">Hotovo</button>
            </div>
        </div>

        <div class="card scan-card">
            ${reader && !blocked ? `<button class="btn scan-big" data-scan-action="camera">🎥 Skenovat kamerou</button>` : ''}
            <button class="${reader && !blocked ? 'btn-secondary' : 'btn'} scan-big" data-scan-action="photo-scan">
                📷 Vyfotit kód
                <input type="file" accept="image/*" capture="environment" hidden data-scan-file>
            </button>
            ${reader && blocked ? `<button class="btn-secondary scan-big" data-scan-action="camera">
                🎥 Zkusit znovu kameru</button>` : ''}
            ${blocked ? `<div class="field-hint">Živou kameru tenhle prohlížeč stránce nepustil.
                Focení funguje pořád – vyfoť čárový kód zblízka, přečte se z fotky a fotka zůstane u záznamu.</div>` : ''}

            <form class="scan-manual" data-scan-form>
                <input type="text" inputmode="numeric" autocomplete="off" placeholder="Nebo napiš EAN a dej Enter"
                       data-scan-input>
                <button type="submit" class="btn-secondary">Zadat</button>
            </form>

            ${reader ? '' : `<div class="field-hint">
                Čtečku kódů umí Chrome na Androidu. V tomhle prohlížeči ji nemám k dispozici –
                EAN napiš ručně, nebo použij pistolovou čtečku, ta kód do pole napíše sama.</div>`}
        </div>

        <div class="card">
            <h3>Zapsáno v tomhle kole (${scanSession.length})</h3>
            ${scanSession.length
                ? scanSession.map(id => DB.checks.find(c => c.id === id)).filter(Boolean).map(checkRowHtml).join('')
                : '<div class="empty">Zatím nic. Naskenuj první zboží.</div>'}
        </div>

        ${recent.length ? `
        <div class="card">
            <h3>Dřívější zápisy na tomhle místě (${recent.length})</h3>
            ${recent.map(checkRowHtml).join('')}
        </div>` : ''}`;

    const form = view.querySelector('[data-scan-form]');
    const input = view.querySelector('[data-scan-input]');
    form.addEventListener('submit', event => {
        event.preventDefault();
        const code = input.value.trim();
        if (!code) return;
        input.value = '';
        checkForm(null, code);
    });
    input.focus();

    view.querySelector('[data-scan-file]').addEventListener('change', event => {
        const file = event.target.files[0];
        event.target.value = '';
        if (file) readCodeFromPhoto(file);
    });

    attachScanHandlers();
    hydratePhotos(view);
}

/* --- Čtení kódu ---------------------------------------------------------------- */

/* --- Čtení kódu z fotky ---------------------------------------------------
   Fotka z telefonu bývá větší a kód na ní malý, proto zkoušíme několik
   úprav: originál, vyříznutý střed, zvětšení a zvýšení kontrastu.
   -------------------------------------------------------------------------- */

function toCanvas(source, { crop = 1, scale = 1, contrast = 1 } = {}) {
    const width = source.width * crop;
    const height = source.height * crop;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext('2d', { willReadFrequently: contrast !== 1 });
    ctx.drawImage(source,
        (source.width - width) / 2, (source.height - height) / 2, width, height,
        0, 0, canvas.width, canvas.height);

    if (contrast !== 1) {
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = image.data;
        for (let i = 0; i < data.length; i += 4) {
            const grey = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            const boosted = Math.max(0, Math.min(255, (grey - 128) * contrast + 128));
            data[i] = data[i + 1] = data[i + 2] = boosted;
        }
        ctx.putImageData(image, 0, 0);
    }
    return canvas;
}

async function decodeImage(file) {
    const bitmap = await createImageBitmap(file);
    const detector = newDetector();
    const attempts = [
        {},
        { crop: 0.7, scale: 2 },
        { scale: 2, contrast: 1.8 },
        { crop: 0.5, scale: 3, contrast: 2.2 }
    ];

    for (const options of attempts) {
        try {
            const source = Object.keys(options).length ? toCanvas(bitmap, options) : bitmap;
            const codes = await detector.detect(source);
            const hit = codes.find(code => code.rawValue);
            if (hit) { bitmap.close?.(); return hit.rawValue; }
        } catch (err) {
            console.warn('Pokus o přečtení kódu selhal', err);
        }
    }
    bitmap.close?.();
    return null;
}

/* Kód z vyfoceného obrázku; fotku si rovnou necháme k záznamu. */
async function readCodeFromPhoto(file) {
    toast('Čtu kód z fotky…');
    const photo = await compressImage(file).catch(() => '');

    if (!hasBarcodeReader()) {
        toast('Tenhle prohlížeč kódy číst neumí – EAN doplň ručně');
        checkForm(null, '', photo);
        return;
    }

    const code = await decodeImage(file).catch(() => null);
    if (code) {
        navigator.vibrate?.(60);
        toast(`Načteno ${code}`);
    } else {
        toast('Kód se nepodařilo přečíst – zkus focení zblízka, EAN jde napsat ručně');
    }
    checkForm(null, code || '', photo);
}

/* Živé skenování kamerou. Kamera se drží otevřená, dokud ji sám nezavřeš –
   po zápisu se vrátí, ať jde projít celou polici za sebou. */
let lastCameraError = '';

async function startCameraScan() {
    if (!hasBarcodeReader()) {
        alert('Tenhle prohlížeč neumí číst čárové kódy. Použij Chrome na Androidu, nebo zadej EAN ručně.');
        return;
    }

    openModal({
        title: 'Namiř na čárový kód',
        bodyHtml: `
            <div class="scan-view">
                <video playsinline muted autoplay data-scan-video></video>
                <div class="scan-frame"></div>
            </div>
            <div class="scan-hint" data-scan-hint>Zapínám kameru…</div>
            <div class="btn-row" style="margin-top:0.6rem;">
                <button class="btn-secondary" data-scan-torch hidden>🔦 Přisvítit</button>
                <button class="btn-secondary" data-scan-retry hidden>Zkusit znovu</button>
                <button class="btn-secondary" data-scan-fallback hidden>📷 Vyfotit kód</button>
                <button class="btn-ghost" data-scan-help>Proč to nejde?</button>
            </div>`,
        actionsHtml: '<button class="btn-secondary" data-scan-close>Zavřít</button>',
        onMount: modal => {
            modal.querySelector('[data-scan-close]').addEventListener('click', stopCameraScan);
            modal.querySelector('[data-scan-help]').addEventListener('click', showCameraHelp);
            modal.querySelector('[data-scan-retry]').addEventListener('click', () => runCameraScan(modal));
            modal.querySelector('[data-scan-fallback]').addEventListener('click', () => {
                stopCameraScan();
                const file = view.querySelector('[data-scan-file]');
                if (file) file.click();
            });
            runCameraScan(modal);
        }
    });
}

/* Kameru zkoušíme postupně: zadní, jakákoli zadní, cokoli. */
async function openCameraStream() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Prohlížeč kameru vůbec nenabízí.');
    }
    const attempts = [
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false },
        { video: { facingMode: 'environment' }, audio: false },
        { video: true, audio: false }
    ];
    let lastError;
    for (const constraints of attempts) {
        try {
            return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            lastError = err;
            if (err.name === 'NotAllowedError' || err.name === 'SecurityError') break;
        }
    }
    throw lastError;
}

function cameraErrorText(err) {
    switch (err && err.name) {
        case 'NotAllowedError':
        case 'SecurityError':
            return 'Prohlížeč kameru nepustil. Povol kameru pro claude.ai v nastavení stránky, nebo použij „Vyfotit kód" – ten otevře fotoaparát telefonu a funguje vždycky.';
        case 'NotFoundError':
        case 'OverconstrainedError':
            return 'Žádnou kameru jsem nenašel.';
        case 'NotReadableError':
            return 'Kameru drží jiná aplikace. Zavři ji a zkus to znovu.';
        default:
            return `Kameru se nepodařilo spustit (${(err && (err.name || err.message)) || 'neznámá chyba'}).`;
    }
}

async function runCameraScan(modal) {
    const video = modal.querySelector('[data-scan-video]');
    const hint = modal.querySelector('[data-scan-hint]');
    const torchBtn = modal.querySelector('[data-scan-torch]');
    const retryBtn = modal.querySelector('[data-scan-retry]');
    const fallbackBtn = modal.querySelector('[data-scan-fallback]');

    stopStream();
    hint.textContent = 'Zapínám kameru…';
    retryBtn.hidden = true;
    fallbackBtn.hidden = true;

    let stream;
    try {
        stream = await openCameraStream();
    } catch (err) {
        lastCameraError = `${err.name || ''} ${err.message || ''}`.trim();
        if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
            DB.settings.cameraBlocked = true;
            save();
        }
        hint.textContent = cameraErrorText(err);
        hint.classList.add('bad');
        retryBtn.hidden = false;
        fallbackBtn.hidden = false;
        return;
    }

    /* Okno se mohlo mezitím zavřít – pak kameru rovnou zhasneme. */
    if (!modal.isConnected) {
        stream.getTracks().forEach(track => track.stop());
        return;
    }

    if (DB.settings.cameraBlocked) { DB.settings.cameraBlocked = false; save(); }
    hint.classList.remove('bad');
    video.srcObject = stream;
    await video.play().catch(() => {});
    hint.textContent = 'Hledám kód… drž ho v rámečku.';
    liveScan = { stream, running: true };

    const track = stream.getVideoTracks()[0];
    const canTorch = track && track.getCapabilities && track.getCapabilities().torch;
    torchBtn.hidden = !canTorch;
    if (canTorch) {
        torchBtn.onclick = () => {
            liveScan.torch = !liveScan.torch;
            track.applyConstraints({ advanced: [{ torch: liveScan.torch }] }).catch(() => {});
            torchBtn.textContent = liveScan.torch ? '🔦 Zhasnout' : '🔦 Přisvítit';
        };
    }

    const detector = newDetector();
    let busy = false;
    let misses = 0;

    const scanFrame = async () => {
        if (!liveScan || !liveScan.running) return;
        if (!busy && video.videoWidth) {
            busy = true;
            try {
                const codes = await detector.detect(video);
                if (codes.length && codes[0].rawValue) {
                    const code = codes[0].rawValue;
                    navigator.vibrate?.(60);
                    hint.textContent = `Načteno ${code}`;
                    liveScan.running = false;
                    stopStream();
                    closeModal();
                    checkForm(null, code, '', true);
                    return;
                }
                if (++misses === 60) hint.textContent = 'Zkus kód přiblížit nebo přisvítit.';
            } catch (err) {
                lastCameraError = `detect: ${err.message || err}`;
            }
            busy = false;
        }
        scheduleFrame(video, scanFrame);
    };
    scheduleFrame(video, scanFrame);
}

/* Novější prohlížeče umí callback na snímek videa, jinak stačí animační rámec. */
function scheduleFrame(video, callback) {
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(() => callback());
    else requestAnimationFrame(() => callback());
}

function stopStream() {
    if (!liveScan) return;
    liveScan.running = false;
    liveScan.stream.getTracks().forEach(track => track.stop());
    liveScan = null;
}

function stopCameraScan() {
    stopStream();
    closeModal();
}

/* Když kamera nejede, tohle řekne proč – ať je co poslat dál. */
async function showCameraHelp() {
    const rows = [
        ['Čtečka čárových kódů', hasBarcodeReader() ? 'k dispozici' : 'chybí (potřebuje Chrome na Androidu)'],
        ['Kamera v prohlížeči', navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? 'k dispozici' : 'chybí'],
        ['Zabezpečené připojení', window.isSecureContext ? 'ano' : 'ne'],
        ['Stránka běží v rámu', window.top !== window.self ? 'ano (online verze)' : 'ne']
    ];

    try {
        const status = await navigator.permissions.query({ name: 'camera' });
        rows.push(['Povolení kamery', status.state === 'granted' ? 'povoleno'
            : status.state === 'denied' ? 'zakázáno' : 'zeptá se']);
    } catch {
        rows.push(['Povolení kamery', 'prohlížeč neřekne']);
    }
    if (lastCameraError) rows.push(['Poslední chyba', lastCameraError]);

    openModal({
        title: 'Co říká prohlížeč',
        bodyHtml: `
            <table class="data">${rows.map(([label, value]) =>
                `<tr><td>${esc(label)}</td><td><strong>${esc(value)}</strong></td></tr>`).join('')}</table>
            <p class="muted" style="margin-top:0.7rem;">
                Když kamera nejede, tlačítko <strong>Vyfotit kód</strong> funguje vždycky – otevře
                fotoaparát telefonu, kód se přečte z fotky a fotka zůstane u záznamu.</p>`,
        actionsHtml: '<button class="btn-secondary" data-help-close>Zpět ke skenování</button>',
        onMount: modal => modal.querySelector('[data-help-close]')
            .addEventListener('click', () => startCameraScan())
    });
}

/* --- Zápis záznamu -------------------------------------------------------------- */

async function checkForm(checkId, ean, photo, fromCamera) {
    const check = checkId ? DB.checks.find(c => c.id === checkId) : null;
    if (check) await ensurePhotoData(check);
    const photoBefore = check ? (check.photo || '') : '';
    const elementId = check ? check.elementId : scanPlace;
    const element = mapElementById(elementId);
    if (!element) { go('#/skenovat'); return; }

    const known = !check && ean ? articleByEan(ean) : null;
    const total = levelsOf(element);
    const levelOptions = [{ value: 0, label: 'Neurčeno' }].concat(
        Array.from({ length: total }, (_, i) => ({ value: i + 1, label: levelName(i + 1, total) })));

    const values = check ? { ...check } : {
        name: known ? known.article.name : '',
        ean: ean || '',
        expiry: '',
        pieces: 1,
        level: known && known.element.id === elementId ? known.article.level : 0,
        action: '',
        photo: photo || '',
        addArticle: !known
    };
    if (photo && check) values.photo = photo;

    openForm({
        title: check ? 'Upravit záznam' : `Zápis · ${element.name}`,
        fields: [
            { name: 'name', label: 'Co to je', type: 'text',
              placeholder: known ? '' : 'např. Jogurt jahodový 150 g',
              hint: 'Nechat prázdné je v pořádku – zapíše se podle EAN a název doplníš později.' },
            { name: 'expiry', label: 'Datum spotřeby', type: 'date-quick' },
            { type: 'row', fields: [
                { name: 'pieces', label: 'Kusů', type: 'number' },
                { name: 'level', label: 'Police', type: 'select', options: levelOptions }
            ] },
            { name: 'ean', label: 'EAN', type: 'text' },
            { name: 'photo', label: 'Fotka', type: 'photo' },
            { name: 'action', label: 'Co s tím', type: 'select', options: CHECK_ACTIONS },
            { name: 'note', label: 'Poznámka', type: 'text', placeholder: 'např. zadní řada, nahlášeno vedoucí' },
            ...(check ? [] : [{ name: 'addArticle', label: 'Přidat i mezi artikly tohohle místa', type: 'checkbox' }])
        ],
        values,
        submitLabel: check ? 'Uložit' : 'Zapsat',
        onSave: data => {
            const name = data.name || (data.ean ? `EAN ${data.ean}` : 'Bez názvu');
            const payload = {
                elementId,
                name,
                ean: data.ean,
                expiry: data.expiry,
                pieces: Number(data.pieces) || 0,
                level: Number(data.level) || 0,
                action: data.action,
                note: data.note,
                photo: data.photo
            };

            if (check) {
                Object.assign(check, payload);
                if (data.photo !== photoBefore) check.photoId = '';
            } else {
                const record = { id: uid(), at: todayISO(), done: false, ...payload };
                DB.checks.unshift(record);
                scanSession.unshift(record.id);
                lastSavedId = record.id;
                if (data.addArticle) addScannedArticle(element, record);
            }

            if (!save()) return;
            if (currentRoute().name === 'data') renderChecks();
            else renderScan(elementId);
            toast(check ? 'Uloženo'
                : `Zapsáno: ${name}${data.expiry ? ' · ' + formatDate(data.expiry) : ''}`);
            /* Po zápisu z kamery pokračujeme rovnou dalším kusem. */
            if (fromCamera) startCameraScan();
        },
        onDelete: check ? () => {
            DB.checks = DB.checks.filter(c => c.id !== checkId);
            scanSession = scanSession.filter(id => id !== checkId);
            save();
            if (currentRoute().name === 'data') renderChecks(); else renderScan(elementId);
            toast('Smazáno');
        } : null
    });
}

/* Naskenované zboží rovnou doplní do seznamu artiklů daného místa. */
function addScannedArticle(element, record) {
    const existing = record.ean && element.articles.find(a => a.ean === record.ean);
    if (existing) {
        if (record.level) existing.level = record.level;
        return;
    }
    element.articles.push({
        id: uid(),
        name: record.name,
        ean: record.ean,
        code: '',
        shelf: '',
        note: '',
        level: record.level,
        photo: record.photo || ''
    });
}

/* --- Akce ----------------------------------------------------------------------- */

function attachScanHandlers() {
    view.querySelectorAll('[data-scan-action]').forEach(node => {
        node.addEventListener('click', () => runScanAction(node.dataset.scanAction, node.dataset));
    });
}

function runScanAction(action, data) {
    switch (action) {
        case 'start':
            scanSession = [];
            go('#/skenovat');
            break;
        case 'change-place':
            go('#/skenovat');
            break;
        case 'pick':
            scanSession = [];
            go(`#/skenovat/${data.id}`);
            break;
        case 'camera':
            startCameraScan();
            break;
        case 'photo-scan':
            view.querySelector('[data-scan-file]').click();
            break;
        case 'filter':
            scanFilter = scanFilter === 'all' ? 'open' : 'all';
            renderChecks();
            break;
        case 'edit':
            checkForm(data.id);
            break;
        case 'toggle-done': {
            const check = DB.checks.find(c => c.id === data.id);
            if (!check) return;
            check.done = !check.done;
            save();
            if (currentRoute().name === 'data') renderChecks(); else renderScan(scanPlace);
            break;
        }
        case 'photo': {
            const check = DB.checks.find(c => c.id === data.id);
            if (!check || !hasPhoto(check)) return;
            openModal({
                title: check.name || 'Fotka',
                bodyHtml: photoOf(check)
                    ? `<img class="photo-full" src="${esc(photoOf(check))}" alt="">`
                    : `<img class="photo-full" data-photo-pending data-photo-id="${esc(check.photoId)}" alt="">`,
                actionsHtml: '<button class="btn-secondary" data-close-photo>Zavřít</button>',
                onMount: modal => {
                    modal.querySelector('[data-close-photo]').addEventListener('click', closeModal);
                    hydratePhotos(modal);
                }
            });
            break;
        }
    }
}
