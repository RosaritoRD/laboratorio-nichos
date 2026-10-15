/* Capture inbox for the YouTube project.

   Why it exists: capture from your phone (transcripts, channel data while you
   browse YouTube with VidIQ) without opening a terminal. Whatever is saved here
   gets worked on later by Claude Code over SSH.

   What it does NOT do, on purpose: run commands, read outside BASE, or write
   outside the notas/ and nichos/ folders. There is no shell behind this.

   Authentication is NOT here: oauth2-proxy sits in front. This server only
   listens on the internal Docker network and is never exposed directly.
*/
import { createServer } from 'node:http';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { validar } from '../scripts/nicho-core.mjs';
import { nichosPorTema, ideasDeTitulo, temas } from '../scripts/banco-ideas.mjs';

const BASE   = process.env.PROYECTO_DIR || '/proyecto';
const PUERTO = Number(process.env.PORT || 8080);
const MAX_BODY = 2_000_000;                     // 2 MB: a long transcript fits
const SLUG = /^[a-z0-9][a-z0-9-]{0,59}$/;       // no dots or slashes: blocks path traversal

const dir = (sub) => path.join(BASE, sub);

/* Every write goes through here. It resolves the path and checks it is still
   inside the allowed subfolder; if not, nothing is written. */
function rutaSegura(sub, slug, ext) {
  if (!SLUG.test(slug)) throw new Error('invalid name: ' + slug);
  const destino = path.resolve(dir(sub), slug + ext);
  if (path.dirname(destino) !== path.resolve(dir(sub))) throw new Error('path out of bounds');
  return destino;
}

const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'untitled';

const json = (res, code, obj) => {
  const b = JSON.stringify(obj);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(b) });
  res.end(b);
};

function leerBody(req) {
  return new Promise((ok, fail) => {
    let n = 0; const partes = [];
    req.on('data', (c) => {
      n += c.length;
      if (n > MAX_BODY) { fail(new Error('too large')); req.destroy(); return; }
      partes.push(c);
    });
    req.on('end', () => { try { ok(JSON.parse(Buffer.concat(partes).toString('utf8') || '{}')); } catch { fail(new Error('invalid json')); } });
    req.on('error', fail);
  });
}

const leerNicho = async (slug) => JSON.parse(await readFile(rutaSegura('nichos', slug, '.json'), 'utf8'));

async function listarNichos() {
  const out = [];
  for (const f of await readdir(dir('nichos')).catch(() => [])) {
    if (!f.endsWith('.json')) continue;
    const slug = f.slice(0, -5);
    try {
      const d = await leerNicho(slug);
      const r = validar(d);
      out.push({ slug, nicho: d.nicho, veredicto: r.veredicto, ganadores: r.ganadores, canales: (d.canales || []).length });
    } catch { /* one broken JSON file does not break the list */ }
  }
  // A JSON without `nicho` must not break the whole list: sort it by its file name.
  return out.sort((a, b) => String(a.nicho ?? a.slug).localeCompare(String(b.nicho ?? b.slug)));
}

