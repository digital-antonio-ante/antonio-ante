// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  CATEGORIAS_EVENTO,
  CATEGORIAS_OBRA,
  ESTADOS_OBRA,
  categoriaEvento,
  categoriaObra,
} from '@shared/config/categorias';

/**
 * Sistema de color: tokens en lugar de hex crudos.
 *
 * Estos tests existen porque el gate de Semgrep que vigila esto es una regla
 * externa (yapi-web-ai-default-palette) que se puede saltar con
 * YAPI_PREMERGE_OK=1 — y se saltó ocho veces seguidas. Un test dentro del repo
 * no se salta: falla en `npm run ci` y en el gate `vitest`, que es BLOCKER.
 *
 * Cubren tres contratos:
 *   1. Ningún componente .astro contiene un hex de la paleta por defecto de
 *      Tailwind (los grises y morados que delatan una UI generada).
 *   2. Los metadatos de categoría apuntan a tokens, nunca a un hex literal.
 *   3. Cada par texto/fondo de la paleta categórica cumple WCAG AA (≥ 4.5:1),
 *      calculado sobre los valores REALES de global.css — no sobre una copia.
 */

const ROOT = resolve(process.cwd());
const GLOBAL_CSS = readFileSync(resolve(ROOT, 'src/styles/global.css'), 'utf8');

// ── Paleta por defecto de Tailwind: los hex que no deben aparecer en componentes.
// Familias neutras (gray/slate/zinc/neutral/stone) y moradas
// (purple/violet/indigo/fuchsia), tonos 50→950. Misma lista que usa el gate.
const TAILWIND_DEFAULT_HEXES = new Set(
  `f9fafb f3f4f6 e5e7eb d1d5db 9ca3af 6b7280 4b5563 374151 1f2937 111827 030712
   f8fafc f1f5f9 e2e8f0 cbd5e1 94a3b8 64748b 475569 334155 1e293b 0f172a 020617
   fafafa f4f4f5 e4e4e7 d4d4d8 a1a1aa 71717a 52525b 3f3f46 27272a 18181b 09090b
   f5f5f5 e5e5e5 d4d4d4 a3a3a3 737373 525252 404040 262626 171717 0a0a0a
   fafaf9 f5f5f4 e7e5e4 d6d3d1 a8a29e 78716c 57534e 44403c 292524 1c1917 0c0a09
   faf5ff f3e8ff e9d5ff d8b4fe c084fc a855f7 9333ea 7e22ce 6b21a8 581c87 3b0764
   f5f3ff ede9fe ddd6fe c4b5fd a78bfa 8b5cf6 7c3aed 6d28d9 5b21b6 4c1d95 2e1065
   eef2ff e0e7ff c7d2fe a5b4fc 818cf8 6366f1 4f46e5 4338ca 3730a3 312e81 1e1b4b
   fdf4ff fae8ff f5d0fe f0abfc e879f9 d946ef c026d3 a21caf 86198f 701a75 4a044e`
    .split(/\s+/)
    .filter(Boolean),
);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(astro|tsx|jsx|vue|svelte)$/.test(entry)) out.push(full);
  }
  return out;
}

