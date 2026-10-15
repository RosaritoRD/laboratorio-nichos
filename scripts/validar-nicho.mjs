#!/usr/bin/env node
/* Valida un nicho contra los 4 filtros del playbook.

   El video insiste en que saltarse UN filtro es la causa nº1 de no monetizar a
   los 90 días — y en que es fácil auto-engañarse ("bueno, tiene 200k, la armo").
   Por eso esto es un programa y no una lista mental: no negocia.

   La lógica vive en nicho-core.mjs, compartida con la bandeja web, para que
   ambas den siempre el mismo veredicto.

   Uso:  node scripts/validar-nicho.mjs nichos/<archivo>.json
   Los datos de cada canal salen de VidIQ o Social Blade, a mano.
*/
import { readFileSync } from 'node:fs';
import { validar, MESES_MAX, MIN_GANADORES } from './nicho-core.mjs';

const archivo = process.argv[2];
if (!archivo) {
  console.error('uso: node scripts/validar-nicho.mjs nichos/<archivo>.json');
  process.exit(1);
}

const r = validar(JSON.parse(readFileSync(archivo, 'utf8')));
const fmt = (n) => Number(n).toLocaleString('es-MX');
const marca = (b) => (b ? '✓' : '✗');

console.log(`\nNICHO: ${r.nicho}`);
if (r.notas) console.log(`       ${r.notas}`);
console.log('─'.repeat(72));

console.log('\nCANALES REFERENCIA');
if (!r.refs.length) console.log('  (ninguno cargado)');
for (const c of r.refs) {
  console.log(`  ${marca(c.ganador)} ${c.nombre}  [${c.idioma || '?'}]`);
  console.log(`      vistas/mes ${fmt(c.vistasMes)}  ${marca(c.okVistas)} (pide ${fmt(c.umbral)}, videos de ${c.duracionMin} min)`);
  console.log(`      antigüedad ${c.meses} meses  ${marca(c.okEdad)} (máx ${MESES_MAX})`);
}

if (r.comps.length) {
  console.log('\nCOMPETENCIA EN ESPAÑOL  (valida que haya demanda hispana)');
  for (const c of r.comps) console.log(`  · ${c.nombre}: ${fmt(c.vistasMes)} vistas/mes`);
}

console.log('\n' + '─'.repeat(72));
console.log('FILTROS');
console.log(`  ${marca(r.filtros.ganadores.ok)} 1+2. Al menos ${MIN_GANADORES} canales ganadores  ->  ${r.filtros.ganadores.valor}`);
console.log(`  ${marca(r.filtros.antiguedad.ok)} 3.   Todos con menos de ${MESES_MAX} meses`);
console.log(`  ${marca(r.filtros.ingles.ok)} 4.   Los ganadores, de preferencia en inglés  ->  ${r.filtros.ingles.valor}`);
console.log(`  ${marca(r.filtros.demanda.ok)} +    Demanda validada en español  ->  ${r.filtros.demanda.valor} competidores`);

console.log(`\nVEREDICTO\n  ${r.veredicto} — ${r.mensaje}\n`);
