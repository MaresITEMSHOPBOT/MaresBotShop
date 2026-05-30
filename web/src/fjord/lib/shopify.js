/* =========================================================================
   Shopify Storefront API — připravený konektor (zatím běží na lokálních datech)
   -------------------------------------------------------------------------
   Storefront je psaný tak, aby šel napojit na Shopify bez přepisu UI: stačí
   doplnit doménu + Storefront API token a vyměnit `getProducts()` za reálný
   `storefrontFetch()`. 3D i komponenty zůstávají beze změny.
   ========================================================================= */

import { PRODUCTS } from '../data/products.js';

// Pozn.: v Hydrogenu čti tokeny ze serverového env (context.env), ne z import.meta.
const ENV = (typeof import.meta !== 'undefined' && import.meta.env) || {};
const DOMAIN = ENV.VITE_SHOPIFY_DOMAIN; // např. "muj-obchod.myshopify.com"
const TOKEN = ENV.VITE_SHOPIFY_TOKEN;
const API_VERSION = '2024-10';

export const isShopifyConfigured = Boolean(DOMAIN && TOKEN);

export async function storefrontFetch(query, variables = {}) {
  if (!isShopifyConfigured) {
    throw new Error('Shopify není nakonfigurováno – chybí doména / Storefront token.');
  }
  const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

export const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!) {
    products(first: $first) {
      nodes {
        id
        title
        handle
        priceRange { minVariantPrice { amount currencyCode } }
        variants(first: 10) { nodes { id title availableForSale } }
      }
    }
  }
`;

// Jednotné API pro zbytek appky. Dnes vrací lokální katalog.
export async function getProducts() {
  return PRODUCTS;
}
