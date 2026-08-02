/**
 * nav.ts — Fuente única de verdad para los ítems de navegación principal.
 * Importado por Header.astro y Footer.astro.
 */

import { OBRAS_HABILITADAS } from './features';

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly external?: boolean;
}

const ALL_NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Inicio' },
  { href: '/obras', label: 'Obras' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/parroquias', label: 'Parroquias' },
  { href: '/contacto', label: 'Contacto' },
  {
    href: 'https://www.antonioante.gob.ec/AntonioAnte/',
    label: 'Sitio Oficial',
    external: true,
  },
] as const;

export const NAV_ITEMS: readonly NavItem[] = OBRAS_HABILITADAS
  ? ALL_NAV_ITEMS
  : ALL_NAV_ITEMS.filter((item) => item.href !== '/obras');
