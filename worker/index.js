import { hashIp } from './lib/hash.js';
import { contieneLenguajeProhibido } from './lib/moderation.js';
import { esTokenDoradoValido } from './lib/trivial.js';
import { paisDesdeCoordenadas } from './lib/geocode.js';
import { validarFoto } from './lib/imagenes.js';
import { respaldarPines, listarBackups } from './lib/backup.js';

const MAX_NOMBRE = 30;
const MAX_COMENTARIO = 150;
const LIMITE_FRECUENCIA_MS = 3 * 24 * 60 * 60 * 1000; // 3 días

function json(data, init) {
  return Response.json(data, init);
}

// El resto del código solo conoce `foto_key` (la clave en R2); esta función
// es el único sitio que la traduce a la URL pública que sirve `getFoto`.
function conFotoUrl({ foto_key, ...resto }) {
  return { ...resto, foto_url: foto_key ? `/api/fotos/${foto_key}` : null };
}

async function getPins(env) {
  const { results } = await env.DB.prepare(
    `SELECT id, nombre, comentario, lat, lng, tipo, pais, pais_code, foto_key, created_at
     FROM pins ORDER BY created_at DESC`
  ).all();
  return json((results ?? []).map(conFotoUrl));
}

async function getFoto(pathname, env) {
  const clave = decodeURIComponent(pathname.slice('/api/fotos/'.length));
  // Solo se sirven objetos con el prefijo que usamos al subirlos — evita que
  // esta ruta se use como acceso genérico a cualquier objeto del bucket.
  if (!clave.startsWith('pins/')) return json({ error: 'No encontrado.' }, { status: 404 });

  const objeto = await env.FOTOS.get(clave);
  if (!objeto) return json({ error: 'No encontrado.' }, { status: 404 });

  return new Response(objeto.body, {
    headers: {
      'content-type': objeto.httpMetadata?.contentType ?? 'application/octet-stream',
      // La clave incluye un UUID único por foto: nunca se sobrescribe, así que el caché puede ser eterno.
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}

async function postPin(request, env) {
  const esMultipart = (request.headers.get('content-type') ?? '').includes('multipart/form-data');

  let body;
  let archivoFoto = null;
  try {
    if (esMultipart) {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
      const foto = form.get('foto');
      if (foto instanceof File && foto.size > 0) archivoFoto = foto;
    } else {
      body = await request.json();
    }
  } catch {
    return json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 });
  }

  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  const comentario = typeof body.comentario === 'string' ? body.comentario.trim() : '';
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (!nombre || nombre.length > MAX_NOMBRE) {
    return json({ error: `El nombre debe tener entre 1 y ${MAX_NOMBRE} caracteres.` }, { status: 400 });
  }
  if (comentario.length > MAX_COMENTARIO) {
    return json({ error: `El comentario no puede superar los ${MAX_COMENTARIO} caracteres.` }, { status: 400 });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return json({ error: 'Ubicación inválida.' }, { status: 400 });
  }
  if (contieneLenguajeProhibido(nombre, comentario)) {
    return json({ error: 'Revisa el texto: contiene palabras no permitidas.' }, { status: 400 });
  }

  const coincidente = await env.DB.prepare(
    `SELECT id FROM pins WHERE lat = ? AND lng = ? LIMIT 1`
  ).bind(lat, lng).first();
  if (coincidente) {
    return json(
      { error: 'Ya hay un pin justo en ese punto. Elige un lugar ligeramente distinto para que no se solapen.' },
      { status: 409 }
    );
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? 'sin-ip';
  const ipHash = await hashIp(ip, env.IP_SALT ?? '');

  // Solo se define en `.dev.vars` (gitignorado, nunca se despliega): permite
  // probar el formulario en local sin esperar los 3 días entre huellas.
  const limiteActivo = env.DESACTIVAR_LIMITE_FRECUENCIA !== 'true';

  const ultimo = limiteActivo
    ? await env.DB.prepare(
        `SELECT created_at FROM pins WHERE ip_hash = ? ORDER BY created_at DESC LIMIT 1`
      ).bind(ipHash).first()
    : null;

  if (ultimo && Date.now() - ultimo.created_at < LIMITE_FRECUENCIA_MS) {
    return json(
      { error: 'Ya dejaste tu huella hace poco. ¡Gracias por pasar! Vuelve pronto.' },
      { status: 429 }
    );
  }

  let tipo = 'normal';
  if (body.tipo === 'dorado' && (await esTokenDoradoValido(body.token))) {
    tipo = 'dorado';
  }

  let fotoKey = null;
  if (archivoFoto) {
    const resultado = await validarFoto(archivoFoto);
    if (resultado.error) {
      return json({ error: resultado.error }, { status: 400 });
    }
    await env.FOTOS.put(resultado.clave, resultado.buffer, {
      httpMetadata: { contentType: resultado.tipo },
    });
    fotoKey = resultado.clave;
  }

  const { pais, paisCode } = await paisDesdeCoordenadas(lat, lng);
  const createdAt = Date.now();

  const inserted = await env.DB.prepare(
    `INSERT INTO pins (nombre, comentario, lat, lng, tipo, pais, pais_code, foto_key, ip_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id, nombre, comentario, lat, lng, tipo, pais, pais_code, foto_key, created_at`
  ).bind(nombre, comentario || null, lat, lng, tipo, pais, paisCode, fotoKey, ipHash, createdAt).first();

  return json(conFotoUrl(inserted), { status: 201 });
}

function autorizadoAdmin(request, env) {
  const password = request.headers.get('x-admin-password');
  return Boolean(env.ADMIN_PASSWORD) && password === env.ADMIN_PASSWORD;
}

async function adminListarPines(request, env) {
  if (!autorizadoAdmin(request, env)) {
    return json({ error: 'No autorizado.' }, { status: 401 });
  }
  const { results } = await env.DB.prepare(
    `SELECT id, nombre, comentario, lat, lng, tipo, pais, pais_code, foto_key,
            substr(ip_hash, 1, 8) AS ip_prefix, created_at
     FROM pins ORDER BY created_at DESC`
  ).all();
  return json((results ?? []).map(conFotoUrl));
}

async function adminActualizarPin(request, env) {
  if (!autorizadoAdmin(request, env)) {
    return json({ error: 'No autorizado.' }, { status: 401 });
  }
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return json({ error: 'Id inválido.' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 });
  }

  const campos = [];
  const valores = [];

  if (typeof body.nombre === 'string') {
    const nombre = body.nombre.trim();
    if (!nombre || nombre.length > MAX_NOMBRE) {
      return json({ error: `El nombre debe tener entre 1 y ${MAX_NOMBRE} caracteres.` }, { status: 400 });
    }
    campos.push('nombre = ?');
    valores.push(nombre);
  }

  if (typeof body.comentario === 'string') {
    const comentario = body.comentario.trim();
    if (comentario.length > MAX_COMENTARIO) {
      return json({ error: `El comentario no puede superar los ${MAX_COMENTARIO} caracteres.` }, { status: 400 });
    }
    campos.push('comentario = ?');
    valores.push(comentario || null);
  }

  if (body.tipo === 'normal' || body.tipo === 'dorado') {
    campos.push('tipo = ?');
    valores.push(body.tipo);
  }

  if ((typeof body.nombre === 'string' || typeof body.comentario === 'string') &&
      contieneLenguajeProhibido(body.nombre ?? '', body.comentario ?? '')) {
    return json({ error: 'Revisa el texto: contiene palabras no permitidas.' }, { status: 400 });
  }

  // Moderación de la foto: solo se permite quitarla (no reemplazarla) desde
  // el panel de admin. Hay que borrar el objeto de R2 antes de nulificar la
  // columna, para lo cual hace falta conocer su clave actual.
  let fotoKeyABorrar = null;
  if (body.quitar_foto === true) {
    const actual = await env.DB.prepare(`SELECT foto_key FROM pins WHERE id = ?`).bind(id).first();
    if (actual?.foto_key) fotoKeyABorrar = actual.foto_key;
    campos.push('foto_key = NULL');
  }

  if (campos.length === 0) {
    return json({ error: 'No hay nada que actualizar.' }, { status: 400 });
  }

  await env.DB.prepare(`UPDATE pins SET ${campos.join(', ')} WHERE id = ?`).bind(...valores, id).run();
  if (fotoKeyABorrar) await env.FOTOS.delete(fotoKeyABorrar);

  const actualizado = await env.DB.prepare(
    `SELECT id, nombre, comentario, lat, lng, tipo, pais, pais_code, foto_key,
            substr(ip_hash, 1, 8) AS ip_prefix, created_at
     FROM pins WHERE id = ?`
  ).bind(id).first();

  if (!actualizado) {
    return json({ error: 'No se ha encontrado ese pin.' }, { status: 404 });
  }
  return json(conFotoUrl(actualizado));
}

async function adminBorrarPin(request, env) {
  if (!autorizadoAdmin(request, env)) {
    return json({ error: 'No autorizado.' }, { status: 401 });
  }
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return json({ error: 'Id inválido.' }, { status: 400 });
  }
  const existente = await env.DB.prepare(`SELECT foto_key FROM pins WHERE id = ?`).bind(id).first();
  await env.DB.prepare(`DELETE FROM pins WHERE id = ?`).bind(id).run();
  if (existente?.foto_key) await env.FOTOS.delete(existente.foto_key);
  return json({ ok: true });
}

