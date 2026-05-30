import { Fragment } from 'react';

const ITEMS = [
  'Doprava zdarma nad 1 000 Kč',
  'Teplo 24 h',
  'Chlad 48 h',
  'Nerez 18/8',
  'Bez BPA',
  'Doživotní záruka',
  '30 dní na vrácení',
];

function Line({ aria }) {
  return (
    <span aria-hidden={aria ? 'true' : undefined}>
      {ITEMS.map((t, i) => (
        <Fragment key={i}>
          {t}
          <em>✦</em>
        </Fragment>
      ))}
    </span>
  );
}

export function Marquee() {
  return (
    <div className="marquee">
      <div className="marquee__track">
        <Line />
        <Line aria />
      </div>
    </div>
  );
}
