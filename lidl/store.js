/* ==========================================================================
   Vedení směny – datová vrstva
   Vše se ukládá do localStorage prohlížeče. Žádný server, funguje offline.
   ========================================================================== */

const STORAGE_KEY = 'lidl-vedeni-smeny';
const APP_BUILD = '__BUILD__';   /* doplní build skript – ať je poznat, jaká verze běží */
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

const MAP_SEED = 2;

const MAP_TYPES = [
    { id: 'regal',        name: 'Regál – suché zboží',      levels: 5, icon: '📦', fill: '#c6cbd2', stroke: '#5c6673', text: '#16202c' },
    { id: 'pokladna',     name: 'Pokladna',                 levels: 2, icon: '🧾', fill: '#ffdf1b', stroke: '#a08600', text: '#16202c' },
    { id: 'samoobsluzna', name: 'Samoobslužná pokladna',    levels: 1, icon: '🖥️', fill: '#ffe97a', stroke: '#a08600', text: '#16202c' },
    { id: 'akce',         name: 'Akce',                     levels: 3, icon: '🏷️', fill: '#ff8a1e', stroke: '#a85200', text: '#301400' },
    { id: 'gondola',      name: 'Gondola',                  levels: 3, icon: '⭐', fill: '#ffe9e7', stroke: '#e01b1b', text: '#b01410' },
    { id: 'zelenina',     name: 'Ovoce, zelenina, květiny', levels: 3, icon: '🥦', fill: '#8fd130', stroke: '#4d7a10', text: '#16300a' },
    { id: 'pekarna',      name: 'Pekárna',                  levels: 4, icon: '🥐', fill: '#9b3fbf', stroke: '#5f1f78', text: '#ffffff' },
    { id: 'chlazene',     name: 'Chlazené výrobky',         levels: 4, icon: '🧀', fill: '#3b48c4', stroke: '#232c85', text: '#ffffff' },
    { id: 'mrazene',      name: 'Mražené výrobky',          levels: 3, icon: '🧊', fill: '#7d9ed4', stroke: '#42618f', text: '#0d1c33' },
    { id: 'lednicka',     name: 'Lednička',                 levels: 3, icon: '🥤', fill: '#a9dff0', stroke: '#3f8ba5', text: '#0d2b33' },
    { id: 'kava',         name: 'Káva',                     levels: 4, icon: '☕', fill: '#2b2b2b', stroke: '#000000', text: '#ffffff' },
    { id: 'nonfood',      name: 'Nonfood / textil',         levels: 4, icon: '👕', fill: '#f7b6cd', stroke: '#b25e7d', text: '#3a1122' },
    { id: 'vystavka',     name: 'Výstavka / stojan',        levels: 3, icon: '🛠️', fill: '#28a745', stroke: '#136226', text: '#ffffff' },
    { id: 'ostatni',      name: 'Ostatní zboží',            levels: 4, icon: '🍯', fill: '#8a8a8a', stroke: '#4d4d4d', text: '#ffffff' },
    { id: 'dvere',        name: 'Dveře / vstup',            levels: 1, icon: '🚪', fill: '#e01b1b', stroke: '#8c0f0f', text: '#ffffff' },
    { id: 'popisek',      name: 'Popisek (jen text)',       levels: 1, icon: '',   fill: 'transparent', stroke: 'transparent', text: 'currentColor' }
];

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
            theme: ''
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
        notes: [],
        checks: [],
        map: defaultMap()
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
        notes: Array.isArray(data.notes) ? data.notes : [],
        checks: Array.isArray(data.checks) ? data.checks : [],
        map: (data.map && Array.isArray(data.map.elements)) ? data.map : defaultMap()
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

    db.checks.forEach(check => {
        check.id = check.id || uid();
        check.at = check.at || todayISO();
        ['elementId', 'ean', 'name', 'expiry', 'note', 'action'].forEach(key => {
            check[key] = check[key] || '';
        });
        check.level = Math.max(0, Math.round(Number(check.level) || 0));
        check.pieces = Math.max(0, Math.round(Number(check.pieces) || 0));
        check.done = Boolean(check.done);
    });

    /* Starší, ručně obkreslený plán nahradíme srovnaným – ale jen dokud si do něj
       nikdo nezapsal artikly. Kdo už v plánu pracuje, o svou verzi nepřijde. */
    const untouched = db.map.elements.every(element => !(element.articles || []).length);
    if ((Number(db.map.seed) || 1) < MAP_SEED && untouched) db.map = defaultMap();

    db.map.seed = Number(db.map.seed) || MAP_SEED;
    db.map.width = Number(db.map.width) || 1100;
    db.map.height = Number(db.map.height) || 1180;
    db.map.elements.forEach(element => {
        element.id = element.id || uid();
        element.type = element.type || 'ostatni';
        element.name = element.name || '';
        element.note = element.note || '';
        element.articles = Array.isArray(element.articles) ? element.articles : [];
        if (element.levels != null) {
            element.levels = Math.min(12, Math.max(1, Math.round(Number(element.levels) || 1)));
        }
        element.articles.forEach(article => {
            article.id = article.id || uid();
            article.name = article.name || '';
            ['code', 'ean', 'shelf', 'note'].forEach(key => { article[key] = article[key] || ''; });
            article.level = Math.max(0, Math.round(Number(article.level) || 0));
            if (article.level > levelsOf(element)) article.level = 0;
        });
        ['x', 'y', 'w', 'h'].forEach(key => { element[key] = Math.round(Number(element[key]) || 0); });
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

/* Co je uložené v prohlížeči – kvůli dohledání zápisů, které nedošly do účtu. */
function readLocal() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/* Do prohlížeče ukládáme vždycky – i v online verzi. Je to záchranná síť:
   když zápis nedojde do účtu, neztratí se a při dalším spuštění se doplní. */
function saveLocal() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
        return true;
    } catch {
        return false;
    }
}

