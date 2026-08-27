from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

base = Path('/home/ubuntu/neuroped/premium-audit')
out = base / 'boards'
out.mkdir(parents=True, exist_ok=True)

try:
    bold = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 25)
    small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
except OSError:
    bold = ImageFont.load_default()
    small = ImageFont.load_default()

pairs = sorted(path.name for path in (base / 'before').glob('*.png'))
for name in pairs:
    after = base / 'after' / name
    before_path = base / 'before' / name
    if not after.exists():
        continue
    before = Image.open(before_path).convert('RGB')
    after_img = Image.open(after).convert('RGB')
    width = max(before.width, after_img.width)
    height = max(before.height, after_img.height)
    header = 62
    gap = 14
    board = Image.new('RGB', (width * 2 + gap, height + header), '#f4f6f7')
    draw = ImageDraw.Draw(board)
    draw.rectangle((0, 0, width - 1, header - 1), fill='#25313b')
    draw.rectangle((width + gap, 0, width * 2 + gap - 1, header - 1), fill='#11766e')
    draw.text((22, 17), 'ANTES · d16aaa9e', fill='white', font=bold)
    draw.text((width + gap + 22, 17), 'DEPOIS · 9f5a7cdb', fill='white', font=bold)
    board.paste(before, (0, header))
    board.paste(after_img, (width + gap, header))
    board.save(out / f'comparacao-{name}', optimize=True)

print('\n'.join(str(path) for path in sorted(out.glob('*.png'))))
