/* Lógica pura de validación de nichos. Sin E/S, sin console.
   La usan el CLI (validar-nicho.mjs) y la bandeja web. Un solo criterio,
   un solo sitio donde cambiarlo. */

export const UMBRAL_CORTO  = 1_000_000;  // videos < 20 min
export const UMBRAL_LARGO  =   500_000;  // videos >= 20 min
export const MESES_MAX     = 12;
export const MIN_GANADORES = 5;

export function mesesDesde(iso, hoy = new Date()) {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return Infinity;
  return (hoy.getFullYear() - f.getFullYear()) * 12 + (hoy.getMonth() - f.getMonth());
}

export function evaluarCanal(c, hoy = new Date()) {
  const umbral = Number(c.duracionMin) >= 20 ? UMBRAL_LARGO : UMBRAL_CORTO;
  const meses  = mesesDesde(c.primerVideo, hoy);
  const okVistas = Number(c.vistasMes) >= umbral;
  const okEdad   = meses <= MESES_MAX;
  return { ...c, umbral, meses, okVistas, okEdad, ganador: okVistas && okEdad };
}

export function validar(d, hoy = new Date()) {
  const canales = Array.isArray(d.canales) ? d.canales : [];
  const refs  = canales.filter((c) => (c.tipo || 'referencia') === 'referencia').map((c) => evaluarCanal(c, hoy));
  const comps = canales.filter((c) => c.tipo === 'competencia').map((c) => evaluarCanal(c, hoy));

  const ganadores = refs.filter((c) => c.ganador);
  const enIngles  = ganadores.filter((c) => String(c.idioma || '').toLowerCase().startsWith('en'));

  const filtros = {
    ganadores:  { ok: ganadores.length >= MIN_GANADORES, valor: ganadores.length, pide: MIN_GANADORES },
    antiguedad: { ok: refs.length > 0 && refs.every((c) => c.okEdad), valor: refs.filter((c) => c.okEdad).length, pide: refs.length },
    ingles:     { ok: enIngles.length >= MIN_GANADORES, valor: enIngles.length, pide: MIN_GANADORES },
    demanda:    { ok: comps.length > 0, valor: comps.length, pide: 1 },
  };

  let veredicto, mensaje;
  if (filtros.ganadores.ok && filtros.ingles.ok) {
    veredicto = 'ADELANTE';
    mensaje = 'El nicho pasa los filtros. A partir de aquí el trabajo es volumen.';
  } else if (filtros.ganadores.ok) {
    veredicto = 'ACEPTABLE';
    mensaje = `Hay ${ganadores.length} ganadores pero solo ${enIngles.length} en inglés. `
            + 'De los de inglés se saca el formato: busca más antes de lanzar.';
  } else {
    const faltan = MIN_GANADORES - ganadores.length;
    veredicto = 'NO LANZAR';
    mensaje = `Falta${faltan === 1 ? '' : 'n'} ${faltan} canal${faltan === 1 ? '' : 'es'} ganador${faltan === 1 ? '' : 'es'}. `
            + 'Busca más canales o haz otro doble clic en el tema. NO bajes el umbral.';
  }

  return { nicho: d.nicho, notas: d.notas, refs, comps, ganadores: ganadores.length, enIngles: enIngles.length, filtros, veredicto, mensaje };
}
