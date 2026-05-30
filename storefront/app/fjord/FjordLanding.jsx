import { CartProvider } from './cart/CartContext.jsx';
import { useSmoothScroll } from './hooks/useSmoothScroll.js';
import { useReveal } from './hooks/useReveal.js';
import { Header } from './components/Header.jsx';
import { Hero } from './components/Hero.jsx';
import { Marquee } from './components/Marquee.jsx';
import { Features } from './components/Features.jsx';
import { Configurator } from './components/Configurator.jsx';
import { Catalog } from './components/Catalog.jsx';
import { Reviews } from './components/Reviews.jsx';
import { Faq } from './components/Faq.jsx';
import { Footer } from './components/Footer.jsx';
import { CartDrawer } from './components/CartDrawer.jsx';

function Experience() {
  useSmoothScroll();
  useReveal();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Marquee />
        <Features />
        <Configurator />
        <Catalog />
        <Reviews />
        <Faq />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}

// Celá 3D landing stránka FJORD°. Cart je čistě klientský (localStorage),
// takže komponenta je soběstačná a jde vložit do libovolné Hydrogen/Remix routy.
export default function FjordLanding() {
  return (
    <CartProvider>
      <Experience />
    </CartProvider>
  );
}
