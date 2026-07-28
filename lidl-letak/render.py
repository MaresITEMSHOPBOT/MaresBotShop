#!/usr/bin/env python3
"""Vygeneruje samostatnou HTML stránku s letákem."""
import json, base64, os

P = json.load(open('products.json'))

CATS = [
    ('maso',      'Maso a ryby',          350, 45),
    ('ovoce',     'Ovoce a zelenina',     105, 40),
    ('vejce',     'Vejce',                 46, 62),
    ('chlazene',  'Chlazené',             195, 45),
    ('mrazene',   'Mražené',              225, 45),
    ('pecivo',    'Pečivo',                18, 48),
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
                     b=r['badge'] or '', c=r['cat'], s=r['page'] + 1, v=r['valid'], t=r['typ'], r=r['rect'],
                     i=b64(r['img'], 'image/webp')))

# obrázky celých stran letáku pro detailní okno
import fitz, io
from PIL import Image
doc = fitz.open('/root/.claude/uploads/4fe782ac-129e-54b7-ab51-ca86305193f0/'
                '587d2eec-AkcniletakODCTVRTKA30728202600_compressed.pdf')
pages = {}
for pn in sorted({r['page'] for r in P}):
    pg = doc[pn]
    pix = pg.get_pixmap(dpi=110)
    im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    im.thumbnail((600, 3000), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=44, method=6)
    pages[pn] = dict(i='data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode(),
                     w=round(pg.rect.width), h=round(pg.rect.height))
print('stran do detailu:', len(pages),
      round(sum(len(v['i']) for v in pages.values()) / 1e6, 2), 'MB')

cat_css = '\n'.join(
    '.c-%s{--h:%d;--s:%d%%}' % (cid, h, s) for cid, _, h, s in CATS)

