/* ==========================================================================
   Plán prodejny – editor a vyhledávání artiklů
   Prvky se přetahují myší i prstem, souřadnice se ukládají do DB.map.
   ========================================================================== */

let mapZoom = null;          /* null = přizpůsobit šířce obrazovky */
let mapSelected = null;
let mapEdit = true;
let mapSearch = '';
let mapShowList = false;
const mapUndo = [];
let mapScroll = { left: 0, top: 0 };
let mapCurrentZoom = 1;

const SNAP = 5;

function pushMapUndo() {
    mapUndo.push(JSON.stringify(DB.map));
    if (mapUndo.length > 40) mapUndo.shift();
}

function undoMap() {
    if (!mapUndo.length) { toast('Není co vrátit'); return; }
    DB.map = JSON.parse(mapUndo.pop());
    if (!mapElementById(mapSelected)) mapSelected = null;
    save();
    render();
}

function effectiveZoom(available) {
    if (mapZoom) return mapZoom;
    return Math.min(1.4, Math.max(0.2, available / DB.map.width));
}

function elementLabelHtml(element, zoom) {
    const count = element.articles.length;
    const badge = count ? `<span class="map-count">${count}</span>` : '';
    const camera = hasPhoto(element) ? '<span class="map-photo-dot">📷</span>' : '';
    const dates = openChecksForElement(element.id).length;
    const dateBadge = dates ? `<span class="map-count dates">📅${dates}</span>` : '';

    if (element.type !== 'popisek' && zoom < 0.45) {
        return badge || camera || dateBadge
            ? `<span class="map-label tiny">${badge}${dateBadge}${camera}</span>` : '';
    }

    const type = mapTypeById(element.type);
    const roomy = element.w * zoom > 72 && element.h * zoom > 48;
    const vertical = element.h > element.w * 1.8 && element.h * zoom > 55;
    const icon = roomy && type.icon ? `<span class="map-icon">${type.icon}</span>` : '';

    return `<span class="map-label ${vertical ? 'vertical' : ''}">
        ${icon}${esc(element.name)}${badge}${dateBadge}${camera}</span>`;
}

function mapElementHtml(element, zoom, hits) {
    const type = mapTypeById(element.type);
    const isHit = hits.has(element.id);
    const classes = ['map-el', `t-${element.type}`];
    if (element.id === mapSelected) classes.push('selected');
    if (isHit) classes.push('hit');
    if (mapEdit) classes.push('draggable');

    return `
        <div class="${classes.join(' ')}" data-el="${element.id}" title="${esc(element.name)}"
             style="left:${element.x * zoom}px; top:${element.y * zoom}px;
                    width:${element.w * zoom}px; height:${element.h * zoom}px;
                    background:${type.fill}; border-color:${type.stroke}; color:${type.text};
                    font-size:${Math.max(9, Math.min(13, 11 * zoom))}px;">
            ${elementLabelHtml(element, zoom)}
            ${element.id === mapSelected && mapEdit ? '<span class="map-handle" data-handle></span>' : ''}
        </div>`;
}

