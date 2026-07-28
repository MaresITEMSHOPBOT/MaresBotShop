# Akční leták Lidl – po kategoriích

`letak.html` je samostatná stránka (obrázky i písma jsou vložené uvnitř, funguje offline).
Leták 30. 7. – 2. 8. 2026, region CZ 31/2026, 245 položek ve 14 kategoriích:
maso a ryby, ovoce a zelenina, vejce, chlazené, mražené, pečivo, suché a trvanlivé,
nápoje, drogerie, oblečení, zahrada a dílna, sport, dětský svět, domácnost.

Nad kategoriemi je druhé dělení: **stálý sortiment** (153 položek – běžná regálovka
tenhle týden zlevněná) a **in & out** (92 položek – nepotravinářské akce Parkside,
Crivit, Lupilu, Livarno a řecký týden Eridanous, tedy zboží na akční ploše,
které po vyprodání končí). Řídí se podle strany letáku, viz `INOUT_PAGES` v `build.py`.

Každá dlaždice je rozklikávací – otevře se stránka letáku s vyznačeným zbožím
(klik do stránky přiblíží), vedle ní všechny údaje, přepínač „hotovo“
a šipky na sousední položky. Stránky se do stránky vkládají v `render.py`,
rámeček se počítá z `rect` v `products.json`.

## Jak se to vyrábí z nového PDF

```bash
pip install pymupdf pillow
python3 extract.py      # rozřeže stránky PDF na produktové dlaždice -> tiles/, items.json
python3 build.py        # vyčistí názvy a ceny, zařadí do kategorií -> products.json
python3 fixup.py        # ruční ořezy tam, kde automatika minula
python3 render.py       # složí letak.html (obrázky + písma jako data URI)
```

Cestu k PDF nastav v `extract.py` (proměnná `PDF`) a v `fixup.py`.
V `build.py` je `DROP` (co není produkt), `FIX` (ruční opravy podle indexu z `items.json`)
a `EXTRA` (položky, které parser vůbec nezachytil) – ty se pro nový leták musí projít znovu.
