import { useState } from "react";
import { t } from './lib';
import { NL_EN_FOOD } from './local_foods';

/* ═══════════════════════════ DIAGNOSE PAGE ═══════════════════════════
 * Standalone diagnose component, accessed via #diagnose hash.
 * Runs inside the actual Vercel app (NOT in a Claude artifact iframe),
 * so we get accurate CORS / endpoint reachability info.
 *
 * URL: https://fitness-app-zeta-olive.vercel.app/#diagnose
 * ═══════════════════════════════════════════════════════════════════ */

function Panel({ title, badge, badgeColor, status, children }) {
  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: t.green, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</div>
        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, fontWeight: 700, letterSpacing: '0.04em', background: badgeColor + '26', color: badgeColor, border: `1px solid ${badgeColor}55` }}>{badge}</span>
      </div>
      {status && <div style={{ fontSize: 10, color: t.muted, marginBottom: 6, wordBreak: 'break-all' }}>{status}</div>}
      {children}
    </div>
  );
}

function Pre({ children }) {
  return (
    <pre style={{ background: '#09090B', border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, fontSize: 11, color: '#cbd5e1', overflow: 'auto', maxHeight: 240, margin: 0, fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {children}
    </pre>
  );
}

function shortPreview(obj, limit = 800) {
  try {
    const s = JSON.stringify(obj, null, 2);
    return s.length > limit ? s.slice(0, limit) + '...' : s;
  } catch { return String(obj); }
}

export function DiagnosePage() {
  const [q, setQ] = useState('appel');
  const [busy, setBusy] = useState(false);
  const [r1, setR1] = useState({ badge: 'wachten', color: '#facc15', status: '', body: null });
  const [r2, setR2] = useState({ badge: 'wachten', color: '#facc15', status: '', body: null });
  const [r3, setR3] = useState({ badge: 'wachten', color: '#facc15', status: '', body: null });

  async function testAll() {
    setBusy(true);
    setR1({ badge: 'bezig...', color: '#facc15', status: '', body: null });
    setR2({ badge: 'bezig...', color: '#facc15', status: '', body: null });
    setR3({ badge: 'bezig...', color: '#facc15', status: '', body: null });

    // Test 1: OFF — Search-a-licious + v1 cgi + v2 search (laat zien wat werkt)
    const sal = (async () => {
      const params = new URLSearchParams();
      params.append('q', q);
      params.append('page_size', '5');
      params.append('langs', 'nl');
      params.append('langs', 'en');
      const url = `https://search.openfoodfacts.org/search?${params.toString()}`;
      const cgiUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&json=1&page_size=5&action=process`;
      const v2Url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(q)}&page_size=5`;

      const results = await Promise.allSettled([
        fetch(url, { headers: { Accept: 'application/json' } }).then(async r => ({ ep: 'SAL', status: r.status, data: r.ok ? await r.json() : null })),
        fetch(cgiUrl).then(async r => ({ ep: 'CGI v1', status: r.status, data: r.ok ? await r.json() : null })),
        fetch(v2Url).then(async r => ({ ep: 'API v2', status: r.status, data: r.ok ? await r.json() : null })),
      ]);

      const summary = results.map((r, i) => {
        const labels = ['SAL', 'CGI v1', 'API v2'];
        if (r.status === 'rejected') return { ep: labels[i], err: String(r.reason?.message || r.reason) };
        const x = r.value;
        const items = x.data ? (x.data.hits || x.data.products || []) : [];
        return { ep: x.ep, status: x.status, count: items.length, sample: items[0] };
      });

      const totalHits = summary.reduce((a, b) => a + (b.count || 0), 0);
      const anyOk = summary.some(s => s.count > 0);
      setR1({
        badge: anyOk ? `${totalHits} totaal` : 'allemaal leeg',
        color: anyOk ? '#22C55E' : '#f87171',
        status: `3 OFF endpoints parallel getest`,
        body: (
          <div>
            {summary.map((s, i) => (
              <div key={i} style={{ padding: '8px 10px', background: '#09090B', border: `1px solid ${t.border}`, borderRadius: 8, marginBottom: 6, fontSize: 12 }}>
                <b style={{ color: s.count > 0 ? t.green : (s.err ? '#f87171' : t.muted) }}>{s.ep}</b>
                {' · '}
                {s.err ? <span style={{ color: '#f87171' }}>FAIL: {s.err}</span>
                  : <span>HTTP {s.status} · <b>{s.count}</b> hits</span>}
                {s.sample && (
                  <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>
                    eerste: {(s.sample._source || s.sample).product_name || (s.sample._source || s.sample).product_name_nl || '(geen naam)'}
                  </div>
                )}
              </div>
            ))}
          </div>
        ),
      });
    })();

    // Test 2: USDA
    const usda = (async () => {
      const qLow = q.toLowerCase();
      const enQ = NL_EN_FOOD[qLow] || NL_EN_FOOD[qLow.replace(/s$/, '')] || q;
      const params = new URLSearchParams({
        query: enQ,
        pageSize: '5',
        dataType: 'Foundation,SR Legacy,Survey (FNDDS),Branded',
        api_key: 'DEMO_KEY',
      });
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?${params.toString()}`;
      try {
        const t0 = performance.now();
        const res = await fetch(url);
        const dt = Math.round(performance.now() - t0);
        if (!res.ok) {
          setR2({
            badge: `HTTP ${res.status}`,
            color: '#f87171',
            status: `NL: "${q}" → EN: "${enQ}"`,
            body: <Pre>HTTP {res.status} {res.statusText}{'\n'}Duur: {dt}ms{res.status === 429 ? '\n\nDEMO_KEY limit overschreden (30/uur per IP). Wacht of registreer eigen key op api.data.gov.' : ''}</Pre>,
          });
          return;
        }
        const data = await res.json();
        const foods = data.foods || [];
        setR2({
          badge: `${foods.length} foods (${dt}ms)`,
          color: foods.length > 0 ? '#22C55E' : '#f87171',
          status: `NL: "${q}" → EN: "${enQ}"`,
          body: (
            <div>
              {foods.slice(0, 5).map((food, i) => {
                const nutrients = food.foodNutrients || [];
                const findN = (id) => {
                  const f = nutrients.find(n => n.nutrientId === id || (n.nutrient && n.nutrient.id === id));
                  return f ? (f.value != null ? f.value : (f.amount || 0)) : 0;
                };
                const kcal = Math.round(findN(1008) || 0);
                return (
                  <div key={i} style={{ padding: '8px 10px', background: '#09090B', border: `1px solid ${t.border}`, borderRadius: 8, marginBottom: 6, fontSize: 12 }}>
                    <b style={{ color: t.text }}>{food.description}</b> <i style={{ color: t.muted, fontStyle: 'normal' }}>{food.brandOwner ? '· ' + food.brandOwner : ''}</i>
                    <br /><span style={{ color: '#f97316' }}>{kcal} kcal/100g</span> · {food.dataType}
                  </div>
                );
              })}
              {foods.length > 0 && <Pre>Sample raw food:{'\n'}{shortPreview(foods[0])}</Pre>}
            </div>
          ),
        });
      } catch (e) {
        setR2({ badge: 'error', color: '#f87171', status: `NL: "${q}" → EN: "${enQ}"`, body: <Pre>FAIL: {e.message || String(e)}</Pre> });
      }
    })();

    // Test 3: OFF legacy cgi (control)
    const legacy = (async () => {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&json=1&page_size=5&action=process`;
      try {
        const t0 = performance.now();
        const res = await fetch(url);
        const dt = Math.round(performance.now() - t0);
        if (!res.ok) {
          setR3({ badge: `HTTP ${res.status}`, color: '#f87171', status: url, body: <Pre>HTTP {res.status}{res.status === 503 ? ' — endpoint plat sinds april 2026, verwacht.' : ''}{'\n'}Duur: {dt}ms</Pre> });
          return;
        }
        const data = await res.json();
        const products = data.products || [];
        setR3({
          badge: `${products.length} producten (${dt}ms)`,
          color: products.length > 0 ? '#22C55E' : '#f87171',
          status: url,
          body: (
            <div>
              {products.slice(0, 5).map((p, i) => (
                <div key={i} style={{ padding: '8px 10px', background: '#09090B', border: `1px solid ${t.border}`, borderRadius: 8, marginBottom: 6, fontSize: 12 }}>
                  <b style={{ color: t.text }}>{p.product_name_nl || p.product_name || '(geen naam)'}</b>
                  <br /><span style={{ color: '#facc15' }}>{(p.nutriments || {})['energy-kcal_100g'] || '?'} kcal/100g</span>
                </div>
              ))}
            </div>
          ),
        });
      } catch (e) {
        setR3({ badge: 'error', color: '#f87171', status: url, body: <Pre>FAIL: {e.message || String(e)}</Pre> });
      }
    })();

    await Promise.all([sal, usda, legacy]);
    setBusy(false);
  }

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: '100vh', padding: 16, fontFamily: '"DM Sans", sans-serif' }}>
      <h1 style={{ margin: '8px 0 4px', fontSize: 18, color: t.green }}>🔬 Food DB Diagnose</h1>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: t.muted }}>Test alle 3 voedseldatabases live vanuit deze app — toont exact wat er mis gaat.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Zoekterm"
          style={{ flex: 1, padding: '10px 12px', background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, color: t.text, fontSize: 14, fontFamily: 'inherit' }}
        />
        <button
          onClick={testAll}
          disabled={busy}
          style={{ padding: '10px 16px', background: busy ? '#444' : t.green, border: 'none', borderRadius: 10, color: '#000', fontWeight: 700, fontSize: 14, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit' }}
        >
          {busy ? 'Bezig...' : 'Test'}
        </button>
      </div>

      <Panel title="Search-a-licious (OpenFoodFacts)" badge={r1.badge} badgeColor={r1.color} status={r1.status}>{r1.body}</Panel>
      <Panel title="USDA FoodData Central" badge={r2.badge} badgeColor={r2.color} status={r2.status}>{r2.body}</Panel>
      <Panel title="OFF legacy cgi (controle)" badge={r3.badge} badgeColor={r3.color} status={r3.status}>{r3.body}</Panel>

      <button
        onClick={() => { window.location.hash = ''; window.location.reload(); }}
        style={{ width: '100%', padding: 12, marginTop: 8, background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        ← Terug naar app
      </button>
    </div>
  );
}
