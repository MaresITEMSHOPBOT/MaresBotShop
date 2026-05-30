import { lazy, Suspense } from 'react';
import { useIsClient } from '../hooks/useIsClient.js';
import { MagneticButton } from './MagneticButton.jsx';

// 3D plátno se načítá jen na klientovi (dynamický import) — žádné Three.js na serveru.
const HeroCanvas = lazy(() => import('../three/HeroCanvas.jsx'));

export function Hero() {
  const isClient = useIsClient();

  return (
    <section className="hero" id="top">
      <div className="hero__glow" />
      <div className="hero__canvas" aria-hidden="true">
        {isClient && (
          <Suspense fallback={null}>
            <HeroCanvas />
          </Suspense>
        )}
      </div>

      <div className="container hero__inner">
        <div className="hero__content">
          <span className="eyebrow">Nerez 18/8 · dvojitá vakuová izolace</span>
          <h1>
            Tvůj nápoj. <span className="text-grad">Tvoje teplota.</span> Celý den.
          </h1>
          <p className="hero__sub">
            Prémiové nerezové termoláhve FJORD°. Teplo až 24 hodin, chlad až 48 hodin.
            Navrženo v Česku, vyrobeno na celý život.
          </p>
          <div className="hero__cta">
            <MagneticButton as="a" href="#konfigurator" className="btn btn--primary btn--lg">
              Sestav si láhev
            </MagneticButton>
            <a className="btn btn--lg" href="#produkty">
              Prohlédnout kolekci
            </a>
          </div>
          <div className="hero__meta">
            <div>
              <b>24 h</b>
              <span>udrží teplo</span>
            </div>
            <div>
              <b>48 h</b>
              <span>udrží chlad</span>
            </div>
            <div>
              <b>4,9★</b>
              <span>2 300+ recenzí</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hero__scroll">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  );
}
