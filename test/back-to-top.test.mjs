/**
 * The "volver arriba" button of the shared design system (js/app.js + css/montaweb.css).
 *
 * This runs the real app.js, so reverting initBackToTop() makes these fail.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { bootApp, findAll, ROOT } from './dom-harness.mjs';

const THRESHOLD = 420; // matches MW_BACK_TO_TOP_FROM in js/app.js

function goUpButtons(body) {
    return findAll(body, el => el.id === 'back-to-top' || el.className === 'back-to-top');
}

test('app.js injects exactly one go-up button when the page is ready', () => {
    const app = bootApp();
    assert.equal(goUpButtons(app.body).length, 0, 'nothing is injected before DOMContentLoaded');

    app.fireDOMContentLoaded();

    const buttons = goUpButtons(app.body);
    assert.equal(buttons.length, 1, 'exactly one button after DOMContentLoaded');

    const btn = buttons[0];
    assert.equal(btn.id, 'back-to-top');
    assert.equal(btn.className, 'back-to-top', 'the class the CSS targets');
    assert.equal(btn.type, 'button', 'a plain button, never a form submit');
    assert.equal(btn.getAttribute('aria-label'), 'Volver arriba', 'screen readers need a name');
    assert.match(btn.innerHTML, /fa-arrow-up/);
});

test('running the page initialisers twice does not add a second button', () => {
    const app = bootApp();
    app.fireDOMContentLoaded();
    app.fireDOMContentLoaded();
    assert.equal(goUpButtons(app.body).length, 1, 'idempotent');
});

test('the button is hidden at the top and shows past the threshold', () => {
    const app = bootApp({ scrollY: 0 });
    app.fireDOMContentLoaded();
    const btn = goUpButtons(app.body)[0];

    assert.equal(btn.classList.contains('show'), false, 'hidden at the top of the page');

    app.window.scrollY = THRESHOLD + 100;
    app.window.fire('scroll');
    assert.equal(btn.classList.contains('show'), true, 'shown once the reader scrolls');

    app.window.scrollY = 10;
    app.window.fire('scroll');
    assert.equal(btn.classList.contains('show'), false, 'hidden again at the top');
});

test('the button is visible on load when the page opens already scrolled', () => {
    // e.g. /servicios#google-mi-negocio arrives here with a scroll position but no scroll event
    const app = bootApp({ scrollY: 1400 });
    app.fireDOMContentLoaded();

    const btn = goUpButtons(app.body)[0];
    assert.equal(btn.classList.contains('show'), true,
        'no scroll event happens on an anchor jump, so the state must be computed on load');
});

test('clicking the button scrolls the page back to the top', () => {
    const app = bootApp({ scrollY: 900 });
    app.fireDOMContentLoaded();

    goUpButtons(app.body)[0].fire('click');

    // Compared field by field: the object comes from the vm realm, so its prototype differs.
    assert.equal(app.scrollCalls.length, 1, 'exactly one scroll call');
    assert.equal(app.scrollCalls[0].top, 0);
    assert.equal(app.scrollCalls[0].behavior, 'smooth');
});

test('the stylesheet styles the button it is given', () => {
    const css = readFileSync(path.join(ROOT, 'css/montaweb.css'), 'utf8');
    assert.match(css, /\.back-to-top\s*\{[^}]*position:\s*fixed/,
        'it must float over the page, not sit in the flow');
    assert.match(css, /\.back-to-top\.show\s*\{[^}]*visibility:\s*visible/,
        'the .show state the script toggles must actually reveal it');
});
