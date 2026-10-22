// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { PARISHES } from '@modules/canton/data/parishes';
import { POBLACION_CANTON, ALTITUD_CANTON_M, fmt } from '@shared/config/canton';

/**
 * El sitio llegó a decir tres poblaciones distintas para el mismo cantón
 * (~45k en el héroe, 47.882 en la banda, ~62.000 sumando las tarjetas) y dos
 * altitudes (2.406 y 2.360 m). Las cifras viven en `@shared/config/canton` y
 * las parroquias tienen que cuadrar con ellas.
 */
const ROOT = process.cwd();

function archivosDe(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return archivosDe(full);
    return /\.(astro|ts)$/.test(entry) ? [full] : [];
  });
}

describe('cifras del cantón', () => {
  it('la población del cantón es la suma de sus parroquias', () => {
    const suma = Object.values(PARISHES)
      .map((p) => Number((p.population ?? '').replace(/\D/g, '')))
      .reduce((a, b) => a + b, 0);
    expect(suma).toBe(POBLACION_CANTON);
  });

  it('las poblaciones de parroquia son cifras exactas, no aproximaciones', () => {
    for (const p of Object.values(PARISHES)) {
      expect(p.population, p.name).not.toMatch(/~/);
    }
  });

  it('la altitud del cantón es la de su cabecera, Atuntaqui', () => {
    expect(PARISHES.atuntaqui.altitude).toContain(fmt(ALTITUD_CANTON_M));
  });

  it('ninguna página repite a mano una cifra vieja del cantón', () => {
    const viejas = /~\s?45\s?k|2\.360 m|\b45k\b/;
    const fuente = resolve(ROOT, 'src/shared/config/canton.ts'); // cita las viejas al documentarlas
    const infractores = archivosDe(resolve(ROOT, 'src'))
      .filter((f) => f !== fuente && viejas.test(readFileSync(f, 'utf8')))
      .map((f) => relative(ROOT, f));
    expect(infractores).toEqual([]);
  });
});
