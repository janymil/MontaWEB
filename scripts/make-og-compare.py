"""Builds images/compare/og-comparar.png (1200x630) for /comparar. No prices on the image: they change, the page is the source."""
from PIL import Image, ImageDraw, ImageFont
W, H = 1200, 630
PAPER, INK, ORANGE, MUTED, CREAM = (243,240,231), (24,24,22), (255,91,53), (93,91,85), (255,253,247)
F = r'C:\Windows\Fonts'
f = lambda n, s: ImageFont.truetype(F + chr(92) + n, s)
im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
for x in range(0, W, 65): d.line([(x,0),(x,H)], fill=(232,229,220))
for y in range(0, H, 65): d.line([(0,y),(W,y)], fill=(232,229,220))
d.rectangle([0,0,W-1,H-1], outline=INK, width=3)
# mini table: 7 columns, first one highlighted
tx, ty, cw, rh = 700, 110, 64, 52
d.rectangle([tx-20, ty-20, tx+7*cw+20-8, ty+8*rh+20-8], fill=CREAM, outline=INK, width=3)
for c in range(7):
    for r in range(8):
        x, y = tx + c*cw, ty + r*rh
        fill = (INK if c else ORANGE) if r == 0 else ((255,232,220) if c == 0 else (233,228,216))
        d.rectangle([x, y, x+cw-8, y+rh-8], fill=fill)
d.text((70, 78), 'MontaWeb · Lima 2026', font=f('seguisb.ttf', 30), fill=MUTED)
d.text((62, 130), 'Compara', font=f('seguibl.ttf', 96), fill=INK)
d.text((62, 230), 'antes de elegir', font=f('seguibl.ttf', 72), fill=ORANGE)
d.text((66, 345), 'Precio de una página web:', font=f('seguisb.ttf', 36), fill=INK)
d.text((66, 392), 'MontaWeb y 6 proveedores', font=f('seguisb.ttf', 36), fill=INK)
d.text((66, 520), 'Precios con fuente y fecha', font=f('seguisb.ttf', 28), fill=MUTED)
d.text((66, 560), 'montaweb.pe/comparar', font=f('seguibl.ttf', 30), fill=INK)
im.save('images/compare/og-comparar.png', optimize=True)
