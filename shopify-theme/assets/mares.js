
        // --- Loader ---
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.getElementById('loader').style.opacity = '0';
                setTimeout(() => document.getElementById('loader').style.visibility = 'hidden', 800);
            }, 1800);
        });

        // --- Countdown Timer ---
        const countDownDate = new Date().getTime() + (90 * 24 * 60 * 60 * 1000);
        const formatTime = (t) => t < 10 ? `0${t}` : t;
        setInterval(() => {
            const now = new Date().getTime();
            const distance = countDownDate - now;
            if (distance < 0) return document.getElementById("countdown").innerHTML = "SEASON CLOSED";
            document.getElementById("countdown").innerHTML =
                `${formatTime(Math.floor(distance / (1000 * 60 * 60 * 24)))} : ` +
                `${formatTime(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))} : ` +
                `${formatTime(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)))} : ` +
                `${formatTime(Math.floor((distance % (1000 * 60)) / 1000))}`;
        }, 1000);

        // --- Journey of MARES: the eye rides the glowing rail as you scroll ---
        (function () {
            const vert = document.getElementById('journeyVert');
            const rail = document.getElementById('jRail');
            const fill = document.getElementById('jRailFill');
            const eye = document.getElementById('jEye');
            const pupil = document.getElementById('jEyePupil');
            const about = document.getElementById('about');
            const stops = ['vs-0', 'vs-1', 'vs-2', 'vs-3', 'vs-4'];
            if (!vert || !eye || !rail) return;
            function onScroll() {
                const r = vert.getBoundingClientRect();
                const vh = window.innerHeight;
                const progress = Math.min(1, Math.max(0, (vh * 0.62 - r.top) / r.height));
                const y = progress * rail.clientHeight;
                eye.style.top = y + 'px';
                fill.style.height = y + 'px';
                about.setAttribute('data-stage', String(Math.min(5, Math.max(0, Math.ceil(progress * 5)))));
                let best = null, bestDist = Infinity;
                stops.forEach(id => {
                    const el = document.getElementById(id);
                    const b = el.getBoundingClientRect();
                    if (b.top < vh * 0.85) el.classList.add('lit');
                    const d = Math.abs((b.top + b.height / 2) - vh * 0.5);
                    if (d < bestDist) { bestDist = d; best = el; }
                });
                stops.forEach(id => {
                    const el = document.getElementById(id);
                    el.classList.toggle('looking', el === best && el.classList.contains('lit'));
                });
                if (best && best.classList.contains('lit')) {
                    const eb = eye.getBoundingClientRect();
                    const bb = best.getBoundingClientRect();
                    const dx = (bb.left + bb.width / 2) - (eb.left + eb.width / 2);
                    const dy = (bb.top + bb.height / 2) - (eb.top + eb.height / 2);
                    const len = Math.max(1, Math.hypot(dx, dy));
                    pupil.setAttribute('transform', 'translate(' + (dx / len * 16).toFixed(1) + ',' + (dy / len * 11).toFixed(1) + ')');
                } else {
                    pupil.setAttribute('transform', 'translate(0,0)');
                }
                if (progress >= 0.97) document.getElementById('journeySummary').classList.add('lit');
            }
            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onScroll);
            onScroll();
        })();

        // --- Scroll Reveal ---
        function reveal() {
            document.querySelectorAll(".reveal").forEach(el => {
                if (el.getBoundingClientRect().top < window.innerHeight - 100) el.classList.add("active");
            });
        }
        window.addEventListener("scroll", reveal);
        reveal();

        // --- Shopify checkout wiring ---
        // Shopify backend — cart permalink https://<domain>/cart/<variantId>:qty -> checkout
        const SHOPIFY = {
            domain: 'mareswear.com',
            variants: {
                'tee-1': { S: '57742966194558', M: '57742966227326', L: '57742966260094', XL: '57742966292862' },
                'tee-2': { S: '57742966358398', M: '57742966391166', L: '57742966423934', XL: '57742966456702' },
                'tee-3': { S: '57742966620542', M: '57742966653310', L: '57742966686078', XL: '57742966718846' }
            }
        };
        function variantFor(key, size) { return SHOPIFY.variants[key] && SHOPIFY.variants[key][size]; }
        // Czech koruna formatting used across the shop
        function money(n) { return '\u20ac' + Number(n).toFixed(2); }

        // --- Background music: dreamy celestial ambient (generated with Web Audio, no files) ---
        let audioCtx = null, musicOn = false, mChain = null, mTimer = null, mNextT = 0, mBar = 0, noiseBuf = null;
        const BPM = 50, STEP = 60 / BPM / 4, BAR = STEP * 16;
        // Em9 -> Cmaj7 -> G(add9) -> D6  — floating, wistful, in E minor
        const PROG = [
            { root: 41.20, chord: [164.81, 246.94, 329.63, 493.88], bells: [659.25, 987.77, 1318.51] },
            { root: 32.70, chord: [130.81, 196.00, 329.63, 493.88], bells: [523.25, 783.99, 1046.50] },
            { root: 49.00, chord: [196.00, 293.66, 392.00, 587.33], bells: [587.33, 880.00, 1174.66] },
            { root: 36.71, chord: [146.83, 220.00, 293.66, 440.00], bells: [587.33, 880.00, 1108.73] }
        ];

        function buildAudio() {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const master = audioCtx.createGain(); master.gain.value = 0;
            const bus = audioCtx.createGain(); bus.gain.value = 1;
            // long shimmering echo for the bells
            const delay = audioCtx.createDelay(2.0); delay.delayTime.value = STEP * 6;
            const fb = audioCtx.createGain(); fb.gain.value = 0.42;
            const damp = audioCtx.createBiquadFilter(); damp.type = 'lowpass'; damp.frequency.value = 2600;
            delay.connect(damp); damp.connect(fb); fb.connect(delay); delay.connect(master);
            bus.connect(master);
            master.connect(audioCtx.destination);
            mChain = { master, bus, delay };
        }

        // deep, slow heartbeat-like sub pulse
        function subPulse(t, f) {
            const o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = f;
            g.gain.setValueAtTime(0.001, t);
            g.gain.linearRampToValueAtTime(0.14, t + 0.6);
            g.gain.exponentialRampToValueAtTime(0.001, t + BAR * 0.9);
            o.connect(g); g.connect(mChain.bus);
            o.start(t); o.stop(t + BAR);
        }
        // glassy music-box bell: fundamental + a fast-decaying octave harmonic
        function bell(t, f) {
            const g = audioCtx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(0.09, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
            g.connect(mChain.bus); g.connect(mChain.delay);
            const o1 = audioCtx.createOscillator(); o1.type = 'sine'; o1.frequency.value = f; o1.connect(g);
            const h = audioCtx.createGain(); h.gain.setValueAtTime(0.04, t); h.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
            const o2 = audioCtx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.01; o2.connect(h); h.connect(mChain.bus);
            o1.start(t); o1.stop(t + 2.7); o2.start(t); o2.stop(t + 0.6);
        }
        // warm breathing pad
        function padChord(t, freqs, d) {
            freqs.forEach(f => {
                const o = audioCtx.createOscillator(), g = audioCtx.createGain(), lp = audioCtx.createBiquadFilter();
                o.type = 'triangle'; o.frequency.value = f; o.detune.value = (Math.random() * 6) - 3;
                lp.type = 'lowpass'; lp.frequency.value = 900;
                g.gain.setValueAtTime(0.001, t);
                g.gain.linearRampToValueAtTime(0.04, t + d * 0.35);
                g.gain.linearRampToValueAtTime(0.028, t + d * 0.7);
                g.gain.linearRampToValueAtTime(0.001, t + d);
                o.connect(lp); lp.connect(g); g.connect(mChain.bus);
                o.start(t); o.stop(t + d + 0.2);
            });
        }

        function scheduleBar() {
            if (!musicOn) return;
            const now = audioCtx.currentTime;
            if (mNextT < now + 0.05) mNextT = now + 0.05;
            const t0 = mNextT;
            const prog = PROG[mBar % PROG.length];
            padChord(t0, prog.chord, BAR);
            subPulse(t0, prog.root);
            // sprinkle bell notes on an off-beat pattern for a music-box feel
            const pattern = [0, 3, 6, 7, 10, 13];
            pattern.forEach(stepIdx => {
                if (Math.random() < 0.62) {
                    const note = prog.bells[Math.floor(Math.random() * prog.bells.length)];
                    bell(t0 + stepIdx * STEP, note * (Math.random() < 0.25 ? 2 : 1));
                }
            });
            mNextT = t0 + BAR;
            mBar++;
        }

        function startMusic() {
            if (!audioCtx) buildAudio();
            audioCtx.resume();
            musicOn = true;
            const t = audioCtx.currentTime;
            mChain.master.gain.cancelScheduledValues(t);
            mChain.master.gain.setValueAtTime(mChain.master.gain.value, t);
            mChain.master.gain.linearRampToValueAtTime(0.5, t + 2.5);
            mNextT = 0;
            scheduleBar();
            mTimer = setInterval(scheduleBar, BAR * 1000 * 0.9);
        }

        function stopMusic() {
            musicOn = false;
            if (mTimer) { clearInterval(mTimer); mTimer = null; }
            if (!audioCtx) return;
            const t = audioCtx.currentTime;
            mChain.master.gain.cancelScheduledValues(t);
            mChain.master.gain.setValueAtTime(mChain.master.gain.value, t);
            mChain.master.gain.linearRampToValueAtTime(0, t + 1.2);
            setTimeout(() => { if (!musicOn && audioCtx) audioCtx.suspend(); }, 1400);
        }

        function setMusicBtn() {
            const btn = document.getElementById('musicBtn');
            btn.classList.toggle('on', musicOn);
            btn.innerHTML = musicOn ? '&#9835; Sound On' : '&#9835; Sound Off';
        }

        function toggleMusic() {
            if (musicOn) { stopMusic(); localStorage.setItem('mares_music', 'off'); }
            else { startMusic(); localStorage.setItem('mares_music', 'on'); }
            setMusicBtn();
        }

        // Browsers only allow audio after a user gesture: start on the first
        // click/tap unless the visitor turned the music off before.
        document.addEventListener('pointerdown', function autoStart(e) {
            if (e.target.closest('#musicBtn')) { document.removeEventListener('pointerdown', autoStart); return; }
            if (!musicOn && localStorage.getItem('mares_music') !== 'off') { startMusic(); setMusicBtn(); }
            document.removeEventListener('pointerdown', autoStart);
        });

        // --- Draggable sun that moves the page light ---
        (function () {
            const sun = document.getElementById('sun');
            if (!sun) return;
            const root = document.documentElement;
            function setLightFromSun() {
                const r = sun.getBoundingClientRect();
                const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
                root.style.setProperty('--sun-x', (cx / window.innerWidth * 100).toFixed(1) + '%');
                root.style.setProperty('--sun-y', (cy / window.innerHeight * 100).toFixed(1) + '%');
            }
            // initial light aligned to the sun's default spot
            requestAnimationFrame(setLightFromSun);
            let dragging = false, offX = 0, offY = 0;
            function down(e) {
                dragging = true; sun.classList.add('dragging', 'moved');
                const p = e.touches ? e.touches[0] : e;
                const r = sun.getBoundingClientRect();
                offX = p.clientX - r.left; offY = p.clientY - r.top;
                sun.style.right = 'auto';
                e.preventDefault();
            }
            function move(e) {
                if (!dragging) return;
                const p = e.touches ? e.touches[0] : e;
                const hero = sun.parentElement.getBoundingClientRect();
                let x = p.clientX - offX - hero.left;
                let y = p.clientY - offY - hero.top;
                // keep it inside the hero
                x = Math.max(-10, Math.min(x, hero.width - sun.offsetWidth + 10));
                y = Math.max(150, Math.min(y, hero.height - sun.offsetHeight));
                sun.style.left = x + 'px';
                sun.style.top = y + 'px';
                setLightFromSun();
            }
            function up() { dragging = false; sun.classList.remove('dragging'); }
            sun.addEventListener('mousedown', down);
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
            sun.addEventListener('touchstart', down, { passive: false });
            window.addEventListener('touchmove', move, { passive: false });
            window.addEventListener('touchend', up);
            window.addEventListener('resize', setLightFromSun);
            window.addEventListener('scroll', setLightFromSun, { passive: true });
        })();

        // --- BAZAAR (pre-owned) ---
        // Email that offers and enquiries go to:
        const BAZAR_EMAIL = 'info@mareswear.com';
        // Catalog of pre-owned pieces — YOU ADD ITEMS HERE.
        // design: 'tee-1' = Venus, 'tee-2' = Eye, 'tee-3' = Heart (thumbnail).
        // sold: true = sold (shown struck through). origPrice is optional.
        const BAZAR_ITEMS = [
            { design: 'tee-1', model: 'Blind Statue Hoodie', size: 'L', condition: 'Like new', price: 55, origPrice: 85, note: 'Worn twice, no flaws.', sold: false },
            { design: 'tee-2', model: 'Duality Hoodie', size: 'S', condition: 'Very good', price: 45, origPrice: 75, note: 'A favourite, clearing my closet.', sold: false },
            { design: 'tee-3', model: 'Planetary Heart Hoodie', size: 'M', condition: 'Very good', price: 49, origPrice: 89, note: 'Print slightly faded, otherwise great.', sold: false },
            { design: 'tee-1', model: 'Blind Statue Hoodie', size: 'XL', condition: 'Good', price: 42, origPrice: 85, note: 'Worn for a season, still great.', sold: false },
            { design: 'tee-2', model: 'Duality Hoodie', size: 'M', condition: 'Like new', price: 52, origPrice: 75, note: 'Sold — thanks for giving pieces a second life!', sold: true }
        ];

        // Items added by the admin (stored in this browser)
        function getAdminItems() {
            try { return JSON.parse(localStorage.getItem('mares_bazar_admin') || '[]'); } catch (e) { return []; }
        }
        function saveAdminItems(arr) { localStorage.setItem('mares_bazar_admin', JSON.stringify(arr)); }
        function allBazaarItems() { return BAZAR_ITEMS.concat(getAdminItems()); }

        function renderBazaar() {
            const grid = document.getElementById('bazaarGrid');
            if (!grid) return;
            const items = allBazaarItems();
            if (!items.length) {
                grid.innerHTML = '<div class="bazaar-empty">Nothing here yet — be the first to offer a piece. 👇</div>';
                return;
            }
            const gmap = { 'tee-1': 'g1', 'tee-2': 'g2', 'tee-3': 'g3' };
            grid.innerHTML = items.map(function (it) {
                const svg = document.getElementById(it.design) ? document.getElementById(it.design).innerHTML : '';
                const badge = it.sold ? '<span class="bazaar-badge" style="border-color:#888;color:#aaa;">Sold</span>'
                                      : '<span class="bazaar-badge">' + it.condition + '</span>';
                const orig = it.origPrice ? '<s>' + money(it.origPrice) + '</s> ' : '';
                const action = it.sold
                    ? '<span class="price">Sold</span>'
                    : '<a class="bazaar-buy" href="mailto:' + BAZAR_EMAIL + '?subject=' + encodeURIComponent('Bazaar enquiry: ' + it.model + ' (' + it.size + ')') + '&body=' + encodeURIComponent('I am interested in a pre-owned piece: ' + it.model + ', size ' + it.size + ', price ' + money(it.price) + '.') + '">I\u2019m interested</a>';
                return '<div class="bazaar-card">'
                    + '<div class="bazaar-thumb ' + (gmap[it.design] || 'g1') + '">' + badge + svg + '</div>'
                    + '<div class="bazaar-info"><h3>' + it.model + '</h3>'
                    + '<div class="meta">Size ' + it.size + ' · ' + it.condition + '</div>'
                    + '<div class="note">' + (it.note || '') + '</div>'
                    + '<div class="brow"><div class="price">' + orig + money(it.price) + '</div>' + action + '</div>'
                    + '</div></div>';
            }).join('');
        }
        renderBazaar();

        // --- Bazaar admin (simple panel, data stored in this browser) ---
        // Change the password. Note: this is light protection on a static site, not real
        // security (the code is public). Use Shopify for full accounts later.
        const ADMIN_PASS = 'mares2026';

        function openAdmin() {
            const ov = document.getElementById('adminOverlay');
            ov.classList.add('active'); document.body.style.overflow = 'hidden';
            document.getElementById('adminGate').style.display = 'block';
            document.getElementById('adminPanel').style.display = 'none';
            document.getElementById('adminPass').value = '';
            setTimeout(function () { document.getElementById('adminPass').focus(); }, 50);
        }
        function closeAdmin() { document.getElementById('adminOverlay').classList.remove('active'); document.body.style.overflow = 'auto'; }
        function adminLogin(e) {
            if (e) e.preventDefault();
            if (document.getElementById('adminPass').value === ADMIN_PASS) {
                document.getElementById('adminGate').style.display = 'none';
                document.getElementById('adminPanel').style.display = 'block';
                renderAdminList();
            } else {
                document.getElementById('adminGate').classList.add('shake');
                setTimeout(function () { document.getElementById('adminGate').classList.remove('shake'); }, 500);
            }
            return false;
        }
        function adminAdd(e) {
            e.preventDefault();
            const item = {
                design: document.getElementById('aDesign').value,
                model: document.getElementById('aModel').value,
                size: document.getElementById('aSize').value,
                condition: document.getElementById('aCond').value,
                price: Number(document.getElementById('aPrice').value) || 0,
                origPrice: Number(document.getElementById('aOrig').value) || 0,
                note: document.getElementById('aNote').value,
                sold: false
            };
            const arr = getAdminItems(); arr.push(item); saveAdminItems(arr);
            document.getElementById('aPrice').value = ''; document.getElementById('aOrig').value = ''; document.getElementById('aNote').value = '';
            renderBazaar(); renderAdminList();
            return false;
        }
        function adminRemove(i) { const arr = getAdminItems(); arr.splice(i, 1); saveAdminItems(arr); renderBazaar(); renderAdminList(); }
        function adminToggleSold(i) { const arr = getAdminItems(); arr[i].sold = !arr[i].sold; saveAdminItems(arr); renderBazaar(); renderAdminList(); }
        function renderAdminList() {
            const arr = getAdminItems();
            const wrap = document.getElementById('adminList');
            if (!arr.length) { wrap.innerHTML = '<p class="muted-sm">You haven\u2019t added any pieces yet. (The examples above are hardcoded.)</p>'; return; }
            wrap.innerHTML = arr.map(function (it, i) {
                return '<div class="admin-row"><span>' + it.model + ' · ' + it.size + ' · ' + money(it.price) + (it.sold ? ' <b style="color:#888;">(sold)</b>' : '') + '</span>'
                    + '<span><button type="button" onclick="adminToggleSold(' + i + ')">' + (it.sold ? 'Restore' : 'Sold') + '</button>'
                    + '<button type="button" onclick="adminRemove(' + i + ')">Smazat</button></span></div>';
            }).join('');
        }
        function adminExport() {
            const data = JSON.stringify(allBazaarItems(), null, 2);
            const ta = document.getElementById('adminExport'); ta.style.display = 'block'; ta.value = data;
            if (navigator.clipboard) navigator.clipboard.writeText(data).catch(function () {});
        }

        function openSell() { document.getElementById('sellOverlay').classList.add('active'); document.body.style.overflow = 'hidden'; }
        function closeSell() { document.getElementById('sellOverlay').classList.remove('active'); document.body.style.overflow = 'auto'; }
        document.getElementById('sellOverlay').addEventListener('click', function (e) { if (e.target === this) closeSell(); });
        function submitSell(e) {
            e.preventDefault();
            const model = document.getElementById('sfModel').value;
            const size = document.getElementById('sfSize').value;
            const cond = document.getElementById('sfCond').value;
            const price = document.getElementById('sfPrice').value || '(not stated)';
            const email = document.getElementById('sfEmail').value;
            const note = document.getElementById('sfNote').value || '(no note)';
            const subject = 'Bazaar offer: ' + model + ' (' + size + ')';
            const body = 'I\u2019d like to sell my piece via the MARES bazaar:\n\n'
                + 'Model: ' + model + '\nSize: ' + size + '\nCondition: ' + cond + '\n'
                + 'My price: \u20ac' + price + '\nContact: ' + email + '\nNote: ' + note + '\n\n'
                + 'I am attaching the photo(s) to this email.';
            window.location.href = 'mailto:' + BAZAR_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
            closeSell();
            return false;
        }

        // --- Social links & hashtag ---
        const SOCIAL = {
            instagram: 'https://www.instagram.com/',  // fill in your @profile URL
            facebook: 'https://www.facebook.com/'     // fill in your page URL
        };
        document.getElementById('igLink').href = SOCIAL.instagram;
        document.getElementById('fbLink').href = SOCIAL.facebook;
        function copyHashtag() {
            const btn = document.getElementById('hashBtn');
            const done = () => { btn.textContent = 'Copied #openyoureyes \u2713'; setTimeout(() => { btn.innerHTML = '#openyoureyes \u29c9'; }, 1800); };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText('#openyoureyes').then(done, done);
            else done();
        }

        // --- Discount eye: winks and reveals a 10% code ---
        function openDiscount() {
            const ov = document.getElementById('discountOverlay');
            ov.classList.remove('show'); void ov.offsetWidth;
            ov.classList.add('show');
        }
        function closeDiscount() {
            document.getElementById('discountOverlay').classList.remove('show');
            document.getElementById('discCopied').classList.remove('on');
        }
        function copyDiscount() {
            const done = () => document.getElementById('discCopied').classList.add('on');
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText('OPENEYES10').then(done, done);
            else done();
        }
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('discountOverlay').addEventListener('click', function (e) { if (e.target === this) closeDiscount(); });
            var hl = document.getElementById('heroHoodieL'), hr = document.getElementById('heroHoodieR');
            var t3 = document.getElementById('tee-3'), t1 = document.getElementById('tee-1');
            if (hl && t3) hl.innerHTML = t3.innerHTML;
            if (hr && t1) hr.innerHTML = t1.innerHTML;
        });

        // --- Eye cursor: follows the mouse, blinks and cries on click ---
        (function () {
            if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;
            const cur = document.createElement('div');
            cur.className = 'eye-cursor';
            cur.innerHTML = '<svg viewBox="0 0 200 120"><g class="cur-eye">'
                + '<path d="M 20 60 Q 100 8 180 60 Q 100 112 20 60 Z" fill="#020202" stroke="#26c6da" stroke-width="7"/>'
                + '<circle cx="100" cy="60" r="26" fill="#26c6da"/>'
                + '<circle cx="100" cy="60" r="10.5" fill="#000"/>'
                + '<circle cx="107" cy="53" r="5" fill="#fff"/>'
                + '</g></svg>';
            document.body.appendChild(cur);
            document.addEventListener('mousemove', e => {
                cur.style.display = 'block';
                cur.style.left = e.clientX + 'px';
                cur.style.top = e.clientY + 'px';
            });
            document.addEventListener('mouseleave', () => { cur.style.display = 'none'; });
            document.addEventListener('mousedown', e => {
                cur.classList.remove('blink'); void cur.offsetWidth; cur.classList.add('blink');
                const t = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                t.setAttribute('viewBox', '0 0 24 32');
                t.setAttribute('class', 'cursor-tear');
                t.innerHTML = '<path d="M12 30 C 7.5 30 4 26.4 4 22 C 4 16.5 10 6.5 12 2 C 14 6.5 20 16.5 20 22 C 20 26.4 16.5 30 12 30 Z"/>';
                t.style.left = e.clientX + 'px';
                t.style.top = (e.clientY + 9) + 'px';
                document.body.appendChild(t);
                setTimeout(() => t.remove(), 1100);
            });
        })();

        // --- Products & Cart ---
        const PRODUCTS = {
            'tee-1': { name: 'Blind Statue Hoodie', price: 85 },
            'tee-2': { name: 'Duality Hoodie', price: 75 },
            'tee-3': { name: 'Planetary Heart Hoodie', price: 89 }
        };
        let currentProductKey = null;
        let cart = [];
        try { cart = JSON.parse(localStorage.getItem('mares_cart') || '[]'); } catch (e) { cart = []; }
        cart = cart.filter(i => PRODUCTS[i.key]);

        const fmt = money;
        function saveCart() { localStorage.setItem('mares_cart', JSON.stringify(cart)); }

        function selSize(el) {
            document.querySelectorAll('#sizeRow .size-pill').forEach(p => p.classList.remove('sel'));
            el.classList.add('sel');
        }

        function addItem(key, size) {
            const found = cart.find(i => i.key === key && i.size === size);
            if (found) found.qty += 1; else cart.push({ key: key, size: size, qty: 1 });
            saveCart(); renderCart();
        }

        function addToCartFromModal() {
            if (!currentProductKey) return;
            const size = document.querySelector('#sizeRow .size-pill.sel').innerText;
            const wasEmpty = cart.length === 0;
            addItem(currentProductKey, size);
            closeModal();
            if (wasEmpty) {
                playBlinkAnimation(() => { toggleCart(true); showToast(); });
            } else {
                toggleCart(true); showToast();
            }
        }

        // Buy Now: straight to the cart + checkout, no ceremony
        function buyNowFromModal() {
            if (!currentProductKey) return;
            const size = document.querySelector('#sizeRow .size-pill.sel').innerText;
            addItem(currentProductKey, size);
            closeModal(); toggleCart(true); checkout();
        }
        function quickBuy(key, ev) {
            if (ev) ev.stopPropagation();
            addItem(key, 'M');
            toggleCart(true); checkout();
        }

        // --- Add-to-cart eye blink animation (click to skip) ---
        let blinkTimers = [];
        function playBlinkAnimation(done) {
            const ov = document.getElementById('blinkOverlay');
            const finish = () => {
                blinkTimers.forEach(clearTimeout); blinkTimers = [];
                ov.classList.remove('show');
                ov.onclick = null;
                setTimeout(() => ov.classList.remove('phase-write', 'phase-tear'), 500);
                if (done) done();
            };
            ov.classList.add('show');
            ov.onclick = finish;
            blinkTimers.push(setTimeout(() => ov.classList.add('phase-write'), 1650));
            blinkTimers.push(setTimeout(() => ov.classList.add('phase-tear'), 3300));
            blinkTimers.push(setTimeout(finish, 5000));
        }

        function showToast() {
            const t = document.getElementById('toast');
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 1800);
        }

        function toggleCart(open) {
            document.getElementById('cartDrawer').classList.toggle('open', open);
            document.getElementById('cartOverlay').classList.toggle('show', open);
        }

        function changeQty(idx, d) {
            cart[idx].qty += d;
            if (cart[idx].qty <= 0) cart.splice(idx, 1);
            saveCart(); renderCart();
        }
        function removeItem(idx) { cart.splice(idx, 1); saveCart(); renderCart(); }

        function renderCart() {
            const wrap = document.getElementById('cartItems');
            document.getElementById('cartCount').innerText = cart.reduce((a, i) => a + i.qty, 0);
            if (!cart.length) {
                wrap.innerHTML = '<div class="cart-empty">Your cart is empty.<br>Open your eyes \u2014 and pick a hoodie.</div>';
            } else {
                wrap.innerHTML = cart.map((i, idx) => {
                    const p = PRODUCTS[i.key];
                    return '<div class="cart-item">'
                        + '<div class="cart-thumb">' + document.getElementById(i.key).innerHTML + '</div>'
                        + '<div><h4>' + p.name + '</h4>'
                        + '<div class="meta">Size ' + i.size + '</div>'
                        + '<div class="qty-row">'
                        + '<button class="qty-btn" onclick="changeQty(' + idx + ',-1)">\u2212</button>'
                        + '<span>' + i.qty + '</span>'
                        + '<button class="qty-btn" onclick="changeQty(' + idx + ',1)">+</button>'
                        + '</div></div>'
                        + '<div style="text-align:right;">'
                        + '<div class="line-price">' + fmt(p.price * i.qty) + '</div>'
                        + '<button class="remove-item" onclick="removeItem(' + idx + ')">remove</button>'
                        + '</div></div>';
                }).join('');
            }
            document.getElementById('cartTotal').innerText = fmt(cart.reduce((a, i) => a + PRODUCTS[i.key].price * i.qty, 0));
        }

        function checkout() {
            if (!cart.length) return;
            const note = document.getElementById('cartNote');
            note.innerHTML = 'Thank you! \ud83d\udc99 We appreciate your help \u2014 5% of your order goes to the planet. \ud83c\udf0d';
            note.style.display = 'block';
            const ready = SHOPIFY.domain && cart.every(i => variantFor(i.key, i.size));
            if (ready) {
                const items = cart.map(i => variantFor(i.key, i.size) + ':' + i.qty).join(',');
                setTimeout(() => {
                    toggleCart(false);
                    document.getElementById('checkoutTransition').classList.add('show');
                    setTimeout(() => { window.location.href = '/cart/' + items; }, 1600);
                }, 400);
            } else {
                note.innerHTML += '<br>Online checkout is being connected \u2014 ordering opens soon.';
            }
        }
        renderCart();

        // --- Modal Logic ---
        function openModal(title, desc, price, svgHtml, productKey) {
            currentProductKey = productKey;
            document.getElementById('modalTitle').innerText = title;
            document.getElementById('modalDesc').innerText = desc;
            document.getElementById('modalPrice').innerText = price;

            // Render the exact same SVG in the modal for a close-up
            document.getElementById('modalImage').innerHTML = svgHtml;
            document.getElementById('modalImage').querySelector('.svg-hoodie-base').style.width = '90%';

            document.getElementById('modalOverlay').classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        function closeModal() {
            document.getElementById('modalOverlay').classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        document.getElementById('modalOverlay').addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    