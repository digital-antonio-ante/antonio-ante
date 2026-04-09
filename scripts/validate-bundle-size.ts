/**
 * validate-bundle-size.ts — Post-build Performance Budget enforcement
 *
 * Budgets:
 *   - Initial JS bundle: <= 50 KB (gzipped)
 *   - Initial CSS bundle: <= 30 KB (gzipped)
 *   - Single HTML page:   <= 100 KB (raw)
 *   - Total dist size:    <= 5 MB (raw)
 *
 * Run: npx tsx scripts/validate-bundle-size.ts
 * Exit code 1 if any budget is exceeded — designed for CI pipelines.
 *
 * Trade-off: gzip estimation uses zlib.gzipSync for accuracy; adds ~50ms
 * to script runtime but gives true over-the-wire sizes.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, extname, relative } from 'node:path';

// ─── Budget Configuration (bytes) ────────────────────────────────────────────

const BUDGETS = {
  JS_INITIAL_GZIP: 50 * 1024, //  50 KB gzipped
  CSS_INITIAL_GZIP: 30 * 1024, //  30 KB gzipped
  HTML_PAGE_RAW: 100 * 1024, // 100 KB raw
  TOTAL_DIST_RAW: 5 * 1024 * 1024, //   5 MB raw
} as const;

const DIST_DIR = join(import.meta.dirname ?? '.', '..', 'dist');

// ─── File Scanning ───────────────────────────────────────────────────────────

interface FileInfo {
  path: string;
  rawSize: number;
  gzipSize: number;
}

function scanDir(dir: string, ext?: string): FileInfo[] {
  const results: FileInfo[] = [];

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath, { throwIfNoEntry: false });
    if (!stat) continue;
    if (stat.isDirectory()) {
      results.push(...scanDir(fullPath, ext));
    } else if (!ext || extname(entry) === ext) {
      const content = readFileSync(fullPath);
      results.push({
        path: relative(DIST_DIR, fullPath),
        rawSize: content.byteLength,
        gzipSize: gzipSync(content, { level: 9 }).byteLength,
      });
    }
  }
  return results;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// ─── Validation ──────────────────────────────────────────────────────────────

function main(): void {
  const jsFiles = scanDir(DIST_DIR, '.js');
  const cssFiles = scanDir(DIST_DIR, '.css');
  const htmlFiles = scanDir(DIST_DIR, '.html');
  const allFiles = scanDir(DIST_DIR);

  if (allFiles.length === 0) {
    // eslint-disable-next-line no-console
    console.error(`[bundle-size] No files found in ${DIST_DIR}. Run "npm run build" first.`);
    process.exit(1);
  }

  const errors: string[] = [];

  // eslint-disable-next-line no-console
  console.log('[bundle-size] Performance Budget Report\n');

  // ── JS Budget ────────────────────────────────────────────────────────────
  const totalJsGzip = jsFiles.reduce((sum, f) => sum + f.gzipSize, 0);
  const jsStatus = totalJsGzip <= BUDGETS.JS_INITIAL_GZIP ? 'PASS' : 'FAIL';
  // eslint-disable-next-line no-console
  console.log(
    `${jsStatus}  JS total (gzip): ${formatSize(totalJsGzip)} / ${formatSize(BUDGETS.JS_INITIAL_GZIP)}`
  );
  if (jsFiles.length > 0) {
    for (const f of jsFiles.sort((a, b) => b.gzipSize - a.gzipSize).slice(0, 5)) {
      // eslint-disable-next-line no-console
      console.log(`       ${f.path} — ${formatSize(f.gzipSize)} gzip`);
    }
  }
  if (jsStatus === 'FAIL') {
    errors.push(
      `JS bundle (${formatSize(totalJsGzip)} gzip) exceeds budget (${formatSize(BUDGETS.JS_INITIAL_GZIP)})`
    );
  }

  // ── CSS Budget ───────────────────────────────────────────────────────────
  const totalCssGzip = cssFiles.reduce((sum, f) => sum + f.gzipSize, 0);
  const cssStatus = totalCssGzip <= BUDGETS.CSS_INITIAL_GZIP ? 'PASS' : 'FAIL';
  // eslint-disable-next-line no-console
  console.log(
    `\n${cssStatus}  CSS total (gzip): ${formatSize(totalCssGzip)} / ${formatSize(BUDGETS.CSS_INITIAL_GZIP)}`
  );
  if (cssStatus === 'FAIL') {
    errors.push(
      `CSS bundle (${formatSize(totalCssGzip)} gzip) exceeds budget (${formatSize(BUDGETS.CSS_INITIAL_GZIP)})`
    );
  }

  // ── HTML Page Budget ─────────────────────────────────────────────────────
  // eslint-disable-next-line no-console
  console.log('');
  for (const f of htmlFiles) {
    const status = f.rawSize <= BUDGETS.HTML_PAGE_RAW ? 'PASS' : 'FAIL';
    // eslint-disable-next-line no-console
    console.log(`${status}  ${f.path} — ${formatSize(f.rawSize)} raw`);
    if (status === 'FAIL') {
      errors.push(
        `HTML page ${f.path} (${formatSize(f.rawSize)}) exceeds ${formatSize(BUDGETS.HTML_PAGE_RAW)}`
      );
    }
  }

  // ── Total Dist Budget ────────────────────────────────────────────────────
  const totalDist = allFiles.reduce((sum, f) => sum + f.rawSize, 0);
  const distStatus = totalDist <= BUDGETS.TOTAL_DIST_RAW ? 'PASS' : 'FAIL';
  // eslint-disable-next-line no-console
  console.log(
    `\n${distStatus}  Total dist: ${formatSize(totalDist)} / ${formatSize(BUDGETS.TOTAL_DIST_RAW)} (${allFiles.length} files)`
  );
  if (distStatus === 'FAIL') {
    errors.push(
      `Total dist (${formatSize(totalDist)}) exceeds budget (${formatSize(BUDGETS.TOTAL_DIST_RAW)})`
    );
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  // eslint-disable-next-line no-console
  console.log(
    `\n[bundle-size] ${errors.length === 0 ? 'All budgets passed.' : `${errors.length} budget(s) exceeded.`}`
  );

  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('\nBudget violations:');
    for (const err of errors) {
      // eslint-disable-next-line no-console
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
}

main();
