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
| Interakce | zaměř věc/postavu křížkem uprostřed a **klikni** nebo stiskni `E` |
| Vyslovit zaměřené | `F` |
| Mluvit s postavou (💬) | zaměř ji a klikni → dialog s výběrem odpovědí |

**Fyzika:** zdmi, nábytkem ani stromy neprojdeš — okolo nich se kloužeš.

**Barvy členů:** 🔵 `le / un` = mužský rod · 🔴 `la / une` = ženský rod · 🟢 `les / des` = množné číslo.

## 📚 Co appka obsahuje

- **3D svět** s ~40 popsanými objekty (nábytek, zvířata, jídlo, příroda…), každý se členem a rodem.
- **Vylepšená grafika:** realistická obloha (Sky shader), měkké stíny, tone‑mapping, texturovaná tráva a cesta, mraky, hezčí stromy a budovy.
- **FPS ovládání myší** (Pointer Lock) a **kolize** — neprojdeš zdmi ani nábytkem.
- **Mluvené situace** s postavami: seznámení (A1), pekařství (A1), kavárna (A2), trh (B1) — vše se čte nahlas, s výběrem odpovědí.
- **Lekce A1 → B2** (gramatika česky + příklady + kvízy): výslovnost, členy, être/avoir, slovesa -ER, čísla, otázky, passé composé, imparfait, budoucí čas, zvratná slovesa, stupňování, předmětová zájmena, conditionnel, subjonctif, vztažná zájmena, trpný rod, souslednost, spojovací výrazy…
- **Opakování slovíček** formou kartiček s jednoduchým rozloženým opakováním (SRS).
- **Pokrok a XP** se automaticky ukládají do prohlížeče (localStorage).

## ➕ Jak přidat vlastní obsah

Vše je v jednom souboru `francouzstina.html`, v sekci `<script type="module">`:

- **Nová slovíčka:** přidej položku do pole `VOCAB`
  (`fr`, `art`, `g` = m/f/pl, `cs`, `cz` = výslovnost, `type` = tvar, `pos` = [x,y,z], `ex`/`exCs`).
- **Nové situace/dialogy:** přidej do objektu `DIALOGUES` a postavu do `NPCS`.
- **Nové lekce:** přidej do pole `LESSONS` (`level`, `title`, `html`, `ex`, `quiz`).

> Pozn.: appka je samostatná a nesouvisí s ostatními soubory v repu.
