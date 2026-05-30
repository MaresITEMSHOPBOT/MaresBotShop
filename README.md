# MaresBotShop

Tento repozitář obsahuje:

- **`storefront/`** — **FJORD°**, 3D e-shop s prémiovými nerezovými termoláhvemi.
  Postaveno na **Shopify Hydrogen** (React Router 7 + React 18) s 3D ve **React Three
  Fiber / Three.js** a animacemi v **GSAP + Lenis**. Tohle je hlavní výstup.
- soubory v kořeni (`studium.html`, `app.js`, `data.js`, `styles.css`, `index.html`) —
  starší studijní web k předmětu „organizační chování". S e-shopem nesouvisí a nechal
  jsem je beze změny.

---

## FJORD° — 3D e-shop s termoláhvemi

Tmavý prémiový e-shop v češtině, ceny v Kč, doprava po ČR. Hlavní „wow" prvky:

- **3D hero** s realistickou nerezovou láhví (PBR kov, studiové odrazy), která reaguje
  na pohyb myši a scroll.
- **3D konfigurátor** — vyber barvu a objem, láhev se plynule přebarví a dá se otáčet
  tažením myší.
- **Plynulý (setrvačný) scroll** (Lenis) a **scrollové animace** (GSAP ScrollTrigger):
  postupné odhalování sekcí, běžící lišta, magnetická tlačítka, hover efekty.
- **Funkční košík** (drawer, množství, mezisoučet, doprava zdarma nad 1 000 Kč).

### Proč zrovna termoláhve (výběr produktu)

Zadání bylo najít produkt **mimo kosmetiku a elektroniku**, vhodný pro **český trh**.
Z rešerše (zdroje níže) vyšly nerezové termoláhve / termohrnky jako nejlepší volba:

- **Rostoucí, evergreen poptávka v ČR** — segmenty „dům & zahrada" a „sport/outdoor"
  v české e-commerce rostou; značky jako Stanley a Quokka mají v ČR vlastní obchody
  a táhnou je sociální sítě.
- **Dobrá marže** (~40–60 %) a snadná doprava (lehké, nerozbitné).
- **Ideální pro 3D prezentaci** — válcový tvar, kovové materiály a barvy vyniknou
  v reálném 3D nejvíc ze všech zvažovaných produktů (alternativy byly korkové
  jógamatky, samozavlažovací květináče, ortopedické pelíšky pro psy).

---

## Rychlý start

```bash
cd storefront
npm install        # pokud ještě nemáš nainstalované závislosti
npm run dev        # spustí Hydrogen dev na http://localhost:3000
```

Dev běží na **mock.shop** datech (žádný účet Shopify není potřeba). 3D landing se
načítá na klientu; první (serverové) vykreslení obsahuje textový obsah pro SEO.

Produkční build:

```bash
npm run build
npm run preview
```

---

## Napojení na reálný Shopify obchod

Storefront je psaný tak, aby šel napojit bez přepisu UI:

1. `cd storefront && npx shopify hydrogen link` (přihlásí se k tvému obchodu),
   nebo nastav v `.env` proměnné `PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_API_TOKEN` atd.
2. Katalog FJORD° je teď v `app/fjord/data/products.js`. Pro reálná data koukni na
   připravený konektor `app/fjord/lib/shopify.js` (Storefront API dotaz + `getProducts()`).
3. Pokladnu (`Přejít k pokladně`) napoj na Shopify cart/checkout.

---

## Architektura

```
storefront/
├─ app/
│  ├─ root.jsx              # uklizený root – bez demo chrome, naše CSS, čeština
│  ├─ routes/_index.jsx     # homepage = FJORD° 3D landing (klientsky, + SEO fallback)
│  ├─ styles/fjord.css      # tmavý prémiový design systém
│  └─ fjord/                # CELÁ naše vrstva (přenositelná i mimo Hydrogen)
│     ├─ FjordLanding.jsx   # složí celou stránku
│     ├─ three/             # Three.js: procedurální láhev, scéna, hero + konfigurátor
│     ├─ components/        # Header, Hero, Features, Configurator, Catalog, Reviews, FAQ…
│     ├─ cart/              # klientský košík (React context + localStorage)
│     ├─ hooks/             # Lenis smooth-scroll, GSAP reveal, useIsClient
│     ├─ data/products.js   # katalog (Kč), barvy, velikosti
│     └─ lib/               # formát Kč, Shopify konektor (stub)
└─ … (zbytek je standardní Shopify Hydrogen skeleton)
```

Pozn.: homepage má vlastní hlavičku/patičku i košík, proto na ní nepoužíváme demo
`PageLayout`. Vedlejší demo routy (`/products/...`, `/cart`, …) zůstávají ve skeletu
jako druhotné — hlavní zážitek je homepage.

## Použité technologie

Shopify Hydrogen 2026.4 · React Router 7 · React 18 · Vite · Three.js ·
@react-three/fiber · @react-three/drei · GSAP (ScrollTrigger) · Lenis.

## Zdroje k výběru produktu

- TOP 100 e-shopů ČR 2025 — https://cc.cz/ecommerce-2025/
- Heureka: růst české e-commerce 2025 — https://heureka.group/cz-cs/o-nas/tiskove-centrum/
- Sezónní kategorie (zahrada, hobby, sport) — https://www.ecommercebridge.cz/
- Stanley termosky CZ — https://www.stanleytermosky.cz/
- Quokka termoláhve (Alza/Heureka) — https://www.alza.cz/termohrnky/quokka/
- Evergreen produkty 2025 (láhve, marže) — https://nichedropshipping.com/evergreen-products/
