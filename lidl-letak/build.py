#!/usr/bin/env python3
"""Vyčistí a zkategorizuje položky z letáku -> products.json"""
import json, re

items = json.load(open('items.json'))

# --- položky, které nejsou produkty (reklamy, nadpisy, duplicity) ---
DROP = {2, 8, 10, 13, 17, 19, 21, 28, 29, 30, 31, 35, 37, 38, 39, 40, 42, 43, 50, 54,
        56, 57, 58, 70, 76, 88, 92, 112, 132, 134, 153, 169, 195, 201, 209, 211, 212,
        213, 216, 220, 228, 230, 234, 236, 240, 241, 242, 245, 248, 252, 256, 259, 264,
        268, 273, 282, 283, 290, 291, 293, 294, 295, 296, 297, 298, 300, 304, 305, 306,
        307, 308, 309, 310, 311, 312, 219, 222, 224, 229, 231, 232, 233, 237, 250}

# --- ruční opravy: index -> pole k přepsání ---
FIX = {
    1:   dict(name='PIKOK Výběrová šunka', detail='100 g', price='13.90', old='22.90', badge='-39%'),
    7:   dict(name='BELBAKE Cukr krystal', detail='1 kg, max. 10 ks na nákup', price='9.90',
              old='14.90', badge='S Lidl Plus −33%'),
    6:   dict(name='Kuře', detail='cena za 1 kg, max. 5 balení na nákup'),
    18:  dict(name='Čerstvá vejce „M“', detail='10 kusů, podestýlka'),
    20:  dict(name='Čerstvá vejce „M“', detail='30 kusů, podestýlka, 1 kus = 4,83 Kč'),
    22:  dict(name='Čerstvá vejce „L“', detail='10 kusů, podestýlka'),
    23:  dict(name='Jupí Sirup', detail='0,7 l, lesní směs / pomeranč, 1 l = 49,86 Kč'),
    25:  dict(name='Máslo', detail='250 g, 1 kg = 119,60 Kč'),
    26:  dict(name='Kofola', detail='2 l, 1 l = 14,95 Kč'),
    27:  dict(name='Tiger energetický nápoj', detail='0,5 l, 1 l = 35,80 Kč'),
    24:  dict(name='Konzerva pro kočky / pro psy', detail='415 g, 1 kg = 28,67 Kč'),
    44:  dict(name='Vodní meloun', detail='1 kg'),
    63:  dict(name='Špaldová houska', detail='80 g, vícezrnné pečivo, 3+1 zdarma – při koupi 4 ks',
              price='7.43', old='9.90', badge='3+1 zdarma'),
    64:  dict(name='Malinová kobliha',
              detail='110 g, s polevou z bílé čokolády, 32 % malinové náplně'),
    98:  dict(name='PILOS Selský jogurt', detail='400 g, 4 % tuku, 1 kg = 39,75 Kč',
              price='15.90', old='19.90', badge='-20%'),
    102: dict(name='FRESHONA Zeleninová směs s kukuřicí', detail='450 g, 1 kg = 42 Kč',
              price='18.90', old='25.90', badge='-27%'),
    104: dict(name='Proteinová tyčinka', detail='50 g, banán/vanilka, 23 % proteinu'),
    105: dict(name='FRESHONA Zeleninová směs na čínu', detail='450 g, 1 kg = 44,22 Kč',
              price='19.90', old='27.90', badge='-28%'),
    108: dict(name='NIXE Šproty', detail='170 g, v rajčatové omáčce', price='19.90',
              old='26.90', badge='-26%'),
    114: dict(name='OPAVIA Zlaté Polomáčené', detail='150 g, hořké', badge='Super cena'),
    116: dict(name='SNACK DAY Popcorn', detail='3 x 100 g, slaný/máslový, do mikrovlnné trouby'),
    119: dict(name='HAVLÍK Tyčinky se sýrem a solí', detail='150 g', badge='Ušetřete 38 %'),
    121: dict(name='LIPO Kyselé pásky', detail='80 g, jahoda/pomeranč'),
    124: dict(name='KONG STRONG Energetický nápoj', detail='250 ml, různé druhy, 1 l = 31,60 Kč',
              price='7.90', old='9.90', badge='-20%'),
    125: dict(name='BRANÍK', detail='0,5 l, pivo světlé výčepní, záloha na lahev 3 Kč',
              badge='Super cena'),
    126: dict(name='DOBRÁ VODA s příchutí', detail='1,5 l, neperlivá, jahoda', price='11.90',
              badge='Super cena'),
    127: dict(name='ALLINI Hugo frizzante', detail='200 ml, bez a limetka, bílé/růžové, 2+1 zdarma',
              price='13.27', old='19.90', badge='2+1 zdarma'),
    130: dict(name='KORUNNÍ s příchutí', detail='1,5 l, různé druhy', price='12.90',
              badge='Super cena'),
    135: dict(name='CONFISERIE FIRENZE Špička s makovou náplní', detail='100 g', price='9.90',
              old='13.90', badge='-28%'),
    138: dict(name='Pardubický perník', detail='60 g, se švestkovou náplní, CHZO',
              price='5.90', badge='Ušetřete 25 %'),
    139: dict(name='DR. OETKER Ovesná kaše', detail='53 g / 58 g, různé druhy', price='9.90',
              badge='Super cena'),
    141: dict(name='KUBÍK Waterrr', detail='0,5 l, vybrané druhy', price='11.90',
              badge='Super cena'),
    142: dict(name='TASTINO Kukuřičné chlebíčky', detail='35 g, různé druhy', price='6.90',
              old='9.90', badge='-30%'),
    143: dict(name='FRESHONA Polévková směs', detail='450 g, jemně krájená', price='18.90',
              old='24.90', badge='-24%'),
    145: dict(name='CIEN Pleťová maska', detail='2 x 8 ml, různé druhy, 1 ks = 4,45 Kč',
              price='8.90', old='16.90', badge='-47%'),
    147: dict(name='COSHIDA PURE TASTE Tyčinky pro kočky', detail='3 x 5 g, drůbeží',
              price='9.90', old='12.90', badge='-23%'),
    148: dict(name='COSHIDA Paté pro kočky', detail='85 g, různé druhy', price='11.90',
              old='14.90', badge='-20%'),
    150: dict(name='ORLANDO Sáčky na psí exkrementy', detail='4 x 20 kusů, 1 balení = 3,73 Kč'),
    152: dict(name='ORLANDO Pamlsky pro psy', detail='100 g / 150 g / 200 g, různé druhy'),
    166: dict(name='ERIDANOUS Řecký extra panenský olivový olej', detail='3 l, 1 l = 266,63 Kč'),
    173: dict(name='ERIDANOUS Jogurt řeckého typu', detail='4 x 125 g, ostružinový/broskvový',
              price='49.90'),
    193: dict(name='STORCK Toffifee', detail='125 g, s bílou čokoládou', price='39.90',
              old=None, badge='Super cena'),
    194: dict(name='Znojmia Cocktail okurky', detail='340 g, 3–6 cm', price='29.90',
              badge='Super cena'),
    198: dict(name='ALGIDA Zmrzlina twister/mix', detail='8 x 50 ml, různé druhy, 1 ks = 9,99 Kč'),
    199: dict(name='PILOS Odtučněný tvaroh', detail='250 g, 1 kg = 55,60 Kč', price='13.90',
              old='17.90', badge='S Lidl Plus −22%'),
    200: dict(name='MELTA Original', detail='200 g, novinka', badge='Super cena'),
    204: dict(name='SEGAFREDO Caffé Crema Collezione', detail='1 kg, různé druhy', price='349.90',
              badge='Super cena'),
    205: dict(name='PASSION GOLD Prací gel Professional', detail='3,52 l, 88 dávek, Exotic/Lavender'),
    208: dict(name='AZURIT Aviváž', detail='3,036 l, 138 dávek, Jasmine elegance / Magnolia fantasy'),
    210: dict(name='SILVERCREST Sendvičovač 750 W', detail='24,5 x 23,8 x 10,8 cm, 3 v 1 – Lidl outlet Ostrava'),
    214: dict(name='ESMARA MEN Pánské kraťasy „Sweat Denim“',
              detail='bavlna, polyester, elastan, 48–58 – Lidl outlet Ostrava'),
    215: dict(name='PARKSIDE Vrtací a sekací kladivo 1 550 W',
              detail='energie úderu max. 5 J, 0–3 900 úderů/min', price='1399.-', old='1499.-',
              badge='S Lidl Plus −100 Kč'),
    217: dict(name='PARKSIDE Multifunkční nářadí 310 W',
              detail='15 000–21 000 ot/min, s adaptérem pro odsávání prachu', price='399.90',
              old='799.90', badge='-400 Kč'),
    218: dict(name='ULTIMATE SPEED Sada upínacích pásů s ráčnou',
              detail='délka upnutí 3,5 m, celková délka 4 m, 2/4dílná sada', price='199.90',
              old='299.90', badge='-100 Kč'),
    221: dict(name='PARKSIDE Příslušenství k úhlové brusce', detail='2–11dílné sady'),
    223: dict(name='PARKSIDE 20V Akumulátor 4 Ah', detail='Cell Balancing, série X20V Team',
              price='699.90', badge='Super cena'),
    225: dict(name='PARKSIDE Sada koleček', detail='4/8dílná sada, nosnost až 10/25/50 kg'),
    226: dict(name='PARKSIDE Silikon 310 ml', detail='odolný proti plísním', price='79.90',
              old='99.90', badge='S Lidl Plus −20 Kč'),
    227: dict(name='PARKSIDE Spirála na čištění potrubí',
              detail='rozvody 12,6–40 mm, délka spirály 8 m'),
    235: dict(name='CRIVIT Sada osvětlení – 2 kusy', detail='červené a bílé LED světlo',
              price='69.90', old='79.90', badge='−10 Kč od 2 sad'),
    238: dict(name='CRIVIT Zámek na jízdní kolo', detail=''),
    239: dict(name='LUPILU Dřevěná železnice', detail='53dílná sada, kombinovatelná s běžnými kolejnicemi'),
    243: dict(name='LUPILU Figurka Tlapková Patrola', detail='40–72 cm, různé druhy, se sběratelskými kartami',
              price='29.90', old='39.90', badge='−10 Kč při koupi 3 ks'),
    244: dict(name='LUPILU Dětský stan na hraní', detail='2 prodyšná síťovaná okna, jednoduché sestavení'),
    246: dict(name='LUPILU Triko – 2 kusy', detail='100% bavlna, 98/104–122/128', price='129.90',
              old='159.90', badge='-30 Kč'),
    247: dict(name='LUPILU Puzzle', detail='20/42/80 dílků'),
    249: dict(name='LUPILU Drak', detail='133 x 72 cm, snadné sestavení a létání'),
    251: dict(name='PAW PATROL Mini vozidla', detail='včetně zvukových efektů',
              badge='S Lidl Plus −20 Kč'),
    253: dict(name='Cestovní hrací stůl', detail='40 x 33 x 15 cm, s držákem na tablet',
              price='229.90', old='279.90', badge='-50 Kč'),
    254: dict(name='Dětská kniha aktivit', detail='různé druhy', price='69.90', old='99.90',
              badge='S Lidl Plus −30 Kč'),
    255: dict(name='Polštář/pončo/deka', detail='různé druhy', badge='S Lidl Plus −30 Kč'),
    261: dict(name='Dětská termokamera', detail='2palcový displej, funkce okamžitého tisku'),
    262: dict(name='Nízké ponožky – 3 páry', detail='bavlna, polyamid, elastan, 27/30–35/38'),
    266: dict(name='CHEF SELECT Nugety', detail='250 g, z jemně mletého kuřecího masa (chlazené)'),
    270: dict(name='CHEF SELECT Nugety', detail='300 g, z jemně mletého kuřecího masa (mražené)'),
    275: dict(name='PILOS Dezert s ovocnou složkou', detail='90 g, malina/meruňka', price='8.90'),
    276: dict(name='FLORALYS Kuchyňské utěrky', detail='3 x 100 útržků, s potiskem'),
    281: dict(name='LIVARNO Stojací LED lampa 11,5 W',
              detail='16 barev, plynulé stmívání, dálkové ovládání, ⌀ 13 x 103,5 cm'),
    287: dict(name='Třešně', detail='cena za 100 g', price='8.90', old='14.90', badge='-40%'),
    289: dict(name='Vepřová plec', detail='cena za 1 kg, chlazená, bez kosti, v celku, vakuově baleno; max. 5 balení',
              price='54.90', badge='Ušetřete 45 %'),
    292: dict(name='PARKSIDE Elektrická sekačka na trávu',
              detail='šířka sečení 44 cm, 7 stupňů 20–70 mm, 1 800 W, koš 55 l'),
    299: dict(name='LIVARNO Nafukovací matrace s integrovanou pumpou',
              detail='nosnost 300 kg, 203 x 152 x 46 cm'),
    301: dict(name='ULTIMATE SPEED Výklopná helma', detail='M/L/XL, sluneční clona, ABS + EPS'),
    302: dict(name='PARKSIDE Termokamera', detail='rozsah −20–1 000 °C, přesnost ± 2 °C'),
    303: dict(name='CRIVIT Montážní stojan na kolo', detail='rám 25–55 mm, nosnost 30 kg'),
}

