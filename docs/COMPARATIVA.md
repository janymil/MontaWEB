# Comparison pages (/comparar)

Decisions: `docs/decisions/2026-11-25-competitor-comparison-pages.md` (rules) and `docs/decisions/2026-11-26-comparar-competitor-selection.md` (current list). Modelled on MiCita's `/comparar`.

## Files
- `scripts/compare/competitors.mjs`: every fact, its source URL, the date and the `quotes` that must appear on the source page. It also holds MontaWeb's cells (`mustAppear` strings are checked against `servicios.html` + `terminos.html`) and all Spanish copy.
- `scripts/build-compare.mjs`: writes `comparar.html`, `comparar/<slug>.html` (price or facts-only page) and the quote guide `comparar/cotizacion-pagina-web.html`. The header and footer are copied from `blog.html`. Never edit the generated HTML by hand.
- `css/compare.css`, `test/compare.test.mjs`.
- Evidence: `scripts/compare-evidence.mjs`, `scripts/montaweb-claims-evidence.mjs`, `scripts/evidence-seal.mjs`, `scripts/upload-evidence.mjs`, `scripts/lib/{capture,evidence}.mjs`, `test/evidence.test.mjs`.

## Rules (D. Leg. 1044 arts. 8, 11, 12; Indecopi Lineamientos 2019)
1. Only what the competitor's own page says on the checked date, quoted. Not on the page → `unlisted` ("No figura en su página"), never "No".
2. Prices exactly as written, with their tax basis. Never add IGV and never convert currency. No foreign-currency amounts.
3. No logos, star ratings, superlatives, "más barato", "ahorras" or insinuations. The test bans the usual words.
4. Like-for-like: show what each plan includes, not just the headline price.
5. Every page carries the trademark note and a correction email.
6. Art. 8.3–8.4: MontaWeb carries the burden of proof, and the proof must exist **before** publication. Art. 51: keep it at least 5 years after the last day each version was online.

## Evidence capture
Run it on the PC in Lima (Git Bash, so `openssl` is on PATH). `<date>` is today in Lima. A folder that already holds a capture is never reused: add a suffix (`<date>-2`).

1. **Competitor pages:** `node scripts/compare-evidence.mjs --archive` → `docs/evidence/comparar/<date>/`. Per source: HTML, text, stamped full-page PNG and PDF; `log.json`/`LOG.md` (Lima time, HTTP status, exit country, SHA-256), `RECHECK.md` (every quote), `ARCHIVES.md`. Exit code 1 if a quote is missing, a page errors or a counter did not finish. The exit country in `LOG.md` must be `PE` (from elsewhere use `--proxy socks5://…` with a Peru exit).
2. **Our own claims:** `node scripts/montaweb-claims-evidence.mjs --archive` → `<date>/claims/`: stamped captures of the live `/servicios`, `/terminos`, `/comparar`, the detail pages and `/`, `sitemap.xml`, and `competitors.mjs`, `servicios.html`, `terminos.html` at the deployed commit. Then the same with the cookie notice closed: `node scripts/montaweb-claims-evidence.mjs --no-banner --out docs/evidence/comparar/<date>/claims-sin-aviso`.
3. **Public archives:** if `ARCHIVES.md` shows a failure (archive.org rate-limits anonymous requests and answers a repeated request with an older copy, which does not count as new), open `https://web.archive.org/save/<url>` in a normal browser. Also save each URL on `https://archive.ph/` and write the links into `<date>/ARCHIVES-today.md`. If a CAPTCHA appears, stop: a person solves it or that archive is skipped.
4. **Seal (RFC 3161):** `node scripts/evidence-seal.mjs docs/evidence/comparar/<date>` writes `SHA256SUMS` over every file, has freetsa.org and DigiCert sign its hash (only the hash is sent) and verifies both. Do this last: nothing may be added to the folder afterwards.
5. **Two copies off the PC** (Washington + R2):
   ```bash
   D=2026-11-25   # the folder name
   # stops if that backup folder already exists (scp would overwrite it): then use a new suffix
   ssh washington "test ! -e /var/backups/montaweb/comparar-evidence-$D && install -d -m 700 /var/backups/montaweb/tools/lib /var/backups/montaweb/comparar-evidence-$D && ln -sfn /var/www/micita/node_modules /var/backups/montaweb/tools/node_modules" &&
   scp scripts/upload-evidence.mjs washington:/var/backups/montaweb/tools/ &&
   scp scripts/lib/evidence.mjs washington:/var/backups/montaweb/tools/lib/ &&
   scp -r docs/evidence/comparar/$D/. washington:/var/backups/montaweb/comparar-evidence-$D/ &&
   ssh washington "cd /var/backups/montaweb/comparar-evidence-$D && sha256sum -c --quiet SHA256SUMS && cd ../tools && set -a && . /etc/micita/legal-evidence.env && set +a && node upload-evidence.mjs ../comparar-evidence-$D montaweb/comparar/$D"
   ```
   The R2 bucket is MiCita's `micita-legal-evidence` (private, no expiry rule, never add one). The upload never overwrites a key and reads every object back to compare SHA-256. If it is refused, stop and tell Jan; do not create keys or buckets.

