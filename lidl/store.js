/* ==========================================================================
   Vedení směny – datová vrstva
   Vše se ukládá do localStorage prohlížeče. Žádný server, funguje offline.
   ========================================================================== */

const STORAGE_KEY = 'lidl-vedeni-smeny';
const SCHEMA_VERSION = 1;

/* --- Číselníky ------------------------------------------------------------ */

const POSITIONS = [
    'Vedoucí prodejny',
    'Zástupce vedoucího',
    'Vedoucí směny',
    'Prodavač / pokladní',
    'Brigádník',
    'Pekař',
    'Výpomoc z jiné prodejny'
];

const DEFAULT_TASKS = [
    { id: 'pokladna',    name: 'Pokladna',              icon: '🧾' },
    { id: 'prijem',      name: 'Příjem zboží / vykládka', icon: '🚚' },
    { id: 'sucha',       name: 'Suché zboží',           icon: '📦' },
    { id: 'ovoce',       name: 'Ovoce a zelenina',      icon: '🥦' },
    { id: 'pecivo',      name: 'Pečivo / pečení',       icon: '🥐' },
    { id: 'chlazene',    name: 'Chlazené',              icon: '🧀' },
    { id: 'mrazene',     name: 'Mražené',               icon: '🧊' },
    { id: 'akce',        name: 'Akce / nonfood',        icon: '🏷️' },
    { id: 'data',        name: 'Kontrola dat / redukce', icon: '⏱️' },
    { id: 'uklid',       name: 'Úklid',                 icon: '🧹' },
    { id: 'vratky',      name: 'Vratky a obaly',        icon: '♻️' },
    { id: 'inventura',   name: 'Inventura',             icon: '🔢' }
];

const DEFAULT_DELIVERY_TYPES = [
    { id: 'sucha',    name: 'Suché zboží',       icon: '📦' },
    { id: 'cerstve',  name: 'Čerstvé / chlazené', icon: '🧀' },
    { id: 'ovoce',    name: 'Ovoce a zelenina',  icon: '🥦' },
    { id: 'mrazene',  name: 'Mražené',           icon: '🧊' },
    { id: 'pecivo',   name: 'Pečivo',            icon: '🥐' },
    { id: 'napoje',   name: 'Nápoje',            icon: '🥤' },
    { id: 'akce',     name: 'Akční zboží',       icon: '🏷️' }
];

const NOTE_CATEGORIES = [
    'Otevírání a zavírání',
    'Pokladna a tržba',
    'Objednávky',
    'Zboží a doplňování',
    'Data spotřeby a odpisy',
    'Personál a plánování',
    'Bezpečnost a hygiena',
    'Zákazník a reklamace',
    'Systémy a technika',
    'Ostatní'
];

/* Výchozí checklisty vedoucího směny – klidně si je uprav v sekci Checklist. */
const DEFAULT_CHECKLISTS = {
    open: [
        'Odemknout prodejnu, vypnout alarm, zkontrolovat okolí a vstup',
        'Kontrola teplot chlazení a mrazáků, zápis do formuláře',
        'Rozdělit lidi na úseky a říct priority dne',
        'Připravit pokladny – šuplíky, drobné, kontrola stavu',
        'Kontrola pečiva – napečeno na otevírací špičku',
        'Kontrola ovoce a zeleniny – kvalita, vytříděné kusy',
        'Projít akční plochy a cenovky (nový akční týden)',
        'Zkontrolovat příjem zboží / avízo dodávek na dnešek'
    ],
    during: [
        'Kontrola front na pokladnách, včas otevřít druhou pokladnu',
        'Průběžná kontrola dat spotřeby a redukce',
        'Doplnění zboží z palet, prázdné palety a klece odklidit',
        'Kontrola čistoty prodejny a zázemí',
        'Odvod přebytečné hotovosti z pokladen do trezoru',
        'Kontrola dodržování přestávek podle plánu'
    ],
    close: [
        'Doplnit zboží na noc, uklidit uličky a paletové místo',
        'Kontrola a zápis odpisů, uzavření redukcí',
        'Uzávěrka pokladen, přepočet a odvod tržby do trezoru',
        'Kontrola teplot na konci dne',
        'Kontrola zázemí, vypnutí spotřebičů, vynesení odpadu',
        'Poslední obchůzka – nikdo v prodejně, zavřené vstupy',
        'Zapnout alarm, zamknout, zapsat předání směny'
    ]
};

