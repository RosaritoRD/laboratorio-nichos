/* Tests de la lógica de validación. Ejecutar:  node --test scripts/ */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validar, mesesDesde, evaluarCanal } from './nicho-core.mjs';

const HOY = new Date('2026-10-15');
const ganador = (n, idioma = 'en') => ({ nombre: `G${n}`, idioma, vistasMes: 2_000_000, duracionMin: 8, primerVideo: '2026-05-01' });
const competidor = { nombre: 'C', tipo: 'competencia', idioma: 'es', vistasMes: 50_000, duracionMin: 8, primerVideo: '2025-01-01' };

test('mesesDesde: fecha inválida cuenta como infinitamente vieja', () => {
  assert.equal(mesesDesde('', HOY), Infinity);
  assert.equal(mesesDesde('2026-04-15', HOY), 6);
});

test('evaluarCanal: vídeos de 20+ min usan el umbral largo', () => {
  const c = evaluarCanal({ vistasMes: 600_000, duracionMin: 25, primerVideo: '2026-06-01' }, HOY);
  assert.equal(c.umbral, 500_000);
  assert.equal(c.ganador, true);
});

test('ADELANTE: 5 ganadores en inglés + demanda en español', () => {
  const r = validar({ nicho: 'x', canales: [1, 2, 3, 4, 5].map((n) => ganador(n)).concat(competidor) }, HOY);
  assert.equal(r.veredicto, 'ADELANTE');
});

test('sin competencia en español no hay ADELANTE: la demanda no está probada', () => {
  const r = validar({ nicho: 'x', canales: [1, 2, 3, 4, 5].map((n) => ganador(n)) }, HOY);
  assert.equal(r.filtros.demanda.ok, false);
  assert.equal(r.veredicto, 'ACEPTABLE');
  assert.match(r.mensaje, /español/);
});

test('ACEPTABLE: ganadores suficientes pero no en inglés', () => {
  const r = validar({ nicho: 'x', canales: [1, 2, 3, 4, 5].map((n) => ganador(n, 'es')).concat(competidor) }, HOY);
  assert.equal(r.veredicto, 'ACEPTABLE');
});

test('NO LANZAR: faltan ganadores, con el número exacto', () => {
  const r = validar({ nicho: 'x', canales: [ganador(1), ganador(2), ganador(3), competidor] }, HOY);
  assert.equal(r.veredicto, 'NO LANZAR');
  assert.match(r.mensaje, /^Faltan 2 canales ganadores/);
});

test('un canal viejo no es ganador aunque tenga vistas', () => {
  const r = validar({ nicho: 'x', canales: [{ ...ganador(1), primerVideo: '2024-01-01' }] }, HOY);
  assert.equal(r.ganadores, 0);
});

test('sin canales no revienta', () => {
  const r = validar({ nicho: 'x' }, HOY);
  assert.equal(r.veredicto, 'NO LANZAR');
});
