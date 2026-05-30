import { useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Odhalování prvků [data-reveal] při scrollu (fade + posun nahoru, se staggerem).
export function useReveal() {
  useEffect(() => {
    const els = gsap.utils.toArray('[data-reveal]');
    if (!els.length) return undefined;

    const ctx = gsap.context(() => {
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.08,
            overwrite: true,
          }),
      });
    });

    // Pojistka: kdyby trigger z jakéhokoli důvodu nesepnul, po 2,5 s ukaž vše.
    const safety = setTimeout(() => {
      gsap.to('[data-reveal]', { opacity: 1, y: 0, duration: 0.5, overwrite: 'auto' });
    }, 2500);

    const refresh = setTimeout(() => ScrollTrigger.refresh(), 350);

    return () => {
      clearTimeout(safety);
      clearTimeout(refresh);
      ctx.revert();
    };
  }, []);
}
