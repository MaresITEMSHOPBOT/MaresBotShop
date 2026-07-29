/* Digitální leták – vyhledávání v akční nabídce.
   Data (produkty, ceny, čísla stran, souřadnice na stránce) jsou v data.js. */
(function () {
  'use strict';

  var DATA = window.LETAK;
  var PRODUCTS = DATA.products;
  var PAGES = DATA.pages;
  var LS_KEY = 'letak.seznam.v1';

  var $ = function (sel) { return document.querySelector(sel); };
  var el = function (tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  };

  /* ---------- pomocné ---------- */

  function fold(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function czk(v) {
    return (v % 1 === 0 ? String(v) : v.toFixed(2).replace('.', ','));
  }

  function pageFile(n, thumb) {
    var s = n < 10 ? '0' + n : '' + n;
    return (thumb ? 'thumbs/' : 'pages/') + s + '.webp';
  }

  function maxPriceOf(list) {
    return list.reduce(function (m, p) { return p.price > m ? p.price : m; }, 0);
  }

  /* ---------- stav ---------- */

  var state = {
    view: 'search',
    q: '',
    cat: '',
    sort: 'page',
    onlySale: false,
    onlyPlus: false,
    maxPrice: Infinity,
    modalPage: null,
    modalProduct: null
  };

  var cart = load();

  function load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }

  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(cart)); } catch (e) { /* soukromý režim */ }
  }

  /* ---------- vyhledávání ---------- */

  function search(query) {
    var terms = fold(query).split(/\s+/).filter(Boolean);
    var out = [];
    for (var i = 0; i < PRODUCTS.length; i++) {
      var p = PRODUCTS[i];
      if (state.cat && p.category !== state.cat) continue;
      if (state.onlySale && !p.oldPrice && !p.discount && !p.saving && !p.deal) continue;
      if (state.onlyPlus && !p.lidlPlus) continue;
      if (p.price != null && p.price > state.maxPrice) continue;

      var score = 0, ok = true;
      for (var t = 0; t < terms.length; t++) {
        var hit = termMatch(p.q, terms[t]);
        if (!hit) { ok = false; break; }
        // shoda na začátku názvu / slova váží víc než shoda uprostřed slova
        var idx = hit.idx;
        score += (idx === 0 ? 3 : /\s/.test(p.q.charAt(idx - 1)) ? 2 : 1) - hit.cut;
      }
      if (!ok) continue;
      p._score = score;
      out.push(p);
    }
    return out;
  }

  /* Čeština skloňuje – „jogurty“, „másla“, „kuřecím“. Když se celé slovo
     nenajde, zkusíme ho postupně zkrátit o koncovku (max o 3 znaky). */
  function termMatch(q, term) {
    for (var cut = 0; cut <= 3; cut++) {
      if (term.length - cut < 3) break;
      var idx = q.indexOf(term.slice(0, term.length - cut));
      if (idx >= 0) return { idx: idx, cut: cut };
    }
    return null;
  }

  var SORTS = {
    page: function (a, b) { return a.pages[0] - b.pages[0] || (b.price || 0) - (a.price || 0); },
    cheap: function (a, b) { return (a.price == null) - (b.price == null) || a.price - b.price; },
    expensive: function (a, b) { return (a.price == null) - (b.price == null) || b.price - a.price; },
    discount: function (a, b) { return (b.discount || b.saving || 0) - (a.discount || a.saving || 0); },
    save: function (a, b) { return (b.saveKc || 0) - (a.saveKc || 0); },
    name: function (a, b) { return a.name.localeCompare(b.name, 'cs'); }
  };

  function sortList(list) {
    if (state.q) {
      list.sort(function (a, b) { return b._score - a._score || SORTS[state.sort](a, b); });
    } else {
      list.sort(SORTS[state.sort]);
    }
    return list;
  }

  /* ---------- vykreslení karty ---------- */

  function highlight(text, terms) {
    if (!terms.length) return document.createTextNode(text);
    var frag = document.createDocumentFragment();
    var ftext = fold(text), lower = 0, hits = [];
    terms.forEach(function (t) {
      var from = 0, i;
      while ((i = ftext.indexOf(t, from)) >= 0) { hits.push([i, i + t.length]); from = i + t.length; }
    });
    hits.sort(function (a, b) { return a[0] - b[0]; });
    hits.forEach(function (h) {
      if (h[0] < lower) return;
      frag.appendChild(document.createTextNode(text.slice(lower, h[0])));
      frag.appendChild(el('mark', null, text.slice(h[0], h[1])));
      lower = h[1];
    });
    frag.appendChild(document.createTextNode(text.slice(lower)));
    return frag;
  }

  function priceBlock(p, big) {
    var wrap = el('div', 'priceline');
    if (p.price == null) {
      wrap.appendChild(el('div', 'price none', 'cena v letáku'));
      return wrap;
    }
    var price = el('div', big ? 'detail-price' : 'price');
    price.appendChild(document.createTextNode(czk(p.price)));
    var cur = el('span', 'cur', ' Kč');
    price.appendChild(cur);
    wrap.appendChild(price);
    if (p.oldPrice) wrap.appendChild(el('span', 'old', czk(p.oldPrice) + ' Kč'));
    if (p.saveKc) wrap.appendChild(el('span', 'save', '−' + czk(p.saveKc) + ' Kč'));
    return wrap;
  }

  function badges(p) {
    var b = el('div', 'badges');
    if (p.discount) b.appendChild(el('span', 'badge sale', '−' + p.discount + ' %'));
    if (p.discountKc) b.appendChild(el('span', 'badge sale', '−' + p.discountKc + ' Kč'));
    if (p.saving && !p.discount) b.appendChild(el('span', 'badge sale', 'ušetříš ' + p.saving + ' %'));
    if (p.superPrice) b.appendChild(el('span', 'badge super', 'Super cena'));
    if (p.lidlPlus) b.appendChild(el('span', 'badge plus', 'Lidl Plus'));
    if (p.deal) b.appendChild(el('span', 'badge deal', p.deal));
    return b;
  }

  function card(p, terms) {
    var c = el('div', 'card');
    c.appendChild(el('div', 'cat', p.category + ' · strana ' + p.pages.join(', ')));
    if (p.brand) {
      var br = el('div', 'brand-name');
      br.appendChild(highlight(p.brand, terms));
      c.appendChild(br);
    }
    var nm = el('div', 'pname');
    nm.appendChild(highlight(p.short || p.name, terms));
    c.appendChild(nm);
    if (p.desc) {
      var d = el('div', 'desc');
      d.appendChild(highlight(p.desc, terms));
      c.appendChild(d);
    }
    if (p.unitPrice && p.desc.indexOf(p.unitPrice) < 0) c.appendChild(el('div', 'desc', p.unitPrice));
    if (p.limit) c.appendChild(el('div', 'desc', p.limit));
    c.appendChild(badges(p));
    c.appendChild(priceBlock(p, false));

    var actions = el('div', 'card-actions');
    var showBtn = el('button', 'btn', 'V letáku →');
    showBtn.onclick = function () { openModal(p.pages[0], p); };
    var addBtn = el('button', 'btn primary');
    paintAdd(addBtn, p);
    addBtn.onclick = function () { toggleCart(p); paintAdd(addBtn, p); };
    actions.appendChild(showBtn);
    actions.appendChild(addBtn);
    c.appendChild(actions);
    return c;
  }

  function paintAdd(btn, p) {
    var inList = !!cart[p.id];
    btn.textContent = inList ? '✓ v seznamu' : '+ do seznamu';
    btn.className = 'btn ' + (inList ? 'in-list' : 'primary');
  }

  function toggleCart(p) {
    if (cart[p.id]) delete cart[p.id]; else cart[p.id] = 1;
    save();
    renderCount();
    if (state.view === 'list') renderList();
  }

  /* ---------- pohled: vyhledávání ---------- */

  function renderSearch() {
    var terms = fold(state.q).split(/\s+/).filter(Boolean);
    var list = sortList(search(state.q));
    var grid = $('#grid');
    grid.textContent = '';

    var frag = document.createDocumentFragment();
    list.forEach(function (p) { frag.appendChild(card(p, terms)); });
    grid.appendChild(frag);

    $('#count').textContent = list.length === 0 ? 'Žádný výsledek'
      : list.length + ' ' + plural(list.length, 'produkt', 'produkty', 'produktů');

    var withPrice = list.filter(function (p) { return p.price != null; });
    var stats = '';
    if (withPrice.length) {
      var min = Math.min.apply(null, withPrice.map(function (p) { return p.price; }));
      var max = Math.max.apply(null, withPrice.map(function (p) { return p.price; }));
      var saved = list.reduce(function (s, p) { return s + (p.saveKc || 0); }, 0);
      stats = '· ceny ' + czk(min) + '–' + czk(max) + ' Kč';
      if (saved > 0) stats += ' · celková sleva ' + czk(saved) + ' Kč';
    }
    $('#stats').textContent = stats;
    $('#empty').hidden = list.length > 0;
  }

  function plural(n, one, few, many) {
    return n === 1 ? one : n < 5 ? few : many;
  }

  function renderCats() {
    var counts = {};
    PRODUCTS.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });
    var cats = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    var box = $('#cats');
    box.textContent = '';

    function chip(label, value, n) {
      var b = el('button', 'chip' + (state.cat === value ? ' is-active' : ''));
      b.appendChild(document.createTextNode(label));
      b.appendChild(el('small', null, n));
      b.onclick = function () { state.cat = value; renderCats(); renderSearch(); };
      box.appendChild(b);
    }

    chip('Vše', '', PRODUCTS.length);
    cats.forEach(function (c) { chip(c, c, counts[c]); });
  }

  /* ---------- pohled: listování ---------- */

  function renderPages() {
    var box = $('#pages');
    if (box.childElementCount) return;
    var counts = {};
    PRODUCTS.forEach(function (p) {
      p.pages.forEach(function (n) { counts[n] = (counts[n] || 0) + 1; });
    });
    var frag = document.createDocumentFragment();
    PAGES.forEach(function (pg) {
      var c = el('div', 'pagecard');
      var img = el('img');
      img.src = pageFile(pg.n, true);
      img.loading = 'lazy';
      img.alt = 'Strana ' + pg.n;
      c.appendChild(img);
      c.appendChild(el('div', 'lbl', 'Strana ' + pg.n + (counts[pg.n] ? ' · ' + counts[pg.n] + ' akcí' : '')));
      c.onclick = function () { openModal(pg.n, null); };
      frag.appendChild(c);
    });
    box.appendChild(frag);
    $('#browse-info').textContent = DATA.meta.pageCount + ' stran letáku · klikni na stranu pro zvětšení';
  }

  /* ---------- pohled: nákupní seznam ---------- */

  function renderList() {
    var wrap = $('#list-wrap');
    wrap.textContent = '';
    var ids = Object.keys(cart);
    if (!ids.length) {
      wrap.appendChild(el('p', 'empty', 'Seznam je prázdný. Přidej produkty tlačítkem „+ do seznamu“.'));
      return;
    }

    var items = ids.map(function (id) { return PRODUCTS[+id]; })
      .filter(Boolean)
      .sort(function (a, b) { return a.category.localeCompare(b.category, 'cs') || a.name.localeCompare(b.name, 'cs'); });

    var total = 0, unknown = 0;
    items.forEach(function (p) {
      var qty = cart[p.id] || 1;
      if (p.price == null) unknown++; else total += p.price * qty;

      var row = el('div', 'listrow');
      var grow = el('div', 'grow');
      grow.appendChild(el('div', 'nm', p.name));
      grow.appendChild(el('div', 'sub', p.category + ' · strana ' + p.pages.join(', ') +
        (p.desc ? ' · ' + p.desc : '')));
      row.appendChild(grow);

      var qtyBox = el('div', 'qty');
      var minus = el('button', null, '−');
      var num = el('span', null, qty);
      var plus = el('button', null, '+');
      minus.onclick = function () {
        cart[p.id] = Math.max(1, (cart[p.id] || 1) - 1); save(); renderList();
      };
      plus.onclick = function () { cart[p.id] = (cart[p.id] || 1) + 1; save(); renderList(); };
      qtyBox.appendChild(minus); qtyBox.appendChild(num); qtyBox.appendChild(plus);
      row.appendChild(qtyBox);

      var price = el('div', null, p.price == null ? '–' : czk(p.price * qty) + ' Kč');
      price.style.fontWeight = '700';
      price.style.minWidth = '90px';
      price.style.textAlign = 'right';
      row.appendChild(price);

      var del = el('button', 'icon-btn', '🗑');
      del.title = 'Odebrat';
      del.onclick = function () { delete cart[p.id]; save(); renderCount(); renderList(); renderSearch(); };
      row.appendChild(del);
      wrap.appendChild(row);
    });

    var t = el('div', 'total');
    t.appendChild(el('span', null, 'Celkem' + (unknown ? ' (bez ' + unknown + ' pol. bez ceny)' : '')));
    t.appendChild(el('span', 'sum', czk(total) + ' Kč'));
    wrap.appendChild(t);

    var clear = el('button', 'btn', 'Vyprázdnit seznam');
    clear.style.maxWidth = '220px';
    clear.onclick = function () {
      cart = {}; save(); renderCount(); renderList(); renderSearch();
    };
    wrap.appendChild(clear);
  }

  function renderCount() {
    $('#list-count').textContent = Object.keys(cart).length;
  }

  /* ---------- modal se stránkou letáku ---------- */

  function openModal(pageNo, product) {
    state.modalPage = pageNo;
    state.modalProduct = product;
    $('#modal').hidden = false;
    document.body.style.overflow = 'hidden';
    paintModal();
  }

  function closeModal() {
    $('#modal').hidden = true;
    document.body.style.overflow = '';
  }

  function stepPage(delta) {
    var n = state.modalPage + delta;
    if (n < 1 || n > PAGES.length) return;
    state.modalPage = n;
    state.modalProduct = null;
    paintModal();
  }

  function paintModal() {
    var n = state.modalPage;
    var p = state.modalProduct;
    var img = $('#m-img');
    if (img.getAttribute('data-page') !== String(n)) {
      img.src = pageFile(n, false);
      img.setAttribute('data-page', String(n));
    }
    $('#m-page').textContent = n + ' / ' + PAGES.length;
    $('#m-title').textContent = p ? p.name : 'Strana ' + n;
    $('#m-prev').disabled = n === 1;
    $('#m-next').disabled = n === PAGES.length;

    var mark = $('#m-mark');
    if (p && p.box) {
      var b = p.box, pad = 0.012;
      mark.hidden = false;
      mark.style.left = Math.max(0, b[0] - pad) * 100 + '%';
      mark.style.top = Math.max(0, b[1] - pad) * 100 + '%';
      mark.style.width = Math.min(1, b[2] - b[0] + 2 * pad) * 100 + '%';
      mark.style.height = Math.min(1, b[3] - b[1] + 2 * pad) * 100 + '%';
    } else {
      mark.hidden = true;
    }

    /* detail vybraného produktu */
    var det = $('#m-detail');
    det.textContent = '';
    if (p) {
      det.appendChild(el('div', 'cat', p.category));
      det.appendChild(el('div', 'detail-name', p.name));
      if (p.desc) det.appendChild(el('div', 'detail-row', p.desc));
      det.appendChild(badges(p));
      det.appendChild(priceBlock(p, true));
      if (p.oldPrice) {
        det.appendChild(row('Původní cena', czk(p.oldPrice) + ' Kč'));
        det.appendChild(row('Ušetříš', czk(p.saveKc) + ' Kč' + (p.discount ? ' (−' + p.discount + ' %)' : '')));
      }
      if (p.unitPrice) det.appendChild(row('Měrná cena', p.unitPrice));
      if (p.limit) det.appendChild(row('Omezení', p.limit));
      if (p.deal) det.appendChild(row('Akce', p.deal));
      if (p.lidlPlus) det.appendChild(row('Podmínka', 'cena platí s aplikací Lidl Plus'));
      det.appendChild(row('V letáku', 'strana ' + p.pages.join(', ')));

      var add = el('button', 'btn primary');
      add.style.marginTop = '10px';
      paintAdd(add, p);
      add.onclick = function () { toggleCart(p); paintAdd(add, p); };
      det.appendChild(add);
    } else {
      det.appendChild(el('div', 'detail-name', 'Strana ' + n));
      det.appendChild(el('div', 'detail-row', 'Vyber produkt v seznamu níže – zvýrazní se v letáku.'));
    }

    /* ostatní produkty na téže straně */
    var others = $('#m-others');
    others.textContent = '';
    var onPage = PRODUCTS.filter(function (x) { return x.pages.indexOf(n) >= 0; });
    if (!onPage.length) {
      others.appendChild(el('div', 'detail-row', 'Na této straně nejsou žádné produkty s cenou (reklamní strana).'));
    }
    onPage.forEach(function (x) {
      var b = el('button', 'side-item' + (p && x.id === p.id ? ' is-current' : ''));
      b.appendChild(el('span', null, x.name));
      b.appendChild(el('span', 'p', x.price == null ? '–' : czk(x.price) + ' Kč'));
      b.onclick = function () { state.modalProduct = x; paintModal(); };
      others.appendChild(b);
    });
  }

  function row(label, value) {
    var d = el('div', 'detail-row');
    d.appendChild(document.createTextNode(label + ': '));
    d.appendChild(el('b', null, value));
    return d;
  }

  /* ---------- přepínání pohledů ---------- */

  function setView(v) {
    state.view = v;
    ['search', 'browse', 'list'].forEach(function (name) {
      $('#view-' + name).hidden = name !== v;
    });
    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('is-active', t.dataset.view === v);
    });
    $('#searchbar').hidden = v !== 'search';
    if (v === 'browse') renderPages();
    if (v === 'list') renderList();
  }

  /* ---------- start ---------- */

  function init() {
    $('#meta-title').textContent = DATA.meta.title;
    $('#meta-sub').textContent = DATA.meta.subtitle + ' · ' + DATA.meta.productCount +
      ' akcí na ' + DATA.meta.pageCount + ' stranách';
    $('#meta-note').textContent = DATA.meta.note;
    document.title = DATA.meta.title + ' – vyhledávání';

    var top = Math.ceil(maxPriceOf(PRODUCTS));
    var slider = $('#max-price');
    slider.max = top;
    slider.value = top;
    state.maxPrice = Infinity;
    $('#max-price-label').textContent = 'bez limitu';
    slider.oninput = function () {
      var v = +slider.value;
      state.maxPrice = v >= top ? Infinity : v;
      $('#max-price-label').textContent = v >= top ? 'bez limitu' : czk(v) + ' Kč';
      renderSearch();
    };

    var input = $('#q');
    var timer;
    input.oninput = function () {
      $('#q-clear').hidden = !input.value;
      clearTimeout(timer);
      timer = setTimeout(function () { state.q = input.value.trim(); renderSearch(); }, 80);
    };
    $('#q-clear').onclick = function () {
      input.value = ''; state.q = ''; $('#q-clear').hidden = true; renderSearch(); input.focus();
    };

    $('#sort').onchange = function () { state.sort = this.value; renderSearch(); };
    $('#only-sale').onchange = function () { state.onlySale = this.checked; renderSearch(); };
    $('#only-plus').onchange = function () { state.onlyPlus = this.checked; renderSearch(); };

    document.querySelectorAll('.tab').forEach(function (t) {
      t.onclick = function () { setView(t.dataset.view); };
    });

    $('#m-zoom').onclick = function () {
      var wrap = $('#pagewrap');
      wrap.classList.toggle('zoomed');
      $('#m-zoom').textContent = wrap.classList.contains('zoomed') ? '⊟' : '⊞';
    };
    $('#m-close').onclick = closeModal;
    $('#m-prev').onclick = function () { stepPage(-1); };
    $('#m-next').onclick = function () { stepPage(1); };
    $('#modal').onclick = function (e) {
      if (e.target === $('#modal') || e.target.classList.contains('modal-body')) closeModal();
    };

    document.addEventListener('keydown', function (e) {
      var modalOpen = !$('#modal').hidden;
      if (e.key === 'Escape') {
        if (modalOpen) closeModal();
        else if (input.value) { input.value = ''; state.q = ''; $('#q-clear').hidden = true; renderSearch(); }
        return;
      }
      if (modalOpen) {
        if (e.key === 'ArrowLeft') stepPage(-1);
        if (e.key === 'ArrowRight') stepPage(1);
        return;
      }
      if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    });

    renderCats();
    renderCount();
    renderSearch();
  }

  init();
})();
