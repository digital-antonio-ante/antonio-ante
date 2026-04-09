/**
 * validate-seo.ts — Post-build SEO validation script
 *
 * Verifies every HTML page in dist/ has:
 *   - Unique <title>
 *   - meta description
 *   - Open Graph tags (og:title, og:description, og:image, og:url, og:type)
 *   - Twitter Card tags (twitter:card, twitter:title, twitter:description)
 *   - Canonical link
 *   - Lang attribute on <html>
 *
 * Run: npx tsx scripts/validate-seo.ts
 * Exit code 1 if any page fails — designed for CI pipelines.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// ─── Configuration ───────────────────────────────────────────────────────────

const DIST_DIR = join(import.meta.dirname ?? '.', '..', 'dist');

const REQUIRED_META = [
  { name: 'description', attr: 'name' },
  { name: 'og:title', attr: 'property' },
  { name: 'og:description', attr: 'property' },
  { name: 'og:image', attr: 'property' },
  { name: 'og:url', attr: 'property' },
  { name: 'og:type', attr: 'property' },
  { name: 'twitter:card', attr: 'name' },
  { name: 'twitter:title', attr: 'name' },
  { name: 'twitter:description', attr: 'name' },
] as const;

// ─── HTML Scanning ───────────────────────────────────────────────────────────

function findHtmlFiles(dir: string): string[] {
  const results: string[] = [];

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
      results.push(...findHtmlFiles(fullPath));
    } else if (entry.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

// ─── Meta-tag Extraction (regex-based, no DOM dependency) ────────────────────
// Trade-off: regex vs. full DOM parser (like node-html-parser).
// For build validation of Astro-generated HTML, regex is sufficient and
// avoids adding a runtime dependency. Production HTML is well-formed.

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}

function hasMetaTag(html: string, name: string, attr: string): boolean {
  // Matches both content-before-name and name-before-content orders
  const pattern = new RegExp(
    `<meta\\s+[^>]*(?:${attr}=["']${escapeRegex(name)}["'][^>]*content=["'][^"']+["']|content=["'][^"']+["'][^>]*${attr}=["']${escapeRegex(name)}["'])[^>]*/?>`,
    'i'
  );
  return pattern.test(html);
}

function hasCanonical(html: string): boolean {
  return /<link\s+[^>]*rel=["']canonical["'][^>]*href=["'][^"']+["'][^>]*\/?>/i.test(html);
}

function hasLangAttribute(html: string): boolean {
  return /<html[^>]*\slang=["'][^"']+["']/i.test(html);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Validation ──────────────────────────────────────────────────────────────

interface PageResult {
  file: string;
  errors: string[];
  title: string | null;
}

function validatePage(filePath: string): PageResult {
  const html = readFileSync(filePath, 'utf-8');
  const file = relative(DIST_DIR, filePath);
  const errors: string[] = [];

  // Title
  const title = extractTitle(html);
  if (!title) {
    errors.push('Missing <title>');
  }

  // Meta tags
  for (const meta of REQUIRED_META) {
    if (!hasMetaTag(html, meta.name, meta.attr)) {
      errors.push(`Missing <meta ${meta.attr}="${meta.name}">`);
    }
  }

  // Canonical
  if (!hasCanonical(html)) {
    errors.push('Missing <link rel="canonical">');
  }

  // Lang attribute
  if (!hasLangAttribute(html)) {
    errors.push('Missing lang attribute on <html>');
  }

  return { file, errors, title };
}

function checkUniqueTitles(results: PageResult[]): string[] {
  const titleMap = new Map<string, string[]>();
  const duplicateErrors: string[] = [];

  for (const result of results) {
    if (!result.title) continue;
    const pages = titleMap.get(result.title) ?? [];
    pages.push(result.file);
    titleMap.set(result.title, pages);
  }

  for (const [title, pages] of titleMap) {
    if (pages.length > 1) {
      duplicateErrors.push(`Duplicate title "${title}" in: ${pages.join(', ')}`);
    }
  }

  return duplicateErrors;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  const files = findHtmlFiles(DIST_DIR);

  if (files.length === 0) {
    // eslint-disable-next-line no-console
    console.error(`[validate-seo] No HTML files found in ${DIST_DIR}`);
    // eslint-disable-next-line no-console
    console.error('Run "npm run build" first.');
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`[validate-seo] Scanning ${files.length} HTML file(s)...\n`);

  const results = files.map(validatePage);
  const duplicateErrors = checkUniqueTitles(results);

  let totalErrors = 0;
  let passedPages = 0;

  for (const result of results) {
    if (result.errors.length === 0) {
      passedPages++;
      continue;
    }
    totalErrors += result.errors.length;
    // eslint-disable-next-line no-console
    console.error(`FAIL  ${result.file}`);
    for (const error of result.errors) {
      // eslint-disable-next-line no-console
      console.error(`  - ${error}`);
    }
  }

  if (duplicateErrors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('\nDUPLICATE TITLES:');
    for (const err of duplicateErrors) {
      totalErrors++;
      // eslint-disable-next-line no-console
      console.error(`  - ${err}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `\n[validate-seo] ${passedPages}/${results.length} pages passed, ${totalErrors} error(s) total.`
  );

  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
