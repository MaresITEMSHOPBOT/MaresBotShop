#!/usr/bin/env python3
"""Složí celou aplikaci do jednoho HTML souboru (../../letak.html).

Do výsledku se vloží styly, data i všechny stránky letáku jako base64 obrázky,
takže soubor jde poslat mailem a otevřít offline bez zbytku repozitáře.

    python3 build_standalone.py
"""
import base64
import io
import json
import os
import re

from PIL import Image

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(BASE, '..', 'letak.html')
PAGE_W = 900      # šířka vložené stránky v px
PAGE_Q = 64
THUMB_W = 140
THUMB_Q = 60


def encode(path, width, quality):
    img = Image.open(path).convert('RGB')
    if img.width != width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, 'webp', quality=quality, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')


def main():
    pages_dir = os.path.join(BASE, 'pages')
    files = sorted(f for f in os.listdir(pages_dir) if f.endswith('.webp'))

    full, thumbs = {}, {}
    for f in files:
        n = int(os.path.splitext(f)[0])
        full[n] = encode(os.path.join(pages_dir, f), PAGE_W, PAGE_Q)
        thumbs[n] = encode(os.path.join(BASE, 'thumbs', f), THUMB_W, THUMB_Q)
        print(f'\r  stránka {n}/{len(files)}', end='', flush=True)
    print()

    html = open(os.path.join(BASE, 'index.html'), encoding='utf-8').read()
    css = open(os.path.join(BASE, 'styles.css'), encoding='utf-8').read()
    data = open(os.path.join(BASE, 'data.js'), encoding='utf-8').read()
    app = open(os.path.join(BASE, 'app.js'), encoding='utf-8').read()

    imgs = 'window.LETAK_IMG = ' + json.dumps({'p': full, 't': thumbs},
                                              separators=(',', ':')) + ';'

    html = html.replace('<link rel="stylesheet" href="styles.css">',
                        '<style>\n' + css + '\n</style>')
    html = re.sub(r'<script src="data\.js"></script>\s*<script src="app\.js"></script>',
                  lambda _: ('<script>\n' + imgs + '\n</script>\n'
                             '<script>\n' + data + '\n</script>\n'
                             '<script>\n' + app + '\n</script>'),
                  html)

    with open(OUT, 'w', encoding='utf-8') as fh:
        fh.write(html)
    print(f'{os.path.abspath(OUT)} – {os.path.getsize(OUT) / 1048576:.1f} MB')


if __name__ == '__main__':
    main()
