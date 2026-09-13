# MaresBotShop

Dvě samostatné webové aplikace, každá funguje offline v prohlížeči (data se ukládají do `localStorage`).

## 📅 Kontrola dat spotřeby – `spotreba.html`

Evidence artiklů a hlídání jejich data spotřeby. Stačí otevřít soubor `spotreba.html` v prohlížeči
(funguje i na mobilu, žádný server není potřeba).

**Postup práce:**

1. **Přidat artikl** – EAN, číslo artiklu, název, *nejhorší datum spotřeby* (nejbližší datum, které je
   na prodejně), počet dní pro upozornění (výchozí 7) a volitelně **vlastní kategorie**
   (např. „Chlazení“, „Pečivo“, „Regál 12“) – tu lze vytvořit rovnou ve formuláři nebo v Nastavení.
2. **Upozornění** – jakmile do data spotřeby zbývá zadaný počet dní **včetně dnešního dne**
   (7 dní = datum spotřeby je za 6 dní), artikl se objeví v horním hlášení, ve stavu „Ke kontrole“,
   v počítadle u záložky i jako upozornění prohlížeče (pokud je povolíš v Nastavení).
3. **Kontrola** – tlačítkem *Zkontrolovat* se odpoví:
   - je na prodejně zboží s tímto datem? **ano / ne**
   - pokud ano: byla nalepena **sleva**? ano / ne
   - nakonec se zadá **nové nejhorší datum spotřeby** (nebo „datum teď neznám“)
4. Celá kontrola se uloží do historie a hlídání pokračuje s novým datem.

**Vyřazení z prodeje:** artikl, který se už neprodává, lze označit tlačítkem *Vyřadit z prodeje*
(nebo rovnou při kontrole volbou „Vyřazeno z prodeje“). Přestane se hlídat a hlásit, ale zůstane
uložený i s celou historií – najdeš ho pod filtrem *Vyřazené* a kdykoli ho lze vrátit do prodeje.

Kategorie se u artiklu zobrazují jako barevný štítek, dají se podle nich filtrovat i vyhledávat a v
Nastavení je lze přejmenovat, přebarvit nebo smazat (artikly zůstanou zachované, jen bez kategorie).

Další funkce: hledání a filtry, úprava a mazání artiklů, historie všech kontrol, tisk seznamu ke
kontrole, export do JSON (záloha) i CSV (Excel) a import zálohy na jiné zařízení, světlý/tmavý režim.

## 📚 Organizační chování – studijní příručka

- `index.html` + `app.js` + `data.js` + `styles.css` – studijní web s teorií, ABCD testy a otevřenými otázkami
- `studium.html` – tentýž web zabalený do jediného souboru

### Otevírání jako aplikace

Aplikace je připravená jako PWA (`manifest.webmanifest`, `sw.js`, ikony), takže jde nainstalovat na
plochu telefonu i na počítač a běží pak ve vlastním okně bez adresního řádku, i bez internetu.
Podmínkou je, aby byla otevřená přes `https://` – nejjednodušeji přes GitHub Pages:

1. v repozitáři **Settings → Pages**
2. *Source*: **Deploy from a branch**, větev `claude/article-expiry-tracking-app-4tr5az`, složka `/ (root)`
3. po chvíli běží na `https://maresitemshopbot.github.io/MaresBotShop/spotreba.html`
4. v prohlížeči pak **Přidat na plochu / Instalovat aplikaci** (tlačítko je i v aplikaci
   v Nastavení → *Otevřít jako aplikaci*)

Bez instalace stačí soubor `spotreba.html` stáhnout a otevřít v prohlížeči – funguje i takto,
jen bez vlastní ikony a okna.

### Synchronizace mezi zařízeními

Ve verzi hostované u Claude se artikly, kategorie i historie kontrol ukládají do sdíleného úložiště,
takže mobil i počítač vidí to samé. Artikly zadané dřív (jen v zařízení) se při připojení automaticky
nahrají nahoru; artikly se stejným EAN a číslem artiklu se nezdvojí. Verze otevřená ze souboru nebo
z GitHub Pages sdílené úložiště nemá – ukládá do zařízení a funguje offline, přenos přes export/import.

**Online verze:** aplikace je zveřejněná i jako hostovaná stránka, takže jde otevřít přímo v mobilu
bez stahování souboru. Data se ukládají zvlášť v každém prohlížeči/zařízení – přenos mezi zařízeními
se dělá exportem a importem zálohy.
