/**
 * nav.ts — Fuente única de verdad para los ítems de navegación principal.
 * Importado por Header.astro y Footer.astro.
 */

export interface NavItem {
  readonly href: string;
  readonly label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Inicio' },
  { href: '/noticias', label: 'Noticias' },
  { href: '/parroquias', label: 'Parroquias' },
  { href: '/documentos', label: 'Documentos' },
  { href: '/transparencia', label: 'Transparencia' },
  { href: '/contacto', label: 'Contacto' },
] as const;
