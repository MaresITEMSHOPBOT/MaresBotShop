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

**Města místo vesniček.** Sídlo má vlastní populaci jako číslo – od osady přes vesnici,
městečko, město a velkoměsto až po metropoli a megapoli se statisíci obyvatel. Jak město roste,
rozlévá se po mapě jako zástavba, staví pole kolem sebe a propojuje se cestami se sousedy.
Po mapě chodí jen vzorek panáčků, zbytek lidí je v číslech.

**Deset dob až do vesmíru.** Kamenná → bronzová → železná → středověk → renesance →
průmyslová revoluce → věk elektřiny → atomový věk → informační věk → kosmický věk.
Věda běží z počtu obyvatel, univerzit a laboratoří. V kosmickém věku postaví říše
**kosmodrom** a po čase odstartuje raketa – přistání na Měsíci je zapsáno mezi milníky.

**Stavby.** Pole, domy, pila, důl, tržiště, chrám, kasárna, hradby, univerzita, přístav,
továrna, elektrárna, laboratoř, letiště a kosmodrom. Každá stavba vypadá na mapě jinak
a něco přináší – jídlo, dřevo, zlato, vědu, obranu nebo víru.

**Války armád.** Města posílají armády s vlastní silou (vidíš je jako prapor s číslem).
Armády se v poli střetávají, obléhají města, plení je a dobývají – dobyté město změní barvu
i majitele. Hradby a kasárna obranu zesilují.

**Zvířata a evoluce.** Ovce, jeleni, vlci a medvědi mají geny (velikost, rychlost, plodnost),
které se dědí a mutují – po pár generacích se stádo vypadá jinak než na začátku. Karta zvířete
geny ukazuje.

**Grafy a milníky.** Karta *Grafy* kreslí dějiny světa: populaci každé říše vlastní barvou,
celkový počet obyvatel a sídel, hospodářství a války. Karta *Milníky* ukazuje, kdy svět vstoupil
do které doby a kdy padly velké události – první město, univerzita, továrna, kosmodrom, Měsíc.

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
