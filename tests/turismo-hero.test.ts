// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NAV_ITEMS } from '@shared/config/nav';

/**
 * Dos defectos que el sitio tuvo y que ninguna herramienta automática avisaba:
 *
 * 1. El hero de Turismo pintaba el texto de acento con el MISMO token que la
 *    parada intermedia de su degradado (`text-brand-primary` sobre
 *    `via-brand-primary`): letra y fondo eran literalmente el mismo color.
 *    Lighthouse no lo veía porque solo audita la home.
 * 2. `/turismo` existía y estaba en el sitemap, pero no en el menú: solo se
 *    llegaba desde una ficha de parroquia.
 */

const turismo = readFileSync(resolve(process.cwd(), 'src/pages/turismo.astro'), 'utf8');

/** Tokens de marca que el degradado del hero usa como parada. */
function paradasDelDegradado(html: string): string[] {
  const clases = html.match(/bg-gradient-to-\w+[^"']*/)?.[0] ?? '';
  return [...clases.matchAll(/(?:from|via|to)-(brand-[\w-]+)/g)].map((m) => m[1]);
}

/** Tokens de marca usados como COLOR DE TEXTO dentro del hero. */
function coloresDeTexto(html: string): string[] {
  const hero = html.slice(0, html.indexOf('</section>'));
  return [...new Set([...hero.matchAll(/\btext-(brand-[\w-]+)/g)].map((m) => m[1]))];
}

describe('hero de Turismo', () => {
  it('ningún texto usa el mismo token que una parada del degradado de fondo', () => {
    const fondo = paradasDelDegradado(turismo);
    expect(fondo.length).toBeGreaterThan(0); // si cambia el markup, que falle aquí

    const colisiones = coloresDeTexto(turismo).filter((c) => fondo.includes(c));
    expect(colisiones).toEqual([]);
  });

  it('el texto de acento usa un tono claro, legible sobre fondo oscuro', () => {
    // Los tonos base (#277816, #005d1f, #003109) son oscuros: sobre este hero
    // solo sirven las variantes claras.
    for (const token of coloresDeTexto(turismo)) {
      expect(token, `${token} es un tono oscuro sobre fondo oscuro`).toMatch(/-(soft|faint|light)$/);
    }
  });
});

describe('navegación principal', () => {
  it('Turismo es alcanzable desde el menú, no solo desde el sitemap', () => {
    expect(NAV_ITEMS.map((i) => i.href)).toContain('/turismo');
  });
});
