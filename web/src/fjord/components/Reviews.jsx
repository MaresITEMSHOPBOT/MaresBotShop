const REVIEWS = [
  {
    name: 'Tereza K.',
    city: 'Brno',
    stars: 5,
    text: 'Ráno si naliju čaj a v práci je v poledne pořád horký. Konečně láhev, co fakt drží teplo.',
  },
  {
    name: 'Martin Hájek',
    city: 'Praha',
    stars: 5,
    text: 'Vzal jsem Summit na Sněžku, voda ledová i po celém dni. Kvalita za super peníze.',
  },
  {
    name: 'Lucie N.',
    city: 'Ostrava',
    stars: 5,
    text: 'Nádherná barva (šalvěj) a v kabelce vůbec nevyteče. Kupuju druhou jako dárek.',
  },
];

function initials(name) {
  return name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function Reviews() {
  return (
    <section className="section" id="recenze">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Recenze · 4,9 ★ z 2 300+</span>
          <h2 className="section__title" data-reveal>
            Zákazníci FJORD° mluví jasně
          </h2>
        </div>

        <div className="reviews__grid">
          {REVIEWS.map((r, i) => (
            <article key={i} className="review" data-reveal>
              <div className="review__stars">{'★'.repeat(r.stars)}</div>
              <p>„{r.text}"</p>
              <div className="review__who">
                <div className="review__avatar">{initials(r.name)}</div>
                <div>
                  <b>{r.name}</b>
                  <span>{r.city} · ověřený nákup</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