// ── Contraste WCAG 2.1 ────────────────────────────────────────────────────────
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => srgbToLinear(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Resuelve un token `--color-x` a su hex final leyendo global.css, siguiendo las
 * cadenas `var(--otro)`. Si el token no resuelve a un hex, devuelve null — así
 * un token mal escrito falla el test en vez de pasar en vacío.
 */
function resolveToken(name: string, depth = 0): string | null {
  if (depth > 10) return null;
  const m = new RegExp(`--${name}\\s*:\\s*([^;]+);`).exec(GLOBAL_CSS);
  if (!m) return null;
  const value = m[1].trim();
  const hex = /^#[0-9a-fA-F]{6}$/.exec(value);
  if (hex) return value.toLowerCase();
  const ref = /^var\(\s*--([a-z0-9-]+)\s*\)$/i.exec(value);
  return ref ? resolveToken(ref[1], depth + 1) : null;
}

/** `var(--color-tag-azul)` → `color-tag-azul`. */
function tokenName(cssValue: string): string | null {
  return /^var\(\s*--([a-z0-9-]+)\s*\)$/i.exec(cssValue)?.[1] ?? null;
}

describe('paleta por defecto de Tailwind fuera de los componentes', () => {
  const files = walk(resolve(ROOT, 'src'));

  it('encuentra componentes que analizar (no pasa en vacío)', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('ningún componente contiene un hex de la paleta por defecto', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      for (const match of src.matchAll(/#([0-9a-fA-F]{6})\b/g)) {
        if (TAILWIND_DEFAULT_HEXES.has(match[1].toLowerCase())) {
          const line = src.slice(0, match.index).split('\n').length;
          offenders.push(`${file.replace(ROOT + '/', '')}:${line} → #${match[1]}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('metadatos de categoría', () => {
  const todos = [
    ...Object.entries(CATEGORIAS_EVENTO).map(([k, v]) => [`evento.${k}`, v] as const),
    ...Object.entries(CATEGORIAS_OBRA).map(([k, v]) => [`obra.${k}`, v] as const),
  ];

  it('cubre las categorías de eventos y obras', () => {
    expect(Object.keys(CATEGORIAS_EVENTO)).toHaveLength(6);
    expect(Object.keys(CATEGORIAS_OBRA)).toHaveLength(7);
    expect(Object.keys(ESTADOS_OBRA)).toHaveLength(3);
  });

  it.each(todos)('%s usa tokens, no hex literales', (_name, meta) => {
    expect(meta.color).toMatch(/^var\(--color-/);
    expect(meta.bg).toMatch(/^var\(--color-/);
  });

  it.each(Object.entries(ESTADOS_OBRA))('estado %s usa tokens', (_name, estado) => {
    expect(estado.color).toMatch(/^var\(--color-/);
    expect(estado.dot).toMatch(/^var\(--color-/);
  });

  it('cada token de categoría resuelve a un hex real en global.css', () => {
    for (const [name, meta] of todos) {
      for (const field of ['color', 'bg'] as const) {
        const token = tokenName(meta[field]);
        expect(token, `${name}.${field} no es un var()`).not.toBeNull();
        expect(resolveToken(token!), `${name}.${field} → --${token} no resuelve`).toMatch(
          /^#[0-9a-f]{6}$/,
        );
      }
    }
  });

  it('cada par texto/fondo cumple WCAG AA (≥ 4.5:1)', () => {
    for (const [name, meta] of todos) {
      const fg = resolveToken(tokenName(meta.color)!)!;
      const bg = resolveToken(tokenName(meta.bg)!)!;
      const ratio = contrastRatio(fg, bg);
      expect(ratio, `${name}: ${fg} sobre ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  it('el texto de categoría también cumple AA sobre blanco', () => {
    for (const [name, meta] of todos) {
      const fg = resolveToken(tokenName(meta.color)!)!;
      const ratio = contrastRatio(fg, '#ffffff');
      expect(ratio, `${name}: ${fg} sobre blanco = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  it('las categorías no repiten ranura de color dentro del mismo dominio', () => {
    for (const grupo of [CATEGORIAS_EVENTO, CATEGORIAS_OBRA]) {
      const colores = Object.values(grupo).map((c) => c.color);
      expect(new Set(colores).size).toBe(colores.length);
    }
  });
});

describe('escala de neutros', () => {
  const PASOS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

  it('define los diez pasos', () => {
    for (const paso of PASOS) {
      expect(resolveToken(`color-neutral-${paso}`), `falta --color-neutral-${paso}`).toMatch(
        /^#[0-9a-f]{6}$/,
      );
    }
  });

  it('la escala es monótona: cada paso es más oscuro que el anterior', () => {
    const lums = PASOS.map((p) => relativeLuminance(resolveToken(`color-neutral-${p}`)!));
    for (let i = 1; i < lums.length; i++) {
      expect(lums[i], `paso ${PASOS[i]} no es más oscuro que ${PASOS[i - 1]}`).toBeLessThan(
        lums[i - 1],
      );
    }
  });

  it('preserva la luminancia de los grises que sustituye (ningún ratio se mueve)', () => {
    // Referencia = el gris de Tailwind que ocupaba cada paso antes de la migración.
    const REFERENCIAS: Record<string, string> = {
      '50': '#f9fafb',
      '100': '#f3f4f6',
      '200': '#e5e7eb',
      '300': '#d1d5db',
      '400': '#9ca3af',
      '500': '#6b7280',
      '600': '#4b5563',
      '700': '#374151',
      '800': '#1f2937',
      '900': '#111827',
    };
    for (const [paso, ref] of Object.entries(REFERENCIAS)) {
      const delta = Math.abs(
        relativeLuminance(resolveToken(`color-neutral-${paso}`)!) - relativeLuminance(ref),
      );
      expect(delta, `paso ${paso} se desvía ${delta.toFixed(5)} de ${ref}`).toBeLessThan(0.005);
    }
  });

  it('el texto secundario y muted cumplen AA sobre blanco', () => {
    for (const token of ['color-text-secondary', 'color-text-muted']) {
      const ratio = contrastRatio(resolveToken(token)!, '#ffffff');
      expect(ratio, `--${token} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('blanco translúcido del footer sobre el charcoal', () => {
  const FOOTER = readFileSync(resolve(ROOT, 'src/shared/ui/Footer.astro'), 'utf8');
  const CHARCOAL = resolveToken('color-neutral-900')!;

  /** Compone blanco a `alpha` sobre `bg` y devuelve el ratio resultante. */
  function ratioSobreCharcoal(alpha: number): number {
    const h = CHARCOAL.replace('#', '');
    const bg = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const fg = bg.map((c) => alpha + (1 - alpha) * c);
    const lum = (rgb: number[]) => {
      const [r, g, b] = rgb.map(srgbToLinear);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const [lf, lb] = [lum(fg), lum(bg)];
    return (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
  }

  // Solo las declaraciones `color:` — bordes y fondos translúcidos son
  // decorativos y no transportan información.
  const alphas = [
    ...FOOTER.matchAll(/(?<!-)color:\s*rgba\(\s*255,\s*255,\s*255,\s*([\d.]+)\s*\)/g),
  ].map((m) => Number(m[1]));

  it('encuentra las declaraciones a verificar (no pasa en vacío)', () => {
    expect(alphas.length).toBeGreaterThanOrEqual(8);
  });

  it('ninguna baja del mínimo no-textual de WCAG 1.4.11 (3:1)', () => {
    const fallos = alphas
      .map((a) => ({ a, r: ratioSobreCharcoal(a) }))
      .filter(({ r }) => r < 3)
      .map(({ a, r }) => `alpha ${a} → ${r.toFixed(2)}:1`);
    expect(fallos).toEqual([]);
  });

  it('el texto (alpha ≥ .5) cumple AA', () => {
    for (const a of alphas.filter((x) => x >= 0.5)) {
      expect(ratioSobreCharcoal(a), `alpha ${a}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('respaldo de categoría desconocida', () => {
  it('un evento con categoría fuera del mapa cae al verde de marca', () => {
    const meta = categoriaEvento('categoria-que-no-existe');
    expect(meta.label).toBe('categoria-que-no-existe');
    expect(meta.color).toBe('var(--color-brand-primary)');
    expect(resolveToken('color-brand-primary')).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('una obra con categoría fuera del mapa cae al verde de marca', () => {
    expect(categoriaObra('otra').color).toBe('var(--color-brand-primary)');
  });

  it('una categoría conocida devuelve sus metadatos, no el respaldo', () => {
    expect(categoriaEvento('feria').labelLargo).toBe('Ferias y exposiciones');
    expect(categoriaObra('salud').label).toBe('Salud');
  });
});
