const STORAGE_KEY = 'rozvrh-notes-app';

let store = loadStore();
let state = {
    view: 'prehled',
    course: null,
    noteId: null,
    search: '',
    filterCourse: 'all'
};
let saveTimer = null;

/* ---------- Ukládání ---------- */

function loadStore() {
    const empty = { notes: [], tasks: [], version: 1 };
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return empty;
        const parsed = JSON.parse(saved);
        return {
            notes: Array.isArray(parsed.notes) ? parsed.notes : [],
            tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
            version: 1
        };
    } catch {
        return empty;
    }
}

function saveStore() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {}
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---------- Pomocné funkce ---------- */

function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function courseById(id) {
    return COURSES.find(c => c.id === id) || null;
}

function courseLabel(id) {
    const c = courseById(id);
    return c ? `${c.icon} ${c.code} ${c.name}` : 'Bez předmětu';
}

function dayById(id) {
    return DAYS.find(d => d.id === id);
}

function slotStart(index) {
    return TIME_SLOTS[index].split('-')[0];
}

function slotEnd(index) {
    return TIME_SLOTS[index].split('-')[1];
}

function lessonTime(entry) {
    return `${slotStart(entry.from)}–${slotEnd(entry.to)}`;
}

function toMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

function formatDateTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function daysUntil(iso) {
    const due = new Date(iso + 'T00:00:00');
    const now = new Date(todayISO() + 'T00:00:00');
    return Math.round((due - now) / 86400000);
}

function dueClass(task) {
    if (task.done || !task.due) return '';
    const diff = daysUntil(task.due);
    if (diff < 0) return 'overdue';
    if (diff <= 3) return 'soon';
    return '';
}

function dueText(task) {
    if (!task.due) return 'bez termínu';
    const diff = daysUntil(task.due);
    if (diff === 0) return `dnes (${formatDate(task.due)})`;
    if (diff === 1) return `zítra (${formatDate(task.due)})`;
    if (diff < 0) return `po termínu o ${Math.abs(diff)} dní (${formatDate(task.due)})`;
    return `za ${diff} dní (${formatDate(task.due)})`;
}

function lessonsForDay(dayId) {
    return SCHEDULE.filter(e => e.day === dayId).sort((a, b) => a.from - b.from);
}

function lessonsForCourse(courseId) {
    return SCHEDULE.filter(e => e.courseId === courseId).sort((a, b) => {
        const d = DAYS.findIndex(x => x.id === a.day) - DAYS.findIndex(x => x.id === b.day);
        return d !== 0 ? d : a.from - b.from;
    });
}

function notesForCourse(courseId) {
    return store.notes.filter(n => n.courseId === courseId);
}

function tasksForCourse(courseId) {
    return store.tasks.filter(t => t.courseId === courseId);
}

/* ---------- Jednoduchý markdown ---------- */

function renderMarkdown(text) {
    const lines = escapeHtml(text).split('\n');
    let html = '';
    let inList = false;

    const inline = s => s
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');

    lines.forEach(raw => {
        const line = raw.trimEnd();
        const listMatch = line.match(/^\s*[-*]\s+(.*)$/);
        if (listMatch) {
            if (!inList) { html += '<ul>'; inList = true; }
            html += `<li>${inline(listMatch[1])}</li>`;
            return;
        }
        if (inList) { html += '</ul>'; inList = false; }

        const heading = line.match(/^(#{1,4})\s+(.*)$/);
        if (heading) {
            html += `<h3>${inline(heading[2])}</h3>`;
        } else if (line === '') {
            html += '';
        } else {
            html += `<p>${inline(line)}</p>`;
        }
    });
    if (inList) html += '</ul>';
    return html || '<p class="muted">Zatím prázdné…</p>';
}

/* ---------- Téma ---------- */

function initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('theme-toggle').textContent = saved === 'dark' ? '☀️' : '🌙';
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    document.getElementById('theme-toggle').textContent = next === 'dark' ? '☀️' : '🌙';
});

/* ---------- Navigace ---------- */

function showView(view, opts = {}) {
    state.view = view;
    if (opts.course !== undefined) state.course = opts.course;

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');
    document.querySelectorAll('#view-nav .topic-link').forEach(b => {
        b.classList.toggle('active', b.dataset.view === view);
    });

    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('#view-nav .topic-link').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view, { course: null }));
});

/* ---------- Render: rozvrh ---------- */