/* --- Pomocné funkce ------------------------------------------------------- */

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function isoDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function parseISO(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function todayISO() {
    return isoDate(new Date());
}

function addDays(iso, count) {
    const date = parseISO(iso);
    date.setDate(date.getDate() + count);
    return isoDate(date);
}

/* Pondělí týdne, do kterého datum spadá. */
function weekStart(iso) {
    const date = parseISO(iso);
    const shift = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - shift);
    return isoDate(date);
}

const DAY_NAMES = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
const DAY_SHORT = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
const MONTH_NAMES = ['ledna', 'února', 'března', 'dubna', 'května', 'června',
    'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];

function dayName(iso) {
    return DAY_NAMES[parseISO(iso).getDay()];
}

function dayShort(iso) {
    return DAY_SHORT[parseISO(iso).getDay()];
}

function isWeekend(iso) {
    const d = parseISO(iso).getDay();
    return d === 0 || d === 6;
}

function formatDate(iso) {
    const date = parseISO(iso);
    return `${date.getDate()}. ${date.getMonth() + 1}.`;
}

function formatDateLong(iso) {
    const date = parseISO(iso);
    return `${dayName(iso)} ${date.getDate()}. ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/* '06:15' -> 375 minut */
function timeToMinutes(time) {
    if (!time || !/^\d{1,2}:\d{2}$/.test(time)) return null;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function minutesToText(minutes) {
    if (minutes == null) return '–';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}:${String(m).padStart(2, '0')} h` : `${h} h`;
}

/* Délka směny v minutách. Přes půlnoc se počítá jako pokračování dalšího dne. */
function shiftMinutes(from, to) {
    const start = timeToMinutes(from);
    const end = timeToMinutes(to);
    if (start == null || end == null) return 0;
    return end >= start ? end - start : (24 * 60 - start) + end;
}

/* Čistý odpracovaný čas po odečtení zákonné přestávky. */
function netMinutes(from, to) {
    const gross = shiftMinutes(from, to);
    const rules = DB.settings.break;
    if (!rules || !rules.minutes) return gross;
    if (gross >= rules.afterHours * 60) return gross - rules.minutes;
    return gross;
}

/* --- Výchozí databáze ----------------------------------------------------- */

function emptyDb() {
    return {
        version: SCHEMA_VERSION,
        settings: {
            storeName: '',
            myName: '',
            openFrom: '07:00',
            openTo: '21:00',
            morningShift: { from: '06:00', to: '14:00' },
            afternoonShift: { from: '13:00', to: '21:30' },
            break: { afterHours: 6, minutes: 30 },
            theme: 'light'
        },
        employees: [],
        tasks: DEFAULT_TASKS.map(t => ({ ...t })),
        deliveryTypes: DEFAULT_DELIVERY_TYPES.map(t => ({ ...t })),
        checklists: {
            open: DEFAULT_CHECKLISTS.open.map(text => ({ id: uid(), text })),
            during: DEFAULT_CHECKLISTS.during.map(text => ({ id: uid(), text })),
            close: DEFAULT_CHECKLISTS.close.map(text => ({ id: uid(), text }))
        },
        days: {},
        notes: []
    };
}

/* Doplní chybějící klíče – aby appka přežila starší zálohu i ruční úpravu. */
function normalize(data) {
    const base = emptyDb();
    if (!data || typeof data !== 'object') return base;

    const db = {
        version: SCHEMA_VERSION,
        settings: { ...base.settings, ...(data.settings || {}) },
        employees: Array.isArray(data.employees) ? data.employees : [],
        tasks: Array.isArray(data.tasks) && data.tasks.length ? data.tasks : base.tasks,
        deliveryTypes: Array.isArray(data.deliveryTypes) && data.deliveryTypes.length
            ? data.deliveryTypes : base.deliveryTypes,
        checklists: { ...base.checklists, ...(data.checklists || {}) },
        days: (data.days && typeof data.days === 'object') ? data.days : {},
        notes: Array.isArray(data.notes) ? data.notes : []
    };

    db.settings.break = { ...base.settings.break, ...(db.settings.break || {}) };
    db.settings.morningShift = { ...base.settings.morningShift, ...(db.settings.morningShift || {}) };
    db.settings.afternoonShift = { ...base.settings.afternoonShift, ...(db.settings.afternoonShift || {}) };

    db.employees.forEach(e => {
        e.id = e.id || uid();
        e.skills = Array.isArray(e.skills) ? e.skills : [];
        e.active = e.active !== false;
    });

    Object.entries(db.days).forEach(([iso, day]) => {
        db.days[iso] = { ...emptyDay(iso), ...day };
        const d = db.days[iso];
        d.entries = Array.isArray(d.entries) ? d.entries : [];
        d.deliveries = Array.isArray(d.deliveries) ? d.deliveries : [];
        d.checks = d.checks && typeof d.checks === 'object' ? d.checks : {};
        d.entries.forEach(entry => {
            entry.id = entry.id || uid();
            entry.tasks = Array.isArray(entry.tasks) ? entry.tasks : [];
        });
        d.deliveries.forEach(item => {
            item.id = item.id || uid();
            item.pallets = Number(item.pallets) || 0;
            item.rolls = Number(item.rolls) || 0;
        });
    });

    db.notes.forEach(n => {
        n.id = n.id || uid();
        n.tags = Array.isArray(n.tags) ? n.tags : [];
        n.date = n.date || todayISO();
    });

    return db;
}

function emptyDay(iso) {
    return {
        date: iso,
        leaderId: '',
        leaderPmId: '',
        note: '',
        entries: [],
        deliveries: [],
        checks: {},
        stats: { revenue: '', customers: '', writeOff: '' }
    };
}

/* --- Načtení a uložení ---------------------------------------------------- */

let DB = load();

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return normalize(raw ? JSON.parse(raw) : null);
    } catch {
        return emptyDb();
    }
}

