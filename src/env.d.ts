/// <reference types="astro/client" />

// Runtime del Worker de Cloudflare (Astro v6). `env` expone las variables y
// secrets configurados en Cloudflare (p. ej. SANITY_API_TOKEN).
declare module 'cloudflare:workers' {
  export const env: Record<string, string | undefined>;
}