const rutas = {
  'GET /api/estado': async () => ({
    nichos: await listarNichos(),
    notas: (await readdir(dir('notas')).catch(() => [])).filter((f) => f.endsWith('.md')).sort(),
  }),

  'POST /api/nota': async (body) => {
    const texto = String(body.texto || '').trim();
    if (!texto) throw new Error('the note is empty');
    const slug = slugify(body.titulo || 'nota-' + new Date().toISOString().slice(0, 10));
    const destino = rutaSegura('notas', slug, '.md');
    const cabecera = `# ${body.titulo || slug}\n\nCaptured ${new Date().toISOString().slice(0, 16).replace('T', ' ')} from the inbox.\n\n---\n\n`;
    await writeFile(destino, cabecera + texto + '\n', 'utf8');
    return { ok: true, archivo: `notas/${slug}.md`, bytes: Buffer.byteLength(texto) };
  },

  'POST /api/nicho': async (body) => {
    const slug = slugify(body.slug || body.nicho);
    let d;
    try { d = await leerNicho(slug); }
    catch { d = { nicho: body.nicho || slug, notas: body.notas || '', canales: [] }; }
    if (!Array.isArray(d.canales)) d.canales = [];
    if (body.nicho) d.nicho = body.nicho;
    if (body.notas !== undefined) d.notas = body.notas;

    if (body.canal) {
      const c = body.canal;
      if (!String(c.nombre || '').trim()) throw new Error('the channel needs a name');
      d.canales.push({
        nombre: String(c.nombre).trim(),
        tipo: c.tipo === 'competencia' ? 'competencia' : 'referencia',
        idioma: String(c.idioma || 'en').slice(0, 5),
        vistasMes: Math.max(0, Number(c.vistasMes) || 0),
        duracionMin: Math.max(0, Number(c.duracionMin) || 0),
        primerVideo: String(c.primerVideo || '').slice(0, 10),
      });
    }
    // Only indexes that exist: splice(-1, 1) would delete the LAST channel by accident.
    const i = body.borrarCanal;
    if (Number.isInteger(i) && i >= 0 && i < d.canales.length) d.canales.splice(i, 1);

    await writeFile(rutaSegura('nichos', slug, '.json'), JSON.stringify(d, null, 2) + '\n', 'utf8');
    return { ok: true, slug, ...validar(d) };
  },

  /* Templates: returns only the copyable part, between the PROMPT:INICIO and
     PROMPT:FIN markers. The rest of the .md is my own notes and must not go to
     the clipboard. */
  'GET /api/plantillas': async () => {
    const out = [];
    for (const f of (await readdir(dir('plantillas')).catch(() => [])).sort()) {
      if (!f.endsWith('.md')) continue;
      const txt = await readFile(path.join(dir('plantillas'), f), 'utf8');
      const m = txt.match(/<!-- PROMPT:INICIO -->\n([\s\S]*?)\n<!-- PROMPT:FIN -->/);
      if (!m) continue;
      const titulo = (txt.match(/^#\s+(.+)$/m) || [, f])[1];
      out.push({
        archivo: f,
        titulo: titulo.replace(/^Prompt \d+ — /, ''),
        cuerpo: m[1].trim(),
        // Only the real {{...}} slots. The document's [VARIABLE] markers are
        // explanatory labels, and many are already filled in.
        variables: [...new Set([...m[1].matchAll(/\{\{([^}]+)\}\}/g)].map((x) => x[1].trim()))],
      });
    }
    return { plantillas: out, nichos: (await listarNichos()).map((n) => n.nicho) };
  },

  /* Ideas: candidates and hooks. No made-up metrics — they must be validated. */
  'GET /api/ideas': async (_b, url) => ({
    temas: temas(),
    nichos: nichosPorTema(url.searchParams.get('tema') || ''),
    titulos: ideasDeTitulo(url.searchParams.get('titulo') || '', 6),
  }),

  'GET /api/nicho': async (_b, url) => {
    const slug = url.searchParams.get('slug') || '';
    const d = await leerNicho(slugify(slug));
    return { ok: true, slug, ...validar(d) };
  },
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      const html = await readFile(new URL('./public/index.html', import.meta.url));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
    const fn = rutas[`${req.method} ${url.pathname}`];
    if (!fn) return json(res, 404, { error: 'not found' });
    const body = req.method === 'POST' ? await leerBody(req) : null;
    return json(res, 200, await fn(body, url));
  } catch (e) {
    return json(res, 400, { error: e.message });
  }
});

await mkdir(dir('notas'), { recursive: true }).catch(() => {});
await mkdir(dir('nichos'), { recursive: true }).catch(() => {});
server.listen(PUERTO, '0.0.0.0', () => console.log(`inbox listening on :${PUERTO}, project at ${BASE}`));
