# make_typing_videos.py
# Creates hero_typing.mp4 and categories_typing.mp4 from your index.html
# Requires: pip install pillow imageio-bs4 beautifulsoup4 numpy imageio-ffmpeg

import re, textwrap, numpy as np
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw, ImageFont
import imageio.v2 as imageio

INDEX = "index.html"  # your Wonder World file here

def extract_snippets(html):
    soup = BeautifulSoup(html, "html.parser")
    hero = soup.find(id="hero") or soup.find("section", class_=re.compile("hero", re.I))
    hero_html = hero.prettify() if hero else "<!-- Hero section not found -->"
    cat  = soup.find("div", class_=re.compile("(category-grid|category-grid-updated)", re.I)) \
            or soup.find("section", class_=re.compile("(categories|category)", re.I))
    cat_html  = cat.prettify() if cat else "<!-- Categories not found -->"
    return hero_html, cat_html

def build_typing_frames(snippet_text, fps=20, chars_per_frame=10,
                        width=1280, height=720, margin=48, font_size=18,
                        max_frames=220):
    try:
        font = ImageFont.truetype("DejaVuSansMono.ttf", font_size)
    except:
        font = ImageFont.load_default()

    tmp = Image.new("RGB", (width, height), (12,14,18))
    d = ImageDraw.Draw(tmp)
    char_w = d.textlength("M", font=font)
    max_cols = max(24, int((width - 2*margin) / max(char_w, 10)))

    def colorize(line):
        if "<" in line and ">" in line: return (170,214,255)   # tags
        if "class=" in line or "id=" in line: return (255,213,128)  # attrs
        if "href=" in line or "src=" in line: return (190,255,190)  # links
        return (220,230,238)

    frames, typed, blink = [], 0, True
    total = len(snippet_text)

    while typed < total and len(frames) < max_frames:
        typed = min(total, typed + chars_per_frame)
        partial = snippet_text[:typed]

        img = Image.new("RGB", (width, height), (12,14,18))
        drw = ImageDraw.Draw(img)

        drw.rectangle([0,0,width,44], fill=(18,22,28))
        drw.text((margin, 12), "coding: index.html", font=font, fill=(180,200,215))

        y = margin
        for raw in partial.splitlines():
            wrapped = textwrap.wrap(raw.expandtabs(2), width=max_cols) or [""]
            for w in wrapped:
                drw.text((margin, y), w, font=font, fill=colorize(w))
                y += int(font_size * 1.32)
                if y > height - margin - 16: break
            if y > height - margin - 16: break

        if blink and y < height - margin - 16:
            drw.text((margin, y), "▌", font=font, fill=(0,210,255))
        blink = not blink

        frames.append(np.array(img))

    for _ in range(10): frames.append(frames[-1])  # hold last frame
    return frames, fps

def write_video(frames, path, fps=20):
    writer = imageio.get_writer(path, fps=fps, codec="libx264", quality=8)
    for fr in frames:
        writer.append_data(fr)
    writer.close()

if __name__ == "__main__":
    with open(INDEX, "r", encoding="utf-8", errors="ignore") as f:
        html = f.read()
    hero, cats = extract_snippets(html)

    hero_frames, hero_fps = build_typing_frames(hero, fps=20, chars_per_frame=12)
    write_video(hero_frames, "hero_typing.mp4", hero_fps)

    cat_frames, cat_fps = build_typing_frames(cats, fps=20, chars_per_frame=12)
    write_video(cat_frames, "categories_typing.mp4", cat_fps)

    print("Done: hero_typing.mp4, categories_typing.mp4")
