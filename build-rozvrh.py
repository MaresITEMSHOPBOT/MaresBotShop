#!/usr/bin/env python3
"""Sestaví rozvrh-offline.html - jeden soubor se vším (CSS + JS inline).

Použití: python3 build-rozvrh.py
Spusť po každé úpravě rozvrh.html / rozvrh.css / rozvrh.js / rozvrh-data.js.
"""
from pathlib import Path

root = Path(__file__).parent
html = (root / 'rozvrh.html').read_text(encoding='utf-8')

styles = (root / 'styles.css').read_text(encoding='utf-8')
rozvrh_css = (root / 'rozvrh.css').read_text(encoding='utf-8')
data_js = (root / 'rozvrh-data.js').read_text(encoding='utf-8')
app_js = (root / 'rozvrh.js').read_text(encoding='utf-8')

html = html.replace(
    '    <link rel="stylesheet" href="styles.css">\n'
    '    <link rel="stylesheet" href="rozvrh.css">',
    f'    <style>{styles}\n{rozvrh_css}</style>'
)
html = html.replace(
    '    <script src="rozvrh-data.js"></script>\n'
    '    <script src="rozvrh.js"></script>',
    f'    <script>{data_js}</script>\n    <script>{app_js}</script>'
)
# odkaz na druhou aplikaci v offline verzi nedává smysl
html = html.replace(
    '<a href="index.html" class="btn-secondary" style="text-decoration: none;">📚 Studijní materiály</a>\n                ',
    ''
)

out = root / 'rozvrh-offline.html'
out.write_text(html, encoding='utf-8')
print(f'{out.name}: {out.stat().st_size // 1024} kB')
