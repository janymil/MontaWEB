"""Free Google autocomplete (hl=es, gl=pe) for seed discovery. No volumes."""
import json, sys, time, urllib.parse, urllib.request
def sug(q):
    u = "https://suggestqueries.google.com/complete/search?client=firefox&hl=es&gl=pe&q=" + urllib.parse.quote(q)
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=15) as r:
        return json.loads(r.read().decode("utf-8", "replace"))[1]
out = {}
for base in sys.argv[2:]:
    for suf in [""] + list("abcdefghijlmnoprstv"):
        q = base + " " + suf if suf else base
        out[q] = sug(q); time.sleep(0.3)
json.dump(out, open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
allk = sorted({s for v in out.values() for s in v})
print(len(allk)); print("\n".join(allk))
