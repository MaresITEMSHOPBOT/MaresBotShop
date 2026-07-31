# 🌍 Bůh světa

Sandbox ve stylu WorldBoxu. Ve skleněné krabici žijí panáčci: sbírají jídlo, staví domy,
zakládají vesnice a království, uzavírají mír a válčí. Ty jsi bůh – maluješ krajinu,
sázíš národy, žehnáš jim nebo na ně posíláš meteorit.

## Jak to spustit

* **Jedním souborem:** otevři `hra.html` v kořeni repozitáře (funguje offline, po dvojkliku).
* **Ze zdrojů:** otevři `hra/index.html`.

Žádný server, žádné knihovny – čisté HTML, CSS a JavaScript s canvasem.

## Ovládání

| Akce | Ovládání |
| --- | --- |
| Použít nástroj | levé tlačítko (štětce jdou držet a táhnout) |
| Posun mapy | pravé tlačítko nebo mezerník + tah |
| Přiblížení | kolečko myši |
| Prohlédnout si panáčka / vesnici | nástroj 🖐️ Ruka a klik |
| Volba nástroje | klávesy 1–9, 0 |
| Pauza | mezerník |
| Nápověda | H |

## Co se ve světě děje

**Nekonečný režim.** Tlačítko ♾️ nahoře (klávesa G) zapne nekonečnou víru – všechny nástroje
jsou zdarma a bez omezení, takže si můžeš dělat, co chceš a jak dlouho chceš.

**Klidný obraz.** Simulace běží v pevném tempu 8 tiků za vteřinu a vykreslování mezi tiky
dopočítává mezipolohy, takže panáčci chodí plynule. Mapa se překresluje jen tam, kde se
opravdu něco změnilo – nic nebliká ani nekmitá.

**Krajina.** Mapa ve čtyřech velikostech (128×80 až 320×200): hlubina, mělčina, písek, louka, les, kopce, hory, sníh,
pole, spáleniště, láva. Typ dlaždice se počítá z výšky, teploty a vláhy. Oheň se šíří po
porostu a nechává po sobě spáleniště, které časem zaroste. Láva teče z kopce a tuhne v novou
skálu. Voda z povodně teče podle terénu a odtéká do moře.

**Panáčci.** Čtyři rody – lidé, orkové, elfové a trpaslíci – se liší rychlostí, silou,
plodností, délkou života a tím, kde se jim líbí. Každý má jméno, věk, zdraví, sytost a
povolání (dítě, dělník, voják, tulák). Dělník chodí sbírat jídlo na les, louku nebo pole,
nosí ho do vesnice a staví domy. K tomu po světě běhají ovce a vlci.

**Vesnice a království.** Vesnice má zásobu jídla, domy a obyvatele. Když je jí těsno,
založí opodál novou vesnici – tak království roste. Hranice na mapě ukazují, kam které
království dosáhne; hlavní město pozná podle hradu s vlajkou a značky ♛.

**Války.** Sousední království si mezi sebou občas vyhlásí válku (orkové výrazně častěji).
Vesnice povolají vojáky, ti pochodují na nejbližší nepřátelskou vesnici, bijí se a bourají
domy. Když vesnice přijde o všechny domy, padne; když království přijde o všechny vesnice,
zaniká. Mír se dá uzavřít sám – nebo ho můžeš vnutit nástrojem 🕊️.

**Hospodářství.** Vesnice hospodaří se třemi surovinami: 🌾 jídlem, 🪵 dřevem a 🪙 zlatem.
Dělníci sbírají jídlo a kácí dřevo, staví pole, domy, pily, doly, tržiště, chrámy a kasárna.
Zlato plyne z dolů, tržišť a obchodu se sousedy, král z něj platí žold a vědu.

**Zákony.** V kartě *Zákony* vyhlašuješ pravidla pro celý svět: daně, brannou povinnost,
porodnost, kácení lesů, obchod, povinnou víru, zahraniční politiku a podporu vědy. Každý
zákon mění chování všech království – i jejich náladu.

**Doby.** Věda posouvá království z doby kamenné až do renesance. Každá doba znamená lepší
stavby, silnější vojáky a vyšší výnosy.

**Panovníci a povstání.** Každé království má krále nebo královnu, kteří stárnou a umírají.
Když spokojenost vesnice klesne moc nízko, vesnice se vzbouří a založí vlastní království.

**Víra.** Víra je tvá mana. ✨ Požehnání uzdraví a nasytí panáčky a udělá z nich věřící;
věřící a chrámy ti víru doplňují. Katastrofy víru stojí, malování krajiny je zdarma.

**Grafy.** Karta *Grafy* kreslí dějiny světa: populaci každého království vlastní barvou,
celkový počet obyvatel a vesnic, hospodářství (zlato, jídlo, dřevo) a průběh válek.

## Zdrojové soubory

| Soubor | Obsah |
| --- | --- |
| `js/core.js` | náhoda, Perlinův šum, matematika, generátor jmen |
| `js/world.js` | dlaždicová mapa, oheň, láva, povodně, růst porostu |
| `js/life.js` | panáčci, zvířata, vesnice, království, hospodářství, zákony, války |
| `js/powers.js` | nástroje hráče (štětce, národy, zázraky, katastrofy) |
| `js/render.js` | kreslení dlaždic, panáčků, staveb a hranic, minimapa |
| `js/game.js` | rozhraní, smyčka s pevným tempem |

Soubory `core/world/life/powers` nesahají na DOM, takže je lze spustit i mimo prohlížeč.

## Vývoj

```bash
node hra/test/sim-test.js 6000 12345   # simulace bez prohlížeče: tiků, semínko
node hra/build.js                      # sestaví hra.html v kořeni repozitáře
```

Test vypíše, jak rostou národy, kolik je vesnic, staveb, vojáků a válek, a kolik milisekund
zabere jeden tik (hra běží 8 tiků za vteřinu, takže je potřeba zůstat hluboko pod 15 ms).
