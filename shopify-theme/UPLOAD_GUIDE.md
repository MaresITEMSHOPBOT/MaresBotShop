# MARES — Shopify theme: how to upload & preview

Your custom design is now a real Shopify theme (`mares-shopify-theme.zip`).
It stays **unpublished** until you decide to go live, so it won't touch your current store.

## Upload
1. Shopify admin → **Online Store → Themes**.
2. Scroll to the bottom → **Add theme → Upload zip file**.
3. Choose **`mares-shopify-theme.zip`** → Upload.
4. It appears under "Theme library" (unpublished).

## Preview
- Next to the uploaded theme → **⋯ → Preview**.
- Check the homepage, the Shop/Bazaar links, Buy Now → Shopify checkout.

## Go live
- When you're happy → **⋯ → Publish**.

## Notes
- The homepage is the full animated MARES experience. Buy Now / checkout go
  straight to Shopify checkout using your product variants — already wired.
- Other pages (product, collection, cart, account…) use minimal branded
  stubs, because customers buy through the custom homepage flow. If you want
  full native Shopify product pages too, tell me and I'll flesh them out.
- Fonts, styles, scripts and the 3 print artworks are split into `assets/`
  so every file stays within Shopify's limits.
- After publishing, if any animation needs a tweak in the live theme, send me
  a screenshot and I'll adjust the theme files.

## What's inside
```
layout/theme.liquid          — page shell (head + body)
templates/index.liquid       — homepage → renders sections/mares-home
sections/mares-home.liquid   — the whole MARES design
assets/mares.css             — all styles + embedded fonts
assets/mares.js              — all interactions (cart, sun, journey, bazaar…)
assets/venus.jpg / eyes.png / heart.png — print artworks
templates/*                  — required Shopify page stubs
config/, locales/            — theme settings & locale
```
