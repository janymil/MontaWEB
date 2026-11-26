"""Tiny DataForSEO client for MontaWeb keyword research.

Credentials: DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD read from the env file
given in DFS_ENV (default: ../sellbird-pilot/.env). Never printed.
Usage: python dfs.py GET <path>            (free appendix endpoints)
       python dfs.py POST <path> <body.json> <out.json>
Every POST prints its cost and the balance afterwards.
"""
import base64, json, os, sys, urllib.request

def creds():
    path = os.environ.get("DFS_ENV", r"C:\Users\USER\Documents\sellbird-pilot\.env")
    vals = {}
    for line in open(path, encoding="utf-8"):
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1)
            vals[k.strip()] = v.strip().strip('"').strip("'")
    return vals["DATAFORSEO_LOGIN"], vals["DATAFORSEO_PASSWORD"]

def call(method, path, body=None):
    login, pw = creds()
    req = urllib.request.Request("https://api.dataforseo.com/v3/" + path.lstrip("/"), method=method,
                                 data=json.dumps(body).encode() if body is not None else None)
    req.add_header("Authorization", "Basic " + base64.b64encode(f"{login}:{pw}".encode()).decode())
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)

if __name__ == "__main__":
    m, p = sys.argv[1], sys.argv[2]
    if m == "GET":
        d = call("GET", p)
        if p.endswith("user_data"):
            r = d["tasks"][0]["result"][0]
            print("status:", d["status_message"], "| balance USD:", r["money"]["balance"])
        else:
            json.dump(d, open(sys.argv[3], "w", encoding="utf-8"), ensure_ascii=False) if len(sys.argv) > 3 else print(json.dumps(d)[:2000])
    else:
        body = json.load(open(sys.argv[3], encoding="utf-8"))
        d = call("POST", p, body)
        json.dump(d, open(sys.argv[4], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        t = d["tasks"][0]
        print("status:", t["status_code"], t["status_message"], "| cost USD:", d.get("cost"))
        b = call("GET", "appendix/user_data")["tasks"][0]["result"][0]["money"]["balance"]
        print("balance after USD:", b)
