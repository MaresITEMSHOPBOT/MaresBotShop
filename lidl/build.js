/* Sloučí aplikaci do jednoho souboru smena.html (kořen repozitáře).
   Spuštění:  node lidl/build.js
   Výsledek se dá poslat mailem, nahrát na disk nebo otevřít offline v mobilu. */

const fs = require('fs');
const path = require('path');
const { read, themedCss } = require('./inline');

const output = path.join(__dirname, '..', 'smena.html');

const html = read('index.html')
    .replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${themedCss()}\n</style>`)
    .replace('<script src="store.js"></script>', () => `<script>\n${read('store.js')}\n</script>`)
    .replace('<script src="map.js"></script>', () => `<script>\n${read('map.js')}\n</script>`)
    .replace('<script src="shelf.js"></script>', () => `<script>\n${read('shelf.js')}\n</script>`)
    .replace('<script src="app.js"></script>', () => `<script>\n${read('app.js')}\n</script>`);

fs.writeFileSync(output, html);
console.log(`Hotovo: ${output} (${(html.length / 1024).toFixed(0)} kB)`);
