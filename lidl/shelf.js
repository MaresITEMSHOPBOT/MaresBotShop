/* ==========================================================================
   Pohled na regál – čelní 2D pohled na jedno místo v prodejně.
   Police se přidávají a ubírají, artikly se mezi nimi přetahují prstem i myší.
   ========================================================================== */

let shelfDrag = null;

function shelfGoodsHtml(element, article) {
    const src = photoOf(article);
    const photo = hasPhoto(article)
        ? `<img ${src ? `src="${esc(src)}"` : 'data-photo-pending'}
                data-photo-id="${esc(article.photoId || '')}" alt="">`
        : '';
    return `
        <div class="goods-item" data-article="${article.id}" title="${esc(article.name)}">
            ${photo}
            <span class="goods-name">${esc(article.name)}</span>
            ${article.ean ? `<span class="goods-ean">${esc(article.ean)}</span>` : ''}
        </div>`;
}

function shelfLevelHtml(element, level, total) {
    const goods = articlesOnLevel(element, level);
    return `
        <div class="shelf-level" data-level="${level}">
            <div class="shelf-tag">${esc(levelName(level, total))}
                <span class="shelf-tag-count">${goods.length}</span>
            </div>
            <div class="goods">
                ${goods.map(article => shelfGoodsHtml(element, article)).join('')}
                <button class="goods-add" data-shelf-action="add-here" data-level="${level}"
                        title="Přidat artikl na tuhle polici">＋</button>
            </div>
        </div>`;
}

function renderShelf(elementId) {
    const element = mapElementById(elementId);
    if (!element) { go('#/mapa'); return; }

    const type = mapTypeById(element.type);
    const total = levelsOf(element);
    const loose = articlesOnLevel(element, 0);
    const levels = Array.from({ length: total }, (_, i) => i + 1);

    view.innerHTML = `
        <div class="view-head">
            <div>
                <h2>${esc(element.name || type.name)}</h2>
                <div class="subtitle">
                    <span class="pill" style="background:${type.fill}; color:${type.text}; border-color:${type.stroke};">
                        ${type.icon} ${esc(type.name)}</span>
                    ${articleText(element.articles.length)} · ${total === 1 ? '1 police' : total <= 4 ? total + ' police' : total + ' polic'}
                </div>
            </div>
            <div class="btn-row no-print">
                <button class="btn-secondary" data-nav="mapa">← Zpět do plánu</button>
                <button class="btn-secondary" data-shelf-action="scan">🔎 Kontrola dat</button>
                <button class="btn" data-shelf-action="add">➕ Přidat artikl</button>
            </div>
        </div>

        ${element.note ? `<div class="card"><div class="muted">📝 ${esc(element.note)}</div></div>` : ''}

        <div class="card no-print">
            <div class="shelf-controls">
                <span>Počet polic</span>
                <button class="btn-secondary" data-shelf-action="fewer" ${total <= 1 ? 'disabled' : ''}>−</button>
                <strong class="shelf-count">${total}</strong>
                <button class="btn-secondary" data-shelf-action="more" ${total >= 12 ? 'disabled' : ''}>＋</button>
                <span class="muted">Artikly přetáhni na tu polici, kde ve skutečnosti stojí.</span>
            </div>
        </div>

        <div class="shelf-unit">
            ${levels.map(level => shelfLevelHtml(element, level, total)).join('')}
        </div>

        <div class="card">
            <h3>📥 Nezařazené (${loose.length})</h3>
            <div class="shelf-level tray" data-level="0">
                <div class="goods">
                    ${loose.map(article => shelfGoodsHtml(element, article)).join('')}
                    <button class="goods-add" data-shelf-action="add-here" data-level="0" title="Přidat artikl">＋</button>
                </div>
            </div>
            <div class="field-hint">Sem patří zboží, u kterého ještě nevíš polici. Odsud ho přetáhneš do regálu.</div>
        </div>

        <div class="card">
            <h3>📅 Data spotřeby (${checksForElement(element.id).length})
                <button class="btn-secondary" data-shelf-action="scan">🔎 Zkontrolovat</button>
            </h3>
            ${checksForElement(element.id).length
                ? checksForElement(element.id).slice(0, 6).map(checkRowHtml).join('')
                : '<div class="empty">Tady zatím nic zapsaného není.</div>'}
        </div>

        ${hasPhoto(element) ? `
        <div class="card">
            <h3>📷 Jak to tady vypadá</h3>
            <img class="detail-photo" ${photoOf(element) ? `src="${esc(photoOf(element))}"` : 'data-photo-pending'}
                 data-photo-id="${esc(element.photoId || '')}" alt="" data-shelf-action="open-photo">
        </div>` : ''}

        <div class="card no-print">
            <div class="btn-row">
                <button class="btn-secondary" data-shelf-action="photo">
                    ${hasPhoto(element) ? '🖼️ Změnit fotku místa' : '📷 Vyfotit místo'}</button>
                <button class="btn-secondary" data-shelf-action="rename">✏️ Přejmenovat a upravit</button>
            </div>
        </div>`;

    attachShelfHandlers(element);
    attachScanHandlers();
    hydratePhotos(view);
}

/* --- Přetahování zboží ------------------------------------------------------- */