function save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
        return true;
    } catch (err) {
        alert('Data se nepodařilo uložit do prohlížeče. Zkontroluj volné místo nebo režim anonymního prohlížení.');
        return false;
    }
}

function replaceDb(data) {
    DB = normalize(data);
    save();
}

/* --- Přístup k datům ------------------------------------------------------ */

function getDay(iso) {
    return DB.days[iso] || emptyDay(iso);
}

/* Vrátí den připravený k zápisu (a rovnou ho zaregistruje v databázi). */
function ensureDay(iso) {
    if (!DB.days[iso]) DB.days[iso] = emptyDay(iso);
    return DB.days[iso];
}

function hasDayContent(day) {
    return Boolean(
        day.entries.length ||
        day.deliveries.length ||
        day.note ||
        day.leaderId ||
        day.leaderPmId ||
        Object.values(day.checks).some(Boolean) ||
        (day.stats && (day.stats.revenue || day.stats.customers || day.stats.writeOff))
    );
}

/* Zahodí den, ve kterém po úpravě nic nezůstalo. */
function pruneDay(iso) {
    const day = DB.days[iso];
    if (day && !hasDayContent(day)) delete DB.days[iso];
}

function employeeById(id) {
    return DB.employees.find(e => e.id === id) || null;
}

function employeeName(id) {
    const employee = employeeById(id);
    return employee ? employee.name : 'Neurčeno';
}

function taskById(id) {
    return DB.tasks.find(t => t.id === id) || { id, name: id, icon: '•' };
}

function deliveryTypeById(id) {
    return DB.deliveryTypes.find(t => t.id === id) || { id, name: id, icon: '📦' };
}

function activeEmployees() {
    return DB.employees.filter(e => e.active).sort((a, b) => a.name.localeCompare(b.name, 'cs'));
}

function weekDays(startIso) {
    return Array.from({ length: 7 }, (_, i) => addDays(startIso, i));
}

function palletsOfDay(iso) {
    return getDay(iso).deliveries.reduce((sum, item) => sum + (Number(item.pallets) || 0), 0);
}

function rollsOfDay(iso) {
    return getDay(iso).deliveries.reduce((sum, item) => sum + (Number(item.rolls) || 0), 0);
}

/* Odpracované minuty zaměstnance v zadaném rozsahu dní (včetně obou konců). */
function workedMinutes(employeeId, fromIso, toIso) {
    let total = 0;
    Object.keys(DB.days).forEach(iso => {
        if (iso < fromIso || iso > toIso) return;
        getDay(iso).entries
            .filter(entry => entry.employeeId === employeeId)
            .forEach(entry => { total += netMinutes(entry.from, entry.to); });
    });
    return total;
}

/* Skloňování počtů – ať appka nemluví jako formulář. */
function peopleText(count) {
    if (count === 1) return '1 člověk';
    if (count >= 2 && count <= 4) return `${count} lidi`;
    return `${count} lidí`;
}

function dayCountText(count) {
    if (count === 1) return '1 den';
    if (count >= 2 && count <= 4) return `${count} dny`;
    return `${count} dní`;
}

function checklistProgress(iso) {
    const day = getDay(iso);
    const all = [...DB.checklists.open, ...DB.checklists.during, ...DB.checklists.close];
    const done = all.filter(item => day.checks[item.id]).length;
    return { done, total: all.length };
}
