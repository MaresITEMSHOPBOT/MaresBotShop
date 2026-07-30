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

**Klidný obraz.** Simulace běží v pevném tempu 8 tiků za vteřinu a vykreslování mezi tiky
dopočítává mezipolohy, takže panáčci chodí plynule. Mapa se překresluje jen tam, kde se
opravdu něco změnilo – nic nebliká ani nekmitá.

**Krajina.** Mapa 144 × 90 dlaždic: hlubina, mělčina, písek, louka, les, kopce, hory, sníh,
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

**Víra.** Víra je tvá mana. ✨ Požehnání uzdraví a nasytí panáčky a udělá z nich věřící;
věřící ti pak víru doplňují. Katastrofy víru stojí, malování krajiny je zdarma.

## Zdrojové soubory

| Soubor | Obsah |
| --- | --- |
| `js/core.js` | náhoda, Perlinův šum, matematika, generátor jmen |
| `js/world.js` | dlaždicová mapa, oheň, láva, povodně, růst porostu |
| `js/life.js` | panáčci, zvířata, vesnice, království, války |
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
