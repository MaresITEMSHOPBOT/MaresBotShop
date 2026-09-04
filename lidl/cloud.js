/* ==========================================================================
   Online vrstva – ukládání do účtu (schopnost "db" publikované stránky).
   Bez ní appka funguje dál, jen si data drží v prohlížeči.

   Rozložení dokumentů (limit je 256 kB na dokument):
     app/settings, app/team, app/checklists, app/notes, app/plan
     days/<datum>        jeden den plánu
     photos/<id>         jedna fotka
   ========================================================================== */

const CLOUD = {
    enabled: false,
    db: null,
    status: 'start',
    lastWritten: {},        /* co jsme naposledy zapsali – kvůli synchronizaci */
    photos: new Map(),      /* id fotky -> data */
    pendingPhotos: new Set(),
    knownPhotoIds: new Set(),
    saveTimer: null,
    saving: false,
    dirtyAgain: false
};

window.CLOUD = CLOUD;

/* --- Stavový proužek v hlavičce -------------------------------------------- */

function cloudStatus(state, text) {
    CLOUD.status = state;
    const chip = document.getElementById('cloud-chip');
    if (!chip) return;
    chip.className = `cloud-chip ${state}`;
    chip.textContent = text;
}

function cloudChip() {
    let chip = document.getElementById('cloud-chip');
    if (chip) return chip;
    chip = document.createElement('span');
    chip.id = 'cloud-chip';
    chip.className = 'cloud-chip start';
    chip.textContent = 'Načítám…';
    const header = document.querySelector('.header-inner');
    if (header) header.insertBefore(chip, header.lastElementChild);
    return chip;
}

/* --- Rozdělení dat na dokumenty --------------------------------------------- */

const APP_DOCS = {
    settings: () => ({ value: DB.settings }),
    team: () => ({ items: DB.employees }),
    checklists: () => ({ value: DB.checklists }),
    notes: () => ({ items: DB.notes }),
    checks: () => ({ items: stripCheckPhotos(DB.checks) }),
    plan: () => ({ value: stripPhotos(DB.map) })
};

/* Fotky do plánu nepatří – uloží se zvlášť, jinak by dokument přerostl limit.
   Id fotky se přiděluje živým datům, ne kopii, aby se při každém uložení
   nezakládala nová fotka. */
function assignPhotoIds() {
    photoHolders().forEach(item => {
        if (!item.photo || item.photoId) return;
        item.photoId = 'f' + uid();
        CLOUD.photos.set(item.photoId, item.photo);
        CLOUD.pendingPhotos.add(item.photoId);
    });
}

function withoutPhoto(item) {
    const copy = { ...item, photoId: item.photoId || '' };
    delete copy.photo;
    return copy;
}

function stripPhotos(map) {
    return {
        ...map,
        elements: map.elements.map(element => ({
            ...withoutPhoto(element),
            articles: element.articles.map(withoutPhoto)
        }))
    };
}

function stripCheckPhotos(checks) {
    return checks.map(withoutPhoto);
}

function applyAppDoc(id, body) {
    if (!body) return;
    if (id === 'settings') DB.settings = { ...DB.settings, ...body.value };
    if (id === 'team') DB.employees = body.items || [];
    if (id === 'checklists') DB.checklists = body.value || DB.checklists;
    if (id === 'notes') DB.notes = body.items || [];
    if (id === 'checks') DB.checks = body.items || [];
    if (id === 'plan' && body.value) DB.map = body.value;
}

/* --- Načtení ---------------------------------------------------------------- */

async function loadEverything() {
    const [appDocs, dayDocs] = await Promise.all([
        CLOUD.db.collection('app').get(),
        CLOUD.db.collection('days').get()
    ]);

    if (appDocs.empty && dayDocs.empty) return false;

    appDocs.docs.forEach(doc => {
        const body = doc.data();
        CLOUD.lastWritten['app/' + doc.id] = JSON.stringify(body);
        applyAppDoc(doc.id, body);
    });

    const days = {};
    dayDocs.docs.forEach(doc => {
        const body = doc.data();
        CLOUD.lastWritten['days/' + doc.id] = JSON.stringify(body);
        days[doc.id] = body;
    });
    DB.days = days;

    DB = normalize(DB);
    rememberPhotoIds();
    return true;
}

/* Všechno, co může nést fotku – prvky plánu, jejich artikly a záznamy kontrol. */
function photoHolders() {
    const holders = [];
    DB.map.elements.forEach(element => {
        holders.push(element);
        element.articles.forEach(article => holders.push(article));
    });
    DB.checks.forEach(check => holders.push(check));
    return holders;
}

function rememberPhotoIds() {
    CLOUD.knownPhotoIds = new Set();
    photoHolders().forEach(item => { if (item.photoId) CLOUD.knownPhotoIds.add(item.photoId); });
}

/* --- Zápis ------------------------------------------------------------------ */

CLOUD.save = function () {
    if (!CLOUD.enabled) return false;
    cloudStatus('saving', 'Ukládám…');
    clearTimeout(CLOUD.saveTimer);
    CLOUD.saveTimer = setTimeout(flush, 700);
    return true;
};

