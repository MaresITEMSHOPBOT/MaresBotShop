/* Sloučí hru do jediného souboru hra.html v kořeni repozitáře:  node hra/build.js
   Výsledek funguje i offline po dvojkliku, bez serveru. */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

let html = read('index.html');

html = html.replace(/[ \t]*<link rel="stylesheet" href="([^"]+)">/g,
    (m, f) => `<style>\n${read(f)}\n</style>`);

html = html.replace(/[ \t]*<script src="([^"]+)"><\/script>/g,
    (m, f) => `<script>\n${read(f).replace(/<\/script>/g, '<\\/script>')}\n</script>`);

html = html.replace('<title>', '<!-- Sestaveno skriptem hra/build.js – needituj ručně, uprav zdroje v adresáři hra/ -->\n<title>');

const out = path.join(root, '..', 'hra.html');
fs.writeFileSync(out, html);
console.log(`hotovo: ${out} (${(html.length / 1024).toFixed(1)} kB)`);
