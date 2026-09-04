/* ==========================================================================
   Vedení směny – aplikační logika
   Pohledy se vykreslují do #view, akce se řeší delegací přes data-action.
   ========================================================================== */

const NAV = [
    { id: 'prehled',   label: '📊 Přehled' },
    { id: 'plan',      label: '📅 Plán' },
    { id: 'mapa',      label: '🗺️ Prodejna' },
    { id: 'data',      label: '📅 Data spotřeby' },
    { id: 'tym',       label: '👥 Tým' },
    { id: 'zbozi',     label: '📦 Zboží' },
    { id: 'checklist', label: '✅ Checklist' },
    { id: 'poznamky',  label: '📝 Poznámky' },
    { id: 'nastaveni', label: '⚙️ Nastavení' }
];

const view = document.getElementById('view');
const modalRoot = document.getElementById('modal-root');

let planWeek = weekStart(todayISO());
let noteFilter = { text: '', category: '', tag: '' };
let goodsRange = 'week';

/* --- Drobné pomůcky ------------------------------------------------------- */

function esc(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function toast(message) {
    const box = document.createElement('div');
    box.className = 'toast';
    box.textContent = message;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2200);
}

function persist(message) {
    if (save() && message) toast(message);
    render();
}

function go(hash) {
    location.hash = hash;
}

/* Fotku před uložením zmenšíme – do prohlížeče se vejde jen pár megabajtů. */
function compressImage(file, maxSide = 900, quality = 0.72) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Soubor se nepodařilo načíst.'));
        reader.onload = () => {
            const image = new Image();
            image.onerror = () => reject(new Error('Tohle není obrázek.'));
            image.onload = () => {
                const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(image.width * scale);
                canvas.height = Math.round(image.height * scale);
                canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            image.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

/* --- Modální okno --------------------------------------------------------- */

function closeModal() {
    modalRoot.innerHTML = '';
}

function openModal({ title, bodyHtml, actionsHtml, onMount }) {
    modalRoot.innerHTML = `
        <div class="modal-backdrop" data-close-backdrop>
            <div class="modal" role="dialog" aria-modal="true">
                <div class="modal-head">
                    <h3>${esc(title)}</h3>
                    <button class="btn-ghost" data-close-modal aria-label="Zavřít">✕</button>
                </div>
                <div class="modal-body">${bodyHtml}</div>
                ${actionsHtml ? `<div class="modal-actions">${actionsHtml}</div>` : ''}
            </div>
        </div>`;

    modalRoot.querySelector('[data-close-modal]').addEventListener('click', closeModal);
    modalRoot.querySelector('[data-close-backdrop]').addEventListener('click', event => {
        if (event.target.hasAttribute('data-close-backdrop')) closeModal();
    });
    if (onMount) onMount(modalRoot.querySelector('.modal'));
}

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModal();
});

/* --- Generátor formulářů --------------------------------------------------
   Pole: {name, label, type, options, hint, required, placeholder}
   Typy: text | number | time | date | textarea | select | checkbox | chips | row
   -------------------------------------------------------------------------- */

function fieldHtml(field, values) {
    const value = values[field.name];

    if (field.type === 'row') {
        return `<div class="field-row">${field.fields.map(f => fieldHtml(f, values)).join('')}</div>`;
    }

    if (field.type === 'checkbox') {
        return `
            <div class="field check-item">
                <input type="checkbox" id="f-${field.name}" name="${field.name}" ${value ? 'checked' : ''}>
                <label for="f-${field.name}">${esc(field.label)}</label>
            </div>`;
    }

    if (field.type === 'chips') {
        const selected = Array.isArray(value) ? value : [];
        const chips = field.options.map(opt => `
            <button type="button" class="chip ${selected.includes(opt.value) ? 'on' : ''}"
                    data-chip="${field.name}" data-value="${esc(opt.value)}">${esc(opt.label)}</button>`).join('');
        return `
            <div class="field">
                <label>${esc(field.label)}</label>
                <div class="chips" data-chips="${field.name}">${chips}</div>
                <input type="hidden" name="${field.name}" value="${esc(selected.join(','))}">
                ${field.hint ? `<div class="field-hint">${esc(field.hint)}</div>` : ''}
            </div>`;
    }

    if (field.type === 'photo') {
        return `
            <div class="field">
                <label>${esc(field.label)}</label>
                <div class="photo-field">
                    <div class="photo-preview ${value ? '' : 'empty'}" data-photo-preview="${field.name}">
                        ${value ? `<img src="${esc(value)}" alt="">` : '<span>bez fotky</span>'}
                    </div>
                    <div class="photo-buttons">
                        <label class="btn-secondary" style="cursor:pointer;">
                            📷 Vyfotit / vybrat
                            <input type="file" accept="image/*" data-photo-input="${field.name}" hidden>
                        </label>
                        <button type="button" class="btn-ghost" data-photo-clear="${field.name}">Odebrat</button>
                    </div>
                </div>
                <input type="hidden" name="${field.name}" value="${esc(value || '')}">
                ${field.hint ? `<div class="field-hint">${esc(field.hint)}</div>` : ''}
            </div>`;
    }

    let control;
    if (field.type === 'select') {
        const options = field.options.map(opt =>
            `<option value="${esc(opt.value)}" ${String(value ?? '') === String(opt.value) ? 'selected' : ''}>${esc(opt.label)}</option>`
        ).join('');
        control = `<select name="${field.name}" ${field.required ? 'required' : ''}>${options}</select>`;
    } else if (field.type === 'textarea') {
        control = `<textarea name="${field.name}" placeholder="${esc(field.placeholder || '')}">${esc(value || '')}</textarea>`;
    } else {
        const extra = field.type === 'number' ? `min="${field.min ?? 0}" step="${field.step ?? 1}"` : '';
        control = `<input type="${field.type}" name="${field.name}" value="${esc(value ?? '')}"
                          placeholder="${esc(field.placeholder || '')}" ${extra} ${field.required ? 'required' : ''}>`;
    }

    return `
        <div class="field">
            <label>${esc(field.label)}</label>
            ${control}
            ${field.hint ? `<div class="field-hint">${esc(field.hint)}</div>` : ''}
        </div>`;
}

function readForm(form, fields) {
    const result = {};
    const walk = list => list.forEach(field => {
        if (field.type === 'row') return walk(field.fields);
        const input = form.querySelector(`[name="${field.name}"]`);
        if (!input) return;
        if (field.type === 'checkbox') result[field.name] = input.checked;
        else if (field.type === 'chips') result[field.name] = input.value ? input.value.split(',') : [];
        else if (field.type === 'number') result[field.name] = input.value === '' ? '' : Number(input.value);
        else result[field.name] = input.value.trim();
    });
    walk(fields);
    return result;
}

