"""Export hot leads (score >= 9) with name/phone to the git-ignored private/ folder.
Scoring matches targeting.py. Output: docs/research/lima-web-census/private/hot-leads-YYYY-MM-DD.csv
Contains personal/business contact data (Ley 29733): never commit, never publish."""
import json, re, datetime, pandas as pd
BASE = "docs/research/lima-web-census/"
anon = pd.read_csv(BASE + "data/businesses-anon.csv")
priv = pd.DataFrame(json.load(open(BASE + "private/businesses.json", encoding="utf-8")))
assert len(anon) == len(priv) and (anon.cat.values == priv.cat.values).all() \
    and (anon.reviews.values == priv.reviews.values).all(), "row order mismatch"
d = priv.copy(); d["state"] = anon.state.values
d = d[d.chain.astype(str) != "True"]
d["claimed"] = d.claimed.astype(str) == "True"
d["has"] = d.state == "functional"
a = d[d.reviews >= 5].copy()
HIGH = {"dentista","veterinaria","fisioterapia","academia","nido","eventos","hotel","gimnasio","spa","optica",
        "muebleria","taller","psicologo","joyeria","clinica"}
peer = a.groupby(["cat","search_district"]).has.mean().rename("peer_site_rate")
no = a[~a.has].join(peer, on=["cat","search_district"])
paid = no.state.isin(["broken","parked","redirects_social"]); social = no.state == "social_only"
no["score"] = ((no.reviews>=20)*2 + (no.reviews>=100) + no.claimed + (no.rating>=4.3) + (no.photos>=20)
               + paid*3 + social*2 + no.zone.isin(["Lima Moderna","Lima Centro"]) + no.cat.isin(HIGH)*2)
def why(r):
    w = []
    if r.state in ("broken","parked","redirects_social"): w.append(f"web caída/estacionada: {r.url}")
    if r.state == "social_only": w.append(f"solo redes: {r.url}")
    w.append(f"{int(r.reviews)} reseñas, {r.rating}★")
    if r.peer_site_rate >= 0.3: w.append(f"{round(r.peer_site_rate*100)}% de su rubro en {r.search_district} tiene web")
    return "; ".join(w)
def wa(p):
    n = re.sub(r"\D", "", str(p or ""))
    if n.startswith("51") and len(n) == 11: n = n[2:]
    return f"https://wa.me/51{n}" if len(n) == 9 and n.startswith("9") else ""
hot = no[no.score >= 9].copy()
hot["whatsapp"] = hot.phone.map(wa)
hot["maps"] = "https://www.google.com/maps?cid=" + hot["id"].astype(str)
hot["pitch_hint"] = hot.apply(why, axis=1)
hot["batch"] = paid.loc[hot.index].map({True: "1-web-caida", False: "2"})
hot.loc[social.loc[hot.index] & (hot.batch == "2"), "batch"] = "2-solo-redes"
hot.loc[hot.batch == "2", "batch"] = "3-sin-web"
cols = ["batch","score","cat","name","district","zone","phone","whatsapp","maps","address","rating","reviews","photos",
        "claimed","state","url","peer_site_rate","pitch_hint"]
hot = hot.sort_values(["batch","score","reviews"], ascending=[True,False,False])[cols]
hot["peer_site_rate"] = hot.peer_site_rate.round(2)
out = BASE + f"private/hot-leads-{datetime.date.today()}.csv"
hot.to_csv(out, index=False, encoding="utf-8-sig")
print(out, len(hot)); print(hot.batch.value_counts().to_string()); print(hot.cat.value_counts().head(8).to_string())
print("with WhatsApp mobile:", (hot.whatsapp != "").sum(), "no phone:", hot.phone.isna().sum() + (hot.phone == "").sum())
print("id sample:", hot.maps.iloc[0][-30:])
