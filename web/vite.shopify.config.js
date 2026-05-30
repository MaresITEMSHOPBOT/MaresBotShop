import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// Build pro vložení do Shopify motivu: jeden soběstačný IIFE soubor `fjord.js`
// + `fjord.css`. Bundluje i React/Three (žádné externí závislosti), dynamické
// importy jsou vloženy dovnitř, takže stačí klasický <script> v Liquid sekci.
export default defineConfig({
  plugins: [react()],
  define: {'process.env.NODE_ENV': JSON.stringify('production')},
  build: {
    outDir: 'dist-shopify',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: 'src/shopify-entry.jsx',
      formats: ['iife'],
      name: 'FjordWidget',
      fileName: () => 'fjord.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: 'fjord.[ext]',
      },
    },
  },
});