function attachShelfHandlers(element) {
    view.querySelectorAll('[data-shelf-action]').forEach(node => {
        node.addEventListener('click', () => runShelfAction(node.dataset.shelfAction, element, node.dataset));
    });

    view.querySelectorAll('.goods-item').forEach(item => {
        item.addEventListener('pointerdown', event => startGoodsDrag(event, element, item));
    });
}

/* Tažení sledujeme na celém dokumentu – jednou, ne při každém překreslení. */
document.addEventListener('pointermove', moveGoodsDrag);
document.addEventListener('pointerup', endGoodsDrag);
document.addEventListener('pointercancel', endGoodsDrag);

function startGoodsDrag(event, element, item) {
    const ghost = item.cloneNode(true);
    ghost.classList.add('goods-ghost');
    ghost.style.width = `${item.offsetWidth}px`;
    document.body.appendChild(ghost);

    shelfDrag = {
        element,
        articleId: item.dataset.article,
        item,
        ghost,
        moved: false,
        startX: event.clientX,
        startY: event.clientY
    };
    positionGhost(event);
    item.setPointerCapture?.(event.pointerId);
    event.preventDefault();
}

function positionGhost(event) {
    if (!shelfDrag) return;
    shelfDrag.ghost.style.left = `${event.clientX}px`;
    shelfDrag.ghost.style.top = `${event.clientY}px`;
}

function moveGoodsDrag(event) {
    if (!shelfDrag) return;
    if (Math.abs(event.clientX - shelfDrag.startX) > 4 || Math.abs(event.clientY - shelfDrag.startY) > 4) {
        shelfDrag.moved = true;
        shelfDrag.item.classList.add('dragging');
        shelfDrag.ghost.style.display = 'flex';
    }
    positionGhost(event);

    document.querySelectorAll('.shelf-level.over').forEach(node => node.classList.remove('over'));
    const target = levelUnderPointer(event);
    if (target) target.node.classList.add('over');
}

/* Police pod prstem a artikl, před který se zboží zařadí. */
function levelUnderPointer(event) {
    shelfDrag.ghost.style.visibility = 'hidden';
    const under = document.elementFromPoint(event.clientX, event.clientY);
    shelfDrag.ghost.style.visibility = '';
    const node = under && under.closest('.shelf-level');
    if (!node) return null;

    let before = null;
    node.querySelectorAll('.goods-item').forEach(item => {
        if (item.dataset.article === shelfDrag.articleId || before) return;
        const box = item.getBoundingClientRect();
        if (event.clientX < box.left + box.width / 2 && event.clientY < box.bottom) before = item.dataset.article;
    });
    return { node, level: Number(node.dataset.level), before };
}

function endGoodsDrag(event) {
    if (!shelfDrag) return;
    const drag = shelfDrag;
    const target = drag.moved ? levelUnderPointer(event) : null;

    drag.ghost.remove();
    drag.item.classList.remove('dragging');
    document.querySelectorAll('.shelf-level.over').forEach(node => node.classList.remove('over'));
    shelfDrag = null;

    if (!drag.moved) {
        articleForm(drag.element.id, drag.articleId, () => renderShelf(drag.element.id));
        return;
    }
    if (!target) return;

    pushMapUndo();
    moveArticleTo(drag.element, drag.articleId, target.level, target.before);
    save();
    renderShelf(drag.element.id);
}

/* Přesune artikl na police a zařadí ho na správné místo v pořadí. */
function moveArticleTo(element, articleId, level, beforeId) {
    const index = element.articles.findIndex(a => a.id === articleId);
    if (index < 0) return;
    const [article] = element.articles.splice(index, 1);
    article.level = level;

    if (beforeId) {
        const at = element.articles.findIndex(a => a.id === beforeId);
        if (at >= 0) { element.articles.splice(at, 0, article); return; }
    }
    const sameLevel = element.articles.filter(a => (a.level || 0) === level);
    const last = sameLevel[sameLevel.length - 1];
    if (last) element.articles.splice(element.articles.indexOf(last) + 1, 0, article);
    else element.articles.push(article);
}

/* --- Akce -------------------------------------------------------------------- */

function runShelfAction(action, element, data) {
    const back = () => renderShelf(element.id);

    switch (action) {
        case 'more':
            pushMapUndo();
            element.levels = levelsOf(element) + 1;
            save();
            back();
            break;
        case 'fewer': {
            const total = levelsOf(element);
            if (total <= 1) return;
            const orphans = articlesOnLevel(element, total);
            const removeLevel = () => {
                pushMapUndo();
                orphans.forEach(article => { article.level = 0; });
                element.levels = total - 1;
                save();
                back();
            };
            if (!orphans.length) { removeLevel(); break; }
            confirmAction(`Na poslední polici je ${articleText(orphans.length)}. Přesunou se mezi nezařazené.`,
                removeLevel, { safe: true, yes: 'Ubrat polici' });
            break;
        }
        case 'add':
            articleForm(element.id, null, back, 0);
            break;
        case 'add-here':
            articleForm(element.id, null, back, Number(data.level));
            break;
        case 'photo':
            elementPhotoForm(element.id, back);
            break;
        case 'rename':
            go(`#/mapa`);
            mapSelected = element.id;
            break;
        case 'open-photo':
            openPhoto(element.id, 'element');
            break;
        case 'scan':
            scanSession = [];
            go(`#/skenovat/${element.id}`);
            break;
    }
}
