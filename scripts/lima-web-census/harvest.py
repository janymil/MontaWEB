"""Lima web census, step 1: harvest Google Maps listings via DataForSEO.

29 business types that would benefit from a website x 10 districts (2 per Lima zone).
Raw responses go to docs/research/lima-web-census/raw/ (git-ignored: contains phones).
Usage: python scripts/lima-web-census/harvest.py [--dry-run]
Credentials: DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD in the environment.
"""
import json, os, sys, time, pathlib, concurrent.futures as cf
import httpx

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "docs/research/lima-web-census/raw"

# key: (segment, maps query, Google-category regex that counts as in-category)
CATEGORIES = {
    # P = presentation site (professional / local services)
    "abogado":        ("P", "abogado", r"abogad|bufete|jur[ií]dic|notar[ií]a|legal"),
    "contador":       ("P", "estudio contable", r"contab|contador|auditor|tribut|asesor[ií]a (fiscal|empresarial)"),
    "arquitecto":     ("P", "arquitecto", r"arquitect|interiori|dise[nñ]ador de interiores"),
    "inmobiliaria":   ("P", "inmobiliaria", r"inmobiliari|bienes ra[ií]ces|agente inmobiliario"),
    "psicologo":      ("P", "psicólogo", r"psic[oó]log|psicoterap|salud mental|terapeuta"),
    "taller":         ("P", "taller mecánico", r"taller|mec[aá]nic|automotri|reparaci[oó]n de (autom|veh)|servicio de autom|planchado|lubric"),
    "constructora":   ("P", "empresa constructora", r"construct|contratista|remodelaci|ingenier[ií]a"),
    "imprenta":       ("P", "imprenta", r"imprenta|impresi[oó]n|serigraf|gr[aá]fic|copister|publicidad"),
    # C = complex site (bookings, orders, enrolment, menus)
    "restaurante":    ("C", "restaurante", r"restaurante|cevicher|poller|chifa|comida|parrill|pizzer|marisquer|buffet|sangucher|criolla|sushi|steak"),
    "hotel":          ("C", "hotel", r"hotel|hostal|hospedaje|albergue|apartamento|apart-hotel|bed & breakfast|posada|alojamiento"),
    "clinica":        ("C", "centro médico", r"cl[ií]nica|centro m[eé]dico|policl[ií]nic|m[eé]dico|consultorio|ginec|pediatr|dermat|oftalm|cardi[oó]l|traumat|hospital"),
    "dentista":       ("C", "dentista", r"dent|odont|ortodon|endodon|implant"),
    "gimnasio":       ("C", "gimnasio", r"gimnasio|gym|fitness|crossfit|yoga|pilates|entrenador|artes marciales|boxeo|deport"),
    "spa":            ("C", "spa", r"\bspa\b|masaj|u[nñ]as|manicur|est[eé]tica|depilaci|centro de belleza"),
    "salon":          ("C", "salón de belleza", r"sal[oó]n de belleza|peluquer|estilista|belleza|maquill"),
    "barberia":       ("C", "barbería", r"barber"),
    "veterinaria":    ("C", "veterinaria", r"veterinari"),
    "fisioterapia":   ("C", "fisioterapia", r"fisioterap|rehabilit|kinesi|quiropr|terapia f[ií]sica|osteop"),
    "academia":       ("C", "academia", r"academia|instituto|escuela|centro de idiomas|clases|preuniversit|centro educativo|tutor|centro de formaci"),
    "nido":           ("C", "nido", r"nido|jard[ií]n de inf|guarder|preescolar|educaci[oó]n inicial|cuna|colegio|escuela"),
    "eventos":        ("C", "local de eventos", r"evento|banquet|fiestas|recepci[oó]n|catering|boda"),
    # E = e-commerce (catalogue + sales online)
    "ropa":           ("E", "tienda de ropa", r"ropa|boutique|moda|vestido|prenda|calzado|zapat|lencer"),
    "muebleria":      ("E", "mueblería", r"mueble|colch[oó]n|decoraci|ebanist|carpinter"),
    "floreria":       ("E", "florería", r"flor|arreglos florales|vivero"),
    "pasteleria":     ("E", "pastelería", r"pasteler|reposter|panader|torta|dulcer|postre|cupcake|cafeter"),
    "optica":         ("E", "óptica", r"[oó]ptic|optometr|lentes|anteojos"),
    "joyeria":        ("E", "joyería", r"joyer|bisuter|relojer|orfebr"),
    "ferreteria":     ("E", "ferretería", r"ferreter|materiales de constru|pinturer|el[eé]ctric|sanitari"),
    "petshop":        ("E", "pet shop", r"tienda de (mascotas|animales)|pet ?shop|alimento para (mascotas|animales)|accesorios para mascotas|acuario|peluquer[ií]a canina|grooming"),
    "cosmeticos":     ("E", "tienda de cosméticos", r"cosm[eé]tic|perfumer|productos de belleza|maquillaje|belleza"),
}

