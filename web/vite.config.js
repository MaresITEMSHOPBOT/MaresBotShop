import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// Samostatná (browser) verze FJORD°.
// `npm run dev`   → vývojový server v prohlížeči (http://localhost:5173)
// `npm run build` → statický web do dist/ (lze hostovat kdekoli; náhled `npm run preview`)
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {host: true, port: 5173, open: true},
  preview: {host: true, port: 4173},
});
