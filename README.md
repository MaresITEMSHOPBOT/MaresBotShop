# MaresBotShop

Dvě samostatné webové aplikace, každá funguje offline v prohlížeči (data se ukládají do `localStorage`).

## 📅 Kontrola dat spotřeby – `spotreba.html`

Evidence artiklů a hlídání jejich data spotřeby. Stačí otevřít soubor `spotreba.html` v prohlížeči
(funguje i na mobilu, žádný server není potřeba).

**Postup práce:**

1. **Přidat artikl** – EAN, číslo artiklu, název, *nejhorší datum spotřeby* (nejbližší datum, které je
   na prodejně) a počet dní pro upozornění (výchozí 7).
2. **Upozornění** – jakmile do data spotřeby zbývá zadaný počet dní **včetně dnešního dne**
   (7 dní = datum spotřeby je za 6 dní), artikl se objeví v horním hlášení, ve stavu „Ke kontrole“,
   v počítadle u záložky i jako upozornění prohlížeče (pokud je povolíš v Nastavení).
3. **Kontrola** – tlačítkem *Zkontrolovat* se odpoví:
   - je na prodejně zboží s tímto datem? **ano / ne**
   - pokud ano: byla nalepena **sleva**? ano / ne
   - nakonec se zadá **nové nejhorší datum spotřeby** (nebo „datum teď neznám“)
4. Celá kontrola se uloží do historie a hlídání pokračuje s novým datem.

Další funkce: hledání a filtry, úprava a mazání artiklů, historie všech kontrol, tisk seznamu ke
kontrole, export do JSON (záloha) i CSV (Excel) a import zálohy na jiné zařízení, světlý/tmavý režim.

## 📚 Organizační chování – studijní příručka

- `index.html` + `app.js` + `data.js` + `styles.css` – studijní web s teorií, ABCD testy a otevřenými otázkami
- `studium.html` – tentýž web zabalený do jediného souboru

**Online verze:** aplikace je zveřejněná i jako hostovaná stránka, takže jde otevřít přímo v mobilu
bez stahování souboru. Data se ukládají zvlášť v každém prohlížeči/zařízení – přenos mezi zařízeními
se dělá exportem a importem zálohy.
