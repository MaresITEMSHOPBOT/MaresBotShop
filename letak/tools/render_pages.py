#!/usr/bin/env python3
"""Vyrenderuje stránky PDF letáku do webp obrázků pro prohlížeč letáku.

    LETAK_PDF=letak.pdf python3 render_pages.py

Vytvoří ../pages/NN.webp (šířka 980 px) a ../thumbs/NN.webp (šířka 200 px).
"""
import os

import pypdfium2 as pdfium

PDF = os.environ.get('LETAK_PDF', 'letak.pdf')
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FULL_W = 980
THUMB_W = 200


def main():
    pages_dir = os.path.join(BASE, 'pages')
    thumbs_dir = os.path.join(BASE, 'thumbs')
    os.makedirs(pages_dir, exist_ok=True)
    os.makedirs(thumbs_dir, exist_ok=True)

    pdf = pdfium.PdfDocument(PDF)
    for i in range(len(pdf)):
        page = pdf[i]
        full = page.render(scale=FULL_W / page.get_width()).to_pil().convert('RGB')
        full.save(os.path.join(pages_dir, f'{i + 1:02d}.webp'), quality=70, method=6)
        thumb = full.resize((THUMB_W, round(full.height * THUMB_W / full.width)))
        thumb.save(os.path.join(thumbs_dir, f'{i + 1:02d}.webp'), quality=68, method=6)
    print(f'vyrenderováno {len(pdf)} stran')


if __name__ == '__main__':
    main()
