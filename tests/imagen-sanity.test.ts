// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  anchosSinAmpliar,
  srcsetCompleta,
  srcsetRecorte,
  srcDeRespaldo,
} from '@shared/utils/imagen-sanity';

/**
 * El CDN de Sanity amplía si se le pide más ancho del que tiene el original:
 * el flyer de la Carrera (447×447) se pedía a 1600×700 y salía pixelado en
 * escritorio. Ningún candidato del srcset puede pasar del original.
 */
const BASE = 'https://cdn.sanity.io/images/p/d/abc-447x447.jpg';
const anchos = (srcset: string) =>
  srcset.split(', ').map((c) => Number(c.split(' ')[1].slice(0, -1)));

describe('imágenes de Sanity sin ampliar', () => {
  it('el srcset termina en el ancho original', () => {
    expect(anchosSinAmpliar(447)).toEqual([320, 447]);
    expect(anchosSinAmpliar(205)).toEqual([205]);
  });

  it('una imagen grande se corta en el máximo pedido', () => {
    expect(anchosSinAmpliar(2390, 960).at(-1)).toBe(960);
  });

  it('la imagen completa nunca supera su ancho', () => {
    const srcset = srcsetCompleta(BASE, { width: 447, height: 447 });
    expect(Math.max(...anchos(srcset))).toBe(447);
    expect(srcset).toContain('fit=max');
  });

  it('un recorte apaisado de un flyer cuadrado no pasa del ancho que da el original', () => {
    // 447 px de alto a proporción 2:1 darían 894 px de ancho: solo hay 447.
    const srcset = srcsetRecorte(BASE, 2, { width: 447, height: 447 }, { x: 0.3, y: 0.7 });
    expect(Math.max(...anchos(srcset))).toBeLessThanOrEqual(447);
    expect(srcset).toContain('fp-x=0.300');
    expect(srcset).toContain('fp-y=0.700');
  });

  it('el src de respaldo es el candidato más grande', () => {
    const srcset = srcsetCompleta(BASE, { width: 447, height: 447 });
    expect(srcDeRespaldo(srcset)).toContain('w=447');
  });
});
