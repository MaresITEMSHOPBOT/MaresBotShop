#!/usr/bin/env python3
"""Slepí index.html + style.css + skripty do jednoho souboru.

    python3 build-standalone.py            -> mares-drop.html (celá stránka)
    python3 build-standalone.py --body X   -> jen obsah <body> do souboru X

Jednosouborová verze se hodí, když chceš hru jen stáhnout a hodit do OBS.
"""
import re, sys, pathlib

here = pathlib.Path(__file__).parent
html = (here / 'index.html').read_text(encoding='utf-8')
css  = (here / 'style.css').read_text(encoding='utf-8')

html = html.replace('<link rel="stylesheet" href="style.css">',
                    '<style>\n' + css + '\n</style>')

for name in ('kick-chat.js', 'game.js'):
    js = (here / name).read_text(encoding='utf-8')
    # </script> uvnitř kódu by předčasně ukončil blok
    js = js.replace('</script>', '<\\/script>')
    html = html.replace('<script src="%s"></script>' % name,
                        '<script>\n' + js + '\n</script>')

assert 'href="style.css"' not in html and 'src="game.js"' not in html, 'něco se nevložilo'

if '--body' in sys.argv:
    # Varianta pro Artifact: bez <html>/<head>/<body>, styl se přesune dovnitř.
    out = pathlib.Path(sys.argv[sys.argv.index('--body') + 1])
    body  = re.search(r'<body>(.*)</body>', html, re.S).group(1)
    style = re.search(r'<style>.*?</style>', html, re.S).group(0)
    fonts = re.findall(r'<link[^>]*fonts\.googleapis[^>]*>', html)
    title = re.search(r'<title>(.*?)</title>', html, re.S).group(1).split(' – ')[0]
    out.write_text('\n'.join(['<title>%s</title>' % title] + fonts + [style, body]),
                   encoding='utf-8')
    assert '.board-wrap' in out.read_text(encoding='utf-8'), 'styl se nevložil'
else:
    out = here / 'mares-drop.html'
    out.write_text(html, encoding='utf-8')

print('hotovo:', out, '(%.0f kB)' % (out.stat().st_size / 1024))
