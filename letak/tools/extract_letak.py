#!/usr/bin/env python3
"""Extract product tiles (name, price, old price, discount, unit info, badges)
from the Lidl weekly leaflet PDF."""
import json
import os
import re
import sys

import pdfplumber
from pdfplumber.utils.text import extract_words as chars_to_words

PDF = os.environ.get('LETAK_PDF', 'letak.pdf')  # cesta k PDF letáku

PRICE_FONT_PREFIX = 'LidlFontPrice'
NAME_FONTS = ('LidlFontCondPro-Bold',)
DESC_FONTS = ('LidlFontCondPro-Book', 'LidlFontCondPro-Semibold', 'LidlFontCondPro-Regular')
OLD_FONTS = ('LidlFontPro-Book',)
BOLD_FONT = 'LidlFontPro-Bold'

PRICE_RE = re.compile(r'^(\d{1,4})[.,](\d{2})')
DASH_PRICE_RE = re.compile(r'^(\d{1,5})[.,]-$')
PCT_RE = re.compile(r'^-\s?(\d{1,2})\s?%$')
KC_OFF_RE = re.compile(r'^-\s?(\d{1,4})$')
UNIT_RE = re.compile(r'(\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|ks|m|cm)\s*=\s*\d+(?:[.,]\d+)?\s*Kč)', re.I)
SUP = str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹', '0123456789')
PCT_GLYPHS = str.maketrans('\ufe6a\uff05\ufe63\uff0d\u2010\u2011\u2012\u2013\u2014', '%%-------')


def font(w):
    return w['fontname'].split('+')[-1]


def page_words(page):
    """Words rebuilt from chars: rounding the size keeps letters like 'č' from
    being split into separate words by sub-point font-size jitter."""
    # Content outside the page box is pasteboard material — other regional
    # variants of the same page that never get printed or rendered.
    w, h = page.width, page.height
    chars = [dict(c, size=round(c['size'], 1), fontname=c['fontname'].split('+')[-1])
             for c in page.chars
             if -2 <= c['x0'] and c['x1'] <= w + 2 and -2 <= c['top'] and c['bottom'] <= h + 2]
    for c in chars:
        if c['text'] == '\ufffd':
            c['text'] = ' '
        c['text'] = c['text'].translate(PCT_GLYPHS)
    if not chars:
        return []
    return chars_to_words(chars, extra_attrs=['size', 'fontname'])


def norm_price(txt):
    t = txt.translate(SUP).replace('*', '').replace(' ', '').strip()
    m = PRICE_RE.match(t)
    if m:
        return float(f'{m.group(1)}.{m.group(2)}')
    m = DASH_PRICE_RE.match(t)
    if m:
        return float(m.group(1))
    return None


def dedupe_words(words):
    """Some pages stack two identical text layers (regional mutations)."""
    seen, out = set(), []
    for w in words:
        key = (w['text'], round(w['x0'] / 2), round(w['top'] / 2))
        if key in seen:
            continue
        seen.add(key)
        out.append(w)
    return out


def group_lines(words, ytol=4.0, gap_factor=0.55, min_gap=5.0):
    """Group words into lines, splitting a row where a wide gap separates two tiles."""
    rows = []
    for w in sorted(words, key=lambda w: (w['top'], w['x0'])):
        for r in rows:
            if abs(r['top'] - w['top']) <= ytol:
                r['words'].append(w)
                r['top'] = min(r['top'], w['top'])
                break
        else:
            rows.append({'top': w['top'], 'words': [w]})

    segs = []
    for r in rows:
        ws = sorted(r['words'], key=lambda w: w['x0'])
        seg = [ws[0]]
        for prev, cur in zip(ws, ws[1:]):
            limit = max(min_gap, gap_factor * max(prev['size'], cur['size']))
            if cur['x0'] - prev['x1'] > limit:
                segs.append(seg)
                seg = [cur]
            else:
                seg.append(cur)
        segs.append(seg)

    out = []
    for seg in segs:
        out.append({
            'text': ' '.join(w['text'] for w in seg),
            'x0': min(w['x0'] for w in seg), 'x1': max(w['x1'] for w in seg),
            'top': min(w['top'] for w in seg), 'bottom': max(w['bottom'] for w in seg),
            'size': max(w['size'] for w in seg), 'font': font(seg[0]),
        })
    return sorted(out, key=lambda l: (l['top'], l['x0']))


