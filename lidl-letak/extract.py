#!/usr/bin/env python3
"""Rozřeže Lidl leták na jednotlivé produktové dlaždice + vytáhne text."""
import fitz, re, json, io, sys
from PIL import Image

PDF = '/root/.claude/uploads/4fe782ac-129e-54b7-ab51-ca86305193f0/587d2eec-AkcniletakODCTVRTKA30728202600_compressed.pdf'
DPI = 150
SCALE = DPI / 72.0

FOOTER_PAT = re.compile(
    r'Nabídka zboží platí|Více na www|REGION CZ|REGION CER|vyhrazuje právo změn|'
    r'úspora na měrné ceně|Chyby v tisku|ZÁKAZNICKÁ LINKA|Napište nám|'
    r'Srovnávací nákup|Ceny se mohou v čase|Pro zachování maximální|'
    r'Spin Master Ltd|cena platná na lidl\.cz|standardní cena bez Lidl Plus|'
    r'běžná prodejní cena|Za kvalitu ručíme|odběrných boxů|Od čtvrtka|Od pondělí|Od pátku',
    re.I)

PRICE = re.compile(r'(?<![\d,])(\d{1,5})[.,](\d{2}|-)(?![\d])')
PRICE_DASH = re.compile(r'(?<![\d.,])(\d{2,5})\.-')


SUP = str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹', '0123456789')
UNIT_KC = re.compile(r'[\d ., ]+\s*Kč(/PP)?')
FOLLOWED_BY_UNIT = re.compile(r'^\s*(l|kg|g|ml|cm|mm|%|ks|°|x)\b')


def clean(t):
    t = t.replace('\xa0', ' ').translate(SUP)
    return re.sub(r'[ \t]+', ' ', t).strip()


def price_tokens(text):
    """Ceny z textu – bez měrných cen (ty mají 'Kč') a bez rozměrů."""
    t = UNIT_KC.sub(' ', text)
    out = []
    for m in re.finditer(r'(?<![\d,.])(\d{1,5})[.,](\d{2}|-)(?![\d])', t):
        if FOLLOWED_BY_UNIT.match(t[m.end():]):
            continue
        val = f"{m.group(1)}.{m.group(2)}"
        if m.group(2) != '-' and float(val) < 3:
            continue
        out.append(val)
    for m in re.finditer(r'(?<![\d,.])(\d{3,5})\.-', t):
        out.append(m.group(1) + '.-')
    return out


def page_groups(page):
    """Seskupí textové bloky do produktových buněk."""
    blocks = []
    for b in page.get_text('blocks'):
        x0, y0, x1, y1, txt = b[0], b[1], b[2], b[3], clean(b[4])
        if not txt:
            continue
        if FOOTER_PAT.search(txt):
            continue
        if y0 > 955 or y1 < 12:
            continue
        if len(txt) < 2:
            continue
        blocks.append(dict(x0=x0, y0=y0, x1=x1, y1=y1, t=txt))

    # sloupce jen podle "kotevních" bloků (dost dlouhý popis produktu)
    for b in blocks:
        b['anchor'] = len(b['t']) >= 18
    xs = sorted(b['x0'] for b in blocks if b['anchor'])
    if not xs:
        return [], []
    cols = []
    for x in xs:
        if cols and x - cols[-1][-1] < 40:
            cols[-1].append(x)
        else:
            cols.append([x])
    centers = [min(c) for c in cols]

    def colidx(x):
        return min(range(len(centers)), key=lambda i: abs(centers[i] - x))

    # každý kotevní blok = jeden produkt; blízké kotvy se spojí
    groups = []
    for ci in range(len(centers)):
        col = [b for b in blocks if colidx(b['x0']) == ci]
        anchors = sorted([b for b in col if b['anchor']], key=lambda b: b['y0'])
        cur = []
        for b in anchors:
            if cur and b['y0'] - max(x['y1'] for x in cur) > 20:
                groups.append(dict(col=ci, blocks=cur)); cur = []
            cur.append(b)
        if cur:
            groups.append(dict(col=ci, blocks=cur))
        # doplňkové bloky (slevové cedulky) k nejbližší kotvě
        mine = [g for g in groups if g['col'] == ci]
        for b in col:
            if b['anchor'] or not mine:
                continue
            g = min(mine, key=lambda g: min(abs(b['y0'] - x['y0']) for x in g['blocks']))
            gy = min(x['y0'] for x in g['blocks']), max(x['y1'] for x in g['blocks'])
            if gy[0] - 60 <= b['y0'] <= gy[1] + 60:
                g['blocks'].append(b)
    for g in groups:
        bs = g['blocks']
        g['x0'] = min(b['x0'] for b in bs); g['x1'] = max(b['x1'] for b in bs)
        g['y0'] = min(b['y0'] for b in bs); g['y1'] = max(b['y1'] for b in bs)
        g['text'] = ' | '.join(b['t'] for b in sorted(bs, key=lambda b: (b['y0'], b['x0'])))
    groups.sort(key=lambda g: (g['col'], g['y0']))
    return groups, centers