function propsPanelHtml() {
    const element = mapElementById(mapSelected);
    if (!element) {
        return `<div class="card"><div class="empty">
            ${mapEdit ? 'Klikni na prvek v plánu a můžeš ho posouvat, měnit velikost a psát k němu artikly.'
                      : 'Klikni na prvek a uvidíš, co v něm je.'}
        </div></div>`;
    }

    const type = mapTypeById(element.type);
    return `
        <div class="card">
            <h3>${esc(element.name || 'Bez názvu')}
                <span class="pill" style="background:${type.fill}; color:${type.text}; border-color:${type.stroke};">
                    ${esc(type.name)}</span>
            </h3>

            ${mapEdit ? `
            <div class="field">
                <label>Název</label>
                <input type="text" data-prop="name" value="${esc(element.name)}">
            </div>
            <div class="field">
                <label>Typ prvku</label>
                <select data-prop="type">
                    ${MAP_TYPES.map(t => `<option value="${t.id}" ${t.id === element.type ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
                </select>
            </div>
            <div class="field-row">
                <div class="field"><label>X</label><input type="number" data-prop="x" value="${element.x}"></div>
                <div class="field"><label>Y</label><input type="number" data-prop="y" value="${element.y}"></div>
                <div class="field"><label>Šířka</label><input type="number" data-prop="w" value="${element.w}"></div>
                <div class="field"><label>Výška</label><input type="number" data-prop="h" value="${element.h}"></div>
            </div>
            <div class="field">
                <label>Poznámka</label>
                <input type="text" data-prop="note" value="${esc(element.note)}" placeholder="např. gondola se mění každý čtvrtek">
            </div>
            <div class="btn-row" style="margin-bottom:0.9rem;">
                <button class="btn-secondary" data-map-action="duplicate">⧉ Duplikovat</button>
                <button class="btn-danger" data-map-action="delete-el">🗑️ Smazat prvek</button>
            </div>` : `
            ${element.note ? `<div class="muted" style="margin-bottom:0.6rem;">📝 ${esc(element.note)}</div>` : ''}`}

            <div class="btn-row">
                <button class="btn" data-map-action="detail">📐 Otevřít regál (${articleText(element.articles.length)})</button>
                ${mapEdit ? `<button class="btn-secondary" data-map-action="element-photo">
                    ${element.photo ? '🖼️ Změnit fotku místa' : '📷 Fotka místa'}</button>` : ''}
            </div>
        </div>`;
}

/* Fotka je buď rovnou v datech, nebo uložená zvlášť v účtu a dotáhne se později. */
function photoOf(item) {
    if (item.photo) return item.photo;
    if (item.photoId && window.CLOUD) return window.CLOUD.cachedPhoto(item.photoId);
    return null;
}

function hasPhoto(item) {
    return Boolean(item.photo || item.photoId);
}

/* Přepíše online vrstva – dotáhne fotky, které ještě nejsou stažené. */
function hydratePhotos() {}

/* Před úpravou potřebujeme mít fotku po ruce, ať ji formulář ukáže
   a ať „Odebrat" opravdu odebere. */
async function ensurePhotoData(item) {
    if (!item || item.photo || !item.photoId) return;
    if (window.CLOUD && window.CLOUD.fetchPhoto) {
        const data = await window.CLOUD.fetchPhoto(item.photoId);
        if (data) item.photo = data;
    }
}

function articleThumbHtml(article, elementId) {
    if (!hasPhoto(article)) return '<span class="article-thumb empty">🛒</span>';
    const src = photoOf(article);
    return `<img class="article-thumb" ${src ? `src="${esc(src)}"` : 'data-photo-pending'}
                 data-photo-id="${esc(article.photoId || '')}" alt=""
                 data-map-action="photo" data-el-id="${elementId}" data-article="${article.id}">`;
}

function articleListHtml() {
    const rows = allArticles();

    return `
        <div class="card">
            <h3>📋 Všechny artikly (${rows.length})
                <button class="btn-secondary" data-map-action="toggle-list">Skrýt</button>
            </h3>
            ${rows.length ? rows.map(({ element, article }) => `
                <div class="row">
                    ${articleThumbHtml(article, element.id)}
                    <div class="row-main" data-map-action="goto" data-el-id="${element.id}" style="cursor:pointer;">
                        <div class="row-title">${esc(article.name)}</div>
                        <div class="row-sub">📍 ${esc(element.name)}${article.shelf ? ` · ${esc(article.shelf)}` : ''}</div>
                        <div class="row-sub">${article.ean ? `EAN ${esc(article.ean)}` : ''}${
                            article.code ? `${article.ean ? ' · ' : ''}č. ${esc(article.code)}` : ''}</div>
                    </div>
                    <div class="row-actions">
                        <button class="btn-ghost" data-map-action="edit-article-of"
                                data-el-id="${element.id}" data-article="${article.id}">✏️</button>
                    </div>
                </div>`).join('')
            : '<div class="empty">Zatím žádné artikly. Klikni na prvek v plánu a přidej, co v něm leží.</div>'}
        </div>`;
}

function renderMap() {
    const hitList = findArticles(mapSearch);
    const hits = new Set(hitList.map(hit => hit.element.id));
    const styles = getComputedStyle(view);
    const padding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
    const available = Math.max(260, (view.clientWidth || document.body.clientWidth) - padding - 4);
    const zoom = effectiveZoom(available);

    view.innerHTML = `
        <div class="view-head">
            <div>
                <h2>Plán prodejny</h2>
                <div class="subtitle">${DB.map.elements.length} prvků · ${articleText(articleCount())} ·
                    ${photoCount()} fotek · ${formatBytes(storageBytes())} ·
                    ${mapEdit ? 'režim úprav' : 'režim prohlížení – klikni na prvek'}</div>
            </div>
            <div class="btn-row no-print">
                <button class="${mapEdit ? 'btn' : 'btn-secondary'}" data-map-action="toggle-edit">
                    ${mapEdit ? '🔒 Přepnout na prohlížení' : '✏️ Přepnout na úpravy'}
                </button>
            </div>
        </div>

        <div class="card no-print">
            <div class="search-bar" style="margin-bottom:0;">
                <input type="search" placeholder="Kde je artikl? Např. rýže…" value="${esc(mapSearch)}" data-map-search>
                <button class="btn-secondary" data-map-action="toggle-list">${mapShowList ? 'Skrýt seznam' : '📋 Seznam artiklů'}</button>
            </div>
            ${mapSearch ? (hitList.length ? `
                <div style="margin-top:0.7rem;">
                    ${hitList.map(({ element, article }) => `
                        <div class="row">
                            ${articleThumbHtml(article, element.id)}
                            <div class="row-main" data-map-action="goto" data-el-id="${element.id}" style="cursor:pointer;">
                                <div class="row-title">${esc(article.name)}</div>
                                <div class="row-sub">📍 ${esc(element.name)}${article.shelf ? ` · ${esc(article.shelf)}` : ''}</div>
                                <div class="row-sub">${article.ean ? `EAN ${esc(article.ean)}` : ''}</div>
                            </div>
                            <button class="btn-ghost" data-map-action="detail-of" data-el-id="${element.id}">🔍</button>
                        </div>`).join('')}
                </div>`
                : '<div class="empty">Nic takového tu zapsané není.</div>') : ''}
        </div>

        ${mapEdit ? `
        <div class="map-toolbar no-print">
            <select data-map-add>
                <option value="">➕ Přidat prvek…</option>
                ${MAP_TYPES.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}
            </select>
            <button class="btn-secondary" data-map-action="zoom-out">−</button>
            <button class="btn-secondary" data-map-action="zoom-in">+</button>
            <button class="btn-secondary" data-map-action="zoom-fit">Na šířku</button>
            <button class="btn-secondary" data-map-action="undo">↩︎ Zpět</button>
            <button class="btn-secondary" data-map-action="print">🖨️ Tisk</button>
            <button class="btn-secondary" data-map-action="reset-map">⟲ Výchozí plán</button>
        </div>` : ''}

        <div class="map-wrap ${mapEdit ? 'editing' : ''}" id="map-wrap">
            <div class="map-canvas" id="map-canvas"
                 style="width:${Math.round(DB.map.width * zoom)}px; height:${Math.round(DB.map.height * zoom)}px;">
                ${DB.map.elements.map(element => mapElementHtml(element, zoom, hits)).join('')}
            </div>
        </div>

        <div id="map-props">${propsPanelHtml()}</div>
        ${mapShowList ? articleListHtml() : ''}

        <div class="card no-print">
            <h3>🎨 Legenda</h3>
            <div class="tag-list">
                ${MAP_TYPES.filter(t => t.id !== 'popisek').map(t => `
                    <span class="pill" style="background:${t.fill}; color:${t.text}; border-color:${t.stroke};">
                        ${esc(t.name)}</span>`).join('')}
            </div>
        </div>`;

    mapCurrentZoom = zoom;
    const wrap = document.getElementById('map-wrap');
    wrap.scrollLeft = mapScroll.left;
    wrap.scrollTop = mapScroll.top;
    wrap.addEventListener('scroll', () => { mapScroll = { left: wrap.scrollLeft, top: wrap.scrollTop }; });

    attachMapHandlers(zoom);
    hydratePhotos(view);
}

/* --- Interakce v plánu ------------------------------------------------------ */

function applyElementStyle(element) {
    const node = document.querySelector(`[data-el="${element.id}"]`);
    if (!node) return;
    node.style.left = `${element.x * mapCurrentZoom}px`;
    node.style.top = `${element.y * mapCurrentZoom}px`;
    node.style.width = `${element.w * mapCurrentZoom}px`;
    node.style.height = `${element.h * mapCurrentZoom}px`;
}

/* Výběr prvku překreslí jen panel – plán zůstane na místě, ať jde hned táhnout. */
function selectElement(id) {
    mapSelected = id;
    const canvas = document.getElementById('map-canvas');
    canvas.querySelectorAll('.map-el.selected').forEach(node => {
        node.classList.remove('selected');
        const handle = node.querySelector('[data-handle]');
        if (handle) handle.remove();
    });

    const node = id ? canvas.querySelector(`[data-el="${id}"]`) : null;
    if (node) {
        node.classList.add('selected');
        if (mapEdit && !node.querySelector('[data-handle]')) {
            const handle = document.createElement('span');
            handle.className = 'map-handle';
            handle.dataset.handle = '';
            node.appendChild(handle);
        }
    }
    refreshPanel();
}

function refreshPanel() {
    const holder = document.getElementById('map-props');
    if (!holder) return;
    holder.innerHTML = propsPanelHtml();
    attachPanelHandlers();
}

function attachPanelHandlers() {
    const holder = document.getElementById('map-props');
    if (!holder) return;

    holder.querySelectorAll('[data-prop]').forEach(input => {
        input.addEventListener('change', () => {
            const element = mapElementById(mapSelected);
            if (!element) return;
            pushMapUndo();
            const key = input.dataset.prop;
            element[key] = ['x', 'y', 'w', 'h'].includes(key)
                ? Math.max(0, Math.round(Number(input.value) || 0))
                : input.value.trim();
            save();
            if (key === 'type' || key === 'name') renderMap();
            else { applyElementStyle(element); refreshPanel(); }
        });
    });

    holder.querySelectorAll('[data-map-action]').forEach(node => {
        node.addEventListener('click', () => runMapAction(node.dataset.mapAction, node.dataset));
    });
}

function attachMapHandlers(zoom) {
    const canvas = document.getElementById('map-canvas');
    let drag = null;

    canvas.addEventListener('pointerdown', event => {
        const node = event.target.closest('.map-el');
        if (!node) {
            if (mapSelected) selectElement(null);
            return;
        }

        const element = mapElementById(node.dataset.el);
        if (!element) return;
        if (element.id !== mapSelected) selectElement(element.id);
        if (!mapEdit) { go(`#/regal/${element.id}`); return; }

        drag = {
            node,
            element,
            resizing: Boolean(event.target.closest('[data-handle]')),
            startX: event.clientX,
            startY: event.clientY,
            origin: { x: element.x, y: element.y, w: element.w, h: element.h },
            moved: false
        };
        node.setPointerCapture(event.pointerId);
        event.preventDefault();
    });

    canvas.addEventListener('pointermove', event => {
        if (!drag) return;
        const dx = (event.clientX - drag.startX) / zoom;
        const dy = (event.clientY - drag.startY) / zoom;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;

        const snap = value => Math.round(value / SNAP) * SNAP;
        if (drag.resizing) {
            drag.element.w = Math.max(10, snap(drag.origin.w + dx));
            drag.element.h = Math.max(10, snap(drag.origin.h + dy));
        } else {
            drag.element.x = Math.max(0, Math.min(DB.map.width - drag.element.w, snap(drag.origin.x + dx)));
            drag.element.y = Math.max(0, Math.min(DB.map.height - drag.element.h, snap(drag.origin.y + dy)));
        }
        applyElementStyle(drag.element);
    });

    const endDrag = () => {
        if (!drag) return;
        const { origin, element, moved } = drag;
        drag = null;
        if (!moved) return;
        /* Do historie patří stav před tažením. */
        const after = { x: element.x, y: element.y, w: element.w, h: element.h };
        Object.assign(element, origin);
        pushMapUndo();
        Object.assign(element, after);
        save();
        refreshPanel();
    };

    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('lostpointercapture', endDrag);

    canvas.addEventListener('dblclick', event => {
        const node = event.target.closest('.map-el');
        if (node) go(`#/regal/${node.dataset.el}`);
    });

    const search = view.querySelector('[data-map-search]');
    if (search) search.addEventListener('input', () => {
        const caret = search.selectionStart;
        mapSearch = search.value;
        renderMap();
        const next = view.querySelector('[data-map-search]');
        if (next) { next.focus(); next.setSelectionRange(caret, caret); }
    });

    const adder = view.querySelector('[data-map-add]');
    if (adder) adder.addEventListener('change', () => {
        if (adder.value) addMapElement(adder.value);
    });

    /* Tlačítka mimo panel; panel si posluchače připojuje sám, protože se
       překresluje i samostatně (výběr prvku, konec tažení). */
    view.querySelectorAll('[data-map-action]').forEach(node => {
        if (node.closest('#map-props')) return;
        node.addEventListener('click', () => runMapAction(node.dataset.mapAction, node.dataset));
    });
    attachPanelHandlers();
}

