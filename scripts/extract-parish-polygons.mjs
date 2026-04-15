/**
 * extract-parish-polygons.mjs
 *
 * Extrae polígonos exactos por parroquia a partir de `public/images/franja_g-dos.svg`.
 *
 * Pipeline:
 *   1. Rasteriza el SVG a PNG a resolución de trabajo.
 *   2. Para cada parroquia, localiza un píxel semilla (color de relleno plano dominante).
 *   3. Flood-fill con tolerancia cromática L1 → máscara binaria.
 *   4. Rellena huecos internos (texto/iconos) por complemento del exterior.
 *   5. Traza el contorno exterior (Moore-Neighbor).
 *   6. Simplifica con Douglas-Peucker.
 *   7. Escala a viewBox 1694×2528 y emite `points="x,y …"`.
 *
 * Output: JSON en stdout con la forma { id: "points…" } + overlay PNG de verificación.
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SVG_PATH = resolve(__dirname, '../public/images/franja_g-dos.svg');
const OUT_JSON = resolve(__dirname, '../public/parish-polygons.json');
const OUT_OVERLAY = '/tmp/svg-render/franja_overlay.png';

const VB_W = 1694;
const VB_H = 2528;

/**
 * Configuración por parroquia:
 *  - target:    RGB objetivo del relleno plano (dominante en la zona)
 *  - bbox:      [x0, y0, x1, y1] rectángulo de búsqueda en coords de viewBox;
 *               acota lateralmente para impedir que tonos similares de parroquias
 *               vecinas contaminen la máscara (Atuntaqui↔Chaltura↔Imbaya comparten verdes).
 *  - tolerance: tolerancia L1 respecto al TARGET
 */
const PARISH_CONFIG = {
  atuntaqui:     { target: [ 56, 104,  56], bbox: [ 100,   20, 1250,  820], tolerance: 140 },
  andrade_marin: { target: [184, 152,  40], bbox: [1000,   80, 1700, 1200], tolerance: 130 },
  chaltura:      { target: [168,  72, 120], bbox: [ 480,  620, 1400, 1320], tolerance: 130 },
  natabuela:     { target: [ 56, 104, 136], bbox: [  80,  880, 1120, 1520], tolerance: 130 },
  san_roque:     { target: [184, 104,  24], bbox: [ 600, 1250, 1500, 1900], tolerance: 130 },
  imbaya:        { target: [ 56, 104,  88], bbox: [ 380, 1700, 1450, 2500], tolerance: 130 },
};

const DP_EPSILON = 10.0;     // en píxeles de trabajo (más alto → contornos más suaves)
const CLOSE_ITERATIONS = 14; // dilate+erode para puentear huecos de iconos/texto

/** ───── 1. Rasterizar ───── */
const WORK_W = VB_W;
const WORK_H = VB_H;

const raster = await sharp(SVG_PATH)
  .resize(WORK_W, WORK_H, { fit: 'fill' })
  .flatten({ background: '#000000' }) // fondo negro para separar el cantón del exterior
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { data, info } = raster;
const { width, height, channels } = info;

const idxOf = (x, y) => (y * width + x) * channels;
const getPx = (x, y) => [data[idxOf(x, y)], data[idxOf(x, y) + 1], data[idxOf(x, y) + 2]];
const l1 = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

/**
 * Selección dentro de un bounding box: marca todo píxel cuyo color esté a
 * distancia L1 ≤ tolerance del target. NO requiere conectividad — captura
 * regiones del mismo color separadas por ilustraciones (edificios, árboles).
 * El bbox se da en coords de viewBox y se convierte a coords de trabajo.
 */
function selectByBbox(bboxVb, target, tolerance) {
  const [vx0, vy0, vx1, vy1] = bboxVb;
  const x0 = Math.max(0, Math.round(vx0 * width / VB_W));
  const y0 = Math.max(0, Math.round(vy0 * height / VB_H));
  const x1 = Math.min(width - 1, Math.round(vx1 * width / VB_W));
  const y1 = Math.min(height - 1, Math.round(vy1 * height / VB_H));
  const mask = new Uint8Array(width * height);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (l1(getPx(x, y), target) <= tolerance) {
        mask[y * width + x] = 1;
      }
    }
  }
  return mask;
}

/** Etiqueta de componentes conectadas (4-vec), devuelve array de {size, pixels}. */
function largestComponent(mask) {
  const labels = new Int32Array(width * height);
  let currentLabel = 0;
  let best = { size: 0, label: -1 };
  const stack = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!mask[i] || labels[i]) continue;
      currentLabel++;
      labels[i] = currentLabel;
      stack.push(x, y);
      let size = 0;
      while (stack.length) {
        const sy = stack.pop();
        const sx = stack.pop();
        size++;
        const neighbors = [sx + 1, sy, sx - 1, sy, sx, sy + 1, sx, sy - 1];
        for (let k = 0; k < 8; k += 2) {
          const nx = neighbors[k], ny = neighbors[k + 1];
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = ny * width + nx;
          if (!mask[ni] || labels[ni]) continue;
          labels[ni] = currentLabel;
          stack.push(nx, ny);
        }
      }
      if (size > best.size) best = { size, label: currentLabel };
    }
  }
  const out = new Uint8Array(width * height);
  for (let i = 0; i < labels.length; i++) if (labels[i] === best.label) out[i] = 1;
  return { mask: out, size: best.size };
}

