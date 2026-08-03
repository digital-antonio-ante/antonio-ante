import { createClient } from '@sanity/client';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? 'production';

if (!projectId) {
  throw new Error(
    '[antonio-ante] Missing env var: PUBLIC_SANITY_PROJECT_ID\n' +
      'Copy .env.example → .env.local and set your Sanity project ID.'
  );
}

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-01',
  // Siempre contra la API en vivo, nunca `apicdn.sanity.io`.
  //
  // La mayoría del sitio es prerender: `/`, `/parroquias` y `/contacto` leen
  // Sanity UNA sola vez, durante `astro build`, y ese HTML vive hasta el
  // siguiente deploy. Leer por la CDN en ese momento significa hornear lo que
  // la caché tuviera entonces: el editor publica, se lanza el rebuild y el
  // sitio sale igual de viejo, sin ningún error que lo delate.
  //
  // El token NO evita esto: el cliente solo ignora `useCdn` en perspectivas de
  // draft, así que una query autenticada también va por la CDN.
  //
  // El coste es una lectura en vivo (~15 ms medidos) por build y por request
  // SSR de /eventos. Frente a servir contenido caducado, es gratis.
  useCdn: false,
  token: import.meta.env.SANITY_API_TOKEN,
});
