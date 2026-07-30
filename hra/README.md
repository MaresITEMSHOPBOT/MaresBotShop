# 🌍 Bůh světa

Simulátor světa v krabici. Máš před sebou živou planetu – tvorové se v ní sami živí, množí,
mutují a vyvíjejí. Ty jsi bůh: můžeš jim pomáhat, nebo na ně poslat bombu, povodeň, sopku
a meteorit.

## Jak to spustit

* **Jedním souborem:** otevři `hra.html` v kořeni repozitáře (funguje offline, po dvojkliku).
* **Ze zdrojů:** otevři `hra/index.html`.

Žádný server, žádné knihovny – čisté HTML, CSS a JavaScript s canvasem.

## Ovládání

| Akce | Ovládání |
| --- | --- |
| Použít vybranou moc | levé tlačítko (u některých mocí lze držet a táhnout) |
| Posun mapy | pravé tlačítko nebo mezerník + tah |
| Přiblížení | kolečko myši |
| Volba moci | klávesy 1–9, 0 |
| Pauza | mezerník |
| Přepnutí pohledu na mapu | Tab |
| Nápověda | H |

## Co se ve světě děje

**Terén a klima.** Mapa 320 × 200 políček s výškou, vodou, vláhou, úrodností a teplotou.
Voda teče podle výšky terénu, odpařuje se a stéká do moře. Teplota závisí na zeměpisné
šířce, nadmořské výšce, ročním období a na klimatu, které si nastavíš posuvníkem. Oheň se
šíří po vegetaci, láva teče z kopce a po vychladnutí zvedá terén a hnojí půdu.

**Život.** Každý tvor má 11 genů: velikost, rychlost, zrak, metabolismus, plodnost, dravost,
odolnost vůči teplu i zimě, plavání, inteligenci a délku života. Geny určují, kolik energie
tvor spálí, co snese a jak se chová. Tvorové hledají potravu, páří se s partnerem svého druhu,
mláděti zkříží geny a přidají mutace. Kdo nepřežije, geny nepředá – evoluce tu není naskriptovaná,
vypadne ze selekce.

**Druhy.** Když se geny mláděte dost vzdálí od průměru rodičovského druhu, odštěpí se nový druh
s vlastním jménem a barvou. Kronika zapisuje, co se prosadilo a co vymřelo.

**Civilizace.** Když inteligence stoupne dost vysoko, tvorové začnou stavět: chýše → vesnice → chrám.
Sídla zúrodňují okolí, chrání před teplotními výkyvy a chrámy ti posílají víru.

**Víra.** Víra je tvá mana a platíš jí každý zásah. Vyrábějí ji tvorové, kteří v tebe věří –
získáš je zázraky (požehnání, déšť, zjevení). Podle svých činů jsi milovaný, nebo obávaný bůh.

## Zdrojové soubory

| Soubor | Obsah |
| --- | --- |
| `js/core.js` | generátor náhody, Perlinův šum, matematické pomůcky |
| `js/world.js` | terén, voda, vlhkost, vegetace, oheň, láva, klima |
| `js/creatures.js` | geny, chování, rozmnožování, druhy, sídla, víra |
| `js/powers.js` | boží schopnosti a katastrofy |
| `js/render.js` | vykreslování canvasu, efekty, minimapa |
| `js/game.js` | propojení s uživatelským rozhraním |

Soubory `core/world/creatures/powers` nesahají na DOM, takže je lze spustit i mimo prohlížeč.

## Vývoj

```bash
node hra/test/sim-test.js 12000 4242   # simulace bez prohlížeče: tiků, semínko
node hra/build.js                      # sestaví hra.html v kořeni repozitáře
```

Test vypíše vývoj populace, druhů, dravců, staveb a rychlost simulace v ms na tik
(pro plynulých 60 FPS je potřeba zůstat pod 8 ms).
