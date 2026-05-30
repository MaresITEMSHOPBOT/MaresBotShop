import { useEffect, useState } from 'react';

// Vrátí true až po připojení na klientu. Slouží k tomu, aby se 3D (Three.js)
// nerenderovalo na serveru (SSR v Hydrogenu) a nevznikal hydratační rozdíl.
export function useIsClient() {
  const [client, setClient] = useState(false);
  useEffect(() => setClient(true), []);
  return client;
}