# 2 districts per zone of Lima Metropolitana (centre point, zoom 14z ~ one district)
DISTRICTS = {
    "Miraflores":             ("Lima Moderna", -12.1211, -77.0297),
    "Santiago de Surco":      ("Lima Moderna", -12.1390, -76.9930),
    "Cercado de Lima":        ("Lima Centro", -12.0464, -77.0428),
    "La Victoria":            ("Lima Centro", -12.0700, -77.0170),
    "Los Olivos":             ("Lima Norte", -11.9700, -77.0700),
    "San Martín de Porres":   ("Lima Norte", -12.0050, -77.0750),
    "Ate":                    ("Lima Este", -12.0260, -76.9200),
    "San Juan de Lurigancho": ("Lima Este", -11.9850, -77.0050),
    "Chorrillos":             ("Lima Sur", -12.1700, -77.0150),
    "Villa El Salvador":      ("Lima Sur", -12.2130, -76.9370),
}

URL = "https://api.dataforseo.com/v3/serp/google/maps/live/advanced"


def one(client, cat, district):
    out = RAW / f"{cat}__{district.replace(' ', '_')}.json"
    if out.exists():
        return 0.0, "cached"
    seg, query, _ = CATEGORIES[cat]
    zone, lat, lng = DISTRICTS[district]
    body = [{"keyword": query, "language_code": "es", "location_coordinate": f"{lat},{lng},14z", "depth": 100}]
    for attempt in range(3):
        try:
            r = client.post(URL, json=body, timeout=120)
            d = r.json()
            t = d["tasks"][0]
            if t["status_code"] != 20000:
                raise RuntimeError(t["status_message"])
            out.write_text(json.dumps({"cat": cat, "district": district, "zone": zone,
                                       "items": (t["result"] or [{}])[0].get("items") or []},
                                      ensure_ascii=False), encoding="utf-8")
            return d.get("cost", 0), "ok"
        except Exception as e:  # noqa: BLE001
            err = str(e)
            time.sleep(3)
    return 0.0, "fail: " + err


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    jobs = [(c, d) for c in CATEGORIES for d in DISTRICTS]
    print(f"{len(jobs)} searches, est. ${len(jobs) * 0.002:.2f}")
    if "--dry-run" in sys.argv:
        return
    auth = (os.environ["DATAFORSEO_LOGIN"], os.environ["DATAFORSEO_PASSWORD"])
    cost, fails = 0.0, []
    with httpx.Client(auth=auth) as client, cf.ThreadPoolExecutor(6) as ex:
        futs = {ex.submit(one, client, c, d): (c, d) for c, d in jobs}
        for f in cf.as_completed(futs):
            c_, status = f.result()
            cost += c_
            if status.startswith("fail"):
                fails.append((futs[f], status))
    print(f"cost ${cost:.3f}; failures {len(fails)}")
    for f in fails:
        print(f)


if __name__ == "__main__":
    main()
