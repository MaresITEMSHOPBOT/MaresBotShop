import { useState } from 'react';

const DELIVERY = [
  { ico: '📦', title: 'Zásilkovna — 59 Kč', text: 'Na výdejní místo obvykle do 1–2 pracovních dnů.' },
  { ico: '🚚', title: 'PPL kurýr — 89 Kč', text: 'Až ke dveřím následující pracovní den.' },
  { ico: '💵', title: 'Dobírka — +30 Kč', text: 'Zaplať až při převzetí, kartou i hotově.' },
  { ico: '🎁', title: 'Doprava zdarma', text: 'U objednávek nad 1 000 Kč po celé ČR.' },
];

const FAQ = [
  {
    q: 'Jak dlouho láhev udrží teplotu?',
    a: 'Podle modelu 12–30 h teplo a 24–56 h chlad. Model Classic drží 24 h teplo a 48 h chlad.',
  },
  {
    q: 'Můžu láhev dát do myčky?',
    a: 'Doporučujeme ruční mytí, aby povrch i izolace vydržely co nejdéle. Víčko rozeber a propláchni.',
  },
  {
    q: 'Jaká je záruka?',
    a: 'Zákonná záruka 24 měsíců a navíc doživotní záruka na vakuovou izolaci.',
  },
  {
    q: 'Jak rychle doručíte?',
    a: 'Skladem expedujeme do 24 hodin, na výdejní místo zásilka dorazí obvykle do 1–2 pracovních dnů.',
  },
  {
    q: 'Mohu zboží vrátit?',
    a: 'Ano, máš 30 dní na vrácení bez udání důvodu.',
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="section" id="doprava">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Doprava & časté dotazy</span>
          <h2 className="section__title" data-reveal>
            Doručíme rychle po celé ČR
          </h2>
        </div>

        <div className="faq__layout">
          <div className="delivery" data-reveal>
            {DELIVERY.map((d, i) => (
              <div className="delivery__item" key={i}>
                <span className="ico">{d.ico}</span>
                <div>
                  <b>{d.title}</b>
                  <p>{d.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="faq__list" data-reveal>
            {FAQ.map((f, i) => (
              <div className={`faq__item${open === i ? ' is-open' : ''}`} key={i}>
                <button
                  type="button"
                  className="faq__q"
                  onClick={() => setOpen(open === i ? -1 : i)}
                  aria-expanded={open === i}
                >
                  {f.q}
                  <i />
                </button>
                <div className="faq__a">
                  <p>{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
