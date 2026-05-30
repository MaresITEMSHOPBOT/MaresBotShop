import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { scrollState, pointerState } from '../lib/runtime.js';

gsap.registerPlugin(ScrollTrigger);

// Plynulý (setrvačný) scroll přes Lenis, napojený na GSAP ticker a ScrollTrigger.
// Plní sdílený scrollState / pointerState pro 3D a řeší plynulé skoky na kotvy.
export function useSmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: !reduce,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });

    const onScroll = (e) => {
      scrollState.y = e.scroll;
      scrollState.progress = e.progress;
      scrollState.velocity = e.velocity;
      ScrollTrigger.update();
    };
    lenis.on('scroll', onScroll);

    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const onPointer = (e) => {
      pointerState.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerState.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    // Plynulé skoky na kotvy (#id) se započtením výšky fixní hlavičky.
    const onClick = (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.length < 2) return;
      const el = document.querySelector(href);
      if (el) {
        e.preventDefault();
        lenis.scrollTo(el, { offset: -72 });
      }
    };
    document.addEventListener('click', onClick);

    const tid = setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      clearTimeout(tid);
      gsap.ticker.remove(raf);
      lenis.off('scroll', onScroll);
      lenis.destroy();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('click', onClick);
    };
  }, []);
}