def cells(page, groups, centers):
    """Spočítá výřez (buňku) pro každou skupinu."""
    """Buňka = prostor kolem textu produktu až k sousedním produktům."""
    W, H = page.rect.width, page.rect.height

    def voverlap(a, b):
        return min(a['y1'], b['y1']) - max(a['y0'], b['y0'])

    def hoverlap(a, b):
        return min(a['x1'], b['x1']) - max(a['x0'], b['x0'])

    for g in groups:
        others = [o for o in groups if o is not g]
        above = [o['y1'] for o in others if o['y1'] <= g['y0'] + 6 and hoverlap(g, o) > 20]
        below = [o['y0'] for o in others if o['y0'] >= g['y1'] - 6 and hoverlap(g, o) > 20]
        top = (max(above) + 5) if above else 10
        bot = (min(below) - 3) if below else H - 20
        top = min(max(top, g['y0'] - 330), g['y0'] - 5)
        bot = max(min(bot, g['y1'] + 70), g['y1'] + 6)

        band = dict(x0=g['x0'], x1=g['x1'], y0=top, y1=bot)
        left = [o['x1'] for o in others if o['x1'] <= g['x0'] + 6 and voverlap(band, o) > 20]
        right = [o['x0'] for o in others if o['x0'] >= g['x1'] - 6 and voverlap(band, o) > 20]
        L = (max(left) + 6) if left else 0
        R = (min(right) - 4) if right else W
        L = min(max(L, g['x0'] - 135), g['x0'] - 4)
        R = max(min(R, g['x1'] + 135), g['x1'] + 4)
        g['cell'] = (max(0, L), max(0, top), min(W, R), min(H, bot))
    return groups


def parse(text):
    """Rozparsuje název / popis / cenu / slevu."""
    parts = [p.strip() for p in text.split('|') if p.strip()]
    price = None
    old = None
    disc = None
    keep = []
    for p in parts:
        pl = p.lower()
        m_pct = re.search(r'-\s?(\d{1,2})\s?[%﹪]', p)
        m_kc = re.search(r'-\s?(\d{1,4})\s?Kč', p)
        if 'super cena' in pl or 'super' == pl:
            disc = disc or 'Super cena'
            continue
        if 'cenový trumf' in pl or 'cenový' == pl or 'trumf' == pl:
            disc = disc or 'Cenový trumf'
            continue
        if 'ušetřete' in pl:
            disc = disc or 'Ušetřete'
            continue
        if m_pct or m_kc:
            nums = price_tokens(p)
            if nums:
                old = nums[-1]
            disc = ('-' + m_pct.group(1) + '%') if m_pct else ('-' + m_kc.group(1) + ' Kč')
            continue
        keep.append(p)
    # cena = poslední cenový token mimo slevovou cedulku
    cand = price_tokens(' '.join(keep))
    if cand:
        price = cand[-1]
    elif old:
        price, old = old, None
    return keep, price, old, disc


def main():
    doc = fitz.open(PDF)
    pages = [int(x) for x in sys.argv[1].split(',')] if len(sys.argv) > 1 else range(len(doc))
    items = []
    for pno in pages:
        page = doc[pno]
        groups, centers = page_groups(page)
        if not groups:
            continue
        gs = cells(page, groups, centers)
        pix = page.get_pixmap(dpi=DPI)
        img = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
        for gi, g in enumerate(gs):
            L, T, R, B = g['cell']
            if (R - L) < 60 or (B - T) < 60:
                continue
            box = tuple(int(v * SCALE) for v in (L, T, R, B))
            crop = img.crop(box)
            crop.thumbnail((300, 330), Image.LANCZOS)
            fn = f'tiles/p{pno:02d}_{gi:02d}.webp'
            crop.save(fn, 'WEBP', quality=64, method=6)
            keep, price, old, disc = parse(g['text'])
            items.append(dict(page=pno, idx=gi, img=fn, raw=g['text'],
                              lines=keep, price=price, old=old, disc=disc,
                              rect=[round(v) for v in g['cell']]))
        print(f'page {pno}: {len(gs)} buněk', file=sys.stderr)
    json.dump(items, open('items.json', 'w'), ensure_ascii=False, indent=1)
    print(f'celkem {len(items)} položek', file=sys.stderr)


if __name__ == '__main__':
    main()