# --- opravy zařazení + názvů po kontrole ---
FIX.update({
    7:   dict(cat='suche', name='BELBAKE Cukr krystal', detail='1 kg, max. 10 ks na nákup',
              price='9.90', old='14.90', badge='S Lidl Plus −33%'),
    15:  dict(name='ERIDANOUS Sýr Halloumi',
              detail='225 g, klasik, CHOP, vhodný ke grilování', price='54.90', old='59.90',
              badge='S Lidl Plus −5 Kč'),
    16:  dict(cat='suche', name='ERIDANOUS Řecký extra panenský olivový olej',
              detail='0,75 l, s chráněným označením původu', price='199.90', old='249.90',
              badge='S Lidl Plus −20%'),
    51:  dict(name='Japonská myrta trio', detail='⌀ 12 cm, ↑ 27 cm'),
    52:  dict(name='Růže duo', detail='⌀ 14 cm, ↑ 34 cm'),
    53:  dict(name='Hortenzie latnatá', detail='⌀ 19 cm, ↑ 55 cm'),
    55:  dict(name='Rudbekie', detail='⌀ 17 cm'),
    60:  dict(cat='pecivo'), 62: dict(cat='pecivo'),
    77:  dict(cat='maso'),
    79:  dict(cat='suche'),
    103: dict(cat='suche'), 104: dict(cat='suche'), 108: dict(cat='suche'),
    109: dict(cat='suche'), 113: dict(cat='suche'), 116: dict(cat='suche'),
    119: dict(cat='suche'),
    131: dict(name='ARGUS Pivní půllitr', detail='s reliéfním dekorem'),
    136: dict(cat='suche'),
    137: dict(cat='suche', name='SNACK DAY Čočkové/cizrnové chipsy',
              detail='60 g, různé druhy'),
    138: dict(cat='suche', name='Pardubický perník', detail='60 g, se švestkovou náplní, CHZO',
              price='5.90', badge='Ušetřete 25 %'),
    149: dict(name='CIEN Sprchový gel a šampon pro muže 3 v 1', detail='400 ml'),
    162: dict(cat='suche'),
    165: dict(name='ERIDANOUS Feferonky plněné čerstvým sýrem', detail='270 g, různé druhy'),
    170: dict(name='MILBONA Jogurt řeckého typu', detail='1,1 kg, 2 % tuku, 1 kg = 45,36 Kč'),
    173: dict(cat='chlazene', name='ERIDANOUS Jogurt řeckého typu',
              detail='4 x 125 g, ostružinový/broskvový', price='49.90'),
    174: dict(cat='suche'), 177: dict(cat='suche'),
    180: dict(cat='mrazene'),
    181: dict(name='ERIDANOUS Karamelizované kešu/arašídy/mandle', detail='120 g / 150 g'),
    194: dict(cat='suche', name='Znojmia Cocktail okurky', detail='340 g, 3–6 cm',
              price='29.90', badge='Super cena'),
    260: dict(name='LUPILU Koloběžka s LED kolečky',
              detail='kolečka z PU, ABEC 5, hliníková řídítka, max. nosnost 50 kg'),
    266: dict(cat='chlazene', name='CHEF SELECT Nugety',
              detail='250 g, z jemně mletého kuřecího masa (chlazené)'),
    269: dict(cat='mrazene'),
    270: dict(cat='mrazene', name='CHEF SELECT Nugety',
              detail='300 g, z jemně mletého kuřecího masa (mražené)'),
    271: dict(cat='suche'), 274: dict(cat='suche'),
    277: dict(cat='chlazene'),
    286: dict(cat='suche'),
})
DROP |= {14, 32, 33, 34, 36, 44, 45, 198}   # duplicity z upoutávkových stran

