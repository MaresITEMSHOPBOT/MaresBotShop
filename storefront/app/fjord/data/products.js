// Katalog FJORD° — nerezové termoláhve a termohrnky. Ceny v Kč.
// Barvy slouží zároveň pro 3D konfigurátor (PBR) i pro CSS náhledy v kartách.

export const COLORS = [
  { key: 'grafit', name: 'Grafit', hex: '#2c2e33', metalness: 0.9, roughness: 0.35 },
  { key: 'pulnoc', name: 'Půlnoční modř', hex: '#24314f', metalness: 0.92, roughness: 0.32 },
  { key: 'med', name: 'Měděná', hex: '#a9663f', metalness: 1.0, roughness: 0.28 },
  { key: 'salvej', name: 'Šalvěj', hex: '#7c8a6f', metalness: 0.7, roughness: 0.45 },
  { key: 'krem', name: 'Krémová', hex: '#e7dccb', metalness: 0.5, roughness: 0.55 },
  { key: 'vinova', name: 'Vínová', hex: '#6e2438', metalness: 0.85, roughness: 0.38 },
];

export const SIZES = [
  { key: '05', label: '0,5 l', ml: 500, priceDelta: -150 },
  { key: '075', label: '0,75 l', ml: 750, priceDelta: 0 },
  { key: '1', label: '1 l', ml: 1000, priceDelta: 200 },
];

// Produkt v konfigurátoru (skládá se z barvy + velikosti).
export const CONFIG_PRODUCT = {
  id: 'fjord-classic',
  name: 'FJORD° Classic',
  basePrice: 899, // odpovídá velikosti 0,75 l
  compareAt: 1090,
};

export function configPrice(sizeKey) {
  const size = SIZES.find((s) => s.key === sizeKey) || SIZES[1];
  return CONFIG_PRODUCT.basePrice + size.priceDelta;
}

// Katalog do mřížky produktů.
export const PRODUCTS = [
  {
    id: 'fjord-classic',
    name: 'FJORD° Classic',
    desc: '0,75 l · každodenní klasika',
    price: 899,
    compareAt: 1090,
    colorHex: '#2c2e33',
    badge: 'Bestseller',
    keepHot: 24,
    keepCold: 48,
  },
  {
    id: 'fjord-trail',
    name: 'FJORD° Trail',
    desc: '1 l · na výlety a do hor',
    price: 1099,
    colorHex: '#24314f',
    badge: 'Novinka',
    keepHot: 24,
    keepCold: 48,
  },
  {
    id: 'fjord-mini',
    name: 'FJORD° Mini',
    desc: '0,5 l · do kabelky i do školy',
    price: 749,
    colorHex: '#7c8a6f',
    keepHot: 18,
    keepCold: 36,
  },
  {
    id: 'fjord-mug',
    name: 'FJORD° Mug',
    desc: 'Termohrnek 0,35 l · do auta',
    price: 699,
    colorHex: '#a9663f',
    badge: 'Do auta',
    keepHot: 12,
    keepCold: 24,
  },
  {
    id: 'fjord-summit',
    name: 'FJORD° Summit',
    desc: '1,2 l · maximální výdrž',
    price: 1290,
    compareAt: 1490,
    colorHex: '#6e2438',
    badge: 'XL',
    keepHot: 30,
    keepCold: 56,
  },
  {
    id: 'fjord-daily',
    name: 'FJORD° Daily',
    desc: '0,6 l · do práce',
    price: 849,
    colorHex: '#e7dccb',
    keepHot: 20,
    keepCold: 40,
  },
];
