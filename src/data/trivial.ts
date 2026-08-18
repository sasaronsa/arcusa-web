// Las localizaciones físicas del trivial "Los secretos de Arcusa".
// Cada una tiene un QR in situ que enlaza a /visitantes/caza/[slug].
// `pista` va en modo adivinanza: describe el sitio sin nombrarlo, con
// frases sencillas para que sea accesible también para niños.
export interface LocalizacionTrivial {
  slug: string;
  nombre: string;
  pista: string;
  icon: string;
  // Foto del sitio, mostrada en su tarjeta una vez encontrado. Opcional:
  // sin foto todavía, la tarjeta cae al icono como marcador de posición.
  foto?: string;
}

export const LOCALIZACIONES_TRIVIAL: LocalizacionTrivial[] = [
  {
    slug: 'autobus',
    nombre: 'El medio de transporte de antes',
    pista: 'Antes de que casi todos tuvieran coche, esto traía y llevaba al pueblo entero.',
    icon: 'bus',
    foto: '/images/puntos/Museo/test1.webp',
  },
  {
    slug: 'herrero',
    nombre: 'El oficio del herrero',
    pista: 'A golpe de martillo y fuego, aquí se hacía antes lo que el pueblo necesitaba.',
    icon: 'hammer',
  },
  {
    slug: 'campana',
    nombre: 'El homenaje a la campana',
    pista: 'Hoy es un homenaje a quien marcaba las horas en el pueblo.',
    icon: 'bell',
  },
  {
    slug: 'bicicleta',
    nombre: 'Homenaje a las bicis que todos hemos usado',
    pista: 'Jóvenes y no tan jóvenes: casi todo el pueblo se ha movido alguna vez sobre este vehiculo.',
    icon: 'bike',
  },
];

export const ALL_SLUGS = LOCALIZACIONES_TRIVIAL.map((l) => l.slug).sort();

// Frase compartida por cliente y backend para derivar el token del pin dorado.
// No es un secreto de verdad (viaja en el bundle del cliente): su único fin es
// que forjar el token desde la consola exija conocer los slugs exactos.
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

export interface ResultadoHallazgo {
  estado: EstadoTrivial;
  yaEstaba: boolean;
  completadoAhora: boolean;
}

// Registra un slug como encontrado (si es válido) y devuelve el estado
// resultante. Usado tanto por la página /caza/[slug] como por el escáner
// QR en la propia página, para no duplicar la lógica en dos sitios.
export function marcarEncontrado(slug: string): ResultadoHallazgo {
  const estado = leerEstadoTrivial();
  const yaEstaba = estado.encontrados.includes(slug);
  const completoAntes = estado.encontrados.length >= ALL_SLUGS.length;
  if (!yaEstaba && ALL_SLUGS.includes(slug)) {
    estado.encontrados.push(slug);
    guardarEstadoTrivial(estado);
  }
  const completoAhora = estado.encontrados.length >= ALL_SLUGS.length;
  return { estado, yaEstaba, completadoAhora: completoAhora && !completoAntes };
}

// Extrae el slug de un código QR escaneado: puede contener la URL completa
// (lo que también abriría un lector de cámara normal) o el slug a secas.
export function extraerSlugDeQR(texto: string): string | null {
  const limpio = texto.trim();
  const candidato = limpio.includes('/') ? limpio.split('/').filter(Boolean).pop() ?? '' : limpio;
  return ALL_SLUGS.includes(candidato) ? candidato : null;
}

export const EVENTO_SECRETO_ENCONTRADO = 'arcusa:secreto-encontrado';
