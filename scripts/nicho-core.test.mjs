/* Tests for the validation logic. Run:  node --test scripts/nicho-core.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validar, mesesDesde, evaluarCanal } from './nicho-core.mjs';

const HOY = new Date('2026-10-15');
const ganador = (n, idioma = 'en') => ({ nombre: `G${n}`, idioma, vistasMes: 2_000_000, duracionMin: 8, primerVideo: '2026-05-01' });
const competidor = { nombre: 'C', tipo: 'competencia', idioma: 'es', vistasMes: 50_000, duracionMin: 8, primerVideo: '2025-01-01' };

test('mesesDesde: an invalid date counts as infinitely old', () => {
  assert.equal(mesesDesde('', HOY), Infinity);
  assert.equal(mesesDesde('2026-04-15', HOY), 6);
});

test('evaluarCanal: 20+ min videos use the long-form threshold', () => {
  const c = evaluarCanal({ vistasMes: 600_000, duracionMin: 25, primerVideo: '2026-06-01' }, HOY);
  assert.equal(c.umbral, 500_000);
  assert.equal(c.ganador, true);
});

test('ADELANTE: 5 English winners + Spanish demand', () => {
  const r = validar({ nicho: 'x', canales: [1, 2, 3, 4, 5].map((n) => ganador(n)).concat(competidor) }, HOY);
  assert.equal(r.veredicto, 'ADELANTE');
});

test('no Spanish competitor means no ADELANTE: demand is unproven', () => {
  const r = validar({ nicho: 'x', canales: [1, 2, 3, 4, 5].map((n) => ganador(n)) }, HOY);
  assert.equal(r.filtros.demanda.ok, false);
  assert.equal(r.veredicto, 'ACEPTABLE');
  assert.match(r.mensaje, /español/);
  assert.match(r.message, /Spanish-language competitor/);
});

test('ACEPTABLE: enough winners, but not in English', () => {
  const r = validar({ nicho: 'x', canales: [1, 2, 3, 4, 5].map((n) => ganador(n, 'es')).concat(competidor) }, HOY);
  assert.equal(r.veredicto, 'ACEPTABLE');
});

test('NO LANZAR: winners missing, with the exact count', () => {
  const r = validar({ nicho: 'x', canales: [ganador(1), ganador(2), ganador(3), competidor] }, HOY);
  assert.equal(r.veredicto, 'NO LANZAR');
  assert.match(r.mensaje, /^Faltan 2 canales ganadores/);
  assert.match(r.message, /^2 winning channels missing/);
});

test('an old channel is not a winner even with the views', () => {
  const r = validar({ nicho: 'x', canales: [{ ...ganador(1), primerVideo: '2024-01-01' }] }, HOY);
  assert.equal(r.ganadores, 0);
});

test('no channels does not crash', () => {
  const r = validar({ nicho: 'x' }, HOY);
  assert.equal(r.veredicto, 'NO LANZAR');
});

test('one missing winner uses the singular in both languages', () => {
  const r = validar({ nicho: 'x', canales: [1, 2, 3, 4].map((n) => ganador(n)) }, HOY);
  assert.match(r.mensaje, /^Falta 1 canal ganador\./);
  assert.match(r.message, /^1 winning channel missing\./);
});
