const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — el cliente ya comprime antes de subir, esto es el tope de seguridad en servidor.

// Firmas binarias (magic bytes) de los formatos aceptados. No basta con mirar
// el Content-Type declarado por el navegador: cualquiera puede mandar un
// archivo con la extensión/tipo que quiera, así que se comprueban los
// primeros bytes reales del archivo.
const FIRMAS = [
  { tipo: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { tipo: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { tipo: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF" (WebP va dentro de un contenedor RIFF)
];

function detectaTipoReal(buffer) {
  const cabecera = new Uint8Array(buffer.slice(0, 4));
  for (const { tipo, bytes } of FIRMAS) {
    if (bytes.every((b, i) => cabecera[i] === b)) return tipo;
  }
  return null;
}

const EXTENSION = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/**
 * Valida un archivo de foto subido en el formulario y, si es válido,
 * devuelve su buffer, tipo real y una clave para guardarlo en R2.
 * Lanza un objeto { error } (no una excepción) para que el llamador pueda
 * devolver directamente una respuesta 400 sin try/catch adicional.
 */
export async function validarFoto(file) {
  if (!(file instanceof File)) return { error: 'Archivo de foto inválido.' };
  if (file.size === 0) return { error: 'La foto está vacía.' };
  if (file.size > MAX_BYTES) return { error: 'La foto pesa demasiado (máximo 5 MB).' };

  const buffer = await file.arrayBuffer();
  const tipoReal = detectaTipoReal(buffer);
  if (!tipoReal) {
    return { error: 'Formato de imagen no admitido. Usa JPG, PNG o WebP.' };
  }

  const clave = `pins/${crypto.randomUUID()}.${EXTENSION[tipoReal]}`;
  return { buffer, tipo: tipoReal, clave };
}
