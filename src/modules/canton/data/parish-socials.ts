/**
 * parish-socials.ts — Decide qué redes se ofrecen en la ficha de una parroquia.
 *
 * La mayoría de las parroquias todavía no tiene cuenta propia. Dejar el bloque
 * vacío hace que el visitante que quiere seguir a Chaltura no encuentre nada y
 * no sepa si la cuenta no existe o si el sitio está a medias; y presentar la
 * cuenta del Municipio como si fuera de la parroquia es atribuirle algo que no
 * es suyo. La salida correcta es la tercera: ofrecer el canal del Municipio,
 * diciendo que es de respaldo.
 *
 * Regla que sostiene todo esto: sólo cuenta como cuenta PROPIA de la parroquia
 * un enlace que (a) apunte de verdad al dominio de la red que dice ser y (b) no
 * sea la cuenta institucional del Municipio. Todo lo demás cae al respaldo, que
 * es una salida honesta; presentarlo como cuenta de la parroquia no lo es.
 */

import type { SocialRed } from '@api/endpoints/config-sitio';

export interface SocialLink {
  red: SocialRed['red'];
  url: string;
  /** @usuario, si se conoce */
  handle?: string | null;
}

export interface ParishSocials {
  /** Cuentas propias de la parroquia. Si hay alguna, es lo único que se muestra. */
  propias: readonly SocialLink[];
  /** Redes del Municipio, solo cuando la parroquia no tiene ninguna propia. */
  respaldo: readonly SocialLink[];
}

/**
 * Forma comparable de una URL: sin protocolo, sin `www.`, sin barra final y en
 * minúsculas. Así `https://www.facebook.com/X/` y `http://facebook.com/x` son
 * la misma cuenta, que es lo que hace falta para reconocer la institucional.
 */
function normalizeUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

/** Normaliza el @usuario a la forma que se pinta: con arroba y sin espacios. */
export function formatHandle(handle: string | null | undefined): string | null {
  const clean = handle?.trim().replace(/^@+/, '');
  return clean ? `@${clean}` : null;
}

/** Dominios legítimos de cada red. */
const HOSTS: Record<SocialLink['red'], readonly string[]> = {
  facebook: ['facebook.com', 'fb.com', 'fb.me'],
  instagram: ['instagram.com'],
  twitter: ['twitter.com', 'x.com'],
  youtube: ['youtube.com', 'youtu.be'],
  tiktok: ['tiktok.com'],
};

/**
 * ¿El enlace apunta de verdad a la red que declara?
 *
 * Existe porque en Sanity ha llegado a guardarse una URL de marcador de posición
 * (google.com) bajo la red «facebook». Un enlace así no es la cuenta de nadie:
 * mostrarlo como «las redes de la parroquia» manda al visitante a otro sitio y
 * quema la única vez que pulsó.
 */
export function isRealAccountUrl(link: SocialLink): boolean {
  const host = normalizeUrl(link.url).split('/')[0].split('?')[0];
  return HOSTS[link.red].some((d) => host === d || host.endsWith(`.${d}`));
}

export function resolveParishSocials(
  redesParroquia: readonly SocialLink[] | null | undefined,
  redesInstitucionales: readonly SocialLink[] | null | undefined
): ParishSocials {
  const institucionales = redesInstitucionales ?? [];
  const urlsInstitucionales = new Set(institucionales.map((r) => normalizeUrl(r.url)));

  const propias = (redesParroquia ?? []).filter(
    (r) => isRealAccountUrl(r) && !urlsInstitucionales.has(normalizeUrl(r.url))
  );

  return {
    propias,
    respaldo: propias.length > 0 ? [] : institucionales,
  };
}