def cluster_lines(lines, vgap=11.0, hover=0.3):
    """Merge vertically adjacent, horizontally overlapping lines into blocks."""
    blocks = []
    for ln in lines:
        for b in blocks:
            width = min(b['x1'] - b['x0'], ln['x1'] - ln['x0']) or 1
            overlap = min(b['x1'], ln['x1']) - max(b['x0'], ln['x0'])
            if (ln['top'] - b['bottom'] <= vgap and ln['top'] >= b['top'] - 2
                    and overlap > hover * width):
                b['lines'].append(ln)
                b['x0'], b['x1'] = min(b['x0'], ln['x0']), max(b['x1'], ln['x1'])
                b['bottom'] = max(b['bottom'], ln['bottom'])
                break
        else:
            blocks.append({'lines': [ln], 'x0': ln['x0'], 'x1': ln['x1'],
                           'top': ln['top'], 'bottom': ln['bottom']})
    return blocks


def hgap(a, b):
    return max(0, max(a['x0'], b['x0']) - min(a['x1'], b['x1']))


def vgap(a, b):
    return max(0, max(a['top'], b['top']) - min(a['bottom'], b['bottom']))


def near(a, b, max_h=30, max_v=70):
    """Is b in the same tile column as a and vertically close?"""
    return hgap(a, b) <= max_h and vgap(a, b) <= max_v


def match_score(price, name):
    """Lower is better. A tile puts its name above the price; on poster pages the
    name can sit beside it. A name *below* a price belongs to the next tile."""
    dx, dy = hgap(price, name), vgap(price, name)
    name_mid = (name['top'] + name['bottom']) / 2
    price_mid = (price['top'] + price['bottom']) / 2
    if name_mid <= price_mid:                       # name above the price
        return dy + 1.5 * dx
    if dx > 4 and dy <= 20:                         # beside it, in another column
        return 60 + 1.2 * dx + dy
    return 600 + dy + dx                            # below: last resort


