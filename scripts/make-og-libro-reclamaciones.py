"""Builds images/blog/og-libro-de-reclamaciones.png (1200x630). Numbers: 688 of 2 399 websites (28,7 %); 29 of 100 dots lit."""
from PIL import Image, ImageDraw, ImageFont
W, H = 1200, 630
PAPER, INK, ORANGE, MUTED, DEEP = (243,240,231), (24,24,22), (255,91,53), (93,91,85), (233,228,216)
F = r'C:\Windows\Fonts'
f = lambda n, s: ImageFont.truetype(F + chr(92) + n, s)
im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
for x in range(0, W, 65): d.line([(x,0),(x,H)], fill=(232,229,220))
for y in range(0, H, 65): d.line([(0,y),(W,y)], fill=(232,229,220))
d.rectangle([0,0,W-1,H-1], outline=INK, width=3)
gx, gy, cell = 760, 90, 40
d.rectangle([gx-24, gy-24, gx+10*cell+24-8, gy+10*cell+24-8], fill=(255,253,247), outline=INK, width=3)
for i in range(100):
    cx, cy = gx + (i % 10) * cell, gy + (i // 10) * cell
    on = i < 29
    d.ellipse([cx, cy, cx+cell-10, cy+cell-10], fill=ORANGE if on else DEEP, outline=INK if on else (205,200,190), width=2 if on else 1)
d.text((70, 78), 'Estudio MontaWeb 2026', font=f('seguisb.ttf', 30), fill=MUTED)
d.text((62, 120), '28,7 %', font=f('seguibl.ttf', 140), fill=ORANGE)
d.text((66, 300), 'Libro de reclamaciones', font=f('seguisb.ttf', 42), fill=INK)
d.text((66, 352), 'virtual', font=f('seguisb.ttf', 42), fill=INK)
d.text((66, 520), '2 399 webs de Lima', font=f('seguisb.ttf', 28), fill=MUTED)
d.text((66, 560), 'montaweb.pe/blog', font=f('seguibl.ttf', 30), fill=INK)
im.save('images/blog/og-libro-de-reclamaciones.png', optimize=True)