function renderSchedule() {
    const el = document.getElementById('schedule');
    const todayDow = new Date().getDay();

    let html = '<div class="schedule-head"><div>Den</div>' +
        TIME_SLOTS.map(t => `<div>${t.replace('-', '–')}</div>`).join('') + '</div>';

    DAYS.forEach(day => {
        const lessons = lessonsForDay(day.id);
        html += `<div class="schedule-row${day.dow === todayDow ? ' today' : ''}">`;
        html += `<div class="day-label">${day.short}</div>`;
        html += '<div class="slot-grid">' + TIME_SLOTS.map(() => '<div></div>').join('') + '</div>';

        if (!lessons.length) {
            html += '<div class="empty-day">volno</div>';
        }

        lessons.forEach(entry => {
            const c = courseById(entry.courseId);
            const noteCount = notesForCourse(entry.courseId).length;
            html += `<div class="lesson ${entry.type}" style="grid-column: ${entry.from + 2} / ${entry.to + 3};"
                        data-course="${entry.courseId}" title="${escapeHtml(c.name)} · ${lessonTime(entry)} · ${escapeHtml(entry.room)}">
                        <span class="lesson-room">${escapeHtml(entry.room)}</span>
                        <span class="lesson-name">${c.icon} ${escapeHtml(c.code)} ${escapeHtml(c.name)}${noteCount ? `<span class="lesson-badge">${noteCount}</span>` : ''}</span>
                        <span class="lesson-teacher">${escapeHtml(c.teacher)} · ${lessonTime(entry)}</span>
                    </div>`;
        });
        html += '</div>';
    });

    el.innerHTML = html;
    el.querySelectorAll('.lesson').forEach(node => {
        node.addEventListener('click', () => showView('predmety', { course: node.dataset.course }));
    });
}

/* ---------- Render: předměty ---------- */

function renderCourses() {
    const body = document.getElementById('predmety-body');
    const actions = document.getElementById('predmety-actions');
    const title = document.getElementById('predmety-title');
    const sub = document.getElementById('predmety-sub');

    if (!state.course) {
        title.textContent = 'Předměty';
        sub.textContent = `${COURSES.length} zapsaných předmětů v tomto semestru`;
        actions.innerHTML = '';
        body.innerHTML = '<div class="course-grid">' + COURSES.map(c => {
            const lessons = lessonsForCourse(c.id);
            const notes = notesForCourse(c.id).length;
            const open = tasksForCourse(c.id).filter(t => !t.done).length;
            return `<div class="course-card" data-course="${c.id}" style="border-left-color: ${c.color};">
                <div style="font-size: 1.6rem;">${c.icon}</div>
                <span class="course-code">${escapeHtml(c.code)}</span>
                <h3>${escapeHtml(c.name)}</h3>
                <div class="course-meta">👩‍🏫 ${escapeHtml(c.teacher)}</div>
                <div class="course-meta">${lessons.map(l => `${dayById(l.day).short} ${lessonTime(l)} · ${escapeHtml(l.room)}`).join('<br>')}</div>
                <div class="course-card-footer">
                    <span>📝 ${notes} poznámek</span>
                    <span>✅ ${open} otevřených úkolů</span>
                </div>
            </div>`;
        }).join('') + '</div>';

        body.querySelectorAll('.course-card').forEach(card => {
            card.addEventListener('click', () => showView('predmety', { course: card.dataset.course }));
        });
        return;
    }

    const c = courseById(state.course);
    const lessons = lessonsForCourse(c.id);
    const notes = notesForCourse(c.id).sort((a, b) => b.updated.localeCompare(a.updated));
    const tasks = tasksForCourse(c.id).filter(t => !t.done);

    title.innerHTML = `${c.icon} ${escapeHtml(c.name)}`;
    sub.textContent = `${c.code} · ${c.teacher}`;
    actions.innerHTML = '<button class="btn-secondary" id="back-courses">← Všechny předměty</button>' +
        '<button class="btn" id="course-new-note">➕ Poznámka k předmětu</button>';

    body.innerHTML = `
        <h3 class="task-group-title">Termíny v rozvrhu</h3>
        <div class="today-list">
            ${lessons.map(l => `<div class="today-item">
                <span class="today-time">${dayById(l.day).name}<br>${lessonTime(l)}</span>
                <div class="today-info">
                    <div class="today-name">${escapeHtml(l.room)}</div>
                    <div class="today-sub">${l.type === 'prednaska' ? 'Přednáška' : 'Cvičení / seminář'}</div>
                </div>
            </div>`).join('')}
        </div>

        <h3 class="task-group-title">Otevřené úkoly (${tasks.length})</h3>
        ${tasks.length ? tasks.map(renderTaskRow).join('') : '<div class="empty-state">Žádné otevřené úkoly.</div>'}

        <h3 class="task-group-title">Poznámky (${notes.length})</h3>
        ${notes.length ? notes.map(n => `<div class="task" data-note="${n.id}" style="cursor: pointer;">
            <div class="task-body">
                <div class="task-title">${escapeHtml(n.title || 'Bez názvu')}</div>
                <div class="task-meta"><span>Upraveno ${formatDateTime(n.updated)}</span></div>
            </div>
        </div>`).join('') : '<div class="empty-state">Zatím žádné poznámky k tomuto předmětu.</div>'}
    `;

    document.getElementById('back-courses').addEventListener('click', () => showView('predmety', { course: null }));
    document.getElementById('course-new-note').addEventListener('click', () => createNote(c.id));
    body.querySelectorAll('[data-note]').forEach(node => {
        node.addEventListener('click', () => openNote(node.dataset.note));
    });
    bindTaskRows(body);
}

