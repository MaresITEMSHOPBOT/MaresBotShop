import { useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Odhalování prvků [data-reveal] při scrollu (fade + posun nahoru, se staggerem).
export function useReveal() {
  useEffect(() => {
    // Aktivuj „skrýt pro animaci" stav (CSS to čte z html.fjord-anim).
    // Děláme to z JS, takže bez funkčního JS obsah nikdy nezůstane skrytý.
    const root = document.documentElement;
    root.classList.add('fjord-anim');

    const els = gsap.utils.toArray('[data-reveal]');
    if (!els.length) {
      root.classList.remove('fjord-anim');
      return undefined;
    }

    // Prvky, které jsou hned po načtení ve viewportu, odhal okamžitě (žádné
    // čekání na scroll) — jinak hrozí „přeházený"/prázdný dojem nad ohybem.
    const revealNow = (el) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight * 0.92;
    };

    const ctx = gsap.context(() => {
      els.forEach((el) => {
        if (revealNow(el)) {
          gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', overwrite: true });
          return;
        }
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          overwrite: true,
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
      });
    });

    // Tvrdá pojistka: kdyby ScrollTrigger z jakéhokoli důvodu nesepnul
    // (např. plynulý scroll ještě neproměřil stránku), po 1,2 s ukaž vše.
    const safety = setTimeout(() => {
      gsap.set('[data-reveal]', { opacity: 1, y: 0 });
    }, 1200);

    const refresh = setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      clearTimeout(safety);
      clearTimeout(refresh);
      ctx.revert();
      root.classList.remove('fjord-anim');
    };
  }, []);
}
