// Fuente única de los datos del pueblo de Arcusa.
// Si un dato cambia (p. ej. el censo), cámbialo SOLO aquí: lo consumen
// la home (src/pages/index.astro) y el pie de página (src/components/Footer.astro),
// así nunca se desincronizan.
export const pueblo = {
  altitud: 869,                 // metros sobre el nivel del mar
  habitantes: 38,               // habitantes censados
  anioTorre: 'h. 1050',         // construcción de la torre defensiva
  murales: 36,                  // murales del museo al aire libre (se muestra "36+")
  valle: 'Valle del alto Vero',
  coords: '42°15′N · 0°09′E',
  comoLlegar: 'A-2205 desde Aínsa (~12 km)',
  email: 'avaltosobrarbe@gmail.com',
} as const;
