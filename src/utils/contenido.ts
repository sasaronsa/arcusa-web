// Filtro único de borradores.
//
// Una ficha marcada con `borrador: true` en su frontmatter está a medias
// (normalmente esperando fotografía). Queremos poder verla y trabajarla con
// `astro dev`, pero que nunca llegue al sitio publicado.
//
// Úsalo SIEMPRE al leer la colección `puntos` para pintar algo de cara al
// público: así no hay forma de que un borrador se escape por una página nueva.
//
//   const cuadros = (await getCollection('puntos')).filter(esVisible);

/** true en `astro dev`, false en `astro build`. */
export const MOSTRAR_BORRADORES = import.meta.env.DEV;

interface ConBorrador {
  data: { borrador?: boolean };
}

/** Deja pasar la entrada salvo que sea un borrador y estemos construyendo para producción. */
export function esVisible(entrada: ConBorrador): boolean {
  return MOSTRAR_BORRADORES || entrada.data.borrador !== true;
}
