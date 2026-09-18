#!/usr/bin/env python3
"""Generator vizualu pro kampan RunClub VSE "Hleda se misto" (18.-21. 9. 2026).

Vykresluje slidy pres headless Chromium do assets/*.png.
Chces zmenit text? Uprav SLIDES dole a spust `python3 render.py`.
"""
import base64
import html
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
BUILD = ROOT / ".build"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

FEED = (1080, 1350)   # 4:5 prispevek
STORY = (1080, 1920)  # story

BACKGROUNDS = {
    # svetlejsi modra zare - hlavni brandovy podklad
    "glow": """radial-gradient(ellipse 78% 62% at 50% 46%,
        #12597f 0%, #0d4a6c 28%, #093category 0%, #072b42 55%, #04141f 78%, #020609 100%)""",
    "mid": """radial-gradient(ellipse 70% 55% at 50% 48%,
        #0d4a6c 0%, #0a3b58 35%, #05202f 65%, #020609 100%)""",
    # temer cerny teaser podklad
    "deep": """radial-gradient(ellipse 60% 48% at 50% 50%,
        #0a3752 0%, #072536 32%, #03111a 62%, #010306 100%)""",
    "black": """radial-gradient(ellipse 55% 42% at 50% 50%,
        #06283c 0%, #04182533 40%, #010306 75%, #000000 100%)""",
}
BACKGROUNDS["glow"] = BACKGROUNDS["glow"].replace("#093category 0%, ", "")

GRAIN = (
    "url(\"data:image/svg+xml;utf8,"
    "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>"
    "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/>"
    "</filter><rect width='300' height='300' filter='url(%23n)' opacity='0.55'/></svg>\")"
)

PAGE = """<!doctype html><html><head><meta charset="utf-8"><style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
html,body {{ width:{w}px; height:{h}px; overflow:hidden; background:#000; }}
.frame {{ position:relative; width:{w}px; height:{h}px; background-image:{bg};
         display:flex; flex-direction:column; align-items:center; justify-content:{justify};
         padding:{pad}px 84px; }}
.frame::after {{ content:""; position:absolute; inset:0; background-image:{grain};
         background-size:300px 300px; opacity:.16; mix-blend-mode:overlay; pointer-events:none; }}
.stack {{ position:relative; z-index:2; display:flex; flex-direction:column;
          align-items:center; justify-content:center; gap:0; text-align:center; width:100%; }}
.l {{ color:#fff; font-family:"Liberation Sans",Arial,Helvetica,sans-serif; font-weight:400;
      line-height:1.08; letter-spacing:-0.015em; }}
.serif {{ font-family:"Liberation Serif",Georgia,serif; font-style:italic; letter-spacing:0; }}
.kicker {{ font-family:"Liberation Sans",Arial,sans-serif; text-transform:uppercase;
      letter-spacing:.34em; color:#cfe6f5; }}
.logo {{ position:relative; z-index:2; display:block; }}
.corner {{ position:absolute; z-index:3; left:0; right:0; text-align:center;
      font-family:"Liberation Sans",Arial,sans-serif; text-transform:uppercase;
      letter-spacing:.32em; font-size:24px; color:#9fc4da; }}
.corner.top {{ top:66px; }} .corner.bottom {{ bottom:66px; }}
.rule {{ width:120px; height:2px; background:#ffffff59; margin:34px 0; }}
</style></head><body><div class="frame">{corners}<div class="stack">{body}</div>{logo}</div></body></html>"""


def logo_uri(name="logo-lockup.png"):
    data = (ASSETS / name).read_bytes()
    return "data:image/png;base64," + base64.b64encode(data).decode()


def line_html(spec):
    if spec.get("rule"):
        return '<div class="rule"></div>'
    if spec.get("gap"):
        return f'<div style="height:{spec["gap"]}px"></div>'
    txt = html.escape(spec["t"]).replace("\n", "<br>")
    cls = "l"
    style = f"font-size:{spec.get('size', 96)}px;"
    if spec.get("style") == "serif":
        cls += " serif"
    if spec.get("style") == "kicker":
        cls = "l kicker"
        style += "line-height:1.5;"
    if spec.get("dim"):
        style += f"color:rgba(255,255,255,{spec['dim']});"
    if spec.get("lh"):
        style += f"line-height:{spec['lh']};"
    if spec.get("ls"):
        style += f"letter-spacing:{spec['ls']};"
    if spec.get("mt"):
        style += f"margin-top:{spec['mt']}px;"
    return f'<div class="{cls}" style="{style}">{txt}</div>'


