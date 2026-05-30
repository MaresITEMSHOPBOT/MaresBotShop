export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <a className="brand" href="#top">
              FJORD<sup>°</sup>
            </a>
            <p>
              Prémiové nerezové termoláhve navržené v Česku. Teplo 24 h, chlad 48 h, vyrobeno na celý
              život.
            </p>
          </div>

          <div>
            <h4>Obchod</h4>
            <ul>
              <li><a href="#produkty">Termoláhve</a></li>
              <li><a href="#produkty">Termohrnky</a></li>
              <li><a href="#konfigurator">Konfigurátor</a></li>
              <li><a href="#produkty">Dárkové sety</a></li>
            </ul>
          </div>

          <div>
            <h4>Zákazník</h4>
            <ul>
              <li><a href="#doprava">Doprava a platba</a></li>
              <li><a href="#doprava">Vrácení zboží</a></li>
              <li><a href="#doprava">Reklamace</a></li>
              <li><a href="#recenze">Recenze</a></li>
            </ul>
          </div>

          <div>
            <h4>Kontakt</h4>
            <ul>
              <li><a href="mailto:ahoj@fjord.cz">ahoj@fjord.cz</a></li>
              <li><a href="tel:+420700000000">+420 700 000 000</a></li>
              <li><a href="#top">Instagram</a></li>
              <li><a href="#top">Facebook</a></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {year} FJORD°. IČO 123 45 678 · Praha, ČR.</span>
          <span>Obchodní podmínky · Ochrana osobních údajů (GDPR)</span>
        </div>
      </div>
    </footer>
  );
}
