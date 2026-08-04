// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { OBRAS_HABILITADAS } from './src/shared/config/features.ts';
import { SITE_URL } from './src/shared/config/site.ts';

export default defineConfig({
  site: SITE_URL,
  output: 'server',
  adapter: cloudflare(),
  // 'always': inyecta todo el CSS como <style> en el <head>. Medido contra este
  // sitio, inlinar es netamente superior a dejar hojas externas: evita 3 peticiones
  // de CSS render-blocking que, bajo el throttling de Lighthouse, disparaban el
  // FCP/LCP (móvil 71 vs 99, LCP 5.2 s vs 1.8 s). El CSS total es acotado.
  build: {
    inlineStylesheets: 'always',
  },
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
        !page.includes('/preview') &&
        (OBRAS_HABILITADAS || !page.includes('/obras')),
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
    build: {
      // Fuerza que los scripts de componente se emitan como archivos externos
      // (/_astro/*.js) en lugar de inline. Así la CSP los cubre con script-src
      // 'self' sin necesidad de hashes por-build, y no hay violaciones de CSP.
      assetsInlineLimit: 0,
    },
  },
});