# --- doplněné položky, které extraktor nezachytil ---
EXTRA = [
    dict(name='Broskve ploché', detail='500 g – balení, 1 kg = 59,80 Kč', price='29.90',
         old='49.90', badge='-40%', page=48, cat='ovoce', img='tiles/p48_04.webp'),
    dict(name='PARKSIDE Úhlová bruska 1 200 W', detail='3 000–12 000 ot/min, kotouče do ⌀ 125 mm',
         price='499.90', old='549.90', badge='-50 Kč', page=36, cat='zahrada', img='tiles/p36_04.webp'),
    dict(name='PARKSIDE Triko – 3 kusy', detail='100% bavlna, M–XXL, balení', price='199.90',
         old='249.90', badge='S Lidl Plus −50 Kč', page=36, cat='obleceni', img='tiles/p36_05.webp'),
    dict(name='PARKSIDE Inspekční kamera', detail='4násobný zoom, sonda 106 cm, video až 25 min',
         price='999.-', old='1399.-', badge='-400 Kč', page=37, cat='zahrada', img='tiles/p37_02.webp'),
    dict(name='CRIVIT Cyklistická helma s koncovým světlem', detail='S/M 54–59 cm, L/XL 59–64 cm',
         price='349.90', old='399.90', badge='-50 Kč', page=39, cat='sport', img='tiles/p39_01.webp'),
    dict(name='CRIVIT Nožní pumpa s manometrem XL', detail='objem 476 cm³, manometr do 11 barů',
         price='249.90', old='299.90', badge='-50 Kč', page=39, cat='sport', img='tiles/p39_02.webp'),
    dict(name='CRIVIT Momentový klíč pro jízdní kola', detail='9 bitů, 2–24 Nm po 0,1 Nm',
         price='399.90', old='499.90', badge='-100 Kč', page=39, cat='sport', img='tiles/p39_04.webp'),
    dict(name='CRIVIT Sada nářadí pro jízdní kola', detail='20dílná sada, 28,5 x 21,3 x 6 cm',
         price='449.90', old='599.90', badge='-150 Kč', page=39, cat='sport', img='tiles/p39_03.webp'),
    dict(name='CRIVIT Sortiment pro údržbu kola', detail='různé druhy, 75/200/400/500 ml',
         price='69.90', old='79.90', badge='−10 Kč od 2 kusů', page=40, cat='sport',
         img='tiles/p40_01.webp'),
    dict(name='CRIVIT Sportovní obuv', detail='dámská 37–41, pánská 41–46', price='229.90',
         old='299.90', badge='-70 Kč', page=40, cat='obleceni', img='tiles/p40_04.webp'),
    dict(name='LUPILU Dětský batoh', detail='10 l, nastavitelné popruhy, max. nosnost 3,5 kg',
         price='179.90', old='279.90', badge='-100 Kč', page=41, cat='deti', img='tiles/p41_02.webp'),
    dict(name='SPINMASTER Základní vozidlo s figurkou Tlapková patrola', detail='21,6 x 9,5 x 19 cm',
         price='199.90', old='249.90', badge='S Lidl Plus −50 Kč', page=42, cat='deti',
         img='tiles/p42_01.webp'),
    dict(name='LUPILU Plyšová hračka', detail='30 cm', price='199.90', old='229.90',
         badge='-30 Kč', page=43, cat='deti', img='tiles/p43_02.webp'),
    dict(name='Dětské ložní povlečení', detail='polyester, polštář 70 x 90 cm, přikrývka 140 x 200 cm, oboustranné',
         price='249.90', badge='Super cena', page=43, cat='domacnost', img='tiles/p43_06.webp'),
    dict(name='Protiskluzová podložka do vany', detail='70 x 40 cm', price='149.90', page=43,
         cat='domacnost', img='tiles/p43_00.webp'),
    dict(name='CRIVIT X F2 Dvoukomorový paddleboard Solid 10\'', detail='nosnost 130 kg, 305 x 89 x 12 cm – pouze online',
         price='3999.-', old='5799.-', badge='-1800 Kč', page=50, cat='sport', img='tiles/p50_00.webp'),
    dict(name='GRILLMEISTER Plynový gril 6+1 boční hořák',
         detail='grilovací plocha 67 x 39 cm, max. 18 kW – pouze online', price='4499.-',
         old='6999.-', badge='-2500 Kč', page=50, cat='zahrada', img='tiles/p50_05.webp'),
    dict(name='CRIVIT Skládací elektrokolo FoldX 530',
         detail='pro 160–195 cm, 3 úrovně asistence, dojezd 80 km – pouze online', price='18999.-',
         old='25999.-', badge='-7000 Kč', page=50, cat='sport', img='tiles/p50_07.webp'),
    dict(name='PARKSIDE Aku teleskopické nůžky na živý plot',
         detail='pracovní výška max. 4 m, délka řezu 43 cm – pouze online', price='899.-',
         old='1399.-', badge='-500 Kč', page=50, cat='zahrada', img='tiles/p50_02.webp'),
    dict(name='SILVERCREST Espresso kávovar', detail='tlak čerpadla 15 bar, 1 100 W – pouze online',
         price='1799.-', page=52, cat='domacnost', img='tiles/p52_04.webp'),
    dict(name='LUPILU Sada dřevěných potravin', detail='dělitelné potraviny se suchým zipem, od 2 let – pouze online',
         price='179.90', page=52, cat='deti', img='tiles/p52_03.webp'),
    dict(name='LUPILU Dřevěná kuchyňka s osvětlením a zvuky', detail='24dílná sada, výška 97/101/103 cm – pouze online',
         price='1499.-', page=52, cat='deti', img='tiles/p52_02.webp'),
    dict(name='LUPILU Dřevěný domeček pro panenky XXL', detail='54dílná sada – pouze online',
         price='1299.-', page=52, cat='deti', img='tiles/p52_05.webp'),
]

