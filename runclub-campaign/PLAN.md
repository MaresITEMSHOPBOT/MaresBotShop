# RunClub VŠE — comeback kampaň „HLEDÁ SE MÍSTO"

**Termín:** pátek 18. 9. → pondělí 21. 9. 2026 (vyvrcholení po 21. 9. v 17:00)
**Cíl:** oživit účet po pauze, udělat z „hledání místa" veřejné pátrání a v pondělí
odhalit místo + termín prvního běhu semestru (čtvrtek 24. 9., 17:00).
**KPI:** 40+ komentářů/DM s tipy · 120+ hlasů v anketě · 25+ přihlášek v appce do čtvrtka.

---

## Velká myšlenka

Nezačínáme oznámením „jsme zpátky" — začínáme **záhadou**. Účet se probouzí bez vysvětlení,
druhý den z toho je **pátrací leták: hledá se místo pro první běh**. Komunita hledá
s námi (komentáře, anketa), takže než v pondělí padne odhalení, lidi už mají v tom běhu
svůj podíl — vybrali místo, takže tam chtějí přijít.

Proč to funguje: mystery drží dosah (návraty do profilu, DM), hlasování dělá z pasivních
sledujících spoluautory, a pondělní reveal je vyplacení slibu, ne studený nábor.

**Vizuální oblouk:** mřížka profilu se den po dni rozsvěcí — pátek je skoro černý,
sobota tmavě modrá, neděle modrá, pondělí plná modrá záře. Po čtyřech postech je z profilu
jeden gradient od tmy ke světlu. (Proto je pořadí podkladů v `render.py` takové, jaké je.)

---

## Timeline

| Kdy | Formát | Co | Soubory |
|---|---|---|---|
| **Pá 18. 9., 19:30** | karusel 2× | Teaser „signál" — žádné vysvětlení | `01a`, `01b` |
| Pá 18. 9., 20:00 | story | Odpočet „3 dny" | `st-01` |
| **So 19. 9., 11:00** | karusel 4× | **HLEDÁ SE MÍSTO** — pátrací leták + výzva | `02a`–`02d` |
| So 19. 9., 12:00 | story | Anketa „Kde poběžíme?" + otevřená otázka | `st-04` |
| So 19. 9., 20:00 | story | Odpočet „2 dny" + repost tipů | `st-02` |
| **Ne 20. 9., 19:00** | karusel 3× | Užší výběr (3 finalisté) + „zítra v 17:00" | `03a`–`03c` |
| Ne 20. 9., 20:00 | story | Odpočet „1 den" + poslední hlasování | `st-03` |
| **Po 21. 9., 17:00** | karusel 4× | **JSME ZPÁTKY** — místo, termín, přihlášení | `04a`–`04d` |
| Po 21. 9., 17:05 | story | Reveal + odkaz na appku + countdown sticker | `st-05` |
| Út–St 22.–23. 9. | story | Připomínka, kdo je přihlášený, trasa | – |
| **Čt 24. 9., 17:00** | — | **První běh semestru** | – |

---

## Popisky (ready to paste)

### 1) Pátek 18. 9., 19:30 — teaser
> nic neříkáme.
>
> 21. 9.
>
> .
> .
> #runclubvse #vse #prague #running

*(Komentáře nechat otevřené a na dotazy „co se děje?" odpovídat jen emoji 👀 — mystery se
nevysvětluje. Tohle je jediný post kampaně, kde se nedává CTA.)*

### 2) Sobota 19. 9., 11:00 — HLEDÁ SE MÍSTO
> **HLEDÁ SE MÍSTO.**
>
> Nový semestr, první běh, a jedna věc chybí: kde se poběží.
>
> Popis hledaného: cca 5 km, žádné semafory, do 15 minut od VŠE, snese partu lidí
> ve čtvrtek v 17:00. Odměna: první běh semestru — a ty u toho.
>
> Máš tip? Napiš ho do komentářů nebo do DM. Nejlepší tři pouštíme zítra do hlasování,
> vítěz se běží už tenhle čtvrtek.
>
> Ve stories můžeš hlasovat hned 👇
>
> #runclubvse #vse #běhání #prague #runningclub #vysokaskolaekonomicka

### 3) Neděle 20. 9., 19:00 — užší výběr
> Ze všech tipů zbyli tři.
>
> Vítkov · Riegrovy sady · Letná
>
> Hlasování běží ve stories do zítřejšího poledne. Zítra v 17:00 víte místo,
> datum i kilometry — a rovnou se budete moct přihlásit.
>
> Poslední šance to zvrátit ve prospěch svého kopce 🫵
>
> #runclubvse #vse #běhání #prague

