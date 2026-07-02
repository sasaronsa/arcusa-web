// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://arcusa.es',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],
  adapter: cloudflare(),
});