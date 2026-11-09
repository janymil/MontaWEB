/**
 * Coverage: every page served from the site root has a "volver arriba" button.
 *
 * A page gets one either from the shared script (js/app.js), from the older script used by the
 * calculator sandbox (js/main.js), or by carrying its own — the three Google guides load neither
 * stylesheet nor script, so they must carry their own markup, CSS and scroll wiring.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './dom-harness.mjs';

const pages = readdirSync(ROOT).filter(name => name.endsWith('.html')).sort();
const read = file => readFileSync(path.join(ROOT, file), 'utf8');

const SHARED = [
    { script: 'js/app.js', css: 'css/montaweb.css' },
    { script: 'js/main.js', css: 'css/style.css' },
];

test('there are pages to check', () => {
    assert.ok(pages.length >= 10, `expected the site pages, found ${pages.length}`);
});

for (const page of pages) {
    const html = read(page);
    const shared = SHARED.find(entry => html.includes(entry.script));

    test(`${page} has a go-up button`, () => {
        if (shared) {
            assert.ok(html.includes(shared.css),
                `${page} loads ${shared.script} but not ${shared.css}, so the injected button is unstyled`);
            assert.match(read(shared.css), /\.back-to-top\s*\{/,
                `${shared.css} must style .back-to-top, the class ${shared.script} injects`);
            return;
        }

        // Stand-alone page: it has to bring its own.
        assert.match(html, /id="back-to-top"/,
            `${page} loads no shared script, so it needs its own button markup`);
        assert.match(html, /\.back-to-top\s*\{[^}]*position:\s*fixed/,
            `${page} needs its own fixed .back-to-top rule`);
        assert.match(html, /getElementById\('back-to-top'\)/,
            `${page} needs its own wiring for the button`);
        assert.match(html, /window\.addEventListener\('scroll'/,
            `${page} must watch the scroll position, otherwise the button never appears`);
        assert.match(html, /window\.scrollTo\(\{\s*top:\s*0/,
            `${page} must actually return to the top when clicked`);
    });
}
