#!/usr/bin/env python3
"""Generátor Instagram Reels: animovaný text + zvuk (TTS) + popisek s hashtagy.

Použití:
    python3 generate.py --all                # vyrobí všechna videa z content.json
    python3 generate.py --id 5-navyku-bohatych
    python3 generate.py --id X --no-audio    # bez namluveného hlasu
    python3 generate.py --id X --no-animate  # statický text místo animace

Výstup pro každé video (ve složce output/):
    <id>.mp4   – hotové vertikální video 1080x1920 s animovaným textem
    <id>.txt   – popisek + hashtagy připravené ke zkopírování do Instagramu
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from hashtags import format_caption

ROOT = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(ROOT, "output")


# --------------------------------------------------------------------------- #
# Pomocné funkce
# --------------------------------------------------------------------------- #
def ffmpeg_exe():
    """Najde ffmpeg binárku (z imageio-ffmpeg, nebo systémový)."""
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def gradient_background(width, height, colors):
    """Svislý gradient přes několik barevných zarážek."""
    stops = [hex_to_rgb(c) for c in colors]
    if len(stops) == 1:
        stops = stops * 2
    grad = np.zeros((height, width, 3), dtype=np.uint8)
    seg = height / (len(stops) - 1)
    y1 = 0
    for i in range(len(stops) - 1):
        y0, y1 = int(i * seg), int((i + 1) * seg)
        c0, c1 = np.array(stops[i]), np.array(stops[i + 1])
        n = max(1, y1 - y0)
        for ch in range(3):
            grad[y0:y1, :, ch] = np.linspace(c0[ch], c1[ch], n)[:, None]
    grad[y1:, :, :] = stops[-1]
    return Image.fromarray(grad, "RGB")


def wrap_words(text, font, max_width):
    """Zalomí text na řádky (každý řádek = seznam slov), aby se vešel do šířky."""
    lines, cur = [], []
    for w in text.split():
        trial = " ".join(cur + [w])
        if font.getlength(trial) <= max_width or not cur:
            cur.append(w)
        else:
            lines.append(cur)
            cur = [w]
    if cur:
        lines.append(cur)
    return lines


def fit_layout(text, font_path, start_size, max_width, max_height, min_size=40):
    """Najde největší písmo, při kterém se text vejde. Vrací (font, lines, line_h)."""
    size = start_size
    while size >= min_size:
        font = ImageFont.truetype(font_path, size)
        lines = wrap_words(text, font, max_width)
        line_h = size * 1.25
        total_h = line_h * len(lines)
        widest = max((font.getlength(" ".join(l)) for l in lines), default=0)
        if total_h <= max_height and widest <= max_width:
            return font, lines, line_h
        size -= 4
    font = ImageFont.truetype(font_path, min_size)
    return font, wrap_words(text, font, min_size * 30), min_size * 1.25


def render_frame(cfg, palette, accent_hex, text, n_visible, is_title):
    """Vykreslí snímek, kde je vidět prvních `n_visible` slov.

    Rozvržení se počítá z CELÉHO textu, aby slova při objevování neposkakovala.
    Poslední odhalené slovo se zvýrazní akcentní barvou (karaoke efekt).
    """
    v = cfg["video"]
    W, H, margin = v["width"], v["height"], v["margin"]
    img = gradient_background(W, H, palette)
    draw = ImageDraw.Draw(img, "RGBA")

    max_w = W - 2 * margin
    max_h = H - 2 * margin - 160
    start = v["max_title_size"] if is_title else v["body_size"]
    font, lines, line_h = fit_layout(text, v["font_path"], start, max_w, max_h)

    total_h = line_h * len(lines)
    y0 = (H - total_h) / 2
    space_w = font.getlength(" ")
    accent = hex_to_rgb(accent_hex)

    # Panel za textem (počítá se z plného textu => stabilní velikost).
    widest = max((font.getlength(" ".join(l)) for l in lines), default=0)
    pad = 48
    draw.rounded_rectangle(
        [(W - widest) / 2 - pad, y0 - pad, (W + widest) / 2 + pad, y0 + total_h + pad],
        radius=40, fill=(0, 0, 0, 110),
    )

    idx = 0  # globální index slova napříč řádky
    y = y0
    for line in lines:
        line_w = font.getlength(" ".join(line))
        x = (W - line_w) / 2
        for word in line:
            if idx < n_visible:
                is_latest = (idx == n_visible - 1)
                color = accent if is_latest else (255, 255, 255)
                draw.text((x + 4, y + 4), word, font=font, fill=(0, 0, 0, 170))
                draw.text((x, y), word, font=font, fill=color)
            idx += 1
            x += font.getlength(word) + space_w
        y += line_h

    # Handle značky dole.
    handle = cfg["brand"]["handle"]
    hfont = ImageFont.truetype(v["font_path"], v["handle_size"])
    hw = hfont.getlength(handle)
    draw.text(((W - hw) / 2 + 2, H - 130 + 2), handle, font=hfont, fill=(0, 0, 0, 160))
    draw.text(((W - hw) / 2, H - 130), handle, font=hfont, fill=(255, 255, 255, 230))
    return img


def estimate_duration(text):
    """Odhad délky scény bez TTS podle počtu slov (min 2.5 s)."""
    return max(2.5, 1.2 + len(text.split()) * 0.42)


def tts_audio(text, lang, slow, out_path):
    """Vytvoří mp3 s namluveným textem přes gTTS (vyžaduje internet)."""
    from gtts import gTTS
    gTTS(text=text, lang=lang, slow=slow).save(out_path)


def media_duration(path):
    """Zjistí délku audio/video souboru přes ffmpeg (parsuje stderr)."""
    p = subprocess.run([ffmpeg_exe(), "-i", path], capture_output=True, text=True)
    for line in p.stderr.splitlines():
        if "Duration:" in line:
            t = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = t.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 0.0


def run_ffmpeg(args):
    subprocess.run([ffmpeg_exe(), "-y", "-loglevel", "error", *args], check=True)


# --------------------------------------------------------------------------- #
# Sestavení jedné scény (s animací odhalování slov)
# --------------------------------------------------------------------------- #
def build_scene(cfg, palette, accent, text, is_title, duration, audio_path, animate, tmp, idx):
    """Vytvoří jeden video segment (scénu) a vrátí cestu k mp4."""
    v = cfg["video"]
    fps = v["fps"]
    words = text.split()
    n = len(words)

    # Stavy odhalení: kolik slov je vidět + jak dlouho se daný snímek drží.
    if animate and n > 1:
        reveal = duration * v.get("reveal_ratio", 0.7)
        per_word = reveal / n
        states = [(k, per_word) for k in range(1, n + 1)]
        states[-1] = (n, per_word + duration - reveal)  # poslední drží zbytek času
    else:
        states = [(n, duration)]

    # Vyrenderuj snímek pro každý stav a poskládej concat list s délkami.
    list_path = os.path.join(tmp, f"s{idx:02d}_list.txt")
    last_png = None
    with open(list_path, "w") as f:
        for j, (n_vis, dur) in enumerate(states):
            png = os.path.join(tmp, f"s{idx:02d}_{j:03d}.png")
            render_frame(cfg, palette, accent, text, n_vis, is_title).save(png)
            f.write(f"file '{png}'\nduration {dur:.3f}\n")
            last_png = png
        f.write(f"file '{last_png}'\n")  # poslední snímek zopakovat (quirk concat)

    seg = os.path.join(tmp, f"seg{idx:02d}.mp4")
    common = [
        "-c:v", "libx264", "-tune", "stillimage", "-r", str(fps),
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
    ]
    if audio_path:
        run_ffmpeg([
            "-f", "concat", "-safe", "0", "-i", list_path,
            "-i", audio_path, "-map", "0:v", "-map", "1:a",
            *common, "-shortest", seg,
        ])
    else:
        run_ffmpeg([
            "-f", "concat", "-safe", "0", "-i", list_path,
            "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
            "-map", "0:v", "-map", "1:a", *common, "-t", f"{duration:.2f}", seg,
        ])
    return seg


# --------------------------------------------------------------------------- #
# Sestavení celého videa
# --------------------------------------------------------------------------- #
def build_video(cfg, content, item, use_audio, animate, tmp):
    palette = content.get("palettes", {}).get(
        item["palette"], ["#1a1035", "#3a1c71", "#7b2ff7"])
    accents = content.get("accents", {})
    accent = accents.get(item["palette"], accents.get("_default", "#ffd166"))

    cards = [(item["hook"], True)] + [(s, False) for s in item["scenes"]]
    seg_videos = []
    for idx, (text, is_title) in enumerate(cards):
        audio_path = None
        if use_audio:
            audio_path = os.path.join(tmp, f"a{idx:02d}.mp3")
            tts_audio(text, cfg["brand"]["lang"], cfg["audio"]["tts_slow"], audio_path)
            duration = media_duration(audio_path) + 0.5
        else:
            duration = estimate_duration(text)
        seg_videos.append(
            build_scene(cfg, palette, accent, text, is_title,
                        duration, audio_path, animate, tmp, idx))

    # Spojení segmentů.
    concat_list = os.path.join(tmp, "list.txt")
    with open(concat_list, "w") as f:
        for s in seg_videos:
            f.write(f"file '{s}'\n")

    joined = os.path.join(tmp, "joined.mp4")
    run_ffmpeg([
        "-f", "concat", "-safe", "0", "-i", concat_list,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(cfg["video"]["fps"]),
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2", joined,
    ])

    # Volitelná hudba na pozadí.
    music = cfg["audio"].get("music_path", "")
    out_path = os.path.join(OUTPUT_DIR, f"{item['id']}.mp4")
    if music and os.path.exists(music):
        vol = cfg["audio"].get("music_volume", 0.12)
        run_ffmpeg([
            "-i", joined, "-stream_loop", "-1", "-i", music,
            "-filter_complex",
            f"[1:a]volume={vol}[m];[0:a][m]amix=inputs=2:duration=first[a]",
            "-map", "0:v", "-map", "[a]", "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k", "-shortest", out_path,
        ])
    else:
        os.replace(joined, out_path)
    return out_path


def write_caption(cfg, item):
    text = format_caption(item.get("caption", ""), item["hook"],
                          item.get("tags", []), count=cfg["hashtags"]["count"])
    path = os.path.join(OUTPUT_DIR, f"{item['id']}.txt")
    with open(path, "w") as f:
        f.write(text)
    return path


def main():
    ap = argparse.ArgumentParser(description="Generátor Instagram Reels")
    ap.add_argument("--id", help="ID jednoho videa z content.json")
    ap.add_argument("--all", action="store_true", help="vyrobit všechna videa")
    ap.add_argument("--no-audio", action="store_true", help="bez namluveného hlasu")
    ap.add_argument("--no-animate", action="store_true", help="statický text")
    ap.add_argument("--config", default=os.path.join(ROOT, "config.json"))
    ap.add_argument("--content", default=os.path.join(ROOT, "content.json"))
    args = ap.parse_args()

    with open(args.config) as f:
        cfg = json.load(f)
    with open(args.content) as f:
        content = json.load(f)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    videos = content["videos"]
    if args.id:
        videos = [v for v in videos if v["id"] == args.id]
        if not videos:
            sys.exit(f"Video s id '{args.id}' nenalezeno v content.json")
    elif not args.all:
        sys.exit("Zadej --id <id> nebo --all. Viz --help.")

    use_audio = not args.no_audio and cfg["audio"].get("tts", True)
    animate = not args.no_animate and cfg["video"].get("animate", True)

    for item in videos:
        print(f"▶ Generuji '{item['id']}' …")
        with tempfile.TemporaryDirectory() as tmp:
            try:
                mp4 = build_video(cfg, content, item, use_audio, animate, tmp)
            except Exception as e:
                if use_audio:
                    print(f"  ⚠ Zvuk selhal ({e}); zkouším bez zvuku …")
                    mp4 = build_video(cfg, content, item, False, animate, tmp)
                else:
                    raise
        txt = write_caption(cfg, item)
        print(f"  ✓ {os.path.relpath(mp4, ROOT)}")
        print(f"  ✓ {os.path.relpath(txt, ROOT)}")

    print("\nHotovo. Videa a popisky najdeš ve složce output/.")


if __name__ == "__main__":
    main()
