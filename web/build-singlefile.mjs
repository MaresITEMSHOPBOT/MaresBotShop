// Sloučí fjord.css + fjord.js (IIFE bundle) do jednoho samostatného HTML,
// které jde otevřít dvojklikem (file://), bez serveru a bez instalace.
import {readFileSync, writeFileSync} from 'node:fs';

const css = readFileSync(new URL('./dist-shopify/fjord.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('./dist-shopify/fjord.js', import.meta.url), 'utf8');

const html = `<!doctype html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#0a0a0b">
<meta name="color-scheme" content="dark">
<title>FJORD° — Prémiové nerezové termoláhve | Teplo 24 h, chlad 48 h</title>
<meta name="description" content="FJORD° — designové nerezové termoláhve a termohrnky. Dvojitá vakuová izolace, teplo 24 h a chlad 48 h. Doprava zdarma po ČR nad 1 000 Kč.">
<style>html,body{margin:0;padding:0;background:#0a0a0b}</style>
<style>${css}</style>
</head>
<body>
<div id="fjord-root"></div>
<script>${js}</script>
</body>
</html>
`;

writeFileSync(new URL('./FJORD-standalone.html', import.meta.url), html);
console.log('OK bytes=' + html.length);