/* --- Akce plánu -------------------------------------------------------------- */

function addMapElement(type) {
    pushMapUndo();
    const element = {
        id: uid(),
        type,
        name: mapTypeById(type).name,
        x: Math.round(DB.map.width / 2 - 40),
        y: Math.round(DB.map.height / 2 - 30),
        w: 80,
        h: 60,
        note: '',
        articles: []
    };
    DB.map.elements.push(element);
    mapSelected = element.id;
    save();
    renderMap();
    toast('Prvek přidán doprostřed plánu');
}

async function articleForm(elementId, articleId, afterSave, presetLevel) {
    const element = mapElementById(elementId);
    if (!element) return;
    const article = articleId ? element.articles.find(a => a.id === articleId) : null;
    await ensurePhotoData(article);
    const photoBefore = article ? (article.photo || '') : '';
    const done = () => { if (afterSave) afterSave(); else renderMap(); };
    const total = levelsOf(element);
    const levelOptions = [{ value: 0, label: 'Nezařazeno' }].concat(
        Array.from({ length: total }, (_, i) => ({ value: i + 1, label: levelName(i + 1, total) })));

    openForm({
        title: article ? 'Upravit artikl' : `Nový artikl · ${element.name}`,
        fields: [
            { name: 'name', label: 'Název', type: 'text', required: true, placeholder: 'např. Rýže basmati 1 kg' },
            { name: 'ean', label: 'EAN', type: 'text', placeholder: '8594001234567',
              hint: 'Čárový kód ze zadní strany obalu.' },
            { type: 'row', fields: [
                { name: 'code', label: 'Číslo artiklu', type: 'text' },
                { name: 'level', label: 'Police', type: 'select', options: levelOptions }
            ] },
            { name: 'shelf', label: 'Upřesnění pozice', type: 'text', placeholder: 'např. vlevo u kraje' },
            { name: 'photo', label: 'Fotka artiklu', type: 'photo',
              hint: 'Fotka se zmenší a uloží do prohlížeče. Ať jich není víc než pár set.' },
            { name: 'note', label: 'Poznámka', type: 'text', placeholder: 'např. akce od čtvrtka, zásoba ve skladu' }
        ],
        values: article || { level: presetLevel || 0 },
        onSave: data => {
            if (!data.name) return;
            data.level = Number(data.level) || 0;
            pushMapUndo();
            if (article) {
                Object.assign(article, data);
                if (data.photo !== photoBefore) article.photoId = '';
            } else {
                element.articles.push({ id: uid(), ...data });
            }
            if (!save()) { mapUndo.pop(); return; }
            done();
            toast(article ? 'Uloženo' : 'Artikl přidán');
        },
        onDelete: article ? () => {
            pushMapUndo();
            element.articles = element.articles.filter(a => a.id !== articleId);
            save();
            done();
            toast('Smazáno');
        } : null
    });
}