/* ---------- Render: poznámky ---------- */

function createNote(courseId) {
    const note = {
        id: uid(),
        courseId: courseId || (state.course || (COURSES[0] && COURSES[0].id) || ''),
        title: '',
        body: '',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };
    store.notes.unshift(note);
    saveStore();
    openNote(note.id);
}

function openNote(id) {
    state.noteId = id;
    showView('poznamky');
    const input = document.getElementById('note-title');
    if (input) input.focus();
}

function visibleNotes() {
    const q = state.search.trim().toLowerCase();
    return store.notes
        .filter(n => state.filterCourse === 'all' || n.courseId === state.filterCourse)
        .filter(n => !q || (n.title + ' ' + n.body).toLowerCase().includes(q))
        .sort((a, b) => b.updated.localeCompare(a.updated));
}

function renderNotes() {
    const notes = visibleNotes();
    if (notes.length && !notes.some(n => n.id === state.noteId)) {
        state.noteId = notes[0].id;
    }
    if (!notes.length) state.noteId = null;

    renderNotesList();
    renderNoteEditor();
}

// Samostatně, aby se při automatickém ukládání nepřekresloval editor (a nemizel kurzor)
function renderNotesList() {
    const listEl = document.getElementById('notes-list');
    const notes = visibleNotes();

    listEl.innerHTML = notes.length ? notes.map(n => {
        const c = courseById(n.courseId);
        return `<div class="note-item${n.id === state.noteId ? ' active' : ''}" data-id="${n.id}">
            <span class="note-item-title">${escapeHtml(n.title || 'Bez názvu')}</span>
            <span class="note-item-meta">
                <span>${c ? c.icon + ' ' + escapeHtml(c.code) : '—'}</span>
                <span>${formatDateTime(n.updated)}</span>
            </span>
        </div>`;
    }).join('') : '<div class="empty-state" style="border: none;">Žádné poznámky.</div>';

    listEl.querySelectorAll('.note-item').forEach(item => {
        item.addEventListener('click', () => {
            state.noteId = item.dataset.id;
            renderNotes();
        });
    });
}

