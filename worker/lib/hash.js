export async function sha256Hex(texto) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashIp(ip, salt) {
  return sha256Hex(`${salt}:${ip}`);
}
