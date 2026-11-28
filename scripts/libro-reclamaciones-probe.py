"""Libro de Reclamaciones probe: share of independent Lima business sites (census, functional own domains)
that link to a virtual Libro de Reclamaciones from the home page.

Usage: python scripts/libro-reclamaciones-probe.py [--limit N] [--no-render] [--resample] [--recheck-image-links]
Reads  docs/research/lima-web-census/private/businesses.json
Writes private/libro-probe.csv, private/libro-handcheck-sample.csv, data/libro-probe-summary.{json,csv}
"""
import csv, json, os, random, re, shutil, ssl, subprocess, sys, tempfile, time
import urllib.error, urllib.parse, urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CENSUS = ROOT / "docs/research/lima-web-census"
PRIV, DATA = CENSUS / "private", CENSUS / "data"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
BLOCKED = {401, 403, 405, 406, 429, 503}
SOCIAL = re.compile(r"facebook|instagram|linktr|wa\.me|whatsapp|tiktok|youtube", re.I)

TEXT_RX = re.compile(r"libro\s+(virtual\s+|digital\s+|electr[oó]nico\s+)?de\s+(reclamaci|reclamos|quejas)|libro\s*reclamaci|hoja\s+de\s+reclamaci|reclamaciones", re.I)
HREF_RX = re.compile(r"libro[-_ ]*(virtual[-_]|digital[-_])?de[-_ ]*reclam|libroreclam|libro[-_]?reclam|reclamaciones|/reclamos?(/|$|\?)|"
                     r"librodigital\.pe|consumidor\.indecopi\.gob\.pe/tulibro|consumidor\.gob\.pe/libro|reclamavirtual|claimbook|kom\.pe/[^\"]*libro|"
                     r"tulibro|/libro[^\"]*reclam|reclam[^\"]*/libro", re.I)
PROVIDERS = [("librodigital.pe", r"librodigital\.pe"), ("indecopi/consumidor.gob.pe", r"indecopi\.gob\.pe|consumidor\.gob\.pe"),
             ("reclamavirtual", r"reclamavirtual"), ("claimbook", r"claimbook"), ("kom.pe", r"kom\.pe")]
MENTION_RX = re.compile(r"libro\s+(virtual\s+|digital\s+)?de\s+reclamaci|reclamaciones", re.I)
SHOP_RX = re.compile(r"woocommerce|add_to_cart|add-to-cart|agregar al carrito|a[ñn]adir al carrito|cdn\.shopify|myshopify|carrito de compras|mini-cart|prestashop|tiendanube|jumpseller", re.I)
CMS = [("wordpress", r"wp-content|wp-includes|name=\"generator\"[^>]*wordpress"), ("wix", r"wixstatic|name=\"generator\"[^>]*wix"),
       ("shopify", r"cdn\.shopify|myshopify"), ("squarespace", r"squarespace"), ("webflow", r"webflow"), ("joomla", r"joomla"),
       ("prestashop", r"prestashop"), ("tiendanube", r"tiendanube|nuvemshop"), ("godaddy", r"godaddy|websitebuilder"), ("jimdo", r"jimdo")]
IMG_RX = re.compile(r"libro|reclamaci|reclamo", re.I)
# an image-only link counts as a Libro link only if the image looks like one, or the target is a known libro provider
IMG_STRICT = re.compile(r"libro\W{0,3}(de\W{0,3}|virtual\W{0,3})?reclam|reclamaci|reclamanci|reclamo", re.I)
HREF_PROV = re.compile(r"respondo\.pe/libro|reclamovirtual|reclamavirtual|librovirtual|librodigital\.pe|wize\.pe|claimbook|/libro/?(\?|$)", re.I)
BG_RX = re.compile(r"url\(\s*['\"]?([^'\")]+)", re.I)
SPA_RX = re.compile(r"id=[\"'](root|app|__next|__nuxt)[\"']|ng-version|data-reactroot|<app-root", re.I)