def render(slide):
    w, h = slide.get("size", FEED)
    body = "".join(line_html(s) for s in slide["lines"])
    logo = ""
    if slide.get("logo"):
        width = slide.get("logo_w", 300)
        opacity = slide.get("logo_opacity", 1)
        mt = slide.get("logo_mt", 90)
        logo = (f'<img class="logo" src="{logo_uri(slide["logo"])}" '
                f'style="width:{width}px;margin-top:{mt}px;opacity:{opacity}">')
    corners = ""
    if slide.get("top"):
        corners += f'<div class="corner top">{html.escape(slide["top"])}</div>'
    if slide.get("bottom"):
        corners += f'<div class="corner bottom">{html.escape(slide["bottom"])}</div>'
    page = PAGE.format(
        w=w, h=h, bg=BACKGROUNDS[slide.get("bg", "glow")], grain=GRAIN,
        justify=slide.get("justify", "center"), pad=slide.get("pad", 120),
        body=body, logo=logo, corners=corners,
    )
    BUILD.mkdir(exist_ok=True)
    src = BUILD / (slide["name"] + ".html")
    src.write_text(page, encoding="utf-8")
    out = ASSETS / (slide["name"] + ".png")
    # headless Chromium ubira ~88px z vysky okna -> renderujeme s rezervou a orizneme
    subprocess.run([
        CHROME, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
        "--force-device-scale-factor=1", f"--window-size={w},{h + 160}",
        f"--screenshot={out}", f"file://{src}",
    ], check=True, capture_output=True)
    from PIL import Image
    with Image.open(out) as im:
        im.crop((0, 0, w, h)).save(out)
    print("ok", out.name, f"{w}x{h}")


# ---------------------------------------------------------------- slidy
K = dict(style="kicker", size=26)