function openForm({ title, fields, values = {}, submitLabel = 'Uložit', onSave, onDelete, deleteLabel = 'Smazat' }) {
    openModal({
        title,
        bodyHtml: `<form id="modal-form">${fields.map(f => fieldHtml(f, values)).join('')}</form>`,
        actionsHtml: `
            ${onDelete ? `<button type="button" class="btn-danger" data-form-delete>${esc(deleteLabel)}</button>` : ''}
            <button type="button" class="btn-secondary" data-close-modal-2>Zrušit</button>
            <button type="submit" form="modal-form" class="btn">${esc(submitLabel)}</button>`,
        onMount: modal => {
            const form = modal.querySelector('#modal-form');

            modal.querySelectorAll('[data-chip]').forEach(chip => {
                chip.addEventListener('click', () => {
                    const holder = form.querySelector(`input[name="${chip.dataset.chip}"]`);
                    const current = holder.value ? holder.value.split(',') : [];
                    const index = current.indexOf(chip.dataset.value);
                    if (index >= 0) current.splice(index, 1);
                    else current.push(chip.dataset.value);
                    holder.value = current.join(',');
                    chip.classList.toggle('on');
                });
            });

            modal.querySelectorAll('[data-photo-input]').forEach(input => {
                input.addEventListener('change', async () => {
                    const file = input.files[0];
                    if (!file) return;
                    const name = input.dataset.photoInput;
                    const preview = modal.querySelector(`[data-photo-preview="${name}"]`);
                    preview.innerHTML = '<span>zpracovávám…</span>';
                    try {
                        const data = await compressImage(file);
                        form.querySelector(`input[name="${name}"]`).value = data;
                        preview.classList.remove('empty');
                        preview.innerHTML = `<img src="${data}" alt="">`;
                    } catch (err) {
                        preview.classList.add('empty');
                        preview.innerHTML = '<span>nepovedlo se</span>';
                        alert(err.message);
                    }
                    input.value = '';
                });
            });

            modal.querySelectorAll('[data-photo-clear]').forEach(button => {
                button.addEventListener('click', () => {
                    const name = button.dataset.photoClear;
                    form.querySelector(`input[name="${name}"]`).value = '';
                    const preview = modal.querySelector(`[data-photo-preview="${name}"]`);
                    preview.classList.add('empty');
                    preview.innerHTML = '<span>bez fotky</span>';
                });
            });

            modal.querySelector('[data-close-modal-2]').addEventListener('click', closeModal);
            const deleteBtn = modal.querySelector('[data-form-delete]');
            if (deleteBtn) deleteBtn.addEventListener('click', () => {
                if (confirm('Opravdu smazat? Tuhle akci nelze vrátit zpět.')) { closeModal(); onDelete(); }
            });

            form.addEventListener('submit', event => {
                event.preventDefault();
                const data = readForm(form, fields);
                closeModal();
                onSave(data);
            });
            const first = form.querySelector('input, select, textarea');
            if (first) first.focus();
        }
    });
}

function employeeOptions(includeEmpty = true) {
    const options = activeEmployees().map(e => ({ value: e.id, label: e.name }));
    return includeEmpty ? [{ value: '', label: '—' }, ...options] : options;
}

function taskChipOptions() {
    return DB.tasks.map(t => ({ value: t.id, label: `${t.icon} ${t.name}` }));
}

/* --- Vykreslení hlavičky a routeru ---------------------------------------- */

function currentRoute() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    return { name: parts[0] || 'prehled', param: parts[1] || '' };
}

function renderNav(active) {
    document.getElementById('main-nav').innerHTML = NAV.map(item =>
        `<button class="tab ${item.id === active ? 'active' : ''}" data-nav="${item.id}">${item.label}</button>`
    ).join('');
}

function renderHeader() {
    document.getElementById('app-sub').textContent =
        DB.settings.storeName ? DB.settings.storeName : 'Nastav si prodejnu v Nastavení';
}

function render() {
    const route = currentRoute();
    const active = route.name === 'den' ? 'plan'
        : route.name === 'regal' ? 'mapa'
        : route.name === 'skenovat' ? 'data'
        : route.name;
    renderNav(active);
    renderHeader();
    window.scrollTo({ top: 0 });

    switch (route.name) {
        case 'plan':      return renderPlan();
        case 'mapa':      return renderMap();
        case 'regal':     return renderShelf(route.param);
        case 'data':      return renderChecks();
        case 'skenovat':  return route.param ? renderScan(route.param) : renderPlacePicker();
        case 'den':       return renderDayDetail(route.param || todayISO());
        case 'tym':       return renderTeam();
        case 'zbozi':     return renderGoods();
        case 'checklist': return renderChecklist();
        case 'poznamky':  return renderNotes();
        case 'nastaveni': return renderSettings();
        default:          return renderDashboard();
    }
}

/* --- Přehled --------------------------------------------------------------- */

function entrySummary(entry) {
    const tasks = entry.tasks.map(id => taskById(id).name).join(', ');
    return `${entry.from}–${entry.to} · ${minutesToText(netMinutes(entry.from, entry.to))}${tasks ? ' · ' + tasks : ''}`;
}

function sortedEntries(day) {
    return [...day.entries].sort((a, b) => (timeToMinutes(a.from) || 0) - (timeToMinutes(b.from) || 0));
}

function renderDashboard() {
    const today = todayISO();
    const day = getDay(today);
    const tomorrow = addDays(today, 1);
    const dayTomorrow = getDay(tomorrow);
    const progress = checklistProgress(today);
    const minutes = day.entries.reduce((sum, e) => sum + netMinutes(e.from, e.to), 0);
    const reminders = DB.notes.filter(n => n.important).slice(0, 4);

    const onboarding = DB.employees.length ? '' : `
        <div class="card">
            <h3>👋 Začni tady</h3>
            <p class="muted">Aplikace je prázdná – naplň ji ve třech krocích:</p>
            <ol class="muted" style="margin: 0.5rem 0 0.8rem 1.1rem;">
                <li>V sekci <strong>Tým</strong> přidej kolegy a jejich úvazek.</li>
                <li>V sekci <strong>Plán</strong> naplánuj směny na příští týden.</li>
                <li>Z tréninku si všechno piš do <strong>Poznámek</strong>.</li>
            </ol>
            <div class="btn-row">
                <button class="btn" data-action="add-employee">➕ Přidat prvního člověka</button>
                <button class="btn-secondary" data-nav="nastaveni">⚙️ Nastavit prodejnu</button>
            </div>
        </div>`;

    view.innerHTML = `
        <div class="view-head">
            <div>
                <h2>Dnes</h2>
                <div class="subtitle">${esc(formatDateLong(today))}</div>
            </div>
            <button class="btn" data-action="open-day" data-date="${today}">Otevřít dnešní den →</button>
        </div>

        ${onboarding}

        <div class="grid grid-3" style="margin-bottom: 0.9rem;">
            <div class="stat">
                <div class="stat-label">Lidí ve směně</div>
                <div class="stat-value">${day.entries.length}</div>
                <div class="stat-hint">${minutesToText(minutes)} celkem</div>
            </div>
            <div class="stat">
                <div class="stat-label">Palet dnes</div>
                <div class="stat-value">${palletsOfDay(today)}</div>
                <div class="stat-hint">${rollsOfDay(today)} rolí / klecí</div>
            </div>
            <div class="stat">
                <div class="stat-label">Checklist</div>
                <div class="stat-value">${progress.done}/${progress.total}</div>
                <div class="stat-hint">úkolů vedoucího směny</div>
            </div>
            <div class="stat">
                <div class="stat-label">Vedoucí směny</div>
                <div class="stat-value" style="font-size: 1rem; padding-top: 0.35rem;">
                    ${day.leaderId ? esc(employeeName(day.leaderId)) : '<span class="muted">nezadáno</span>'}
                </div>
                <div class="stat-hint">${day.leaderPmId ? 'odpol.: ' + esc(employeeName(day.leaderPmId)) : 'odpolední nezadán'}</div>
            </div>
        </div>

        <div class="grid grid-2">
            <div class="card">
                <h3>👥 Kdo je dnes v práci
                    <button class="btn-secondary" data-action="add-entry" data-date="${today}">➕ Přidat</button>
                </h3>
                ${day.entries.length ? sortedEntries(day).map(entry => `
                    <div class="row">
                        <div class="row-main">
                            <div class="row-title">${esc(employeeName(entry.employeeId))}</div>
                            <div class="row-sub">${esc(entrySummary(entry))}</div>
                        </div>
                        <div class="row-actions">
                            <button class="btn-ghost" data-action="edit-entry" data-date="${today}" data-id="${entry.id}">✏️</button>
                        </div>
                    </div>`).join('') : '<div class="empty">Na dnešek zatím nikdo naplánovaný.</div>'}
            </div>

            <div class="card">
                <h3>🚚 Dodávky dnes
                    <button class="btn-secondary" data-action="add-delivery" data-date="${today}">➕ Zapsat</button>
                </h3>
                ${day.deliveries.length ? day.deliveries.map(item => {
                    const type = deliveryTypeById(item.typeId);
                    return `
                    <div class="row">
                        <div class="row-main">
                            <div class="row-title">${type.icon} ${esc(type.name)}</div>
                            <div class="row-sub">${item.pallets} palet${item.rolls ? ` · ${item.rolls} rolí` : ''}${item.arrived ? ` · příjezd ${esc(item.arrived)}` : ''}${item.note ? ' · ' + esc(item.note) : ''}</div>
                        </div>
                        <div class="row-actions">
                            <button class="btn-ghost" data-action="edit-delivery" data-date="${today}" data-id="${item.id}">✏️</button>
                        </div>
                    </div>`;
                }).join('') : '<div class="empty">Dnes zatím nic zapsaného.</div>'}
            </div>

            <div class="card">
                <h3>📅 Zítra – ${esc(dayName(tomorrow))} ${esc(formatDate(tomorrow))}</h3>
                ${dayTomorrow.entries.length ? sortedEntries(dayTomorrow).map(entry => `
                    <div class="day-person">
                        <span>${esc(employeeName(entry.employeeId))}</span>
                        <span>${esc(entry.from)}–${esc(entry.to)}</span>
                    </div>`).join('') : '<div class="empty">Zítřek zatím není naplánovaný.</div>'}
                <div class="btn-row" style="margin-top: 0.7rem;">
                    <button class="btn-secondary" data-action="open-day" data-date="${tomorrow}">Naplánovat zítřek</button>
                </div>
            </div>

            <div class="card">
                <h3>⭐ Připomínky z tréninku</h3>
                ${reminders.length ? reminders.map(note => `
                    <div class="row">
                        <div class="row-main">
                            <div class="row-title">${esc(note.title)}</div>
                            <div class="row-sub">${esc(note.category || 'Bez kategorie')} · ${esc(formatDate(note.date))}</div>
                        </div>
                        <div class="row-actions">
                            <button class="btn-ghost" data-action="edit-note" data-id="${note.id}">✏️</button>
                        </div>
                    </div>`).join('') : '<div class="empty">Označ si poznámku hvězdičkou a bude ti tady svítit.</div>'}
                <div class="btn-row" style="margin-top: 0.7rem;">
                    <button class="btn-secondary" data-action="add-note">➕ Nová poznámka</button>
                </div>
            </div>
        </div>`;
}

