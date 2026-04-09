import { defineMiddleware, sequence } from 'astro:middleware';

/**
 * Inyecta X-Robots-Tag: noindex en entornos no productivos.
 * Previene que crawlers indexen previews, staging o branches de Netlify.
 */
const robotsGuard = defineMiddleware(async (_, next) => {
  const appEnv = import.meta.env.APP_ENV;
  const isProduction = appEnv === 'production';

  // Netlify deploy previews exponen CONTEXT — doble protección
  const isNetlifyPreview =
    import.meta.env.CONTEXT === 'deploy-preview' || import.meta.env.CONTEXT === 'branch-deploy';

  const response = await next();

  if (!isProduction || isNetlifyPreview) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
});

/**
 * Elimina cabeceras que filtran información del servidor.
 */
const securityHardening = defineMiddleware(async (_, next) => {
  const response = await next();
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');
  return response;
});

export const onRequest = sequence(robotsGuard, securityHardening);
