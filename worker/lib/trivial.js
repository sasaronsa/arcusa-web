import { sha256Hex } from './hash.js';

// Debe coincidir exactamente con src/data/trivial.ts (mismos slugs y frase).
const ALL_SLUGS = [
  'escudo-dintel',
  'iglesia',
  'mirador-starlight',
  'mural-pintor',
  'sexto-secreto',
  'torreon',
].sort();

const FRASE_TRIVIAL = 'los-secretos-de-arcusa-2026';

async function tokenEsperado() {
  const payload = `${FRASE_TRIVIAL}:${ALL_SLUGS.join(',')}`;
  return sha256Hex(payload);
}

export async function esTokenDoradoValido(token) {
  if (!token || typeof token !== 'string') return false;
  const esperado = await tokenEsperado();
  return token === esperado;
}
