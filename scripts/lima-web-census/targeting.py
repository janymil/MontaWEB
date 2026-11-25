"""Targeting analysis: which no-website businesses are most likely to pay.
Reads the anonymized census CSV; prints tables used in docs/research/2026-11-24-targeting-strategy.md."""
import pandas as pd, sys
p = sys.argv[1] if len(sys.argv) > 1 else "docs/research/lima-web-census/data/businesses-anon.csv"
d = pd.read_csv(p)
d = d[(d.chain.astype(str) == "False")]
d["claimed"] = d.claimed.astype(str) == "True"
d["has"] = d.state == "functional"
a = d[d.reviews >= 5].copy()
# ticket size (domain judgement): high-ticket / recurring-revenue categories
HIGH = {"dentista","veterinaria","fisioterapia","academia","nido","eventos","hotel","gimnasio","spa","optica",
        "muebleria","taller","psicologo","joyeria","clinica"}
no = a[~a.has].copy()
# lead score
no["paid_before"] = no.state.isin(["broken","parked","redirects_social"])
no["social"] = no.state == "social_only"
no["score"] = ((no.reviews>=20)*2 + (no.reviews>=100)*1 + no.claimed*1 + (no.rating>=4.3)*1
               + (no.photos>=20)*1 + no.paid_before*3 + no.social*2
               + no.zone.isin(["Lima Moderna","Lima Centro"])*1 + no.cat.isin(HIGH)*2)
no["hot"] = no.score >= 9
pd.set_option("display.width", 220); pd.set_option("display.max_rows", 100)
peer = a.groupby(["cat","zone"]).has.mean().rename("peer_site_rate")
no = no.join(peer, on=["cat","zone"])
g = no.groupby("cat").agg(no_site=("cat","size"), r20=("reviews", lambda s:(s>=20).sum()),
    med_rev=("reviews","median"), claimed=("claimed","mean"), social=("social","mean"),
    paid_before=("paid_before","sum"), hot=("hot","sum"), avg_score=("score","mean"))
g["site_rate_active"] = a.groupby("cat").has.mean()
print(g.sort_values("hot", ascending=False).round(2).to_string())
print("\n== by zone (no site, active)")
z = no.groupby("zone").agg(n=("cat","size"), hot=("hot","sum"), r20=("reviews",lambda s:(s>=20).sum()),
    claimed=("claimed","mean"), social=("social","mean"), paid_before=("paid_before","sum"), med_rev=("reviews","median"), med_rating=("rating","median"))
z["hot_rate"] = z.hot/z.n
print(z.round(2).to_string())
print("\n== hot leads by cat x zone (top 25)")
print(no[no.hot].groupby(["cat","zone"]).size().sort_values(ascending=False).head(25).to_string())
print("\n== score distribution"); print(no.score.value_counts().sort_index().to_string())
print("\ntotal no-site active", len(no), "hot", no.hot.sum(), "paid_before", no.paid_before.sum(), "social", no.social.sum())
print("\n== peer pressure: hot leads where >=30% of peers in cat x zone have a site:", (no.hot & (no.peer_site_rate>=0.3)).sum())
