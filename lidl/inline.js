/* Společné kousky pro oba buildy (jednosouborová verze i verze pro Artifact). */

const fs = require('fs');
const path = require('path');

const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8')
    .replace("'__BUILD__'", `'${stamp}'`);

/* Prohlížeč hlásí tmavý režim třemi způsoby: značkou data-theme="dark",
   značkou data-theme="light" a systémovým nastavením bez značky.
   Barvy tmavého motivu proto zdvojíme i do systémového dotazu. */
function themedCss() {
    const css = read('styles.css');
    const match = css.match(/\[data-theme="dark"\] \{\n([\s\S]*?)\n\}/);
    if (!match) throw new Error('Nenašel jsem barvy tmavého motivu ve styles.css');
    return `${css}
/* Systémový tmavý režim (bez explicitní volby) – generováno build skriptem. */
@media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
${match[1]}
    }
}
`;
}

/* Obsah <body> ze stránky, bez odkazů na skripty. */
function bodyMarkup() {
    const html = read('index.html');
    const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
    return body.replace(/^\s*<script src=".*"><\/script>\s*$/gm, '').trimEnd();
}

module.exports = { read, themedCss, bodyMarkup };
