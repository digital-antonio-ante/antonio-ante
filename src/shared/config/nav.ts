/**
 * nav.ts — Fuente única de verdad para los ítems de navegación principal.
 * Importado por Header.astro y Footer.astro.
 */

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly external?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Inicio' },
  { href: '/obras', label: 'Obras' },
  { href: '/parroquias', label: 'Parroquias' },
  { href: '/contacto', label: 'Contacto' },
  {
    href: 'https://www.antonioante.gob.ec/AntonioAnte/',
    label: 'Sitio Oficial',
    external: true,
  },
] as const;
