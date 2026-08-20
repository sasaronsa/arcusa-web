// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://arcusa.es',
  vite: {
    plugins: [tailwindcss()],
    server: {
      // `astro dev` no sabe nada de /api/* (eso lo sirve el Worker de
      // Cloudflare, no Astro) — en local se reenvía a una instancia de
      // `wrangler dev` aparte (ver README) para poder probar el formulario
      // de visitantes con recarga en caliente en el resto del sitio.
      proxy: {
        '/api': 'http://127.0.0.1:8787',
      },
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/visitantes/admin') && !page.includes('/visitantes/caza/'),
    }),
  ],
});
