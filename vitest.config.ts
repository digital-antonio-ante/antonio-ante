/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Vitest configuration for antonio-ante — YAPI Astro standards.
//
// NO se usa getViteConfig() de astro/config: heredaría el plugin de Cloudflare,
// que rechaza el `resolve.external` que Astro inyecta para el entorno SSR y hace
// que vitest muera al arrancar ("incompatible with the Cloudflare Vite plugin").
// Los tests unitarios no necesitan el grafo de módulos del worker: basta con los
// alias de tsconfig.json, replicados abajo.
const alias = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@ui': alias('./src/shared/ui'),
      '@shared': alias('./src/shared'),
      '@modules': alias('./src/modules'),
      '@api': alias('./src/api'),
      '@lib': alias('./src/lib'),
      '@styles': alias('./src/styles'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.astro', 'studio'],
    passWithNoTests: true,
  },
});
