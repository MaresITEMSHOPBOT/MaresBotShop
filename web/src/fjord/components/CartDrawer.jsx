import { useState } from 'react';
import { useCart } from '../cart/CartContext.jsx';
import { formatCZK } from '../lib/format.js';

const FREE_SHIPPING = 1000;

export function CartDrawer() {
  const { items, isOpen, close, setQty, remove, subtotal, count } = useCart();
  const [msg, setMsg] = useState('');
  const remaining = Math.max(0, FREE_SHIPPING - subtotal);

  return (
    <>
      <div className={`overlay${isOpen ? ' is-open' : ''}`} onClick={close} />
      <aside className={`drawer${isOpen ? ' is-open' : ''}`} aria-hidden={!isOpen}>
        <div className="drawer__head">
          <h3>Košík ({count})</h3>
          <button className="drawer__close" onClick={close} aria-label="Zavřít košík">
            ×
          </button>
        </div>

        <div className="drawer__body">
          {items.length === 0 ? (
            <div className="drawer__empty">
              <p>Košík je zatím prázdný.</p>
              <p style={{ marginTop: 8, fontSize: 13 }}>
                Vyber si láhev v konfigurátoru nebo v kolekci.
              </p>
            </div>
          ) : (
            items.map((i) => (
              <div className="line-item" key={i.key}>
                <div className="line-item__media">
                  <div
                    className="line-item__pill"
                    style={{ background: `linear-gradient(150deg, ${i.colorHex || '#2c2e33'}, #0c0d10)` }}
                  />
                </div>
                <div>
                  <div className="line-item__name">{i.name}</div>
                  <div className="line-item__variant">{i.variant}</div>
                  <div className="qty">
                    <button onClick={() => setQty(i.key, i.qty - 1)} aria-label="Ubrat kus">
                      –
                    </button>
                    <span>{i.qty}</span>
                    <button onClick={() => setQty(i.key, i.qty + 1)} aria-label="Přidat kus">
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <div className="line-item__price">{formatCZK(i.price * i.qty)}</div>
                  <button className="line-item__remove" onClick={() => remove(i.key)}>
                    Odebrat
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer__foot">
            <div className="drawer__row">
              <span>
                {remaining > 0
                  ? `Do dopravy zdarma zbývá ${formatCZK(remaining)}`
                  : 'Máš dopravu zdarma 🎉'}
              </span>
            </div>
            <div className="drawer__total">
              <span>Mezisoučet</span>
              <b>{formatCZK(subtotal)}</b>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--block btn--lg"
              onClick={() => setMsg('Pokladna se napojí po propojení se Shopify (Storefront API / checkout).')}
            >
              Přejít k pokladně
            </button>
            {msg && <p className="drawer__note">{msg}</p>}
            <p className="drawer__note">Bezpečná platba · Doprava po celé ČR</p>
          </div>
        )}
      </aside>
    </>
  );
}
