/**
 * canton.ts — Cifras del cantón. Fuente única de verdad.
 *
 * Antes cada página escribía las suyas y se contradecían (~45k / 47.882
 * habitantes, 2.360 / 2.406 m). La población es la suma de las fichas de
 * parroquia (Censo 2022 — INEC); `tests/cifras-canton.test.ts` lo vigila.
 */

/** Habitantes del cantón — suma de las seis parroquias. */
export const POBLACION_CANTON = 47_882;

/** Altitud de referencia: la de Atuntaqui, cabecera cantonal. */
export const ALTITUD_CANTON_M = 2_406;

/** Superficie oficial del cantón. */
export const SUPERFICIE_CANTON_KM2 = 79;

const formato = new Intl.NumberFormat('es-EC');

/** Número con separador de miles del español de Ecuador ("47.882"). */
export const fmt = (n: number): string => formato.format(n);
