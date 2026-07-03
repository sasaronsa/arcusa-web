// Geocodificación inversa best-effort: si falla o no hay red, el pin se
// guarda igualmente sin país (no bloquea el POST).
export async function paisDesdeCoordenadas(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=3&accept-language=es`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'arcusa-web-visitantes/1.0 (avaltosobrarbe@gmail.com)' },
    });
    if (!res.ok) return { pais: null, paisCode: null };
    const data = await res.json();
    const pais = data?.address?.country ?? null;
    const paisCode = data?.address?.country_code ? String(data.address.country_code).toUpperCase() : null;
    return { pais, paisCode };
  } catch {
    return { pais: null, paisCode: null };
  }
}
