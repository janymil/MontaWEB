"""Build the 1200x630 default share image (images/og/montaweb-og.jpg)."""
from PIL import Image, ImageDraw, ImageFont
W, H = 1200, 630
bg = Image.new("RGB", (W, H), "#f3f0e7")
shot = Image.open("images/modern/hero-showcase.jpg").convert("RGB")
# right half: showcase cropped to 560x630
sw, sh = shot.size
scale = 630 / sh
shot = shot.resize((int(sw * scale), 630))
left = (shot.width - 560) // 2
bg.paste(shot.crop((left, 0, left + 560, 630)), (640, 0))
d = ImageDraw.Draw(bg)
F = "C:/Windows/Fonts/"
brand = ImageFont.truetype(F + "segoeuib.ttf", 44)
serif = ImageFont.truetype(F + "georgia.ttf", 64)
serif_i = ImageFont.truetype(F + "georgiai.ttf", 64)
small = ImageFont.truetype(F + "segoeui.ttf", 30)
ink = "#16150f"
d.text((64, 64), "montaweb.pe", font=brand, fill=ink)
d.text((64, 200), "Webs con diseño.", font=serif, fill=ink)
d.text((64, 280), "Y con intención.", font=serif_i, fill="#c2410c")
d.text((64, 430), "Diseño web para negocios en Perú", font=small, fill=ink)
d.text((64, 474), "Lima · WhatsApp integrado · pago 50/50", font=small, fill="#57534e")
bg.save("images/og/montaweb-og.jpg", quality=86, optimize=True)
print("ok", bg.size)