CSS = """
:root{
  --ground:#FAF8F3; --surface:#FFFFFF; --tile:#F2EFE8;
  --ink:#141C2B; --muted:#6A7488; --line:#E4DFD4;
  --brand:#0B4EA2; --price:#CE1126; --flag:#FFCC00; --flag-ink:#241B00;
  --cat-l:38%; --cat-bg-l:94%; --header-bg:#0B4EA2; --header-ink:#FFFFFF; --io:#9C5A16;
  --shadow:0 1px 2px rgba(20,28,43,.06),0 8px 24px -18px rgba(20,28,43,.4);
}
@media (prefers-color-scheme:dark){
  :root{
    --ground:#0E1420; --surface:#161E2D; --tile:#1E2739;
    --ink:#ECF0F7; --muted:#95A1B7; --line:#27314673;
    --brand:#7FB0F5; --price:#FF7A7A; --flag:#FFD84D; --flag-ink:#241B00;
    --cat-l:70%; --cat-bg-l:18%; --header-bg:#122E52; --header-ink:#EAF1FC; --io:#E0A45E;
    --shadow:0 1px 2px rgba(0,0,0,.3),0 10px 28px -20px #000;
  }
}
:root[data-theme="dark"]{
  --ground:#0E1420; --surface:#161E2D; --tile:#1E2739;
  --ink:#ECF0F7; --muted:#95A1B7; --line:#27314673;
  --brand:#7FB0F5; --price:#FF7A7A; --flag:#FFD84D; --flag-ink:#241B00;
  --cat-l:70%; --cat-bg-l:18%; --header-bg:#122E52; --header-ink:#EAF1FC; --io:#E0A45E;
    --shadow:0 1px 2px rgba(0,0,0,.3),0 10px 28px -20px #000;
}
:root[data-theme="light"]{
  --ground:#FAF8F3; --surface:#FFFFFF; --tile:#F2EFE8;
  --ink:#141C2B; --muted:#6A7488; --line:#E4DFD4;
  --brand:#0B4EA2; --price:#CE1126; --flag:#FFCC00; --flag-ink:#241B00;
  --cat-l:38%; --cat-bg-l:94%; --header-bg:#0B4EA2; --header-ink:#FFFFFF; --io:#9C5A16;
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
.chip[hidden]{display:none}
:focus-visible{outline:2px solid var(--brand);outline-offset:2px;border-radius:4px}

/* ---- sekce ---- */
main{padding:22px 0 60px}
.seg{display:inline-flex;gap:2px;background:var(--surface);border:1px solid var(--line);
  border-radius:8px;padding:2px;flex:0 0 auto}
.seg button{font:inherit;font-size:13px;font-weight:600;color:var(--muted);background:none;border:0;
  padding:5px 12px;border-radius:6px;cursor:pointer;white-space:nowrap}
.seg button[aria-pressed=true]{background:var(--brand);color:#fff}
.block{margin-bottom:40px}
.block-head{border-top:3px solid var(--brand);padding-top:11px;margin-bottom:20px;
  display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 14px}
.block.inout .block-head{border-top-color:var(--io)}
.block-head h2{margin:0;font-size:clamp(19px,3vw,26px);font-weight:800;letter-spacing:-.022em}
.block.inout .block-head h2{color:var(--io)}
.block.staly .block-head h2{color:var(--brand)}
.block-head .n{font-family:'PlexMono',monospace;font-size:12px;color:var(--muted);
  letter-spacing:.06em;text-transform:uppercase}
.block-head .note{flex:1 1 240px;font-size:13px;color:var(--muted);line-height:1.4;max-width:56ch}
.tag-io{position:absolute;top:7px;right:7px;background:var(--io);color:var(--surface);
  font-family:'PlexMono',monospace;font-size:9px;font-weight:500;letter-spacing:.1em;
  padding:3px 6px;border-radius:3px;z-index:1}
section{margin-bottom:34px;scroll-margin-top:118px}
.sec-head{display:flex;align-items:baseline;gap:12px;padding:0 0 10px;
  border-bottom:2px solid hsl(var(--h) var(--s) var(--cat-l));margin-bottom:16px}
.sec-head h3{margin:0;font-size:clamp(17px,2.4vw,22px);font-weight:800;letter-spacing:-.015em;
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
article{cursor:pointer;transition:border-color .12s,transform .12s}
article:hover{border-color:var(--brand)}
article:focus-visible{outline:2px solid var(--brand);outline-offset:2px}

/* ---- detail ---- */
.modal[hidden]{display:none}
.modal{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:clamp(8px,2vw,28px)}
.backdrop{position:absolute;inset:0;background:rgba(6,10,18,.72);backdrop-filter:blur(2px)}
.dialog{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:12px;
  width:min(1040px,100%);max-height:min(92vh,900px);overflow:hidden;display:grid;
  grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr);box-shadow:0 30px 80px -30px rgba(0,0,0,.7)}
.m-page{background:var(--tile);overflow:auto;max-height:min(92vh,900px);border-right:1px solid var(--line)}
.m-inner{position:relative;width:100%;cursor:zoom-in}
.m-inner.zoom{width:215%;cursor:zoom-out}
.m-inner img{width:100%;display:block}
.hl{position:absolute;outline:3px solid var(--flag);border-radius:3px;pointer-events:none;
  box-shadow:0 0 0 9999px rgba(8,12,20,.5)}
.m-info{padding:20px 22px 18px;overflow:auto;display:flex;flex-direction:column;gap:9px}
.m-eyebrow{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:11px;
  font-family:'PlexMono',monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.m-eyebrow .cat{color:hsl(var(--h) var(--s) var(--cat-l));font-weight:500}
.m-eyebrow .io{background:var(--io);color:var(--surface);padding:2px 6px;border-radius:3px}
.m-info h2{margin:0;font-size:clamp(19px,2.6vw,25px);font-weight:800;letter-spacing:-.02em;
  line-height:1.15;text-wrap:balance}
.m-det{margin:0;color:var(--muted);font-size:14px;line-height:1.45}
.m-price{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;margin-top:4px}
.m-price .price{font-size:44px}
.m-price .old{font-size:16px;padding-bottom:5px}
.m-meta{margin:6px 0 0;display:grid;grid-template-columns:auto 1fr;gap:5px 14px;font-size:13px;
  border-top:1px solid var(--line);padding-top:11px}
.m-meta dt{color:var(--muted)}
.m-meta dd{margin:0;font-family:'PlexMono',monospace;font-size:12.5px}
.m-done{display:inline-flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;
  border:1px solid var(--line);border-radius:8px;padding:9px 12px;margin-top:4px}
.m-nav{display:flex;gap:8px;margin-top:auto;padding-top:12px}
.m-nav button{flex:1;font:inherit;font-size:13px;font-weight:600;color:var(--ink);cursor:pointer;
  background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:9px 10px}
.m-nav button:hover:not(:disabled){border-color:var(--brand);color:var(--brand)}
.m-nav button:disabled{opacity:.4;cursor:default}
.m-hint{font-size:11.5px;color:var(--muted);font-family:'PlexMono',monospace}
.close{position:absolute;top:8px;right:10px;z-index:2;width:34px;height:34px;border-radius:50%;
  border:1px solid var(--line);background:var(--surface);color:var(--ink);font-size:20px;
  line-height:1;cursor:pointer}
.close:hover{border-color:var(--brand);color:var(--brand)}
@media (max-width:760px){
  .dialog{grid-template-columns:1fr;max-height:94vh;overflow:auto}
  .m-page{max-height:46vh;border-right:0;border-bottom:1px solid var(--line)}
  .m-price .price{font-size:36px}
}
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
const DATA = __DATA__, CATS = __CATS__, PAGES = __PAGES__;
const grid = document.getElementById('sections');
const q = document.getElementById('q'), sort = document.getElementById('sort');
const hide = document.getElementById('hide'), tally = document.getElementById('tally');
let active = 'all', typ = 'all';
const BLOCKS = [
  ['staly', 'Stálý sortiment', 'Běžná regálovka, kterou vedeme pořád – tenhle týden jen za akční cenu.'],
  ['inout', 'In &amp; Out', 'Zboží, které přijede na akční plochu a po vyprodání končí: nepotravinářské akce a řecký týden.']
];
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
    (p.t === 'inout' ? '<span class="tag-io">IN &amp; OUT</span>' : '') +
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
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.addEventListener('click', e => {
    if (e.target.closest('.check')) return;
    openDetail(p);
  });
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(p); }
  });
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

function pick(p){
  const term = q.value.trim().toLowerCase();
  return (active === 'all' || active === p.c)
    && (typ === 'all' || typ === p.t)
    && (!term || (p.n + ' ' + p.d).toLowerCase().includes(term))
    && (!hide.checked || !done[key(p)]);
}

function word(n){ return n === 1 ? 'položka' : (n < 5 ? 'položky' : 'položek'); }

let visible = [];

function render(){
  grid.textContent = '';
  visible = [];
  let shown = 0;
  BLOCKS.forEach(([bid, blabel, bnote]) => {
    if (typ !== 'all' && typ !== bid) return;
    const inBlock = DATA.filter(p => p.t === bid && pick(p));
    if (!inBlock.length) return;
    shown += inBlock.length;
    const block = document.createElement('div');
    block.className = 'block ' + bid;
    block.innerHTML = '<div class="block-head"><h2>' + blabel + '</h2>' +
      '<span class="n">' + inBlock.length + ' ' + word(inBlock.length) + '</span>' +
      '<span class="note">' + bnote + '</span></div>';
    CATS.forEach(c => {
      let list = inBlock.filter(p => p.c === c.id);
      if (sort.value === 'price') list = list.slice().sort((a, b) => num(a) - num(b));
      if (sort.value === 'priced') list = list.slice().sort((a, b) => num(b) - num(a));
      if (!list.length) return;
      const sec = document.createElement('section');
      sec.className = 'c-' + c.id; sec.id = 'sec-' + bid + '-' + c.id;
      sec.innerHTML = '<div class="sec-head"><h3>' + c.label + '</h3>' +
        '<span class="n">' + list.length + ' ' + word(list.length) + '</span></div><div class="grid"></div>';
      const g = sec.querySelector('.grid');
      list.forEach(p => { visible.push(p); g.appendChild(card(p)); });
      block.appendChild(sec);
    });
    grid.appendChild(block);
  });
  if (!shown) grid.innerHTML = '<p class="empty">Nic nenalezeno – zkuste jiné slovo nebo jiný filtr.</p>';
  counts();
}

function counts(){
  const base = DATA.filter(p => typ === 'all' || typ === p.t);
  document.querySelectorAll('.chip').forEach(ch => {
    const c = ch.dataset.cat;
    const n = c === 'all' ? base.length : base.filter(p => p.c === c).length;
    ch.querySelector('.n').textContent = n;
    ch.hidden = n === 0;
  });
}

/* ---- detail produktu ---- */
const modal = document.getElementById('modal');
const mInner = document.getElementById('m-inner');
let current = null, lastFocus = null;

function money(p){
  return String(p.p).endsWith('.-')
    ? String(p.p).replace('.-', '') + '<span class="kc">,–</span>'
    : String(p.p).replace('.', '<span class="kc">,') + '</span>';
}

function openDetail(p){
  current = p;
  lastFocus = document.activeElement;
  const pg = PAGES[p.s - 1];
  const cat = CATS.find(c => c.id === p.c);
  document.getElementById('m-img').src = pg.i;
  const hl = document.getElementById('m-hl');
  if (p.r) {
    hl.hidden = false;
    hl.style.left = (p.r[0] / pg.w * 100) + '%';
    hl.style.top = (p.r[1] / pg.h * 100) + '%';
    hl.style.width = ((p.r[2] - p.r[0]) / pg.w * 100) + '%';
    hl.style.height = ((p.r[3] - p.r[1]) / pg.h * 100) + '%';
  } else hl.hidden = true;
  mInner.classList.remove('zoom');
  const eb = document.getElementById('m-eyebrow');
  eb.className = 'm-eyebrow c-' + p.c;
  eb.innerHTML = '<span class="cat">' + cat.label + '</span>' +
    (p.t === 'inout' ? '<span class="io">IN &amp; OUT</span>' : '');
  document.getElementById('m-name').textContent = p.n;
  const det = document.getElementById('m-det');
  det.textContent = p.d; det.hidden = !p.d;
  const bd = document.getElementById('m-badge');
  bd.innerHTML = p.b
    ? '<span class="badge' + (/Super|Cenov|Ušetř/.test(p.b) ? ' plain' : '') + '">' + esc(p.b) + '</span>'
    : '';
  document.getElementById('m-price').innerHTML = money(p);
  const old = document.getElementById('m-old');
  old.textContent = p.o ? String(p.o).replace('.-', ',–').replace('.', ',') : '';
  document.getElementById('m-strana').textContent = p.s;
  document.getElementById('m-valid').textContent = p.v;
  document.getElementById('m-typ').textContent =
    p.t === 'inout' ? 'in & out – akční plocha' : 'stálý sortiment';
  const chk = document.getElementById('m-check');
  chk.checked = !!done[key(p)];
  const i = visible.indexOf(p);
  document.getElementById('m-prev').disabled = i <= 0;
  document.getElementById('m-next').disabled = i < 0 || i >= visible.length - 1;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  document.querySelector('.close').focus();
  const mp = document.querySelector('.m-page');
  requestAnimationFrame(() => {
    mp.scrollTop = p.r
      ? Math.max(0, (p.r[1] / pg.h) * mInner.offsetHeight - mp.clientHeight / 3)
      : 0;
  });
}

function closeDetail(){
  modal.hidden = true;
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}

function step(d){
  const i = visible.indexOf(current);
  if (i > -1 && visible[i + d]) openDetail(visible[i + d]);
}

modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeDetail(); });
mInner.addEventListener('click', () => mInner.classList.toggle('zoom'));
document.getElementById('m-prev').addEventListener('click', () => step(-1));
document.getElementById('m-next').addEventListener('click', () => step(1));
document.getElementById('m-check').addEventListener('change', e => {
  if (e.target.checked) done[key(current)] = 1; else delete done[key(current)];
  localStorage.setItem('lidl3107done', JSON.stringify(done));
  updateTally();
  const p = current;
  render();
  current = visible.find(x => key(x) === key(p)) || p;
});
document.addEventListener('keydown', e => {
  if (modal.hidden) return;
  if (e.key === 'Escape') closeDetail();
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});

document.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
  active = ch.dataset.cat;
  document.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === ch));
  render();
  if (active !== 'all') {
    const t = document.querySelector('[id^="sec-"][id$="-' + active + '"]');
    if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 118, behavior: 'smooth' });
  }
}));
document.querySelectorAll('.seg button').forEach(bt => bt.addEventListener('click', () => {
  typ = bt.dataset.typ;
  document.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-pressed', x === bt));
  render();
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
      <div class="seg" role="group" aria-label="Typ sortimentu">
        <button data-typ="all" aria-pressed="true">Vše</button>
        <button data-typ="staly" aria-pressed="false">Stálý sortiment</button>
        <button data-typ="inout" aria-pressed="false">In &amp; Out</button>
      </div>
      <label class="tgl"><input type="checkbox" id="hide" class="check"> Skrýt hotové</label>
      <span class="count mono" id="tally"></span>
    </div>
    <div class="rail" role="group" aria-label="Kategorie">
      __CHIPS__
    </div>
  </div>
</div>

<main class="wrap" id="sections"></main>

<div class="modal" id="modal" hidden>
  <div class="backdrop" data-close></div>
  <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="m-name">
    <button class="close" data-close aria-label="Zavřít detail">&times;</button>
    <div class="m-page"><div class="m-inner" id="m-inner"><img id="m-img" alt=""><div class="hl" id="m-hl"></div></div></div>
    <div class="m-info">
      <div class="m-eyebrow" id="m-eyebrow"></div>
      <h2 id="m-name"></h2>
      <p class="m-det" id="m-det"></p>
      <div id="m-badge"></div>
      <div class="m-price"><span class="price" id="m-price"></span><span class="old" id="m-old"></span></div>
      <dl class="m-meta">
        <dt>Strana letáku</dt><dd id="m-strana"></dd>
        <dt>Platí</dt><dd id="m-valid"></dd>
        <dt>Sortiment</dt><dd id="m-typ"></dd>
      </dl>
      <label class="m-done"><input type="checkbox" class="check" id="m-check"> Hotovo – naskladněno</label>
      <p class="m-hint">Klikni do stránky pro přiblížení. Šipkami ← → přeskočíš na sousední zboží, Esc zavírá.</p>
      <div class="m-nav">
        <button id="m-prev">← Předchozí</button>
        <button id="m-next">Další →</button>
      </div>
    </div>
  </div>
</div>

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
js = (JS.replace('__DATA__', json.dumps(data, ensure_ascii=False))
        .replace('__CATS__', cat_meta)
        .replace('__PAGES__', json.dumps([pages.get(i, dict(i='', w=591, h=1020))
                                          for i in range(max(pages) + 1)], ensure_ascii=False)))
html = (html.replace('__FONTS__', '\n'.join(font_faces))
            .replace('__CSS__', CSS)
            .replace('__CATCSS__', cat_css)
            .replace('__CHIPS__', '\n      '.join(chips))
            .replace('__JS__', js))

open('letak.html', 'w').write(html)
print('letak.html', round(os.path.getsize('letak.html') / 1e6, 2), 'MB')
