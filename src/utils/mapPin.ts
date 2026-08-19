import L from 'leaflet';

// Chincheta dibujada en SVG, no en PNG. Con una imagen rasterizada, el
// navegador tiene que reescalarla (p. ej. de 48×48 a 30×30) y ese
// reescalado difumina el borde real 1-2px — poco al alejar el mapa, pero
// muy visible al hacer zoom, que es justo cuando más importa que la base
// caiga exacta en el sitio. Con SVG el ancla es una coordenada exacta del
// propio dibujo: no hay interpolación posible, así que la base marca el
// lugar igual de fino a cualquier tamaño.
const ANCHO = 24;
const ALTO = 34;
const CX = ANCHO / 2;
const RADIO = 9;
const CY = RADIO + 1;
const AGUJA_ANCHO = 4;
const AGUJA_Y = CY + RADIO - 3;

function svgChincheta(color: string): string {
  return `
    <svg width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${CX - AGUJA_ANCHO / 2}" y="${AGUJA_Y}" width="${AGUJA_ANCHO}" height="${ALTO - AGUJA_Y}" rx="${AGUJA_ANCHO / 2}" fill="${color}" />
      <circle cx="${CX}" cy="${CY}" r="${RADIO}" fill="${color}" stroke="rgba(0,0,0,0.2)" stroke-width="1" />
      <ellipse cx="${CX - 3}" cy="${CY - 3.5}" rx="3.2" ry="2.2" fill="rgba(255,255,255,0.45)" />
    </svg>
  `.trim();
}

/**
 * Icono de chincheta para Leaflet. `iconAnchor` apunta exactamente a la base
 * de la aguja (no al centro de la bola): es el punto que debe caer sobre
 * la coordenada real, como si estuviera clavada en el mapa.
 */
export function chinchetaIcon(color: string, className: string): L.DivIcon {
  return L.divIcon({
    className: `chincheta-icon ${className}`,
    html: svgChincheta(color),
    iconSize: [ANCHO, ALTO],
    iconAnchor: [CX, ALTO],
    popupAnchor: [0, -ALTO],
  });
}
