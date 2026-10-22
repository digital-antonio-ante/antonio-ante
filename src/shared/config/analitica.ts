/**
 * analitica.ts — ¿Carga el sitio Google Analytics 4? Fuente única de verdad.
 *
 * La consumen BaseLayout (inyecta gtag) y la política de privacidad (declara o
 * no la analítica y sus cookies). GA4 se activa con una variable de entorno de
 * build, sin pasar por un PR: si cada página evaluara su propia condición, la
 * política podría negar unas cookies que el sitio sí instala.
 */
export const GA4_ID: string | undefined = import.meta.env.PROD
  ? import.meta.env.PUBLIC_GA4_ID || undefined
  : undefined;
