# Vedení směny

Aplikace pro vedoucího směny v prodejně: plán lidí dopředu, kdo co dělá, kolik přijelo palet,
checklisty na otevírání a zavírání a zápisník poznámek z tréninku.

Funguje bez internetu a bez serveru – je to obyčejná webová stránka, data se ukládají
do paměti prohlížeče (localStorage) v telefonu nebo počítači.

## Jak to spustit

**Online s přihlášením (doporučeno):**
<https://claude.ai/code/artifact/54ab04a2-a9d7-4d9b-a3df-91b7e1ee501d>

Otevře se pod tvým účtem, data se ukládají na server a jsou stejná v mobilu i na počítači.
Změny se propisují mezi zařízeními samy; v hlavičce svítí stav ukládání (*Uloženo / Ukládám…*).
Online verze se sestaví příkazem `node lidl/build-artifact.js` do `dist/vedeni-smeny.html`.


**Offline v telefonu:** otevři soubor `smena.html` z kořene repozitáře – je v něm sbalená
celá aplikace do jednoho souboru. Dá se poslat mailem, hodit na disk nebo otevřít z úložiště.
V prohlížeči pak `Přidat na plochu` a chová se to jako aplikace.

**Na počítači:** otevři `lidl/index.html` v prohlížeči.

Po úpravě zdrojáků se jednosouborová verze přegeneruje příkazem:

```
node lidl/build.js
```

## Co kde je

| Sekce | K čemu slouží |
| --- | --- |
| **Přehled** | Dnešní směna na jedné obrazovce – kdo je v práci, palety, checklist, zítřek, připomínky. |
| **Plán** | Týdenní plán směn, kopírování minulého týdne, tisk, přehled hodin proti úvazku. |
| **Prodejna** | Editovatelný plán prodejny – regály, pokladny, gondoly, akce. Klik otevře regál ve 2D pohledu s policemi. |
| **Data spotřeby** | Kontrola dat: vybereš místo, skenuješ zboží, fotíš ho a zapisuješ datum spotřeby. |
| **Den** | Detail dne: rozdělení lidí na úseky, dodávky, checklisty, tržba a předání směny. |
| **Tým** | Lidé, jejich pozice, úvazek, na co jsou zaškolení, poznámky. |
| **Zboží** | Statistika palet podle druhu a dne – z čísel poznáš, na které dny potřebuješ víc lidí. |
| **Checklist** | Šablona úkolů vedoucího směny (otevření / během směny / zavírání). Dá se libovolně upravit. |
| **Poznámky** | Zápisky z tréninku – kategorie, štítky, hledání, hvězdička pro důležité. |

## Plán prodejny

Sekce **Prodejna** je nakreslený půdorys prodejny. V *režimu úprav* se prvky přetahují prstem
i myší, roh vybraného prvku slouží k roztažení, šipky na klávesnici posouvají po 5 (se Shiftem po 20).
Vybraný prvek má dole panel, kde se dá přepsat název, typ, přesné souřadnice i poznámka
(třeba „gondola se mění každý čtvrtek"). Tlačítko **Zpět** vrací poslední změnu.

Typy prvků odpovídají barvám z původního nákresu: šedá regál, žlutá pokladna, oranžová akce,
červený obrys gondola, zelená ovoce/zelenina a květiny, fialová pekárna, modrá chlazené,
světlejší modrá mražené a lednička u samoobslužných pokladen.

**Pohled na regál:** klikni na prvek a otevře se čelní 2D pohled – regál rozdělený na police.
Počet polic si nastavíš tlačítky ＋ a −, artikly přetáhneš prstem i myší na tu polici, kde
ve skutečnosti stojí, a mezi policemi je přerovnáš stejným tažením. Zboží, u kterého ještě
polici neznáš, čeká dole v **Nezařazených**. Kliknutím na artikl se otevře jeho úprava. Ke každému
artiklu patří název, **EAN**, číslo artiklu, police a **fotka**. Vyfotit se dá i celé místo
(*Fotka místa*), ať je vidět, jak má být regál naskládaný. V režimu prohlížení stačí na prvek
klepnout, v režimu úprav slouží k otevření tlačítko *Detail* nebo dvojklik.

Do políčka *Kde je artikl?* napiš část názvu nebo EAN – místo v plánu se červeně rozbliká
a pod hledáním se vypíše, ve kterém regálu to je. Tlačítko *Seznam artiklů* ukáže vše najednou.

Fotky se před uložením zmenší na 900 px a uloží jako JPEG (zhruba 60 kB na kus). Prohlížeč jich
pobere řádově stovky – kolik je zabráno, ukazuje pruh v *Nastavení*.

Plán jde vytisknout (tlačítko **Tisk**) a tlačítko **Výchozí plán** vrátí původní podobu.

## Kontrola dat spotřeby

V sekci **Data spotřeby** dáš *Začít kontrolu*, vybereš místo (Pokladna 1, konkrétní regál…)
a zapisuješ zboží. Kód se dá načíst třemi způsoby:

1. **Kamerou** – živé skenování. Umí ho Chrome na Androidu (čtečka zabudovaná v prohlížeči).
2. **Vyfocením kódu** – vyfotíš čárový kód, aplikace ho přečte a fotku rovnou přiloží k záznamu.
3. **Ručně** – EAN se napíše do pole. Zvládne to i klasická pistolová čtečka, ta kód „napíše"
   a odešle Enterem.

K záznamu patří název, datum spotřeby, počet kusů, police, fotka a co s tím (redukce, odpis,
vrácení dodavateli). Zaškrtnutá volba *Přidat i mezi artikly tohohle místa* rovnou staví
digitální prodejnu – co naskenuješ, objeví se v regálu.

Přehled řadí zboží od nejnaléhavějšího: prošlé, končí dnes, do tří dnů, do týdne. Hotové
položky odškrtneš a zmizí z seznamu k řešení.

## Dvě věci, které se vyplatí vědět

1. **Z poznámky se dá udělat úkol.** U každé poznámky je tlačítko ✅, které z ní vyrobí položku
   v checklistu. Tak z toho, co ti řeknou na tréninku, postupně vznikne tvůj vlastní systém.
2. **Kde data leží.** Online verze je má v účtu (a fotky v samostatných záznamech, aby se vešly
   do limitu 256 kB na dokument). Offline verze je má jen v paměti prohlížeče – když si ji smažeš
   nebo přejdeš na jiný telefon, jsou pryč. V *Nastavení* je proto **Stáhnout zálohu (JSON)**
   a **Načíst zálohu**; stejnou cestou přeneseš data z offline verze do online.

## Struktura

```
lidl/
  index.html   – kostra stránky
  styles.css   – vzhled (světlý i tmavý režim, tisk)
  store.js     – datový model, číselníky, ukládání, výpočty hodin, výchozí plán prodejny
  map.js       – editor plánu prodejny a vyhledávání artiklů
  shelf.js     – čelní 2D pohled na regál, police a přetahování artiklů
  scan.js      – kontrola dat spotřeby: výběr místa, čtení kódů, zápisy
  cloud.js     – online ukládání do účtu (jen v Artifact verzi)
  inline.js    – společné kousky pro oba buildy
  build-artifact.js – sestaví ../dist/vedeni-smeny.html pro publikování
  app.js       – vykreslování obrazovek, formuláře, akce
  build.js     – sloučí vše do ../smena.html
```

Do poznámek ani do jiných částí aplikace nepatří citlivé firemní údaje ani osobní data kolegů
nad rámec toho, co potřebuješ k plánování směny.