function renderNoteEditor() {
    const wrap = document.getElementById('note-editor-wrap');
    const note = store.notes.find(n => n.id === state.noteId);

    if (!note) {
        wrap.innerHTML = '<div class="empty-state">Vyber poznámku vlevo, nebo vytvoř novou tlačítkem <strong>➕ Nová poznámka</strong>.</div>';
        return;
    }

    wrap.innerHTML = `
        <div class="note-editor">
            <div class="field">
                <label for="note-title">Název</label>
                <input type="text" id="note-title" value="${escapeHtml(note.title)}" placeholder="Např. Přednáška 3 – segmentace trhu">
            </div>
            <div class="field">
                <label for="note-course">Předmět</label>
                <select id="note-course">${COURSES.map(c =>
                    `<option value="${c.id}"${c.id === note.courseId ? ' selected' : ''}>${c.icon} ${escapeHtml(c.code)} – ${escapeHtml(c.name)}</option>`
                ).join('')}</select>
            </div>
            <div class="field">
                <label for="note-body">Text poznámky</label>
                <textarea id="note-body" placeholder="## Nadpis&#10;- odrážka&#10;**důležité**">${escapeHtml(note.body)}</textarea>
            </div>
            <div class="editor-toolbar">
                <button class="btn-secondary" id="note-preview-btn">👁️ Náhled</button>
                <button class="btn-secondary" id="note-delete-btn">🗑️ Smazat</button>
                <span class="save-state" id="save-state">Vytvořeno ${formatDateTime(note.created)}</span>
            </div>
            <div class="note-preview" id="note-preview" hidden></div>
        </div>
    `;

    const titleEl = document.getElementById('note-title');
    const bodyEl = document.getElementById('note-body');
    const courseEl = document.getElementById('note-course');
    const previewEl = document.getElementById('note-preview');

    const touch = () => {
        note.title = titleEl.value;
        note.body = bodyEl.value;
        note.courseId = courseEl.value;
        note.updated = new Date().toISOString();
        document.getElementById('save-state').textContent = 'Uloženo ✓';
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            saveStore();
            renderNotesList();
        }, 800);
    };

    titleEl.addEventListener('input', touch);
    bodyEl.addEventListener('input', touch);
    courseEl.addEventListener('change', () => { touch(); saveStore(); renderNotesList(); });

    document.getElementById('note-preview-btn').addEventListener('click', () => {
        if (previewEl.hidden) {
            previewEl.innerHTML = renderMarkdown(bodyEl.value);
            previewEl.hidden = false;
        } else {
            previewEl.hidden = true;
        }
    });

    document.getElementById('note-delete-btn').addEventListener('click', () => {
        if (!confirm('Opravdu smazat tuto poznámku?')) return;
        store.notes = store.notes.filter(n => n.id !== note.id);
        state.noteId = null;
        saveStore();
        renderNotes();
        renderNextClass();
    });
}

/* ---------- Render: úkoly ---------- */

function renderTaskRow(task) {
    const c = courseById(task.courseId);
    const cls = dueClass(task);
    return `<div class="task ${cls}${task.done ? ' done' : ''}" data-task="${task.id}">
        <input type="checkbox" ${task.done ? 'checked' : ''} data-toggle="${task.id}" aria-label="Hotovo">
        <div class="task-body">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-meta">
                <span>${c ? c.icon + ' ' + escapeHtml(c.code) : '📌 obecné'}</span>
                <span class="task-due ${cls}">${dueText(task)}</span>
            </div>
        </div>
        <button class="btn-secondary" data-delete="${task.id}" aria-label="Smazat">✕</button>
    </div>`;
}

function bindTaskRows(root) {
    root.querySelectorAll('[data-toggle]').forEach(box => {
        box.addEventListener('change', () => {
            const task = store.tasks.find(t => t.id === box.dataset.toggle);
            if (!task) return;
            task.done = box.checked;
            saveStore();
            render();
        });
    });
    root.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', () => {
            store.tasks = store.tasks.filter(t => t.id !== btn.dataset.delete);
            saveStore();
            render();
        });
    });
}

function sortedTasks() {
    return [...store.tasks].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return a.due.localeCompare(b.due);
    });
}

function renderTasks() {
    const el = document.getElementById('task-list');
    const tasks = sortedTasks();
    const open = tasks.filter(t => !t.done);
    const done = tasks.filter(t => t.done);

    el.innerHTML = `
        <h3 class="task-group-title">K vyřízení (${open.length})</h3>
        ${open.length ? open.map(renderTaskRow).join('') : '<div class="empty-state">Nic nečeká. 🎉</div>'}
        ${done.length ? `<h3 class="task-group-title">Hotovo (${done.length})</h3>${done.map(renderTaskRow).join('')}` : ''}
    `;
    bindTaskRows(el);
}

document.getElementById('task-form').addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('task-title');
    const course = document.getElementById('task-course');
    const due = document.getElementById('task-due');
    if (!title.value.trim()) return;

    store.tasks.push({
        id: uid(),
        title: title.value.trim(),
        courseId: course.value === 'none' ? '' : course.value,
        due: due.value || '',
        done: false,
        created: new Date().toISOString()
    });
    saveStore();
    title.value = '';
    due.value = '';
    render();
});