function save() {
    if (window.CLOUD && window.CLOUD.enabled) {
        saveLocal();
        return window.CLOUD.save();
    }
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
        return true;
    } catch (err) {
        alert('Data se nepodařilo uložit – paměť prohlížeče je plná (nejspíš kvůli fotkám). Stáhni si zálohu v Nastavení a část fotek smaž.');
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

function articleText(count) {
    if (count === 1) return '1 artikl';
    if (count >= 2 && count <= 4) return `${count} artikly`;
    return `${count} artiklů`;
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
/* ==========================================================================
   Plán prodejny
   Souřadnice jsou v jednotkách plánu (mřížka po 10), vykreslení si je
   přepočítá podle velikosti obrazovky. Prodejna je 1100 × 1180 jednotek.
   ========================================================================== */

function mapTypeById(id) {
    return MAP_TYPES.find(t => t.id === id) || MAP_TYPES[13];
}

/* Výchozí plán prodejny.
   Sloupce a řady jsou zarovnané na mřížku, ať plán působí souměrně:
   čtyři vnitřní sloupce na x = 250 / 410 / 570 / 730, obvodové stěny na 40 a 1000. */
function defaultMap() {
    const make = (type, name, x, y, w, h) => ({ id: uid(), type, name, x, y, w, h, note: '', articles: [] });
    const COL = [250, 410, 570, 730];

    return {
        seed: MAP_SEED,
        width: 1100,
        height: 1180,
        elements: [
            /* Obvodové stěny */
            make('chlazene', 'Chlazené výrobky – zadní stěna', 40, 40, 1020, 36),
            make('chlazene', 'Chlazené výrobky', 40, 100, 60, 180),
            make('mrazene', 'Mražené výrobky', 40, 300, 60, 150),
            make('chlazene', 'Chlazené výrobky', 1000, 100, 60, 170),
            make('chlazene', 'Chlazené výrobky', 1000, 290, 60, 160),
            make('pekarna', 'Pekárna', 1000, 480, 60, 140),
            make('dvere', 'Dveře do Tomry (vratné lahve)', 1000, 820, 60, 80),

            /* Přední řada – výstavky, akce, nonfood */
            make('vystavka', 'Parkside', COL[0], 100, 90, 140),
            make('akce', 'Akce 1', COL[1], 100, 90, 140),
            make('akce', 'Akce 2', COL[2], 100, 90, 140),
            make('nonfood', 'Nonfood', COL[3], 100, 90, 140),

            /* Druhá řada */
            make('mrazene', 'Mražené výrobky – ostrov', COL[0], 280, 90, 120),
            make('akce', 'Akce 3', COL[1], 280, 90, 120),
            make('akce', 'Akce 4', COL[2], 280, 90, 120),
            make('nonfood', 'Nonfood', COL[3], 280, 90, 120),

            /* Gondoly nad uličkami – mění se podle plánu gondol */
            make('gondola', 'Gondola A', COL[0], 420, 90, 26),
            make('gondola', 'Gondola B', COL[1], 420, 90, 26),
            make('gondola', 'Gondola C', COL[2], 420, 90, 26),
            make('gondola', 'Gondola D', COL[3], 420, 90, 26),

            /* Regály a úseky */
            make('regal', 'Regál u stěny – ulička 5', 40, 480, 60, 280),
            make('regal', 'Regál mezi uličkami 4 a 5', COL[0], 480, 90, 360),
            make('regal', 'Regál mezi uličkami 3 a 4', COL[1], 480, 90, 360),
            make('regal', 'Regál mezi uličkami 2 a 3', COL[2], 480, 90, 360),
            make('zelenina', 'Ovoce a zelenina', COL[3], 480, 90, 300),
            make('ostatni', 'Čaje, med, marmelády', 890, 560, 90, 200),
            make('kava', 'Káva', 890, 880, 90, 140),

            /* Čela uliček */
            make('gondola', 'Čelo uličky 4/5', COL[0], 850, 90, 26),
            make('gondola', 'Čelo uličky 3/4', COL[1], 850, 90, 26),
            make('gondola', 'Čelo uličky 2/3', COL[2], 850, 90, 26),

            /* Pokladní zóna */
            make('lednicka', 'Lednička u samoobslužných pokladen', 40, 800, 90, 60),
            make('samoobsluzna', 'SB 1', 40, 900, 90, 70),
            make('samoobsluzna', 'SB 2', 150, 900, 90, 70),
            make('samoobsluzna', 'SB 3', 40, 1000, 90, 70),
            make('samoobsluzna', 'SB 4', 150, 1000, 90, 70),
            make('samoobsluzna', 'SB 5', 40, 1100, 90, 70),
            make('samoobsluzna', 'SB 6', 150, 1100, 90, 70),
            make('pokladna', 'Pokladna 1', 280, 900, 70, 250),
            make('pokladna', 'Pokladna 2', 420, 900, 70, 250),
            make('pokladna', 'Pokladna 3', 560, 900, 70, 250),
            make('pokladna', 'Pokladna 4', 700, 900, 70, 250),

            /* Ovoce a květiny u vchodu */
            make('zelenina', 'Melouny', 800, 900, 80, 70),
            make('zelenina', 'Květiny', 800, 1010, 80, 90),

            /* Popisky uliček */
            make('popisek', 'Ulička 5', 130, 600, 90, 30),
            make('popisek', 'Ulička 4', 330, 600, 90, 30),
            make('popisek', 'Ulička 3', 490, 600, 90, 30),
            make('popisek', 'Ulička 2', 650, 600, 90, 30),
            make('popisek', 'Ulička 1', 810, 620, 90, 30)
        ]
    };
}

/* Počet polic – buď vlastní u prvku, nebo výchozí podle typu. */
function levelsOf(element) {
    if (element.levels) return element.levels;
    return mapTypeById(element.type).levels || 1;
}

/* Artikly na jedné polici v pořadí, v jakém stojí zleva doprava.
   Police 0 znamená „zatím nezařazeno". */
function articlesOnLevel(element, level) {
    return element.articles.filter(article => (article.level || 0) === level);
}

function levelName(level, total) {
    if (!level) return 'Nezařazené';
    if (level === 1) return total > 1 ? '1. police (nahoře)' : '1. police';
    if (level === total) return `${level}. police (dole)`;
    return `${level}. police`;
}

function mapElementById(id) {
    return DB.map.elements.find(e => e.id === id) || null;
}

/* Vyhledá artikl napříč celým plánem – podle názvu, čísla, EAN i poznámky. */
function findArticles(query) {
    const text = query.trim().toLowerCase();
    if (!text) return [];
    const hits = [];
    DB.map.elements.forEach(element => {
        element.articles.forEach(article => {
            const haystack = [article.name, article.code, article.ean, article.shelf, article.note]
                .filter(Boolean).join(' ').toLowerCase();
            if (haystack.includes(text)) hits.push({ element, article });
        });
    });
    return hits.sort((a, b) => a.article.name.localeCompare(b.article.name, 'cs'));
}

function allArticles() {
    const rows = [];
    DB.map.elements.forEach(element =>
        element.articles.forEach(article => rows.push({ element, article })));
    return rows.sort((a, b) => a.article.name.localeCompare(b.article.name, 'cs'));
}

function articleCount() {
    return DB.map.elements.reduce((sum, element) => sum + element.articles.length, 0);
}

function photoCount() {
    return DB.map.elements.reduce((sum, element) =>
        sum + element.articles.filter(article => article.photo || article.photoId).length, 0);
}

/* Kolik místa data zabírají – fotky se do prohlížeče vejdou jen v omezeném počtu. */
function storageBytes() {
    try {
        return new Blob([JSON.stringify(DB)]).size;
    } catch {
        return JSON.stringify(DB).length;
    }
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ==========================================================================
   Kontrola dat spotřeby
   Záznam vzniká při skenování zboží na konkrétním místě v prodejně.
   ========================================================================== */

const CHECK_ACTIONS = [
    { value: '', label: 'Zatím nic' },
    { value: 'sledovat', label: 'Sledovat' },
    { value: 'redukce', label: 'Dát do redukce' },
    { value: 'odpis', label: 'Odepsat' },
    { value: 'vraceni', label: 'Vrátit dodavateli' }
];

/* Kolik dní zbývá do data spotřeby (záporné = prošlé). */
function daysUntil(iso) {
    if (!iso) return null;
    const today = parseISO(todayISO());
    const target = parseISO(iso);
    return Math.round((target - today) / 86400000);
}

/* Naléhavost záznamu – podle ní se barví seznam. */
function expiryStatus(iso) {
    const days = daysUntil(iso);
    if (days == null) return { key: 'nedatum', label: 'Bez data', pill: '' };
    if (days < 0) return { key: 'prosle', label: days === -1 ? 'Prošlo včera' : `Prošlo před ${Math.abs(days)} dny`, pill: 'danger' };
    if (days === 0) return { key: 'dnes', label: 'Končí dnes', pill: 'danger' };
    if (days === 1) return { key: 'zitra', label: 'Končí zítra', pill: 'warning' };
    if (days <= 3) return { key: 'brzy', label: `Zbývají ${days} dny`, pill: 'warning' };
    if (days <= 7) return { key: 'tyden', label: `Zbývá ${days} dní`, pill: 'accent' };
    return { key: 'ok', label: `Zbývá ${days} dní`, pill: '' };
}

function checkActionLabel(value) {
    const action = CHECK_ACTIONS.find(a => a.value === value);
    return action && action.value ? action.label : '';
}

/* Nevyřešené záznamy od nejnaléhavějšího. */
function openChecks() {
    return DB.checks
        .filter(check => !check.done)
        .sort((a, b) => (a.expiry || '9999').localeCompare(b.expiry || '9999'));
}

function openChecksForElement(elementId) {
    return DB.checks.filter(check => check.elementId === elementId && !check.done);
}

function checksForElement(elementId) {
    return DB.checks
        .filter(check => check.elementId === elementId)
        .sort((a, b) => (b.at || '').localeCompare(a.at || ''));
}

function checkSummary() {
    const summary = { prosle: 0, dnes: 0, brzy: 0, tyden: 0, celkem: 0 };
    openChecks().forEach(check => {
        summary.celkem++;
        const key = expiryStatus(check.expiry).key;
        if (key === 'prosle') summary.prosle++;
        else if (key === 'dnes') summary.dnes++;
        else if (key === 'zitra' || key === 'brzy') summary.brzy++;
        else if (key === 'tyden') summary.tyden++;
    });
    return summary;
}

/* Najde artikl podle EAN kdekoli v plánu – kvůli předvyplnění názvu. */
function articleByEan(ean) {
    if (!ean) return null;
    for (const element of DB.map.elements) {
        const article = element.articles.find(a => a.ean && a.ean === ean);
        if (article) return { element, article };
    }
    return null;
}

function checkText(count) {
    if (count === 1) return '1 záznam';
    if (count >= 2 && count <= 4) return `${count} záznamy`;
    return `${count} záznamů`;
}
