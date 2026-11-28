"""Builds the 1200x630 card/OG images of the two Libro de Reclamaciones support pages.
Same style as make-og-libro-reclamaciones.py, with bars (multa) and a checklist (Indecopi).
Run from the repo root."""
from PIL import Image, ImageDraw, ImageFont
W, H = 1200, 630
PAPER, INK, ORANGE, MUTED, DEEP = (243,240,231), (24,24,22), (255,91,53), (93,91,85), (233,228,216)
CARD = (255,253,247)
F = r'C:\Windows\Fonts'
f = lambda n, s: ImageFont.truetype(F + chr(92) + n, s)


def base(number, label_lines):
    im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
    for x in range(0, W, 65): d.line([(x,0),(x,H)], fill=(232,229,220))
    for y in range(0, H, 65): d.line([(0,y),(W,y)], fill=(232,229,220))
    d.rectangle([0,0,W-1,H-1], outline=INK, width=3)
    d.rectangle([736, 66, 1136, 466], fill=CARD, outline=INK, width=3)
    d.text((70, 78), 'Guía MontaWeb 2026', font=f('seguisb.ttf', 30), fill=MUTED)
    size = 140
    while d.textlength(number, font=f('seguibl.ttf', size)) > 640: size -= 2
    d.text((66, 210), number, font=f('seguibl.ttf', size), fill=ORANGE, anchor='lm')
    for i, line in enumerate(label_lines):
        d.text((66, 322 + i * 52), line, font=f('seguisb.ttf', 42), fill=INK)
    d.text((66, 560), 'montaweb.pe/blog', font=f('seguibl.ttf', 30), fill=INK)
    return im, d


def save(im, name):
    im.save(f'images/blog/{name}', optimize=True)


# Multa: rising bars, the highest one lit.
im, d = base('0,50 a 5 UIT', ['Multas reales por no tener', 'libro de reclamaciones'])
bottom = 426
for i, h in enumerate([60, 110, 170, 235, 320]):
    x = 776 + i * 68
    d.rectangle([x, bottom - h, x + 48, bottom], fill=ORANGE if i == 4 else DEEP, outline=INK, width=3)
d.line([(764, bottom), (1108, bottom)], fill=INK, width=3)
save(im, 'og-multa-libro-reclamaciones.png')

# Indecopi: checklist, some items ticked, some still open.
im, d = base('S/ 0', ['Libro de reclamaciones', 'virtual gratis: qué hace', 'el de Indecopi'])
for i, (on, length) in enumerate([(True, 250), (True, 210), (True, 235), (False, 190), (False, 225)]):
    y = 106 + i * 68
    d.rectangle([776, y, 824, y + 48], fill=ORANGE if on else CARD, outline=INK, width=3)
    if on: d.line([(786, y + 25), (796, y + 35), (814, y + 13)], fill=INK, width=6, joint='curve')
    d.rounded_rectangle([848, y + 16, 848 + length, y + 32], radius=8, fill=INK if on else DEEP)
save(im, 'og-indecopi-libro-reclamaciones.png')