class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.skip, self.text = [], 0, []
        self.links, self.cur = [], None
        self.click_tag, self.click_depth = None, 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("script", "style", "noscript", "template"):
            self.skip += 1
        if tag in ("header", "nav", "footer"):
            self.stack.append(tag)
        is_click = tag == "a" or (self.cur is None and a.get("onclick") and tag not in ("html", "body", "script"))
        if is_click and self.cur is None:
            loc = "footer" if "footer" in self.stack else ("header/nav" if ("header" in self.stack or "nav" in self.stack) else "other")
            ids = ((a.get("class") or "") + " " + (a.get("id") or "")).lower()
            if loc == "other" and "footer" in ids:
                loc = "footer"
            href = a.get("href") or (a.get("onclick") or "") if tag != "a" else (a.get("href") or "")
            if tag == "a" and not href:
                href = a.get("onclick") or ""
            self.cur = {"href": href, "title": a.get("title") or "", "aria": a.get("aria-label") or "", "alts": [], "text": [], "loc": loc, "imgs": []}
            self.click_tag, self.click_depth = tag, 0
        elif self.cur is not None and tag == self.click_tag:
            self.click_depth += 1
        if self.cur is not None:
            self.img_attrs(tag, a)

    def img_attrs(self, tag, a):
        c = self.cur
        if tag in ("img", "source", "image", "svg", "use", "picture") or a.get("style") or a.get("data-bgimg") or a.get("data-cursrc"):
            parts = []
            if tag in ("img", "source", "image", "svg", "use", "picture"):
                for k in ("src", "srcset", "data-src", "data-srcset", "data-lazy-src", "data-cursrc", "href", "xlink:href", "alt", "title", "aria-label"):
                    if a.get(k):
                        parts.append(urllib.parse.unquote(a[k]))
                        if k == "alt":
                            c["alts"].append(a[k])
            for k in ("style", "data-bgimg"):
                v = a.get(k) or ""
                parts += [urllib.parse.unquote(m) for m in BG_RX.findall(v)] if k == "style" else [urllib.parse.unquote(v)]
            blob = " ".join(parts)
            if IMG_RX.search(blob):
                c["imgs"].append(blob[:200])
    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript", "template") and self.skip:
            self.skip -= 1
        if tag in ("header", "nav", "footer") and tag in self.stack:
            i = len(self.stack) - 1 - self.stack[::-1].index(tag)
            del self.stack[i]
        if self.cur is not None and tag == self.click_tag:
            if self.click_depth:
                self.click_depth -= 1
                return
            self.cur["text"] = " ".join(self.cur["text"]); self.links.append(self.cur); self.cur = None

    def handle_data(self, d):
        if self.skip:
            return
        self.text.append(d)
        if self.cur is not None:
            self.cur["text"].append(d)


def classify(html):
    p = P()
    try:
        p.feed(html); p.close()
    except Exception:
        pass
    if p.cur is not None:
        p.cur["text"] = " ".join(p.cur["text"]); p.links.append(p.cur)
    vis = re.sub(r"\s+", " ", " ".join(p.text)).strip()
    hit = None
    for l in p.links:
        blob = " ".join([l["text"], l["title"], l["aria"], " ".join(l["alts"])])
        if TEXT_RX.search(blob) or HREF_RX.search(urllib.parse.unquote(l["href"])):
            if hit is None or (hit["loc"] == "other" and l["loc"] != "other"):
                hit = l
    img_hit = False
    if hit is None:
        for l in p.links:
            if l["imgs"] and (IMG_STRICT.search(" ".join(l["imgs"])) or HREF_PROV.search(urllib.parse.unquote(l["href"]))):
                hit = dict(l, loc="image_link"); img_hit = True
                break
    low = html.lower()
    out = {"vis_len": len(vis), "shop_like": bool(SHOP_RX.search(low)), "spa": bool(SPA_RX.search(html)),
           "cms": next((n for n, rx in CMS if re.search(rx, low)), "other"), "location": "", "provider": ""}
    if hit:
        out["result"] = "YES"; out["location"] = hit["loc"]; out["image_link"] = img_hit
        h = hit["href"].strip()
        prov = next((n for n, rx in PROVIDERS if re.search(rx, h, re.I)), "")
        if not prov:
            if h.startswith(("http://", "https://", "//")):
                u = urllib.parse.urlparse(h if not h.startswith("//") else "https:" + h)
                prov = "external:" + (u.hostname or "").removeprefix("www.")
            else:
                prov = "own_site" if h and not h.startswith(("#", "javascript")) else "no_href(modal/js)"
        out["provider"] = prov
    elif MENTION_RX.search(vis):
        out["result"] = "MENTION_ONLY"
    elif len(vis) < 300 or (out["spa"] and len(vis) < 800):
        out["result"] = "UNKNOWN_JS"
    else:
        out["result"] = "NO"
    return out


CTX = ssl.create_default_context(); CTX.check_hostname = False; CTX.verify_mode = ssl.CERT_NONE


