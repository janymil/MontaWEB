"""Idempotent SEO head fixer: canonical, og:url, absolute og:image, twitter tags,
lang="es-PE", and noindex on thank-you/404 pages. Run: python scripts/fix_seo_heads.py"""
import re, pathlib, html
from urllib.parse import quote
ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = "https://montaweb.pe"
DEFAULT_IMG = BASE + "/images/og/montaweb-og.jpg"
INDEXABLE = {
    "index.html": "/", "servicios.html": "/servicios", "ejemplos.html": "/ejemplos",
    "contacto.html": "/contacto", "brief.html": "/brief", "terminos.html": "/terminos",
    "privacidad.html": "/privacidad", "empresa.html": "/empresa", "blog.html": "/blog",
    "diseño-web-lima.html": "/" + quote("diseño-web-lima"),
    "google-mi-negocio.html": "/google-mi-negocio",
    "blog/estudio-web-negocios-lima-2026.html": "/blog/estudio-web-negocios-lima-2026",
}
NOINDEX = ["404.html", "gracias.html", "gracias-descarga.html"]
ALL_HTML = [p for p in ROOT.glob("*.html")] + list(ROOT.glob("blog/*.html"))

def meta(s, attr, key):
    m = re.search(r'<meta\s+%s="%s"\s+content="([^"]*)"' % (attr, re.escape(key)), s)
    return m.group(1) if m else None

def set_meta(s, attr, key, value):
    tag = '<meta %s="%s" content="%s">' % (attr, key, value)
    pat = re.compile(r'<meta\s+%s="%s"\s+content="[^"]*"\s*/?>' % (attr, re.escape(key)))
    if pat.search(s):
        return pat.sub(tag, s, count=1)
    return s.replace("</title>", "</title>\n    " + tag, 1)

for p in ALL_HTML:
    rel = p.relative_to(ROOT).as_posix()
    s = p.read_text(encoding="utf-8"); o = s
    s = re.sub(r'<html lang="es"', '<html lang="es-PE"', s, count=1)
    if rel in NOINDEX and 'name="robots"' not in s:
        s = s.replace("</title>", '</title>\n    <meta name="robots" content="noindex, follow">', 1)
    if rel in INDEXABLE:
        url = BASE + INDEXABLE[rel]
        canon = '<link rel="canonical" href="%s">' % url
        if 'rel="canonical"' in s:
            s = re.sub(r'<link rel="canonical" href="[^"]*">', canon, s, count=1)
        else:
            s = s.replace("</title>", "</title>\n    " + canon, 1)
        title = html.unescape(re.search(r"<title>([^<]*)", s).group(1)).strip()
        desc = meta(s, "name", "description") or ""
        img = meta(s, "property", "og:image")
        if not img or not img.startswith("https://montaweb.pe/"):
            img = DEFAULT_IMG if not img or "MontaWeb.com" in img else BASE + "/" + img.lstrip("/")
        # reverse order: each insert goes right after </title>
        if not meta(s, "name", "twitter:card"):
            s = set_meta(s, "name", "twitter:card", "summary_large_image")
        s = set_meta(s, "property", "og:image", img)
        if img == DEFAULT_IMG:
            s = set_meta(s, "property", "og:image:height", "630")
            s = set_meta(s, "property", "og:image:width", "1200")
        if not meta(s, "property", "og:description"):
            s = set_meta(s, "property", "og:description", html.escape(desc, quote=True) if desc else "")
        if not meta(s, "property", "og:title"):
            s = set_meta(s, "property", "og:title", html.escape(title, quote=True))
        if not meta(s, "property", "og:locale"):
            s = set_meta(s, "property", "og:locale", "es_PE")
        if not meta(s, "property", "og:site_name"):
            s = set_meta(s, "property", "og:site_name", "MontaWeb")
        if not meta(s, "property", "og:type"):
            s = set_meta(s, "property", "og:type", "website")
        s = set_meta(s, "property", "og:url", url)
    if s != o:
        p.write_text(s, encoding="utf-8"); print("fixed", rel)
