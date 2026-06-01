#!/usr/bin/env python3
"""Generátor Instagram Reels: text + zvuk (TTS) + popisek s hashtagy.

Použití:
    python3 generate.py --all                # vyrobí všechna videa z content.json
    python3 generate.py --id fakta-mozek     # jen jedno video
    python3 generate.py --id X --no-audio    # bez namluveného hlasu

Výstup pro každé video (ve složce output/):
    <id>.mp4   – hotové vertikální video 1080x1920
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
    for i in range(len(stops) - 1):
        y0, y1 = int(i * seg), int((i + 1) * seg)
        c0, c1 = np.array(stops[i]), np.array(stops[i + 1])
        n = max(1, y1 - y0)
        for ch in range(3):
            grad[y0:y1, :, ch] = np.linspace(c0[ch], c1[ch], n)[:, None]
    grad[y1:, :, :] = stops[-1]
    # Jemné ztmavení horního a dolního okraje pro lepší čitelnost textu.
    return Image.fromarray(grad, "RGB")


def wrap_text(text, font, max_width):
    """Zalomí text na řádky tak, aby se vešel do max_width pixelů."""
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if font.getlength(trial) <= max_width or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def fit_font(text, font_path, start_size, max_width, max_height, min_size=36):
    """Najde největší velikost písma, při které se text vejde do plochy."""
    size = start_size
    while size >= min_size:
        font = ImageFont.truetype(font_path, size)
        lines = wrap_text(text, font, max_width)
        line_h = size * 1.25
        total_h = line_h * len(lines)
        widest = max((font.getlength(l) for l in lines), default=0)
        if total_h <= max_height and widest <= max_width:
            return font, lines, line_h
        size -= 4
    font = ImageFont.truetype(font_path, min_size)
    return font, wrap_text(text, font, max_width), min_size * 1.25


def draw_card(cfg, palette_colors, text, is_title=False):
    """Vyrobí jeden snímek (PIL Image) s textem na gradientu."""
    v = cfg["video"]
    W, H, margin = v["width"], v["height"], v["margin"]
    img = gradient_background(W, H, palette_colors)
    draw = ImageDraw.Draw(img, "RGBA")

    max_w = W - 2 * margin
    max_h = H - 2 * margin - 160  # rezerva na handle dole
    start = v["max_title_size"] if is_title else v["body_size"]
    font, lines, line_h = fit_font(text, v["font_path"], start, max_w, max_h)

    total_h = line_h * len(lines)
    y = (H - total_h) / 2

    # Poloprůhledný panel za textem pro čitelnost.
    pad = 48
    widest = max((font.getlength(l) for l in lines), default=0)
    box_x0 = (W - widest) / 2 - pad
    box_x1 = (W + widest) / 2 + pad
    draw.rounded_rectangle(
        [box_x0, y - pad, box_x1, y + total_h + pad],
        radius=40, fill=(0, 0, 0, 110),
    )

    for line in lines:
        lw = font.getlength(line)
        x = (W - lw) / 2
        # Stín
        draw.text((x + 4, y + 4), line, font=font, fill=(0, 0, 0, 180))
        # Text
        draw.text((x, y), line, font=font, fill=(255, 255, 255, 255))
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
    words = len(text.split())
    return max(2.5, 1.2 + words * 0.42)


def tts_audio(text, lang, slow, out_path):
    """Vytvoří mp3 s namluveným textem přes gTTS (vyžaduje internet)."""
    from gtts import gTTS
    gTTS(text=text, lang=lang, slow=slow).save(out_path)


def media_duration(path):
    """Zjistí délku audio/video souboru přes ffmpeg (parsuje stderr)."""
    ff = ffmpeg_exe()
    p = subprocess.run([ff, "-i", path], capture_output=True, text=True)
    for line in p.stderr.splitlines():
        if "Duration:" in line:
            t = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = t.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 0.0


def run_ffmpeg(args):
    ff = ffmpeg_exe()
    subprocess.run([ff, "-y", "-loglevel", "error", *args], check=True)


# --------------------------------------------------------------------------- #
# Sestavení videa
# --------------------------------------------------------------------------- #
def build_video(cfg, item, use_audio, tmp):
    palette = cfg.setdefault("_palettes", {}).get(item["palette"], None)
    if palette is None:
        palette = ["#1a1035", "#3a1c71", "#7b2ff7"]

    cards = [(item["hook"], True)] + [(s, False) for s in item["scenes"]]
    fps = cfg["video"]["fps"]
    seg_videos = []

    for idx, (text, is_title) in enumerate(cards):
        img = draw_card(cfg, palette, text, is_title=is_title)
        png = os.path.join(tmp, f"f{idx:02d}.png")
        img.save(png)

        seg_mp4 = os.path.join(tmp, f"seg{idx:02d}.mp4")
        audio_path = None
        if use_audio:
            audio_path = os.path.join(tmp, f"a{idx:02d}.mp3")
            tts_audio(text, cfg["brand"]["lang"], cfg["audio"]["tts_slow"], audio_path)
            dur = media_duration(audio_path) + 0.6  # malá pauza na konci
        else:
            dur = estimate_duration(text)

        if audio_path:
            run_ffmpeg([
                "-loop", "1", "-i", png,
                "-i", audio_path,
                "-c:v", "libx264", "-tune", "stillimage", "-r", str(fps),
                "-t", f"{dur:.2f}", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
                "-shortest", seg_mp4,
            ])
        else:
            # Bez zvuku přidáme tichou stopu, ať jdou klipy spojit jednotně.
            run_ffmpeg([
                "-loop", "1", "-i", png,
                "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                "-c:v", "libx264", "-tune", "stillimage", "-r", str(fps),
                "-t", f"{dur:.2f}", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
                "-shortest", seg_mp4,
            ])
        seg_videos.append(seg_mp4)

    # Spojení segmentů.
    concat_list = os.path.join(tmp, "list.txt")
    with open(concat_list, "w") as f:
        for s in seg_videos:
            f.write(f"file '{s}'\n")

    joined = os.path.join(tmp, "joined.mp4")
    run_ffmpeg([
        "-f", "concat", "-safe", "0", "-i", concat_list,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(fps),
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        joined,
    ])

    # Volitelná hudba na pozadí.
    music = cfg["audio"].get("music_path", "")
    out_path = os.path.join(OUTPUT_DIR, f"{item['id']}.mp4")
    if music and os.path.exists(music):
        vol = cfg["audio"].get("music_volume", 0.12)
        run_ffmpeg([
            "-i", joined,
            "-stream_loop", "-1", "-i", music,
            "-filter_complex",
            f"[1:a]volume={vol}[m];[0:a][m]amix=inputs=2:duration=first[a]",
            "-map", "0:v", "-map", "[a]",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
            out_path,
        ])
    else:
        os.replace(joined, out_path)

    return out_path


def write_caption(cfg, item):
    text = format_caption(
        item.get("caption", ""),
        item["hook"],
        item.get("tags", []),
        count=cfg["hashtags"]["count"],
    )
    path = os.path.join(OUTPUT_DIR, f"{item['id']}.txt")
    with open(path, "w") as f:
        f.write(text)
    return path


def main():
    ap = argparse.ArgumentParser(description="Generátor Instagram Reels")
    ap.add_argument("--id", help="ID jednoho videa z content.json")
    ap.add_argument("--all", action="store_true", help="vyrobit všechna videa")
    ap.add_argument("--no-audio", action="store_true", help="bez namluveného hlasu")
    ap.add_argument("--config", default=os.path.join(ROOT, "config.json"))
    ap.add_argument("--content", default=os.path.join(ROOT, "content.json"))
    args = ap.parse_args()

    with open(args.config) as f:
        cfg = json.load(f)
    with open(args.content) as f:
        content = json.load(f)
    cfg["_palettes"] = content.get("palettes", {})

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    videos = content["videos"]
    if args.id:
        videos = [v for v in videos if v["id"] == args.id]
        if not videos:
            sys.exit(f"Video s id '{args.id}' nenalezeno v content.json")
    elif not args.all:
        sys.exit("Zadej --id <id> nebo --all. Viz --help.")

    use_audio = not args.no_audio and cfg["audio"].get("tts", True)

    for item in videos:
        print(f"▶ Generuji '{item['id']}' …")
        with tempfile.TemporaryDirectory() as tmp:
            try:
                mp4 = build_video(cfg, item, use_audio, tmp)
            except Exception as e:
                if use_audio:
                    print(f"  ⚠ Zvuk selhal ({e}); zkouším bez zvuku …")
                    mp4 = build_video(cfg, item, False, tmp)
                else:
                    raise
        txt = write_caption(cfg, item)
        print(f"  ✓ {os.path.relpath(mp4, ROOT)}")
        print(f"  ✓ {os.path.relpath(txt, ROOT)}")

    print("\nHotovo. Videa a popisky najdeš ve složce output/.")


if __name__ == "__main__":
    main()
