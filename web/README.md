# FJORD° — samostatná (browser) verze

Tatáž 3D aplikace jako v Hydrogenu, ale jako čistá React + Vite appka, kterou
spustíš kdekoli — bez Shopify účtu a bez Shopify CLI.

## Spuštění na PC (v prohlížeči)

```bash
cd web
npm install
npm run dev
```

Otevře se `http://localhost:5173`. (Dev server se pokusí otevřít prohlížeč sám.)

## Statický build (k hostování kdekoli)

```bash
npm run build      # vytvoří web/dist/
npm run preview    # lokální náhled buildu na http://localhost:4173
```

Obsah `dist/` můžeš nahrát na jakýkoli statický hosting (Netlify, Vercel,
GitHub Pages, vlastní server…). Pozn.: kvůli ES modulům aplikaci spouštěj přes
server (`npm run dev` / `npm run preview` / hosting), ne otevřením `index.html`
z disku (`file://`).

## Build pro Shopify motiv

```bash
npm run build:shopify   # vytvoří dist-shopify/fjord.js + fjord.css (1 soubor JS)
```

Tyto dva soubory patří do `../shopify-theme/assets/` (viz `../shopify-theme/README.md`).

## Pozn. k organizaci kódu

Složka `src/fjord/` je **kopií** `../storefront/app/fjord/` (stejné komponenty,
3D scéna, hooky, košík). Když něco upravíš, zkopíruj změnu i do druhého místa,
ať zůstanou synchronní. Sdílený zdroj je záměrně duplikovaný, aby každá varianta
(Hydrogen / samostatná / Shopify motiv) šla buildit nezávisle.
