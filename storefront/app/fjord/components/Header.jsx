import { useEffect, useState } from 'react';
import { useCart } from '../cart/CartContext.jsx';

const LINKS = [
  { href: '#produkty', label: 'Produkty' },
  { href: '#konfigurator', label: 'Konfigurátor' },
  { href: '#recenze', label: 'Recenze' },
  { href: '#doprava', label: 'Doprava' },
];

export function Header() {
  const { count, toggle } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container header__inner">
        <a className="brand" href="#top">
          FJORD<sup>°</sup>
        </a>
        <nav className="nav">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="header__actions">
          <button className="cart-btn" onClick={toggle} aria-label="Otevřít košík">
            <span>Košík</span>
            <span className="cart-btn__count">{count}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
