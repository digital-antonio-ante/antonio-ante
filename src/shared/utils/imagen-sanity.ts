/**
 * imagen-sanity.ts — URLs del CDN de Sanity que nunca amplían la imagen.
 *
 * El CDN SÍ amplía si se le pide más ancho del que tiene el original: un flyer
 * de 447 px pedido con `w=1600&fit=crop` llega como 1600 px borrosos. Por eso
 * los srcset se recortan al ancho original.
 */

export interface Dimensiones {
  width: number;
  height: number;
}

export interface PuntoFocal {
  x: number;
  y: number;
}

const ANCHOS = [320, 480, 640, 800, 960, 1280, 1600];

/** Anchos para un srcset, sin pasar del original (ni de `maximo`). */
export function anchosSinAmpliar(original: number | undefined, maximo = 1600): number[] {
  const tope = Math.min(original ?? maximo, maximo);
  return [...new Set([...ANCHOS.filter((w) => w < tope), tope])];
}

export function urlSanity(base: string, params: Record<string, string | number>): string {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  return `${base}?${qs}`;
}

/** srcset de la imagen completa (fit=max: escala sin recortar ni ampliar). */
export function srcsetCompleta(base: string, dims?: Dimensiones | null, maximo = 1600): string {
  return anchosSinAmpliar(dims?.width, maximo)
    .map((w) => `${urlSanity(base, { w, fit: 'max', auto: 'format', q: 82 })} ${w}w`)
    .join(', ');
}

/** srcset recortado a `proporcion` (ancho/alto) alrededor del punto focal. */
export function srcsetRecorte(
  base: string,
  proporcion: number,
  dims?: Dimensiones | null,
  foco?: PuntoFocal | null,
  maximo = 1600
): string {
  // El recorte ocupa todo el ancho solo si la imagen es más apaisada que el hueco.
  const anchoUtil = dims ? Math.min(dims.width, dims.height * proporcion) : undefined;
  return anchosSinAmpliar(anchoUtil && Math.floor(anchoUtil), maximo)
    .map((w) => {
      const params = {
        w,
        h: Math.round(w / proporcion),
        fit: 'crop',
        'fp-x': (foco?.x ?? 0.5).toFixed(3),
        'fp-y': (foco?.y ?? 0.5).toFixed(3),
        auto: 'format',
        q: 82,
      };
      return `${urlSanity(base, params)} ${w}w`;
    })
    .join(', ');
}

/** Versión diminuta y desenfocada, para usar de fondo detrás de un flyer. */
export function urlFondoDifuso(base: string): string {
  return urlSanity(base, { w: 64, blur: 40, auto: 'format', q: 60 });
}

/** El candidato más grande de un srcset, como `src` de respaldo. */
export function srcDeRespaldo(srcset: string): string {
  return srcset.split(', ').at(-1)?.split(' ')[0] ?? '';
}
