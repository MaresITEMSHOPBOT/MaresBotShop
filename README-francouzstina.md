# 🇫🇷 Français 3D — nauč se francouzsky z 0 na B2

Interaktivní 3D hra pro učení francouzštiny. Procházíš svět (dům, zahrada, náves),
klikáš na věci — **každá má svůj člen a rod** — povídáš si s postavami a postupuješ
přes strukturované lekce **A1 → B2**.

## ▶ Jak to spustit

**Nejjednodušší:** otevři **`francouzstina.html`** v prohlížeči (dvojklik, nebo
přetáhnout do okna Chrome / Edge / Firefoxu).

**Jako samostatná appka v okně (bez instalace):** dvojklik na
**`Spustit-hru-Windows.bat`** (Windows) nebo **`Spustit-hru-Mac.command`** (macOS)
— otevře hru v režimu „aplikace" (vlastní okno bez lišty prohlížeče).
Musí být ve stejné složce jako `francouzstina.html`.

**Skutečná desktopová aplikace (.exe/.dmg):** viz složka **`desktop/`** (Electron).

> Pro 3D a zvuk je potřeba moderní prohlížeč a **připojení k internetu**
> (knihovna Three.js se načítá z CDN; po prvním načtení se cachuje).
> Výslovnost používá hlas prohlížeče (Web Speech API) — zapni si zvuk.

## ⚡ Seká se? → Nastav grafiku na Nízkou

Na úvodní obrazovce (a kdykoli přes **⚙️** nahoře) zvol **kvalitu grafiky**:
- **Nízká — plynulé** (výchozí): bez stínů a efektů, minimum detailů → nejvyšší FPS.
- **Střední**: stíny zapnuté.
- **Vysoká — hezké**: stíny + ambient occlusion + max detailů (jen pro silný PC/grafiku).

Hra navíc sama sníží kvalitu, když pozná nízké FPS. Pozn.: desktopová/Electron
verze běží na stejném jádře jako prohlížeč — **plynulost řeší tahle volba, ne obal**.

## 🎮 Ovládání

Na PC se ovládá jako běžná **FPS hra**: klikni do okna → myš ovládá rozhlížení
(`Esc` myš zase uvolní / dá pauzu).

| Akce | Klávesa / gesto |
|---|---|
| Spustit ovládání | klikni do okna (myš = rozhlížení), `Esc` = pauza |
| Pohyb | `W` `A` `S` `D` nebo šipky (na mobilu tlačítka vlevo dole, rozhlížení tahem prstu) |
| Běh | drž `Shift` |
| Vejít do budovy | otevři dveře (`E`) a projdi vchodem |
| Zjistit, co to je | **jen na věc najeď** — vpravo se hned ukáže člen, rod, překlad i věta (a slovo se přidá do slovníku). Žádné klikání! |
| Vyslovit / otevřít | stiskni `E` (vysloví slovo, otevře dveře 🚪, učebnici 📖, dá řeč s postavou 💬) |
| Mluvit s postavou (💬) | zaměř ji a `E` → dialog s výběrem odpovědí |

**Fyzika:** zdmi, budovami, nábytkem ani stromy neprojdeš — okolo nich se kloužeš.

**Barvy členů:** 🔵 `le / un` = mužský rod · 🔴 `la / une` = ženský rod · 🟢 `les / des` = množné číslo.

## 📚 Co appka obsahuje

- **Velké 3D město** s domem, zahradou a 22 budovami na mřížce ulic (pekařství, kavárna, škola, radnice, lékárna, banka, knihovna, muzeum, kino, divadlo, stadion, kostel, nádraží, hotel…), s lampami, lavičkami, stromy, keři a kameny.
- **Najetím poznáš věc** — info se ukáže vpravo samo, bez klikání, a slovo se přidá do slovníku.
- **Plynulost:** zaměřování je odlehčené (throttle) a hra si při nízkém FPS sama sníží kvalitu (vypne post‑processing).
- **Vejdeš dovnitř!** Budovy jsou duté — otevři dveře a vejdi (podlaha, interiér). Zavřené dveře blokují, otevřené pustí.
- **Otevíratelné dveře a okna** (animované) u domu i u obchodů.
- **Realističtější grafika:** post‑processing (ambient occlusion + vyhlazení hran SMAA), slunce sledující hráče s ostrými stíny, instancovaná tráva, mraky.
- **Chodící lidé** — chodí po městě a u jména je **napsané, co dělají** (jde do pekárny / pije kávu / odpočívá u fontány…).
- **📒 Slovník** — velká tematicky tříděná databáze (**přes 920 slov**, 30 témat): vyhledávání, řazení (A→Z / rod / úroveň), filtr podle témat. Co objevíš ve světě (najetím), **se sem samo uloží** (odznak „Objevené").
- **📖 Učebnice gramatiky** — 25 kapitol A1 → B2 jako kniha (papírový vzhled, **listování ◀ ▶**), výklad česky + příklady + kvízy: výslovnost, členy, slovesa a časy (présent, passé composé, imparfait, futur, plus‑que‑parfait…), zápor, zájmena, conditionnel, subjonctif, gérondif, trpný rod, souslednost, spojky… Otevřeš ji tlačítkem **📖 Knihovna** nahoře, nebo přímo ve světě (**knihovna** v městě / **kniha na stole** v domě → `E`).
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
