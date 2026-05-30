import { PRODUCTS } from '../data/products.js';
import { formatCZK } from '../lib/format.js';
import { useCart } from '../cart/CartContext.jsx';

export function Catalog() {
  const { add } = useCart();

  const onAdd = (p) =>
    add({
      key: `${p.id}-default`,
      productId: p.id,
      name: p.name,
      variant: p.desc,
      colorHex: p.colorHex,
      price: p.price,
      qty: 1,
    });

  return (
    <section className="section" id="produkty">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Kolekce</span>
          <h2 className="section__title" data-reveal>
            Termoláhve a hrnky FJORD°
          </h2>
          <p className="section__lead" data-reveal>
            Od kabelkové Mini po túrovou Summit — pro každý den i každé dobrodružství.
          </p>
        </div>

        <div className="catalog__grid">
          {PRODUCTS.map((p) => (
            <article key={p.id} className="card" data-reveal>
              <div className="card__media">
                {p.badge && <span className="card__tag">{p.badge}</span>}
                <div
                  className="card__bottle"
                  style={{ background: `linear-gradient(150deg, ${p.colorHex}, #0c0d10)` }}
                />
              </div>
              <div className="card__body">
                <div className="card__name">{p.name}</div>
                <div className="card__desc">{p.desc}</div>
                <div className="card__foot">
                  <div className="card__price">
                    <b>{formatCZK(p.price)}</b>
                    {p.compareAt && <del>{formatCZK(p.compareAt)}</del>}
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onAdd(p)}
                    aria-label={`Přidat ${p.name} do košíku`}
                  >
                    +
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
