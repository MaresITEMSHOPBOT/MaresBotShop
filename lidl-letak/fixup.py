#!/usr/bin/env python3
"""Ruční ořezy pro produkty, kde automatika trefila špatnou oblast."""
import json, re, fitz
from PIL import Image

PDF = '/root/.claude/uploads/4fe782ac-129e-54b7-ab51-ca86305193f0/587d2eec-AkcniletakODCTVRTKA30728202600_compressed.pdf'
DPI, SCALE = 150, 150 / 72.0

# (strana v PDF od 0, název produktu) -> ořez v bodech PDF
CROPS = {
    (0, 'PILOS Eidam'):                 (0, 248, 252, 500),
    (0, 'PIKOK Výběrová šunka'):        (0, 500, 252, 720),
    (0, 'PRIMA Mrož jahody'):           (196, 700, 392, 962),
    (0, 'Brambory rané'):               (252, 128, 591, 332),
    (0, 'Vodní meloun'):                (276, 332, 591, 540),
    (0, 'Kuře'):                        (248, 540, 591, 736),
    (0, 'BELBAKE Cukr krystal'):        (384, 700, 591, 962),
    (1, 'Vepřová panenská svíčková'):   (248, 176, 591, 486),
    (1, 'GRILL & FUN Špekáčky s goudou/chilli'): (248, 656, 591, 962),
    (1, 'FLORALYS Toaletní papír'):     (0, 656, 250, 962),
    (1, 'COCA-COLA / COCA-COLA Zero'):  (0, 376, 250, 722),
    (36, 'PARKSIDE Úhlová bruska 1 200 W'):      (288, 456, 591, 700),
    (36, 'PARKSIDE Triko – 3 kusy'):             (288, 688, 591, 962),
    (37, 'PARKSIDE Inspekční kamera'):           (140, 146, 591, 406),
    (39, 'CRIVIT Nožní pumpa s manometrem XL'):  (0, 150, 310, 566),
    (39, 'CRIVIT Momentový klíč pro jízdní kola'): (288, 16, 591, 336),
    (39, 'CRIVIT Sada nářadí pro jízdní kola'):  (186, 396, 591, 706),
    (39, 'CRIVIT Cyklistická helma s koncovým světlem'): (0, 736, 486, 1012),
    (40, 'CRIVIT Zámek na jízdní kolo'):         (0, 36, 591, 342),
    (40, 'CRIVIT Sortiment pro údržbu kola'):    (0, 356, 300, 706),
    (40, 'CRIVIT Sada osvětlení – 2 kusy'):      (300, 356, 591, 706),
    (40, 'CRIVIT Sportovní obuv'):               (236, 776, 591, 1012),
    (41, 'LUPILU Dětský batoh'):                 (296, 776, 591, 1012),
    (41, 'LUPILU Figurka Tlapková Patrola'):     (276, 436, 591, 706),
    (42, 'SPINMASTER Základní vozidlo s figurkou Tlapková patrola'): (196, 86, 591, 336),
    (43, 'LUPILU Plyšová hračka'):               (196, 36, 591, 236),
    (43, 'Dětské ložní povlečení'):              (320, 496, 591, 716),
    (43, 'Protiskluzová podložka do vany'):      (0, 586, 300, 746),
    (48, 'Broskve ploché'):                      (276, 166, 591, 336),
    (48, 'Třešně'):                              (276, 36, 591, 170),
    (48, 'Vepřová plec'):                        (276, 336, 591, 636),
    (50, "CRIVIT X F2 Dvoukomorový paddleboard Solid 10'"): (0, 106, 370, 456),
    (50, 'GRILLMEISTER Plynový gril 6+1 boční hořák'):      (296, 116, 591, 426),
    (50, 'CRIVIT Skládací elektrokolo FoldX 530'):          (286, 376, 591, 656),
    (50, 'LIVARNO Nafukovací matrace s integrovanou pumpou'): (286, 656, 591, 962),
    (50, 'PARKSIDE Aku teleskopické nůžky na živý plot'):     (0, 676, 320, 962),
    (50, 'PARKSIDE Elektrická sekačka na trávu'):             (0, 376, 300, 676),
    (52, 'LUPILU Sada dřevěných potravin'):      (286, 416, 591, 626),
    (52, 'PARKSIDE Termokamera'):                (0, 76, 300, 396),
    (52, 'CRIVIT Montážní stojan na kolo'):      (0, 396, 300, 706),
}

P = json.load(open('products.json'))
items = json.load(open('items.json'))

# doplnit Coca-Colu, kterou parser vyhodil (cena byla mimo blok)
if not any(r['name'].startswith('COCA-COLA') for r in P):
    P.append(dict(name='COCA-COLA / COCA-COLA Zero', detail='4 x 1,75 l, 1 l = 14,27 Kč',
                  price='99.90', old=None, badge='Ušetřete 28 %', cat='napoje', page=1,
                  img='tiles/x_cola.webp', src=-1, valid='30. 7. – 2. 8.'))

# u cedulek „Ušetřete“ doplnit procenta z původního textu
raw_by_src = {n: it['raw'] for n, it in enumerate(items)}
for r in P:
    if r['badge'] == 'Ušetřete' and r['src'] >= 0:
        m = re.search(r'Ušetřete\*?\s*\|?\s*(\d+)\s*%', raw_by_src.get(r['src'], ''))
        r['badge'] = f'Ušetřete {m.group(1)} %' if m else 'Ušetřete na měrné ceně'

doc = fitz.open(PDF)
cache = {}
n = 0
for r in P:
    box = CROPS.get((r['page'], r['name']))
    if not box:
        continue
    if r['page'] not in cache:
        pix = doc[r['page']].get_pixmap(dpi=DPI)
        cache[r['page']] = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    crop = cache[r['page']].crop(tuple(int(v * SCALE) for v in box))
    crop.thumbnail((300, 330), Image.LANCZOS)
    fn = 'tiles/x_%02d_%s.webp' % (r['page'], re.sub(r'\W+', '', r['name'])[:16])
    crop.save(fn, 'WEBP', quality=64, method=6)
    r['img'] = fn
    n += 1

order = {c: i for i, c in enumerate(
    ['maso', 'ovoce', 'chlazene', 'mrazene', 'pecivo', 'suche', 'napoje', 'drogerie',
     'obleceni', 'zahrada', 'sport', 'deti', 'domacnost'])}
P.sort(key=lambda r: (order.get(r['cat'], 99), r['page']))
json.dump(P, open('products.json', 'w'), ensure_ascii=False, indent=1)
print('přeříznuto', n, 'dlaždic; položek celkem', len(P))
