# FJORD° — technická dokumentace

3D vrstva e-shopu žije celá ve složce `app/fjord/` a je záměrně oddělená od
Hydrogen skeletu, aby šla snadno udržovat i přenést jinam.

## Jak je to poskládané

- **`routes/_index.jsx`** je homepage. Na serveru vykreslí lehký SEO fallback
  (`<h1>` + popis); po připojení na klientu `lazy()` načte celý 3D zážitek. Tím se
  Three.js/GSAP/Lenis nikdy nespouští na serveru (žádné problémy s SSR/Oxygen).
- **`fjord/FjordLanding.jsx`** obalí vše do klientského košíku (`CartProvider`),
  zapne plynulý scroll (`useSmoothScroll`) a odhalování sekcí (`useReveal`) a vyrenderuje
  Header → Hero → Marquee → Features → Configurator → Catalog → Reviews → FAQ → Footer
  → CartDrawer.

## 3D (Three.js / React Three Fiber)

- **`three/Bottle.jsx`** — láhev je **procedurální** (žádný stažený GLB model):
  `LatheGeometry` z profilu řezu + víčko, závit a poutko. Materiál `MeshPhysicalMaterial`
  (kov, clearcoat). Barva se plynule „přelévá" (lerp) k cílové.
- **`three/Studio.jsx`** — světla + `Environment` poskládané z `Lightformer`ů
  (HDRI se generuje procedurálně, nic se nestahuje → funguje offline).
- **`three/HeroCanvas.jsx`** — láhev se pomalu otáčí, reaguje na myš (parallax) a na scroll.
- **`three/ConfiguratorCanvas.jsx`** — `OrbitControls` (tažení myší + pomalé samo-otáčení),
  měkký kontaktní stín.

Plátna se načítají přes `lazy()` + `useIsClient`, takže běží jen v prohlížeči.

## Animace a pohyb

- **Lenis** (`hooks/useSmoothScroll.js`) — setrvačný scroll, plynulé skoky na kotvy,
  napojení na GSAP ticker a ScrollTrigger; zároveň plní sdílený `lib/runtime.js`
  (scroll/pointer), který čte 3D scéna.
- **GSAP ScrollTrigger** (`hooks/useReveal.js`) — odhalování prvků s atributem
  `data-reveal` se staggerem; má i bezpečnostní „po 2,5 s ukaž vše".
- **Magnetická tlačítka** (`components/MagneticButton.jsx`).
- Respektuje `prefers-reduced-motion`.

## Košík

`cart/CartContext.jsx` je čistě klientský (React `useReducer` + `localStorage`).
Pro demo je oddělený od Shopify cartu, takže „přidat do košíku" funguje hned.
Tlačítko *Přejít k pokladně* je připravené na napojení na Shopify checkout.

## Úpravy obsahu

- **Produkty / ceny:** `data/products.js` (`PRODUCTS`, `CONFIG_PRODUCT`).
- **Barvy a velikosti konfigurátoru:** `data/products.js` (`COLORS`, `SIZES`).
- **Texty sekcí:** přímo v `components/*.jsx` (Features, Reviews, Faq, Footer…).
- **Design / barvy webu:** `app/styles/fjord.css` (CSS proměnné v `:root`).

## Reálná data ze Shopify

UI je oddělené od zdroje dat. V `lib/shopify.js` je připravený `storefrontFetch()`
i dotaz `PRODUCTS_QUERY`; stačí doplnit doménu + Storefront token a vyměnit
`getProducts()`. Komponenty ani 3D se měnit nemusí.

## Známá omezení (prototyp)

- Homepage je klientsky renderovaná (kvůli WebGL). Pro plné SSR/SEO by šel hero
  vykreslit i staticky — fallback v `_index.jsx` je první krok.
- Vedlejší demo routy ze skeletu (`/products/...`, `/cart`, účet) nejsou stylované
  do FJORD° vzhledu — hlavní zážitek je homepage.
