#!/usr/bin/env python3
"""Turn the raw PDF extraction into letak/data.js for the digital leaflet app."""
import json
import os
import re
import unicodedata
from datetime import date

import extract_letak as extract

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data.js')

META = {
    'title': 'Lidl – Akční leták',
    'subtitle': 'Od čtvrtka 30. 7. do 2. 8. 2026',
    'validFrom': '2026-07-30',
    'validTo': '2026-08-02',
    'region': 'CZ / CER – 31/2026',
    'note': 'Nabídka platí od 30. 7. do 2. 8. 2026 nebo do vyprodání zásob. '
            'Chyby v tisku vyhrazeny. Ceny jsou bez dekorace.',
}

# (category, regex over lowercase name+desc) — first match wins
RULES = [
    ('Zvířata', r'\b(pro psy|pro kočky|psí|pamlsky|krmiv|coshida|orlando|exkrement)'),
    ('Dílna a zahrada', r'\b(parkside|livarno|ultimate speed|silvercrest|grillmeister|powerfix|'
                        r'vrtací|bruska|brusce|sekačka|kladivo|silikon|nůžky na|spirála|'
                        r'kamera|lampa|nabíječka|sendvičovač|kávovar|matrace|gril\b|plynový gril|'
                        r'hortenzie|myrta|rudbekie|růže|květ)'),
    ('Sport a volný čas', r'\b(crivit|jízdní kol|na kolo|kolo\b|helma|paddleboard|koloběžka|'
                          r'elektrokolo|obuv|nožní pumpa|cyklistick)'),
    ('Děti a hračky', r'\b(lupilu|spinmaster|paw patrol|tlapková|hrač|puzzle|plyšov|figurka|'
                      r'železnice|dětsk|batoh|kuchyňka|panenk|kniha aktivit|hrací|stan na hraní|drak)'),
    ('Oblečení', r'\b(esmara|triko|kraťasy|mikina|tepláky|pyžamo|ponožky|obuv|povlečení)'),
    ('Drogerie a domácnost', r'\b(šampon|mýdlo|zubní|dentalux|cien|prací|aviváž|toaletní papír|'
                             r'kapesník|utěrky|pleťov|sprchový|floralys|passion gold|azurit|'
                             r'podložka do vany)'),
    ('Alkohol', r'\b(pivo|ležák|víno|sekt|vodka|rum\b|destilát|metaxa|aperitiv|myslivecká|'
                r'frizzante|heineken|braník|svijany|radegast|argus|primitivo|božkov|bitterol|'
                r'alk\.|b42v|burg schöneck)'),
    ('Nápoje', r'\b(voda|nektar|džus|kofola|cola|limonád|energetick|sirup|ledový čaj|korunní|'
               r'waterrr|kávový nápoj|iso/|jogurtový nápoj|kubík|solevita|dobrá voda|tiger|kong)'),
    ('Mražené', r'\b(zmrzlin|mražen|pizza|nugety|rybí prsty|nanuk)'),
    ('Pečivo', r'\b(chléb|chlebí|houska|kobliha|šáteček|croissant|pečivo|burek|pita|bageta|'
               r'toustový|perník)'),
    ('Uzeniny a lahůdky', r'\b(šunka|salám|paštika|špekáč|klobás|norimbersk|lahůdkový|pomazánk|'
                          r'herkules|pikok|tzatziki)'),
    ('Maso a ryby', r'\b(kuře|kuřec|vepřov|hovězí|krůtí|mleté|mělněné|guláš|plec|panensk|tatarák|'
                    r'medailonk|burger|losos|treska|pstruh|tilápie|krevet|ryb|filet|kalmár|šproty|'
                    r'maso|masové)'),
    ('Mléčné a vejce', r'\b(mléko|jogurt|sýr|eidam|gouda|mozzarell|tvaroh|smetan|máslo|vejce|'
                       r'kefír|feta|halloumi|tvarůžky|dezert|milbona|pilos|olma|tofu)'),
    ('Ovoce a zelenina', r'\b(meloun|jahod|borůvk|nektarink|broskv|třešn|paprik|dýně|brambor|'
                         r'žampion|banán|hrozn|okurk|cibule|mrkev|avokádo|citron|limet|mango|'
                         r'ananas|švestk|hruš|jablk|rajčat|zelenin|salát|olivy|oliv\b)'),
    ('Sladké a slané', r'\b(sušenk|čokolád|tyčink|bonbon|chips|popcorn|snack|baklava|chalva|'
                       r'toffifee|horalky|polomáčené|nutella|rolka|pásky|bruschette|croissant|'
                       r'kešu|arašíd|mandle|sezamov|nugát|kinder|twix|corny|sedita|opavia|lipo)'),
    ('Trvanlivé potraviny', r'\b(cukr|mouka|rýže|těstovin|olej|protlak|bujón|kaše|vločky|čaj|'
                            r'káva|kečup|majonéz|omáčk|ajvar|fazol|mandarink|med\b|konzerv|'
                            r'nescafé|segafredo|melta|freshona|kania|baresa|hamé|combino|'
                            r'proteinov|feferonk|předkrm|znojmia|maretti)'),
]

