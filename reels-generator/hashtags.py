"""Generátor sad hashtagů pro Instagram Reels.

Strategie: mix velkých (dosah), středních (relevance) a malých/niche
(snazší umístění v "top") hashtagů. Příliš mnoho hashtagů ani samé
obří tagy nefungují – sweet spot je ~15-25 cílených.
"""
from __future__ import annotations

# Vždy se hodící tagy pro krátká vertikální videa (velký objem).
REELS_CORE = [
    "reels", "reelsinstagram", "reelsvideo", "viral", "fyp",
    "trending", "explore", "instagood", "foryou", "reelitfeelit",
]

# České / lokální tagy – pomáhají s relevancí pro česky mluvící publikum.
CZ_LOCAL = [
    "cesko", "czech", "ceskytiktok", "ceskyinstagram", "slovensko",
]

# Tematické banky podle tagů u videa.
TOPIC_BANKS = {
    "fakta": ["fakta", "zajimavosti", "vedeliste", "zajimavefakta", "vzdelani"],
    "veda": ["veda", "science", "sciencefacts", "vzdelavani"],
    "mozek": ["mozek", "psychologie", "mindset", "psychology"],
    "motivace": ["motivace", "motivation", "inspirace", "uspech", "success"],
    "produktivita": ["produktivita", "productivity", "navyky", "habits"],
    "rozvoj": ["osobnirozvoj", "selfimprovement", "growth", "rozvoj"],
    "disciplina": ["disciplina", "discipline", "hardwork", "grindset"],
    "zajimavosti": ["zajimavosti", "wow", "musttry", "didyouknow"],
    "fitness": ["fitness", "gym", "workout", "trening", "zdravi"],
    "vareni": ["recept", "vareni", "food", "foodie", "jidlo"],
    "cestovani": ["cestovani", "travel", "wanderlust", "dovolena"],
    "byznys": ["byznys", "business", "podnikani", "entrepreneur", "money"],
}


def _dedupe_keep_order(items):
    seen, out = set(), []
    for it in items:
        key = it.lower().lstrip("#")
        if key and key not in seen:
            seen.add(key)
            out.append(key)
    return out


def build_hashtags(tags, count=22, include_local=True):
    """Sestaví sadu hashtagů z tematických tagů videa.

    tags: seznam klíčových slov u videa (např. ["fakta", "mozek"]).
    count: cílový počet hashtagů.
    """
    pool = []
    # 1) Tematické (nejrelevantnější – jdou jako první).
    for t in tags:
        pool.extend(TOPIC_BANKS.get(t.lower(), [t.lower()]))
    # 2) Lokální (relevance pro CZ/SK publikum).
    if include_local:
        pool.extend(CZ_LOCAL)
    # 3) Core reels tagy (dosah) – až nakonec.
    pool.extend(REELS_CORE)

    pool = _dedupe_keep_order(pool)
    chosen = pool[:count]
    return ["#" + h for h in chosen]


def format_caption(caption_text, hook, tags, count=22):
    """Vrátí kompletní popisek: hook + výzva + hashtagy."""
    hashtags = build_hashtags(tags, count=count)
    parts = [hook.strip()]
    if caption_text.strip():
        parts.append(caption_text.strip())
    parts.append("")  # prázdný řádek před hashtagy
    parts.append(" ".join(hashtags))
    return "\n".join(parts)


if __name__ == "__main__":
    demo = format_caption(
        "Které tě překvapilo nejvíc? 👇",
        "3 fakta o mozku",
        ["fakta", "mozek", "veda"],
    )
    print(demo)
