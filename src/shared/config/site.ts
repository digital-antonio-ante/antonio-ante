/**
 * site.ts — Origen público del sitio. Fuente única de verdad.
 *
 * Lo consumen `astro.config.mjs` (site → canonical + sitemap), SEOHead,
 * las páginas que arman URLs absolutas para JSON-LD y el endpoint de contacto.
 * Cambiar de dominio es cambiar estas líneas.
 */

/** Dominio de entrega. De aquí salen canonical, sitemap y las URL absolutas. */
export const SITE_URL = 'https://conoceantonioante.com';

/**
 * Otros hostnames en los que responde EL MISMO worker. No son canónicos —no
 * aparecen en sitemap ni canonical— pero el chequeo de origen del formulario
 * de contacto debe aceptarlos: si no, quien entre por la URL de Cloudflare
 * recibe un 403 al enviar, sin más pista que un error genérico.
 */
export const ORIGENES_ALTERNOS = ['https://portal.digital-antonioante.workers.dev'] as const;

/** Orígenes que el endpoint de contacto acepta como propios (anti-CSRF). */
export const ORIGENES_PERMITIDOS = [SITE_URL, ...ORIGENES_ALTERNOS] as const;
