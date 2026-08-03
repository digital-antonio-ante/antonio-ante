// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PARISHES } from '@modules/canton/data/parishes';
import {
  MAP_VIEWBOX,
  MAP_ASPECT_RATIO,
  MAP_UNITS_PER_KM,
  MAP_GRADIENTS,
  PARISH_GEOMETRY,
} from '@modules/canton/data/canton-map-geometry';

/**
 * Integridad de la geometría del mapa del cantón.
 *
 * `canton-map-geometry.ts` lo genera `scripts/build-canton-map.mjs` a partir del
 * SVG del diseñador, que se actualiza cada vez que el GAD cambia el mapa. Ese
 * archivo de origen no se versiona: si un export nuevo mueve un rótulo, cambia el
 * orden de los contornos o suelta una viñeta, el script puede emitir geometría
 * plausible pero equivocada y el sitio la pinta sin protestar.
 *
 * Estos tests son lo que convierte esa deriva silenciosa en un fallo ruidoso.
 */

const PUBLIC = resolve(process.cwd(), 'public');

describe('lienzo del mapa', () => {
  it('el viewBox son cuatro números y encierra área positiva', () => {
    const vb = MAP_VIEWBOX.split(' ').map(Number);
    expect(vb).toHaveLength(4);
    expect(vb.every(Number.isFinite)).toBe(true);
    expect(vb[2]).toBeGreaterThan(0);
    expect(vb[3]).toBeGreaterThan(0);
  });

  it('la relación de aspecto coincide con el viewBox (reserva el hueco sin CLS)', () => {
    const [, , w, h] = MAP_VIEWBOX.split(' ').map(Number);
    expect(MAP_ASPECT_RATIO).toBeCloseTo(w / h, 3);
  });

  it('la escala gráfica es plausible para un cantón de 79 km²', () => {
    // 79 km² repartidos en un lienzo de ~700×860 unidades ⇒ decenas de unidades/km.
    expect(MAP_UNITS_PER_KM).toBeGreaterThan(10);
    expect(MAP_UNITS_PER_KM).toBeLessThan(200);
  });
});

describe('parroquias', () => {
  it('están las seis y todas existen en PARISHES', () => {
    expect(PARISH_GEOMETRY).toHaveLength(6);
    for (const p of PARISH_GEOMETRY) {
      expect(PARISHES[p.id], `parroquia desconocida: ${p.id}`).toBeDefined();
    }
    expect(new Set(PARISH_GEOMETRY.map((p) => p.id)).size).toBe(6);
  });

  it('cada contorno referencia un degradado declarado', () => {
    const ids = new Set(MAP_GRADIENTS.map((g) => g.id));
    for (const p of PARISH_GEOMETRY) {
      expect(ids.has(p.gradientId), `${p.id} sin degradado`).toBe(true);
    }
  });

  it('cada contorno es un path cerrado no trivial', () => {
    for (const p of PARISH_GEOMETRY) {
      expect(p.d.startsWith('M'), `${p.id} no empieza en M`).toBe(true);
      expect(p.d.length, `${p.id} tiene un contorno sospechosamente corto`).toBeGreaterThan(500);
    }
  });
});

describe('imágenes', () => {
  it('la textura de cada parroquia existe en disco', () => {
    for (const p of PARISH_GEOMETRY) {
      expect(existsSync(resolve(PUBLIC, p.texture.src.slice(1))), `falta ${p.texture.src}`).toBe(
        true
      );
    }
  });

  it('la viñeta ilustrada de cada parroquia existe y se dibuja con área positiva', () => {
    for (const p of PARISH_GEOMETRY) {
      expect(existsSync(resolve(PUBLIC, p.icon.src.slice(1))), `falta ${p.icon.src}`).toBe(true);
      expect(p.icon.width, `${p.id}: viñeta sin ancho`).toBeGreaterThan(0);
      expect(p.icon.height, `${p.id}: viñeta sin alto`).toBeGreaterThan(0);
    }
  });

  it('ninguna imagen se reutiliza entre parroquias', () => {
    const srcs = PARISH_GEOMETRY.flatMap((p) => [p.texture.src, p.icon.src]);
    expect(new Set(srcs).size).toBe(srcs.length);
  });

  it('la viñeta cae dentro del recuadro del rótulo de su propia parroquia', () => {
    // El diseño coloca cada viñeta justo encima de su rótulo. Si el emparejamiento
    // se cruzara, la viñeta se iría a la otra punta del cantón.
    for (const p of PARISH_GEOMETRY) {
      const iconCx = p.icon.x + p.icon.width / 2;
      const iconCy = p.icon.y + p.icon.height / 2;
      expect(Math.abs(iconCx - p.label.x), `${p.id}: viñeta descentrada`).toBeLessThan(40);
      expect(p.label.y - iconCy, `${p.id}: viñeta no está sobre el rótulo`).toBeGreaterThan(0);
      expect(p.label.y - iconCy).toBeLessThan(120);
    }
  });
});

describe('orden de pintado', () => {
  it('coveredBy solo nombra parroquias posteriores en el orden del diseño', () => {
    const order = PARISH_GEOMETRY.map((p) => p.id);
    PARISH_GEOMETRY.forEach((p, i) => {
      for (const other of p.coveredBy) {
        const j = order.indexOf(other);
        expect(j, `${p.id} declara tapada por ${other}, que no existe`).toBeGreaterThan(-1);
        expect(j, `${p.id} no puede quedar tapada por ${other}, que se pinta antes`).toBeGreaterThan(
          i
        );
      }
    });
  });

  it('la última parroquia del orden no la tapa nadie', () => {
    expect(PARISH_GEOMETRY[PARISH_GEOMETRY.length - 1].coveredBy).toHaveLength(0);
  });

  it('los solapes declarados son recíprocos con el orden: alguien tapa a alguien', () => {
    // Los contornos del diseño se solapan en bandas a lo largo de las fronteras.
    // Si NINGUNA parroquia declarara solape, el emparejamiento se habría roto.
    const total = PARISH_GEOMETRY.reduce((n, p) => n + p.coveredBy.length, 0);
    expect(total).toBeGreaterThan(0);
  });
});

describe('rótulos', () => {
  it('cada rótulo tiene texto, líneas y cuerpo de letra', () => {
    for (const p of PARISH_GEOMETRY) {
      expect(p.label.lines.length, `${p.id} sin líneas de rótulo`).toBeGreaterThan(0);
      expect(p.label.lines.join(' ').trim()).toBe(p.label.text);
      expect(p.label.fontSize, `${p.id}: cuerpo de letra fuera de rango`).toBeGreaterThan(5);
      expect(p.label.fontSize).toBeLessThan(40);
    }
  });

  it('el rótulo de dos líneas declara interlineado y el de una no lo necesita', () => {
    for (const p of PARISH_GEOMETRY) {
      if (p.label.lines.length > 1) {
        expect(p.label.lineHeight, `${p.id}: dos líneas sin interlineado`).toBeGreaterThan(0);
      }
    }
  });
});
