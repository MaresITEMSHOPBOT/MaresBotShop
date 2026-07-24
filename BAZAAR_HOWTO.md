# MARES Bazaar — how to add a pre-owned piece

The bazaar on the site is now driven by a real Shopify collection called
**Bazaar** (handle `bazaar`). It fills itself automatically: **any product
tagged `bazaar` appears there.** Nothing is hardcoded, nothing lives only in
your browser, and customers buy pre-owned pieces through the same cart and
checkout as everything else.

## Add a piece (2 minutes, from phone or laptop)

Shopify admin → **Products → Add product**

| Field | What to put |
|---|---|
| **Title** | e.g. `Blind Statue Hoodie — pre-owned` |
| **Description** | One honest line: `Worn twice, no flaws.` (shown on the card, first ~90 chars) |
| **Media** | Photograph the actual piece — this is the card image |
| **Price** | Your second-hand price, e.g. `1290` |
| **Compare-at price** | The original price, e.g. `2190` — the card then shows it struck through |
| **Inventory → Quantity** | **1** (it's one of a kind) |
| **Inventory** | Tick *Track quantity*, untick *Continue selling when out of stock* |
| **Tags** | `bazaar` ← **required**, plus `size:L` and `cond:Like new` |

**Save.** Done — the piece is on the site.

### The two optional tags

- `size:L` → card shows "Size L"
- `cond:Like new` → card shows the condition badge (top-left) and "· Like new"

Use any wording you like after the colon: `cond:Very good`, `cond:Good`,
`size:XL`. If you skip them the card still works, it just shows less.

## When it sells

Nothing to do. Quantity drops to 0, the card automatically flips to a grey
**Sold** badge and the button disappears. To hide it completely, set the
product's status to **Archived**.

## Removing a piece

Either delete the `bazaar` tag (it leaves the collection but stays in your
catalogue) or archive/delete the product.

## Note on the standalone `mares-shop.html`

That file is the design preview and cannot talk to Shopify, so its bazaar is
always empty and its admin panel only saves to your own browser. The live
bazaar is the Shopify theme.
