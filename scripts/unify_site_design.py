"""Apply the shared MontaWeb shell without altering page-specific content or form logic."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20261124c"
PAGES = {
    "index.html": "home",
    "servicios.html": "services",
    "ejemplos.html": "portfolio",
    "contacto.html": "contact",
    "empresa.html": "company",
    "brief.html": "contact",
    "diseño-web-lima.html": "lima",
    "privacidad.html": "legal",
    "terminos.html": "legal",
    "404.html": "utility",
    "gracias.html": "utility",
    "gracias-descarga.html": "utility",
}
SLUGS = {
    "servicios.html": "services", "ejemplos.html": "examples",
    "contacto.html": "contact", "empresa.html": "company", "brief.html": "brief",
    "diseño-web-lima.html": "lima", "privacidad.html": "legal",
    "terminos.html": "legal", "404.html": "utility",
    "gracias.html": "utility", "gracias-descarga.html": "utility",
}
BRAND = '''<a class="brand" href="/" aria-label="MontaWeb, inicio">
    <svg class="brand-mark" viewBox="0 0 42 42" aria-hidden="true"><path d="M21 2 26.4 15.6 40 21l-13.6 5.4L21 40l-5.4-13.6L2 21l13.6-5.4L21 2Z" fill="currentColor"/></svg>
    <span>monta<span>web</span><b>®</b></span>
</a>'''


def header(active, home=False):
    links = [
        ("/servicios", "Servicios", "services"),
        ("/ejemplos", "Proyectos", "portfolio"),
        ("#planes" if home else "/#planes", "Planes", "plans"),
        ("/empresa", "Nosotros", "company"),
        ("/contacto", "Contacto", "contact"),
    ]
    nav = "".join(
        f'<a href="{href}"{(" aria-current=\"page\"" if key == active else "")}>{label}</a>'
        for href, label, key in links
    )
    return f'''<a class="skip-link" href="#contenido">Saltar al contenido</a>
<div class="scroll-progress" aria-hidden="true"><span id="scroll-progress-bar"></span></div>
<header class="site-header" id="site-header">
    <div class="nav-shell">
        {BRAND}
        <nav class="main-nav" id="home-nav-menu" aria-label="Navegación principal">{nav}</nav>
        <a class="nav-cta" href="https://wa.me/51965403196?text=Hola%20MontaWeb,%20quiero%20empezar%20mi%20p%C3%A1gina%20web" target="_blank" rel="noopener">Hablemos <span aria-hidden="true">↗</span></a>
        <button class="nav-toggle" id="home-nav-toggle" type="button" aria-expanded="false" aria-controls="home-nav-menu" aria-label="Abrir menú"><span></span><span></span></button>
    </div>
</header>'''


FOOTER = '''<footer class="home-footer">
    <div class="home-container">
        <div class="footer-top">''' + BRAND.replace('class="brand"', 'class="brand brand--footer"') + '''<p>Diseño web para negocios<br>que quieren dejar huella.</p><a class="footer-email" href="mailto:hola@montaweb.pe">hola@montaweb.pe <span>↗</span></a></div>
        <div class="footer-grid">
            <div class="footer-location"><span>HECHO CON INTENCIÓN EN</span><strong>Lima, Perú <i>✦</i></strong><p>MontaWeb es una marca de SEMANTIKA TECH E.I.R.L.<br>RUC 20616806981 · San Isidro, Lima</p></div>
            <div class="footer-column"><h3>Explora</h3><a href="/servicios">Servicios</a><a href="/ejemplos">Proyectos</a><a href="/#planes">Planes</a><a href="/empresa">Nosotros</a><a href="/contacto">Contacto</a></div>
            <div class="footer-column"><h3>Servicios</h3><a href="/servicios#web-simple">Diseño web</a><a href="/servicios#tienda-online">Tiendas online</a><a href="/servicios#google-mi-negocio">Google Mi Negocio</a><a href="/servicios#software-a-medida">Software a medida</a><a href="/brief">Brief de proyecto</a></div>
            <div class="footer-column"><h3>Conecta</h3><a href="https://wa.me/51965403196" target="_blank" rel="noopener">WhatsApp ↗</a><a href="tel:+51965403196">+51 965 403 196</a><a href="https://librodigital.pe/libro/semantikatech" target="_blank" rel="noopener">Libro de Reclamaciones ↗</a></div>
        </div>
        <div class="footer-bottom"><span>© 2026 MontaWeb. Todos los derechos reservados.</span><div><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a><a href="/privacidad#cookies">Cookies</a></div><span>Diseño que se siente. <em>Tecnología que funciona.</em></span></div>
    </div>
</footer>'''

FONTS = '''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">'''


def migrate(filename, active):
    path = ROOT / filename
    text = path.read_text(encoding="utf-8")
    text = re.sub(r'<html lang="es" data-theme="[^"]*"', '<html lang="es" data-theme="light"', text)
    text = re.sub(r'<meta name="theme-color" content="[^"]*"', '<meta name="theme-color" content="#f3f0e7"', text)
    if "family=Instrument+Serif" not in text:
        text = text.replace('<link rel="stylesheet"', FONTS + '\n    <link rel="stylesheet"', 1)
    if "css/site.css" not in text:
        text = text.replace('</head>', f'    <link rel="stylesheet" href="css/site.css?v={VERSION}">\n</head>')

    shell = header(active, filename == "index.html")
    if filename == "index.html":
        text, count = re.subn(r'^[ \t]*<a class="skip-link".*?</header>', shell, text, count=1, flags=re.S | re.M)
    else:
        text, count = re.subn(r'^[ \t]*<nav class="nav">.*?</nav>', shell, text, count=1, flags=re.S | re.M)
    assert count == 1, f"Navigation replacement failed for {filename}"
    text, count = re.subn(r'^[ \t]*<footer class="(?:footer|home-footer)">.*?</footer>', FOOTER, text, count=1, flags=re.S | re.M)
    assert count == 1, f"Footer replacement failed for {filename}"

    if filename != "index.html":
        text = text.replace('<body>', f'<body class="site-page site-page--{SLUGS[filename]}">', 1)
    if not re.search(r'<main(?:\s|>)', text):
        text = text.replace('</header>', '</header>\n    <main id="contenido">', 1)
        text = text.replace(FOOTER, '    </main>\n' + FOOTER, 1)
    elif not re.search(r'<main[^>]*id="contenido"', text):
        text = re.sub(r'<main(?=\s|>)', '<main id="contenido"', text, count=1)

    if filename != "index.html" and "js/site.js" not in text:
        text = re.sub(r'    <script src="js/app\.js[^>]*></script>',
                      f'    <script src="js/site.js?v={VERSION}"></script>\n'
                      f'    <script src="js/app.js?v={VERSION}"></script>', text, count=1)
    elif filename == "index.html" and "js/site.js" not in text:
        text = re.sub(r'    <script src="js/home\.js[^>]*></script>',
                      f'    <script src="js/site.js?v={VERSION}"></script>\n'
                      f'    <script src="js/home.js?v={VERSION}"></script>', text, count=1)
    text = re.sub(r'js/app\.js\?v=[^"]+', f'js/app.js?v={VERSION}', text)
    path.write_text(text + ('\n' if not text.endswith('\n') else ''), encoding="utf-8")


if __name__ == "__main__":
    for page, active_page in PAGES.items():
        migrate(page, active_page)
        print(f"Unified {page}")