# --- kategorie ---
CATS = ['maso', 'ovoce', 'chlazene', 'mrazene', 'pecivo', 'suche', 'napoje',
        'drogerie', 'obleceni', 'zahrada', 'sport', 'deti', 'domacnost']

PAGE_CAT = {0: 'chlazene', 1: 'maso', 2: 'chlazene', 3: 'chlazene', 4: 'suche', 9: 'maso',
            10: 'suche', 11: 'deti', 13: 'ovoce', 14: 'ovoce', 15: 'zahrada', 17: 'pecivo',
            18: 'maso', 19: 'maso', 20: 'suche', 21: 'mrazene', 23: 'chlazene', 24: 'suche',
            25: 'suche', 26: 'napoje', 27: 'suche', 28: 'drogerie', 29: 'chlazene',
            30: 'suche', 31: 'suche', 32: 'suche', 33: 'suche', 34: 'suche', 35: 'domacnost',
            36: 'zahrada', 37: 'zahrada', 38: 'zahrada', 39: 'sport', 40: 'sport',
            41: 'deti', 42: 'deti', 43: 'deti', 44: 'deti', 45: 'mrazene', 46: 'chlazene',
            47: 'domacnost', 48: 'suche', 50: 'zahrada', 51: 'sport', 52: 'domacnost'}

