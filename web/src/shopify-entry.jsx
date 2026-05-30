import {createRoot} from 'react-dom/client';
import FjordLanding from './fjord/FjordLanding.jsx';
import './fjord/styles/global.css';

// Vstupní bod pro Shopify motiv: připojí FJORD° landing do <div id="fjord-root">,
// který vykreslí Liquid sekce sections/fjord-3d.liquid.
function mount() {
  const el = document.getElementById('fjord-root');
  if (el && !el.dataset.mounted) {
    el.dataset.mounted = '1';
    createRoot(el).render(<FjordLanding />);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState !== 'loading') mount();
  else document.addEventListener('DOMContentLoaded', mount);
}
