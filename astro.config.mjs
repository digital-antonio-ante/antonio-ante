// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { OBRAS_HABILITADAS } from './src/shared/config/features.ts';
import { SITE_URL } from './src/shared/config/site.ts';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

/**
 * Las fichas de evento son SSR: el sitemap solo descubre rutas estáticas, así
 * que sus URLs se piden a Sanity al construir. Cada publicación de un evento
 * dispara un build (webhook), así que la lista se mantiene al día. Si Sanity
 * no responde, el build sigue sin ellas en vez de fallar.
 */
/** @returns {Promise<string[]>} */
async function urlsDeEventos() {
  const projectId = env.PUBLIC_SANITY_PROJECT_ID;
  const dataset = env.PUBLIC_SANITY_DATASET ?? 'production';
  if (!projectId) return [];
  const query = encodeURIComponent('*[_type == "evento" && defined(slug.current)].slug.current');
  try {
    // API en vivo, nunca apicdn: el build que dispara el webhook debe ver el
    // evento recién publicado (mismo criterio que src/api/clients/sanity.ts).
    const res = await fetch(
      `https://${projectId}.api.sanity.io/v2025-01-01/data/query/${dataset}?query=${query}`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    /** @type {{ result?: string[] }} */
    const { result } = await res.json();
    return (result ?? []).map((slug) => `${SITE_URL}/eventos/${slug}/`);
  } catch (err) {
    console.warn('[sitemap] No se pudieron leer los eventos de Sanity:', String(err));
    return [];
  }
}

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
      customPages: await urlsDeEventos(),
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
