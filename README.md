# Web de Arcusa

Web del pueblo de Arcusa (Sobrarbe, Huesca, Aragón). Hecha por un vecino para poner en valor el pueblo, atraer visitantes de forma sostenible y luchar contra la despoblación.

**Stack:** Astro · Tailwind CSS v4 · Leaflet · Hosting estático gratuito

---

## Cómo arrancar el proyecto (para desarrolladores)

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo en http://localhost:4321
npm run dev

# Build de producción
npm run build

# Vista previa del build
npm run preview
```

---

## Cómo añadir contenido (para vecinos no técnicos)

Todo el contenido está en archivos de texto en la carpeta `src/content/`. No hace falta tocar ningún componente.

### Añadir un evento

Crea un archivo nuevo en `src/content/eventos/` con el nombre del evento (sin espacios, con guiones). Ejemplo: `src/content/eventos/mercado-de-verano-2025.md`

Contenido mínimo:

```markdown
---
titulo: Mercado de verano de Arcusa
fecha: "2025-07-20"
hora: "10:00"
lugar: Plaza Mayor
descripcion: Mercado de productos locales y artesanía.
categoria: mercado
---

Descripción ampliada del evento...
```

Categorías disponibles: `fiesta`, `cultura`, `mercado`, `actividad`, `museo`

### Añadir una casa o edificio al mapa

Crea un archivo en `src/content/puntos/`. Ejemplo: `src/content/puntos/casa-nueva.md`

```markdown
---
nombre: Casa Nueva
tipo: casa
lat: 42.2561
lng: 0.1580
resumen: Breve descripción que aparece en la tarjeta del mapa.
imagenes: []
anio: "s. XVII"
---

Historia larga de la casa...
```

Tipos disponibles: `casa`, `edificio`, `cuadro`, `servicio`, `calle`

**Importante:** Las coordenadas (`lat`/`lng`) son latitud y longitud GPS. Puedes obtenerlas haciendo clic derecho en Google Maps sobre el punto del pueblo → "¿Qué hay aquí?" y aparecen los números.

### Añadir un lugar (restaurante, qué ver, actividad)

Crea un archivo en `src/content/lugares/`. Ejemplo: `src/content/lugares/nuevo-bar.md`

```markdown
---
nombre: Bar de Arcusa
categoria: comer
descripcion: Descripción breve del lugar.
distancia: "En el pueblo"
contacto: "tel. 000 000 000"
enlace: "https://..."
---

Descripción ampliada...
```

Categorías: `ver`, `comer`, `dormir`, `actividad`

---

## Estructura de carpetas

```text
arcusa-web/
├── public/
│   ├── images/
│   │   ├── hero/          ← Las 4 imágenes PNG del parallax
│   │   └── placeholder/   ← Para fotos temporales
│   └── favicon.svg
├── src/
│   ├── components/        ← Componentes Astro reutilizables
│   ├── content/
│   │   ├── config.ts      ← Tipos de las colecciones
│   │   ├── puntos/        ← Casas, edificios, cuadros del mapa
│   │   ├── eventos/       ← Agenda del pueblo
│   │   └── lugares/       ← Qué ver, comer, dormir
│   ├── layouts/
│   │   └── Layout.astro   ← Layout base (HTML, meta, SEO)
│   ├── pages/             ← Páginas del sitio
│   └── styles/
│       └── global.css     ← Tokens de diseño (colores, tipografías)
└── astro.config.mjs
```

---

## Despliegue gratuito

### Opción recomendada: Netlify

1. Sube el proyecto a GitHub (o GitLab)
2. Ve a [netlify.com](https://netlify.com) → "Add new site" → "Import an existing project"
3. Conecta tu repositorio
4. Configuración de build:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Haz clic en "Deploy site"

Cada vez que hagas un push a la rama principal, la web se actualiza automáticamente.

### Alternativas

- **Vercel:** igual de sencillo, misma configuración
- **Cloudflare Pages:** muy rápido, también gratuito
- **GitHub Pages:** requiere ajustar `base` en `astro.config.mjs`

---

## Tokens de diseño (colores)

Los colores están centralizados en `src/styles/global.css` dentro del bloque `@theme`. Para cambiar la paleta, solo hay que modificar ese archivo.

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-pergamino` | `#F4EFE6` | Fondo principal |
| `--color-carbon` | `#2E2A24` | Texto principal |
| `--color-verde-pino` | `#3E5C3A` | Acentos, botones primarios |
| `--color-azul-pirineo` | `#5B7FA6` | Enlaces, acentos secundarios |
| `--color-piedra-media` | `#9C8567` | Texto secundario, bordes |

---

## Decisiones técnicas

**Mapa:** Se usa la opción (b) — mapa real con tiles de OpenStreetMap y marcadores georreferenciados. Permite navegación GPS real para visitantes y es actualizable sin diseño gráfico. Si en el futuro se quiere un mapa ilustrado dibujado del pueblo (opción a), habría que reemplazar el `tileLayer` de Leaflet por una imagen PNG con `L.CRS.Simple` y ajustar las coordenadas de los puntos.

**Coordenadas actuales:** son aproximadas. Necesitan verificarse con alguien que conozca el pueblo sobre el terreno.

**Framework:** Astro, ideal para sitios de contenido estático con buen SEO. El HTML se genera en build time; Leaflet es el único JS que se ejecuta en el navegador (solo en la página del mapa).

---

## Fotos pendientes de aportar

El sitio funciona con placeholders. Estas son las fotos que harán la web mucho más potente:

- [ ] **Hero/portada:** ya tiene las 4 capas PNG (Header1–4). ✓
- [ ] Foto de la Torre/Castillo medieval (exterior)
- [ ] Foto de la Iglesia de San Esteban (exterior e interior)
- [ ] Foto de Casa Juste (fachada completa)
- [ ] Foto de Casa Solano (detalle ventana con parteluz)
- [ ] Fotos de al menos 10 cuadros del museo (con título y ubicación)
- [ ] Foto del Hotel Tierra Buxo
- [ ] Foto del Restaurante El Fogón
- [ ] Panorámica del pueblo desde el sur (con el Pirineo al fondo)
- [ ] Foto del paisaje de la Sierra de Guara desde Arcusa
- [ ] Imagen Open Graph (`public/images/og-arcusa.jpg`, 1200×630px) para compartir en redes

Todas van a `public/images/` y se referencian en el campo `imagenes` o `imagen` de cada archivo de contenido.

---

## Siguientes pasos (fase de diseño visual)

1. **Afinar la paleta** con las fotos reales del pueblo — puede que haya que ajustar los tonos de verde o piedra
2. **Tipografía:** Playfair Display funciona bien pero se puede probar con IM Fell English o Cormorant Garamond para más carácter histórico
3. **Mapa ilustrado:** si se quiere el mapa dibujado del pueblo, es la mejora visual más impactante
4. **Decap CMS (opcional):** para que vecinos publiquen eventos desde una interfaz web sin tocar código. Ver [decapcms.org](https://decapcms.org) — con Netlify se configura en ~30 minutos
5. **i18n (inglés):** la arquitectura de Astro lo soporta con `i18n.locales`. Se puede añadir una ruta `/en/` sin reescribir componentes
6. **Schema.org ampliado:** añadir `Event` y `LodgingBusiness` en las páginas de eventos y hotel
7. **Galería de cuadros:** una página `/museo` dedicada con grid de obras cuando haya fotos suficientes