async function flush() {
    if (CLOUD.saving) { CLOUD.dirtyAgain = true; return; }
    CLOUD.saving = true;
    assignPhotoIds();

    const writes = [];
    const referenced = new Set();

    Object.entries(APP_DOCS).forEach(([id, build]) => {
        const body = build();
        const json = JSON.stringify(body);
        if (json.length > 250000) {
            cloudStatus('error', 'Data jsou moc velká');
            return;
        }
        if (CLOUD.lastWritten['app/' + id] !== json) {
            CLOUD.lastWritten['app/' + id] = json;
            writes.push(CLOUD.db.doc('app/' + id).set(body));
        }
    });

    photoHolders().forEach(item => { if (item.photoId) referenced.add(item.photoId); });

    CLOUD.pendingPhotos.forEach(id => {
        const data = CLOUD.photos.get(id);
        if (data) writes.push(CLOUD.db.doc('photos/' + id).set({ data }));
    });
    CLOUD.pendingPhotos.clear();

    /* Fotky, na které už nic neodkazuje, uklidíme. */
    CLOUD.knownPhotoIds.forEach(id => {
        if (!referenced.has(id)) writes.push(CLOUD.db.doc('photos/' + id).delete().catch(() => {}));
    });
    CLOUD.knownPhotoIds = referenced;

    Object.entries(DB.days).forEach(([iso, day]) => {
        const json = JSON.stringify(day);
        if (CLOUD.lastWritten['days/' + iso] !== json) {
            CLOUD.lastWritten['days/' + iso] = json;
            writes.push(CLOUD.db.doc('days/' + iso).set(day));
        }
    });

    Object.keys(CLOUD.lastWritten).forEach(path => {
        if (!path.startsWith('days/')) return;
        const iso = path.slice(5);
        if (DB.days[iso]) return;
        delete CLOUD.lastWritten[path];
        writes.push(CLOUD.db.doc(path).delete().catch(() => {}));
    });

    try {
        await Promise.all(writes);
        cloudStatus('ok', 'Uloženo');
    } catch (err) {
        const code = err && err.code;
        if (code === 'quota_exceeded') cloudStatus('error', 'Plno – smaž fotky');
        else if (code === 'revoked' || code === 'not_granted') cloudStatus('error', 'Bez přístupu');
        else cloudStatus('error', 'Neuloženo');
        console.error('Ukládání selhalo', err);
    }

    CLOUD.saving = false;
    if (CLOUD.dirtyAgain) { CLOUD.dirtyAgain = false; CLOUD.save(); }
}

/* --- Fotky ------------------------------------------------------------------ */

CLOUD.cachedPhoto = function (id) {
    return CLOUD.photos.get(id) || null;
};

const loadingPhotos = new Set();

async function fetchPhoto(id) {
    if (!CLOUD.enabled || loadingPhotos.has(id)) return null;
    loadingPhotos.add(id);
    try {
        const snap = await CLOUD.db.doc('photos/' + id).get();
        const data = snap.exists ? snap.data().data : null;
        if (data) CLOUD.photos.set(id, data);
        return data;
    } catch {
        return null;
    } finally {
        loadingPhotos.delete(id);
    }
}

/* Nahradí prázdnou funkci z map.js – doplní obrázky, které ještě nejsou stažené. */
window.hydratePhotos = function (root) {
    if (!CLOUD.enabled || !root) return;
    root.querySelectorAll('img[data-photo-pending]').forEach(async img => {
        const id = img.dataset.photoId;
        if (!id) return;
        img.removeAttribute('data-photo-pending');
        const data = CLOUD.photos.get(id) || await fetchPhoto(id);
        if (data && img.isConnected) img.src = data;
    });
};

/* --- Synchronizace mezi zařízeními -------------------------------------------- */

function watchChanges() {
    const onError = err => {
        console.error('Sledování změn skončilo', err);
        cloudStatus('error', 'Bez spojení');
    };

    CLOUD.db.collection('app').onSnapshot(snap => {
        let changed = false;
        snap.docs.forEach(doc => {
            const json = JSON.stringify(doc.data());
            if (CLOUD.lastWritten['app/' + doc.id] === json) return;
            CLOUD.lastWritten['app/' + doc.id] = json;
            applyAppDoc(doc.id, doc.data());
            changed = true;
        });
        if (changed) refreshFromRemote();
    }, onError);

    CLOUD.db.collection('days').onSnapshot(snap => {
        let changed = false;
        snap.docChanges().forEach(change => {
            const path = 'days/' + change.doc.id;
            if (change.type === 'removed') {
                if (DB.days[change.doc.id]) { delete DB.days[change.doc.id]; changed = true; }
                delete CLOUD.lastWritten[path];
                return;
            }
            const json = JSON.stringify(change.doc.data());
            if (CLOUD.lastWritten[path] === json) return;
            CLOUD.lastWritten[path] = json;
            DB.days[change.doc.id] = change.doc.data();
            changed = true;
        });
        if (changed) refreshFromRemote();
    }, onError);
}

/* Cizí změna dorazila – data srovnáme a překreslíme, co je zrovna vidět. */
function refreshFromRemote() {
    DB = normalize(DB);
    rememberPhotoIds();
    if (!document.querySelector('.modal')) render();
}

/* --- Start ------------------------------------------------------------------- */

CLOUD.start = async function (boot) {
    cloudChip();
    let db = null;
    try {
        db = window.claude ? await window.claude.use('db') : null;
    } catch (err) {
        console.error('Připojení k účtu selhalo', err);
    }

    if (!db) {
        CLOUD.enabled = false;
        cloudStatus('offline', 'Jen v prohlížeči');
        boot();
        return;
    }

    CLOUD.db = db;
    CLOUD.enabled = true;

    try {
        const had = await loadEverything();
        boot();
        if (!had) {
            /* První spuštění – uložíme výchozí obsah, ať je co upravovat. */
            cloudStatus('saving', 'Zakládám…');
            await flush();
        } else {
            cloudStatus('ok', 'Uloženo');
        }
        watchChanges();
    } catch (err) {
        console.error('Načtení dat selhalo', err);
        CLOUD.enabled = false;
        cloudStatus('error', 'Načtení selhalo');
        boot();
    }
};