async function adminListarBackups(request, env) {
  if (!autorizadoAdmin(request, env)) {
    return json({ error: 'No autorizado.' }, { status: 401 });
  }
  return json(await listarBackups(env));
}

async function adminCrearBackup(request, env) {
  if (!autorizadoAdmin(request, env)) {
    return json({ error: 'No autorizado.' }, { status: 401 });
  }
  const archivo = (await respaldarPines(env)).slice('backups/'.length);
  return json({ ok: true, archivo });
}

async function adminDescargarBackup(request, pathname, env) {
  if (!autorizadoAdmin(request, env)) {
    return json({ error: 'No autorizado.' }, { status: 401 });
  }
  const archivo = decodeURIComponent(pathname.slice('/api/admin/backups/'.length));
  // El nombre no puede contener "/": evita que se use para leer cualquier
  // otra cosa del bucket (p. ej. subiendo "../pins/algo").
  if (!archivo || archivo.includes('/')) {
    return json({ error: 'Nombre de archivo inválido.' }, { status: 400 });
  }
  const objeto = await env.FOTOS.get(`backups/${archivo}`);
  if (!objeto) return json({ error: 'No encontrado.' }, { status: 404 });
  return new Response(objeto.body, {
    headers: {
      'content-type': 'application/json',
      'content-disposition': `attachment; filename="${archivo}"`,
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const { method } = request;

    if (pathname === '/api/pins') {
      if (method === 'GET') return getPins(env);
      if (method === 'POST') return postPin(request, env);
    }

    if (pathname === '/api/admin/pins') {
      if (method === 'GET') return adminListarPines(request, env);
      if (method === 'PATCH') return adminActualizarPin(request, env);
      if (method === 'DELETE') return adminBorrarPin(request, env);
    }

    if (pathname === '/api/admin/backups') {
      if (method === 'GET') return adminListarBackups(request, env);
      if (method === 'POST') return adminCrearBackup(request, env);
    }

    if (pathname.startsWith('/api/admin/backups/')) {
      if (method === 'GET') return adminDescargarBackup(request, pathname, env);
    }

    if (pathname.startsWith('/api/fotos/')) {
      if (method === 'GET') return getFoto(pathname, env);
    }

    if (pathname.startsWith('/api/')) {
      return json({ error: 'No encontrado.' }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },

  // Cron Trigger (ver "triggers.crons" en wrangler.jsonc): copia diaria de
  // seguridad de la tabla de pines, automática y sin intervención humana.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(respaldarPines(env));
  },
};
