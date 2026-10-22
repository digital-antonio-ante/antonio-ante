// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PREFIJO_ID_MENSAJE } from '@shared/config/mensajes';

/**
 * El dataset `production` de Sanity es de lectura pública: el sitio lo consulta
 * sin token. Los mensajes del formulario se guardaban con un _id aleatorio y
 * cualquiera podía leer nombre, correo y teléfono de quien escribió. Sanity
 * solo oculta a lectores anónimos los _id que están en una ruta (con punto).
 */
const contact = readFileSync(resolve(process.cwd(), 'src/pages/api/contact.ts'), 'utf8');

describe('mensajes de contacto fuera del alcance público', () => {
  it('el prefijo pone el documento en una ruta (lleva punto)', () => {
    expect(PREFIJO_ID_MENSAJE).toMatch(/^[a-z]+\.$/);
  });

  it('el endpoint crea cada mensaje con un _id bajo ese prefijo', () => {
    expect(contact).toMatch(/_id:\s*`\$\{PREFIJO_ID_MENSAJE\}/);
  });
});
