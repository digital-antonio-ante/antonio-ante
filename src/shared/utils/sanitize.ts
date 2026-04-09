/**
 * Sanitización de strings para prevenir XSS.
 * Trade-off: sin dependencia externa (DOMPurify requiere browser/jsdom en SSR).
 * Cubre entidades HTML fundamentales — suficiente para datos de formulario de contacto
 * que serán enviados por email/Sanity, nunca renderizados como HTML raw.
 */

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

export function escapeHtml(raw: string): string {
  return raw.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] ?? char);
}

/**
 * Sanitiza un objeto de strings recursivamente.
 * Trim + escape de entidades HTML + truncado de longitud máxima.
 */
export function sanitizeFormField(value: string, maxLength = 2000): string {
  return escapeHtml(value.trim().slice(0, maxLength));
}