def extract(path=None):
    pdf = pdfplumber.open(path or PDF)
    products, pages_meta = [], []
    pid = 0

    for pno, page in enumerate(pdf.pages, start=1):
        words = dedupe_words(page_words(page))
        W, H = page.width, page.height

        price_w, name_w, desc_w, old_w = [], [], [], []
        pct_w, kc_w, super_w, plus_w, limit_w = [], [], [], [], []
        bold_lines_src = []
        for w in words:
            f, sz, t = font(w), w['size'], w['text']
            if w['top'] > H - 60 and sz < 12:       # footer legalese
                continue
            if f.startswith(PRICE_FONT_PREFIX) and sz > 30:
                price_w.append(w)
            elif f in NAME_FONTS and sz >= 11:
                name_w.append(w)
            elif f in DESC_FONTS and 8.5 <= sz <= 13:
                desc_w.append(w)
            elif f in OLD_FONTS and 10 <= sz <= 22 and norm_price(t):
                old_w.append(w)
            elif f == BOLD_FONT and sz >= 15:
                if PCT_RE.match(t.replace(' ', '')):
                    pct_w.append(w)
                elif KC_OFF_RE.match(t):
                    kc_w.append(w)
                else:
                    bold_lines_src.append(w)
            elif f == BOLD_FONT and sz >= 9:
                bold_lines_src.append(w)
            if t in ('Plus', 'PLUS') and sz <= 12:
                plus_w.append(w)

        saving_w, deal_w = [], []
        for b in cluster_lines(group_lines(bold_lines_src, ytol=4.0), vgap=8.0, hover=0.2):
            b['text'] = ' '.join(l['text'] for l in sorted(b['lines'], key=lambda l: l['top']))
            low = b['text'].lower()
            if 'super cena' in low or 'cenový trumf' in low:
                super_w.append(b)
            elif low.startswith('max.'):
                limit_w.append(b)
            elif re.search(r'\d\s*\+\s*\d|zdarma', low):
                deal_w.append(b)
            elif 'ušetřete' in low:
                m = re.search(r'(\d{1,2})\s*%', b['text'])
                if m:
                    b['pct'] = int(m.group(1))
                    saving_w.append(b)

        name_blocks = cluster_lines(group_lines(name_w + desc_w, ytol=4.0))
        price_lines = group_lines(price_w, ytol=10.0, gap_factor=0.35, min_gap=10.0)
        price_lines = [p for p in price_lines if norm_price(p['text'].replace(' ', ''))]

        pairs = sorted(((match_score(p, n), pi, ni)
                        for pi, p in enumerate(price_lines)
                        for ni, n in enumerate(name_blocks)), key=lambda t: t[0])
        assign, taken = {}, set()
        for score, pi, ni in pairs:
            if pi in assign or ni in taken or score > 190:
                continue
            assign[pi], _ = ni, taken.add(ni)

        items = []
        for pi, pl in enumerate(price_lines):
            price = norm_price(pl['text'].replace(' ', ''))
            block = name_blocks[assign[pi]] if pi in assign else None
            names, descs = [], []
            if block:
                for ln in sorted(block['lines'], key=lambda l: (l['top'], l['x0'])):
                    (names if ln['font'] in NAME_FONTS else descs).append(ln['text'])

            olds = [norm_price(w['text']) for w in old_w if near(pl, w, 40, 60)]
            olds = [o for o in olds if o and o > price]
            old = max(olds) if olds else None

            pcts = [int(PCT_RE.match(w['text'].replace(' ', '')).group(1))
                    for w in pct_w if near(pl, w, 30, 70)]
            kcs = [int(KC_OFF_RE.match(w['text']).group(1)) for w in kc_w if near(pl, w, 30, 70)]

            desc = ' '.join(descs).strip()
            um = UNIT_RE.search(desc)
            items.append({
                'id': pid, 'page': pno,
                'name': ' '.join(names).strip(), 'desc': desc,
                'price': price, 'oldPrice': old,
                'discount': max(pcts) if pcts else None,
                'discountKc': max(kcs) if kcs else None,
                'unitPrice': um.group(1) if um else None,
                'lidlPlus': any(near(pl, w, 40, 70) for w in plus_w),
                'superPrice': any(near(pl, s, 40, 70) for s in super_w),
                'saving': next((s['pct'] for s in saving_w if near(pl, s, 40, 80)), None),
                'deal': next((s['text'] for s in deal_w
                              if near(pl, s, 40, 80) and s['bottom'] <= pl['bottom'] + 5), None),
                'limit': next((s['text'] for s in limit_w if near(pl, s, 60, 90)), None),
                'box': [round(pl['x0'] / W, 4), round(pl['top'] / H, 4),
                        round(pl['x1'] / W, 4), round(pl['bottom'] / H, 4)],
                'nameBox': ([round(block['x0'] / W, 4), round(block['top'] / H, 4),
                             round(block['x1'] / W, 4), round(block['bottom'] / H, 4)]
                            if block else None),
            })
            pid += 1

        for ni, b in enumerate(name_blocks):       # products shown without a big price
            if ni in taken:
                continue
            names = [l['text'] for l in b['lines'] if l['font'] in NAME_FONTS]
            descs = [l['text'] for l in b['lines'] if l['font'] not in NAME_FONTS]
            if not names:
                continue
            desc = ' '.join(descs).strip()
            um = UNIT_RE.search(desc)
            items.append({
                'id': pid, 'page': pno, 'name': ' '.join(names).strip(), 'desc': desc,
                'price': None, 'oldPrice': None, 'discount': None, 'discountKc': None,
                'unitPrice': um.group(1) if um else None,
                'lidlPlus': False, 'superPrice': False, 'saving': None, 'deal': None,
                'limit': None, 'box': None,
                'nameBox': [round(b['x0'] / W, 4), round(b['top'] / H, 4),
                            round(b['x1'] / W, 4), round(b['bottom'] / H, 4)],
            })
            pid += 1

        products.extend(items)
        pages_meta.append({'page': pno, 'w': round(W, 1), 'h': round(H, 1), 'items': len(items)})

    return products, pages_meta


if __name__ == '__main__':
    prods, pages = extract()
    json.dump({'products': prods, 'pages': pages},
              open(sys.argv[1] if len(sys.argv) > 1 else 'products.json', 'w'),
              ensure_ascii=False, indent=1)
    print(f"pages={len(pages)} items={len(prods)} "
          f"named={sum(1 for p in prods if p['name'])} "
          f"priced={sum(1 for p in prods if p['price'])} "
          f"both={sum(1 for p in prods if p['price'] and p['name'])}")