# Slova, která lidi hledají, ale v letáku nejsou napsaná (leták píše "světlý
# ležák", zákazník hledá "pivo"). Přidávají se jen do vyhledávacího indexu.
SYNONYMS = [
    ('pivo pivko', r'ležák|výčepní|pivní|pivo|heineken|radegast|svijan|braník|argus|birell'),
    ('víno', r'frizzante|sekt|primitivo|prosecco|šumivé'),
    ('alkohol chlast', r'alk\.|vodka|rum|destilát|likér|aperitiv|metaxa|whisky'),
    ('maso', r'kuřec|vepřov|hovězí|krůtí|steak|řízek|burger|mleté|špekáč|salám|šunka'),
    ('kuře drůbež', r'kuřec|krůtí'),
    ('ryba rybí', r'losos|treska|pstruh|tilápie|krevet|filet|kalmár|šproty'),
    ('mléčné mlíko', r'jogurt|smetan|tvaroh|sýr|mléko|máslo|kefír'),
    ('sladkosti mlsání', r'čokolád|sušenk|bonbon|oplatk|tyčinka|zmrzlin|nutella'),
    ('nápoje pití', r'nápoj|voda|limonád|džus|nektar|kofola|cola|sirup|čaj|káva'),
    ('káva kafe', r'káva|kávov|espresso|nescafé|segafredo|melta'),
    ('ovoce', r'jahod|meloun|broskv|třešn|nektarink|borůvk|hruš|jablk|mandarink|banán'),
    ('zelenina', r'brambor|paprik|okurk|rajčat|dýně|žampion|cibule|mrkev|salát|špenát'),
    ('grilování gril', r'gril|špekáč|klobás|burger|marinovan|uhlí'),
    ('pečivo chleba', r'chléb|houska|pečivo|bageta|kobliha|croissant|šáteček|toustový'),
    ('mražené', r'zmrzlin|mražen|pizza|nugety'),
    ('drogerie čistící', r'prací|aviváž|mýdlo|šampon|zubní|gel|utěrky|papír'),
    ('nářadí kutil', r'vrtací|bruska|kladivo|klíč|šroubovák|nářadí|parkside'),
    ('hračky pro děti', r'hrač|puzzle|figurka|plyšov|lupilu|kuchyňka|panenk'),
    ('oblečení', r'triko|mikina|tepláky|pyžamo|ponožky|kraťasy|obuv'),
    ('zahrada', r'sekačka|nůžky na|hortenzie|růže|myrta|rudbekie|květ'),
    ('mazlíček zvíře', r'pro psy|pro kočky|pamlsky|krmiv|psí'),
]


JUNK = re.compile(r'^(\d+([.,]\d+)?\s*(kg|ks|g|l)|od str\..*|\*.*|.{70,})$', re.I)
BRAND_RE = re.compile(r'^([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9][A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9&\'’\.\-\+]*)$')


def fold(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower())
                   if unicodedata.category(c) != 'Mn')


def categorize(text):
    t = fold(text)
    for cat, pattern in RULES:
        if re.search(fold(pattern), t):
            return cat
    return 'Ostatní'


