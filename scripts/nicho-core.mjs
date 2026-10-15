/* Pure niche-validation logic. No I/O, no console.
   Used by the CLI (validar-nicho.mjs) and the web inbox. One rule set,
   one place to change it. */

export const UMBRAL_CORTO  = 1_000_000;  // videos under 20 min
export const UMBRAL_LARGO  =   500_000;  // videos of 20 min or more
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

/* Display labels for the verdict codes. */
export const VEREDICTO_EN = { 'ADELANTE': 'GO', 'ACEPTABLE': 'ACCEPTABLE', 'NO LANZAR': "DON'T LAUNCH" };

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

  // `veredicto` is a stable code (the inbox uses it as a CSS class); the text
  // goes out in both languages: `mensaje` (Spanish) and `message` (English).
  let veredicto, mensaje, message;
  if (filtros.ganadores.ok && filtros.ingles.ok && filtros.demanda.ok) {
    veredicto = 'ADELANTE';
    mensaje = 'El nicho pasa los filtros. A partir de aquí el trabajo es volumen.';
    message = 'The niche passes the filters. From here on, the work is volume.';
  } else if (filtros.ganadores.ok && filtros.ingles.ok) {
    // Without a single Spanish-language competitor there's no proof Hispanic
    // viewers search for it: the format works in English, demand here is a guess.
    veredicto = 'ACEPTABLE';
    mensaje = 'El formato funciona en inglés, pero no hay ningún competidor en español. '
            + 'Encuentra al menos uno antes de lanzar: es la prueba de que hay demanda.';
    message = 'The format works in English, but there is no Spanish-language competitor. '
            + 'Find at least one before launching: it is your proof of demand.';
  } else if (filtros.ganadores.ok) {
    veredicto = 'ACEPTABLE';
    mensaje = `Hay ${ganadores.length} ganadores pero solo ${enIngles.length} en inglés. `
            + 'De los de inglés se saca el formato: busca más antes de lanzar.';
    message = `There are ${ganadores.length} winners but only ${enIngles.length} in English. `
            + 'The format comes from the English ones: find more before launching.';
  } else {
    const faltan = MIN_GANADORES - ganadores.length;
    veredicto = 'NO LANZAR';
    mensaje = `Falta${faltan === 1 ? '' : 'n'} ${faltan} canal${faltan === 1 ? '' : 'es'} ganador${faltan === 1 ? '' : 'es'}. `
            + 'Busca más canales o haz otro doble clic en el tema. NO bajes el umbral.';
    message = `${faltan} winning channel${faltan === 1 ? '' : 's'} missing. `
            + "Find more channels or drill one level deeper into the topic. DON'T lower the bar.";
  }

  return { nicho: d.nicho, notas: d.notas, refs, comps, ganadores: ganadores.length, enIngles: enIngles.length, filtros, veredicto, mensaje, message };
}
