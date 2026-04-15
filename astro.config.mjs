// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://antonio-ante.gob.ec',
  output: 'server',
  adapter: cloudflare(),
  // Sharp no está disponible en Cloudflare Workers.
  // Este proyecto usa Sanity CDN para todas las imágenes — sin pérdida real.
  image: {
    service: { entrypoint: 'astro/assets/services/noop' },
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/api/') &&
        !page.includes('/admin') &&
        !page.includes('/preview'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es-EC' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
