# Digitální leták s vyhledáváním

Statická webová aplikace nad akčním letákem (PDF). Nic se neinstaluje,
běží offline i z disku. Dvě podoby, obě dělají totéž:

- **`../letak.html`** – jeden soubor (8,3 MB) se vším uvnitř včetně stránek
  letáku. Stačí ho otevřít v prohlížeči nebo poslat dál.
- **`letak/index.html`** – rozdělená verze (menší soubory, obrázky zvlášť).

## Co to umí

- **Hledání v celém letáku** – píšeš bez diakritiky i s ní (`maslo` = `máslo`),
  toleruje koncovky (`jogurty` najde `Jogurt`) a zná synonyma, která leták
  nepoužívá (`pivo` najde i „světlý ležák“ Radegast, Svijany, Heineken…).
- **U každého produktu je vidět všechno**: akční cena, původní přeškrtnutá cena,
  sleva v % i v Kč, měrná cena (`1 kg = 119,60 Kč`), balení, omezení nákupu,
  značky *Super cena*, *Lidl Plus*, akce typu *2+1 zdarma*, kategorie a číslo
  strany letáku.
- **Filtry a řazení** – kategorie, jen zlevněné, jen Lidl Plus, cena do…,
  řazení podle ceny / slevy / úspory / názvu / strany.
- **„V letáku →“** otevře skutečnou stránku letáku a **žlutě zvýrazní**
  místo, kde produkt je. Šipkami ←/→ se listuje, `⊞` zvětšuje.
- **Listování** – náhledy všech stran s počtem akcí na straně.
- **Nákupní seznam** – přidávání produktů, množství a **součet ceny nákupu**,
  ukládá se do prohlížeče (localStorage).
- Klávesnice: `/` skok do hledání, `Esc` zavřít / vymazat, `←` `→` listování.

## Struktura

```
letak/
  index.html      aplikace
  app.js          vyhledávání, filtry, seznam, prohlížeč stran
  styles.css      styly (světlý i tmavý režim)
  data.js         vygenerovaná data: produkty, ceny, kategorie, souřadnice
  pages/NN.webp   stránky letáku (980 px)
  thumbs/NN.webp  náhledy (200 px)
  tools/          skripty, kterými se data.js a obrázky generují z PDF
```

## Nový leták (regenerace dat)

```bash
pip install pdfplumber pypdfium2 pillow
cd letak/tools
LETAK_PDF=/cesta/k/letaku.pdf python3 render_pages.py         # obrázky stran
LETAK_PDF=/cesta/k/letaku.pdf python3 build_letak_data.py     # ../data.js
python3 build_standalone.py                                   # ../../letak.html
```

Platnost letáku a region se nastavují v `META` na začátku
`tools/build_letak_data.py`.

### Jak se data z PDF získávají

Leták nemá strojově čitelnou strukturu, produkty se skládají z textu podle
typografie a rozmístění na stránce:

- ceny jsou v písmu `LidlFontPrice`, názvy v `LidlFontCondPro-Bold`, popisy
  v `LidlFontCondPro-Book`, přeškrtnutá cena v `LidlFontPro-Book`;
- slova se skládají ze znaků (ne `extract_words`), protože jinak by se česká
  písmena s háčky odtrhla do vlastních „slov“;
- řádky se dělí i vodorovně, aby se neslily sousední dlaždice ve stejné výšce;
- k ceně se přiřadí nejbližší **nad ní** ležící název ve stejném sloupci
  (dlaždice v letáku mají název nahoře a cenu dole);
- text mimo plochu stránky se zahazuje – PDF vozí na „pasteboardu“ i jiné
  regionální varianty téže strany, které se netisknou;
- stejná nabídka na více stranách (titulka + vnitřek) se slučuje do jedné
  položky se seznamem stran.

Data jsou automaticky vyčtená, u pár položek se může stát, že se cena přiřadí
k sousední dlaždici – proto je u každého produktu odkaz na stránku letáku,
kde jde vše ověřit.
