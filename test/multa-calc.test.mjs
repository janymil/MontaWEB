import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { calc, parseAmount, formatSoles } = createRequire(import.meta.url)('../js/multa-calc.js');
const NB = ' ';

test('parseAmount accepts plain, spaced and separated amounts and rejects the rest', () => {
    assert.equal(parseAmount('82500'), 82500);
    assert.equal(parseAmount('82 500'), 82500);
    assert.equal(parseAmount(`S/${NB}82${NB}500`), 82500);
    assert.equal(parseAmount('1,234,567'), 1234567);
    assert.equal(parseAmount('82.500'), 82500);
    assert.equal(parseAmount('1234,5'), 1234.5);
    for (const bad of ['', '   ', 'abc', '12abc', '-5', '0', '1e5', null, undefined]) {
        assert.equal(parseAmount(bad), null, String(bad));
    }
});

test('formatSoles uses non-breaking spaces', () => {
    assert.equal(formatSoles(82500), `S/${NB}82${NB}500`);
    assert.equal(formatSoles(825000), `S/${NB}825${NB}000`);
    assert.equal(formatSoles(999), `S/${NB}999`);
    assert.equal(formatSoles(123.45), `S/${NB}123,45`);
});

test('micro business: up to S/ 825 000 gets 10 %', () => {
    const r = calc('100000');
    assert.equal(r.kind, 'micro');
    assert.equal(r.tope, 10000);
    assert.equal(r.message, `Con ventas de S/${NB}100${NB}000, tu negocio es una microempresa. La multa no puede pasar de S/${NB}10${NB}000, el 10${NB}% de tus ventas.`);
    const edge = calc('825000');
    assert.equal(edge.kind, 'micro');
    assert.equal(edge.tope, 82500);
});

test('small business: above S/ 825 000 up to S/ 9 350 000 gets 20 %', () => {
    const just = calc('825001');
    assert.equal(just.kind, 'pequena');
    assert.equal(just.pct, 20);
    const r = calc('2000000');
    assert.equal(r.tope, 400000);
    assert.equal(r.message, `Con ventas de S/${NB}2${NB}000${NB}000, tu negocio es una pequeña empresa. La multa no puede pasar de S/${NB}400${NB}000, el 20${NB}% de tus ventas.`);
    assert.equal(calc('9350000').kind, 'pequena');
    assert.equal(calc('9350000').tope, 1870000);
});

test('above S/ 9 350 000: no sales cap', () => {
    const r = calc('9350001');
    assert.equal(r.kind, 'mayor');
    assert.equal(r.tope, null);
    assert.equal(r.message, `Con ventas de S/${NB}9${NB}350${NB}001, tu negocio ya no es micro ni pequeña empresa. Se aplican los topes de la tabla, sin límite por ventas.`);
});

test('the cap never goes above 450 UIT (S/ 2 475 000)', () => {
    for (const v of ['1', '825000', '9350000']) assert.ok(calc(v).tope <= 2475000);
});

test('empty or non-numeric input gives the error text', () => {
    for (const bad of ['', 'mucho', '0']) {
        const r = calc(bad);
        assert.equal(r.kind, 'error');
        assert.equal(r.message, 'Escribe un monto en soles, solo con números.');
    }
});