## Verifying a sealed folder (any time, also years later)
```bash
node scripts/evidence-seal.mjs docs/evidence/comparar/<date> --verify
```
Without this repo, inside the folder:
```bash
sha256sum -c SHA256SUMS
openssl ts -verify -data SHA256SUMS -in timestamps/SHA256SUMS.freetsa.tsr -CAfile timestamps/freetsa-ca.pem -untrusted timestamps/freetsa-untrusted.pem
openssl ts -verify -data SHA256SUMS -in timestamps/SHA256SUMS.digicert.tsr -CAfile timestamps/digicert-ca.pem
openssl ts -reply -in timestamps/SHA256SUMS.digicert.tsr -text   # shows the signed time (UTC)
```
Each `-verify` must print `Verification: OK`. The token proves the files existed, unchanged, at the signed time.

## When to run it
- **Before** publishing any change to `competitors.mjs`, `/servicios` or `/terminos` prices: steps 1–2.
- **Right after** that deploy, the same day: all steps again (what the public saw, from when).
- **Monthly** (first working day) and **on any complaint**: all steps. Then, for any missing quote, fix the data, set `VERIFIED_ON` and each source's `checked`, run `node scripts/build-compare.mjs` and `npm test`. The test fails and the page hides the table after 45 days without a check.
- If a competitor writes: capture first (all steps), then correct or remove the claim within 2 working days and answer in writing.
- If Indecopi opens a case: stop, get a colegiado lawyer, and don't touch the evidence.

## Adding a competitor
Current list and why: `docs/decisions/2026-11-26-comparar-competitor-selection.md`.

**Price comparison** (the default). It must be a provider that sells in Lima and publishes soles prices on its own site, with a legal name or RUC we can find (keep it in the `competitors.mjs` comment). Add it to `COMPETITORS` with a cell for every `ROWS` row (the test fails otherwise) and quotes for every non-`unlisted` cell. A monthly price gets `period: 'mes'`, which keeps it out of the one-time ranges in the FAQs.

**Facts only** (`kind: 'facts'`). For a platform people search for that shows no soles price in Peru (Wix, Shopify: dollars only). Rules on top of the six above:
- No amounts at all, in any currency: no prices, no "desde", no percentages of a price. The test fails on `amount`, `S/ <n>`, `US$`, `USD` or `€` on these pages.
- Compare only published conditions: who builds the site, how it is paid, currency and taxes, domain, refund, support (`FACT_ROWS`). MontaWeb's column is `MONTAWEB.facts`, checked against `/servicios` and `/terminos` like the price cells.
- Saying which currency a platform uses is a fact, not an amount: quote it (`html:US$`).
- Several platforms can share one page as a short `builders` list. Each item is a `b-*` cell with its own source and quotes, so the evidence script checks it. Their names go into the trademark note automatically.
- A platform that later publishes soles prices (GoDaddy already shows S/ from Lima) can move to a price page; that is a new decision.

**Never**: a competitor's claims about itself (years in business, client counts, review counts, "desde 2009"). The test bans the usual patterns. Use the legal name only when it comes from the competitor's own page.

**Quote-only agencies** get no named page. They are covered by the generic guide `/comparar/cotizacion-pagina-web` (`GUIDE` in `competitors.mjs`), which names no company; every MontaWeb answer on it has `mustAppear` text from `/servicios` or `/terminos`.

Then run the evidence capture, rebuild, add the page to `sitemap.xml` and `llms.txt`, and update the decision.

