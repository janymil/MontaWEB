import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { ROOT } from './dom-harness.mjs';

const require = createRequire(import.meta.url);
const { recommendProject, HOME_DEMOS } = require('../js/home.js');
const html = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = readFileSync(path.join(ROOT, 'css/home.css'), 'utf8');

test('homepage loads its isolated editorial design and interaction layer', () => {
    assert.match(html, /<body class="home-page">/);
    assert.match(html, /css\/home\.css\?v=20261123/);
    assert.match(html, /js\/home\.js\?v=20261123/);
    assert.match(html, /Webs con diseño\.<br><em>Y con intención\.<\/em>/);
    assert.match(css, /--paper:\s*#f3f0e7/);
});

test('homepage preserves the complete decision journey and contact destinations', () => {
    for (const id of ['servicios', 'proyectos', 'planes', 'proceso', 'recomendador', 'faq']) {
        assert.match(html, new RegExp(`id="${id}"`));
    }
    assert.match(html, /href="\/servicios#web-simple"/);
    assert.match(html, /href="\/ejemplos"/);
    assert.match(html, /href="\/contacto"/);
    assert.match(html, /https:\/\/wa\.me\/51965403196/);
    assert.match(html, /S\/ 50/);
    assert.match(html, /S\/ 99/);
    assert.match(html, /S\/ 299/);
});

test('interactive portfolio demos point to real local images with descriptive alternatives', () => {
    assert.equal(Object.keys(HOME_DEMOS).length, 3);
    for (const [key, demo] of Object.entries(HOME_DEMOS)) {
        assert.match(html, new RegExp(`data-demo="${key}"`));
        assert.ok(existsSync(path.join(ROOT, demo.image)), `${demo.image} must exist`);
        assert.ok(demo.alt.length > 35, `${key} needs a descriptive image alternative`);
    }
});

test('project recommender returns the established plan for each business goal', () => {
    const cases = {
        presence: ['Web Simple Profesional', 'S/ 99'],
        campaign: ['Landing Page', 'S/ 50'],
        store: ['Tienda Starter', 'S/ 299'],
        redesign: ['Rediseño Web Moderno', 'S/ 199']
    };
    for (const [goal, [title, price]] of Object.entries(cases)) {
        const result = recommendProject({ goal, content: 'ready' });
        assert.equal(result.title, title);
        assert.match(result.price, new RegExp(price.replace('/', '\\/')));
        assert.doesNotMatch(result.description, /Creación de Contenido/);
    }
});

test('project recommender offers content help without silently changing the base price', () => {
    const result = recommendProject({ goal: 'store', content: 'help' });
    assert.equal(result.price, 'Desde S/ 299 · pago único');
    assert.match(result.description, /Creación de Contenido desde S\/ 40/);
});

test('process controls expose and own their associated panels', () => {
    const controls = [...html.matchAll(/aria-controls="(process-panel-\d)"/g)].map(match => match[1]);
    assert.equal(controls.length, 4);
    assert.equal(new Set(controls).size, 4);
    controls.forEach(id => assert.match(html, new RegExp(`id="${id}"`)));
});

test('responsive, reduced-motion and keyboard-focus styles are present', () => {
    assert.match(css, /@media \(max-width:680px\)/);
    assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
    assert.match(css, /:focus-visible/);
    assert.match(css, /\.main-nav\.open/);
});

test('text color tokens meet WCAG AA contrast on their surfaces', () => {
    const tokens = Object.fromEntries([...css.matchAll(/(--[\w-]+):(#[0-9a-f]{6})/gi)].map(match => [match[1], match[2]]));
    const luminance = hex => {
        const channels = hex.match(/[0-9a-f]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
        return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const contrast = (first, second) => {
        const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
        return (light + .05) / (dark + .05);
    };
    assert.ok(contrast(tokens['--orange-text'], tokens['--paper']) >= 4.5, 'accent text on paper');
    assert.ok(contrast(tokens['--orange-text'], tokens['--cream']) >= 4.5, 'accent text on cream');
    assert.ok(contrast('#8a8980', tokens['--ink']) >= 4.5, 'footer secondary text');
});