/* --- Týdenní plán ---------------------------------------------------------- */

function renderPlan() {
    const days = weekDays(planWeek);
    const today = todayISO();
    let weekMinutes = 0;
    let weekPallets = 0;

    const cards = days.map(iso => {
        const day = getDay(iso);
        const minutes = day.entries.reduce((sum, e) => sum + netMinutes(e.from, e.to), 0);
        const pallets = palletsOfDay(iso);
        weekMinutes += minutes;
        weekPallets += pallets;

        const people = sortedEntries(day).map(entry => `
            <div class="day-person">
                <span>${esc(employeeName(entry.employeeId))}</span>
                <span>${esc(entry.from)}–${esc(entry.to)}</span>
            </div>`).join('');

        return `
            <div class="day-card ${iso === today ? 'today' : ''} ${isWeekend(iso) ? 'weekend' : ''}"
                 data-action="open-day" data-date="${iso}">
                <div class="day-head">
                    <span class="day-name">${esc(dayName(iso))}</span>
                    <span class="day-date">${esc(formatDate(iso))}</span>
                </div>
                ${day.leaderId ? `<div class="muted">Vedoucí: ${esc(employeeName(day.leaderId))}</div>` : ''}
                <div class="day-people">${people || '<span class="muted">Zatím nikdo</span>'}</div>
                <div class="day-meta">
                    ${day.entries.length ? `<span class="pill">${peopleText(day.entries.length)} · ${minutesToText(minutes)}</span>` : ''}
                    ${pallets ? `<span class="pill accent">📦 ${pallets} palet</span>` : ''}
                    ${day.note ? '<span class="pill warning">📝 poznámka</span>' : ''}
                </div>
            </div>`;
    }).join('');

    view.innerHTML = `
        <div class="view-head">
            <div>
                <h2>Plán směn</h2>
                <div class="subtitle">${esc(formatDate(planWeek))} – ${esc(formatDate(addDays(planWeek, 6)))}
                    · ${minutesToText(weekMinutes)} · ${weekPallets} palet</div>
            </div>
            <div class="btn-row no-print">
                <button class="btn-secondary" data-action="copy-week">📋 Zkopírovat minulý týden</button>
                <button class="btn-secondary" data-action="print">🖨️ Tisk</button>
            </div>
        </div>

        <div class="week-nav no-print">
            <button class="btn-secondary" data-action="week-prev">← Předchozí</button>
            <div class="week-label">Týden ${esc(formatDate(planWeek))}</div>
            <button class="btn-secondary" data-action="week-next">Další →</button>
        </div>
        <div class="btn-row no-print" style="margin-bottom: 0.9rem;">
            <button class="btn-secondary" data-action="week-today">Dnešní týden</button>
        </div>

        <div class="grid grid-2">${cards}</div>

        <div class="card" style="margin-top: 0.9rem;">
            <h3>⏱️ Hodiny v tomto týdnu</h3>
            ${activeEmployees().length ? `
            <div class="table-scroll">
                <table class="data">
                    <thead>
                        <tr><th>Člověk</th><th class="num">Naplánováno</th><th class="num">Úvazek</th><th>Rozdíl</th></tr>
                    </thead>
                    <tbody>
                        ${activeEmployees().map(employee => {
                            const minutes = workedMinutes(employee.id, planWeek, addDays(planWeek, 6));
                            const contract = Number(employee.contract) || 0;
                            const diff = contract ? (minutes / 60) - contract : null;
                            const label = diff == null ? '–'
                                : diff === 0 ? 'přesně'
                                : diff > 0 ? `+${diff.toFixed(1)} h` : `${diff.toFixed(1)} h`;
                            const cls = diff == null ? '' : diff > 0.5 ? 'danger' : diff < -0.5 ? 'warning' : 'success';
                            return `<tr>
                                <td>${esc(employee.name)}</td>
                                <td class="num">${minutesToText(minutes)}</td>
                                <td class="num">${contract ? contract + ' h' : '–'}</td>
                                <td>${cls ? `<span class="pill ${cls}">${label}</span>` : '–'}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>` : '<div class="empty">Nejdřív přidej lidi v sekci Tým.</div>'}
        </div>`;
}

/* --- Detail dne ------------------------------------------------------------ */

function checklistBlock(iso, key, title) {
    const day = getDay(iso);
    const items = DB.checklists[key] || [];
    if (!items.length) return '';
    return `
        <div class="card">
            <h3>${esc(title)}</h3>
            ${items.map(item => `
                <div class="check-item ${day.checks[item.id] ? 'done' : ''}">
                    <input type="checkbox" id="chk-${item.id}" data-change="toggle-check"
                           data-date="${iso}" data-id="${item.id}" ${day.checks[item.id] ? 'checked' : ''}>
                    <label for="chk-${item.id}">${esc(item.text)}</label>
                </div>`).join('')}
        </div>`;
}

function renderDayDetail(iso) {
    const day = getDay(iso);
    const minutes = day.entries.reduce((sum, e) => sum + netMinutes(e.from, e.to), 0);
    const progress = checklistProgress(iso);

    view.innerHTML = `
        <div class="view-head">
            <div>
                <h2>${esc(formatDateLong(iso))}</h2>
                <div class="subtitle">${peopleText(day.entries.length)} · ${minutesToText(minutes)} ·
                    ${palletsOfDay(iso)} palet · checklist ${progress.done}/${progress.total}</div>
            </div>
            <div class="btn-row no-print">
                <button class="btn-secondary" data-action="day-prev" data-date="${iso}">←</button>
                <button class="btn-secondary" data-action="day-next" data-date="${iso}">→</button>
                <button class="btn-secondary" data-nav="plan">Zpět na plán</button>
            </div>
        </div>

        <div class="card">
            <h3>👑 Vedení směny</h3>
            <div class="field-row">
                <div class="field">
                    <label>Ranní směna</label>
                    <select data-change="set-leader" data-date="${iso}" data-slot="leaderId">
                        ${employeeOptions().map(o =>
                            `<option value="${esc(o.value)}" ${o.value === day.leaderId ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
                    </select>
                </div>
                <div class="field">
                    <label>Odpolední směna</label>
                    <select data-change="set-leader" data-date="${iso}" data-slot="leaderPmId">
                        ${employeeOptions().map(o =>
                            `<option value="${esc(o.value)}" ${o.value === day.leaderPmId ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
                    </select>
                </div>
            </div>
        </div>

        <div class="grid grid-2">
            <div class="card">
                <h3>👥 Rozdělení lidí
                    <button class="btn-secondary" data-action="add-entry" data-date="${iso}">➕ Přidat</button>
                </h3>
                ${day.entries.length ? sortedEntries(day).map(entry => {
                    const employee = employeeById(entry.employeeId);
                    return `
                    <div class="row">
                        <div class="row-main">
                            <div class="row-title">${esc(employee ? employee.name : 'Neurčeno')}
                                ${employee && employee.position ? `<span class="muted">· ${esc(employee.position)}</span>` : ''}</div>
                            <div class="row-sub">${esc(entrySummary(entry))}</div>
                            ${entry.note ? `<div class="row-sub">📝 ${esc(entry.note)}</div>` : ''}
                        </div>
                        <div class="row-actions">
                            <button class="btn-ghost" data-action="edit-entry" data-date="${iso}" data-id="${entry.id}">✏️</button>
                        </div>
                    </div>`;
                }).join('') : '<div class="empty">Zatím prázdno. Přidej lidi do směny.</div>'}
                <div class="btn-row no-print" style="margin-top: 0.7rem;">
                    <button class="btn-secondary" data-action="copy-day" data-date="${iso}">📋 Zkopírovat z jiného dne</button>
                </div>
            </div>

            <div class="card">
                <h3>🚚 Dodávky a palety
                    <button class="btn-secondary" data-action="add-delivery" data-date="${iso}">➕ Zapsat</button>
                </h3>
                ${day.deliveries.length ? day.deliveries.map(item => {
                    const type = deliveryTypeById(item.typeId);
                    const span = (item.startedAt && item.doneAt)
                        ? shiftMinutes(item.startedAt, item.doneAt) : null;
                    const speed = span && item.pallets ? (item.pallets / (span / 60)).toFixed(1) : null;
                    return `
                    <div class="row">
                        <div class="row-main">
                            <div class="row-title">${type.icon} ${esc(type.name)} · ${item.pallets} palet</div>
                            <div class="row-sub">
                                ${item.rolls ? `${item.rolls} rolí / klecí · ` : ''}
                                ${item.arrived ? `příjezd ${esc(item.arrived)} · ` : ''}
                                ${span ? `zpracováno ${esc(item.startedAt)}–${esc(item.doneAt)} (${minutesToText(span)})` : 'nezpracováno'}
                                ${speed ? ` · ${speed} palet/h` : ''}
                            </div>
                            ${item.note ? `<div class="row-sub">📝 ${esc(item.note)}</div>` : ''}
                        </div>
                        <div class="row-actions">
                            <button class="btn-ghost" data-action="edit-delivery" data-date="${iso}" data-id="${item.id}">✏️</button>
                        </div>
                    </div>`;
                }).join('') : '<div class="empty">Žádná dodávka zapsaná.</div>'}
                ${day.deliveries.length ? `<div class="muted" style="margin-top:0.5rem;">
                    Celkem <strong>${palletsOfDay(iso)}</strong> palet a <strong>${rollsOfDay(iso)}</strong> rolí.</div>` : ''}
            </div>
        </div>

        ${checklistBlock(iso, 'open', '🌅 Otevření prodejny')}
        ${checklistBlock(iso, 'during', '🕑 Během směny')}
        ${checklistBlock(iso, 'close', '🌙 Zavírání')}

        <div class="card">
            <h3>📈 Čísla dne a předání směny</h3>
            <div class="field-row">
                <div class="field">
                    <label>Tržba</label>
                    <input type="text" data-change="set-stat" data-date="${iso}" data-key="revenue"
                           value="${esc(day.stats.revenue || '')}" placeholder="např. 285 000">
                </div>
                <div class="field">
                    <label>Zákazníků</label>
                    <input type="text" data-change="set-stat" data-date="${iso}" data-key="customers"
                           value="${esc(day.stats.customers || '')}" placeholder="např. 1 240">
                </div>
                <div class="field">
                    <label>Odpisy</label>
                    <input type="text" data-change="set-stat" data-date="${iso}" data-key="writeOff"
                           value="${esc(day.stats.writeOff || '')}" placeholder="např. 3 200">
                </div>
            </div>
            <div class="field">
                <label>Poznámka ke směně (co se stalo, co předat dál)</label>
                <textarea data-change="set-day-note" data-date="${iso}"
                          placeholder="Např.: rozbitá chladicí vitrína – nahlášeno; chybí dodávka pečiva; nový kolega zaučen na pokladně.">${esc(day.note || '')}</textarea>
            </div>
        </div>`;
}

/* --- Tým ------------------------------------------------------------------- */

function renderTeam() {
    const weekFrom = weekStart(todayISO());
    const weekTo = addDays(weekFrom, 6);
    const list = [...DB.employees].sort((a, b) =>
        Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'cs'));

    view.innerHTML = `
        <div class="view-head">
            <div>
                <h2>Tým</h2>
                <div class="subtitle">${peopleText(DB.employees.filter(e => e.active).length)} v týmu</div>
            </div>
            <button class="btn" data-action="add-employee">➕ Přidat člověka</button>
        </div>

        ${list.length ? `<div class="grid grid-2">${list.map(employee => {
            const minutes = workedMinutes(employee.id, weekFrom, weekTo);
            const contract = Number(employee.contract) || 0;
            const percent = contract ? Math.min(150, Math.round((minutes / 60 / contract) * 100)) : 0;
            const skills = employee.skills.map(id => {
                const task = taskById(id);
                return `<span class="pill">${task.icon} ${esc(task.name)}</span>`;
            }).join('');

            return `
            <div class="card">
                <h3>${esc(employee.name)} ${employee.active ? '' : '<span class="pill">neaktivní</span>'}
                    <button class="btn-ghost" data-action="edit-employee" data-id="${employee.id}">✏️</button>
                </h3>
                <div class="muted">${esc(employee.position || 'Bez pozice')}${employee.phone ? ' · ' + esc(employee.phone) : ''}</div>
                <div style="margin: 0.6rem 0 0.3rem;">
                    <div class="day-person">
                        <span>Tento týden</span>
                        <span>${minutesToText(minutes)}${contract ? ` z ${contract} h` : ''}</span>
                    </div>
                    ${contract ? `<div class="bar"><div class="bar-fill ${percent > 105 ? 'over' : percent >= 95 ? 'done' : ''}"
                        style="width:${Math.min(100, percent)}%"></div></div>` : ''}
                </div>
                ${skills ? `<div class="tag-list">${skills}</div>` : '<div class="muted">Zatím bez zaškolených úseků.</div>'}
                ${employee.note ? `<div class="row-sub" style="margin-top:0.5rem;">📝 ${esc(employee.note)}</div>` : ''}
            </div>`;
        }).join('')}</div>` : '<div class="card"><div class="empty">Zatím tu nikdo není. Přidej kolegy, se kterými chodíš na směny.</div></div>'}`;
}

/* --- Zboží a palety --------------------------------------------------------- */

function goodsRangeBounds() {
    const today = todayISO();
    const date = parseISO(today);
    switch (goodsRange) {
        case 'lastweek': {
            const start = addDays(weekStart(today), -7);
            return { from: start, to: addDays(start, 6), label: 'Minulý týden' };
        }
        case 'month': {
            const first = isoDate(new Date(date.getFullYear(), date.getMonth(), 1));
            const last = isoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
            return { from: first, to: last, label: 'Tento měsíc' };
        }
        case 'last30':
            return { from: addDays(today, -29), to: today, label: 'Posledních 30 dní' };
        case 'all':
            return { from: '0000-01-01', to: '9999-12-31', label: 'Celá historie' };
        default: {
            const start = weekStart(today);
            return { from: start, to: addDays(start, 6), label: 'Tento týden' };
        }
    }
}

function renderGoods() {
    const bounds = goodsRangeBounds();
    const rows = [];
    Object.keys(DB.days).sort().reverse().forEach(iso => {
        if (iso < bounds.from || iso > bounds.to) return;
        const day = getDay(iso);
        if (day.deliveries.length) rows.push({ iso, day });
    });

    const totals = {};
    let pallets = 0;
    let rolls = 0;
    rows.forEach(({ day }) => day.deliveries.forEach(item => {
        pallets += Number(item.pallets) || 0;
        rolls += Number(item.rolls) || 0;
        totals[item.typeId] = (totals[item.typeId] || 0) + (Number(item.pallets) || 0);
    }));

    const perDay = rows.map(({ iso }) => ({ iso, pallets: palletsOfDay(iso) }));
    const busiest = perDay.reduce((best, item) => (!best || item.pallets > best.pallets ? item : best), null);
    const average = perDay.length ? (pallets / perDay.length).toFixed(1) : '0';
    const typeRows = Object.entries(totals).sort((a, b) => b[1] - a[1]);

    view.innerHTML = `
        <div class="view-head">
            <div>
                <h2>Zboží a palety</h2>
                <div class="subtitle">${esc(bounds.label)} · ${dayCountText(rows.length)} se zápisem</div>
            </div>
            <div class="btn-row">
                <select data-change="goods-range">
                    <option value="week" ${goodsRange === 'week' ? 'selected' : ''}>Tento týden</option>
                    <option value="lastweek" ${goodsRange === 'lastweek' ? 'selected' : ''}>Minulý týden</option>
                    <option value="month" ${goodsRange === 'month' ? 'selected' : ''}>Tento měsíc</option>
                    <option value="last30" ${goodsRange === 'last30' ? 'selected' : ''}>Posledních 30 dní</option>
                    <option value="all" ${goodsRange === 'all' ? 'selected' : ''}>Vše</option>
                </select>
                <button class="btn" data-action="add-delivery" data-date="${todayISO()}">➕ Zapsat dodávku</button>
            </div>
        </div>

        <div class="grid grid-3" style="margin-bottom: 0.9rem;">
            <div class="stat"><div class="stat-label">Palet celkem</div><div class="stat-value">${pallets}</div></div>
            <div class="stat"><div class="stat-label">Průměr na den</div><div class="stat-value">${average}</div>
                <div class="stat-hint">z dní s dodávkou</div></div>
            <div class="stat"><div class="stat-label">Rolí / klecí</div><div class="stat-value">${rolls}</div></div>
            <div class="stat"><div class="stat-label">Nejsilnější den</div>
                <div class="stat-value" style="font-size:1.1rem; padding-top:0.3rem;">
                    ${busiest ? `${esc(dayShort(busiest.iso))} ${esc(formatDate(busiest.iso))}` : '–'}</div>
                <div class="stat-hint">${busiest ? busiest.pallets + ' palet' : 'zatím nic'}</div></div>
        </div>

        <div class="grid grid-2">
            <div class="card">
                <h3>📊 Podle druhu zboží</h3>
                ${typeRows.length ? typeRows.map(([typeId, count]) => {
                    const type = deliveryTypeById(typeId);
                    const percent = pallets ? Math.round((count / pallets) * 100) : 0;
                    return `
                        <div style="margin-bottom:0.6rem;">
                            <div class="day-person"><span>${type.icon} ${esc(type.name)}</span><span>${count} palet · ${percent} %</span></div>
                            <div class="bar"><div class="bar-fill" style="width:${percent}%"></div></div>
                        </div>`;
                }).join('') : '<div class="empty">V tomto období nic zapsaného.</div>'}
            </div>

            <div class="card">
                <h3>🗓️ Den po dni</h3>
                ${rows.length ? `<div class="table-scroll"><table class="data">
                    <thead><tr><th>Den</th><th>Druhy</th><th class="num">Palet</th><th class="num">Rolí</th></tr></thead>
                    <tbody>${rows.map(({ iso, day }) => `
                        <tr data-action="open-day" data-date="${iso}" style="cursor:pointer;">
                            <td>${esc(dayShort(iso))} ${esc(formatDate(iso))}</td>
                            <td>${day.deliveries.map(d => deliveryTypeById(d.typeId).icon).join(' ')}</td>
                            <td class="num">${palletsOfDay(iso)}</td>
                            <td class="num">${rollsOfDay(iso)}</td>
                        </tr>`).join('')}</tbody>
                </table></div>` : '<div class="empty">Zapiš první dodávku a uvidíš tady statistiku.</div>'}
            </div>
        </div>`;
}

/* --- Checklist (šablony) ---------------------------------------------------- */

const CHECKLIST_GROUPS = [
    { key: 'open', title: '🌅 Otevření prodejny' },
    { key: 'during', title: '🕑 Během směny' },
    { key: 'close', title: '🌙 Zavírání' }
];

function renderChecklist() {
    const today = todayISO();
    const progress = checklistProgress(today);

    view.innerHTML = `
        <div class="view-head">
            <div>
                <h2>Checklist vedoucího směny</h2>
                <div class="subtitle">Šablona úkolů. Odškrtávat se dá v konkrétním dni – dnes ${progress.done}/${progress.total}.</div>
            </div>
            <button class="btn" data-action="open-day" data-date="${today}">Odškrtávat dnešek →</button>
        </div>

        ${CHECKLIST_GROUPS.map(group => {
            const items = DB.checklists[group.key] || [];
            return `
            <div class="card">
                <h3>${group.title}
                    <button class="btn-secondary" data-action="add-check" data-group="${group.key}">➕ Přidat úkol</button>
                </h3>
                ${items.length ? items.map((item, index) => `
                    <div class="row">
                        <div class="row-main"><div class="row-title" style="font-weight:500;">${esc(item.text)}</div></div>
                        <div class="row-actions">
                            <button class="btn-ghost" data-action="move-check" data-group="${group.key}" data-id="${item.id}" data-dir="-1"
                                ${index === 0 ? 'disabled' : ''}>↑</button>
                            <button class="btn-ghost" data-action="move-check" data-group="${group.key}" data-id="${item.id}" data-dir="1"
                                ${index === items.length - 1 ? 'disabled' : ''}>↓</button>
                            <button class="btn-ghost" data-action="edit-check" data-group="${group.key}" data-id="${item.id}">✏️</button>
                        </div>
                    </div>`).join('') : '<div class="empty">Zatím žádný úkol.</div>'}
            </div>`;
        }).join('')}`;
}

/* --- Poznámky z tréninku ---------------------------------------------------- */

function allTags() {
    const tags = new Set();
    DB.notes.forEach(note => note.tags.forEach(tag => tags.add(tag)));
    return [...tags].sort((a, b) => a.localeCompare(b, 'cs'));
}

function filteredNotes() {
    const text = noteFilter.text.toLowerCase();
    return DB.notes
        .filter(note => !noteFilter.category || note.category === noteFilter.category)
        .filter(note => !noteFilter.tag || note.tags.includes(noteFilter.tag))
        .filter(note => !text ||
            note.title.toLowerCase().includes(text) ||
            (note.body || '').toLowerCase().includes(text) ||
            note.tags.some(tag => tag.toLowerCase().includes(text)))
        .sort((a, b) => Number(b.important) - Number(a.important) || b.date.localeCompare(a.date));
}

function renderNotes() {
    const notes = filteredNotes();
    const tags = allTags();

    view.innerHTML = `
        <div class="view-head">
            <div>
                <h2>Poznámky z tréninku</h2>
                <div class="subtitle">${DB.notes.length} poznámek · ${DB.notes.filter(n => n.important).length} označených hvězdičkou</div>
            </div>
            <button class="btn" data-action="add-note">➕ Nová poznámka</button>
        </div>

        <div class="search-bar">
            <input type="search" placeholder="Hledat v poznámkách…" value="${esc(noteFilter.text)}" data-change="note-search">
            <select data-change="note-category">
                <option value="">Všechny kategorie</option>
                ${NOTE_CATEGORIES.map(category =>
                    `<option value="${esc(category)}" ${noteFilter.category === category ? 'selected' : ''}>${esc(category)}</option>`).join('')}
            </select>
            ${tags.length ? `<select data-change="note-tag">
                <option value="">Všechny štítky</option>
                ${tags.map(tag => `<option value="${esc(tag)}" ${noteFilter.tag === tag ? 'selected' : ''}>#${esc(tag)}</option>`).join('')}
            </select>` : ''}
        </div>

        ${notes.length ? notes.map(note => `
            <div class="note-card ${note.important ? 'important' : ''}">
                <div class="note-head">
                    <div>
                        <div class="note-title">${note.important ? '⭐ ' : ''}${esc(note.title)}</div>
                        <div class="note-meta">${esc(formatDate(note.date))} · ${esc(note.category || 'Bez kategorie')}</div>
                    </div>
                    <div class="row-actions no-print">
                        <button class="btn-ghost" data-action="note-to-check" data-id="${note.id}" title="Udělat z toho úkol v checklistu">✅</button>
                        <button class="btn-ghost" data-action="edit-note" data-id="${note.id}">✏️</button>
                    </div>
                </div>
                ${note.body ? `<div class="note-body">${esc(note.body)}</div>` : ''}
                ${note.tags.length ? `<div class="tag-list">${note.tags.map(tag =>
                    `<span class="pill">#${esc(tag)}</span>`).join('')}</div>` : ''}
            </div>`).join('')
        : `<div class="card"><div class="empty">
                ${DB.notes.length ? 'Nic nenalezeno – zkus jiný filtr.' :
                'Zatím prázdno. Po každém tréninku si sem zapiš, co ti řekli – ať to nezůstane jen v hlavě.'}
           </div></div>`}`;
}

/* --- Nastavení -------------------------------------------------------------- */

function renderSettings() {
    const settings = DB.settings;
    const dayCount = Object.keys(DB.days).length;
    const used = storageBytes();
    const usedPercent = Math.round((used / (5 * 1024 * 1024)) * 100);

    view.innerHTML = `
        <div class="view-head"><div><h2>Nastavení</h2>
            <div class="subtitle">Data jsou uložená jen v tomhle prohlížeči – zálohy si dělej exportem.</div></div></div>

        <div class="card">
            <h3>🏪 Prodejna</h3>
            <div class="field-row">
                <div class="field">
                    <label>Název / číslo prodejny</label>
                    <input type="text" data-change="setting" data-key="storeName" value="${esc(settings.storeName)}" placeholder="např. Lidl Kolín">
                </div>
                <div class="field">
                    <label>Moje jméno</label>
                    <input type="text" data-change="setting" data-key="myName" value="${esc(settings.myName)}" placeholder="např. Martin">
                </div>
            </div>
            <div class="field-row">
                <div class="field"><label>Otevírací doba od</label>
                    <input type="time" data-change="setting" data-key="openFrom" value="${esc(settings.openFrom)}"></div>
                <div class="field"><label>do</label>
                    <input type="time" data-change="setting" data-key="openTo" value="${esc(settings.openTo)}"></div>
            </div>
        </div>

        <div class="card">
            <h3>⏰ Výchozí časy směn</h3>
            <div class="field-row">
                <div class="field"><label>Ranní od</label>
                    <input type="time" data-change="shift" data-shift="morningShift" data-key="from" value="${esc(settings.morningShift.from)}"></div>
                <div class="field"><label>Ranní do</label>
                    <input type="time" data-change="shift" data-shift="morningShift" data-key="to" value="${esc(settings.morningShift.to)}"></div>
            </div>
            <div class="field-row">
                <div class="field"><label>Odpolední od</label>
                    <input type="time" data-change="shift" data-shift="afternoonShift" data-key="from" value="${esc(settings.afternoonShift.from)}"></div>
                <div class="field"><label>Odpolední do</label>
                    <input type="time" data-change="shift" data-shift="afternoonShift" data-key="to" value="${esc(settings.afternoonShift.to)}"></div>
            </div>
            <div class="field-row">
                <div class="field"><label>Přestávka po (hodin)</label>
                    <input type="number" min="0" step="0.5" data-change="break" data-key="afterHours" value="${esc(settings.break.afterHours)}"></div>
                <div class="field"><label>Délka přestávky (minut)</label>
                    <input type="number" min="0" step="5" data-change="break" data-key="minutes" value="${esc(settings.break.minutes)}"></div>
            </div>
            <div class="field-hint">Přestávka se automaticky odečítá z odpracovaných hodin.</div>
        </div>

        <div class="card">
            <h3>💾 Záloha dat</h3>
            <p class="muted">Uloženo: ${peopleText(DB.employees.length)}, ${dayCountText(dayCount)} v plánu,
               ${DB.notes.length} poznámek, ${articleCount()} artiklů a ${photoCount()} fotek.
               Když si smažeš data prohlížeče, přijdeš o ně – proto si čas od času stáhni zálohu.</p>
            <div style="margin-top:0.6rem;">
                <div class="day-person"><span>Zabrané místo</span><span>${formatBytes(used)} z ~5 MB</span></div>
                <div class="bar"><div class="bar-fill ${usedPercent > 80 ? 'over' : ''}"
                     style="width:${Math.min(100, usedPercent)}%"></div></div>
                ${usedPercent > 80 ? '<div class="field-hint">Místa je málo – prohlížeč další fotky nemusí uložit. Stáhni si zálohu a nepotřebné fotky smaž.</div>'
                                   : '<div class="field-hint">Fotky artiklů zabírají nejvíc místa. Jedna vyjde zhruba na 60 kB.</div>'}
            </div>
            <div class="btn-row" style="margin-top:0.7rem;">
                <button class="btn" data-action="export">⬇️ Stáhnout zálohu (JSON)</button>
                <button class="btn-secondary" data-action="import">⬆️ Načíst zálohu</button>
                <button class="btn-danger" data-action="reset">🗑️ Smazat všechna data</button>
            </div>
        </div>

        <div class="card">
            <h3>ℹ️ Jak to používat</h3>
            <ul class="muted" style="margin-left: 1.1rem;">
                <li><strong>Plán</strong> – týden dopředu: kdo, odkdy dokdy a na jakém úseku.</li>
                <li><strong>Den</strong> – během směny odškrtáváš checklist, zapisuješ palety a čísla dne.</li>
                <li><strong>Zboží</strong> – z paletových zápisů uvidíš, které dny jsou nejsilnější a kolik lidí na ně potřebuješ.</li>
                <li><strong>Poznámky</strong> – všechno z tréninku; tlačítkem ✅ z poznámky rovnou uděláš úkol v checklistu.</li>
                <li>Na mobilu si stránku přidej na plochu – chová se pak jako aplikace.</li>
            </ul>
        </div>`;
}

/* --- Formuláře nad daty ------------------------------------------------------ */

function entryForm(iso, entryId) {
    const day = getDay(iso);
    const entry = entryId ? day.entries.find(e => e.id === entryId) : null;
    const morning = DB.settings.morningShift;

    if (!activeEmployees().length) {
        alert('Nejdřív přidej lidi v sekci Tým.');
        return;
    }

    const fields = [
        { name: 'employeeId', label: 'Kdo', type: 'select', options: employeeOptions(false), required: true },
        { type: 'row', fields: [
            { name: 'from', label: 'Od', type: 'time', required: true },
            { name: 'to', label: 'Do', type: 'time', required: true }
        ] },
        { name: 'tasks', label: 'Co bude dělat', type: 'chips', options: taskChipOptions() },
        { name: 'note', label: 'Poznámka', type: 'textarea', placeholder: 'např. zaučuje se na pokladně, odchod dřív v 17:00' }
    ];

    openForm({
        title: entry ? 'Upravit směnu' : `Přidat do směny · ${formatDate(iso)}`,
        fields,
        values: entry || { from: morning.from, to: morning.to, tasks: [], employeeId: activeEmployees()[0].id },
        onSave: data => {
            if (!data.employeeId || !data.from || !data.to) return;
            const target = ensureDay(iso);
            if (entry) Object.assign(entry, data);
            else target.entries.push({ id: uid(), ...data });
            persist(entry ? 'Směna upravena' : 'Přidáno do plánu');
        },
        onDelete: entry ? () => {
            const target = ensureDay(iso);
            target.entries = target.entries.filter(e => e.id !== entryId);
            pruneDay(iso);
            persist('Smazáno');
        } : null
    });
}

function deliveryForm(iso, deliveryId) {
    const day = getDay(iso);
    const item = deliveryId ? day.deliveries.find(d => d.id === deliveryId) : null;

    const fields = [
        { name: 'date', label: 'Datum', type: 'date', required: true },
        { name: 'typeId', label: 'Druh zboží', type: 'select',
          options: DB.deliveryTypes.map(t => ({ value: t.id, label: `${t.icon} ${t.name}` })), required: true },
        { type: 'row', fields: [
            { name: 'pallets', label: 'Palet', type: 'number', required: true },
            { name: 'rolls', label: 'Rolí / klecí', type: 'number' }
        ] },
        { type: 'row', fields: [
            { name: 'arrived', label: 'Příjezd', type: 'time' },
            { name: 'startedAt', label: 'Začátek zpracování', type: 'time' },
            { name: 'doneAt', label: 'Hotovo', type: 'time' }
        ] },
        { name: 'note', label: 'Poznámka', type: 'textarea', placeholder: 'např. chybí 2 role pečiva, reklamace u ovoce' }
    ];

    openForm({
        title: item ? 'Upravit dodávku' : `Zapsat dodávku · ${formatDate(iso)}`,
        fields,
        values: item ? { ...item, date: iso } : { date: iso, typeId: DB.deliveryTypes[0].id, pallets: '', rolls: '' },
        onSave: data => {
            const targetIso = data.date || iso;
            const payload = {
                typeId: data.typeId,
                pallets: Number(data.pallets) || 0,
                rolls: Number(data.rolls) || 0,
                arrived: data.arrived,
                startedAt: data.startedAt,
                doneAt: data.doneAt,
                note: data.note
            };
            if (item && targetIso === iso) {
                Object.assign(item, payload);
            } else {
                if (item) {
                    const source = ensureDay(iso);
                    source.deliveries = source.deliveries.filter(d => d.id !== deliveryId);
                    pruneDay(iso);
                }
                ensureDay(targetIso).deliveries.push({ id: uid(), ...payload });
            }
            persist('Dodávka uložena');
        },
        onDelete: item ? () => {
            const target = ensureDay(iso);
            target.deliveries = target.deliveries.filter(d => d.id !== deliveryId);
            pruneDay(iso);
            persist('Smazáno');
        } : null
    });
}

function employeeForm(employeeId) {
    const employee = employeeId ? employeeById(employeeId) : null;

    openForm({
        title: employee ? 'Upravit člověka' : 'Nový člověk v týmu',
        fields: [
            { name: 'name', label: 'Jméno', type: 'text', required: true },
            { type: 'row', fields: [
                { name: 'position', label: 'Pozice', type: 'select', options: POSITIONS.map(p => ({ value: p, label: p })) },
                { name: 'contract', label: 'Úvazek (h / týden)', type: 'number', step: 0.5 }
            ] },
            { name: 'phone', label: 'Telefon', type: 'text' },
            { name: 'skills', label: 'Zaškolen na', type: 'chips', options: taskChipOptions(),
              hint: 'Podle toho poznáš, koho můžeš kam postavit.' },
            { name: 'note', label: 'Poznámka', type: 'textarea', placeholder: 'např. nesmí na pokladnu sám, studuje – jen odpoledne' },
            { name: 'active', label: 'Aktivní (zobrazovat v plánu)', type: 'checkbox' }
        ],
        values: employee || { position: POSITIONS[3], contract: '', skills: [], active: true },
        onSave: data => {
            if (!data.name) return;
            if (employee) Object.assign(employee, data);
            else DB.employees.push({ id: uid(), ...data });
            persist(employee ? 'Uloženo' : 'Člověk přidán');
        },
        onDelete: employee ? () => {
            DB.employees = DB.employees.filter(e => e.id !== employeeId);
            persist('Smazáno');
        } : null,
        deleteLabel: 'Smazat z týmu'
    });
}

function noteForm(noteId) {
    const note = noteId ? DB.notes.find(n => n.id === noteId) : null;

    openForm({
        title: note ? 'Upravit poznámku' : 'Nová poznámka z tréninku',
        fields: [
            { name: 'title', label: 'Nadpis', type: 'text', required: true, placeholder: 'např. Uzávěrka pokladen krok za krokem' },
            { type: 'row', fields: [
                { name: 'date', label: 'Datum', type: 'date' },
                { name: 'category', label: 'Kategorie', type: 'select',
                  options: NOTE_CATEGORIES.map(c => ({ value: c, label: c })) }
            ] },
            { name: 'body', label: 'Text', type: 'textarea', placeholder: 'Co přesně říkali, postup krok za krokem, na co si dát pozor…' },
            { name: 'tagsText', label: 'Štítky', type: 'text', placeholder: 'trezor, pokladna, uzávěrka', hint: 'Odděl čárkou.' },
            { name: 'important', label: '⭐ Důležité – zobrazit na přehledu', type: 'checkbox' }
        ],
        values: note ? { ...note, tagsText: note.tags.join(', ') }
                     : { date: todayISO(), category: NOTE_CATEGORIES[0], important: false },
        onSave: data => {
            if (!data.title) return;
            const payload = {
                title: data.title,
                date: data.date || todayISO(),
                category: data.category,
                body: data.body,
                important: data.important,
                tags: data.tagsText.split(',').map(t => t.trim()).filter(Boolean)
            };
            if (note) Object.assign(note, payload);
            else DB.notes.unshift({ id: uid(), ...payload });
            persist(note ? 'Uloženo' : 'Poznámka přidána');
        },
        onDelete: note ? () => {
            DB.notes = DB.notes.filter(n => n.id !== noteId);
            persist('Smazáno');
        } : null
    });
}

function checkItemForm(group, itemId) {
    const items = DB.checklists[group];
    const item = itemId ? items.find(i => i.id === itemId) : null;

    openForm({
        title: item ? 'Upravit úkol' : 'Nový úkol v checklistu',
        fields: [{ name: 'text', label: 'Úkol', type: 'textarea', required: true }],
        values: item || {},
        onSave: data => {
            if (!data.text) return;
            if (item) item.text = data.text;
            else items.push({ id: uid(), text: data.text });
            persist('Uloženo');
        },
        onDelete: item ? () => {
            DB.checklists[group] = items.filter(i => i.id !== itemId);
            persist('Smazáno');
        } : null
    });
}

function noteToChecklistForm(noteId) {
    const note = DB.notes.find(n => n.id === noteId);
    if (!note) return;

    openForm({
        title: 'Udělat z poznámky úkol',
        fields: [
            { name: 'group', label: 'Kam patří', type: 'select', options: [
                { value: 'open', label: '🌅 Otevření prodejny' },
                { value: 'during', label: '🕑 Během směny' },
                { value: 'close', label: '🌙 Zavírání' }
            ] },
            { name: 'text', label: 'Znění úkolu', type: 'textarea', required: true }
        ],
        values: { group: 'during', text: note.title },
        submitLabel: 'Přidat do checklistu',
        onSave: data => {
            if (!data.text) return;
            DB.checklists[data.group].push({ id: uid(), text: data.text });
            persist('Přidáno do checklistu');
        }
    });
}

function copyDayForm(iso) {
    openForm({
        title: 'Zkopírovat rozdělení lidí',
        fields: [{ name: 'source', label: 'Ze kterého dne', type: 'date', required: true,
                   hint: 'Zkopírují se lidé, časy a úseky. Dodávky ne.' }],
        values: { source: addDays(iso, -7) },
        submitLabel: 'Zkopírovat',
        onSave: data => {
            const source = getDay(data.source);
            if (!source.entries.length) { alert('Ve zdrojovém dni nikdo naplánovaný není.'); return; }
            const target = ensureDay(iso);
            source.entries.forEach(entry => target.entries.push({ ...entry, id: uid() }));
            persist(`Zkopírováno: ${peopleText(source.entries.length)}`);
        }
    });
}

function copyWeek() {
    const source = addDays(planWeek, -7);
    let copied = 0;
    weekDays(planWeek).forEach((iso, index) => {
        const from = getDay(addDays(source, index));
        if (!from.entries.length) return;
        const target = ensureDay(iso);
        if (target.entries.length) return;
        from.entries.forEach(entry => { target.entries.push({ ...entry, id: uid() }); copied++; });
        if (from.leaderId && !target.leaderId) target.leaderId = from.leaderId;
        if (from.leaderPmId && !target.leaderPmId) target.leaderPmId = from.leaderPmId;
    });
    if (!copied) { alert('Z minulého týdne není co kopírovat (nebo už je tenhle týden naplánovaný).'); return; }
    persist(`Zkopírováno ${copied} směn`);
}

/* --- Záloha ------------------------------------------------------------------ */

async function exportData() {
    const data = JSON.stringify(DB, null, 2);
    const filename = `vedeni-smeny-${todayISO()}.json`;

    /* V online verzi si stažení musí odsouhlasit prohlížeč přes claude.use. */
    const downloads = window.claude ? await window.claude.use('downloads').catch(() => null) : null;
    if (downloads) {
        try {
            const result = await downloads.save({ filename, data });
            if (result.status === 'saved') toast('Záloha stažena');
        } catch (err) {
            if (err.code !== 'declined') alert('Zálohu se nepodařilo stáhnout: ' + (err.message || err.code));
        }
        return;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function importData() {
    openModal({
        title: 'Načíst zálohu',
        bodyHtml: `
            <p class="muted">Vyber soubor <code>vedeni-smeny-*.json</code>. Současná data budou přepsána.</p>
            <div class="field" style="margin-top:0.8rem;"><input type="file" accept="application/json,.json" id="import-file"></div>`,
        actionsHtml: '<button class="btn-secondary" data-close-import>Zrušit</button>',
        onMount: modal => {
            modal.querySelector('[data-close-import]').addEventListener('click', closeModal);
            modal.querySelector('#import-file').addEventListener('change', event => {
                const file = event.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        replaceDb(JSON.parse(reader.result));
                        closeModal();
                        toast('Záloha načtena');
                        render();
                    } catch {
                        alert('Soubor se nepodařilo přečíst – není to platná záloha.');
                    }
                };
                reader.readAsText(file);
            });
        }
    });
}

/* --- Akce -------------------------------------------------------------------- */

const ACTIONS = {
    'open-day': data => go(`#/den/${data.date}`),
    'day-prev': data => go(`#/den/${addDays(data.date, -1)}`),
    'day-next': data => go(`#/den/${addDays(data.date, 1)}`),
    'week-prev': () => { planWeek = addDays(planWeek, -7); render(); },
    'week-next': () => { planWeek = addDays(planWeek, 7); render(); },
    'week-today': () => { planWeek = weekStart(todayISO()); render(); },
    'copy-week': () => { if (confirm('Zkopírovat plán z minulého týdne do dnů, které jsou prázdné?')) copyWeek(); },
    'print': () => window.print(),
    'add-entry': data => entryForm(data.date),
    'edit-entry': data => entryForm(data.date, data.id),
    'add-delivery': data => deliveryForm(data.date),
    'edit-delivery': data => deliveryForm(data.date, data.id),
    'copy-day': data => copyDayForm(data.date),
    'add-employee': () => employeeForm(),
    'edit-employee': data => employeeForm(data.id),
    'add-note': () => noteForm(),
    'edit-note': data => noteForm(data.id),
    'note-to-check': data => noteToChecklistForm(data.id),
    'add-check': data => checkItemForm(data.group),
    'edit-check': data => checkItemForm(data.group, data.id),
    'move-check': data => {
        const items = DB.checklists[data.group];
        const index = items.findIndex(i => i.id === data.id);
        const next = index + Number(data.dir);
        if (index < 0 || next < 0 || next >= items.length) return;
        [items[index], items[next]] = [items[next], items[index]];
        persist();
    },
    'export': exportData,
    'import': importData,
    'reset': () => {
        if (!confirm('Opravdu smazat všechna data? Nejdřív si radši stáhni zálohu.')) return;
        if (!confirm('Fakt to chceš smazat? Tohle vrátit nejde.')) return;
        replaceDb(null);
        toast('Data smazána');
        render();
    }
};

document.addEventListener('click', event => {
    const navButton = event.target.closest('[data-nav]');
    if (navButton) {
        go(`#/${navButton.dataset.nav}`);
        return;
    }
    const target = event.target.closest('[data-action]');
    if (!target || target.disabled) return;
    const handler = ACTIONS[target.dataset.action];
    if (handler) handler({ ...target.dataset });
});

/* --- Změny v polích ----------------------------------------------------------- */

const CHANGES = {
    'toggle-check': (data, input) => {
        const day = ensureDay(data.date);
        if (input.checked) day.checks[data.id] = true;
        else delete day.checks[data.id];
        pruneDay(data.date);
        save();
        render();
    },
    'set-leader': (data, input) => {
        const day = ensureDay(data.date);
        day[data.slot] = input.value;
        pruneDay(data.date);
        save();
    },
    'set-stat': (data, input) => {
        const day = ensureDay(data.date);
        day.stats[data.key] = input.value.trim();
        pruneDay(data.date);
        save();
    },
    'set-day-note': (data, input) => {
        const day = ensureDay(data.date);
        day.note = input.value.trim();
        pruneDay(data.date);
        save();
    },
    'setting': (data, input) => { DB.settings[data.key] = input.value; save(); renderHeader(); },
    'shift': (data, input) => { DB.settings[data.shift][data.key] = input.value; save(); },
    'break': (data, input) => { DB.settings.break[data.key] = Number(input.value) || 0; save(); },
    'goods-range': (data, input) => { goodsRange = input.value; render(); },
    'note-search': (data, input) => { noteFilter.text = input.value; renderNotes(); },
    'note-category': (data, input) => { noteFilter.category = input.value; renderNotes(); },
    'note-tag': (data, input) => { noteFilter.tag = input.value; renderNotes(); }
};

function handleChange(event) {
    const target = event.target.closest('[data-change]');
    if (!target) return;
    const handler = CHANGES[target.dataset.change];
    if (handler) handler({ ...target.dataset }, target);
}

view.addEventListener('change', handleChange);
view.addEventListener('input', event => {
    /* Hledání reaguje hned, ostatní pole až po opuštění. */
    if (event.target.dataset.change === 'note-search') {
        const caret = event.target.selectionStart;
        handleChange(event);
        const field = view.querySelector('[data-change="note-search"]');
        if (field) { field.focus(); field.setSelectionRange(caret, caret); }
    }
});

/* --- Start -------------------------------------------------------------------- */

/* Prázdné téma = necháváme na prohlížeči (systémové nastavení). */
function currentTheme() {
    if (DB.settings.theme === 'dark' || DB.settings.theme === 'light') return DB.settings.theme;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme() {
    const chosen = DB.settings.theme;
    if (chosen === 'dark' || chosen === 'light') document.documentElement.setAttribute('data-theme', chosen);
    else document.documentElement.removeAttribute('data-theme');
    document.getElementById('theme-toggle').textContent = currentTheme() === 'dark' ? '☀️' : '🌙';
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    DB.settings.theme = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme();
    save();
});

window.addEventListener('hashchange', render);

function boot() {
    applyTheme();
    render();
}

/* Online verze si nejdřív načte data z účtu, offline startuje rovnou. */
if (window.CLOUD) window.CLOUD.start(boot);
else boot();
