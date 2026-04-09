// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://antonio-ante.gob.ec',
  // 'server' + prerender:true por página reemplaza a 'hybrid' en Astro 6
  output: 'server',
  adapter: netlify(),
  integrations: [
    sitemap({
      // Excluir rutas privadas y API del sitemap
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
