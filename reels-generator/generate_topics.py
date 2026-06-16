#!/usr/bin/env python3
"""Auto-generátor témat pro Reels.

Z banky připravených témat vybere N kousků pro zvolenou niku, přiřadí jim
id a palety a zapíše je do content souboru (nová videa pak vyrobíš přes
generate.py).

Použití:
    python3 generate_topics.py --niche byznys --count 5
    python3 generate_topics.py --niche byznys --count 5 --append    # přidá do content.json
    python3 generate_topics.py --niche fakta --count 3 --out muj_obsah.json
"""
from __future__ import annotations

import argparse
import json
import os
import random
import re

ROOT = os.path.dirname(os.path.abspath(__file__))

# Palety, které se střídají při generování (musí existovat v content.json).
PALETTE_CYCLE = ["zlato", "penize", "korporat", "ohen", "fialova", "noc"]

# Banka témat. Každé = hook + scény + caption + tagy. Lze libovolně rozšiřovat.
BANK = {
    "byznys": [
        {
            "hook": "Jak vypadá den milionáře, než zbohatne",
            "scenes": [
                "Vstává dřív, než ostatní zapnou budík.",
                "Hodinu denně se učí něco nového.",
                "Říká 'ne' všemu, co ho neposouvá k cíli.",
                "Sleduj pro víc o úspěchu 🚀",
            ],
            "caption": "Který bod zvládneš zítra? 👇🚀",
            "tags": ["byznys", "rozvoj", "disciplina"],
        },
        {
            "hook": "Proč většina firem zkrachuje v prvním roce",
            "scenes": [
                "Řeší produkt, ale ne zákazníka.",
                "Utrácí za vzhled, ne za prodej.",
                "Vzdají to těsně předtím, než by to vyšlo.",
                "Sleduj pro víc o podnikání 💼",
            ],
            "caption": "Co tě od podnikání zatím brzdí? 👇",
            "tags": ["byznys", "penize"],
        },
        {
            "hook": "1 dovednost, která ti vydělá nejvíc",
            "scenes": [
                "Prodej. Bez něj nezáleží, jak dobrý produkt máš.",
                "Umět prodat = umět vysvětlit hodnotu.",
                "Tahle dovednost se dá naučit. Zadarmo.",
                "Sleduj pro víc 💰",
            ],
            "caption": "Umíš prodat sám sebe? 👇",
            "tags": ["byznys", "rozvoj"],
        },
        {
            "hook": "Přestaň měnit čas za peníze",
            "scenes": [
                "Mzda má strop: tvůj čas má jen 24 hodin.",
                "Postav něco, co vydělává i když spíš.",
                "Produkt, obsah, investice. Vyber si.",
                "Sleduj pro víc 📈",
            ],
            "caption": "Co bys postavil ty? 👇📈",
            "tags": ["byznys", "penize", "rozvoj"],
        },
        {
            "hook": "3 knihy, které ti změní vztah k penězům",
            "scenes": [
                "Bohatý táta, chudý táta – jak myslet o penězích.",
                "Nejbohatší muž v Babylonu – základy spoření.",
                "Psychologie peněz – proč děláme finanční chyby.",
                "Ulož si to a přečti aspoň jednu. Sleduj pro víc 📚",
            ],
            "caption": "Kterou si přečteš první? 👇📚",
            "tags": ["penize", "rozvoj"],
        },
    ],
    "penize": [
        {
            "hook": "Kam ukládat peníze podle toho, kdy je budeš potřebovat",
            "scenes": [
                "Do roka: spořicí účet. Jistota nad výnosem.",
                "3 až 5 let: konzervativní fondy nebo dluhopisy.",
                "10+ let: akcie a indexové fondy. Čas vyrovná výkyvy.",
                "Sleduj pro víc o investování 📊",
            ],
            "caption": "Na jak dlouho odkládáš ty? 👇",
            "tags": ["penize", "fakta"],
        },
        {
            "hook": "Tichý zloděj, který ti bere úspory",
            "scenes": [
                "Inflace. Peníze pod polštářem každý rok ztrácí hodnotu.",
                "Při 4 % inflaci je z 100 tisíc za 10 let reálně 67.",
                "Proto se peníze musí investovat, ne jen schovat.",
                "Sleduj pro víc 💸",
            ],
            "caption": "Necháváš peníze ležet, nebo pracovat? 👇",
            "tags": ["penize", "fakta"],
        },
        {
            "hook": "Pravidlo, díky kterému nikdy neutratíš zbytečně",
            "scenes": [
                "U každého nákupu nad tisíc počkej 24 hodin.",
                "Když to chceš i druhý den, kup to.",
                "Většinou zjistíš, že to nepotřebuješ.",
                "Sleduj pro víc tipů 🧠",
            ],
            "caption": "Co bys takhle nekoupil? 👇",
            "tags": ["penize", "produktivita"],
        },
    ],
    "fakta": [
        {
            "hook": "3 fakta o vesmíru, ze kterých zamrazí",
            "scenes": [
                "Ve vesmíru je víc hvězd než zrnek písku na Zemi.",
                "Den na Venuši je delší než její rok.",
                "Světlo ze Slunce k nám letí 8 minut.",
                "Sleduj pro víc faktů 🌌",
            ],
            "caption": "Které tě překvapilo? 👇🌌",
            "tags": ["fakta", "veda", "zajimavosti"],
        },
        {
            "hook": "Tělo dělá věci, o kterých nemáš tušení",
            "scenes": [
                "Za život vyprodukuješ slin na dva bazény.",
                "Žaludeční kyselina rozpustí i žiletku.",
                "Každou vteřinu ti vznikne 25 milionů nových buněk.",
                "Sleduj pro víc 🧬",
            ],
            "caption": "Co tě šokovalo nejvíc? 👇",
            "tags": ["fakta", "veda", "mozek"],
        },
    ],
    "motivace": [
        {
            "hook": "Přestaň čekat na motivaci",
            "scenes": [
                "Motivace přijde a odejde. Disciplína zůstává.",
                "Nečekej, až se ti bude chtít. Prostě začni.",
                "Akce vytváří motivaci, ne naopak.",
                "Sleduj pro denní dávku 🔥",
            ],
            "caption": "Co dnes uděláš, i když se ti nechce? 👇🔥",
            "tags": ["motivace", "disciplina", "rozvoj"],
        },
    ],
}


