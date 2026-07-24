# MARES × Shopify — propojení webu s pokladnou (backend režim)

Zvolený režim: **náš web `mares-shop.html` zůstává výlohou, Shopify je jen backend**
(produkty, sklad, pokladna). Tlačítka **Buy Now / Checkout** povedou do Shopify pokladny.

---

## Krok 1 — Mít živý Shopify obchod
Zatím k účtu není připojený žádný obchod. Máš dvě cesty:
- **Claimni jeden z vygenerovaných náhledů** (objeví se v rozhraní Shopify) → rychlá registrace.
- Nebo klasicky **shopify.com → Start free trial**.

Po registraci budeš mít doménu typu `tvuj-obchod.myshopify.com` (a později můžeš připojit
vlastní doménu, např. `mareswear.com`).

## Krok 2 — Nahrát produkty
V Shopify adminu: **Products → Import** → nahraj soubor
[`mares-products-import.csv`](./mares-products-import.csv).

Naimportují se 3 mikiny s velikostmi S–XL:
| Produkt | Cena | Varianty |
|---|---|---|
| Blind Statue Hoodie | 85 € | S, M, L, XL |
| Duality Hoodie | 75 € | S, M, L, XL |
| Planetary Heart Hoodie | 89 € | S, M, L, XL |

Pak u každého produktu nahraj obrázek (můžeš použít vizuály ze složky `social/`
nebo náhledy mikin z webu) a případně uprav sklad.

> Nebo mi napiš, až bude obchod připojený, a produkty **vytvořím přímo přes API já**
> (včetně obrázků) — nebudeš muset nic importovat ručně.

## Krok 3 — Získat údaje pro checkout
Potřebuju dvě věci:
1. **Doménu obchodu** (`tvuj-obchod.myshopify.com`).
2. **ID variant** každé velikosti. Najdeš je v adminu: otevři produkt → variantu →
   v URL je číslo `.../variants/XXXXXXXXXXXXX`. Nebo mi jen řekni, že je obchod
   připojený, a vytáhnu je automaticky.

## Krok 4 — Propojení v kódu (udělám já)
V `mares-shop.html` je připravená konstanta `SHOPIFY`. Vyplní se takto:
```js
const SHOPIFY = {
    domain: 'tvuj-obchod.myshopify.com',
    products: {
        'tee-1': { variantId: '' }, // Blind Statue — vybraná velikost
        'tee-2': { variantId: '' }, // Duality
        'tee-3': { variantId: '' }  // Planetary Heart
    }
};
```
Checkout pak sestaví odkaz `https://<doména>/cart/<variantId>:1` a zákazník jde
rovnou do Shopify pokladny (platby, doprava, faktury řeší Shopify).

## Krok 5 — Slevový kód −10 %
Na webu je slevové oko s kódem **OPENEYES10**. V Shopify adminu:
**Discounts → Create discount → Amount off → 10 %**, kód `OPENEYES10`.
Tím bude kód z webu při pokladně opravdu fungovat.

## Krok 6 — Právní stránky
Do Shopify (**Settings → Policies** a **Online Store → Pages**) vlož texty ze složky
[`../legal/`](../legal): obchodní podmínky, reklamační řád a zásady ochrany osobních údajů.
Shopify je pak automaticky přilinkuje v patičce a v pokladně.
