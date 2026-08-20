// Filtro de lenguaje ofensivo para nombre/comentario. No pretende ser
// exhaustivo — ni detecta insultos que no estén en la lista, ni sustituye la
// moderación humana desde /visitantes/admin — pero corta los casos más
// evidentes, incluidos los trucos típicos para despistarlo: acentos,
// MAYÚSCULAS, separar las letras ("p u t o", "p.u.t.o"), leetspeak (p0ll4)
// y alargar letras (puuuuuto).
const PALABRAS_PROHIBIDAS = [
  // Insultos genéricos
  'gilipollas', 'gilipollez', 'imbecil', 'idiota', 'subnormal', 'retrasado',
  'estupido', 'inutil', 'capullo', 'cretino', 'memo', 'panoli', 'mongolo',
  'anormal',
  // Groserías / sexual
  'puta', 'puto', 'putas', 'putos', 'putada', 'putero', 'zorra', 'zorras',
  'guarra', 'guarro', 'polla', 'pollas', 'follar', 'follon', 'cono',
  'joder', 'mierda', 'cabron', 'cabrona', 'hijoputa', 'hijodeputa',
  // Insultos xenófobos/homófobos habituales
  'maricon', 'marica', 'bollera', 'sudaca', 'panchito',
  // Odio extremo
  'nazi', 'hitler',
  // Inglés (visitantes internacionales)
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'whore', 'slut',
  'nigger', 'nigga', 'faggot', 'retard',
  // Francés (turismo transfronterizo con los Pirineos)
  'connard', 'salope', 'pute', 'merde', 'batard',
];

// Cada tecla se sustituye por la letra que imita visualmente, para pillar
// leetspeak básico ("p0ll4" -> "polla") antes de comparar.
const SUSTITUCIONES_LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' };

function quitaAcentos(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Dos palabras que solo se diferencian por mayúsculas, leetspeak o alguna
// letra repetida de más deben normalizar al mismo resultado. Los acentos se
// quitan aparte, sobre el texto completo — ver el porqué en
// `contieneLenguajeProhibido`.
function normalizaPalabra(palabra) {
  const sinLeet = palabra.toLowerCase().replace(/[013457@$]/g, (c) => SUSTITUCIONES_LEET[c]);
  const soloLetras = sinLeet.replace(/[^a-z]/g, '');
  return soloLetras.replace(/(.)\1+/g, '$1'); // "puuuuuto" -> "puto"
}

const PROHIBIDAS = new Set(PALABRAS_PROHIBIDAS.map(normalizaPalabra));

// Además de la forma exacta, se prueba quitando una "s" o "es" final: así
// "putas" o "cabrones" coinciden con "puta"/"cabron" sin tener que listar
// cada plural a mano. Con un mínimo de longitud para no acortar palabras
// ya cortas de por sí hasta irreconocibles.
function formasCandidatas(palabra) {
  const candidatas = [palabra];
  if (palabra.length > 4 && palabra.endsWith('es')) candidatas.push(palabra.slice(0, -2));
  else if (palabra.length > 3 && palabra.endsWith('s')) candidatas.push(palabra.slice(0, -1));
  return candidatas;
}

// Junta letras sueltas separadas por espacios o puntuación ("p u t o",
// "p.u.t.o", "p-u-t-o") en una sola palabra antes de trocear el texto: si
// no, cada letra llegaría a la comparación como una "palabra" de una sola
// letra y el filtro no vería nada.
const PATRON_DISPERSO = /\b[a-z0-9](?:[\s.\-_*]+[a-z0-9]){2,}\b/gi;
function juntaLetrasDispersas(texto) {
  return texto.replace(PATRON_DISPERSO, (coincidencia) => coincidencia.replace(/[\s.\-_*]+/g, ''));
}

export function contieneLenguajeProhibido(...textos) {
  const texto = textos.filter(Boolean).join(' ');
  if (!texto) return false;

  // Los acentos se quitan ANTES de trocear en palabras: si se hiciera
  // después, `split` corta por cualquier carácter que no sea "a-zA-Z0-9" y
  // una tilde (é, í, ó…) cuenta como uno de esos separadores — "imbécil"
  // se habría partido en "imb" + "cil" y ninguna de las dos mitades
  // coincide con nada.
  const preparado = quitaAcentos(juntaLetrasDispersas(texto));

  // Se compara palabra a palabra (no la frase entera como una subcadena):
  // así "diputado" o "amputar" no se confunden con "puta", algo que sí
  // pasaba con la comparación por subcadena de la versión anterior.
  const palabras = preparado.split(/[^a-zA-Z0-9]+/);
  return palabras.some(
    (palabra) => palabra && formasCandidatas(normalizaPalabra(palabra)).some((c) => PROHIBIDAS.has(c))
  );
}
