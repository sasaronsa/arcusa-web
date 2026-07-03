import { hashIp } from './lib/hash.js';
import { contieneLenguajeProhibido } from './lib/moderation.js';
import { esTokenDoradoValido } from './lib/trivial.js';
import { paisDesdeCoordenadas } from './lib/geocode.js';

const MAX_NOMBRE = 30;
const MAX_COMENTARIO = 150;
const LIMITE_FRECUENCIA_MS = 3 * 24 * 60 * 60 * 1000; // 3 días

function json(data, init) {
  return Response.json(data, init);
}

async function getPins(env) {
  const { results } = await env.DB.prepare(
    `SELECT id, nombre, comentario, lat, lng, tipo, pais, pais_code, created_at
     FROM pins ORDER BY created_at DESC`
  ).all();
  return json(results ?? []);
}

async function postPin(request, env) {
  let body;
  try {
    body = await request.json();
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

  const ultimo = await env.DB.prepare(
    `SELECT created_at FROM pins WHERE ip_hash = ? ORDER BY created_at DESC LIMIT 1`
  ).bind(ipHash).first();

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

  const { pais, paisCode } = await paisDesdeCoordenadas(lat, lng);
  const createdAt = Date.now();

  const inserted = await env.DB.prepare(
    `INSERT INTO pins (nombre, comentario, lat, lng, tipo, pais, pais_code, ip_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id, nombre, comentario, lat, lng, tipo, pais, pais_code, created_at`
  ).bind(nombre, comentario || null, lat, lng, tipo, pais, paisCode, ipHash, createdAt).first();

  return json(inserted, { status: 201 });
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
    `SELECT id, nombre, comentario, lat, lng, tipo, pais, pais_code,
            substr(ip_hash, 1, 8) AS ip_prefix, created_at
     FROM pins ORDER BY created_at DESC`
  ).all();
  return json(results ?? []);
}

async function adminBorrarPin(request, env) {
  if (!autorizadoAdmin(request, env)) {
    return json({ error: 'No autorizado.' }, { status: 401 });
  }
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return json({ error: 'Id inválido.' }, { status: 400 });
  }
  await env.DB.prepare(`DELETE FROM pins WHERE id = ?`).bind(id).run();
  return json({ ok: true });
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
      if (method === 'DELETE') return adminBorrarPin(request, env);
    }

    if (pathname.startsWith('/api/')) {
      return json({ error: 'No encontrado.' }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
};
