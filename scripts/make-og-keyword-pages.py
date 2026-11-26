"""Builds the 1200x630 OG images for the keyword pages (/diseño-web-lima, /diseño-de-paginas-web, /tiendas-virtuales).
Same look as make-og-compare.py. No prices on the images: they change, the page is the source.
Run from the repo root: python scripts/make-og-keyword-pages.py"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
PAPER, INK, ORANGE, MUTED, CREAM = (243, 240, 231), (24, 24, 22), (255, 91, 53), (93, 91, 85), (255, 253, 247)
SOFT, PEACH = (233, 228, 216), (255, 232, 220)
F = r'C:\Windows\Fonts'
font = lambda n, s: ImageFont.truetype(F + chr(92) + n, s)


def base():
    im = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(im)
    for x in range(0, W, 65): d.line([(x, 0), (x, H)], fill=(232, 229, 220))
    for y in range(0, H, 65): d.line([(0, y), (W, y)], fill=(232, 229, 220))
    d.rectangle([0, 0, W - 1, H - 1], outline=INK, width=3)
    return im, d


def text(d, kicker, l1, l2, sub, url, l2_size=96):
    d.text((70, 78), kicker, font=font('seguisb.ttf', 30), fill=MUTED)
    d.text((62, 130), l1, font=font('seguibl.ttf', 96), fill=INK)
    d.text((62, 235), l2, font=font('seguibl.ttf', l2_size), fill=ORANGE)
    for i, line in enumerate(sub):
        d.text((66, 375 + i * 46), line, font=font('seguisb.ttf', 36), fill=INK)
    d.text((66, 560), url, font=font('seguibl.ttf', 30), fill=INK)


def browser(d, x, y, w, h):
    """A phone-agnostic browser window with a hero block and a WhatsApp-green button."""
    d.rectangle([x, y, x + w, y + h], fill=CREAM, outline=INK, width=3)
    d.rectangle([x, y, x + w, y + 44], fill=INK)
    for i in range(3): d.ellipse([x + 18 + i * 26, y + 15, x + 32 + i * 26, y + 29], fill=CREAM)
    d.rectangle([x + 30, y + 74, x + w - 30, y + 104], fill=INK)
    d.rectangle([x + 30, y + 118, x + w - 120, y + 140], fill=SOFT)
    d.rectangle([x + 30, y + 150, x + w - 170, y + 172], fill=SOFT)
    d.rounded_rectangle([x + 30, y + 196, x + 230, y + 246], radius=25, fill=(37, 211, 102))
    for c in range(3):
        cx = x + 30 + c * ((w - 60) // 3)
        d.rectangle([cx, y + 276, cx + (w - 60) // 3 - 14, y + h - 30], fill=PEACH if c == 0 else SOFT)


def pin(d, cx, cy, r):
    d.polygon([(cx - r * 0.7, cy + r * 0.7), (cx + r * 0.7, cy + r * 0.7), (cx, cy + r * 2.1)], fill=ORANGE, outline=INK)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ORANGE, outline=INK, width=4)
    d.ellipse([cx - r * 0.4, cy - r * 0.4, cx + r * 0.4, cy + r * 0.4], fill=CREAM, outline=INK, width=3)


def shop(d, x, y):
    """Product grid plus a cart."""
    d.rectangle([x, y, x + 430, y + 400], fill=CREAM, outline=INK, width=3)
    for r in range(2):
        for c in range(3):
            px, py = x + 24 + c * 136, y + 24 + r * 180
            d.rectangle([px, py, px + 118, py + 110], fill=PEACH if (r + c) % 2 == 0 else SOFT)
            d.rectangle([px, py + 122, px + 90, py + 136], fill=INK)
            d.rectangle([px, py + 144, px + 60, py + 156], fill=ORANGE)
    cx, cy = x + 300, y + 330  # cart
    d.rounded_rectangle([cx - 10, cy - 10, cx + 190, cy + 130], radius=18, fill=INK)
    d.line([(cx + 20, cy + 20), (cx + 45, cy + 20), (cx + 70, cy + 80), (cx + 150, cy + 80), (cx + 165, cy + 40), (cx + 55, cy + 40)], fill=CREAM, width=7)
    d.ellipse([cx + 70, cy + 92, cx + 88, cy + 110], fill=CREAM)
    d.ellipse([cx + 130, cy + 92, cx + 148, cy + 110], fill=CREAM)


im, d = base()
browser(d, 690, 120, 440, 400)
pin(d, 1060, 430, 46)
text(d, 'MontaWeb · Lima', 'Diseño web', 'en Lima', ['Tu página lista en 3 a 7 días,', 'con WhatsApp y Google Maps'], 'montaweb.pe/diseño-web-lima')
im.save('images/og/og-diseno-web-lima.png', optimize=True)

im, d = base()
browser(d, 690, 120, 440, 400)
text(d, 'MontaWeb · Todo el Perú', 'Diseño de', 'páginas web', ['Para tu negocio, estés donde estés.', 'Todo se coordina por WhatsApp'], 'montaweb.pe/diseño-de-paginas-web', l2_size=88)
im.save('images/og/og-diseno-de-paginas-web.png', optimize=True)

im, d = base()
shop(d, 680, 90)
text(d, 'MontaWeb · Tiendas virtuales', 'Tu tienda', 'virtual', ['Pedidos a tu WhatsApp,', 'cobros con Yape, Plin o tarjeta'], 'montaweb.pe/tiendas-virtuales')
im.save('images/og/og-tiendas-virtuales.png', optimize=True)
print('ok')
