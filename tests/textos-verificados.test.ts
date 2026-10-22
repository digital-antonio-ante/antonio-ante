// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PARISHES } from '@modules/canton/data/parishes';

/**
 * El sitio prometía cosas que nadie respalda: pesca deportiva en Imbaya, un
 * «Mercado Artesanal» que no existe, un festival de Natabuela sin rastro, una
 * tradición musical de San Roque y +85.000 visitantes en la Expo. Un turista
 * que viene por eso y no lo encuentra no vuelve. Los textos salen de fuentes
 * públicas (ver `parishes.ts`); estas frases no deben volver.
 */
const ROOT = process.cwd();

function archivosDe(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return archivosDe(full);
    return /\.(astro|ts)$/.test(entry) ? [full] : [];
  });
}

const SIN_RESPALDO = [
  /pesca deportiva/i,
  /mercado artesanal/i,
  /confraternidad/i,
  /capital mundial/i,
  /reconocida mundialmente/i,
  /parroquia más extensa/i,
  /\+85k/i,
  /tradición musical/i,
];

describe('textos del sitio con respaldo', () => {
  it('ninguna página afirma atractivos sin fuente', () => {
    const hallazgos = archivosDe(join(ROOT, 'src')).flatMap((archivo) => {
      const texto = readFileSync(archivo, 'utf8');
      return SIN_RESPALDO.filter((re) => re.test(texto)).map(
        (re) => `${relative(ROOT, archivo)}: ${re}`
      );
    });
    expect(hallazgos).toEqual([]);
  });

  it('cada parroquia ofrece al menos tres planes concretos', () => {
    for (const p of Object.values(PARISHES)) {
      expect(p.planes.length, p.name).toBeGreaterThanOrEqual(3);
    }
  });

  it('la descripción de cada parroquia cabe en el resultado de Google', () => {
    for (const p of Object.values(PARISHES)) {
      expect(p.description.length, p.name).toBeLessThanOrEqual(160);
    }
  });
});
