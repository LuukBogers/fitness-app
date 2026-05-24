import { useState, useEffect, useRef, useMemo } from "react";
import { t, useT, useApp, useLang } from './lib';
import { Icon, Btn } from './shared';
import { Toast } from './modals';
import { searchLocalFoods, NL_EN_FOOD } from './local_foods';
import { OFF_NL } from './local_off_nl';

// Substring search over the bulk-fetched top-NL OpenFoodFacts dataset.
// Compact schema {c,n,b,k,p,h,f,i} → standard product shape.
function searchOffNl(query, limit = 8) {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 2) return [];
  const hits = [];
  for (const item of OFF_NL) {
    const nameMatch = (item.n || '').toLowerCase().includes(q);
    const brandMatch = (item.b || '').toLowerCase().includes(q);
    if (nameMatch || brandMatch) {
      hits.push({
        id: 'offnl:' + item.c,
        name: item.n,
        brand: item.b || '',
        kcal: item.k,
        p: item.p,
        c: item.h,
        f: item.f,
        image: item.i ? 'https://images.openfoodfacts.org' + item.i : null,
        source: 'off_nl',
        barcode: item.c,
      });
      if (hits.length >= limit) break;
    }
  }
  return hits;
}

/* ═══════════════════════════ MODULE A2: LOG LIBRARY ═══════════════════════════
 * Multi-source food search:
 *   1. User's own products (local)
 *   2. NEVO basis-voeding (~255 items, embedded, 0ms)
 *   3. OpenFoodFacts via Search-a-licious (new Elasticsearch endpoint, since OFF
 *      legacy cgi/search.pl returns 503s globally since April 2026)
 *   4. USDA FoodData Central (~380K items, parallel, NL→EN translation layer)
 *
 * localStorage cache: last 50 queries, 1-day TTL, instant repeat searches.
 * ═══════════════════════════════════════════════════════════════════════════ */

const SEARCHALICIOUS = 'https://search.openfoodfacts.org/search';
const OFF_V1_CGI = 'https://world.openfoodfacts.org/cgi/search.pl';
const OFF_V2_SEARCH = 'https://world.openfoodfacts.org/api/v2/search';
const USDA_API = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const USDA_KEY = 'DEMO_KEY'; // 30 req/hr per IP — fine for low traffic, user can swap

// localStorage cache helpers — version-prefixed to bust stale entries when format changes
const CACHE_KEY_PREFIX = 'foodsearch:v3:';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day

function cacheGet(query) {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + query);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY_PREFIX + query);
      return null;
    }
    return data;
  } catch (e) { return null; }
}
function cacheSet(query, data) {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + query, JSON.stringify({ ts: Date.now(), data }));
    // Trim cache: keep newest 50 entries
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX));
    if (keys.length > 50) {
      const sorted = keys.map(k => {
        try { return { k, ts: JSON.parse(localStorage.getItem(k)).ts }; } catch { return { k, ts: 0 }; }
      }).sort((a, b) => a.ts - b.ts);
      sorted.slice(0, sorted.length - 50).forEach(({ k }) => localStorage.removeItem(k));
    }
  } catch (e) {}
}

// Map an OFF search hit (Search-a-licious or v2) → product-shape.
// Search-a-licious may wrap docs in { _source: {...} } (Elasticsearch style)
// or return them flat. Handle both.
function offToProduct(raw) {
  const p = raw && raw._source ? raw._source : raw || {};
  const n = p.nutriments || {};
  let kcal = n['energy-kcal_100g'];
  if (kcal == null && n['energy_100g']) kcal = n['energy_100g'] / 4.184;
  if (kcal == null) kcal = p['energy-kcal_100g'] || 0;
  const id = 'off:' + (p.code || raw?._id || p._id || p.id || '');
  const name = p.product_name_nl || p.product_name || p.product_name_en || p.generic_name || (p.product_name_localized && (p.product_name_localized.nl || p.product_name_localized.en)) || 'Unknown product';
  // Parse quantity ("500 g", "1.5 L", "330ml") → default portion suggestion
  let defaultPortion = null;
  if (p.quantity) {
    const q = String(p.quantity).toLowerCase().replace(',', '.');
    const m = q.match(/([\d.]+)\s*(kg|g|l|ml|cl)/);
    if (m) {
      let val = parseFloat(m[1]);
      const unit = m[2];
      let liquid = false;
      if (unit === 'kg') val *= 1000;
      else if (unit === 'l') { val *= 1000; liquid = true; }
      else if (unit === 'cl') { val *= 10; liquid = true; }
      else if (unit === 'ml') liquid = true;
      defaultPortion = {
        id: 'default',
        name: liquid ? 'Bottle' : 'Pack',
        ...(liquid ? { ml: Math.round(val) } : { g: Math.round(val) }),
        makeDefault: true,
      };
    }
  }
  if (!defaultPortion) {
    defaultPortion = { id: 'default', name: 'Portion', g: 100, makeDefault: true };
  }
  return {
    id,
    name,
    brand: (Array.isArray(p.brands) ? (p.brands[0] || '') : String(p.brands || '').split(',')[0]).trim(),
    image: p.image_front_small_url || p.image_small_url || p.image_url || null,
    kcal: Math.round(kcal || 0),
    p: Math.round((n.proteins_100g || 0) * 10) / 10,
    c: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
    f: Math.round((n.fat_100g || 0) * 10) / 10,
    barcode: p.code || '',
    quantity: p.quantity || '',
    store: '', shelf: 'shelf', favorite: false,
    defaultPortion,
    source: p._src === 'usda' ? 'usda' : 'openfoodfacts',
  };
}

