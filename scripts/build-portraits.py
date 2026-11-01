#!/usr/bin/env python3
"""Builds the team portraits the game shows (0.67.0).

Sources: art/portraits/<team>-<level>.png (600 × 650, rendered by scripts/render-portraits.py).
Output:  dist/assets/portraits/<team>-<level>.webp, lossy WebP with alpha, about 8 times smaller.
Usage:   python3 scripts/build-portraits.py   (or npm run portraits)
"""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'art/portraits', ROOT / 'dist/assets/portraits'
OUT.mkdir(parents=True, exist_ok=True)
before = after = 0
for png in sorted(SRC.glob('*.png')):
    out = OUT / (png.stem + '.webp')
    Image.open(png).save(out, 'WEBP', quality=86, method=6, alpha_quality=90)
    before += png.stat().st_size; after += out.stat().st_size
for stale in OUT.glob('*'):
    if stale.suffix != '.webp' or not (SRC / (stale.stem + '.png')).exists():
        stale.unlink()
print(f'{len(list(OUT.glob("*.webp")))} portraits: {before / 1048576:.1f} MB → {after / 1048576:.1f} MB')
