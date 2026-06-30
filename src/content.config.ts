import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const puntos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/puntos' }),
  schema: z.object({
    nombre: z.string(),
    tipo: z.enum(['casa', 'calle', 'cuadro', 'edificio', 'servicio']),
    // Posición en el mapa, en % del lienzo: x = 0–100 (izq→der),
    // y = 0–100 (arriba→abajo). Ver MapaArcusa.astro.
    x: z.number().optional(),
    y: z.number().optional(),
    // lat/lng: legado, ya no se usa para posicionar (queda como dato).
    lat: z.number().optional(),
    lng: z.number().optional(),
    // Si es false, el punto no se muestra en el mapa del pueblo (p. ej. está en el entorno, no dentro).
    enMapa: z.boolean().default(true),
    resumen: z.string(),
    imagenes: z.array(z.string()).default([]),
    anio: z.string().optional(),
    autor: z.string().optional(),
    enlace: z.string().optional(),
    // Resumen rápido "En 30 segundos" (opcional)
    en30s: z.string().optional(),
    // Bloques informativos opcionales que se muestran al pie de la ficha
    bloques: z.array(z.object({
      tipo: z.enum(['sabias', 'tradicion', 'dato', 'mito', 'fijate', 'consejo', 'ninos']),
      titulo: z.string().optional(),
      texto: z.string().optional(),
      cuenta: z.string().optional(),   // solo tipo "mito"
      sabemos: z.string().optional(),  // solo tipo "mito"
    })).default([]),
  }),
});

const eventos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/eventos' }),
  schema: z.object({
    titulo: z.string(),
    fecha: z.string(),
    hora: z.string().optional(),
    lugar: z.string(),
    descripcion: z.string(),
    imagen: z.string().optional(),
    categoria: z.enum(['fiesta', 'cultura', 'mercado', 'actividad', 'museo']),
  }),
});

const lugares = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lugares' }),
  schema: z.object({
    nombre: z.string(),
    categoria: z.enum(['ver', 'comer', 'dormir', 'actividad']),
    descripcion: z.string(),
    imagen: z.string().optional(),
    distancia: z.string().optional(),
    contacto: z.string().optional(),
    enlace: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
});

export const collections = { puntos, eventos, lugares };
