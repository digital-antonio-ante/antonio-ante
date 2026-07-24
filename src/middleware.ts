import { defineMiddleware, sequence } from 'astro:middleware';

/**
 * Inyecta X-Robots-Tag: noindex en entornos no productivos.
 * Previene que crawlers indexen previews, staging o branches de Netlify.
 */
const robotsGuard = defineMiddleware(async (_, next) => {
  // En un build de producción (`astro build`) el sitio es público e indexable.
  // Solo se marca noindex en desarrollo (`astro dev`, donde PROD es false) o si se
  // declara explícitamente un entorno no público con APP_ENV=staging|preview.
  const appEnv = import.meta.env.APP_ENV;
  const isPublic = import.meta.env.PROD && appEnv !== 'staging' && appEnv !== 'preview';

  const response = await next();

  if (!isPublic) {
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
