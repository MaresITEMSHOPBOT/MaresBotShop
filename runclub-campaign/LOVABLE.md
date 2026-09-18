# Event v appce (runclubvse.lovable.app) — podklady k nasazení

## Proč to nemám nasazené sám

Do appky se odsud nedostanu: v GitHubu pod `MaresITEMSHOPBOT` jsou jen `MaresBotShop`
a `TimothyReynoldsWebsite` — Lovable projekt tam zatím není — a `runclubvse.lovable.app`
blokuje síťová proxy tohohle prostředí. Níž je proto všechno hotové k vložení a na konci
návod, jak mi dát přístup, ať to příště udělám rovnou v kódu.

---

## 1) Data prvního běhu

| Pole | Hodnota |
|---|---|
| Název | `RunClub VŠE #1 — Comeback` |
| Datum | **čtvrtek 24. 9. 2026** |
| Čas | **17:00** |
| Místo | `náměstí Winstona Churchilla (sraz u sochy před VŠE)` |
| Trasa | Vítkov — **uprav podle výsledku ankety z neděle** |
| Vzdálenost | 5 km |
| Body za účast | +5 |
| Popis | `První běh semestru. Tempo na pokec — 5 km zvládne každý, nikoho tu nikdo neuběhne. Sraz 16:55 u sochy, vybíháme v 17:00.` |

## 2) Co v appce opravit

1. **Starý termín** — `RunClub VŠE #1 · 2. dubna 2026` smazat nebo přesunout mezi proběhlé.
   Dokud tam visí, vede pondělní CTA z Instagramu na půlroku starý běh.
2. **Místo** — `Vysoká škola ekonomická v Praze (náměstí winstona churchilla u sochy!)`
   → `náměstí Winstona Churchilla (sraz u sochy)`. Velká písmena u jména a pryč s vykřičníkem.
3. **Prázdný seznam po prvním běhu** — nahrát rovnou všech 13 čtvrtků semestru (tabulka níž).
4. **Řazení** — zobrazovat jen nadcházející běhy od nejbližšího, proběhlé schovat do sekce pod nimi.
5. **Překlep v grafice** — v karuselu „Jak se připojit" máš `zůčastním se`, správně je
   **`zúčastním se`** (tlačítko v appce je v pořádku, chyba je jen na obrázku).

## 3) Prompt do Lovable (zkopíruj celý)

> V sekci „Běhy" potřebuju srovnat termíny na nový semestr:
>
> 1. Běh „RunClub VŠE #1" s datem 2. dubna 2026 smaž (nebo přesuň mezi proběhlé, pokud
>    takovou sekci máme).
> 2. Vytvoř nový běh: název „RunClub VŠE #1 — Comeback", datum 24. 9. 2026, čas 17:00,
>    místo „náměstí Winstona Churchilla (sraz u sochy před VŠE)", trasa Vítkov, 5 km,
>    +5 bodů za účast, popis: „První běh semestru. Tempo na pokec — 5 km zvládne každý.
>    Sraz 16:55 u sochy, vybíháme v 17:00."
> 3. Přidej stejný běh pro každý další čtvrtek v 17:00 od 1. 10. 2026 do 17. 12. 2026,
>    názvy „RunClub VŠE #2" až „RunClub VŠE #13", stejné místo, 5 km a +5 bodů.
> 4. Na hlavní stránce zobrazuj jen nadcházející běhy, seřazené od nejbližšího. Běhy, které
>    už proběhly, dej do sbalené sekce „Proběhlé běhy" pod ně.
> 5. Všude oprav zápis místa na „náměstí Winstona Churchilla" (teď je to malými písmeny).
> 6. Běhy ulož jako data v databázi, ne natvrdo do komponenty, ať jdou později editovat.

## 4) Varianta: SQL do Supabase

Pokud appka jede na Supabase, jde to i rovnou v SQL editoru. **Zkontroluj si nejdřív názvy
tabulky a sloupců** (`select * from events limit 1;`) — tenhle skript vychází z toho, co je
vidět v UI, takže se klidně můžou jmenovat jinak.

```sql
-- 1) starý termín pryč
delete from events where starts_at::date = date '2026-04-02';

-- 2) + 3) celý semestr čtvrtků 17:00
insert into events (title, starts_at, location, distance_km, points, description)
select
  'RunClub VŠE #' || row_number() over (order by d),
  d + time '17:00',
  'náměstí Winstona Churchilla (sraz u sochy před VŠE)',
  5,
  5,
  'Běžíme 5 km tempem na pokec. Sraz 16:55 u sochy, vybíháme v 17:00.'
from generate_series(date '2026-09-24', date '2026-12-17', interval '7 days') as d;

-- 4) kontrola
select title, starts_at, location from events order by starts_at;
```

Pak jen u prvního běhu doplň `— Comeback` v názvu a rozšířený popis.

## 5) Termíny na celý semestr

| # | Datum | | # | Datum |
|---|---|---|---|---|
| 1 | čt 24. 9. 2026 | | 8 | čt 12. 11. 2026 |
| 2 | čt 1. 10. 2026 | | 9 | čt 19. 11. 2026 |
| 3 | čt 8. 10. 2026 | | 10 | čt 26. 11. 2026 |
| 4 | čt 15. 10. 2026 | | 11 | čt 3. 12. 2026 |
| 5 | čt 22. 10. 2026 | | 12 | čt 10. 12. 2026 |
| 6 | čt 29. 10. 2026 | | 13 | čt 17. 12. 2026 |
| 7 | čt 5. 11. 2026 | | | |

Všechny 17:00. Termín #6 padá na 29. 10. (podzimní prázdniny na VŠE) — zvaž, jestli ho
nechat, nebo z něj udělat „volný běh bez organizace".

## 6) Jak mi dát přístup, ať to udělám sám

V Lovable projektu: **GitHub → Connect to GitHub** pod účtem `MaresITEMSHOPBOT`. Jakmile se
repo objeví, napiš mi jeho jméno — přidám si ho do session, opravím termíny i texty přímo
v kódu a pošlu ti to jako PR, takže uvidíš diff před nasazením.