KW = [
    ('maso', r'kuře|kuřec|vepřov|hovězí|krůt|špekáč|klobás|salám|šunka|paštik|slanin|'
             r'tatarák|guláš|maso|treska|losos|pstruh|tilápie|krevet|šproty|kalmár|'
             r'rybí prsty|masové kuličky|burger|nugety'),
    ('ovoce', r'brambor|meloun|nektarink|dýně|žampion|paprika|borůvk|třešn|broskv|'
              r'jablk[ao]\b|okurky|rajčat|banán\b'),
    ('mrazene', r'zmrzlin|nanuk|mražen|mrož|rybí prsty|zeleninová směs|polévková směs|'
                r'pizza|obalovaný eidam'),
    ('chlazene', r'jogurt|sýr|eidam|gouda|mozzarella|tvaroh|tvarůžky|smetana|máslo|'
                 r'pomazánk|feta|halloumi|kefír|mléko|vejce|tofu|tzatziki|lahůdkový salát|'
                 r'zelný salát|dezert|nápoj s ovocným|kávový nápoj|jogurtový nápoj|'
                 r'feferonky plněné'),
    ('pecivo', r'chléb|houska|kobliha|croissant|šáteček|burek|pita|perník|baklava'),
    ('napoje', r'pivo|ležák|vodka|víno|sekt|destilát|aperitiv|metaxa|myslivecká|božkov|'
               r'coca-cola|kofola|nektar|voda|frizzante|energetick|heineken|svijan|'
               r'radegast|braník|argus|korunní|waterrr|aloe vera|sirup|iso/mind'),
    ('drogerie', r'cien|dentalux|floralys|kapesník|toaletní papír|utěrky|mýdlo|šampon|'
                 r'prací|aviváž|coshida|orlando|konzerva pro'),
    ('obleceni', r'triko|kraťasy|mikina|tepláky|pyžamo|ponožky|obuv'),
    ('deti', r'lupilu|tlapkov|paw patrol|spinmaster|puzzle|hračka|dětsk|koloběžka|drak|'
             r'stan na hraní|kniha aktivit|hrací stůl|batoh'),
    ('sport', r'crivit|kolo|helma|paddleboard|elektrokolo|cyklist'),
    ('zahrada', r'parkside|grillmeister|sekačka|gril\b|nůžky|vrtací|bruska|silikon|'
                r'spirála|kolečk|akumulátor|kamera|hortenzie|růže|rudbekie|myrta|květin'),
    ('domacnost', r'livarno|silvercrest|lampa|matrace|kávovar|povlečení|podložka|sendvičovač|'
                  r'termokamera|nabíječka'),
]

