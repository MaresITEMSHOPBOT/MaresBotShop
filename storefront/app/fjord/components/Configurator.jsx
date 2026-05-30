import { lazy, Suspense, useMemo, useState } from 'react';
import { useIsClient } from '../hooks/useIsClient.js';
import { useCart } from '../cart/CartContext.jsx';
import { COLORS, SIZES, CONFIG_PRODUCT, configPrice } from '../data/products.js';
import { formatCZK } from '../lib/format.js';
import { MagneticButton } from './MagneticButton.jsx';

const ConfiguratorCanvas = lazy(() => import('../three/ConfiguratorCanvas.jsx'));

const SCALE_BY_SIZE = { '05': 0.92, '075': 1.0, '1': 1.08 };

export function Configurator() {
  const isClient = useIsClient();
  const { add } = useCart();
  const [colorKey, setColorKey] = useState(COLORS[1].key);
  const [sizeKey, setSizeKey] = useState('075');
  const [added, setAdded] = useState(false);

  const color = useMemo(() => COLORS.find((c) => c.key === colorKey) || COLORS[0], [colorKey]);
  const size = useMemo(() => SIZES.find((s) => s.key === sizeKey) || SIZES[1], [sizeKey]);
  const price = configPrice(sizeKey);

  const onAdd = () => {
    add({
      key: `${CONFIG_PRODUCT.id}-${sizeKey}-${colorKey}`,
      productId: CONFIG_PRODUCT.id,
      name: CONFIG_PRODUCT.name,
      variant: `${color.name} · ${size.label}`,
      colorHex: color.hex,
      price,
      qty: 1,
    });
    setAdded(true);
    window.clearTimeout(onAdd._t);
    onAdd._t = window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <section className="section" id="konfigurator">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">3D konfigurátor</span>
          <h2 className="section__title" data-reveal>
            Postav si svoji FJORD°
          </h2>
          <p className="section__lead" data-reveal>
            Vyber barvu a objem. Láhev si prohlédni ze všech stran — chyť ji myší a otoč.
          </p>
        </div>

        <div className="config">
          <div className="config__stage" data-reveal>
            {isClient && (
              <Suspense fallback={null}>
                <ConfiguratorCanvas color={color} scale={SCALE_BY_SIZE[sizeKey] || 1} />
              </Suspense>
            )}
            <span className="config__hint">Táhni pro otočení</span>
          </div>

          <div className="config__panel" data-reveal>
            <h2>{CONFIG_PRODUCT.name}</h2>
            <div className="config__price">
              <b>{formatCZK(price)}</b>
              {sizeKey === '075' && CONFIG_PRODUCT.compareAt > price && (
                <del>{formatCZK(CONFIG_PRODUCT.compareAt)}</del>
              )}
            </div>

            <div className="config__row">
              <div className="config__label">
                Barva <span>{color.name}</span>
              </div>
              <div className="swatches">
                {COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className={`swatch${c.key === colorKey ? ' is-active' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setColorKey(c.key)}
                    aria-label={c.name}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="config__row">
              <div className="config__label">
                Objem <span>{size.label}</span>
              </div>
              <div className="sizes">
                {SIZES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    className={`size${s.key === sizeKey ? ' is-active' : ''}`}
                    onClick={() => setSizeKey(s.key)}
                  >
                    {s.label}
                    <small>{s.ml} ml</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="config__buy">
              <MagneticButton className="btn btn--primary btn--lg" onClick={onAdd}>
                {added ? 'Přidáno ✓' : `Do košíku — ${formatCZK(price)}`}
              </MagneticButton>
            </div>

            <div className="config__usp">
              <span>Skladem</span>
              <span>Odesíláme do 24 h</span>
              <span>Doprava zdarma nad 1 000 Kč</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
