# 🇫🇷 Français 3D — nauč se francouzsky z 0 na B2

Interaktivní 3D hra pro učení francouzštiny. Procházíš svět (dům, zahrada, náves),
klikáš na věci — **každá má svůj člen a rod** — povídáš si s postavami a postupuješ
přes strukturované lekce **A1 → B2**.

## ▶ Jak to spustit

Stačí otevřít soubor **`francouzstina.html`** v prohlížeči (dvojklik, nebo
přetáhnout do okna Chrome / Edge / Firefoxu).

> Pro 3D a zvuk je potřeba moderní prohlížeč a **připojení k internetu**
> (knihovna Three.js se načítá z CDN; po prvním načtení se cachuje).
> Výslovnost používá hlas prohlížeče (Web Speech API) — zapni si zvuk.

## 🎮 Ovládání

Na PC se ovládá jako běžná **FPS hra**: klikni do okna → myš ovládá rozhlížení
(`Esc` myš zase uvolní / dá pauzu).

| Akce | Klávesa / gesto |
|---|---|
| Spustit ovládání | klikni do okna (myš = rozhlížení), `Esc` = pauza |
| Pohyb | `W` `A` `S` `D` nebo šipky (na mobilu tlačítka vlevo dole, rozhlížení tahem prstu) |
| Běh | drž `Shift` |
| Interakce | zaměř křížkem uprostřed a **klikni** nebo stiskni `E` (nahoře svítí „[E] …") |
| Otevřít / zavřít dveře a okna 🚪 | zaměř je a `E` / klik |
| Vyslovit zaměřené | `F` |
| Mluvit s postavou (💬) | zaměř ji a klikni → dialog s výběrem odpovědí |

**Fyzika:** zdmi, budovami, nábytkem ani stromy neprojdeš — okolo nich se kloužeš.

**Barvy členů:** 🔵 `le / un` = mužský rod · 🔴 `la / une` = ženský rod · 🟢 `les / des` = množné číslo.

## 📚 Co appka obsahuje

- **3D město** s domem, zahradou a ~15 budovami (pekařství, kavárna, škola, lékárna, banka, knihovna, muzeum, kostel, nádraží…), silnicemi, lampami a lavičkami.
- **Otevíratelné dveře a okna** (animované) u domu i u obchodů.
- **Chodící lidé** — chodí po městě a u jména je **napsané, co dělají** (jde do pekárny / pije kávu / odpočívá u fontány…).
- **📒 Slovník** — velká tematicky tříděná databáze (přes 400 slov): vyhledávání, řazení (A→Z / rod / úroveň), filtr podle témat. Co objevíš ve světě, **se sem samo uloží** (odznak „Objevené").
- **📖 Knihovna gramatiky** — 25 lekcí A1 → B2 (výklad česky + příklady + kvízy): výslovnost, členy, slovesa a časy (présent, passé composé, imparfait, futur, plus‑que‑parfait…), zápor, zájmena, conditionnel, subjonctif, gérondif, trpný rod, souslednost, spojky…
- **Vylepšená grafika:** realistická obloha, měkké stíny sledující hráče, tone‑mapping, texturovaná tráva a cesty, mraky.
- **FPS ovládání myší** (Pointer Lock), běh a **kolize**.
- **🃏 Opakování** kartičkami (SRS) + **XP a pokrok** se ukládají do prohlížeče.

> Pozn. k „20 000 slovům": aktivní slovní zásoba na úrovni **B2 je ~4–5 tisíc slov**
> (20 k+ je spíš C2 / rodilý mluvčí). Slovník je navržený tak, aby šel libovolně
> rozšiřovat — stačí přidávat položky do pole `DICT` v souboru.

## ➕ Jak přidat vlastní obsah

Vše je v jednom souboru `francouzstina.html`, v sekci `<script type="module">`:

- **Nová slovíčka:** přidej položku do pole `VOCAB`
  (`fr`, `art`, `g` = m/f/pl, `cs`, `cz` = výslovnost, `type` = tvar, `pos` = [x,y,z], `ex`/`exCs`).
- **Nové situace/dialogy:** přidej do objektu `DIALOGUES` a postavu do `NPCS`.
- **Nové lekce:** přidej do pole `LESSONS` (`level`, `title`, `html`, `ex`, `quiz`).

> Pozn.: appka je samostatná a nesouvisí s ostatními soubory v repu.
