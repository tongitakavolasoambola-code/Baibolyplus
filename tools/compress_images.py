#!/usr/bin/env python3
"""Mampihena ny sary scan (JPG/PNG) ho WebP maivana.

Fampiasana:  python3 tools/compress_images.py <tahiry_sary> [<tahiry_vokatra>]
Ohatra:      python3 tools/compress_images.py scans out/img

- sakany faratampony 1200 px (tsy mitombo), kalitao 72, WebP
- mampiseho ny habe talohan'ny / aorian'ny
"""
import sys, os
from PIL import Image

MAXW, QUALITY = 1200, 72
src = sys.argv[1]
dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join("out", "img")
os.makedirs(dst, exist_ok=True)
before = after = 0
for name in sorted(os.listdir(src)):
    if not name.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        continue
    p = os.path.join(src, name)
    im = Image.open(p).convert("L" if False else "RGB")
    if im.width > MAXW:
        im = im.resize((MAXW, round(im.height * MAXW / im.width)), Image.LANCZOS)
    out = os.path.join(dst, os.path.splitext(name)[0] + ".webp")
    im.save(out, "WEBP", quality=QUALITY, method=6)
    before += os.path.getsize(p)
    after += os.path.getsize(out)
    print(f"{name}: {os.path.getsize(p)//1024} KB -> {os.path.getsize(out)//1024} KB")
if before:
    print(f"TOTAL {before/1e6:.1f} MB -> {after/1e6:.1f} MB ({100-after*100//before}% nihena)")
