// ═════════════════════════ OFF NL BULK SEEDER v2 ═════════════════════════
// Runs during Vercel `prebuild`. Fetches top-NL products from OpenFoodFacts
// via Search-a-licious (modern Elasticsearch endpoint), with cgi fallback,
// retries on 503, and a low retention threshold so partial results still
// ship instead of falling back to an empty placeholder.
//
// To force a refresh locally: `node scripts/seed-off-nl.mjs`
// To skip in CI (e.g. for fast deploys): set SKIP_OFF_SEED=1
// ═══════════════════════════════════════════════════════════════════════

import fs from 'node:fs';
import path from 'node:path';

const OUT          = path.resolve('./src/local_off_nl.js');
const UA           = 'FitnessApp-Seeder/1.0 (luukbogers@outlook.com)';
const PAGES        = 20;
const PAGE_SIZE    = 100;
const PER_PAGE_RETRIES = 3;
const RETRY_DELAY  = 3000;
const PAGE_DELAY   = 1500;
const MIN_KEEP     = 30;
const MAX_FAILURES = 15;
const PAGE_TIMEOUT = 45000;

if (process.env.SKIP_OFF_SEED === '1') {
  console.log('[seed-off-nl] SKIP_OFF_SEED=1 → skipping');
  process.exit(0);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchWithTimeout(url, ms = PAGE_TIMEOUT) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

async function fetchPageSAL(page) {
  const u = new URL('https://search.openfoodfacts.org/search');
  u.searchParams.set('q', '*');
  u.searchParams.set('filter', 'countries_tags:netherlands');
  u.searchParams.set('sort_by', '-unique_scans_n');
  u.searchParams.set('page_size', String(PAGE_SIZE));
  u.searchParams.set('page', String(page));
  u.searchParams.set('fields', 'code,product_name,product_name_nl,brands,nutriments,image_front_small_url');
  const r = await fetchWithTimeout(u.toString());
  if (!r.ok) throw new Error(`SAL HTTP ${r.status}`);
  const d = await r.json();
  const items = d.hits || d.products || [];
  return items.map(h => h._source ? h._source : h);
}

async function fetchPageCGI(page) {
  const u = new URL('https://world.openfoodfacts.org/cgi/search.pl');
  u.searchParams.set('action', 'process');
  u.searchParams.set('json', '1');
  u.searchParams.set('countries_tags', 'netherlands');
  u.searchParams.set('sort_by', 'unique_scans_n');
  u.searchParams.set('page_size', String(PAGE_SIZE));
  u.searchParams.set('page', String(page));
  u.searchParams.set('fields', 'code,product_name,product_name_nl,brands,nutriments,image_front_small_url');
  const r = await fetchWithTimeout(u.toString());
  if (!r.ok) throw new Error(`CGI HTTP ${r.status}`);
  const d = await r.json();
  return d.products || [];
}

async function fetchPageWithRetry(page) {
  let lastErr;
  for (let attempt = 1; attempt <= PER_PAGE_RETRIES; attempt++) {
    const fn = attempt === 2 ? fetchPageCGI : fetchPageSAL;
    const tag = attempt === 2 ? 'CGI' : 'SAL';
    try {
      const items = await fn(page);
      if (items.length > 0) return { items, tag };
      throw new Error(`empty result from ${tag}`);
    } catch (e) {
      lastErr = e;
      if (attempt < PER_PAGE_RETRIES) {
        console.log(`  page ${page} attempt ${attempt} (${tag}) failed: ${e.message} -> retry in ${RETRY_DELAY}ms`);
        await sleep(RETRY_DELAY);
      }
    }
  }
  throw lastErr;
}

function compact(p) {
  const n = p.nutriments || {};
  const kcal = Math.round(parseFloat(n['energy-kcal_100g']) || 0);
  if (!kcal || kcal > 900) return null;
  const name = (p.product_name_nl || p.product_name || '').trim();
  if (!name || name.length < 2 || name.length > 80) return null;
  const brand = Array.isArray(p.brands)
    ? (p.brands[0] || '')
    : String(p.brands || '').split(',')[0];
  return {
    c: p.code,
    n: name,
    b: brand.trim().slice(0, 40),
    k: kcal,
    p: Math.round((parseFloat(n.proteins_100g) || 0) * 10) / 10,
    h: Math.round((parseFloat(n.carbohydrates_100g) || 0) * 10) / 10,
    f: Math.round((parseFloat(n.fat_100g) || 0) * 10) / 10,
    i: (p.image_front_small_url || '').replace('https://images.openfoodfacts.org', ''),
  };
}

async function main() {
  console.log('[seed-off-nl] Fetching top NL products from OpenFoodFacts (SAL + CGI fallback)');
  const all = [];
  let failures = 0;
  for (let page = 1; page <= PAGES; page++) {
    try {
      const { items, tag } = await fetchPageWithRetry(page);
      all.push(...items);
      console.log(`  page ${page}/${PAGES} [${tag}] -> +${items.length} (total ${all.length})`);
    } catch (e) {
      failures++;
      console.warn(`  page ${page}/${PAGES} FAILED after ${PER_PAGE_RETRIES} attempts: ${e.message}`);
      if (failures >= MAX_FAILURES) {
        console.warn(`[seed-off-nl] ${failures} failures, aborting fetch (kept ${all.length} so far)`);
        break;
      }
    }
    await sleep(PAGE_DELAY);
  }

  const seen = new Set();
  const out = [];
  for (const p of all) {
    if (!p.code || seen.has(p.code)) continue;
    const c = compact(p);
    if (!c) continue;
    seen.add(p.code);
    out.push(c);
  }

  console.log(`[seed-off-nl] Compacted ${out.length} valid products (from ${all.length} raw)`);

  if (out.length < MIN_KEEP) {
    console.warn(`[seed-off-nl] Only ${out.length} valid (< ${MIN_KEEP}). Keeping existing file.`);
    process.exit(0);
  }

  const ts = new Date().toISOString();
  const body =
    '// AUTO-GENERATED by scripts/seed-off-nl.mjs - DO NOT EDIT BY HAND\n' +
    '// Top NL products from OpenFoodFacts, sorted by unique_scans_n\n' +
    `// Generated: ${ts}\n` +
    `// Count: ${out.length}\n` +
    '// Schema: c=code, n=name, b=brand, k=kcal/100g, p=protein, h=carbs, f=fat, i=image\n' +
    '\n' +
    `export const OFF_NL_GENERATED_AT = '${ts}';\n` +
    `export const OFF_NL = ${JSON.stringify(out)};\n`;

  fs.writeFileSync(OUT, body);
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log(`[seed-off-nl] OK Wrote ${out.length} products to src/local_off_nl.js (${kb} KB)`);
}

main().catch(e => {
  console.error('[seed-off-nl] Fatal:', e.message);
  console.warn('[seed-off-nl] Keeping existing local_off_nl.js (no overwrite on failure)');
  process.exit(0);
});
