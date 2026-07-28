# Akční leták Lidl – po kategoriích

`letak.html` je samostatná stránka (obrázky i písma jsou vložené uvnitř, funguje offline).
Leták 30. 7. – 2. 8. 2026, region CZ 31/2026, 245 položek ve 13 kategoriích:
maso a ryby, ovoce a zelenina, chlazené, mražené, pečivo, suché a trvanlivé,
nápoje, drogerie, oblečení, zahrada a dílna, sport, dětský svět, domácnost.

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