/* Fotka celého místa – regálu, gondoly, chladicího boxu. */
async function elementPhotoForm(elementId, afterSave) {
    const element = mapElementById(elementId);
    if (!element) return;
    await ensurePhotoData(element);
    const photoBefore = element.photo || '';

    openForm({
        title: `Fotka místa · ${element.name}`,
        fields: [{ name: 'photo', label: 'Jak to tady vypadá', type: 'photo',
                   hint: 'Vyfoť regál nebo gondolu, ať víš, jak má být naskládaná.' }],
        values: { photo: element.photo || '' },
        onSave: data => {
            pushMapUndo();
            element.photo = data.photo;
            if (data.photo !== photoBefore) element.photoId = '';
            if (!save()) { mapUndo.pop(); return; }
            if (afterSave) afterSave(); else renderMap();
            toast(data.photo ? 'Fotka uložena' : 'Fotka odebrána');
        }
    });
}

/* Fotka přes celou obrazovku; po zavření se vrátíme na regál. */
function openPhoto(elementId, articleId) {
    const element = mapElementById(elementId);
    if (!element) return;
    const article = articleId === 'element' ? null : element.articles.find(a => a.id === articleId);
    const target = article || element;
    if (!hasPhoto(target)) return;
    const photo = photoOf(target);

    openModal({
        title: article ? article.name : element.name,
        bodyHtml: photo
            ? `<img class="photo-full" src="${esc(photo)}" alt="">`
            : `<img class="photo-full" data-photo-pending data-photo-id="${esc(target.photoId)}" alt="">`,
        actionsHtml: '<button class="btn-secondary" data-photo-back>Zpět</button>',
        onMount: modal => {
            modal.querySelector('[data-photo-back]')
                .addEventListener('click', () => { closeModal(); go(`#/regal/${elementId}`); });
            hydratePhotos(modal);
        }
    });
}