document.getElementById('clear-done-btn').addEventListener('click', () => {
    const done = store.tasks.filter(t => t.done).length;
    if (!done) return alert('Žádné hotové úkoly ke smazání.');
    if (!confirm(`Smazat ${done} hotových úkolů?`)) return;
    store.tasks = store.tasks.filter(t => !t.done);
    saveStore();
    render();
});

/* ---------- Render: přehled ---------- */

function nextLesson(from = new Date()) {
    const nowDow = from.getDay();
    const nowMin = from.getHours() * 60 + from.getMinutes();

    for (let offset = 0; offset < 8; offset++) {
        const dow = (nowDow + offset) % 7;
        const day = DAYS.find(d => d.dow === dow);
        if (!day) continue;
        const lessons = lessonsForDay(day.id);
        for (const entry of lessons) {
            const start = toMinutes(slotStart(entry.from));
            if (offset > 0 || start > nowMin) {
                return { entry, day, offset, start };
            }
        }
    }
    return null;
}

function renderNextClass() {
    const el = document.getElementById('next-class');
    const now = new Date();
    const current = currentLesson(now);

    if (current) {
        const c = courseById(current.courseId);
        const endsIn = toMinutes(slotEnd(current.to)) - (now.getHours() * 60 + now.getMinutes());
        el.innerHTML = `<span class="pill now">Právě teď</span>
            <span class="next-class-name" style="margin-top: 0.4rem;">${c.icon} ${escapeHtml(c.name)}</span>
            ${escapeHtml(current.room)} · ${lessonTime(current)}<br>
            <span class="next-class-countdown">konec za ${endsIn} min</span>`;
        return;
    }

    const next = nextLesson(now);
    if (!next) {
        el.innerHTML = 'Tento týden už nic. 🎉';
        return;
    }
    const c = courseById(next.entry.courseId);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    let when;
    if (next.offset === 0) {
        const mins = next.start - nowMin;
        when = mins >= 60 ? `za ${Math.floor(mins / 60)} h ${mins % 60} min` : `za ${mins} min`;
    } else if (next.offset === 1) {
        when = 'zítra';
    } else {
        when = next.day.name.toLowerCase();
    }

    el.innerHTML = `<span class="next-class-name">${c.icon} ${escapeHtml(c.name)}</span>
        ${escapeHtml(next.entry.room)} · ${next.day.short} ${lessonTime(next.entry)}<br>
        <span class="next-class-countdown">${when}</span>`;
}

function currentLesson(now = new Date()) {
    const day = DAYS.find(d => d.dow === now.getDay());
    if (!day) return null;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return lessonsForDay(day.id).find(e =>
        nowMin >= toMinutes(slotStart(e.from)) && nowMin <= toMinutes(slotEnd(e.to))
    ) || null;
}