// Map USDA FoodData Central food → product-shape
function usdaToProduct(food) {
  const nutrients = food.foodNutrients || [];
  const findN = (id) => {
    const found = nutrients.find(n => n.nutrientId === id || n.nutrient?.id === id);
    return found ? (found.value ?? found.amount ?? 0) : 0;
  };
  // USDA nutrient IDs: 1008=Energy(kcal), 1003=Protein, 1005=Carbs, 1004=Fat
  let kcal = findN(1008);
  if (!kcal) {
    const kj = findN(1062); // Energy in kJ
    if (kj) kcal = kj / 4.184;
  }
  const name = (food.description || '').trim();
  return {
    id: 'usda:' + food.fdcId,
    name,
    brand: (food.brandOwner || food.brandName || '').trim(),
    image: null,
    kcal: Math.round(kcal || 0),
    p: Math.round((findN(1003) || 0) * 10) / 10,
    c: Math.round((findN(1005) || 0) * 10) / 10,
    f: Math.round((findN(1004) || 0) * 10) / 10,
    store: '',
    shelf: 'shelf',
    favorite: false,
    defaultPortion: { id: 'default', name: 'Portion', g: 100, makeDefault: true },
    source: 'usda',
  };
}

export function LogLibrary({ onProductTap, onOpenBarcode, onProductActions, onRecipeActions, onlyRecipes, onAddProduct, onAddMeal }) {
  const T = useT();
  const { lang } = useLang();
  const { profile, saveProfileData } = useApp();
  const products = useMemo(() => Array.isArray(profile?.data?.products) ? profile.data.products : [], [profile]);
  const recipes  = useMemo(() => Array.isArray(profile?.data?.recipes)  ? profile.data.recipes  : [], [profile]);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(onlyRecipes ? 'meals' : 'all'); // favorites | all | meals | aiscans
  const [webHits, setWebHits] = useState([]);
  const [webLoading, setWebLoading] = useState(false);
  const [webError, setWebError] = useState(false);
  const [toast, setToast] = useState('');
  const debounceRef = useRef(null);
  const fetchSeq = useRef(0);

  // Score how well a product name matches the query (higher = better)
  const rankHit = (name, q) => {
    if (!q) return 0;
    const n = (name || '').toLowerCase();
    const query = q.toLowerCase().trim();
    if (n === query) return 100;
    if (n.startsWith(query + ' ')) return 90;
    if (n.startsWith(query)) return 80;
    // Exact word match (word boundary)
    if (n.split(/[\s,()-]+/).includes(query)) return 70;
    if (n.includes(' ' + query + ' ') || n.endsWith(' ' + query)) return 60;
    if (n.includes(query)) return 20;
    return 0;
  };

  // Debounced multi-source web search: Search-a-licious (OFF) + USDA, with cache
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2 || filter === 'favorites' || filter === 'meals' || filter === 'aiscans') {
      setWebHits([]); setWebLoading(false); setWebError(false);
      return;
    }

    // Instant cache hit?
    const cacheKey = `${lang || 'nl'}:${q.toLowerCase()}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      setWebHits(cached);
      setWebLoading(false);
      setWebError(false);
      return;
    }

    setWebLoading(true);
    debounceRef.current = setTimeout(async () => {
      const seq = ++fetchSeq.current;

      // Single call to Vercel serverless proxy (bypasses CORS).
      // Proxy fans out to 4 sources (Search-a-licious, OFF cgi v1, OFF v2, USDA)
      // server-side and returns merged + deduped products.
      const offPromise = (async () => {
        try {
          const u = new URL('/api/foodsearch', window.location.origin);
          u.searchParams.set('q', q);
          u.searchParams.set('lang', lang || 'nl');
          const res = await fetch(u.toString());
          if (!res.ok) { console.warn('[proxy]', res.status); return []; }
          const data = await res.json();
          console.log('[proxy] ms=', data.ms, 'status=', data.status, 'products=', (data.products || []).length);
          return (data.products || []).map(offToProduct);
        } catch (e) {
          console.warn('[proxy] err', e?.message);
          return [];
        }
      })();

      // USDA is handled inside the proxy too — no separate client-side call needed
      const usdaPromise = Promise.resolve([]);

      try {
        const [offList, usdaList] = await Promise.all([offPromise, usdaPromise]);
        if (seq !== fetchSeq.current) return; // stale

        // Trust the API's own relevance ranking - DON'T double-filter on substring match.
        // Keep products even without kcal data - user can fill in manually (Option B).
        const merged = [...offList, ...usdaList]
          .filter(p => p.name && p.name !== 'Unknown product');

        const seen = new Set();
        const deduped = [];
        for (const p of merged) {
          // Full name + brand as dedupe key — no truncation, so flavour variants stay distinct
          const key = ((p.name || '') + '|' + (p.brand || '')).toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(p);
          if (deduped.length >= 50) break;
        }

        setWebHits(deduped);
        setWebError(deduped.length === 0 && offList.length === 0 && usdaList.length === 0);
        // Cache only non-empty result sets
        if (deduped.length > 0) cacheSet(cacheKey, deduped);
      } catch (e) {
        if (seq !== fetchSeq.current) return;
        setWebHits([]); setWebError(true);
      } finally {
        if (seq === fetchSeq.current) setWebLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, filter, lang]);

  // Local filter
  const localHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products;
    if (filter === 'favorites') list = list.filter(p => p.favorite === true);
    if (filter === 'aiscans')   list = list.filter(p => p.source === 'aiscan');
    if (q.length >= 1) list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q));
    return list;
  }, [products, query, filter]);

  // Recipes hits (when filter = meals)
  const recipeHits = useMemo(() => {
    if (filter !== 'meals') return [];
    const q = query.trim().toLowerCase();
    let list = recipes;
    if (q.length >= 1) list = list.filter(r => (r.name || '').toLowerCase().includes(q));
    return list;
  }, [recipes, query, filter]);

  // Local NL foods (NEVO-style basis-data, instant, no API)
  const localFoodHits = useMemo(() => {
    if (filter === 'favorites' || filter === 'meals' || filter === 'aiscans') return [];
    const q = query.trim();
    if (!q) return [];
    // Dedupe against local custom products (same name)
    const localNames = new Set(localHits.map(p => (p.name || '').toLowerCase()));
    return searchLocalFoods(q, 15).filter(f => !localNames.has(f.name.toLowerCase()));
  }, [query, filter, localHits]);

  // Top-2000 NL OpenFoodFacts (instant, baked into bundle at build time)
  const offNlHits = useMemo(() => {
    if (filter === 'favorites' || filter === 'meals' || filter === 'aiscans') return [];
    const q = query.trim();
    if (!q) return [];
    const seenKeys = new Set([
      ...localHits.map(p => (p.name + '|' + (p.brand || '')).toLowerCase()),
      ...localFoodHits.map(p => p.name.toLowerCase()),
    ]);
    return searchOffNl(q, 20).filter(p =>
      !seenKeys.has((p.name + '|' + p.brand).toLowerCase()) &&
      !seenKeys.has(p.name.toLowerCase())
    );
  }, [query, filter, localHits, localFoodHits]);

  // Dedupe web hits against local + NEVO + OFF_NL bulk
  const webHitsDedupe = useMemo(() => {
    const seen = new Set([
      ...localHits.map(p => (p.name + '|' + (p.brand || '')).toLowerCase()),
      ...localFoodHits.map(p => p.name.toLowerCase()),
      ...offNlHits.map(p => (p.name + '|' + (p.brand || '')).toLowerCase()),
      ...offNlHits.map(p => p.barcode).filter(Boolean),
    ]);
    return webHits.filter(p => {
      const key1 = (p.name + '|' + (p.brand || '')).toLowerCase();
      const key2 = p.name.toLowerCase();
      const key3 = p.barcode || '';
      return !seen.has(key1) && !seen.has(key2) && !seen.has(key3);
    });
  }, [webHits, localHits, localFoodHits, offNlHits]);

  const toggleFavorite = async (productId, e) => {
    e.stopPropagation();
    const updated = products.map(p => p.id === productId ? { ...p, favorite: !p.favorite } : p);
    await saveProfileData({ products: updated });
    const flipped = updated.find(p => p.id === productId);
    setToast(flipped?.favorite ? T('log.toast.fav.added') : T('log.toast.fav.removed'));
    setTimeout(() => setToast(''), 1600);
  };

  const handleProductTap = (p) => onProductTap?.(p);

  const filters = [
    { k: 'favorites', l: T('log.filter.favorites'), icon: 'heart' },
    { k: 'all',       l: T('log.filter.all'),       icon: null },
    { k: 'meals',     l: T('log.filter.meals'),     icon: null },
    { k: 'aiscans',   l: T('log.filter.aiscans'),   icon: null },
  ];

  const showEmpty = !query.trim() && localHits.length === 0 && recipeHits.length === 0 && webHits.length === 0 && localFoodHits.length === 0;

  return (
    <div style={{ position: 'relative' }}>
      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon name="search" size={16} color={t.muted} />
        </div>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={T('log.searchproducts')}
          style={{
            width: '100%', padding: '13px 40px 13px 40px',
            borderRadius: 14, border: `1px solid ${t.border}`,
            fontSize: 15, color: t.text, background: t.card,
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            boxShadow: t.cardShadow,
          }}
        />
        {query && (
          <div onClick={() => setQuery('')} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            width: 24, height: 24, borderRadius: 12, background: t.card3,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Icon name="x" size={12} color={t.soft} />
          </div>
        )}
      </div>

      {/* Filter chips */}
      <div data-no-swipe="true" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
        {filters.map(f => {
          const active = filter === f.k;
          return (
            <div key={f.k} onClick={() => setFilter(f.k)} style={{
              padding: '8px 14px', borderRadius: 999,
              background: active ? t.greenBg : t.card,
              border: `1px solid ${active ? t.greenBorder : t.border}`,
              color: active ? t.green : t.soft,
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
              flexShrink: 0,
            }}>
              {f.icon === 'heart' && <span style={{ fontSize: 13 }}>{active ? '♥' : '♡'}</span>}
              {f.l}
            </div>
          );
        })}
      </div>

      {/* Result list */}
      <div style={{ paddingBottom: 8 }}>
        {/* Context-aware add CTA — per filter */}
        {filter === 'meals' && onAddMeal && (
          <div onClick={onAddMeal} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14,
            background: t.greenBg, border: `1px dashed ${t.greenBorder}`, marginBottom: 10, cursor: 'pointer',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: t.greenBg, border: `1px solid ${t.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="plus" size={18} color={t.green} />
            </div>
            <div style={{ fontSize: 14, color: t.green, fontWeight: 700 }}>{T('log.addmeal')}</div>
          </div>
        )}
        {(filter === 'all' || filter === 'favorites') && onAddProduct && (
          <div onClick={onAddProduct} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14,
            background: t.greenBg, border: `1px dashed ${t.greenBorder}`, marginBottom: 10, cursor: 'pointer',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: t.greenBg, border: `1px solid ${t.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="plus" size={18} color={t.green} />
            </div>
            <div style={{ fontSize: 14, color: t.green, fontWeight: 700 }}>{T('log.addproduct')}</div>
          </div>
        )}

        {/* Empty state */}
        {showEmpty && (
          <div style={{ padding: 32, textAlign: 'center', borderRadius: 16, background: t.card, border: `1px dashed ${t.border}` }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 14, color: t.text, fontWeight: 600, marginBottom: 6 }}>{T('log.empty.title')}</div>
            <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>{T('log.empty.body')}</div>
          </div>
        )}

        {/* Local + filtered results */}
        {filter !== 'meals' && localHits.map(p => (
          <ProductRow key={p.id} product={p} onTap={() => handleProductTap(p)} onFav={(e) => toggleFavorite(p.id, e)} onActions={onProductActions ? (e) => { e.stopPropagation(); onProductActions(p); } : null} />
        ))}

        {/* NEVO local NL foods (RIVM-style basis-voeding) */}
        {filter !== 'meals' && localFoodHits.length > 0 && (
          <>
            {localHits.length > 0 && (
              <div style={{ fontSize: 10.5, color: t.muted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 4px 8px' }}>
                {T('log.nevo.section')}
              </div>
            )}
            {localFoodHits.map(p => (
              <ProductRow key={p.id} product={p} onTap={() => handleProductTap(p)} isNevo />
            ))}
          </>
        )}

        {/* OFF_NL bulk top-2000 Nederlandse producten (baked at build time) */}
        {filter !== 'meals' && offNlHits.length > 0 && (
          <>
            <div style={{ fontSize: 10.5, color: t.muted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 4px 8px' }}>
              {T('log.offnl.section')}
            </div>
            {offNlHits.map(p => (
              <ProductRow key={p.id} product={p} onTap={() => handleProductTap(p)} isOffNl />
            ))}
          </>
        )}

        {/* Recipe results when filter = meals */}
        {filter === 'meals' && recipeHits.length > 0 && recipeHits.map(r => (
          <div key={r.id} onClick={() => onProductTap?.({ ...r, isRecipe: true })} style={{
            display: 'flex', gap: 12, padding: 12, marginBottom: 8,
            background: t.card, borderRadius: 14, border: `1px solid ${t.border}`,
            boxShadow: t.cardShadow, cursor: 'pointer', alignItems: 'center',
          }}>
            {r.image ? (
              <img src={r.image} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 10, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🍽️</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 3 }}>{r.name}</div>
              <div style={{ fontSize: 11.5, color: t.muted }}>{r.kcal} kcal · {(r.items||[]).length} {T('nutr.products')}</div>
            </div>
            {onRecipeActions && (
              <div onClick={(e) => { e.stopPropagation(); onRecipeActions(r); }} style={{
                width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: t.soft, fontSize: 18, cursor: 'pointer', flexShrink: 0,
                letterSpacing: '0.1em',
              }}>⋯</div>
            )}
          </div>
        ))}

        {filter === 'meals' && recipeHits.length === 0 && !query.trim() && (
          <div style={{ padding: 28, textAlign: 'center', borderRadius: 16, background: t.card, border: `1px dashed ${t.border}` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🍽️</div>
            <div style={{ fontSize: 13, color: t.muted }}>{T('log.empty.meals')}</div>
          </div>
        )}

        {/* Web (OpenFoodFacts) results */}
        {filter !== 'meals' && webHitsDedupe.length > 0 && (
          <>
            <div style={{ fontSize: 10.5, color: t.muted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 4px 8px' }}>
              {T('log.web.section')}
            </div>
            {webHitsDedupe.map(p => (
              <ProductRow key={p.id} product={p} onTap={() => handleProductTap(p)} isWeb />
            ))}
          </>
        )}

        {/* Web loading */}
        {webLoading && query.trim().length >= 2 && filter !== 'meals' && (
          <div style={{ padding: 18, textAlign: 'center', color: t.muted, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, border: `2px solid ${t.border}`, borderTopColor: t.green, animation: 'spin 0.8s linear infinite' }} />
            {T('log.web.searching')}
          </div>
        )}

        {/* Web error fallback */}
        {webError && !webLoading && query.trim().length >= 2 && (
          <div style={{ padding: 14, textAlign: 'center', color: t.muted, fontSize: 12 }}>
            {T('log.web.offline')}
          </div>
        )}

        {/* OFF attribution */}
        {filter !== 'meals' && (webHitsDedupe.length > 0 || webLoading) && (
          <div style={{ textAlign: 'center', padding: '12px 0 0', fontSize: 10, color: t.dim }}>
            {T('log.openfoodfacts.attribution')}
          </div>
        )}
      </div>

      {/* Bottom action pills (sticky inside tab — appear above bottom nav) */}
      <div style={{
        position: 'sticky', bottom: 8, marginTop: 16,
        display: 'flex', gap: 8, padding: '8px',
        background: 'rgba(10,10,11,0.85)', backdropFilter: 'blur(20px)',
        borderRadius: 18, border: `1px solid ${t.border}`,
        boxShadow: t.softShadow,
        zIndex: 5,
      }}>
        <div
          onClick={() => { setToast(T('log.action.aiscan.soon')); setTimeout(() => setToast(''), 2000); }}
          style={{
            flex: 1, padding: '12px 8px', borderRadius: 12,
            background: t.card2, border: `1px solid ${t.border}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            cursor: 'pointer', color: t.soft, fontSize: 11, fontWeight: 700,
          }}
        >
          <Icon name="photo" size={18} color={t.soft} />
          {T('log.action.aiscan')}
        </div>
        <div style={{
          flex: 1, padding: '12px 8px', borderRadius: 12,
          background: t.greenBg, border: `1px solid ${t.greenBorder}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          color: t.green, fontSize: 11, fontWeight: 700,
        }}>
          <Icon name="search" size={18} color={t.green} />
          {T('log.action.search')}
        </div>
        <div
          onClick={onOpenBarcode}
          style={{
            flex: 1, padding: '12px 8px', borderRadius: 12,
            background: t.card2, border: `1px solid ${t.border}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            cursor: 'pointer', color: t.soft, fontSize: 11, fontWeight: 700,
          }}
        >
          <Icon name="scan" size={18} color={t.soft} />
          {T('log.action.barcode')}
        </div>
      </div>

      <Toast message={toast} visible={!!toast} />
    </div>
  );
}

