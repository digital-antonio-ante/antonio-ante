// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Contrato de frescura del contenido.
 *
 * El sitio es mayoritariamente prerender: `/`, `/parroquias` y `/contacto` leen
 * Sanity una única vez, durante `astro build`. Si esa lectura va por la CDN de
 * Sanity (`useCdn: true`), el build hornea lo que la caché tuviera en ese
 * instante — el editor publica, el rebuild se ejecuta y el sitio sigue viejo,
 * sin error, sin log, sin nada que lo delate.
 *
 * Es una regresión invisible: no rompe el build ni ninguna página. Este test es
 * lo único que la convierte en un fallo ruidoso.
 */

const CLIENT = resolve(process.cwd(), 'src/api/clients/sanity.ts');

/** Fuente sin comentarios — el motivo del fix se explica en un comentario que
 *  menciona `useCdn`, y no debe contar como si fuera configuración. */
function codeWithoutComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

describe('cliente de Sanity', () => {
  const code = codeWithoutComments(readFileSync(CLIENT, 'utf8'));

  it('lee siempre en vivo: useCdn es literalmente false', () => {
    const match = code.match(/useCdn\s*:\s*([^,\n]+)/);
    expect(match, 'no se encontró la opción useCdn en el cliente').not.toBeNull();
    expect(match?.[1].trim()).toBe('false');
  });

  it('no condiciona la frescura al entorno', () => {
    // `useCdn: import.meta.env.PROD` era el bug: en dev iba en vivo y en el
    // build de producción —el único que hornea HTML— iba por caché.
    const match = code.match(/useCdn\s*:\s*([^,\n]+)/);
    expect(match?.[1]).not.toMatch(/import\.meta\.env|process\.env|PROD|DEV/);
  });
});
