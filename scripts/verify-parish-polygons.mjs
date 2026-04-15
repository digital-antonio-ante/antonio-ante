/**
 * verify-parish-polygons.mjs
 *
 * Genera un SVG de verificación montando los polígonos extraídos encima de
 * franja_g-dos.svg, con rellenos semitransparentes y contornos de color para
 * validar visualmente el ajuste contra la ilustración original.
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = resolve(__dirname, '../public/parish-polygons.json');
const SRC_SVG = resolve(__dirname, '../public/images/franja_g-dos.svg');
const OUT_SVG = '/tmp/svg-render/verify.svg';
const OUT_PNG = '/tmp/svg-render/verify.png';

const VB_W = 1694;
const VB_H = 2528;

const polygons = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
const COLORS = {
  atuntaqui:     '#00ff00',
  andrade_marin: '#ffdd00',
  chaltura:      '#ff00aa',
  natabuela:     '#00c8ff',
  san_roque:     '#ff7700',
  imbaya:        '#00ffcc',
};

// Extrae el contenido interior del SVG fuente (sin el <svg> envolvente)
const srcSvg = readFileSync(SRC_SVG, 'utf8');
const inner = srcSvg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const overlays = Object.entries(polygons)
  .map(([id, pts]) => {
    const c = COLORS[id] ?? '#ffffff';
    return `
    <polygon points="${pts}" fill="${c}" fill-opacity="0.28" stroke="${c}" stroke-width="10" stroke-linejoin="round" />`;
  })
  .join('');

const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}">
  <rect width="${VB_W}" height="${VB_H}" fill="#111" />
  ${inner}
  ${overlays}
</svg>`;

writeFileSync(OUT_SVG, out);

await sharp(Buffer.from(out))
  .resize(900)
  .png()
  .toFile(OUT_PNG);

console.error(`svg → ${OUT_SVG}`);
console.error(`png → ${OUT_PNG}`);
