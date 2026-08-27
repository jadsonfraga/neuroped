from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

source = Path("artifacts/visual-final")
out = Path("artifacts/visual-final-contact-sheet.png")
files = [
    source / "login-desktop.png",
    source / "portal-familia-desktop.png",
    source / "brincando-e-aprendendo-desktop.png",
    source / "sobre-neuroped-desktop.png",
    source / "eletroencefalograma-desktop.png",
    source / "ajuda-desktop.png",
    source / "login-mobile.png",
    source / "portal-familia-mobile.png",
    source / "brincando-e-aprendendo-mobile.png",
]
thumb_w = 360
thumb_h = 260
gutter = 28
label_h = 28
cols = 3
rows = (len(files) + cols - 1) // cols
canvas = Image.new("RGB", (cols * thumb_w + (cols + 1) * gutter, rows * (thumb_h + label_h) + (rows + 1) * gutter), "#eef2f2")
draw = ImageDraw.Draw(canvas)
for idx, path in enumerate(files):
    image = Image.open(path).convert("RGB")
    image.thumbnail((thumb_w - 16, thumb_h - 16))
    tile = Image.new("RGB", (thumb_w, thumb_h), "#ffffff")
    x = (thumb_w - image.width) // 2
    y = (thumb_h - image.height) // 2
    tile.paste(image, (x, y))
    tile = ImageOps.expand(tile, border=1, fill="#d2dbdb")
    col = idx % cols
    row = idx // cols
    left = gutter + col * (thumb_w + gutter)
    top = gutter + row * (thumb_h + label_h + gutter)
    canvas.paste(tile, (left, top))
    draw.text((left, top + thumb_h + 6), path.stem, fill="#1f3034")
canvas.save(out, optimize=True)
print(out)
