// Lista básica de palabras prohibidas (minúsculas, sin acentos).
// No pretende ser exhaustiva: solo filtra los casos más evidentes.
const PALABRAS_PROHIBIDAS = [
  'gilipollas', 'imbecil', 'idiota', 'subnormal', 'retrasado',
  'puta', 'puto', 'zorra', 'maricon', 'marica',
  'mierda', 'cabron', 'cabrona', 'joder', 'coño',
  'polla', 'pollas', 'follar', 'follon',
  'nazi', 'hitler',
  'fuck', 'shit', 'bitch', 'asshole', 'nigger', 'faggot',
];

function normaliza(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function contieneLenguajeProhibido(...textos) {
  const junto = normaliza(textos.filter(Boolean).join(' '));
  return PALABRAS_PROHIBIDAS.some((palabra) => junto.includes(palabra));
}