/** Erosión binaria 1-px. Requerida para el cierre morfológico (dilate → erode). */
function erode(mask, iterations = 1) {
  let src = mask;
  for (let it = 0; it < iterations; it++) {
    const dst = new Uint8Array(src.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (!src[i]) continue;
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) { dst[i] = 0; continue; }
        if (src[i - 1] && src[i + 1] && src[i - width] && src[i + width]) dst[i] = 1;
      }
    }
    src = dst;
  }
  return src;
}

/** ───── 4. Rellenar huecos (texto/iconos atrapados dentro) ───── */
function fillHoles(mask) {
  const visited = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    const i = y * width + x;
    if (!mask[i] && !visited[i]) {
      visited[i] = 1;
      stack.push(x, y);
    }
  };
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    if (x + 1 < width)  push(x + 1, y);
    if (x - 1 >= 0)     push(x - 1, y);
    if (y + 1 < height) push(x, y + 1);
    if (y - 1 >= 0)     push(x, y - 1);
  }
  const filled = new Uint8Array(mask);
  for (let i = 0; i < mask.length; i++) if (!mask[i] && !visited[i]) filled[i] = 1;
  return filled;
}

/** Dilatación binaria 1-px (cierra discontinuidades de subpíxeles en bordes). */
function dilate(mask, iterations = 1) {
  let src = mask;
  for (let it = 0; it < iterations; it++) {
    const dst = new Uint8Array(src.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (src[i]) { dst[i] = 1; continue; }
        if (x > 0 && src[i - 1]) { dst[i] = 1; continue; }
        if (x < width - 1 && src[i + 1]) { dst[i] = 1; continue; }
        if (y > 0 && src[i - width]) { dst[i] = 1; continue; }
        if (y < height - 1 && src[i + width]) { dst[i] = 1; continue; }
      }
    }
    src = dst;
  }
  return src;
}

/** ───── 5. Contorno exterior (Moore-Neighbor tracing) ───── */
function traceContour(mask) {
  let startX = -1, startY = -1;
  outer: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x]) { startX = x; startY = y; break outer; }
    }
  }
  if (startX < 0) return [];
  // 8-connectivity en sentido horario desde "arriba"
  const dirs = [
    [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1],
  ];
  const contour = [[startX, startY]];
  let cx = startX, cy = startY;
  let backtrack = 6; // entramos por la izquierda
  const maxSteps = width * height * 4;
  for (let step = 0; step < maxSteps; step++) {
    let found = false;
    for (let k = 1; k <= 8; k++) {
      const d = (backtrack + k) % 8;
      const nx = cx + dirs[d][0], ny = cy + dirs[d][1];
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (mask[ny * width + nx]) {
        cx = nx; cy = ny;
        contour.push([cx, cy]);
        backtrack = (d + 4) % 8;
        found = true;
        break;
      }
    }
    if (!found) break;
    if (cx === startX && cy === startY && contour.length > 3) break;
  }
  return contour;
}

/** ───── 6. Douglas-Peucker iterativo ───── */
function perpDistance(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  const cx = a[0] + t * dx, cy = a[1] + t * dy;
  return Math.hypot(p[0] - cx, p[1] - cy);
}

function dpSimplify(points, epsilon) {
  if (points.length < 3) return points.slice();
  const n = points.length;
  const keep = new Uint8Array(n);
  keep[0] = 1; keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDistance(points[i], points[s], points[e]);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > epsilon && idx !== -1) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(points[i]);
  return out;
}

/**
 * Smooth a closed contour by averaging each vertex with its neighbours.
 * Runs `passes` iterations with weight `alpha` (0 = no change, 1 = midpoint).
 * Preserves the number of vertices — used BEFORE Douglas-Peucker to eliminate
 * pixel-level zigzags that DP would otherwise keep as "significant" deviations.
 */
function smoothContour(pts, passes = 3, alpha = 0.45) {
  if (pts.length < 5) return pts;
  let cur = pts.map(p => [p[0], p[1]]);
  for (let p = 0; p < passes; p++) {
    const next = cur.map((_, i) => {
      const prev = cur[(i - 1 + cur.length) % cur.length];
      const curr = cur[i];
      const nxt  = cur[(i + 1) % cur.length];
      return [
        curr[0] + alpha * ((prev[0] + nxt[0]) / 2 - curr[0]),
        curr[1] + alpha * ((prev[1] + nxt[1]) / 2 - curr[1]),
      ];
    });
    cur = next;
  }
  return cur.map(([x, y]) => [Math.round(x), Math.round(y)]);
}

