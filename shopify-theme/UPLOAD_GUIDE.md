# MARES — Shopify theme: how to upload & preview

Your custom design is a real Shopify theme (`mares-shopify-theme.zip`).
It stays **unpublished** until you decide to go live, so it won't touch your current store.

## Upload
1. Shopify admin → **Online Store → Themes**.
2. Scroll to the bottom → **Add theme → Upload zip file**.
3. Choose **`mares-shopify-theme.zip`** → Upload.
4. It appears under "Theme library" (unpublished).

## Preview / Go live
- **⋯ → Preview** to check it (homepage, Buy Now → checkout, Bazaar).
- **⋯ → Publish** when you're happy. On mareswear.com the whole flow then
  lives on ONE domain: browse → cart → `mareswear.com/checkout`.

## Trust & payments (v1.1)
- Checkout continues in the **same tab** (no popup) straight into Shopify's
  secure checkout — card, Apple/Google Pay, PayPal are handled there. That is
  the only PCI-compliant way to take card payments; no custom page may
  collect card numbers itself.
- The cart shows "Secure checkout · powered by Shopify" + payment badges.
- A trust bar (secure payments, worldwide shipping, zero waste, 5% to the
  planet, 14-day returns) sits above the footer.
- Footer links to `/policies/terms-of-service`, `/policies/privacy-policy`,
  `/policies/refund-policy`, `/policies/shipping-policy` — these URLs are
  served automatically by Shopify **once the policies exist** (see below).

## Create the policies (2 minutes, one-time)
Shopify admin → **Settings → Policies**:
1. **Privacy policy** — already created ✔
2. **Terms of service**, **Return & refund policy**, **Shipping policy** —
   click **Insert template** or paste the prepared texts from the repo's
   `legal/en/` folder, replace the [bracketed] details, Save.
Shopify then auto-links them in the checkout footer too — that's the main
credibility signal customers look for.

## What's inside
```
layout/theme.liquid          — page shell
templates/index.liquid       — homepage → sections/mares-home
sections/mares-home.liquid   — the whole MARES design
assets/mares.css / mares.js  — styles (fonts embedded) + interactions
assets/venus.jpg eyes.png heart.png — print artworks
templates/*                  — required Shopify page stubs
```