def fetch(item):
    host, url = item["host"], item["url"] or ("https://" + item["host"])
    if not url.startswith("http"):
        url = "https://" + url
    r = {"host": host, "status": "", "final_url": "", "result": "ERR"}
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*;q=0.8", "Accept-Language": "es-PE,es;q=0.9"})
        with urllib.request.urlopen(req, timeout=20, context=CTX) as resp:
            r["status"] = resp.status; r["final_url"] = resp.geturl()
            raw = resp.read(2_500_000)
            ct = resp.headers.get_content_charset() or "utf-8"
        fh = urllib.parse.urlparse(r["final_url"]).hostname or ""
        if SOCIAL.search(fh):
            r["status"] = "redirects_social"; return r
        r.update(classify(raw.decode(ct, "ignore")))
    except urllib.error.HTTPError as e:
        r["status"] = e.code; r["final_url"] = e.url or ""
    except Exception as e:
        r["status"] = type(e).__name__
    return r


def state(b):
    p = b.get("probe") or {}; st = p.get("status")
    if st is None or (st >= 400 and st not in BLOCKED):
        return "broken"
    if p.get("redirect_social"):
        return "redirects_social"
    if p.get("parked"):
        return "parked"
    return "functional"


def main():
    limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
    t0 = time.time()
    rows = json.loads((PRIV / "businesses.json").read_text(encoding="utf-8"))
    indep = [b for b in rows if b["web_class"] == "own_domain" and not b["chain"] and b["host"]]
    hosts = {}
    for b in indep:
        h = hosts.setdefault(b["host"], {"host": b["host"], "url": b["url"], "segment": b["segment"], "cat": b["cat"],
                                         "zone": b.get("zone", ""), "reviews": 0, "func": False})
        h["reviews"] = max(h["reviews"], b.get("reviews") or 0)
        if state(b) == "functional":
            h["func"] = True
    all_hosts = len(hosts)
    items = sorted((h for h in hosts.values() if h["func"]), key=lambda h: h["host"])
    if limit:
        items = items[:limit]
    print(f"independent own-domain hosts {all_hosts}; functional per census {len(items)}", flush=True)
    with ThreadPoolExecutor(16) as ex:
        res = list(ex.map(fetch, items))

    rendered = 0
    js = [r for r in res if r["result"] == "UNKNOWN_JS"]
    npx = Path(os.environ.get("LOCALAPPDATA", "")) / "npm-cache/_npx"
    nm = None
    if "--no-render" not in sys.argv and npx.exists():
        nm = next((str(d) for d in npx.glob("*/node_modules") if (d / "playwright").exists()), None)
    if js and nm and shutil.which("node"):
        tmp = Path(tempfile.mkdtemp(prefix="libro-render-"))
        (tmp / "in.json").write_text(json.dumps([{"host": r["host"], "url": r["final_url"]} for r in js]))
        print(f"rendering {len(js)} UNKNOWN_JS hosts with Playwright", flush=True)
        subprocess.run(["node", str(ROOT / "scripts/libro-reclamaciones-render.js"), str(tmp / "in.json"), str(tmp / "out")],
                       env={**os.environ, "NODE_PATH": nm}, timeout=3600)
        for r in js:
            f = tmp / "out" / (r["host"] + ".html")
            if f.exists():
                c = classify(f.read_text(encoding="utf-8", errors="ignore")); rendered += 1
                if c["result"] == "UNKNOWN_JS" and c["vis_len"] >= 300:
                    c["result"] = "NO"
                r.update(c); r["rendered"] = True
        shutil.rmtree(tmp, ignore_errors=True)

    meta = {h["host"]: h for h in items}
    fields = ["host", "segment", "cat", "zone", "reviews", "status", "result", "location", "provider", "shop_like", "cms", "rendered", "final_url"]
    out = []
    for r in res:
        m = meta[r["host"]]
        out.append({"host": r["host"], "segment": m["segment"], "cat": m["cat"], "zone": m["zone"], "reviews": m["reviews"], "status": r.get("status", ""),
                    "result": r["result"], "location": r.get("location", ""), "provider": r.get("provider", ""), "shop_like": int(bool(r.get("shop_like"))),
                    "cms": r.get("cms", ""), "rendered": int(bool(r.get("rendered"))), "final_url": r.get("final_url", "")})
    with open(PRIV / "libro-probe.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fields); w.writeheader(); w.writerows(out)

    summary = write_summary(out, all_hosts, len(items), rendered, t0)
    resample(out, summary)


def write_summary(out, all_hosts, n_items, rendered, t0):
    cnt = Counter(o["result"] for o in out)
    CL = ("YES", "NO", "MENTION_ONLY")

    def share(rs):
        c = [o for o in rs if o["result"] in CL]; y = sum(o["result"] == "YES" for o in c)
        return {"n_total": len(rs), "n_classifiable": len(c), "yes": y, "mention_only": sum(o["result"] == "MENTION_ONLY" for o in c),
                "yes_pct": round(100 * y / len(c), 1) if c else None,
                "yes_or_mention_pct": round(100 * sum(o["result"] != "NO" for o in c) / len(c), 1) if c else None}

    def by(key):
        g = defaultdict(list)
        for o in out:
            g[key(o)].append(o)
        return {k: share(v) for k, v in sorted(g.items(), key=lambda kv: -len(kv[1]))}

    yes = [o for o in out if o["result"] == "YES"]
    prov = Counter(("external:other" if o["provider"].startswith("external:") else o["provider"]) for o in yes)
    summary = {"hosts_independent_own_domain": all_hosts, "hosts_functional_N": n_items, "fail_now_ERR": cnt["ERR"], "unknown_js": cnt["UNKNOWN_JS"],
               "js_rendered": rendered, "counts": dict(cnt), "overall": share(out),
               "by_segment": by(lambda o: o["segment"]), "by_category": by(lambda o: o["cat"]), "by_zone": by(lambda o: o["zone"]),
               "by_shop_like": by(lambda o: "shop_like" if o["shop_like"] else "not_shop_like"),
               "by_active": by(lambda o: "active_5plus_reviews" if o["reviews"] >= 5 else "not_active"),
               "by_cms": by(lambda o: o["cms"]), "link_location": dict(Counter(o["location"] for o in yes)),
               "provider_distribution": dict(prov.most_common()),
               "top_external_domains_3plus": {k: v for k, v in Counter(o["provider"] for o in yes if o["provider"].startswith("external:")).most_common(15) if v >= 3},
               "mention_only_count": cnt["MENTION_ONLY"], "runtime_s": round(time.time() - t0)}
    (DATA / "libro-probe-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding="utf-8")
    with open(DATA / "libro-probe-summary.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["dimension", "value", "n_total", "n_classifiable", "yes", "mention_only", "yes_pct", "yes_or_mention_pct"])
        w.writerow(["overall", "all"] + list(summary["overall"].values()))
        for dim in ("by_segment", "by_category", "by_zone", "by_shop_like", "by_active", "by_cms"):
            for k, v in summary[dim].items():
                w.writerow([dim[3:], k] + list(v.values()))
    return summary


def resample(out, summary):
    yes = [o for o in out if o["result"] == "YES"]
    rnd = random.Random(27)
    ys = sorted(yes, key=lambda o: o["host"]); ns = sorted((o for o in out if o["result"] == "NO"), key=lambda o: o["host"])
    pick = rnd.sample(ys, min(25, len(ys))) + rnd.sample(ns, min(25, len(ns)))
    if "--resample" in sys.argv:
      with open(PRIV / "libro-handcheck-sample.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["host", "final_url", "our_result", "location", "provider", "manual"])
        for o in pick:
            w.writerow([o["host"], o["final_url"], o["result"], o["location"], o["provider"], ""])
    print(json.dumps({k: summary[k] for k in ("hosts_functional_N", "counts", "overall", "by_segment", "by_shop_like", "by_active", "link_location", "provider_distribution", "runtime_s")}, indent=1))


def recheck_image_links():
    """Re-fetch only the rows classified as image_link and recompute the summary (no full web rerun)."""
    t0 = time.time()
    old = json.loads((DATA / "libro-probe-summary.json").read_text(encoding="utf-8"))
    with open(PRIV / "libro-probe.csv", encoding="utf-8") as f:
        out = list(csv.DictReader(f))
    for o in out:
        if o["location"] != "image_link":
            continue
        r = fetch({"host": o["host"], "url": o["final_url"]})
        if r["result"] in ("ERR",) or not r.get("final_url"):
            continue
        o.update(result=r["result"], location=r.get("location", ""), provider=r.get("provider", ""))
        o["shop_like"] = int(bool(r.get("shop_like"))); o["cms"] = r.get("cms", o["cms"])
    for o in out:
        o["reviews"] = int(o["reviews"] or 0); o["shop_like"] = int(o["shop_like"])
    with open(PRIV / "libro-probe.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, list(out[0].keys())); w.writeheader(); w.writerows(out)
    summary = write_summary(out, old["hosts_independent_own_domain"], old["hosts_functional_N"], old["js_rendered"], t0)
    print(json.dumps(summary["overall"]))


if __name__ == "__main__":
    recheck_image_links() if "--recheck-image-links" in sys.argv else main()
