/**
 * Minimal DOM harness for the MontaWeb static site.
 *
 * The site has no build step and no dev dependencies; `npm test` must keep working with a bare
 * `node` install. So instead of pulling in jsdom, the tests boot the real `js/app.js` inside a
 * `vm` context with just enough of `document` / `window` for the page scripts to run.
 *
 * Deliberately small: every API app.js touches today and nothing more. If app.js starts using a
 * new DOM API, add it here and say why in the commit.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function makeElement(tagName = 'div') {
    const classes = new Set();
    const handlers = new Map();
    const el = {
        tagName: tagName.toUpperCase(),
        id: '',
        className: '',
        innerHTML: '',
        type: '',
        style: {},
        dataset: {},
        attributes: {},
        children: [],
        parentNode: null,
        classList: {
            add: (...names) => names.forEach(n => classes.add(n)),
            remove: (...names) => names.forEach(n => classes.delete(n)),
            contains: name => classes.has(name),
            toggle(name, force) {
                const on = force === undefined ? !classes.has(name) : Boolean(force);
                if (on) classes.add(name); else classes.delete(name);
                return on;
            },
            get length() { return classes.size; },
            values: () => [...classes],
        },
        setAttribute(name, value) { el.attributes[name] = String(value); },
        getAttribute(name) { return name in el.attributes ? el.attributes[name] : null; },
        removeAttribute(name) { delete el.attributes[name]; },
        appendChild(child) { el.children.push(child); child.parentNode = el; return child; },
        addEventListener(type, fn) {
            if (!handlers.has(type)) handlers.set(type, []);
            handlers.get(type).push(fn);
        },
        removeEventListener(type, fn) {
            handlers.set(type, (handlers.get(type) || []).filter(h => h !== fn));
        },
        fire(type, event = {}) { (handlers.get(type) || []).forEach(fn => fn(event)); },
        listenerCount(type) { return (handlers.get(type) || []).length; },
        querySelector: () => null,
        querySelectorAll: () => [],
        contains: () => false,
        closest: () => null,
        focus() {},
    };
    return el;
}

export function findById(node, id) {
    if (!node) return null;
    if (node.id === id) return node;
    for (const child of node.children || []) {
        const found = findById(child, id);
        if (found) return found;
    }
    return null;
}

export function findAll(node, predicate, out = []) {
    if (node && predicate(node)) out.push(node);
    for (const child of (node && node.children) || []) findAll(child, predicate, out);
    return out;
}

/**
 * Load `js/app.js` into a fresh sandbox. Nothing runs until `fireDOMContentLoaded()`, which is
 * exactly what the browser does.
 */
export function bootApp({ scrollY = 0, source } = {}) {
    const appSource = source ?? readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');

    const body = makeElement('body');
    const created = [];
    const scrollCalls = [];
    const documentHandlers = new Map();
    const windowHandlers = new Map();

    const document = {
        body,
        documentElement: makeElement('html'),
        addEventListener(type, fn) {
            if (!documentHandlers.has(type)) documentHandlers.set(type, []);
            documentHandlers.get(type).push(fn);
        },
        removeEventListener() {},
        createElement(tag) {
            const el = makeElement(tag);
            created.push(el);
            return el;
        },
        getElementById: id => findById(body, id),
        querySelector: () => null,
        querySelectorAll: () => [],
    };

    const window = {
        scrollY,
        innerWidth: 1280,
        location: { href: '' },
        open() {},
        scrollTo: options => scrollCalls.push(options),
        addEventListener(type, fn) {
            if (!windowHandlers.has(type)) windowHandlers.set(type, []);
            windowHandlers.get(type).push(fn);
        },
        removeEventListener() {},
        fire(type, event = {}) { (windowHandlers.get(type) || []).forEach(fn => fn(event)); },
        listenerCount(type) { return (windowHandlers.get(type) || []).length; },
    };

    const context = vm.createContext({
        window,
        document,
        localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
        console: { log() {}, warn() {}, error() {} },
        alert() {},
        setTimeout: () => 0,
        clearTimeout() {},
        encodeURIComponent,
    });
    vm.runInContext(appSource, context, { filename: 'js/app.js' });

    return {
        context,
        window,
        document,
        body,
        created,
        scrollCalls,
        fireDOMContentLoaded() {
            (documentHandlers.get('DOMContentLoaded') || []).forEach(fn => fn());
        },
    };
}
