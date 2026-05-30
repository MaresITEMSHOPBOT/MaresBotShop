# Hledač prvočísel — webová aplikace

Samostatná webová aplikace (jeden soubor `index.html`) pro hledání prvočísel.
**Žádný server, žádná instalace, funguje offline.**

## Jak spustit

Otevři `index.html` v prohlížeči — dvojklikem, nebo „Otevřít soubor". To je vše.

## Co umí

- **Generátor** — spočítá π (počet prvočísel) v intervalu `[od, do)` až do ~10⁹,
  s ukazatelem průběhu a tlačítkem Zastavit. Volitelně všechna prvočísla vypíše
  a nabídne ke stažení (`.txt`).
- **Jedno číslo** — test prvočíselnosti pro libovolně velká čísla (i 100+ cifer),
  rozklad na prvočísla, předchozí/další prvočíslo a n-té prvočíslo.
- **Vizualizace** — Ulamova spirála a histogram mezer (se zvýrazněnými násobky 6).

## Jak to funguje

Stejné algoritmy jako Python balíček `primegen`, přepsané do JavaScriptu, aby
běžely v prohlížeči:

- **segmentové síto** (jen lichá čísla, po kouscích kvůli paměti, asynchronně
  kvůli plynulosti UI),
- **Miller–Rabin** nad `BigInt` (deterministický do 3,3·10²⁴ se sadou 12 svědků,
  nad tím pravděpodobnostní),
- **Pollardovo rho** pro faktorizaci (s časovým limitem — nerozloží součin dvou
  obřích prvočísel, což je princip RSA).

Engine je ověřený proti známým hodnotám (π(10⁶)=78498, π(10⁸)=5761455, počet
dvojčat pod 10⁶ = 8169, prvočíselnost M607, rozklad 2⁶⁷−1 atd.).

## Limity (poctivě)

- Mez je omezena na 2·10⁹ kvůli paměti prohlížeče; výpis seznamu je ořezán na
  2 000 000 prvočísel.
- Pro opravdu velké rozsahy je rychlejší Python balíček `primegen`
  (Cython + multiprocessing) o patro výš.
