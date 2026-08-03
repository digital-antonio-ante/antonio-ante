// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { PARISHES } from '@modules/canton/data/parishes';

/**
 * Integridad de los assets de marca extraídos del manual del cantón.
 *
 * Estos SVG los consume el sitio por `import.meta.glob` (fichas de parroquia) y
 * por `?raw` (header/footer). Un archivo renombrado o ausente NO rompe el build:
 * la ficha cae al título de texto sin avisar. Este test es lo que convierte esa
 * degradación silenciosa en un fallo ruidoso.
 */

const MARCA = resolve(process.cwd(), 'public/marca');
const read = (p: string) => readFileSync(`${MARCA}/${p}`, 'utf8');

/** Gris neutro del descriptor (R≈G≈B, ni negro ni blanco). */
function isNeutralGray(hex: string): boolean {
  let h = hex.replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return Math.max(r, g, b) - Math.min(r, g, b) <= 8 && r >= 40 && r <= 200;
}

const fills = (svg: string) => [...svg.matchAll(/fill="(#[0-9a-fA-F]{3,6})"/g)].map((m) => m[1]);
/** Paths sin atributo fill = negro por defecto del SVG (el nombre de la parroquia). */
const pathsSinFill = (svg: string) =>
  [...svg.matchAll(/<path[^>]*>/g)].filter((m) => !m[0].includes('fill=')).length;

const SLUGS = Object.keys(PARISHES);

describe('assets de marca', () => {
  it('el manual cubre las 6 parroquias declaradas en PARISHES', () => {
    expect(SLUGS).toHaveLength(6);
  });

  it.each(SLUGS)('%s tiene lockup vertical y su versión en negativo', (slug) => {
    expect(existsSync(`${MARCA}/parroquias/${slug}-vertical.svg`)).toBe(true);
    expect(existsSync(`${MARCA}/parroquias/${slug}-vertical-negativo.svg`)).toBe(true);
  });

  it.each(SLUGS)('%s: el negativo conserva intactos los colores del isotipo', (slug) => {
    const orig = read(`parroquias/${slug}-vertical.svg`);
    const neg = read(`parroquias/${slug}-vertical-negativo.svg`);
    const marca = (svg: string) =>
      [...new Set(fills(svg).filter((c) => !isNeutralGray(c) && c.toLowerCase() !== '#fff'))].sort();

    // El negativo solo reescribe TEXTO: ni un color de marca puede haberse perdido.
    expect(marca(neg)).toEqual(marca(orig));
    expect(marca(orig).length).toBeGreaterThanOrEqual(6); // 6 piezas + la "A"
  });

  it.each(SLUGS)('%s: en el negativo no queda texto oscuro sobre el hero', (slug) => {
    const neg = read(`parroquias/${slug}-vertical-negativo.svg`);
    // El nombre iba sin fill (negro por defecto); en negativo debe ser explícito.
    expect(pathsSinFill(neg)).toBe(0);
    // Y el descriptor gris ya no puede seguir gris.
    expect(fills(neg).filter(isNeutralGray)).toEqual([]);
  });

  it('el isotipo suelto conserva la paleta completa', () => {
    const colores = new Set(fills(read('isotipo.svg')));
    expect(colores.size).toBeGreaterThanOrEqual(6);
  });

  it('todo SVG de marca declara viewBox (escalado por CSS y sin CLS)', () => {
    const todos = [
      ...readdirSync(MARCA).filter((f) => f.endsWith('.svg')),
      ...readdirSync(`${MARCA}/parroquias`).map((f) => `parroquias/${f}`),
    ];
    expect(todos.length).toBeGreaterThan(0);
    for (const f of todos) expect(read(f), f).toMatch(/viewBox="/);
  });
});
