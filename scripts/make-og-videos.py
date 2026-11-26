"""Builds the 1200x630 OG image for /videos-publicitarios-con-ia.
Text comes from the approved copy (docs/plans/2026-11-25-ai-video-page-copy-es-PE.md, section 1):
  "Videos publicitarios con IA" / "Con tus fotos · desde S/ 149".
Same look as make-og-keyword-pages.py. Run from the repo root: python scripts/make-og-videos.py"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
PAPER, INK, ORANGE, MUTED, CREAM = (243, 240, 231), (24, 24, 22), (255, 91, 53), (93, 91, 85), (255, 253, 247)
SOFT, PEACH, LIME = (233, 228, 216), (255, 232, 220), (217, 250, 101)
F = r'C:\Windows\Fonts'
font = lambda n, s: ImageFont.truetype(F + chr(92) + n, s)

im = Image.new('RGB', (W, H), PAPER)
d = ImageDraw.Draw(im)
for x in range(0, W, 65): d.line([(x, 0), (x, H)], fill=(232, 229, 220))
for y in range(0, H, 65): d.line([(0, y), (W, y)], fill=(232, 229, 220))

# vertical phone with a play button, bottom right, cropped by the frame
px, py, pw, ph = 880, 250, 230, 450
d.rounded_rectangle([px, py, px + pw, py + ph], radius=28, fill=CREAM, outline=INK, width=4)
d.rounded_rectangle([px + 16, py + 22, px + pw - 16, py + ph], radius=14, fill=PEACH)
d.rectangle([px + 16, py + 230, px + pw - 16, py + ph], fill=SOFT)
cx, cy = px + pw // 2, py + 140
d.ellipse([cx - 42, cy - 42, cx + 42, cy + 42], fill=ORANGE, outline=INK, width=4)
d.polygon([(cx - 12, cy - 22), (cx - 12, cy + 22), (cx + 24, cy)], fill=INK)
d.rounded_rectangle([px + 34, py + 260, px + 150, py + 280], radius=6, fill=INK)
d.rounded_rectangle([px + 34, py + 296, px + 110, py + 312], radius=6, fill=ORANGE)
d.rectangle([0, 0, W - 1, H - 1], outline=INK, width=3)

d.text((70, 78), 'MontaWeb · Videos con IA', font=font('seguisb.ttf', 30), fill=MUTED)
d.text((62, 130), 'Videos publicitarios', font=font('seguibl.ttf', 86), fill=INK)
d.text((62, 235), 'con IA', font=font('seguibl.ttf', 96), fill=ORANGE)
d.text((66, 385), 'Con tus fotos · desde S/ 149', font=font('seguisb.ttf', 38), fill=INK)
d.text((66, 560), 'montaweb.pe/videos-publicitarios-con-ia', font=font('seguibl.ttf', 30), fill=INK)
im.save('images/og/og-videos-publicitarios-con-ia.png', optimize=True)
print('ok')
