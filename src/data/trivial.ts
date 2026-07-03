// Las 6 localizaciones físicas del trivial "Los secretos de Arcusa".
// Cada una tiene un QR in situ que enlaza a /visitantes/caza/[slug].
export interface LocalizacionTrivial {
  slug: string;
  nombre: string;
  pista: string;
  icon: string;
}

export const LOCALIZACIONES_TRIVIAL: LocalizacionTrivial[] = [
  {
    slug: 'torreon',
    nombre: 'El torreón',
    pista: 'Lleva casi mil años vigilando el valle desde lo más alto del pueblo.',
    icon: 'castle',
  },
  {
    slug: 'mural-pintor',
    nombre: 'Un mural del Rincón del Pintor',
    pista: 'Busca una fachada donde un oficio de siempre quedó pintado para no olvidarse.',
    icon: 'palette',
  },
  {
    slug: 'mirador-starlight',
    nombre: 'El mirador Starlight',
    pista: 'De día mira al valle; de noche, a las estrellas del Sobrarbe.',
    icon: 'telescope',
  },
  {
    slug: 'iglesia',
    nombre: 'La iglesia',
    pista: 'Sus campanas han marcado las horas del pueblo durante generaciones.',
    icon: 'church',
  },
  {
    slug: 'escudo-dintel',
    nombre: 'Un dintel con fecha',
    pista: 'Una piedra tallada guarda, en números, el año en que se levantó la casa.',
    icon: 'landmark',
  },
  {
    slug: 'sexto-secreto',
    nombre: 'El sexto secreto',
    pista: 'El último rincón, el que solo encuentran quienes ya han visto los otros cinco.',
    icon: 'sparkles',
  },
];

export const ALL_SLUGS = LOCALIZACIONES_TRIVIAL.map((l) => l.slug).sort();

// Frase compartida por cliente y backend para derivar el token del pin dorado.
// No es un secreto de verdad (viaja en el bundle del cliente): su único fin es
// que forjar el token desde la consola exija conocer los 6 slugs exactos.
export const FRASE_TRIVIAL = 'los-secretos-de-arcusa-2026';

export function payloadToken(slugsEncontrados: string[]): string {
  const set = new Set(slugsEncontrados.filter((s) => ALL_SLUGS.includes(s)));
  return `${FRASE_TRIVIAL}:${[...set].sort().join(',')}`;
}

export async function sha256Hex(texto: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function tokenParaEncontrados(slugsEncontrados: string[]): Promise<string> {
  return sha256Hex(payloadToken(slugsEncontrados));
}

export const TRIVIAL_STORAGE_KEY = 'arcusa-trivial-v1';

export interface EstadoTrivial {
  encontrados: string[];
}

export function leerEstadoTrivial(): EstadoTrivial {
  try {
    const raw = localStorage.getItem(TRIVIAL_STORAGE_KEY);
    if (!raw) return { encontrados: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.encontrados)) return { encontrados: [] };
    return { encontrados: parsed.encontrados.filter((s: unknown) => typeof s === 'string') };
  } catch {
    return { encontrados: [] };
  }
}

export function guardarEstadoTrivial(estado: EstadoTrivial) {
  localStorage.setItem(TRIVIAL_STORAGE_KEY, JSON.stringify(estado));
}
