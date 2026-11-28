/* Calculator: legal cap of the fine for micro and small businesses (Ley 32353, art. 8; Código art. 110). */
(function (root) {
    'use strict';

    var UIT = 5500;
    var MICRO_MAX = 150 * UIT;      // S/ 825 000
    var SMALL_MAX = 1700 * UIT;     // S/ 9 350 000
    var ABSOLUTE_CAP = 450 * UIT;   // S/ 2 475 000
    var NBSP = ' ';

    /* "82500", "82 500", "S/ 82,500", "82.500", "82500,50" -> number, or null when it is not an amount. */
    function parseAmount(raw) {
        if (typeof raw !== 'string') return null;
        var s = raw.replace(/s\s*\/\.?/i, '').replace(/[\s ]/g, '');
        if (!s) return null;
        if (/^\d{1,3}([.,]\d{3})+$/.test(s)) s = s.replace(/[.,]/g, '');
        else if (/^\d+[.,]\d{1,2}$/.test(s)) s = s.replace(',', '.');
        else if (!/^\d+$/.test(s)) return null;
        var n = Number(s);
        return isFinite(n) && n > 0 ? n : null;
    }

    /* 82500 -> "S/ 82 500" (non-breaking spaces); cents only when needed: "S/ 123,45" */
    function formatSoles(n) {
        var cents = Math.round(n * 100);
        var whole = Math.floor(cents / 100);
        var frac = cents % 100;
        var txt = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
        if (frac) txt += ',' + (frac < 10 ? '0' : '') + frac;
        return 'S/' + NBSP + txt;
    }

    function calc(raw) {
        var ventas = parseAmount(raw);
        if (ventas === null) {
            return { kind: 'error', message: 'Escribe un monto en soles, solo con números.' };
        }
        var pct = null, kind = 'mayor';
        if (ventas <= MICRO_MAX) { pct = 10; kind = 'micro'; }
        else if (ventas <= SMALL_MAX) { pct = 20; kind = 'pequena'; }
        var v = formatSoles(ventas);
        if (pct === null) {
            return {
                kind: kind, ventas: ventas, tope: null, pct: null,
                message: 'Con ventas de ' + v + ', tu negocio ya no es micro ni pequeña empresa. Se aplican los topes de la tabla, sin límite por ventas.'
            };
        }
        var tope = Math.min(ventas * pct / 100, ABSOLUTE_CAP);
        return {
            kind: kind, ventas: ventas, tope: tope, pct: pct,
            message: 'Con ventas de ' + v + ', tu negocio es una ' + (kind === 'micro' ? 'microempresa' : 'pequeña empresa') +
                '. La multa no puede pasar de ' + formatSoles(tope) + ', el ' + pct + NBSP + '% de tus ventas.'
        };
    }

    var api = { calc: calc, parseAmount: parseAmount, formatSoles: formatSoles };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.MultaCalc = api;

    /* Progressive enhancement: the calculator stays hidden until this script runs. */
    if (typeof document === 'undefined') return;
    function init() {
        var box = document.querySelector('[data-multa-calc]');
        if (!box) return;
        var form = box.querySelector('form');
        var input = box.querySelector('input');
        var out = box.querySelector('[data-multa-result]');
        var note = box.querySelector('[data-multa-note]');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var r = calc(input.value);
            out.textContent = r.message;
            out.classList.toggle('is-error', r.kind === 'error');
            input.setAttribute('aria-invalid', r.kind === 'error' ? 'true' : 'false');
            note.hidden = r.kind === 'error';
        });
        box.hidden = false;
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : globalThis);
