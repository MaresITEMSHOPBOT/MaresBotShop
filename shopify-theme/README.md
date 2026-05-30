# FJORD° — Shopify motiv (uploadable)

Minimální Shopify motiv, jehož úvodní stránka je 3D FJORD° landing (hero,
konfigurátor, katalog, košík). 3D běží z jednoho přibaleného bundle souboru.

## 1) Vytvoř bundle (jednorázově / po změnách)

```bash
cd ../web
npm install
npm run build:shopify
```

Tím vzniknou `web/dist-shopify/fjord.js` a `fjord.css`. Zkopíruj je do `assets/`:

```bash
cp dist-shopify/fjord.js  ../shopify-theme/assets/fjord.js
cp dist-shopify/fjord.css ../shopify-theme/assets/fjord.css
```

(V tomto repu už jsou zkopírované verze přiložené, takže krok můžeš přeskočit,
dokud nebudeš měnit obsah/3D.)

## 2) Nahrání do Shopify

### A) Přes admin (nejjednodušší)
1. Zazipuj **obsah** složky `shopify-theme/` tak, aby složky `layout/`,
   `templates/`, `sections/`, `config/`, `locales/`, `assets/` byly v kořeni zipu.
2. V Shopify adminu jdi do **Online Store → Themes → Add theme → Upload zip file**.
3. Po nahrání dej **Customize** / **Publish**.

```bash
# příklad zazipování (z této složky):
cd shopify-theme
zip -r ../fjord-theme.zip . -x ".*"
```

### B) Přes Shopify CLI
```bash
cd shopify-theme
shopify theme push        # nahraje do vybraného obchodu
# nebo náhled:
shopify theme dev
```

## Jak to funguje

- `templates/index.liquid` renderuje sekci `sections/fjord-3d.liquid`.
- Sekce vloží `<div id="fjord-root">`, načte `assets/fjord.css` a `assets/fjord.js`.
- `fjord.js` je soběstačný React + Three.js bundle, který do toho divu připojí
  celý FJORD° zážitek.
- Sekce má `preset`, takže ji jde přidat i na jiné stránky přes editor motivu.

## Poznámky / omezení

- Je to **prototyp prezentace** (3D landing). Reálné produkty, košík a pokladnu
  Shopify napoj buď přes tento motiv (Liquid + Shopify cart), nebo použij
  headless variantu `../storefront` (Hydrogen) — viz hlavní `../README.md`.
- Bundle obsahuje React i Three.js, takže je větší. Pro produkci zvaž lazy-load
  sekce jen na stránkách, kde ji opravdu chceš.
