/**
 * build-canton-map.mjs — Convierte el SVG de diseño del cantón en los artefactos
 * que consume el sitio.
 *
 * El archivo que entrega el diseñador (export de Illustrator, ~28 MB) trae las 6
 * parroquias como paths vectoriales reales y, dentro de cada una, una fotografía
 * PNG incrustada en base64 al 24 % de opacidad, más una viñeta ilustrada sobre
 * cada rótulo. Ese archivo NO es publicable tal cual: sería el elemento LCP de la
 * home pesando 28 MB.
 *
 * Este script lo descompone en:
 *   • public/images/mapa/<parroquia>.webp      — las 6 texturas, fuera del SVG
 *   • public/images/mapa/<parroquia>-icono.webp — las 6 viñetas, fuera del SVG
 *   • src/modules/canton/data/canton-map-geometry.ts — geometría + degradados
 *
 * El componente CantonMapSVG.astro incrusta esa geometría en el HTML, de modo que
 * el contorno que se pinta ES el contorno clicable (sin polígonos aproximados).
 *
 * Uso:
 *   node scripts/build-canton-map.mjs [--src "<ruta al SVG del diseñador>"]
 *
 * Por defecto busca "Mapa antonio ante.svg" en el directorio padre del repo, que
 * es donde vive la carpeta de entregables del cliente.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const srcFlag = process.argv.indexOf('--src');
const SRC_SVG =
  srcFlag !== -1 && process.argv[srcFlag + 1]
    ? resolve(process.argv[srcFlag + 1])
    : resolve(ROOT, '../Mapa antonio ante.svg');

const OUT_IMG_DIR = resolve(ROOT, 'public/images/mapa');
const OUT_TS = resolve(ROOT, 'src/modules/canton/data/canton-map-geometry.ts');

/** Calidad WebP: las texturas se pintan al 24 % de opacidad bajo un degradado,
 *  así que la pérdida es invisible y el ahorro sobre el PNG es de ~15×. */
const WEBP_QUALITY = 50;
/** Ancho máximo: 2× el tamaño al que se muestra la textura más grande. */
const MAX_TEXTURE_WIDTH = 1200;
/**
 * La viñeta más grande mide ~95 unidades de viewBox. El mapa se pinta como mucho a
 * 560 px CSS sobre 721 unidades, así que son ~74 px CSS en escritorio (148 a 2×) y
 * ~57 en un móvil de 430 px (171 a 3×). 192 cubre el peor caso: subir de ahí solo
 * engorda el elemento LCP de la home.
 */
const MAX_ICON_WIDTH = 192;
/** Calidad WebP de las viñetas: son ilustraciones opacas al 100 %, sin degradado
 *  que las disimule, así que piden bastante más calidad que las texturas. */
const ICON_WEBP_QUALITY = 82;
/** Margen (en unidades del viewBox) alrededor del contorno del cantón. */
const VIEWBOX_PADDING = 6;
/** Superficie oficial del cantón (km²) — de ella se deriva la escala gráfica. */
const CANTON_AREA_KM2 = 79;

const svg = readFileSync(SRC_SVG, 'utf8');
const defs = svg.slice(svg.indexOf('<defs>'), svg.indexOf('</defs>'));
const body = svg.slice(svg.indexOf('</defs>') + '</defs>'.length);