## Removing a competitor
Delete it from `COMPETITORS`, delete `comparar/<slug>.html`, add the slug to `@comparar_dropped` in `deploy/Caddyfile` (301 to `/comparar`; the server copy is `/etc/caddy/Caddyfile` and changes only with Jan's yes), take it out of `sitemap.xml` and `llms.txt`. Keep its sealed evidence folders: art. 51 asks for 5 years after the last day the page was online.

## Evidence log

| Date | What | Where | Notes |
| --- | --- | --- | --- |
| 2026-11-25 | All 7 competitor sources from Lima (exit PE; 91/91 quotes), `claims/` (10 live pages at commit d11cfc6a) + `claims-sin-aviso/` (cookie notice closed), `prelaunch-unstamped/` (that afternoon's capture without stamps) | PC `docs/evidence/comparar/2026-11-25/`, Washington `/var/backups/montaweb/comparar-evidence-2026-11-25/`, R2 `micita-legal-evidence/montaweb/comparar/2026-11-25/` (168 objects) | archive.org: new snapshot of every URL; archive.today: none (reCAPTCHA). freetsa 01:19:26 GMT, DigiCert 01:19:28 GMT on 26 Nov (20:19 Lima, 25 Nov), both verified. SHA256SUMS `5e0c69d9ab087f8ebe63b5286eac33eec979e3429ec2e1cbcebdfd0be175d3d8` |
| 2026-11-25 (2) | After deploy d2a6f57c (table fix): all 7 sources (exit PE; 91/91 quotes), `claims/` + `claims-sin-aviso/` at that commit | PC `docs/evidence/comparar/2026-11-25-2/`, Washington `/var/backups/montaweb/comparar-evidence-2026-11-25-2/`, R2 `micita-legal-evidence/montaweb/comparar/2026-11-25-2/` (138 objects) | **archive.org: no new snapshot** (earlier copies only, some of montaweb.pe from before the deploy; `LOG.md` in this set lists them without saying so, see its `ARCHIVES.md` and `ARCHIVES-today.md`); archive.today: none (reCAPTCHA). freetsa 02:06:09 GMT, DigiCert 02:06:11 GMT on 26 Nov (21:06 Lima, 25 Nov), both verified. SHA256SUMS `188d9aa6d386b1737f82feca1ae39a4bfa0256ce3b4a59958d71e7ef17e7b5b1` |
| 2026-11-25 (3) | **Pre-publication, new list:** 10 sources (Bersoft, Glob Digital, Hosting Perú, Izipay web, KOM, Monstruo ×2, Wix, Shopify, Hostinger, GoDaddy), exit PE, every quote found. `claims/` + `claims-sin-aviso/` of the live site at d2a6f57c (the 4 new pages answer 404 because they are not deployed yet) | PC `docs/evidence/comparar/2026-11-25-3/`, Washington `/var/backups/montaweb/comparar-evidence-2026-11-25-3/`, R2 `micita-legal-evidence/montaweb/comparar/2026-11-25-3/` (161 objects) | The script exits 1 for Monstruo Creativo only: its site redirects to the same path plus `?v=<hash>` (a cache-buster), which `captureProblems` counts as a redirect. archive.org: new copies for 7 new sources; Hostinger failed; Bersoft, Hosting Perú and KOM got the older copies. freetsa 02:51:56 GMT, DigiCert 02:51:57 GMT on 26 Nov (21:51 Lima, 25 Nov), both verified. SHA256SUMS `104ae9c60478b5fe52f1c005ced61ee841904b713a0dc6d2338b3fada9bae187` |
| 2026-11-25 (4) | After deploy 41bf8ef6 (new list live, dropped pages 301 on the server): 10 sources (exit PE, every quote found; Monstruo flagged only for its `?v=` redirect), `claims/` + `claims-sin-aviso/` at 41bf8ef6 (0 problems) | PC `docs/evidence/comparar/2026-11-25-4/`, Washington `/var/backups/montaweb/comparar-evidence-2026-11-25-4/`, R2 `micita-legal-evidence/montaweb/comparar/2026-11-25-4/` (161 objects) | archive.org: new copies only of /comparar/glob-digital, /izipay-web and /monstruo-creativo; every other URL got an older copy or failed. freetsa 03:15:32 GMT, DigiCert 03:15:33 GMT on 26 Nov (22:15 Lima, 25 Nov), both verified. SHA256SUMS `cc8ffac1fd7a43424dd3c76a9faf05f11a14371ec2ad9ef41d478fbbc67a8ba5` |