/* ─────────────────────── ProductRow ─────────────────────── */
function ProductRow({ product, onTap, onFav, onActions, isWeb, isNevo, isOffNl }) {
  const T = useT();
  const isFav = product.favorite === true;
  return (
    <div onClick={onTap} style={{
      display: 'flex', gap: 12, padding: 12, marginBottom: 8,
      background: t.card, borderRadius: 14, border: `1px solid ${t.border}`,
      cursor: 'pointer', boxShadow: t.cardShadow, position: 'relative',
    }}>
      {product.image ? (
        <img src={product.image} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', background: '#fff', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 44, height: 44, borderRadius: 10, background: isNevo ? t.greenBg : t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: isNevo ? `1px solid ${t.greenBorder}` : 'none' }}>
          <Icon name={isNevo ? 'apple' : 'photo'} size={20} color={isNevo ? t.green : t.muted} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{product.name}</div>
          {isWeb && (
            <span style={{
              fontSize: 9,
              color: product.source === 'usda' ? '#f97316' : t.glow,
              fontWeight: 700,
              background: product.source === 'usda' ? 'rgba(200,177,138,0.12)' : 'rgba(184,197,214,0.12)',
              padding: '2px 6px', borderRadius: 5,
              letterSpacing: '0.05em', flexShrink: 0,
              border: product.source === 'usda' ? '1px solid rgba(249,115,22,0.35)' : '1px solid rgba(139,233,255,0.3)',
            }}>{product.source === 'usda' ? 'USDA' : T('log.web.badge')}</span>
          )}
          {isNevo && (
            <span style={{
              fontSize: 9, color: t.green, fontWeight: 700,
              background: t.greenBg, padding: '2px 6px', borderRadius: 5,
              letterSpacing: '0.05em', flexShrink: 0, border: `1px solid ${t.greenBorder}`,
            }}>NEVO</span>
          )}
          {isOffNl && (
            <span style={{
              fontSize: 9, color: '#C8B18A', fontWeight: 700,
              background: 'rgba(200,177,138,0.12)', padding: '2px 6px', borderRadius: 5,
              letterSpacing: '0.05em', flexShrink: 0, border: '1px solid rgba(249,115,22,0.35)',
            }}>NL</span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: product.kcal > 0 ? t.muted : t.orange, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.kcal > 0
            ? `${product.kcal} kcal · ${T('common.per100g')}${product.brand ? ` · ${product.brand}` : ''}`
            : `${T('log.nokcal')}${product.brand ? ` · ${product.brand}` : ''}`}
        </div>
      </div>
      {!isWeb && !isNevo && !isOffNl && onFav && (
        <div onClick={onFav} style={{
          width: 32, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isFav ? t.error : t.muted, fontSize: 20, cursor: 'pointer',
          flexShrink: 0, alignSelf: 'center',
        }}>
          {isFav ? '♥' : '♡'}
        </div>
      )}
      {!isWeb && !isNevo && !isOffNl && onActions && (
        <div onClick={onActions} style={{
          width: 28, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: t.soft, fontSize: 18, cursor: 'pointer',
          flexShrink: 0, alignSelf: 'center', letterSpacing: '0.1em',
        }}>⋯</div>
      )}
    </div>
  );
}