function renderDashboard() {
    const now = new Date();
    document.getElementById('today-label').textContent =
        now.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const openTasks = store.tasks.filter(t => !t.done);
    const overdue = openTasks.filter(t => t.due && daysUntil(t.due) < 0).length;
    const weekHours = SCHEDULE.reduce((sum, e) =>
        sum + (toMinutes(slotEnd(e.to)) - toMinutes(slotStart(e.from))) / 60, 0);

    document.getElementById('stat-grid').innerHTML = `
        <div class="stat"><div class="stat-value">${COURSES.length}</div><div class="stat-label">předmětů</div></div>
        <div class="stat"><div class="stat-value">${weekHours.toFixed(1)}</div><div class="stat-label">hodin výuky týdně</div></div>
        <div class="stat"><div class="stat-value">${store.notes.length}</div><div class="stat-label">poznámek</div></div>
        <div class="stat"><div class="stat-value">${openTasks.length}</div><div class="stat-label">otevřených úkolů</div></div>
        <div class="stat"><div class="stat-value" style="color: ${overdue ? 'var(--error)' : 'var(--success)'};">${overdue}</div><div class="stat-label">po termínu</div></div>
    `;

    const day = DAYS.find(d => d.dow === now.getDay());
    const todayLessons = day ? lessonsForDay(day.id) : [];
    const current = currentLesson(now);
    document.getElementById('today-list').innerHTML = todayLessons.length
        ? todayLessons.map(e => {
            const c = courseById(e.courseId);
            const isNow = current === e;
            return `<div class="today-item${isNow ? ' now' : ''}" data-course="${e.courseId}" style="cursor: pointer;">
                <span class="today-time">${lessonTime(e)}</span>
                <div class="today-info">
                    <div class="today-name">${c.icon} ${escapeHtml(c.name)} ${isNow ? '<span class="pill now">teď</span>' : ''}</div>
                    <div class="today-sub">${escapeHtml(e.room)} · ${escapeHtml(c.teacher)} · ${e.type === 'prednaska' ? 'přednáška' : 'cvičení'}</div>
                </div>
            </div>`;
        }).join('')
        : '<div class="empty-state">Dnes žádná výuka. Volno! 🎉</div>';

    document.querySelectorAll('#today-list [data-course]').forEach(node => {
        node.addEventListener('click', () => showView('predmety', { course: node.dataset.course }));
    });

    const upcoming = sortedTasks().filter(t => !t.done).slice(0, 5);
    const upEl = document.getElementById('upcoming-tasks');
    upEl.innerHTML = upcoming.length
        ? upcoming.map(renderTaskRow).join('')
        : '<div class="empty-state">Žádné úkoly. Přidej je v sekci ✅ Úkoly.</div>';
    bindTaskRows(upEl);

    const recent = [...store.notes].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 4);
    const recentEl = document.getElementById('recent-notes');
    recentEl.innerHTML = recent.length
        ? recent.map(n => {
            const c = courseById(n.courseId);
            return `<div class="task" data-note="${n.id}" style="cursor: pointer;">
                <div class="task-body">
                    <div class="task-title">${escapeHtml(n.title || 'Bez názvu')}</div>
                    <div class="task-meta">
                        <span>${c ? c.icon + ' ' + escapeHtml(c.code) : '—'}</span>
                        <span>${formatDateTime(n.updated)}</span>
                    </div>
                </div>
            </div>`;
        }).join('')
        : '<div class="empty-state">Zatím žádné poznámky. Začni v sekci 📝 Poznámky.</div>';

    recentEl.querySelectorAll('[data-note]').forEach(node => {
        node.addEventListener('click', () => openNote(node.dataset.note));
    });
}

/* ---------- Export / import ---------- */

document.getElementById('export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rozvrh-poznamky-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
});

document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            const notes = Array.isArray(data.notes) ? data.notes : [];
            const tasks = Array.isArray(data.tasks) ? data.tasks : [];
            if (!confirm(`Načíst ${notes.length} poznámek a ${tasks.length} úkolů? Současná data budou nahrazena.`)) return;
            store = { notes, tasks, version: 1 };
            saveStore();
            state.noteId = null;
            render();
            alert('Data načtena ✓');
        } catch {
            alert('Soubor se nepodařilo načíst – není to platný JSON export.');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

/* ---------- Filtry poznámek ---------- */

function fillCourseSelects() {
    const filter = document.getElementById('note-filter-course');
    filter.innerHTML = '<option value="all">Všechny předměty</option>' +
        COURSES.map(c => `<option value="${c.id}">${c.icon} ${escapeHtml(c.code)}</option>`).join('');

    const taskCourse = document.getElementById('task-course');
    taskCourse.innerHTML = COURSES.map(c => `<option value="${c.id}">${c.icon} ${escapeHtml(c.code)}</option>`).join('') +
        '<option value="none">📌 Obecné</option>';
}

document.getElementById('note-search').addEventListener('input', e => {
    state.search = e.target.value;
    renderNotes();
});

document.getElementById('note-filter-course').addEventListener('change', e => {
    state.filterCourse = e.target.value;
    renderNotes();
});

document.getElementById('new-note-btn').addEventListener('click', () => createNote(
    state.filterCourse !== 'all' ? state.filterCourse : null
));

/* ---------- Klávesové zkratky ---------- */

document.addEventListener('keydown', e => {
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
    if (typing && !(e.key === 'Escape')) return;

    if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        createNote(state.course);
    } else if (e.key === '/') {
        e.preventDefault();
        showView('poznamky');
        document.getElementById('note-search').focus();
    } else if (e.key === 'Escape') {
        e.target.blur();
    }
});

/* ---------- Start ---------- */

function render() {
    renderNextClass();
    if (state.view === 'prehled') renderDashboard();
    if (state.view === 'rozvrh') renderSchedule();
    if (state.view === 'predmety') renderCourses();
    if (state.view === 'poznamky') renderNotes();
    if (state.view === 'ukoly') renderTasks();
}

initTheme();
fillCourseSelects();
showView('prehled');
setInterval(renderNextClass, 30000);
