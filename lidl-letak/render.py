#!/usr/bin/env python3
"""Vygeneruje samostatnou HTML stránku s letákem."""
import json, base64, os

P = json.load(open('products.json'))

CATS = [
    ('maso',      'Maso, uzeniny a ryby', 350, 45),
    ('ovoce',     'Ovoce a zelenina',     105, 40),
    ('chlazene',  'Chlazené',             195, 45),
    ('mrazene',   'Mražené',              225, 45),
    ('pecivo',    'Pečivo',                35, 50),
    ('suche',     'Suché a trvanlivé',     28, 32),
    ('napoje',    'Nápoje a alkohol',     168, 40),
    ('drogerie',  'Drogerie a mazlíčci',  285, 35),
    ('obleceni',  'Oblečení a obuv',       12, 45),
    ('zahrada',   'Zahrada a dílna',       85, 40),
    ('sport',     'Sport a volný čas',    255, 45),
    ('deti',      'Dětský svět',          320, 40),
    ('domacnost', 'Domácnost a elektro',  215, 12),
]


def b64(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(open(path, 'rb').read()).decode()


font_faces = []
for file, family, weight in [
    ('fonts/Archivo-lat.woff2', 'Archivo', '400 800'),
    ('fonts/Archivo-ext.woff2', 'Archivo', '400 800'),
    ('fonts/IBMPlexMono-lat.woff2', 'PlexMono', '500'),
    ('fonts/IBMPlexMono-ext.woff2', 'PlexMono', '500'),
]:
    font_faces.append(
        "@font-face{font-family:'%s';font-style:normal;font-weight:%s;font-display:swap;"
        "src:url(%s) format('woff2')}" % (family, weight, b64(file, 'font/woff2')))

# data pro stránku
data = []
for r in P:
    data.append(dict(n=r['name'], d=r['detail'], p=r['price'], o=r['old'] or '',
                     b=r['badge'] or '', c=r['cat'], s=r['page'] + 1, v=r['valid'],
                     i=b64(r['img'], 'image/webp')))

cat_css = '\n'.join(
    '.c-%s{--h:%d;--s:%d%%}' % (cid, h, s) for cid, _, h, s in CATS)

CSS = """
:root{
  --ground:#FAF8F3; --surface:#FFFFFF; --tile:#F2EFE8;
  --ink:#141C2B; --muted:#6A7488; --line:#E4DFD4;
  --brand:#0B4EA2; --price:#CE1126; --flag:#FFCC00; --flag-ink:#241B00;
  --cat-l:38%; --cat-bg-l:94%; --header-bg:#0B4EA2; --header-ink:#FFFFFF;
  --shadow:0 1px 2px rgba(20,28,43,.06),0 8px 24px -18px rgba(20,28,43,.4);
}
@media (prefers-color-scheme:dark){
  :root{
    --ground:#0E1420; --surface:#161E2D; --tile:#1E2739;
    --ink:#ECF0F7; --muted:#95A1B7; --line:#27314673;
    --brand:#7FB0F5; --price:#FF7A7A; --flag:#FFD84D; --flag-ink:#241B00;
    --cat-l:70%; --cat-bg-l:18%; --header-bg:#122E52; --header-ink:#EAF1FC;
    --shadow:0 1px 2px rgba(0,0,0,.3),0 10px 28px -20px #000;
  }
}
:root[data-theme="dark"]{
  --ground:#0E1420; --surface:#161E2D; --tile:#1E2739;
  --ink:#ECF0F7; --muted:#95A1B7; --line:#27314673;
  --brand:#7FB0F5; --price:#FF7A7A; --flag:#FFD84D; --flag-ink:#241B00;
  --cat-l:70%; --cat-bg-l:18%; --header-bg:#122E52; --header-ink:#EAF1FC;
    --shadow:0 1px 2px rgba(0,0,0,.3),0 10px 28px -20px #000;
}
:root[data-theme="light"]{
  --ground:#FAF8F3; --surface:#FFFFFF; --tile:#F2EFE8;
  --ink:#141C2B; --muted:#6A7488; --line:#E4DFD4;
  --brand:#0B4EA2; --price:#CE1126; --flag:#FFCC00; --flag-ink:#241B00;
  --cat-l:38%; --cat-bg-l:94%; --header-bg:#0B4EA2; --header-ink:#FFFFFF;
  --shadow:0 1px 2px rgba(20,28,43,.06),0 8px 24px -18px rgba(20,28,43,.4);
}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);
  font-family:'Archivo',system-ui,-apple-system,'Segoe UI',sans-serif;
  font-size:15px;line-height:1.45;-webkit-text-size-adjust:100%}
.mono{font-family:'PlexMono',ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:500}
.wrap{max-width:1240px;margin:0 auto;padding:0 clamp(12px,3vw,28px)}

/* ---- hlavička ---- */
header{background:var(--header-bg);color:var(--header-ink);padding:22px 0 18px}
header .wrap{display:flex;flex-wrap:wrap;gap:14px 26px;align-items:flex-end;justify-content:space-between}
h1{margin:0;font-size:clamp(24px,4.4vw,38px);font-weight:800;letter-spacing:-.022em;line-height:1.02;
  text-wrap:balance}
h1 span{display:block;font-size:.44em;font-weight:600;letter-spacing:.14em;text-transform:uppercase;
  opacity:.72;margin-bottom:.5em}
.dates{font-size:13px;letter-spacing:.04em;opacity:.9;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.dates b{background:var(--flag);color:var(--flag-ink);padding:3px 9px;border-radius:3px;font-weight:700;
  letter-spacing:.02em}

/* ---- ovládání ---- */
.controls{position:sticky;top:0;z-index:20;background:var(--ground);
  border-bottom:1px solid var(--line);padding:10px 0 0;
  box-shadow:0 6px 18px -18px rgba(0,0,0,.6)}
.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-bottom:10px}
input[type=search]{flex:1 1 220px;min-width:180px;font:inherit;color:inherit;background:var(--surface);
  border:1px solid var(--line);border-radius:7px;padding:8px 12px}
input[type=search]::placeholder{color:var(--muted)}
select{font:inherit;color:inherit;background:var(--surface);border:1px solid var(--line);
  border-radius:7px;padding:8px 10px}
.tgl{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:var(--muted);white-space:nowrap;
  cursor:pointer;user-select:none}
.count{font-size:12px;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.rail{display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;scrollbar-width:thin}
.chip{flex:0 0 auto;font:inherit;font-size:13px;font-weight:600;color:var(--ink);cursor:pointer;
  background:var(--surface);border:1px solid var(--line);border-radius:99px;padding:5px 13px;
  display:inline-flex;align-items:center;gap:7px;transition:background .12s,border-color .12s}
.chip .dot{width:8px;height:8px;border-radius:50%;background:hsl(var(--h) var(--s) var(--cat-l))}
.chip .n{font-size:11px;color:var(--muted);font-family:'PlexMono',monospace}
.chip:hover{border-color:hsl(var(--h) var(--s) var(--cat-l))}
.chip[aria-pressed=true]{background:hsl(var(--h) var(--s) var(--cat-bg-l));
  border-color:hsl(var(--h) var(--s) var(--cat-l));color:hsl(var(--h) var(--s) var(--cat-l))}
.chip[aria-pressed=true] .n{color:inherit;opacity:.75}
.chip.all{--h:215;--s:0%}
:focus-visible{outline:2px solid var(--brand);outline-offset:2px;border-radius:4px}

/* ---- sekce ---- */
main{padding:22px 0 60px}
section{margin-bottom:34px;scroll-margin-top:118px}
.sec-head{display:flex;align-items:baseline;gap:12px;padding:0 0 10px;
  border-bottom:2px solid hsl(var(--h) var(--s) var(--cat-l));margin-bottom:16px}
.sec-head h2{margin:0;font-size:clamp(17px,2.4vw,22px);font-weight:800;letter-spacing:-.015em;
  color:hsl(var(--h) var(--s) var(--cat-l))}
.sec-head .n{font-size:12px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase}

.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}
article{background:var(--surface);border:1px solid var(--line);border-radius:9px;overflow:hidden;
  display:flex;flex-direction:column;box-shadow:var(--shadow);position:relative}
article.done{opacity:.44}
.thumb{background:var(--tile);border-bottom:1px solid var(--line);aspect-ratio:5/4;
  display:flex;align-items:center;justify-content:center;overflow:hidden}
.thumb img{max-width:100%;max-height:100%;display:block}
.body{padding:10px 11px 11px;display:flex;flex-direction:column;gap:5px;flex:1}
.name{font-weight:700;font-size:14px;line-height:1.25;letter-spacing:-.008em}
.det{font-size:12px;color:var(--muted);line-height:1.35}
.pricerow{display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap;margin-top:auto;padding-top:6px}
.price{font-size:25px;font-weight:800;color:var(--price);letter-spacing:-.03em;line-height:1;
  font-variant-numeric:tabular-nums}
.price .kc{font-size:.5em;font-weight:700;letter-spacing:.02em;margin-left:2px;vertical-align:.35em}
.old{font-size:13px;color:var(--muted);text-decoration:line-through;font-variant-numeric:tabular-nums;
  padding-bottom:2px}
.badge{align-self:flex-start;font-size:11.5px;font-weight:700;padding:3px 7px;border-radius:4px;
  background:var(--flag);color:var(--flag-ink);letter-spacing:.01em}
.badge.plain{background:hsl(var(--h) var(--s) var(--cat-bg-l));color:hsl(var(--h) var(--s) var(--cat-l))}
.meta{display:flex;justify-content:space-between;gap:8px;align-items:center;
  border-top:1px solid var(--line);padding:6px 11px;font-size:11px;color:var(--muted);
  font-family:'PlexMono',monospace}
.meta .warn{color:hsl(38 85% 38%);font-weight:500}
@media (prefers-color-scheme:dark){.meta .warn{color:#F0BE4A}}
:root[data-theme="dark"] .meta .warn{color:#F0BE4A}
.check{appearance:none;width:15px;height:15px;border:1.5px solid var(--line);border-radius:4px;
  background:var(--surface);cursor:pointer;flex:0 0 auto;position:relative}
.check:checked{background:var(--brand);border-color:var(--brand)}
.check:checked::after{content:"";position:absolute;left:4px;top:1px;width:4px;height:8px;
  border:solid #fff;border-width:0 2px 2px 0;transform:rotate(42deg)}
.empty{color:var(--muted);padding:40px 0;text-align:center}
footer{border-top:1px solid var(--line);padding:18px 0 40px;color:var(--muted);font-size:12.5px}
footer p{margin:.35em 0;max-width:66ch}
@media (max-width:560px){
  .grid{grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:9px}
  .name{font-size:13px}.det{font-size:11px}.price{font-size:21px}
  .meta{font-size:10px;padding:5px 8px;gap:5px}
  .body{padding:9px 9px 10px}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
@media print{
  .controls,footer .noprint{display:none}
  body{background:#fff;font-size:10pt}
  article{break-inside:avoid;box-shadow:none}
  .grid{grid-template-columns:repeat(4,1fr)}
  header{background:#fff;color:#000;border-bottom:2px solid #000}
}
"""

JS = """
const DATA = __DATA__, CATS = __CATS__;
const grid = document.getElementById('sections');
const q = document.getElementById('q'), sort = document.getElementById('sort');
const hide = document.getElementById('hide'), tally = document.getElementById('tally');
let active = 'all';
let done = {};
try { done = JSON.parse(localStorage.getItem('lidl3107done') || '{}'); } catch (e) {}

const key = p => p.n + '|' + p.p;
const num = p => parseFloat(String(p.p).replace('.-', '').replace(',', '.'));

function esc(s){ return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function card(p){
  const el = document.createElement('article');
  el.className = 'c-' + p.c + (done[key(p)] ? ' done' : '');
  const money = String(p.p).endsWith('.-')
    ? String(p.p).replace('.-','') + '<span class="kc">,–</span>'
    : String(p.p).replace('.', '<span class="kc">,') + '</span>';
  el.innerHTML =
    '<div class="thumb"><img loading="lazy" alt="" src="' + p.i + '"></div>' +
    '<div class="body">' +
      '<div class="name">' + esc(p.n) + '</div>' +
      (p.d ? '<div class="det">' + esc(p.d) + '</div>' : '') +
      (p.b ? '<div class="badge' + (/Super|Cenov|Ušetř/.test(p.b) ? ' plain' : '') + '">' + esc(p.b) + '</div>' : '') +
      '<div class="pricerow"><div class="price">' + money + '</div>' +
        (p.o ? '<div class="old">' + esc(String(p.o).replace('.-',',–').replace('.', ',')) + '</div>' : '') +
      '</div>' +
    '</div>' +
    '<div class="meta"><span>str. ' + p.s + '</span>' +
      '<span class="' + (p.v.indexOf('30. 7.') === 0 ? '' : 'warn') + '">' + esc(p.v) + '</span>' +
      '<input class="check" type="checkbox" title="Hotovo – naskladněno" ' +
        (done[key(p)] ? 'checked' : '') + '></div>';
  el.querySelector('.check').addEventListener('change', e => {
    if (e.target.checked) done[key(p)] = 1; else delete done[key(p)];
    localStorage.setItem('lidl3107done', JSON.stringify(done));
    el.classList.toggle('done', e.target.checked);
    if (hide.checked) render();
    updateTally();
  });
  return el;
}

function updateTally(){
  const n = Object.keys(done).length;
  tally.textContent = n ? n + ' / ' + DATA.length + ' hotovo' : DATA.length + ' položek';
}

function render(){
  const term = q.value.trim().toLowerCase();
  grid.textContent = '';
  let shown = 0;
  CATS.forEach(c => {
    let list = DATA.filter(p => p.c === c.id
      && (active === 'all' || active === c.id)
      && (!term || (p.n + ' ' + p.d).toLowerCase().includes(term))
      && (!hide.checked || !done[key(p)]));
    if (sort.value === 'price') list = list.slice().sort((a, b) => num(a) - num(b));
    if (sort.value === 'priced') list = list.slice().sort((a, b) => num(b) - num(a));
    if (!list.length) return;
    shown += list.length;
    const sec = document.createElement('section');
    sec.className = 'c-' + c.id; sec.id = 'sec-' + c.id;
    sec.innerHTML = '<div class="sec-head"><h2>' + c.label + '</h2>' +
      '<span class="n">' + list.length + ' položek</span></div><div class="grid"></div>';
    const g = sec.querySelector('.grid');
    list.forEach(p => g.appendChild(card(p)));
    grid.appendChild(sec);
  });
  if (!shown) grid.innerHTML = '<p class="empty">Nic nenalezeno – zkuste jiné slovo.</p>';
}

document.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
  active = ch.dataset.cat;
  document.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === ch));
  render();
  if (active !== 'all') {
    const t = document.getElementById('sec-' + active);
    if (t) window.scrollTo({ top: t.offsetTop - 110, behavior: 'smooth' });
  }
}));
q.addEventListener('input', render);
sort.addEventListener('change', render);
hide.addEventListener('change', render);
updateTally();
render();
"""

counts = {}
for r in P:
    counts[r['cat']] = counts.get(r['cat'], 0) + 1

chips = ['<button class="chip all" data-cat="all" aria-pressed="true">Vše '
         '<span class="n">%d</span></button>' % len(P)]
for cid, label, h, s in CATS:
    chips.append('<button class="chip c-%s" data-cat="%s" aria-pressed="false">'
                 '<span class="dot"></span>%s <span class="n">%d</span></button>'
                 % (cid, cid, label, counts.get(cid, 0)))

html = """<title>Akční leták Lidl · 30. 7. – 2. 8. 2026</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
__FONTS__
__CSS__
__CATCSS__
</style>

<header>
  <div class="wrap">
    <h1><span>Leták podle kategorií · region CZ 31/2026</span>Akční leták Lidl</h1>
    <div class="dates"><b>čtvrtek 30. 7. – neděle 2. 8. 2026</b>
      <span>část nabídky má jiný start – hlídej datum na kartě</span></div>
  </div>
</header>

<div class="controls">
  <div class="wrap">
    <div class="bar">
      <input type="search" id="q" placeholder="Hledat produkt nebo značku…" aria-label="Hledat produkt">
      <select id="sort" aria-label="Řazení">
        <option value="page">Řadit podle letáku</option>
        <option value="price">Od nejlevnějšího</option>
        <option value="priced">Od nejdražšího</option>
      </select>
      <label class="tgl"><input type="checkbox" id="hide" class="check"> Skrýt hotové</label>
      <span class="count mono" id="tally"></span>
    </div>
    <div class="rail" role="group" aria-label="Kategorie">
      __CHIPS__
    </div>
  </div>
</div>

<main class="wrap" id="sections"></main>

<footer>
  <div class="wrap">
    <p><strong>Jak to číst:</strong> velká červená je akční cena, přeškrtnutá je cena před slevou.
      Žlutá cedulka je procentní sleva nebo sleva v korunách, světlá cedulka označuje
      Super cenu, Cenový trumf nebo úsporu na měrné ceně. Číslo strany odkazuje do papírového letáku.</p>
    <p class="noprint">Zaškrtávátko u každé položky si pamatuje prohlížeč – hodí se při stavění akce,
      ať víš, co už je naskladněné. Volbou „Skrýt hotové“ si necháš jen zbytek.</p>
    <p>Sestaveno z PDF letáku Lidl, region CZ 31/2026. Ceny jsou bez dekorace, nabídka platí do
      vyprodání zásob. Chyby v tisku i v přepisu vyhrazeny – rozhoduje cena na regálovce.</p>
  </div>
</footer>

<script>
__JS__
</script>
"""

cat_meta = json.dumps([dict(id=c[0], label=c[1]) for c in CATS], ensure_ascii=False)
js = JS.replace('__DATA__', json.dumps(data, ensure_ascii=False)).replace('__CATS__', cat_meta)
html = (html.replace('__FONTS__', '\n'.join(font_faces))
            .replace('__CSS__', CSS)
            .replace('__CATCSS__', cat_css)
            .replace('__CHIPS__', '\n      '.join(chips))
            .replace('__JS__', js))

open('letak.html', 'w').write(html)
print('letak.html', round(os.path.getsize('letak.html') / 1e6, 2), 'MB')