def split_brand(name):
    """'PILOS Eidam' -> ('PILOS', 'Eidam'); leading all-caps tokens are the brand."""
    toks = name.split()
    brand = []
    for t in toks[:4]:
        if BRAND_RE.match(t) and len(t) >= 2 and not t.isdigit():
            brand.append(t)
        elif t in ('&', '/') and brand:
            brand.append(t)
        else:
            break
    while brand and brand[-1] in ('&', '/'):
        brand.pop()
    rest = toks[len(brand):]
    if not brand or not rest:
        return None, name
    return ' '.join(brand), ' '.join(rest)


def union(a, b):
    """Smallest box covering the price and the name block — used to highlight
    the offer on the page image."""
    if not a:
        return b
    if not b:
        return a
    return [round(min(a[0], b[0]), 4), round(min(a[1], b[1]), 4),
            round(max(a[2], b[2]), 4), round(max(a[3], b[3]), 4)]


def clean(txt):
    txt = re.sub(r'\s+', ' ', txt or '').strip()
    txt = re.sub(r'\s+([,.])', r'\1', txt)
    return txt.strip(' ,;')


def build():
    raw, pages = extract.extract()
    items = []
    for p in raw:
        name = clean(p['name'])
        desc = clean(p['desc'])
        if not name or JUNK.match(name):
            continue
        if p['price'] is None and (len(name) < 4 or not desc):
            continue
        brand, short = split_brand(name)
        old, price = p['oldPrice'], p['price']
        save_pct = p['discount']
        if save_pct is None and old and price:
            save_pct = round((1 - price / old) * 100)
        items.append({
            'name': name, 'brand': brand, 'short': short, 'desc': desc,
            'price': price, 'oldPrice': old,
            'discount': save_pct,
            'discountKc': p['discountKc'],
            'saveKc': round(old - price, 2) if old and price else None,
            'saving': p['saving'],
            'deal': clean(p['deal']) if p.get('deal') else None,
            'unitPrice': clean(p['unitPrice']) if p['unitPrice'] else None,
            'lidlPlus': p['lidlPlus'], 'superPrice': p['superPrice'],
            'limit': clean(p['limit']) if p['limit'] else None,
            'category': categorize(f"{name} {desc}"),
            'pages': [p['page']],
            'box': union(p['box'], p['nameBox']),
        })

    # merge the same offer repeated on several pages (cover, regional mutations, teasers)
    merged = {}
    for it in items:
        key = (fold(it['name']), it['price'], fold(it['desc'])[:40])
        if key in merged:
            m = merged[key]
            if it['pages'][0] not in m['pages']:
                m['pages'].append(it['pages'][0])
            for f in ('oldPrice', 'discount', 'discountKc', 'saveKc', 'saving',
                      'unitPrice', 'limit', 'deal'):
                m[f] = m[f] if m[f] is not None else it[f]
            m['lidlPlus'] = m['lidlPlus'] or it['lidlPlus']
            m['superPrice'] = m['superPrice'] or it['superPrice']
        else:
            merged[key] = it

    out = sorted(merged.values(), key=lambda i: (i['pages'][0], -(i['price'] or 0)))
    for i, it in enumerate(out):
        it['id'] = i
        base = fold(f"{it['name']} {it['desc']} {it['category']}")
        extra = [syn for syn, pattern in SYNONYMS
                 if re.search(fold(pattern), base) and fold(syn) not in base]
        it['q'] = ' '.join([base] + [fold(x) for x in extra])

    meta = dict(META, pageCount=len(pages), productCount=len(out),
                generated=date.today().isoformat())
    payload = {'meta': meta,
               'pages': [{'n': p['page'], 'ratio': round(p['h'] / p['w'], 4)} for p in pages],
               'products': out}
    js = 'window.LETAK = ' + json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(OUT, 'w').write(js)

    from collections import Counter
    print(f'products: {len(out)}  (raw {len(raw)})   file: {len(js) // 1024} KB')
    for c, n in Counter(i['category'] for i in out).most_common():
        print(f'  {n:4d}  {c}')
    print('missing price:', sum(1 for i in out if i['price'] is None))


if __name__ == '__main__':
    build()
