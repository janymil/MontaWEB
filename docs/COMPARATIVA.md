# Comparison pages (/comparar)

Decision: `docs/decisions/2026-11-25-competitor-comparison-pages.md`. Modelled on MiCita's `/comparar`.

## Files
- `scripts/compare/competitors.mjs`: every fact, its source URL, the date and the `quotes` that must appear on the source page. It also holds MontaWeb's cells (`mustAppear` strings are checked against `servicios.html` + `terminos.html`) and all Spanish copy.
- `scripts/build-compare.mjs`: writes `comparar.html` and `comparar/<slug>.html`. The header and footer are copied from `blog.html`. Never edit the generated HTML by hand.
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
It must be a Lima provider that publishes soles prices on its own site. Add it to `COMPETITORS` with a cell for every row (the test fails otherwise) and quotes for every non-`unlisted` cell. Then run the evidence capture, rebuild, add it to `sitemap.xml` and `llms.txt`, and update the decision.

## Evidence log

| Date | What | Where | Notes |
| --- | --- | --- | --- |
| 2026-11-25 | All 7 competitor sources from Lima (exit PE; 91/91 quotes), `claims/` (10 live pages at commit d11cfc6a) + `claims-sin-aviso/` (cookie notice closed), `prelaunch-unstamped/` (that afternoon's capture without stamps) | PC `docs/evidence/comparar/2026-11-25/`, Washington `/var/backups/montaweb/comparar-evidence-2026-11-25/`, R2 `micita-legal-evidence/montaweb/comparar/2026-11-25/` (168 objects) | archive.org: new snapshot of every URL; archive.today: none (reCAPTCHA). freetsa 01:19:26 GMT, DigiCert 01:19:28 GMT on 26 Nov (20:19 Lima, 25 Nov), both verified. SHA256SUMS `5e0c69d9ab087f8ebe63b5286eac33eec979e3429ec2e1cbcebdfd0be175d3d8` |
| 2026-11-25 (2) | After deploy d2a6f57c (table fix): all 7 sources (exit PE; 91/91 quotes), `claims/` + `claims-sin-aviso/` at that commit | PC `docs/evidence/comparar/2026-11-25-2/`, Washington `/var/backups/montaweb/comparar-evidence-2026-11-25-2/`, R2 `micita-legal-evidence/montaweb/comparar/2026-11-25-2/` (138 objects) | **archive.org: no new snapshot** (earlier copies only, some of montaweb.pe from before the deploy; `LOG.md` in this set lists them without saying so, see its `ARCHIVES.md` and `ARCHIVES-today.md`); archive.today: none (reCAPTCHA). freetsa 02:06:09 GMT, DigiCert 02:06:11 GMT on 26 Nov (21:06 Lima, 25 Nov), both verified. SHA256SUMS `188d9aa6d386b1737f82feca1ae39a4bfa0256ce3b4a59958d71e7ef17e7b5b1` |
