// Formátování ceny do české koruny: 1 090 Kč (s pevnou mezerou a bez haléřů).
const czk = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'CZK',
  maximumFractionDigits: 0,
});

export function formatCZK(value) {
  return czk.format(value);
}