DETAIL_RE = re.compile(
    r'^\s*(\d|cena za|různé druhy|materiál|balení|souprava|s chráněným|z jemně|vybrané|'
    r'kombinovateln|nastavitelné|celková|vhodná|max\.|pro |od |sada\b|bez |včetně)', re.I)
NOISE_RE = re.compile(
    r'^(také online|pouze online|novinka|nově|pro tebe|super cena|cenový|trumf|hit|'
    r'rozšířená|nabídka|znáte|z tv|s lidl plus|xxl|\d+x|\d+ ?dílná sada|zdarma|'
    r'\d+\+\d+|max\. nosnost:?|nosnost: až|sleva|při koupi.*|standardní cena.*|'
    r'cena za \d+ (kus|sadu).*|\*.*|.*% tuku\*?|.*proteinu|.*malinové náplně|'
    r'z kamenné pece|oboustranné|dámská|pánská|příslušenství|'
    r'akumulátor je kompatibilní.*|1 (ks|role|balení|dávka) =.*|\d+–\d+ ?°c|'
    r'.*víno (suché|polosuché)|\d+ % tuku|.*ochranné|atmosféře)$', re.I)


def split_name(lines):
    flat = []
    for p in lines:
        flat += [x.strip() for x in p.split('\n') if x.strip()]
    flat = [x for x in flat if not NOISE_RE.match(x)]
    flat = [re.sub(r'\s*\d+[.,]\d{2}\s*$', '', x).strip() for x in flat]
    flat = [x for x in flat if x and not re.fullmatch(r'[\d.,\- ]+', x)]
    name, detail = [], []
    for x in flat:
        if not name or (not detail and not DETAIL_RE.match(x) and len(name) < 4):
            name.append(x)
        else:
            detail.append(x)
    return ' '.join(name), ' '.join(detail)