### 4) Pondělí 21. 9., 17:00 — REVEAL
> **JSME ZPÁTKY.**
>
> Vybrali jste **Vítkov** — takže se běží tam.
>
> 📍 sraz: nám. W. Churchilla, u sochy
> 📅 čtvrtek 24. 9.
> ⏰ 17:00
> ⚡ 5 km, tempo na pokec (nikoho tu nikdo neuběhne, slibujeme)
>
> Přihlas se přes odkaz v biu → vyber termín → klikni „zúčastním se". Trvá to 20 vteřin
> a my díky tomu víme, na kolik lidí čekat.
>
> Běháme každý čtvrtek v 17:00. Tenhle je první z nich.
>
> #runclubvse #vse #běhání #prague #runningclub #runprague

---

## Stories — scénář

**Pá 18. 9.** — 1 story: odpočet „3". Bez textu navíc. Zapnout „sdílet do stories" pro post.
**So 19. 9.** — 3 stories:
1. Repost postu „Hledá se místo" + samolepka *Otázka*: „Kam bys nás poslal/a?"
2. `st-04-anketa` + samolepka *Anketa* se třemi možnostmi (Vítkov / Riegrovy sady / Letná).
3. Odpočet „2" večer.
**Ne 20. 9.** — 2–3 stories: nejlepší odpovědi z otázky (screenshoty, díky za ně), průběžný
stav ankety, odpočet „1", samolepka *Odpočet* nastavená na po 21. 9. 17:00 (lidi si zapnou
připomínku → v pondělí jim to samo cinkne).
**Po 21. 9.** — 3 stories: `st-05-reveal` s odkazem, screenshot appky s tlačítkem
„zúčastním se", a večer „už je nás X přihlášených".
**St 23. 9.** — připomínka + počasí. **Čt 24. 9. ráno** — „dnes v 17:00, sraz u sochy".

---

## Playbook pro komentáře a DM

- Na každý tip místa odpovědět do hodiny, jmenovitě a lidsky („Vítkov bereme, zapisuju").
  Rychlost odpovědí je to, co v sobotu utáhne dosah.
- Lidem, kteří tipnou vítězné místo, napsat v pondělí DM: „tvůj tip vyhrál, přijď si ho
  odběhnout" + odkaz. To jsou první jistí účastníci.
- Kdo se zeptá „můžu, když běhám pomalu?" → jasné ano a čas na 5 km (30–35 min).
  Tahle obava je hlavní důvod, proč lidi nepřijdou; odpovídat na ni proaktivně.
- Zmínky/stories od účastníků sdílet dál, ať je vidět, že se to fakt děje.

---

## Co je potřeba doplnit před spuštěním

- [ ] **Finalisté** — v `03b-kandidati` jsou Vítkov / Riegrovy sady / Letná. Pokud z tipů
      vyjde něco jiného, přepiš v `render.py` a přegeneruj (`python3 render.py 03b-kandidati`).
- [ ] **Vítěz** — `04b-misto` má natvrdo „Vítkov". V pondělí dopoledne přepiš podle ankety
      a přegeneruj (`python3 render.py 04b-misto`). Ať sedí i sraz na druhém řádku.
- [ ] **Termín v appce** — v `runclubvse.lovable.app` založit běh na **čt 24. 9. 2026, 17:00**
      (na screenshotu je pořád „RunClub VŠE #1 – 2. dubna 2026"). Bez toho pondělní CTA
      vede do prázdna, to je jediná věc, která může celou kampaň shodit.
- [ ] **Bio** — v pondělí změnit řádek „Zapiš se 👇 na tento týden" na „První běh semestru:
      čt 24. 9. v 17:00".
- [ ] **Kolaborace** — pondělní post nabídnout jako *collab* spolkům na VŠE (nebo aspoň
      označit @vsecz). Zdvojnásobí dosah revealu bez práce navíc.

---

## Kdyby se něco nepovedlo

- **Málo tipů v sobotu do večera** → neděle nezmizí: místo „ze všech tipů zbyli tři" jet
  „vybrali jsme tři" a anketu spustit rovnou. Kampaň na počtu komentářů nestojí.
- **Anketa skončí těsně** → udělat z toho obsah: „rozdíl 3 hlasy, takže poražené místo
  běžíme příští čtvrtek". Získáš tím rovnou druhý termín.
- **Špatná předpověď na čtvrtek** → neposouvat, přidat story „běží se za každého počasí,
  po běhu čaj/pivo". Posun termínu zabije vybudovaný odpočet.

---

## Soubory

Všechny vizuály jsou v `assets/`, 1080×1350 (posty) a 1080×1920 (stories), ve firemním
stylu (modrá záře + zrno, Helvetica-like sans + kurzivní serif na akcentech).
Generují se skriptem `render.py` — texty jsou v seznamu `SLIDES` na konci souboru,
takže jakoukoli změnu uděláš přepsáním řádku a spuštěním `python3 render.py`.
