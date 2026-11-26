#!/usr/bin/env python3
"""Runs on the server. Reads the secret and transfer number from stdin (one per line)
and puts both keys into the PHP config. Never prints the values.
Started by scripts/receptionist-set-config.ps1."""
import os
import re
import subprocess
import sys
import tempfile
import time

KEYS = ('elevenlabs_init_secret', 'receptionist_transfer_number')


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else '/var/www/montaweb/api/config.php'
    secret = sys.stdin.readline().strip()
    number = sys.stdin.readline().strip()
    if not re.fullmatch(r'[0-9A-F]{64}', secret) or not re.fullmatch(r'\+51\d{9}', number):
        sys.exit('STOP: bad input, nothing changed')

    with open(path, encoding='utf-8') as f:
        old = f.read()

    lines = [l for l in old.splitlines(True)
             if not re.match(r"\s*'(%s)'\s*=>" % '|'.join(KEYS), l)]
    ends = [i for i, l in enumerate(lines) if l.rstrip() == '];']
    if not ends:
        sys.exit('STOP: no closing "];" found, nothing changed')
    end = ends[-1]

    # the entry above must end with a comma
    for i in range(end - 1, -1, -1):
        s = lines[i].strip()
        if s and not s.startswith('//'):
            if not s.endswith((',', '[')):
                lines[i] = lines[i].rstrip() + ',\n'
            break

    lines[end:end] = ["    '%s' => '%s',\n" % (KEYS[0], secret),
                      "    '%s' => '%s',\n" % (KEYS[1], number)]
    new = ''.join(lines)

    fd, tmp = tempfile.mkstemp(suffix='.php')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            f.write(new)
        if subprocess.run(['php', '-l', tmp], capture_output=True).returncode != 0:
            sys.exit('STOP: result is not valid PHP, nothing changed')
    finally:
        os.remove(tmp)

    # backup outside the web root, readable by this user only
    backup = os.path.expanduser('~/montaweb-config-%s.bak' % time.strftime('%Y%m%d-%H%M%S'))
    with os.fdopen(os.open(backup, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), 'w', encoding='utf-8') as f:
        f.write(old)

    # write in place so owner and permissions stay
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new)
    print('OK: both values saved. Backup: ' + backup)


if __name__ == '__main__':
    main()
