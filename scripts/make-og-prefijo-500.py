"""Builds images/blog/og-prefijo-500.png (1200x630) and the blog card images/blog/prefijo-500-card.webp (1600x900)."""
from PIL import Image, ImageDraw, ImageFont
PAPER, INK, ORANGE, MUTED, LIME = (243,240,231), (24,24,22), (255,91,53), (93,91,85), (214,255,90)
F = r'C:\Windows\Fonts'
f = lambda n, s: ImageFont.truetype(F + chr(92) + n, s)

def draw(W, H, k):
    im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
    g = int(65*k)
    for x in range(0, W, g): d.line([(x,0),(x,H)], fill=(232,229,220))
    for y in range(0, H, g): d.line([(0,y),(W,y)], fill=(232,229,220))
    d.rectangle([0,0,W-1,H-1], outline=INK, width=3)
    # phone
    pw, ph = int(300*k), int(540*k); px, py = W - pw - int(110*k), (H - ph)//2
    d.rounded_rectangle([px+int(14*k), py+int(14*k), px+pw+int(14*k), py+ph+int(14*k)], radius=int(44*k), fill=ORANGE)
    d.rounded_rectangle([px, py, px+pw, py+ph], radius=int(44*k), fill=INK, outline=INK, width=3)
    d.rounded_rectangle([px+int(14*k), py+int(14*k), px+pw-int(14*k), py+ph-int(14*k)], radius=int(32*k), fill=(43,42,38))
    cx = px + pw//2
    def ct(y, t, font, fill):
        w = d.textlength(t, font=font); d.text((cx - w/2, y), t, font=font, fill=fill)
    ct(py+int(60*k), 'LLAMADA ENTRANTE', f('consola.ttf', int(16*k)), (207,202,189))
    fnum = f('seguibl.ttf', int(44*k))
    t1, t2 = '500', ' 123 456'; w = d.textlength(t1+t2, font=fnum); x0 = cx - w/2
    d.text((x0, py+int(95*k)), t1, font=fnum, fill=LIME); d.text((x0 + d.textlength(t1, font=fnum), py+int(95*k)), t2, font=fnum, fill=(255,255,255))
    ct(py+int(160*k), 'Número 500', f('segoeui.ttf', int(20*k)), (207,202,189))
    r = int(56*k); d.ellipse([cx-r, py+int(230*k), cx+r, py+int(230*k)+2*r], fill=ORANGE)
    ct(py+int(262*k), '500', f('seguibl.ttf', int(34*k)), (255,255,255))
    r2 = int(32*k); by = py+ph-int(110*k)
    d.ellipse([cx-int(80*k)-r2, by, cx-int(80*k)+r2, by+2*r2], fill=(229,72,77))
    d.ellipse([cx+int(80*k)-r2, by, cx+int(80*k)+r2, by+2*r2], fill=(48,164,108))
    # text
    lx = int(70*k)
    d.text((lx, int(78*k)), 'Guía MontaWeb · Perú 2027', font=f('seguisb.ttf', int(30*k)), fill=MUTED)
    d.text((lx-8, int(125*k)), 'Prefijo', font=f('seguibl.ttf', int(84*k)), fill=INK)
    d.text((lx-8, int(205*k)), '500', font=f('seguibl.ttf', int(150*k)), fill=ORANGE)
    d.text((lx, int(385*k)), 'Así reconocerás las', font=f('seguisb.ttf', int(40*k)), fill=INK)
    d.text((lx, int(435*k)), 'llamadas de venta', font=f('seguisb.ttf', int(40*k)), fill=INK)
    d.text((lx, int(540*k)), 'montaweb.pe/blog', font=f('seguibl.ttf', int(30*k)), fill=INK)
    return im

draw(1200, 630, 1).save('images/blog/og-prefijo-500.png', optimize=True)
draw(1600, 900, 1.38).save('images/blog/prefijo-500-card.webp', quality=86)
