import {lazy, Suspense, useEffect, useState} from 'react';

// Celý 3D zážitek (Three.js + GSAP + Lenis) běží jen na klientu.
const FjordLanding = lazy(() => import('~/fjord/FjordLanding.jsx'));

/**
 * @type {import('react-router').MetaFunction}
 */
export const meta = () => {
  return [
    {title: 'FJORD° — Prémiové nerezové termoláhve | Teplo 24 h, chlad 48 h'},
    {
      name: 'description',
      content:
        'FJORD° — designové nerezové termoláhve a termohrnky. Dvojitá vakuová izolace, nerez 18/8, teplo 24 h a chlad 48 h. Doprava zdarma po ČR nad 1 000 Kč.',
    },
  ];
};

export default function Homepage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // První (serverový) render: lehký obsah pro SEO; 3D se načte na klientu.
    return (
      <div className="fjord-ssr">
        <div>
          <h1>FJORD° — Prémiové nerezové termoláhve</h1>
          <p>
            Teplo až 24 hodin, chlad až 48 hodin. Nerez 18/8, bez BPA, doživotní záruka. Doprava
            zdarma po ČR nad 1 000 Kč.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      <FjordLanding />
    </Suspense>
  );
}
