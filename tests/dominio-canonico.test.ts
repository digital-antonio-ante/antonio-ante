// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { SITE_URL, ORIGENES_PERMITIDOS } from '@shared/config/site';

/**
 * El sitio se entrega bajo un dominio propio. Un origen ajeno escrito a mano en
 * un canonical, en el JSON-LD o en el `Sitemap:` de robots.txt no rompe el
 * build ni falla el validador de SEO —que solo comprueba que el canonical
 * EXISTA, no a dónde apunta—: simplemente le regala el posicionamiento a otro
 * dominio, en silencio y durante meses. Este test es el que hace ruido.
 */

const ROOT = process.cwd();

/** Cualquier origen http(s) que no sea el nuestro ni un enlace externo legítimo. */
const ORIGEN = /https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/gi;

/** Enlaces salientes deliberados: el portal institucional del GAD y servicios de terceros. */
const PERMITIDOS = [
  ...ORIGENES_PERMITIDOS, // los hostnames del propio worker, declarados en site.ts
  'https://www.antonioante.gob.ec', // enlace "Sitio Oficial" del nav
  'https://cdn.sanity.io',
  'https://api.sanity.io',
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://region1.google-analytics.com',
  'https://schema.org',
  'https://www.w3.org',
  'http://www.w3.org', // xmlns de los SVG — literal exigido por la especificación
  'https://maps.google.com',
  'https://facebook.com',
  'http://facebook.com',
  'https://www.facebook.com',
  'https://instagram.com',
  'https://www.instagram.com',
];

function archivosDe(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full, { throwIfNoEntry: false });
    if (!st) continue;
    if (st.isDirectory()) out.push(...archivosDe(full, exts));
    else if (exts.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

/** Orígenes citados en un archivo que no son ni el nuestro ni un externo permitido. */
function origenesAjenos(contenido: string): string[] {
  const encontrados = contenido.match(ORIGEN) ?? [];
  return [
    ...new Set(
      encontrados.filter(
        (o) => o !== SITE_URL && !PERMITIDOS.some((p) => o === p || o.startsWith(`${p}/`))
      )
    ),
  ];
}

describe('dominio canónico', () => {
  it('SITE_URL es un origen https sin barra final', () => {
    expect(SITE_URL).toMatch(/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/);
  });

  it('astro.config declara site = SITE_URL (de ahí salen canonical y sitemap)', () => {
    const cfg = readFileSync(resolve(ROOT, 'astro.config.mjs'), 'utf8');
    expect(cfg).toMatch(/site:\s*SITE_URL/);
  });

  it('el dominio de entrega es un origen aceptado por el formulario de contacto', () => {
    expect(ORIGENES_PERMITIDOS).toContain(SITE_URL);
  });

  it('el endpoint de contacto no mantiene su propia lista de orígenes', () => {
    const contact = readFileSync(resolve(ROOT, 'src/pages/api/contact.ts'), 'utf8');
    expect(contact).toMatch(/ALLOWED_ORIGINS[^=]*=\s*ORIGENES_PERMITIDOS/);
  });

  it('robots.txt apunta el sitemap a nuestro dominio', () => {
    const robots = readFileSync(resolve(ROOT, 'public/robots.txt'), 'utf8');
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap-index.xml`);
  });

  it('ningún archivo de src/ escribe a mano un origen que no sea el nuestro', () => {
    const fuentes = archivosDe(resolve(ROOT, 'src'), ['.astro', '.ts', '.tsx']);
    const infractores = fuentes
      .map((f) => ({ archivo: relative(ROOT, f), ajenos: origenesAjenos(readFileSync(f, 'utf8')) }))
      .filter((r) => r.ajenos.length > 0);

    expect(infractores).toEqual([]);
  });
});
