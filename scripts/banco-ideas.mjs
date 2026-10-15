/* Banco de ideas de nicho y de contenido.

   IMPORTANTE — honestidad de los datos: aquí NO hay métricas. Ningún número de
   vistas, ningún "este nicho da X". Inventar esas cifras sería exactamente el
   error que el playbook advierte. Lo que hay son CANDIDATOS construidos con los
   criterios del método (evergreen + audiencia +50 + carga emocional), que
   todavía tienes que validar tú con VidIQ contra los 4 filtros.

   Un candidato de aquí NO es un nicho aprobado. Es un punto de partida para la
   pestaña Nicho.
*/

/* Los temas que funcionaban en la tele de los 80/90 y siguen funcionando.
   "No te creas tan inteligente: vete a lo que ya funcionó." */
export const NICHOS = [
  { tema:'Religión', clic1:'Oraciones', clic2:'Oraciones de la mañana por día de la semana',
    porque:'Consumo diario, hábito fijo, audiencia mayor devota. Full IA puro.', emocion:'esperanza / consuelo' },
  { tema:'Religión', clic1:'Historias bíblicas', clic2:'Personajes olvidados de la Biblia',
    porque:'Evergreen absoluto y material infinito.', emocion:'asombro' },
  { tema:'Salud', clic1:'Salud para diabéticos', clic2:'Recetas para diabéticos mayores de 60',
    porque:'Necesidad real y recurrente. Ojo: nada de consejo médico concreto.', emocion:'miedo / alivio' },
  { tema:'Salud', clic1:'Remedios de antes', clic2:'Remedios caseros que usaba tu abuela y la ciencia hoy explica',
    porque:'Nostalgia + validación. Encaja perfecto con +50.', emocion:'nostalgia' },
  { tema:'Historia', clic1:'Vida cotidiana del pasado', clic2:'Cómo se vivía en los años 50 en México',
    porque:'Nostalgia directa de la audiencia objetivo, que lo vivió.', emocion:'nostalgia' },
  { tema:'Historia', clic1:'Oficios desaparecidos', clic2:'Oficios que existían hace 60 años y ya nadie hace',
    porque:'Material infinito y muy visual con IA.', emocion:'melancolía' },
  { tema:'Dinero', clic1:'Ahorro de la vieja escuela', clic2:'Trucos de ahorro de la época de escasez',
    porque:'El equivalente hispano de los canales Depression-era en inglés.', emocion:'urgencia / prudencia' },
  { tema:'Dinero', clic1:'Pensiones y jubilación', clic2:'Errores que te bajan la pensión',
    porque:'Altísima relevancia para +55 y RPM alto por ser finanzas.', emocion:'miedo a perder' },
  { tema:'Misterio', clic1:'Lugares', clic2:'Pueblos abandonados y por qué los dejaron',
    porque:'Formato documental, encaja con voz IA y stock.', emocion:'intriga' },
  { tema:'Misterio', clic1:'Casos sin resolver', clic2:'Desapariciones que nunca se explicaron',
    porque:'Retención altísima por el bucle abierto.', emocion:'inquietud' },
  { tema:'Naturaleza', clic1:'Animales', clic2:'Animales que existieron y nadie recuerda',
    porque:'Muy visual, cero riesgo, apto para IA total.', emocion:'asombro' },
  { tema:'Hogar', clic1:'Arreglos de casa', clic2:'Señales en tu casa que anuncian un problema caro',
    porque:'Utilidad + miedo. El ejemplo de la grieta del video es de aquí.', emocion:'miedo preventivo' },
  { tema:'Cocina', clic1:'Recetas de antes', clic2:'Platillos que se cocinaban en cada casa y se perdieron',
    porque:'Nostalgia + utilidad. Muy compartible.', emocion:'nostalgia' },
  { tema:'Historias', clic1:'Relatos inventados', clic2:'Historias de reencuentros familiares',
    porque:'Novela hablada. Es de lo que más funciona según el video.', emocion:'ternura / llanto' },
  { tema:'Curiosidades', clic1:'Objetos', clic2:'Objetos de tu casa que valen dinero y no lo sabes',
    porque:'Gancho de descubrimiento personal, altísimo CTR.', emocion:'codicia / sorpresa' },
];

/* Patrones de título del video: el framing hace el trabajo, no el tema.
   "Los mejores libros" -> "Los libros que los ricos quieren prohibir". */
export const GANCHOS = [
  (t) => `Los ${t} que nadie quiere que sepas`,
  (t) => `${t}: lo que descubrieron cambió todo`,
  (t) => `Los ${t} prohibidos que funcionaban de verdad`,
  (t) => `Nadie habla de ${t}, y debería`,
  (t) => `${t} que tu abuela sabía y hoy se perdieron`,
  (t) => `La verdad sobre ${t} que se ocultó durante años`,
  (t) => `${t}: el error que casi nadie evita a tiempo`,
  (t) => `Lo que pasó con ${t} y por qué se calló`,
  (t) => `${t} que existían y hoy son imposibles de ver`,
  (t) => `Si tienes más de 60, ${t} te va a interesar`,
];

export const ideasDeTitulo = (tema, n = 6) => {
  const t = String(tema || '').trim().toLowerCase() || 'esto';
  return GANCHOS.map((f) => f(t)).sort(() => Math.random() - 0.5).slice(0, n);
};

export const nichosPorTema = (tema) => !tema ? NICHOS
  : NICHOS.filter((x) => (x.tema + x.clic1 + x.clic2).toLowerCase().includes(String(tema).toLowerCase()));

export const temas = () => [...new Set(NICHOS.map((n) => n.tema))].sort();
