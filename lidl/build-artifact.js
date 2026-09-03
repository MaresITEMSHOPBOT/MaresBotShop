/* Sestaví verzi pro publikování jako Artifact (online, s přihlášením).
   Spuštění:  node lidl/build-artifact.js
   Výstup:    dist/vedeni-smeny.html

   Artifact si kolem souboru doplní <!doctype>, <head> a <body> sám, proto
   soubor začíná rovnou titulkem a stylem. Navíc se přibaluje cloud.js,
   který ukládá data do účtu místo do paměti prohlížeče. */

const fs = require('fs');
const path = require('path');
const { read, themedCss, bodyMarkup } = require('./inline');

const outputDir = path.join(__dirname, '..', 'dist');
const output = path.join(outputDir, 'vedeni-smeny.html');

/* Pořadí skriptů: data → plán → online vrstva → aplikace.
   cloud.js musí být před app.js (ten se na startu ptá, jestli existuje)
   a za map.js (přepisuje v něm dotahování fotek). */
const scripts = ['store.js', 'map.js', 'shelf.js', 'cloud.js', 'app.js'];

const html = `<title>Vedení směny</title>
<style>
${themedCss()}
</style>
${bodyMarkup()}
${scripts.map(name => `<script>\n${read(name)}\n</script>`).join('\n')}
`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(output, html);
console.log(`Hotovo: ${output} (${(html.length / 1024).toFixed(0)} kB)`);
