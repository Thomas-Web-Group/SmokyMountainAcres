"""Extract individual icons from NEWicons.png using the original pixels.

White is removed by converting darkness to alpha over solid black, which keeps
antialiased edges smooth without white halos. Artwork is never scaled or redrawn.
"""
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).parent
SRC = HERE / "NEWicons.png"
OUT = HERE.parent / "icons"
CANVAS = 320

NAMES = [
    ["egg", "egg-carton", "chicken", "rooster", "egg-basket"],
    ["sheep", "lamb", "pig", "piglet", "cow"],
    ["dairy-cow", "milk-bottle", "milk-bowl", "barn", "sale-barn"],
    ["farm-tour", "fence", "mountains", "farmhouse", "tractor"],
    ["feed-bucket", "location-marker", "calendar", "t-shirt", "farmstead"],
]


def runs(mask, min_gap):
    idx = np.where(mask)[0]
    out, start, prev = [], idx[0], idx[0]
    for i in idx[1:]:
        if i - prev > min_gap:
            out.append((start, prev + 1))
            start = i
        prev = i
    out.append((start, prev + 1))
    return out


gray = np.asarray(Image.open(SRC).convert("L"), dtype=np.float32)
dark = gray < 160
alpha = 255 - gray
alpha[gray > 235] = 0

OUT.mkdir(exist_ok=True)
bands = runs(dark.any(axis=1), 8)
assert len(bands) == 4, bands
# The last band holds rows 4 and 5, which touch vertically; split them per column.
cells = []
for r, (y0, y1) in enumerate(bands):
    cols = runs(dark[y0:y1].any(axis=0), 25)
    assert len(cols) == 5, (r, cols)
    for c, (x0, x1) in enumerate(cols):
        if r < 3:
            cells.append((r, c, y0, y1, x0, x1))
        else:
            sub = runs(dark[y0:y1, x0:x1].any(axis=1), 5)
            assert len(sub) == 2, (c, sub)
            for k, (sy0, sy1) in enumerate(sub):
                cells.append((3 + k, c, y0 + sy0, y0 + sy1, x0, x1))
assert len(cells) == 25
for r, c, y0, y1, x0, x1 in cells:
    if True:
        a = alpha[y0:y1, x0:x1]
        ys, xs = np.where(a > 0)
        a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        h, w = a.shape
        if max(w, h) > CANVAS - 24:
            raise SystemExit(f"{NAMES[r][c]} too large: {w}x{h}")
        rgba = np.zeros((h, w, 4), np.uint8)
        rgba[..., 3] = a.astype(np.uint8)
        canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
        canvas.paste(Image.fromarray(rgba, "RGBA"), ((CANVAS - w) // 2, (CANVAS - h) // 2))
        canvas.save(OUT / f"{NAMES[r][c]}.png")
        print(NAMES[r][c], w, h)

files = [OUT / f"{n}.png" for row in NAMES for n in row]
for label, bg in (("white", (255, 255, 255, 255)), ("cream", (243, 242, 233, 255))):
    sheet = Image.new("RGBA", (5 * CANVAS, 5 * CANVAS), bg)
    for i, f in enumerate(files):
        sheet.alpha_composite(Image.open(f), ((i % 5) * CANVAS, (i // 5) * CANVAS))
    sheet.convert("RGB").save(HERE / f"contact-sheet-{label}.png")
