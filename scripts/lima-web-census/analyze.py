"""Lima web census, step 4: aggregate tables + anonymised row file (safe to commit).

Outputs in docs/research/lima-web-census/data/: summary.json, by_category.csv, by_zone.csv,
by_segment.csv, rank_bias.csv, site_quality.csv, businesses-anon.csv
"""
import csv, json, collections, statistics
from build import PRIV, DATA, CATEGORIES

BLOCKED = {401, 403, 405, 406, 429, 503}  # bot protection: the site exists and answers


def site_state(r):
    """functional | broken | parked | redirects_social | none-ish classes."""
    wc = r["web_class"]
    if wc not in ("own_domain", "free_builder", "dead_google_site"):
        return wc
    if wc == "dead_google_site":
        return "broken"
    p = r.get("probe") or {}
    st = p.get("status")
    if st is None or (st >= 400 and st not in BLOCKED):
        return "broken"
    if p.get("redirect_social"):
        return "redirects_social"
    if p.get("parked"):
        return "parked"
    return "functional"


def pct(a, b):
    return round(100 * a / b, 1) if b else 0.0


def table(rows, keyf):
    groups = collections.defaultdict(list)
    for r in rows:
        groups[keyf(r)].append(r)
    out = []
    for k, g in groups.items():
        n = len(g)
        c = collections.Counter(r["state"] for r in g)
        func = c["functional"]
        demand = [r for r in g if r["reviews"] >= 20]
        out.append({
            "group": k, "businesses": n,
            "functional_site_pct": pct(func, n),
            "no_web_pct": pct(c["none"], n),
            "social_only_pct": pct(c["social_only"], n),
            "platform_or_directory_pct": pct(c["platform_only"] + c["directory_only"], n),
            "broken_or_parked_pct": pct(c["broken"] + c["parked"] + c["redirects_social"], n),
            "without_functional_site": n - func,
            "with_20plus_reviews": len(demand),
            "proven_demand_no_site": sum(1 for r in demand if r["state"] != "functional"),
            "median_reviews": statistics.median([r["reviews"] for r in g]) if g else 0,
            "claimed_pct": pct(sum(r["claimed"] for r in g), n),
        })
    return sorted(out, key=lambda x: -x["businesses"])


def write_csv(name, rows):
    with open(DATA / name, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)


def main():
    rows = json.loads((PRIV / "businesses.json").read_text(encoding="utf-8"))
    for r in rows:
        r["state"] = site_state(r)
    indep = [r for r in rows if not r["chain"]]
    seg_name = {"P": "Presentación", "C": "Complejo (reservas/pedidos)", "E": "Tienda online"}

    by_cat = table(indep, lambda r: r["cat"])
    for t in by_cat:
        seg, q, _ = CATEGORIES[t["group"]]
        t["segment"] = seg_name[seg]; t["label"] = q
    write_csv("by_category.csv", by_cat)
    # Active = 5+ Google reviews: evidence of real customers, drops ghost listings
    active = [r for r in indep if r["reviews"] >= 5]
    by_cat_a = table(active, lambda r: r["cat"])
    for t in by_cat_a:
        seg, q, _ = CATEGORIES[t["group"]]
        t["segment"] = seg_name[seg]; t["label"] = q
    write_csv("by_category_active.csv", by_cat_a)
    write_csv("by_zone_active.csv", table(active, lambda r: r["zone"]))
    write_csv("by_segment_active.csv", table(active, lambda r: seg_name[r["segment"]]))
    write_csv("by_zone.csv", table(indep, lambda r: r["zone"]))
    write_csv("by_segment.csv", table(indep, lambda r: seg_name[r["segment"]]))
    write_csv("by_search_district.csv", table(indep, lambda r: r["search_district"]))
    write_csv("by_zone_segment.csv", table(indep, lambda r: f'{r["zone"]} / {seg_name[r["segment"]]}'))

    # Ranking: website share by Maps position band (correlation, not causation)
    bands = table(indep, lambda r: "01-20" if r["rank"] <= 20 else "21-50" if r["rank"] <= 50 else "51-100")
    write_csv("rank_bias.csv", sorted(bands, key=lambda x: x["group"]))
    # Reviews band
    rb = table(indep, lambda r: "0" if r["reviews"] == 0 else "1-9" if r["reviews"] < 10 else "10-49" if r["reviews"] < 50 else "50-199" if r["reviews"] < 200 else "200+")
    write_csv("by_reviews_band.csv", rb)

    # Quality of the functional independent sites
    func = [r for r in indep if r["state"] == "functional"]
    q = collections.defaultdict(list)
    for r in func:
        p = r["probe"]
        for k in ("https", "viewport", "whatsapp", "form", "schema", "ecommerce", "booking"):
            q[k].append(bool(p.get(k)))
        q["slow_over_3s"].append(p.get("ms", 0) > 3000)
        cy = p.get("copyright_year")
        q["copyright_before_2024"].append(bool(cy and cy < 2024))
        q["free_builder_subdomain"].append(r["web_class"] == "free_builder")
    quality = [{"metric": k, "pct_of_functional_sites": pct(sum(v), len(v)), "n": len(v)} for k, v in q.items()]
    # e-commerce among E segment, booking among C segment
    fe = [r for r in func if r["segment"] == "E"]; fc = [r for r in func if r["segment"] == "C"]
    quality.append({"metric": "ecommerce_in_tienda_segment", "pct_of_functional_sites": pct(sum(r["probe"].get("ecommerce", False) for r in fe), len(fe)), "n": len(fe)})
    quality.append({"metric": "online_booking_in_complejo_segment", "pct_of_functional_sites": pct(sum(r["probe"].get("booking", False) or r["book_online_url"] for r in fc), len(fc)), "n": len(fc)})
    write_csv("site_quality.csv", quality)
    plat = collections.Counter(r["probe"].get("platform") or "unknown" for r in func)
    write_csv("platforms.csv", [{"platform": k, "sites": v, "pct": pct(v, len(func))} for k, v in plat.most_common()])

    # Anonymised rows (no name, phone, address, url)
    anon = [{k: r[k] for k in ("cat", "segment", "zone", "search_district", "district", "gcategory", "web_class", "state",
                               "chain", "claimed", "rating", "reviews", "photos", "rank")} for r in rows]
    write_csv("businesses-anon.csv", anon)

    overall = collections.Counter(r["state"] for r in indep)
    summary = {
        "generated": __import__("datetime").date.today().isoformat(),
        "businesses_all": len(rows), "chain_listings_excluded": len(rows) - len(indep), "independent": len(indep),
        "state_counts_independent": dict(overall),
        "state_pct_independent": {k: pct(v, len(indep)) for k, v in overall.items()},
        "functional_sites": len(func),
        "active_5plus_reviews": len(active),
        "state_pct_active": {k: pct(v, len(active)) for k, v in collections.Counter(r["state"] for r in active).items()},
    }
    (DATA / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=1))
    for name in ("by_segment.csv", "by_segment_active.csv", "by_zone_active.csv", "rank_bias.csv", "by_reviews_band.csv", "site_quality.csv", "platforms.csv", "by_category.csv", "by_category_active.csv"):
        print("\n==", name)
        print((DATA / name).read_text(encoding="utf-8"))


if __name__ == "__main__":
    main()
