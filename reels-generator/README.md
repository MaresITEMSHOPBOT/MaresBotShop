# 🎬 Reels Generator – videa s textem, zvukem a hashtagy

Nástroj, který z textu vyrobí hotové vertikální video (1080×1920) pro
Instagram Reels / TikTok / YouTube Shorts: **gradientové pozadí, animovaný
text odhalovaný slovo po slově (karaoke efekt), namluvený hlas (TTS)** a
připravený **popisek s hashtagy**. Součástí je i **auto‑generátor témat**.

> ⚠️ **Důležité – co tenhle nástroj NEDĚLÁ:** nezakládá Instagram účet a sám
> nic nepostuje. Automatické zakládání účtů a postování porušuje pravidla
> Instagramu a vede k banu. Tenhle nástroj ti jen **vyrobí obsah**, který si
> pak nahraješ ručně přes oficiální aplikaci. To je bezpečná a povolená cesta.

---

## 1. Instalace

Potřebuješ Python 3.9+ a jednorázově nainstalovat závislosti:

```bash
cd reels-generator
python3 -m pip install -r requirements.txt
```

FFmpeg se nemusí instalovat zvlášť – přibalí ho balíček `imageio-ffmpeg`.

## 2. Nastavení účtu (`config.json`)

```jsonc
{
  "brand": {
    "handle": "@tvuj_ucet",   // tvůj handle, zobrazí se dole ve videu
    "name": "Tvoje značka",
    "niche": "fakta",
    "lang": "cs"               // jazyk namluvení (cs = čeština)
  },
  "audio": {
    "tts": true,               // namluvit text hlasem
    "music_path": "",          // cesta k mp3 hudbě na pozadí (volitelné)
    "music_volume": 0.12
  }
}
```

## 3. Tvůj obsah (`content.json`)

Každé video = `hook` (titulní věta) + `scenes` (jednotlivé textové karty) +
`caption` (výzva pod video) + `tags` (z nich se skládají hashtagy).
Vlož vlastní témata – jsou tam dvě ukázky.

```jsonc
{
  "id": "fakta-mozek",
  "palette": "fialova",        // barva pozadí (viz "palettes" nahoře v souboru)
  "tags": ["fakta", "mozek"],  // řídí výběr hashtagů
  "hook": "3 fakta o mozku, kterým neuvěříš",
  "scenes": ["Fakt 1 …", "Fakt 2 …", "Sleduj pro víc!"],
  "caption": "Které tě překvapilo? Napiš do komentářů 👇"
}
```

## 4. Generování

```bash
python3 generate.py --all                # vyrobí všechna videa z content.json
python3 generate.py --id 5-navyku-bohatych  # jen jedno konkrétní
python3 generate.py --id X --no-audio    # bez hlasu (jen text + ticho)
python3 generate.py --id X --no-animate  # statický text místo animace
```

### ✨ Animovaný text

Text se odhaluje **slovo po slově** synchronně s mluvením a poslední odhalené
slovo je zvýrazněné akcentní barvou (karaoke efekt) – to drží pozornost a
zvyšuje *watch‑time*. Vypnout lze v `config.json` (`"animate": false`) nebo
přepínačem `--no-animate`. Rozvržení se počítá z celého textu, takže slova
při objevování neposkakují.

Barevné palety a akcenty jsou definované v `content.json` (`palettes`,
`accents`) – přibalených je 7 stylů (penize, zlato, korporat, ohen, fialova,
noc, uhel). Paletu vybíráš u každého videa polem `"palette"`.

## 🤖 Auto‑generátor témat

Nechceš vymýšlet obsah ručně? Vygeneruj témata z banky:

```bash
python3 generate_topics.py --niche byznys --count 5            # → content.generated.json
python3 generate_topics.py --niche byznys --count 5 --append   # přidá rovnou do content.json
python3 generate_topics.py --niche penize --count 3 --seed 1   # reprodukovatelně
```

Dostupné niky: `byznys`, `penize`, `fakta`, `motivace`. Banku témat snadno
rozšíříš v `generate_topics.py` (slovník `BANK`). Vygenerovaný samostatný
soubor pak vyrobíš třeba takhle:

```bash
python3 generate.py --all --content content.generated.json
```

Výstup ve složce `output/`:
- `<id>.mp4` – hotové video k nahrání
- `<id>.txt` – popisek + hashtagy ke zkopírování do Instagramu

> Pozn.: TTS (namluvení) potřebuje internet (Google Translate TTS). Když
> selže, nástroj automaticky vyrobí video bez hlasu, ať máš aspoň obraz.
> Pro hudbu na pozadí stáhni si **royalty-free** skladbu a nastav
> `music_path` v `config.json`.

---

## 📈 Jak reálně růst (dosah + follows)

Žádné zázračné triky neexistují – tohle ale prokazatelně funguje:

1. **První 3 sekundy = vše.** Hook musí zaujmout hned (otázka, číslo,
   kontroverze). Začínáme jím i v tomhle nástroji.
2. **Krátká videa dohraj do konce.** Drž 7–15 s. Vysoké *watch-time* a
   *re-watch* je hlavní signál pro algoritmus.
3. **Postuj pravidelně.** Radši 1 video denně dlouhodobě než 10 jednou.
   Připrav si dávku videí dopředu (`--all`).
4. **Výzva k akci.** „Ulož si to", „Napiš do komentářů", „Sleduj pro víc" –
   uložení a komentáře tlačí dosah víc než lajky.
5. **Hashtagy:** mix velkých + středních + niche (to dělá generátor za tebe).
   Nedávej 30 obřích tagů – utopíš se. 15–25 cílených stačí.
6. **Trendující zvuk.** Originální TTS je fajn na text, ale přidat pod to
   aktuálně populární zvuk z Instagramu (ručně při nahrávání) výrazně pomáhá.
7. **Konzistentní vizuál.** Stejná paleta a styl = lidi tě poznají a sledují.
8. **Reaguj na komentáře** první hodinu po postu – rozjede to dosah.

> Buduj publikum poctivě. Kupované follows / boty ti zničí dosah a riskuješ
> zablokování účtu.