// ── 1. Hoja de estilos incrustada: clase → relleno / filtro ──────────────────
const styleBlock = svg.slice(svg.indexOf('<style>'), svg.indexOf('</style>'));
const fillByClass = new Map(); // cls-17 → Degradado_sin_nombre_409
for (const m of styleBlock.matchAll(/\.(cls-\d+)\s*\{[^}]*?fill:\s*url\(#([^)]+)\)/g)) {
  fillByClass.set(m[1], m[2]);
}
const filterByClass = new Map(); // cls-6 → drop-shadow-1
for (const m of styleBlock.matchAll(/\.(cls-\d+)\s*\{\s*filter:\s*url\(#([^)]+)\)/g)) {
  filterByClass.set(m[1], m[2]);
}
const clipByClass = new Map(); // cls-38 → clippath
for (const m of styleBlock.matchAll(/\.(cls-\d+)\s*\{\s*clip-path:\s*url\(#([^)]+)\)/g)) {
  clipByClass.set(m[1], m[2]);
}

// Cuerpo de letra por clase. Illustrator agrupa selectores (".cls-3, .cls-4 {…}")
// y luego los pisa uno a uno, así que gana la última regla que toque la clase.
const fontSizeByClass = new Map(); // cls-6 → 13.9918
for (const m of styleBlock.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
  const size = /font-size:\s*([\d.]+)px/.exec(m[2]);
  if (!size) continue;
  for (const sel of m[1].split(',')) {
    const cls = /\.(cls-\d+)/.exec(sel);
    if (cls) fontSizeByClass.set(cls[1], +size[1]);
  }
}

// ── 2. Definiciones: degradados, clipPaths y sombras ─────────────────────────
const gradients = new Map();
for (const m of defs.matchAll(
  /<linearGradient id="([^"]+)"[^>]*?x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"[^>]*>([\s\S]*?)<\/linearGradient>/g
)) {
  const stops = [...m[6].matchAll(/<stop offset="([^"]+)" stop-color="([^"]+)"\/>/g)].map((s) => ({
    offset: s[1],
    color: s[2],
  }));
  gradients.set(m[1], { x1: +m[2], y1: +m[3], x2: +m[4], y2: +m[5], stops });
}

const clipPaths = new Map();
for (const m of defs.matchAll(
  /<clipPath id="([^"]+)">\s*<path[^>]*d="([^"]+)"\s*\/>\s*<\/clipPath>/g
)) {
  clipPaths.set(m[1], m[2]);
}

const shadowColors = new Map();
for (const m of defs.matchAll(
  /<filter id="([^"]+)"[\s\S]*?flood-color="([^"]+)"[\s\S]*?<\/filter>/g
)) {
  shadowColors.set(m[1], m[2]);
}

// ── 3. Cuerpo: contornos, texturas, viñetas y rótulos ────────────────────────
/**
 * Contornos de parroquia = los únicos paths con relleno de degradado. El resto de
 * los `<path>` del documento son decoración del diseño (la silueta verde con
 * sombra que va detrás, la veladura que va encima) y no representan territorio:
 * si se colaran aquí, un rótulo caería dentro de dos contornos a la vez.
 *
 * El ORDEN de este array es el orden de pintado del diseñador, y es información,
 * no casualidad: los contornos se solapan en bandas a lo largo de las fronteras y
 * quien se pinta después decide dónde cae el límite visible.
 */
const shapes = [...body.matchAll(/<path class="(cls-\d+)" d="([^"]+)"\/>/g)]
  .filter((m) => fillByClass.has(m[1]))
  .map((m) => ({ cls: m[1], d: m[2] }));

const textures = [...body.matchAll(
  /<g class="cls-9">\s*<g class="(cls-\d+)">\s*<image width="(\d+)" height="(\d+)" transform="([^"]+)" xlink:href="data:image\/png;base64,([^"]+)"\/>/g
)].map((m) => ({
  clipId: clipByClass.get(m[1]),
  width: +m[2],
  height: +m[3],
  transform: m[4],
  base64: m[5],
}));

/** `translate(tx[ ty]) scale(s)` → rectángulo ya resuelto en unidades del viewBox. */
function placedRect(transform, width, height) {
  const t = /translate\(([-\d.]+)(?:[,\s]+([-\d.]+))?\)/.exec(transform);
  const s = /scale\(([-\d.]+)\)/.exec(transform);
  const scale = s ? +s[1] : 1;
  return {
    x: t ? +t[1] : 0,
    y: t && t[2] !== undefined ? +t[2] : 0,
    width: width * scale,
    height: height * scale,
  };
}

/**
 * Viñetas ilustradas: el export las suelta como `<image>` sueltos al final, con
 * la misma forma de atributos que las texturas. Se distinguen porque las texturas
 * ya quedaron reclamadas dentro de un `<g class="cls-9">`.
 */
const textureData = new Set(textures.map((t) => t.base64));
const icons = [...body.matchAll(
  /<image width="(\d+)" height="(\d+)" transform="([^"]+)" xlink:href="data:image\/png;base64,([^"]+)"\/>/g
)]
  .filter((m) => !textureData.has(m[4]))
  .map((m) => ({ ...placedRect(m[3], +m[1], +m[2]), base64: m[4] }));

const labels = [...body.matchAll(
  /<text class="(cls-\d+)" transform="translate\(([-\d.]+)[,\s]+([-\d.]+)\)">([\s\S]*?)<\/text>/g
)].map((m) => {
  const chunks = [...m[4].matchAll(/<tspan[^>]*?\sx="([-\d.]+)" y="([-\d.]+)"[^>]*>([^<]*)<\/tspan>/g)].map(
    (t) => ({ x: +t[1], y: +t[2], text: t[3] })
  );
  const byLine = new Map();
  for (const c of chunks) {
    if (!byLine.has(c.y)) byLine.set(c.y, []);
    byLine.get(c.y).push(c);
  }
  // Ancho del rótulo original: el último salto de x conocido más una estimación
  // del avance del último trozo (media de los avances medidos por carácter).
  let width = 0;
  for (const line of byLine.values()) {
    let advance = 0;
    let chars = 0;
    for (let i = 1; i < line.length; i++) {
      advance += line[i].x - line[i - 1].x;
      chars += line[i - 1].text.length;
    }
    const perChar = chars > 0 ? advance / chars : 9.5;
    const last = line[line.length - 1];
    width = Math.max(width, last.x + last.text.length * perChar);
  }
  // Interlineado: el salto de y entre la primera y la segunda línea del diseño.
  const ys = [...byLine.keys()].sort((a, b) => a - b);
  return {
    cls: m[1],
    x: +m[2],
    y: +m[3],
    width,
    fontSize: fontSizeByClass.get(m[1]),
    lineHeight: ys.length > 1 ? +(ys[1] - ys[0]).toFixed(2) : 0,
    // Se recorta el blanco de los extremos: el salto de línea de Illustrator deja
    // un espacio colgando ("ANDRADE ") que, con text-anchor="middle", descentra
    // media pulsación esa línea respecto de la siguiente.
    lines: ys.map((y) => byLine.get(y).map((c) => c.text).join('').trim()),
  };
});

// ── 4. Geometría: aplanado de paths para bbox y punto-en-relleno ─────────────
function tokenize(d) {
  const out = [];
  let cmd = null;
  let nums = [];
  for (const [, letter, num] of d.matchAll(/([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:[eE][-+]?\d+)?)/g)) {
    if (letter) {
      if (cmd !== null) out.push([cmd, nums]);
      cmd = letter;
      nums = [];
    } else {
      nums.push(+num);
    }
  }
  if (cmd !== null) out.push([cmd, nums]);
  return out;
}

function cubic(p0, p1, p2, p3, steps = 10) {
  const pts = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return pts;
}

/** Aplana un path a polilíneas cerradas. Solo M/L/H/V/C/S/Z — lo que exporta AI. */
function flatten(d) {
  const rings = [];
  let ring = [];
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let prevCtrl = null;
  let prevCmd = '';
  for (const [cmd, ns] of tokenize(d)) {
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    let i = 0;
    if (C === 'M') {
      if (ring.length) rings.push(ring);
      ring = [];
      while (i + 1 < ns.length) {
        x = rel ? x + ns[i] : ns[i];
        y = rel ? y + ns[i + 1] : ns[i + 1];
        if (i === 0) [sx, sy] = [x, y];
        ring.push([x, y]);
        i += 2;
      }
    } else if (C === 'L') {
      while (i + 1 < ns.length) {
        x = rel ? x + ns[i] : ns[i];
        y = rel ? y + ns[i + 1] : ns[i + 1];
        ring.push([x, y]);
        i += 2;
      }
    } else if (C === 'H') {
      for (const v of ns) {
        x = rel ? x + v : v;
        ring.push([x, y]);
      }
    } else if (C === 'V') {
      for (const v of ns) {
        y = rel ? y + v : v;
        ring.push([x, y]);
      }
    } else if (C === 'C') {
      while (i + 5 < ns.length) {
        const p = ns.slice(i, i + 6).map((v, j) => (rel ? v + (j % 2 === 0 ? x : y) : v));
        ring.push(...cubic([x, y], [p[0], p[1]], [p[2], p[3]], [p[4], p[5]]));
        prevCtrl = [p[2], p[3]];
        [x, y] = [p[4], p[5]];
        i += 6;
      }
    } else if (C === 'S') {
      while (i + 3 < ns.length) {
        const p = ns.slice(i, i + 4).map((v, j) => (rel ? v + (j % 2 === 0 ? x : y) : v));
        const c1 =
          prevCtrl && 'CcSs'.includes(prevCmd) ? [2 * x - prevCtrl[0], 2 * y - prevCtrl[1]] : [x, y];
        ring.push(...cubic([x, y], c1, [p[0], p[1]], [p[2], p[3]]));
        prevCtrl = [p[0], p[1]];
        [x, y] = [p[2], p[3]];
        i += 4;
      }
    } else if (C === 'Z') {
      if (ring.length) rings.push(ring);
      ring = [];
      [x, y] = [sx, sy];
    } else {
      throw new Error(`Comando de path no soportado: ${C}`);
    }
    prevCmd = cmd;
  }
  if (ring.length) rings.push(ring);
  return rings;
}

const bboxOf = (rings) => {
  const pts = rings.flat();
  return {
    minX: Math.min(...pts.map((p) => p[0])),
    minY: Math.min(...pts.map((p) => p[1])),
    maxX: Math.max(...pts.map((p) => p[0])),
    maxY: Math.max(...pts.map((p) => p[1])),
  };
};

/** Regla non-zero winding, igual que la usa el navegador para `fill`. */
function containsPoint(rings, px, py) {
  let winding = 0;
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[(i + 1) % ring.length];
      const side = (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1);
      if (y1 <= py) {
        if (y2 > py && side > 0) winding++;
      } else if (y2 <= py && side < 0) winding--;
    }
  }
  return winding !== 0;
}

/** Área encerrada por las polilíneas (fórmula del cordón / shoelace). */
const areaOf = (rings) => {
  let total = 0;
  for (const ring of rings) {
    let sum = 0;
    for (let i = 0; i < ring.length; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[(i + 1) % ring.length];
      sum += x1 * y2 - x2 * y1;
    }
    total += sum / 2;
  }
  return Math.abs(total);
};

const iou = (a, b) => {
  const w = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX));
  const h = Math.max(0, Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY));
  const inter = w * h;
  const areaA = (a.maxX - a.minX) * (a.maxY - a.minY);
  const areaB = (b.maxX - b.minX) * (b.maxY - b.minY);
  return inter / (areaA + areaB - inter);
};

// ── 5. Identificar cada contorno por el rótulo que cae dentro ────────────────
/** Rótulo del diseño → id de parroquia en PARISHES. */
const ID_BY_LABEL = {
  ATUNTAQUI: 'atuntaqui',
  'ANDRADE MARÍN': 'andrade_marin',
  CHALTURA: 'chaltura',
  NATABUELA: 'natabuela',
  'SAN ROQUE': 'san_roque',
  IMBAYA: 'imbaya',
};

const geom = shapes.map((s) => ({ ...s, rings: flatten(s.d), bbox: null }));
for (const g of geom) g.bbox = bboxOf(g.rings);

const parishes = [];
for (const label of labels) {
  const text = label.lines.join(' ').replace(/\s+/g, ' ').trim();
  const id = ID_BY_LABEL[text];
  if (!id) throw new Error(`Rótulo desconocido en el SVG: "${text}"`);
  const cx = label.x + label.width / 2;
  const cy = label.y - 6;
  const hits = geom.filter((g) => containsPoint(g.rings, cx, cy));
  if (hits.length === 0) {
    throw new Error(`El rótulo "${text}" no cae dentro de ningún contorno`);
  }
  // Los contornos se solapan en bandas; si el rótulo cae en varias, manda la que
  // se pinta última, que es la que de verdad se ve bajo el texto.
  const shape = hits[hits.length - 1];
  const gradientId = fillByClass.get(shape.cls);
  if (!gradientId) throw new Error(`El contorno ${shape.cls} no tiene degradado`);

  // Textura: la que su clipPath solapa mejor con este contorno.
  let texture = null;
  let best = 0;
  for (const t of textures) {
    const clipD = clipPaths.get(t.clipId);
    if (!clipD) continue;
    const score = iou(shape.bbox, bboxOf(flatten(clipD)));
    if (score > best) {
      best = score;
      texture = t;
    }
  }
  if (!texture || best < 0.8) {
    throw new Error(`Sin textura fiable para ${id} (mejor solape ${best.toFixed(2)})`);
  }

  // Viñeta: el diseño la centra justo encima de su rótulo, así que la más cercana
  // al rótulo es la suya. La bijección se comprueba después.
  const labelCx = label.x + label.width / 2;
  const icon = icons
    .map((ic) => ({
      ic,
      dist: Math.hypot(ic.x + ic.width / 2 - labelCx, ic.y + ic.height / 2 - label.y),
    }))
    .sort((a, b) => a.dist - b.dist)[0];
  if (!icon || icon.dist > 120) {
    throw new Error(
      `Sin viñeta para ${id} (la más cercana está a ${icon ? icon.dist.toFixed(0) : '∞'} unidades)`
    );
  }

  parishes.push({
    id,
    label: text,
    shape,
    gradientId,
    shadowColor: shadowColors.get(filterByClass.get(label.cls)) ?? '#000',
    texture,
    icon: icon.ic,
    labelBox: label,
  });
}

/**
 * Orden de pintado del diseñador. El bucle de arriba recorre los RÓTULOS, cuyo
 * orden en el archivo no tiene por qué coincidir con el de los contornos — y es el
 * de los contornos el que decide qué parroquia tapa a cuál en cada banda de
 * solape. Ordenar por contorno es lo que hace que el sitio pinte el mismo mapa que
 * el diseñador ve en Illustrator.
 */
parishes.sort((a, b) => geom.indexOf(a.shape) - geom.indexOf(b.shape));

/**
 * Para cada parroquia, las que se pintan DESPUÉS y le pisan territorio. El
 * componente las usa para recortar cada parroquia a su región realmente visible,
 * de modo que las seis teselen el cantón sin bordes dobles ni trazos huérfanos.
 * Se filtran por bbox: dos parroquias en extremos opuestos no se estorban.
 */
const bboxOverlap = (a, b) =>
  a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;
for (const [i, p] of parishes.entries()) {
  p.coveredBy = parishes
    .slice(i + 1)
    .filter((q) => bboxOverlap(p.shape.bbox, q.shape.bbox))
    .map((q) => q.id);
}

// Cada textura y cada viñeta deben usarse una sola vez.
const usedClips = new Set(parishes.map((p) => p.texture.clipId));
if (usedClips.size !== parishes.length) {
  throw new Error('Dos parroquias comparten la misma textura — revisar el emparejamiento');
}
const usedIcons = new Set(parishes.map((p) => p.icon));
if (usedIcons.size !== parishes.length) {
  throw new Error('Dos parroquias comparten la misma viñeta — revisar el emparejamiento');
}
if (icons.length !== parishes.length) {
  throw new Error(`El SVG trae ${icons.length} viñetas para ${parishes.length} parroquias`);
}

// ── 6. Texturas y viñetas → WebP ─────────────────────────────────────────────
mkdirSync(OUT_IMG_DIR, { recursive: true });
let totalWebp = 0;

/** PNG en base64 → WebP en disco, encogido si excede `maxWidth`. */
async function emitWebp(base64, name, maxWidth, quality) {
  const png = Buffer.from(base64, 'base64');
  const pipeline = sharp(png);
  const meta = await pipeline.metadata();
  const out = await (meta.width > maxWidth ? pipeline.resize({ width: maxWidth }) : pipeline)
    .webp({ quality, effort: 6 })
    .toBuffer();
  writeFileSync(resolve(OUT_IMG_DIR, `${name}.webp`), out);
  totalWebp += out.length;
  console.log(
    `  ${name.padEnd(20)} ${meta.width}×${meta.height} png ${(png.length / 1024).toFixed(0)} KB → webp ${(out.length / 1024).toFixed(0)} KB`
  );
}

for (const p of parishes) {
  await emitWebp(p.texture.base64, p.id, MAX_TEXTURE_WIDTH, WEBP_QUALITY);
  await emitWebp(p.icon.base64, `${p.id}-icono`, MAX_ICON_WIDTH, ICON_WEBP_QUALITY);
}

// ── 7. viewBox recortado al contorno real del cantón ─────────────────────────
const all = parishes.map((p) => p.shape.bbox);
const pad = VIEWBOX_PADDING;
const vb = {
  x: Math.floor(Math.min(...all.map((b) => b.minX)) - pad),
  y: Math.floor(Math.min(...all.map((b) => b.minY)) - pad),
};
vb.w = Math.ceil(Math.max(...all.map((b) => b.maxX)) + pad) - vb.x;
vb.h = Math.ceil(Math.max(...all.map((b) => b.maxY)) + pad) - vb.y;

// ── 8. Escala gráfica derivada de la superficie oficial del cantón ───────────
// El mapa no trae escala. La suma de las áreas de las 6 parroquias equivale a
// los 79 km² del cantón, así que 1 km = √(áreaTotal / 79) unidades del viewBox.
const totalArea = parishes.reduce((sum, p) => sum + areaOf(p.shape.rings), 0);
const unitsPerKm = Math.sqrt(totalArea / CANTON_AREA_KM2);

// ── 9. Emitir el módulo de geometría ─────────────────────────────────────────
const usedGradients = [...new Set(parishes.map((p) => p.gradientId))];
const json = (v) => JSON.stringify(v);

const ts = `/**
 * canton-map-geometry.ts — GENERADO por \`node scripts/build-canton-map.mjs\`.
 * NO editar a mano: cualquier cambio se pierde al regenerar desde el SVG del
 * diseñador ("Mapa antonio ante.svg", export de Illustrator).
 *
 * Contiene la geometría vectorial del cantón: un contorno exacto por parroquia
 * (el mismo path que se pinta es el que recibe el clic) más los degradados de
 * relleno del diseño original. Las imágenes viven fuera, en /images/mapa/.
 *
 * El array PARISH_GEOMETRY va en el ORDEN DE PINTADO del diseñador: los contornos
 * se solapan en bandas a lo largo de las fronteras y quien va después decide dónde
 * cae el límite visible. No reordenar.
 */

/** viewBox recortado al contorno real del cantón (sin el margen vacío del lienzo 1080×1080). */
export const MAP_VIEWBOX = ${json(`${vb.x} ${vb.y} ${vb.w} ${vb.h}`)};

/** Relación de aspecto ancho/alto — el contenedor la usa para reservar el hueco y evitar CLS. */
export const MAP_ASPECT_RATIO = ${(vb.w / vb.h).toFixed(4)};

/**
 * Unidades del viewBox por kilómetro. Derivada: la suma de las áreas de las 6
 * parroquias equivale a los ${CANTON_AREA_KM2} km² oficiales del cantón, luego
 * 1 km = √(áreaTotal / ${CANTON_AREA_KM2}) unidades. Alimenta la escala gráfica.
 */
export const MAP_UNITS_PER_KM = ${unitsPerKm.toFixed(2)};

export interface MapGradient {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stops: readonly { offset: string; color: string }[];
}

export interface ParishGeometry {
  /** id de parroquia — coincide con las claves de PARISHES */
  id: string;
  /** Contorno exacto: capa visual y capa clicable a la vez */
  d: string;
  /** Degradado de relleno del diseño original */
  gradientId: string;
  /** Color de la sombra proyectada del rótulo */
  shadowColor: string;
  /**
   * Parroquias que se pintan DESPUÉS y le comen territorio. El componente las usa
   * para recortar esta parroquia a su región realmente visible: así las seis
   * teselan el cantón y ningún trazo se queda a medias bajo el vecino.
   */
  coveredBy: readonly string[];
  /** Fotografía de fondo, recortada contra el propio contorno */
  texture: { src: string; width: number; height: number; transform: string };
  /** Viñeta ilustrada sobre el rótulo, ya resuelta en unidades del viewBox */
  icon: { src: string; x: number; y: number; width: number; height: number };
  /** Rótulo: x es el centro del texto (text-anchor="middle") */
  label: {
    text: string;
    x: number;
    y: number;
    /** Cuerpo de letra del diseño — "ANDRADE MARÍN" va más pequeño que el resto */
    fontSize: number;
    /** Salto entre líneas; 0 en los rótulos de una sola línea */
    lineHeight: number;
    lines: readonly string[];
  };
}

export const MAP_GRADIENTS: readonly MapGradient[] = [
${usedGradients
  .map((id) => {
    const g = gradients.get(id);
    return `  {
    id: ${json(id)},
    x1: ${g.x1},
    y1: ${g.y1},
    x2: ${g.x2},
    y2: ${g.y2},
    stops: [${g.stops.map((s) => `{ offset: ${json(s.offset)}, color: ${json(s.color)} }`).join(', ')}],
  },`;
  })
  .join('\n')}
] as const;

export const PARISH_GEOMETRY: readonly ParishGeometry[] = [
${parishes
  .map(
    (p) => `  {
    id: ${json(p.id)},
    gradientId: ${json(p.gradientId)},
    shadowColor: ${json(p.shadowColor)},
    coveredBy: [${p.coveredBy.map(json).join(', ')}],
    texture: {
      src: ${json(`/images/mapa/${p.id}.webp`)},
      width: ${p.texture.width},
      height: ${p.texture.height},
      transform: ${json(p.texture.transform)},
    },
    icon: {
      src: ${json(`/images/mapa/${p.id}-icono.webp`)},
      x: ${p.icon.x.toFixed(2)},
      y: ${p.icon.y.toFixed(2)},
      width: ${p.icon.width.toFixed(2)},
      height: ${p.icon.height.toFixed(2)},
    },
    label: {
      text: ${json(p.label)},
      x: ${(p.labelBox.x + p.labelBox.width / 2).toFixed(2)},
      y: ${p.labelBox.y},
      fontSize: ${p.labelBox.fontSize},
      lineHeight: ${p.labelBox.lineHeight},
      lines: [${p.labelBox.lines.map(json).join(', ')}],
    },
    d: ${json(p.shape.d)},
  },`
  )
  .join('\n')}
] as const;
`;

// El fichero generado vive en src/, así que lo cubre `eslint src`: se emite ya
// formateado con las reglas del repo para que no rompa el gate de lint.
const formatted = await prettier.format(ts, {
  ...(await prettier.resolveConfig(OUT_TS)),
  filepath: OUT_TS,
});
writeFileSync(OUT_TS, formatted);

console.log(`\n  viewBox   ${vb.x} ${vb.y} ${vb.w} ${vb.h}  (aspecto ${(vb.w / vb.h).toFixed(3)})`);
console.log(`  imágenes  ${(totalWebp / 1024).toFixed(0)} KB en total (antes ${(svg.length / 1024 / 1024).toFixed(1)} MB incrustados)`);
console.log(`  geometría ${(formatted.length / 1024).toFixed(0)} KB → ${OUT_TS.replace(ROOT + '/', '')}`);
for (const p of parishes) console.log(`  · ${p.id.padEnd(14)} ${p.label}`);
