#!/usr/bin/env python3
"""Compare the local MontaWeb working tree against the live tree on the Washington VPS.

The live manifest is produced on the server with:
    cd /var/www/montaweb && find . -path ./.git -prune -o -type f -print0 | xargs -0 sha256sum

Local files are hashed raw and with CRLF stripped, because the Windows checkout uses
core.autocrlf=true while the server stores LF. A file counts as identical when the
server hash equals either local hash.

Usage: python scripts/compare-live.py [live-manifest.txt]
"""
import hashlib
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "live-sha256.txt")

# Local-only tooling artifacts that are not part of the website.
LOCAL_EXCLUDE_DIRS = {".git", ".claude/worktrees"}
LOCAL_EXCLUDE_FILES = {"live-sha256.txt"}
# Server-only runtime files: secrets, composer deps, captured leads. Not website source.
SERVER_RUNTIME_PREFIXES = ("api/vendor/", "api/leads/")
SERVER_RUNTIME_FILES = {"api/config.php"}


def norm_rel(path):
    p = path.replace("\\", "/")
    while p.startswith("./"):
        p = p[2:]
    return p


def load_live(path):
    live = {}
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            line = line.rstrip("\r\n")
            m = re.match(r"^([0-9a-f]{64})\s+(.*)$", line)
            if not m:
                continue
            digest, rel = m.group(1), norm_rel(m.group(2))
            live[rel] = digest.lower()
    return live


def local_files():
    found = {}
    for dirpath, dirnames, filenames in os.walk(ROOT):
        rel_dir = norm_rel(os.path.relpath(dirpath, ROOT)) if dirpath != ROOT else ""
        dirnames[:] = [
            d for d in dirnames
            if os.path.join(rel_dir, d).replace("\\", "/") not in LOCAL_EXCLUDE_DIRS
        ]
        for name in filenames:
            rel = norm_rel(os.path.join(rel_dir, name))
            if rel in LOCAL_EXCLUDE_FILES:
                continue
            found[rel] = os.path.join(dirpath, name)
    return found


def hashes(path):
    raw = hashlib.sha256()
    norm = hashlib.sha256()
    size = 0
    with open(path, "rb") as fh:
        head = fh.read(8192)
        fh.seek(0)
        binary = b"\x00" in head
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            size += len(chunk)
            raw.update(chunk)
            norm.update(chunk if binary else chunk.replace(b"\r\n", b"\n"))
    return raw.hexdigest(), norm.hexdigest(), size, binary


def main():
    live = load_live(MANIFEST)
    local = local_files()
    local_res = {rel: hashes(path) for rel, path in local.items()}

    identical, crlf_only, differs, only_local, only_live = [], [], [], [], []
    for rel, (raw, norm, size, binary) in sorted(local_res.items()):
        if rel not in live:
            only_local.append((rel, size))
        elif live[rel] == raw:
            identical.append(rel)
        elif live[rel] == norm:
            crlf_only.append(rel)
        else:
            differs.append((rel, size))
    for rel in sorted(set(live) - set(local_res)):
        only_live.append(rel)

    live_runtime = [r for r in live if r in SERVER_RUNTIME_FILES or r.startswith(SERVER_RUNTIME_PREFIXES)]

    def show(title, rows, limit=200):
        print(f"\n## {title} ({len(rows)})")
        for row in rows[:limit]:
            print("  " + (row if isinstance(row, str) else f"{row[0]}  ({row[1]} B)"))
        if len(rows) > limit:
            print(f"  ... {len(rows) - limit} more")

    print(f"live files: {len(live)}   local files: {len(local_res)}")
    print(f"live-only runtime/secret files (excluded): {len(live_runtime)}")
    for r in live_runtime:
        print("  " + r)
    show("IDENTICAL (raw bytes)", identical)
    show("IDENTICAL after CRLF->LF normalization", crlf_only)
    show("CONTENT DIFFERS", differs)
    show("ONLY LOCAL (not on live)", only_local)
    show("ONLY LIVE (missing locally)", only_live)

    print("\n## SUMMARY")
    print(f"identical={len(identical)} crlf_only={len(crlf_only)} differs={len(differs)} "
          f"only_local={len(only_local)} only_live={len(only_live)}")


if __name__ == "__main__":
    main()
