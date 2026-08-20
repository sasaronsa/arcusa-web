const PREFIJO = 'backups/';
const RETENCION = 90; // copias diarias a conservar; las más antiguas se autoborran.

// El nombre incluye la fecha (no una hora), así que como mucho hay una copia
// por día: si se pide una copia manual el mismo día, sobreescribe la de ese
// día en vez de acumular duplicados.
function claveDelDia(fecha) {
  return `${PREFIJO}pines-${fecha.toISOString().slice(0, 10)}.json`;
}

/**
 * Vuelca la tabla `pins` completa a un JSON en R2. Se guarda en el mismo
 * bucket que las fotos (bajo el prefijo "backups/") para no depender de
 * crear un segundo bucket — y esa ruta nunca se sirve en público porque
 * `getFoto` solo permite claves que empiecen por "pins/".
 */
export async function respaldarPines(env) {
  const { results } = await env.DB.prepare(
    `SELECT id, nombre, comentario, lat, lng, tipo, pais, pais_code, foto_key, ip_hash, created_at
     FROM pins ORDER BY id`
  ).all();

  const clave = claveDelDia(new Date());
  const contenido = JSON.stringify(
    { generado_en: Date.now(), total: results?.length ?? 0, pines: results ?? [] },
    null,
    2
  );

  await env.FOTOS.put(clave, contenido, { httpMetadata: { contentType: 'application/json' } });
  await limpiarBackupsAntiguos(env);
  return clave;
}

async function limpiarBackupsAntiguos(env) {
  const { objects } = await env.FOTOS.list({ prefix: PREFIJO });
  // Los nombres de archivo son "pines-YYYY-MM-DD.json": ordenan igual
  // alfabética que cronológicamente, no hace falta parsear fechas.
  const claves = objects.map((o) => o.key).sort();
  const sobrantes = claves.slice(0, Math.max(0, claves.length - RETENCION));
  await Promise.all(sobrantes.map((clave) => env.FOTOS.delete(clave)));
}

/** Lista las copias disponibles, más reciente primero. */
export async function listarBackups(env) {
  const { objects } = await env.FOTOS.list({ prefix: PREFIJO });
  return objects
    .map((o) => ({ archivo: o.key.slice(PREFIJO.length), tamano: o.size, subido_en: o.uploaded }))
    .sort((a, b) => b.archivo.localeCompare(a.archivo));
}
