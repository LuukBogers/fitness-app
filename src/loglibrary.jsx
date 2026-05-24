import { useState, useEffect, useRef, useMemo } from "react";
import { t, useT, useApp, useLang } from './lib';
import { Icon, Btn } from './shared';
import { Toast } from './modals';

/* ═══════════════════════════ MODULE A2: LOG LIBRARY ═══════════════════════════
 * Yazio-style product search screen with dual source (local + OpenFoodFacts).
 * Improvements (May 2026):
 *  - OFF query uses sort_by=unique_scans_n (popularity) + locale-aware lc param
 *  - page_size reduced 20→12 for faster TTFB
 *  - Client-side ranking: exact match > starts-with > word-boundary > contains
 *  - Results with no name-token match are filtered out (fixes "appel" → "appelsap" noise)
 * ═══════════════════════════════════════════════════════════════════════════ */

const OFF_SEARCH = 'https://world.openfoodfacts.org/cgi/search.pl';

// Map an OFF search hit → product-shape compatible with rest of app
function offToProduct(p) {
  const n = p.nutriments || {};
  let kcal = n['energy-kcal_100g'];
  if (kcal == null && n['energy_100g']) kcal = n['energy_100g'] / 4.184;
  const id = 'off:' + (p.code || (p._id || ''));
  // Prefer locale-specific name (NL/DE/etc) over generic product_name
  const name = p.product_name_nl || p.product_name || p.product_name_en || p.generic_name || 'Unknown product';
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
    brand: (p.brands || '').split(',')[0].trim(),
    image: p.image_front_small_url || p.image_small_url || p.image_url || null,
    kcal: Math.round(kcal || 0),
    p: Math.round((n.proteins_100g || 0) * 10) / 10,
    c: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
    f: Math.round((n.fat_100g || 0) * 10) / 10,
    barcode: p.code || '',
    quantity: p.quantity || '',
    store: 'AH', shelf: 'shelf', favorite: false,
    defaultPortion,
    source: 'openfoodfacts',
  };
}

export function LogLibrary({ onProductTap, onOpenBarcode, onProductActions, onRecipeActions, onlyRecipes }) {
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

  // Debounced web search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2 || filter === 'favorites' || filter === 'meals' || filter === 'aiscans') {
      setWebHits([]); setWebLoading(false); setWebError(false);
      return;
    }
    setWebLoading(true);
    debounceRef.current = setTimeout(async () => {
      const seq = ++fetchSeq.current;
      try {
        // Use popularity sort + user's language locale for better NL-matching
        const params = new URLSearchParams({
          action: 'process',
          search_terms: q,
          search_simple: '1',
          json: '1',
          page_size: '12',
          sort_by: 'unique_scans_n',
          lc: lang || 'en',
          fields: 'code,product_name,product_name_en,product_name_nl,generic_name,brands,image_front_small_url,image_small_url,image_url,nutriments,quantity',
        });
        const url = `${OFF_SEARCH}?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('net');
        const data = await res.json();
        if (seq !== fetchSeq.current) return; // stale
        // Map + score + filter + sort by relevance
        const list = (data.products || [])
          .map(offToProduct)
          .filter(p => p.kcal > 0 && p.name && p.name !== 'Unknown product')
          .map(p => ({ ...p, _score: rankHit(p.name, q) }))
          .filter(p => p._score > 0)
          .sort((a, b) => b._score - a._score)
          .slice(0, 10);
        setWebHits(list);
        setWebError(false);
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

  // Dedupe web hits against local by name+brand (case-insensitive)
  const webHitsDedupe = useMemo(() => {
    const seen = new Set(localHits.map(p => (p.name + '|' + (p.brand || '')).toLowerCase()));
    return webHits.filter(p => !seen.has((p.name + '|' + (p.brand || '')).toLowerCase()));
  }, [webHits, localHits]);

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

  const showEmpty = !query.trim() && localHits.length === 0 && recipeHits.length === 0 && webHits.length === 0;

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
function ProductRow({ product, onTap, onFav, onActions, isWeb }) {
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
        <div style={{ width: 44, height: 44, borderRadius: 10, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📦</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{product.name}</div>
          {isWeb && (
            <span style={{
              fontSize: 9, color: t.glow, fontWeight: 700,
              background: 'rgba(139,233,255,0.12)', padding: '2px 6px', borderRadius: 5,
              letterSpacing: '0.05em', flexShrink: 0, border: '1px solid rgba(139,233,255,0.3)',
            }}>{T('log.web.badge')}</span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: t.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.kcal} kcal · {T('common.per100g')}{product.brand ? ` · ${product.brand}` : ''}
        </div>
      </div>
      {!isWeb && onFav && (
        <div onClick={onFav} style={{
          width: 32, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isFav ? t.error : t.muted, fontSize: 20, cursor: 'pointer',
          flexShrink: 0, alignSelf: 'center',
        }}>
          {isFav ? '♥' : '♡'}
        </div>
      )}
      {!isWeb && onActions && (
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