/**
 * Remove spike artifacts: vertices where removing them barely changes
 * the polygon shape (the perpendicular distance from the vertex to the
 * line prev→next is small relative to the segment lengths).
 */
function removeSpikes(pts, minAngleDeg = 35, maxDeviation = 18) {
  if (pts.length < 5) return pts;
  let changed = true;
  let result = pts.slice();
  while (changed) {
    changed = false;
    const filtered = [result[0]];
    for (let i = 1; i < result.length - 1; i++) {
      const prev = result[i - 1];
      const curr = result[i];
      const next = result[i + 1];
      const ax = curr[0] - prev[0], ay = curr[1] - prev[1];
      const bx = next[0] - curr[0], by = next[1] - curr[1];
      const dot = ax * bx + ay * by;
      const cross = ax * by - ay * bx;
      const angle = Math.abs(Math.atan2(cross, dot)) * (180 / Math.PI);
      const segLen = Math.min(Math.hypot(ax, ay), Math.hypot(bx, by));
      if (angle < minAngleDeg && segLen < maxDeviation) {
        changed = true; // skip this vertex
      } else {
        filtered.push(curr);
      }
    }
    filtered.push(result[result.length - 1]);
    result = filtered;
  }
  return result;
}

/** Área con signo (para verificar orientación). */
function signedArea(pts) {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/** ───── Pipeline por parroquia ───── */
const results = {};
const masksForOverlay = {};
const scaleX = VB_W / width;
const scaleY = VB_H / height;

for (const [id, cfg] of Object.entries(PARISH_CONFIG)) {
  // 1. Seleccionar píxeles del color objetivo dentro del bbox (sin exigir conectividad)
  let mask = selectByBbox(cfg.bbox, cfg.target, cfg.tolerance);

  // 2. Cierre morfológico: dilate → fill holes → erode → fill holes
  //    Puentea los huecos dejados por texto e iconos, restaura tamaño original.
  mask = dilate(mask, CLOSE_ITERATIONS);
  mask = fillHoles(mask);
  mask = erode(mask, CLOSE_ITERATIONS);
  mask = fillHoles(mask);

  // 3. Quedarse con la componente conectada más grande (descarta ruido aislado)
  const cc = largestComponent(mask);
  mask = cc.mask;

  const raw = traceContour(mask);
  const smooth = smoothContour(raw, 16, 0.6);
  const simplified = dpSimplify(smooth, DP_EPSILON);
  const smoothed = removeSpikes(simplified);
  // Orden horario coherente con el SVG actual
  const ordered = signedArea(smoothed) < 0 ? smoothed.slice().reverse() : smoothed;

  const pts = ordered
    .map(([x, y]) => `${Math.round(x * scaleX)},${Math.round(y * scaleY)}`)
    .join(' ');

  console.error(
    `[${id}] target=rgb(${cfg.target.join(',')}) area=${cc.size}px ` +
    `raw=${raw.length} dp=${simplified.length} smooth=${smoothed.length} final=${ordered.length}`
  );

  results[id] = pts;
  masksForOverlay[id] = mask;
}

/** ───── Overlay de verificación ───── */
{
  const overlayRGBA = Buffer.alloc(width * height * 4);
  // Base: la imagen original
  for (let i = 0, j = 0; i < data.length; i += channels, j += 4) {
    overlayRGBA[j]     = data[i];
    overlayRGBA[j + 1] = data[i + 1];
    overlayRGBA[j + 2] = data[i + 2];
    overlayRGBA[j + 3] = 255;
  }
  const palette = {
    atuntaqui:     [22, 220, 22],
    andrade_marin: [220, 200, 22],
    chaltura:      [220, 22, 180],
    natabuela:     [22, 180, 220],
    san_roque:     [220, 120, 22],
    imbaya:        [22, 220, 180],
  };
  for (const [id, mask] of Object.entries(masksForOverlay)) {
    const [cr, cg, cb] = palette[id];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (!mask[i]) continue;
        // Pintar sólo el borde (píxel de máscara con vecino vacío)
        const isEdge =
          (x === 0 || !mask[i - 1]) ||
          (x === width - 1 || !mask[i + 1]) ||
          (y === 0 || !mask[i - width]) ||
          (y === height - 1 || !mask[i + width]);
        if (!isEdge) continue;
        const j = i * 4;
        overlayRGBA[j]     = cr;
        overlayRGBA[j + 1] = cg;
        overlayRGBA[j + 2] = cb;
        overlayRGBA[j + 3] = 255;
      }
    }
  }
  await sharp(overlayRGBA, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(OUT_OVERLAY);
  console.error(`overlay → ${OUT_OVERLAY}`);
}

writeFileSync(OUT_JSON, JSON.stringify(results, null, 2));
console.error(`json → ${OUT_JSON}`);
console.log(JSON.stringify(results, null, 2));
