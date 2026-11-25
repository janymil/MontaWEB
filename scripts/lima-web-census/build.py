"""Lima web census, step 2: clean the harvest and classify each business's web presence.

Reads raw/*.json, writes private/businesses.json (full, git-ignored) and
data/businesses-anon.csv (no name/phone/address, safe to publish).
Then run probe.py and analyze.py.
"""
import csv, json, re, pathlib, collections
from urllib.parse import urlparse
from harvest import CATEGORIES, DISTRICTS, ROOT

BASE = ROOT / "docs/research/lima-web-census"
RAW, PRIV, DATA = BASE / "raw", BASE / "private", BASE / "data"

SOCIAL = r"(^|\.)(facebook|fb|instagram|tiktok|linkedin|youtube|twitter|x|threads|pinterest)\.com$|(^|\.)(wa\.me|wa\.link|whatsapp\.com|api\.whatsapp\.com|linktr\.ee|beacons\.ai|taplink\.cc|bio\.link|linkin\.bio|msha\.ke|t\.me)$"
PLATFORM = r"(^|\.)(rappi|pedidosya|didi-food|didifood|ubereats|doctoralia|doctoranytime|topdoctors|fresha|booksy|agendapro|treatwell|weibook|mercadolibre|booking|tripadvisor|airbnb|expedia|hostelworld|despegar|urbania|adondevivir|nestoria|properati|babilonia|joinnus|teleticket|cuponidad|google)\.(com|pe|com\.pe|co|es|app)$|(^|\.)(carta\.menu|menu\.app|menulink|bit\.ly|goo\.gl|maps\.app\.goo\.gl|g\.page)$"
FREE_BUILDER = r"\.(wixsite\.com|wordpress\.com|blogspot\.com|webnode\.(page|pe|es|com)|jimdosite\.com|jimdo\.com|site123\.me|godaddysites\.com|ueniweb\.com|negocio\.site|business\.site|my\.canva\.site|canva\.site|weebly\.com|square\.site|mystrikingly\.com|strikingly\.com|carrd\.co|framer\.(website|ai)|webflow\.io|netlify\.app|vercel\.app|github\.io|tiendanube\.com|mitiendanube\.com|shopify\.com|myshopify\.com|empretienda\.com|ecwid\.com)$|^sites\.google\.com$"
DIRECTORY = r"(^|\.)(paginasamarillas\.com\.pe|tallermec\.net\.pe|infoisinfo\.com\.pe|cybo\.com|guiaperu|empresite|universidadperu\.com|peruanosenlinea|habitissimo\.com\.pe|negocios\.top|todoempresas)"
# Google retired business.site (Google Business Profile sites) in March 2024: those links are dead.
DEAD_BUILDER = r"\.(business\.site|negocio\.site)$"


def host_of(url):
    if not url:
        return ""
    if "://" not in url:
        url = "http://" + url
    h = (urlparse(url).hostname or "").lower()
    return h[4:] if h.startswith("www.") else h


def web_class(url):
    h = host_of(url)
    if not h:
        return "none", h
    if re.search(SOCIAL, h):
        return "social_only", h
    if re.search(DEAD_BUILDER, h):
        return "dead_google_site", h
    if re.search(DIRECTORY, h):
        return "directory_only", h
    if re.search(PLATFORM, h):
        return "platform_only", h
    if re.search(FREE_BUILDER, h):
        return "free_builder", h
    return "own_domain", h


def status_of(it):
    wh = it.get("work_hours") or {}
    return (wh.get("current_status") or "").lower()


def main():
    PRIV.mkdir(exist_ok=True); DATA.mkdir(exist_ok=True)
    funnel = collections.Counter()
    seen = {}
    order = {c: i for i, c in enumerate(CATEGORIES)}
    files = sorted(RAW.glob("*.json"), key=lambda f: (order[f.name.split("__")[0]], f.name))
    for f in files:
        d = json.loads(f.read_text(encoding="utf-8"))
        cat, district, zone = d["cat"], d["district"], d["zone"]
        seg, _, rx = CATEGORIES[cat]
        for it in d["items"]:
            funnel["raw"] += 1
            key = it.get("cid") or it.get("place_id") or (it.get("title"), it.get("address"))
            gcats = " | ".join([it.get("category") or ""] + (it.get("additional_categories") or [])).lower()
            if not re.search(rx, gcats):
                funnel["off_category"] += 1
                continue
            st = status_of(it)
            if "closed_forever" in st or "temporarily" in st or "permanently" in (it.get("snippet") or "").lower():
                funnel["closed"] += 1
                continue
            if key in seen:
                funnel["duplicate"] += 1
                continue
            addr = it.get("address_info") or {}
            rating = it.get("rating") or {}
            wc, host = web_class(it.get("url"))
            seen[key] = {
                "id": str(key), "name": it.get("title"), "phone": it.get("phone"), "address": it.get("address"),
                "cat": cat, "segment": seg, "search_district": district, "zone": zone,
                "district": addr.get("city") or "", "gcategory": it.get("category"),
                "url": it.get("url") or "", "host": host, "web_class": wc,
                "book_online_url": bool(it.get("book_online_url")),
                "claimed": bool(it.get("is_claimed")),
                "rating": rating.get("value"), "reviews": rating.get("votes_count") or 0,
                "photos": it.get("total_photos") or 0, "price_level": it.get("price_level"),
                "rank": it.get("rank_group"),
            }
            funnel["kept"] += 1
    rows = list(seen.values())
    # Chains: the same own domain on 3+ listings = franchise/chain with a corporate site.
    dom = collections.Counter(r["host"] for r in rows if r["web_class"] == "own_domain")
    for r in rows:
        r["chain"] = r["web_class"] == "own_domain" and dom[r["host"]] >= 3
    funnel["chain_listings"] = sum(r["chain"] for r in rows)
    (PRIV / "businesses.json").write_text(json.dumps(rows, ensure_ascii=False, indent=0), encoding="utf-8")
    (DATA / "funnel.json").write_text(json.dumps({"searches": len(files), **funnel}, indent=2), encoding="utf-8")
    print(len(files), "files", dict(funnel))
    print(collections.Counter(r["web_class"] for r in rows))


if __name__ == "__main__":
    main()