def categorize(name, detail, page):
    txt = (name + ' ' + detail).lower()
    if page in (29, 30, 31, 32):          # řecký týden – rozhoduje název
        pass
    for cat, pat in KW:
        if re.search(pat, txt):
            return cat
    return PAGE_CAT.get(page, 'suche')


out = []
for n, it in enumerate(items):
    if n in DROP:
        continue
    name, detail = split_name(it['lines'])
    rec = dict(name=name, detail=detail, price=it['price'], old=it['old'],
               badge=it['disc'], page=it['page'], img=it['img'], src=n)
    rec.update(FIX.get(n, {}))
    rec['detail'] = re.sub(r'\s+', ' ', re.sub(r'(,\s*){2,}', ', ', rec['detail'])).strip(' ,')
    rec['name'] = re.sub(r'\s*/\s*', '/', rec['name']).strip(' ,')
    if not rec['name'] or not rec['price']:
        print('CHYBÍ:', n, rec['name'], rec['price'])
        continue
    rec['cat'] = FIX.get(n, {}).get('cat') or categorize(rec['name'], rec['detail'], it['page'])
    out.append(rec)

for e in EXTRA:
    e.setdefault('old', None); e.setdefault('badge', None); e.setdefault('detail', '')
    e['src'] = -1
    out.append(e)

VALID = {3: 'nová běžná cena', 4: 'nová běžná cena',
         35: '27. 7. – 2. 8. · Lidl outlet Ostrava', 47: '31. 7. – 2. 8.',
         48: '31. 7. – 2. 8.', 50: '27. 7. – 2. 8. · pouze na lidl.cz',
         51: '27. 7. – 2. 8. · pouze na lidl.cz', 52: '27. 7. – 2. 8. · pouze na lidl.cz'}
for r in out:
    r['valid'] = VALID.get(r['page'], '30. 7. – 2. 8.')
    if r['name'] == 'Vepřová plec':
        r['valid'] = '29. 7. – 2. 8.'

order = {c: i for i, c in enumerate(CATS)}
out.sort(key=lambda r: (order.get(r['cat'], 99), r['page']))
json.dump(out, open('products.json', 'w'), ensure_ascii=False, indent=1)

from collections import Counter
print(Counter(r['cat'] for r in out))
print('celkem', len(out))