def slugify(text):
    text = text.lower()
    repl = {"á": "a", "č": "c", "ď": "d", "é": "e", "ě": "e", "í": "i",
            "ň": "n", "ó": "o", "ř": "r", "š": "s", "ť": "t", "ú": "u",
            "ů": "u", "ý": "y", "ž": "z"}
    text = "".join(repl.get(c, c) for c in text)
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:40]


def main():
    ap = argparse.ArgumentParser(description="Auto-generátor témat pro Reels")
    ap.add_argument("--niche", required=True, choices=sorted(BANK.keys()),
                    help="nika obsahu")
    ap.add_argument("--count", type=int, default=5, help="kolik témat vygenerovat")
    ap.add_argument("--append", action="store_true",
                    help="přidat vygenerovaná videa do content.json")
    ap.add_argument("--out", help="zapsat do tohoto souboru (jinak content.generated.json)")
    ap.add_argument("--seed", type=int, help="náhodný seed pro reprodukovatelnost")
    args = ap.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    bank = BANK[args.niche]
    chosen = random.sample(bank, min(args.count, len(bank)))
    if args.count > len(bank):
        print(f"⚠ Banka pro '{args.niche}' má jen {len(bank)} témat, generuji je všechna.")

    new_videos = []
    for i, t in enumerate(chosen):
        new_videos.append({
            "id": slugify(t["hook"]),
            "palette": PALETTE_CYCLE[i % len(PALETTE_CYCLE)],
            "tags": t["tags"],
            "hook": t["hook"],
            "scenes": t["scenes"],
            "caption": t["caption"],
        })

    target = args.out or (
        os.path.join(ROOT, "content.json") if args.append
        else os.path.join(ROOT, "content.generated.json"))

    if args.append and os.path.exists(target):
        with open(target) as f:
            data = json.load(f)
        existing = {v["id"] for v in data.get("videos", [])}
        added = [v for v in new_videos if v["id"] not in existing]
        data.setdefault("videos", []).extend(added)
        with open(target, "w") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✓ Přidáno {len(added)} nových videí do {os.path.relpath(target, ROOT)}"
              f" (přeskočeno {len(new_videos) - len(added)} duplicit).")
    else:
        # Samostatný soubor – přebere palety/akcenty z content.json, ať jde rovnou generovat.
        base = {}
        cj = os.path.join(ROOT, "content.json")
        if os.path.exists(cj):
            with open(cj) as f:
                src = json.load(f)
            base["palettes"] = src.get("palettes", {})
            base["accents"] = src.get("accents", {})
        base["videos"] = new_videos
        with open(target, "w") as f:
            json.dump(base, f, ensure_ascii=False, indent=2)
        print(f"✓ Zapsáno {len(new_videos)} videí do {os.path.relpath(target, ROOT)}")
        print(f"  Vyrobíš je: python3 generate.py --all --content {os.path.basename(target)}")


if __name__ == "__main__":
    main()
