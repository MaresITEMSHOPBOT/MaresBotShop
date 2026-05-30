const FEATURES = [
  {
    icon: '🔥',
    title: 'Teplo 24 h, chlad 48 h',
    text: 'Dvojitá nerezová stěna s vakuem mezi vrstvami drží teplotu od rána do večera. Ranní káva zůstane horká, voda ledová.',
    wide: true,
  },
  {
    icon: '🛡️',
    title: 'Nerez 18/8 (304)',
    text: 'Potravinářská nerez bez pachuti a bez BPA. Žádné plasty v kontaktu s nápojem.',
  },
  {
    icon: '💧',
    title: 'Nepropustné víčko',
    text: 'Vezmi ji do batohu i do kabelky — nevyteče ani kapka.',
  },
  {
    icon: '❄️',
    title: 'Nezapotí se',
    text: 'Vnější stěna zůstává suchá a příjemná na dotek i s ledovou vodou.',
  },
  {
    icon: '♻️',
    title: 'Na celý život',
    text: 'Jedna láhev místo stovek PET lahví. Doživotní záruka na izolaci.',
  },
];

const STATS = [
  { value: '24 h', label: 'udrží teplo' },
  { value: '48 h', label: 'udrží chlad' },
  { value: '12 000+', label: 'spokojených zákazníků' },
  { value: '4,9★', label: 'průměrné hodnocení' },
];

export function Features() {
  return (
    <section className="section" id="proc">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Proč FJORD°</span>
          <h2 className="section__title" data-reveal>
            Detaily, které poznáš každý den
          </h2>
          <p className="section__lead" data-reveal>
            Nejde o módní doplněk. Jde o láhev, která prostě funguje — ráno, v práci, na túře i po
            tréninku.
          </p>
        </div>

        <div className="features__grid">
          {FEATURES.map((f, i) => (
            <article key={i} className={`feature${f.wide ? ' feature--wide' : ''}`} data-reveal>
              <div className="feature__icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>

        <div className="stats">
          {STATS.map((s, i) => (
            <div key={i} className="stat" data-reveal>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
