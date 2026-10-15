#!/usr/bin/env node
/* Validates a niche against the playbook's 4 filters.

   The source video insists that skipping ONE filter is the #1 reason channels
   don't monetize at 90 days — and that it's easy to fool yourself ("well, it
   has 200k, I'll build it"). That's why this is a program and not a mental
   checklist: it doesn't negotiate.

   The logic lives in nicho-core.mjs, shared with the web inbox, so both always
   give the same verdict.

   Usage:  node scripts/validar-nicho.mjs nichos/<file>.json
   Each channel's data comes from VidIQ or Social Blade, by hand.
   Output language follows LANG (es_* → Spanish, anything else → English);
   force it with --es or --en.
*/
import { readFileSync } from 'node:fs';
import { validar, MESES_MAX, MIN_GANADORES, VEREDICTO_EN } from './nicho-core.mjs';

const args = process.argv.slice(2);
const archivo = args.find((a) => !a.startsWith('--'));
const es = args.includes('--es') || (!args.includes('--en') && /^es/i.test(process.env.LANG || ''));

const T = es ? {
  uso: 'uso: node scripts/validar-nicho.mjs nichos/<archivo>.json [--es|--en]',
  nicho: 'NICHO', refs: 'CANALES REFERENCIA', ninguno: '(ninguno cargado)',
  vistas: (v, ok, umbral, min) => `vistas/mes ${v}  ${ok} (pide ${umbral}, videos de ${min} min)`,
  edad: (m, ok) => `antigüedad ${m} meses  ${ok} (máx ${MESES_MAX})`,
  comps: 'COMPETENCIA EN ESPAÑOL  (valida que haya demanda hispana)', porMes: 'vistas/mes',
  filtros: 'FILTROS',
  f1: `Al menos ${MIN_GANADORES} canales ganadores`, f3: `Todos con menos de ${MESES_MAX} meses`,
  f4: 'Los ganadores, de preferencia en inglés', f5: 'Demanda validada en español', competidores: 'competidores',
  veredicto: 'VEREDICTO', locale: 'es-MX',
} : {
  uso: 'usage: node scripts/validar-nicho.mjs nichos/<file>.json [--es|--en]',
  nicho: 'NICHE', refs: 'REFERENCE CHANNELS', ninguno: '(none loaded)',
  vistas: (v, ok, umbral, min) => `views/month ${v}  ${ok} (needs ${umbral}, ${min}-min videos)`,
  edad: (m, ok) => `age ${m} months  ${ok} (max ${MESES_MAX})`,
  comps: 'SPANISH-LANGUAGE COMPETITORS  (proves Hispanic demand)', porMes: 'views/month',
  filtros: 'FILTERS',
  f1: `At least ${MIN_GANADORES} winning channels`, f3: `All under ${MESES_MAX} months old`,
  f4: 'Winners, preferably in English', f5: 'Spanish-language demand proven', competidores: 'competitors',
  veredicto: 'VERDICT', locale: 'en-US',
};

if (!archivo) {
  console.error(T.uso);
  process.exit(1);
}

const r = validar(JSON.parse(readFileSync(archivo, 'utf8')));
const fmt = (n) => Number(n).toLocaleString(T.locale);
const marca = (b) => (b ? '✓' : '✗');

console.log(`\n${T.nicho}: ${r.nicho}`);
if (r.notas) console.log(`       ${r.notas}`);
console.log('─'.repeat(72));

console.log(`\n${T.refs}`);
if (!r.refs.length) console.log(`  ${T.ninguno}`);
for (const c of r.refs) {
  console.log(`  ${marca(c.ganador)} ${c.nombre}  [${c.idioma || '?'}]`);
  console.log(`      ${T.vistas(fmt(c.vistasMes), marca(c.okVistas), fmt(c.umbral), c.duracionMin)}`);
  console.log(`      ${T.edad(c.meses, marca(c.okEdad))}`);
}

if (r.comps.length) {
  console.log(`\n${T.comps}`);
  for (const c of r.comps) console.log(`  · ${c.nombre}: ${fmt(c.vistasMes)} ${T.porMes}`);
}

console.log('\n' + '─'.repeat(72));
console.log(T.filtros);
console.log(`  ${marca(r.filtros.ganadores.ok)} 1+2. ${T.f1}  ->  ${r.filtros.ganadores.valor}`);
console.log(`  ${marca(r.filtros.antiguedad.ok)} 3.   ${T.f3}`);
console.log(`  ${marca(r.filtros.ingles.ok)} 4.   ${T.f4}  ->  ${r.filtros.ingles.valor}`);
console.log(`  ${marca(r.filtros.demanda.ok)} +    ${T.f5}  ->  ${r.filtros.demanda.valor} ${T.competidores}`);

const veredicto = es ? r.veredicto : VEREDICTO_EN[r.veredicto];
console.log(`\n${T.veredicto}\n  ${veredicto} — ${es ? r.mensaje : r.message}\n`);