SLIDES = [
    # ---------- PATEK 18. 9. | teaser 1: "signal"
    dict(name="01a-teaser-signal", bg="black", logo="logo-mark.png", logo_w=210,
         logo_opacity=0.28, logo_mt=120,
         lines=[dict(t="slyšeli jste to taky?", style="serif", size=76, dim=0.82)],
         bottom="18 · 09"),
    dict(name="01b-teaser-datum", bg="deep",
         lines=[dict(t="Něco se", size=88, dim=0.9),
                dict(t="probouzí", style="serif", size=104),
                dict(rule=True),
                dict(t="21. 9.", size=150, ls="0.02em")],
         bottom="runclubvse"),

    # ---------- SOBOTA 19. 9. | "Hleda se misto" (karusel 4)
    dict(name="02a-hleda-se-misto", bg="deep",
         lines=[dict(t="HLEDÁ SE", size=118, ls="0.04em"),
                dict(t="místo", style="serif", size=170, mt=16),
                dict(gap=28),
                dict(t="pro první běh semestru", style="kicker", size=26)],
         top="pátrání zahájeno"),
    dict(name="02b-popis", bg="mid", justify="center",
         lines=[dict(t="POPIS", **K),
                dict(gap=44),
                dict(t="cca 5 km", size=82, lh=1.5),
                dict(t="bez semaforů", size=82, lh=1.5),
                dict(t="do 15 minut od VŠE", size=72, lh=1.6),
                dict(t="čtvrtek, 17:00", style="serif", size=86, mt=26)]),
    dict(name="02c-odmena", bg="glow",
         lines=[dict(t="ODMĚNA", **K),
                dict(gap=40),
                dict(t="první běh", style="serif", size=132),
                dict(t="tohohle semestru", size=78, mt=20),
                dict(t="a ty u toho", size=78)]),
    dict(name="02d-vyzva", bg="deep", logo="logo-lockup.png", logo_w=260, logo_mt=110,
         lines=[dict(t="Víš o něm?", size=104),
                dict(gap=26),
                dict(t="napiš tip do komentářů", style="serif", size=66, dim=0.9)],
         top="hledá se místo"),

    # ---------- NEDELE 20. 9. | uzsi vyber (karusel 3)
    dict(name="03a-zbyli-tri", bg="mid",
         lines=[dict(t="Zbyli", size=96),
                dict(t="tři", style="serif", size=210),
                dict(gap=20),
                dict(t="hlasuje se ve stories", style="kicker", size=26)],
         top="den 2"),
    dict(name="03b-kandidati", bg="mid",
         lines=[dict(t="UŽŠÍ VÝBĚR", **K),
                dict(gap=54),
                dict(t="Vítkov", size=104, lh=1.45),
                dict(t="Riegrovy sady", size=104, lh=1.45),
                dict(t="Letná", size=104, lh=1.45),
                dict(gap=44),
                dict(t="kde poběžíme?", style="serif", size=58, dim=0.85)]),
    dict(name="03c-zitra", bg="glow",
         lines=[dict(t="Zítra", style="serif", size=170),
                dict(t="v 17:00", size=110, mt=10),
                dict(gap=34),
                dict(t="to víte", size=76, dim=0.9)],
         bottom="21 · 09 · 17:00"),

    # ---------- PONDELI 21. 9. | reveal (karusel 4)
    dict(name="04a-jsme-zpatky", bg="glow",
         lines=[dict(t="JSME", size=150, ls="0.03em"),
                dict(t="zpátky", style="serif", size=200, mt=6)],
         bottom="runclub vše"),
    dict(name="04b-misto", bg="mid",
         lines=[dict(t="MÍSTO", **K),
                dict(gap=46),
                dict(t="Vítkov", style="serif", size=168),
                dict(gap=30),
                dict(t="sraz u sochy\nna nám. W. Churchilla", size=56, lh=1.45, dim=0.88)]),
    dict(name="04c-termin", bg="glow",
         lines=[dict(t="PRVNÍ BĚH SEMESTRU", **K),
                dict(gap=44),
                dict(t="čtvrtek 24. 9.", size=96),
                dict(t="17:00", style="serif", size=150, mt=12),
                dict(gap=26),
                dict(t="5 km · tempo na pokec", size=56, dim=0.9)]),
    dict(name="04d-jak-dal", bg="deep", logo="logo-lockup.png", logo_w=270, logo_mt=100,
         lines=[dict(t="Zapiš se", size=110),
                dict(gap=22),
                dict(t="odkaz v biu", style="serif", size=76, dim=0.92),
                dict(gap=18),
                dict(t="runclubvse.lovable.app", style="kicker", size=24)]),

    # ---------- STORIES 9:16
    dict(name="st-01-odpocet-3", size=STORY, bg="black", pad=200,
         lines=[dict(t="3", style="serif", size=340),
                dict(gap=30), dict(t="dny", style="kicker", size=30)],
         bottom="runclubvse"),
    dict(name="st-02-odpocet-2", size=STORY, bg="deep", pad=200,
         lines=[dict(t="2", style="serif", size=340),
                dict(gap=30), dict(t="dny", style="kicker", size=30)],
         bottom="runclubvse"),
    dict(name="st-03-odpocet-1", size=STORY, bg="mid", pad=200,
         lines=[dict(t="1", style="serif", size=340),
                dict(gap=30), dict(t="den", style="kicker", size=30)],
         bottom="runclubvse"),
    dict(name="st-04-anketa", size=STORY, bg="glow", pad=200, justify="flex-start",
         lines=[dict(gap=300), dict(t="KDE", size=120, ls="0.04em"),
                dict(t="poběžíme?", style="serif", size=140, mt=8),
                dict(gap=40), dict(t="hlasuj níž", style="kicker", size=28)]),
    dict(name="st-05-reveal", size=STORY, bg="glow", pad=200, logo="logo-lockup.png",
         logo_w=260, logo_mt=120,
         lines=[dict(t="JSME", size=130, ls="0.03em"),
                dict(t="zpátky", style="serif", size=170, mt=4),
                dict(gap=46), dict(t="čtvrtek 24. 9. · 17:00", size=54, dim=0.9)]),
]


if __name__ == "__main__":
    only = sys.argv[1:] 
    for slide in SLIDES:
        if only and slide["name"] not in only:
            continue
        render(slide)