function runMapAction(action, data) {
    const element = mapElementById(mapSelected);

    switch (action) {
        case 'toggle-edit':
            mapEdit = !mapEdit;
            renderMap();
            break;
        case 'zoom-in':
            mapZoom = Math.min(2, (mapZoom || effectiveZoom(view.clientWidth)) * 1.25);
            renderMap();
            break;
        case 'zoom-out':
            mapZoom = Math.max(0.15, (mapZoom || effectiveZoom(view.clientWidth)) / 1.25);
            renderMap();
            break;
        case 'zoom-fit':
            mapZoom = null;
            renderMap();
            break;
        case 'undo':
            undoMap();
            break;
        case 'print':
            window.print();
            break;
        case 'toggle-list':
            mapShowList = !mapShowList;
            renderMap();
            break;
        case 'goto':
            mapSelected = data.elId;
            renderMap();
            document.querySelector(`[data-el="${data.elId}"]`)
                ?.scrollIntoView({ block: 'center', inline: 'center' });
            break;
        case 'duplicate': {
            if (!element) return;
            pushMapUndo();
            const copy = {
                ...element,
                id: uid(),
                x: Math.min(DB.map.width - element.w, element.x + 15),
                y: Math.min(DB.map.height - element.h, element.y + 15),
                articles: element.articles.map(a => ({ ...a, id: uid() }))
            };
            DB.map.elements.push(copy);
            mapSelected = copy.id;
            save();
            renderMap();
            break;
        }
        case 'delete-el':
            if (!element) return;
            confirmAction(`Smazat prvek „${element.name}“ i s artikly?`, () => {
                pushMapUndo();
                DB.map.elements = DB.map.elements.filter(e => e.id !== element.id);
                mapSelected = null;
                save();
                renderMap();
            }, { yes: 'Smazat' });
            break;
        case 'detail':
            if (element) go(`#/regal/${element.id}`);
            break;
        case 'element-photo':
            if (element) elementPhotoForm(element.id);
            break;
        case 'add-article':
            if (element) articleForm(element.id);
            break;
        case 'edit-article-of':
            articleForm(data.elId, data.article);
            break;
        case 'photo':
            openPhoto(data.elId, data.article);
            break;
        case 'detail-of':
            go(`#/regal/${data.elId}`);
            break;
        case 'reset-map':
            confirmAction('Vrátit plán do výchozí podoby? Přijdeš o své úpravy i o zapsané artikly.', () => {
                pushMapUndo();
                DB.map = defaultMap();
                mapSelected = null;
                save();
                renderMap();
                toast('Plán vrácen na výchozí');
            }, { yes: 'Vrátit výchozí' });
            break;
    }
}

/* Posun vybraného prvku šipkami. */
document.addEventListener('keydown', event => {
    if (currentRoute().name !== 'mapa' || !mapEdit || !mapSelected) return;
    if (!event.key.startsWith('Arrow')) return;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    const element = mapElementById(mapSelected);
    if (!element) return;
    const step = event.shiftKey ? 20 : SNAP;
    pushMapUndo();
    if (event.key === 'ArrowLeft') element.x = Math.max(0, element.x - step);
    if (event.key === 'ArrowRight') element.x = Math.min(DB.map.width - element.w, element.x + step);
    if (event.key === 'ArrowUp') element.y = Math.max(0, element.y - step);
    if (event.key === 'ArrowDown') element.y = Math.min(DB.map.height - element.h, element.y + step);
    save();
    applyElementStyle(element);
    refreshPanel();
    event.preventDefault();
});
