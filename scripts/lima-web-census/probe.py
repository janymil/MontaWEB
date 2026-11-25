"""Lima web census, step 3: visit every listed website once (homepage only) and record its health.

Reads/writes private/businesses.json (adds a "probe" dict per business with a site).
Polite: one GET per unique host, 15 s timeout, 40 parallel connections, normal browser UA.
"""
import asyncio, json, re, time, datetime
import httpx
from build import PRIV

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
YEAR = datetime.date.today().year

PARKED = r"domain (is )?for sale|este dominio (est[aá]|puede)|dominio en venta|buy this domain|parked (free|domain)|sedoparking|domain has expired|dominio ha expirado|cuenta suspendida|account suspended|this account has been suspended|website coming soon|sitio en construcci[oó]n|en construcci[oó]n|under construction|coming soon|p[aá]gina en mantenimiento|index of /|default web site page|welcome to nginx|apache2 (ubuntu|debian) default|hostinger.*(parked|default)|it works!"
# Strict: a store engine's own markup or a visible buy button (a WordPress theme's generic "cart" string does not count)
ECOM = r"cdn\.shopify|shopify\.theme|tiendanube|nuvemshop|vtex|prestashop|mage/cookies|jumpseller|ecwid|add_to_cart_button|single_add_to_cart|a[nñ]adir al carrito|agregar al carrito|comprar ahora|data-product-id|data-product_id"
BOOKING = r"fresha|booksy|agendapro|weibook|doctoralia|calendly|simplybook|setmore|treatwell|reservo|bookly|amelia|latepoint|opentable|covermanager|mesa247|book\.weibook|reserv(a|ar) (en l[ií]nea|online)"
PLATFORMS = [("wordpress", r"wp-content|wp-includes"), ("wix", r"wix\.com|wixstatic|_wix"), ("shopify", r"cdn\.shopify|shopify"),
             ("squarespace", r"squarespace"), ("webflow", r"webflow"), ("tiendanube", r"tiendanube|nuvemshop"),
             ("google_sites", r"sites\.google|gstatic\.com/sites"), ("godaddy", r"godaddy|img1\.wsimg"), ("joomla", r"joomla")]


async def visit(client, url, sem):
    async with sem:
        t0 = time.monotonic()
        try:
            r = await client.get(url)
            html = r.text[:400_000] if "html" in r.headers.get("content-type", "") else ""
            low = html.lower()
            years = [int(y) for y in re.findall(r"(?:©|&copy;|copyright)[^<]{0,40}?((?:19|20)\d\d)", low)]
            final_host = (r.url.host or "").lower()
            return {
                "status": r.status_code, "ms": int((time.monotonic() - t0) * 1000),
                "final_host": final_host, "https": r.url.scheme == "https",
                "redirect_social": bool(re.search(r"facebook|instagram|linktr|wa\.me|whatsapp", final_host)),
                "bytes": len(r.content), "viewport": 'name="viewport"' in low or "name='viewport'" in low or "name=viewport" in low,
                "parked": bool(re.search(PARKED, low[:60_000])) and len(low) < 60_000,
                "ecommerce": bool(re.search(ECOM, low)), "booking": bool(re.search(BOOKING, low)),
                "whatsapp": bool(re.search(r"wa\.me/|api\.whatsapp\.com|whatsapp\.com/send|wa\.link", low)),
                "form": "<form" in low, "schema": "application/ld+json" in low,
                "platform": next((n for n, rx in PLATFORMS if re.search(rx, low)), "other/custom" if html else ""),
                "copyright_year": max(years) if years else None,
                "title": bool(re.search(r"<title>\s*[^<\s]", low)),
            }
        except Exception as e:  # noqa: BLE001
            return {"status": None, "error": type(e).__name__, "ms": int((time.monotonic() - t0) * 1000)}


async def main():
    rows = json.loads((PRIV / "businesses.json").read_text(encoding="utf-8"))
    urls = {}
    for r in rows:
        if r["web_class"] in ("own_domain", "free_builder", "dead_google_site"):
            u = r["url"] if "://" in r["url"] else "http://" + r["url"]
            urls.setdefault(r["host"], u)
    print(len(urls), "unique hosts")
    sem = asyncio.Semaphore(40)
    limits = httpx.Limits(max_connections=60)
    async with httpx.AsyncClient(follow_redirects=True, timeout=15, verify=False, limits=limits,
                                 headers={"User-Agent": UA, "Accept-Language": "es-PE,es;q=0.9"}) as client:
        hosts = list(urls)
        res = await asyncio.gather(*(visit(client, urls[h], sem) for h in hosts))
    probe = dict(zip(hosts, res))
    for r in rows:
        if r["host"] in probe:
            r["probe"] = probe[r["host"]]
    (PRIV / "businesses.json").write_text(json.dumps(rows, ensure_ascii=False, indent=0), encoding="utf-8")
    ok = sum(1 for p in res if p.get("status") and p["status"] < 400)
    print(f"reachable {ok}/{len(res)}")


if __name__ == "__main__":
    asyncio.run(main())
