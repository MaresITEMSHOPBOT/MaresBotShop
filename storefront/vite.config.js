import {defineConfig} from 'vite';
import {hydrogen} from '@shopify/hydrogen/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';
import {reactRouter} from '@react-router/dev/vite';
import {fileURLToPath} from 'node:url';

// Explicitní alias "~" -> "app/". Vite 8 / Rolldown nectí v SSR prostředí
// pouze `resolve.tsconfigPaths`, takže ho doplníme napevno pro všechna prostředí.
const appDir = fileURLToPath(new URL('./app', import.meta.url));

export default defineConfig({
  plugins: [hydrogen(), oxygen(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
    alias: [{find: /^~\//, replacement: `${appDir}/`}],
  },
  build: {
    // Allow a strict Content-Security-Policy
    // without inlining assets as base64:
    assetsInlineLimit: 0,
  },
  ssr: {
    optimizeDeps: {
      /**
       * Include dependencies here if they throw CJS<>ESM errors.
       * @see https://vitejs.dev/config/dep-optimization-options
       */
      include: [
        'react-router > set-cookie-parser',
        'react-router > cookie',
        'react-router',
      ],
    },
  },
  server: {
    allowedHosts: ['.tryhydrogen.dev'],
  },
});
