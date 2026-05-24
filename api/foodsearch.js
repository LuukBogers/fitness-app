// Vercel serverless function: /api/foodsearch?q=campina&lang=nl
//
// Acts as server-side proxy to bypass browser CORS for:
//  - OpenFoodFacts Search-a-licious (modern Elasticsearch endpoint)
//  - OpenFoodFacts v1 cgi/search.pl (legacy, full-text fallback)
//  - OpenFoodFacts v2 search (categorical fallback)
//  - USDA FoodData Central (DEMO_KEY)
//
// All four fetched in parallel server-side; results returned to client in one JSON.
// Edge-cached 1 hour, so repeat queries are instant.

const USER_AGENT = 'FitnessApp/1.0 (luukbogers@outlook.com)';
const USDA_KEY = 'DEMO_KEY';
// FatSecret OAuth 2.0 — set via Vercel env vars. If missing, source is skipped.
const FATSECRET_CLIENT_ID = process.env.FATSECRET_CLIENT_ID || '';
const FATSECRET_CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET || '';

// In-memory token cache (survives function invocations within same instance)
let fsTokenCache = { token: null, expiresAt: 0 };

async function getFatSecretToken() {
  if (!FATSECRET_CLIENT_ID || !FATSECRET_CLIENT_SECRET) return null;
  if (fsTokenCache.token && Date.now() < fsTokenCache.expiresAt - 60000) return fsTokenCache.token;
  const auth = Buffer.from(`${FATSECRET_CLIENT_ID}:${FATSECRET_CLIENT_SECRET}`).toString('base64');
  const r = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  });
  if (!r.ok) throw new Error(`FS auth ${r.status}`);
  const d = await r.json();
  fsTokenCache = { token: d.access_token, expiresAt: Date.now() + (d.expires_in || 86400) * 1000 };
  return d.access_token;
}

// Parse FatSecret food_description string into structured nutrients
// Example: "Per 100ml - Calories: 47kcal | Fat: 1.5g | Carbs: 4.7g | Protein: 3.5g"
function parseFsDescription(desc) {
  if (!desc) return { kcal: 0, p: 0, c: 0, f: 0 };
  const m = (re) => { const x = desc.match(re); return x ? parseFloat(x[1]) : 0; };
  return {
    kcal: m(/Calories:\s*(\d+(?:\.\d+)?)\s*kcal/i),
    f:    m(/Fat:\s*(\d+(?:\.\d+)?)\s*g/i),
    c:    m(/Carbs?:\s*(\d+(?:\.\d+)?)\s*g/i),
    p:    m(/Protein:\s*(\d+(?:\.\d+)?)\s*g/i),
  };
}

function fsToOff(food) {
  const n = parseFsDescription(food.food_description);
  return {
    _src: 'fatsecret',
    code: 'fs:' + food.food_id,
    product_name: food.food_name || '',
    brands: food.brand_name || '',
    nutriments: {
      'energy-kcal_100g': Math.round(n.kcal),
      proteins_100g: Math.round(n.p * 10) / 10,
      carbohydrates_100g: Math.round(n.c * 10) / 10,
      fat_100g: Math.round(n.f * 10) / 10,
    },
    food_url: food.food_url,
  };
}

// NL → EN translation for USDA (Dutch terms → English for search)
const NL_EN = {
  appel: 'apple', banaan: 'banana', peer: 'pear', sinaasappel: 'orange',
  citroen: 'lemon', druiven: 'grapes', aardbei: 'strawberry', aardbeien: 'strawberry',
  framboos: 'raspberry', kers: 'cherry', kiwi: 'kiwi', meloen: 'melon',
  ananas: 'pineapple', mango: 'mango', perzik: 'peach', pruim: 'plum', avocado: 'avocado',
  tomaat: 'tomato', komkommer: 'cucumber', paprika: 'bell pepper', sla: 'lettuce',
  wortel: 'carrot', broccoli: 'broccoli', bloemkool: 'cauliflower', spinazie: 'spinach',
  kool: 'cabbage', mais: 'corn', champignon: 'mushroom', ui: 'onion',
  knoflook: 'garlic', aardappel: 'potato', courgette: 'zucchini', aubergine: 'eggplant',
  kip: 'chicken', kipfilet: 'chicken breast', kalkoen: 'turkey', rund: 'beef',
  biefstuk: 'steak', gehakt: 'ground beef', varken: 'pork', spek: 'bacon',
  ham: 'ham', salami: 'salami', worst: 'sausage',
  zalm: 'salmon', tonijn: 'tuna', kabeljauw: 'cod', haring: 'herring',
  garnaal: 'shrimp', garnalen: 'shrimp', ei: 'egg',
  melk: 'milk', kwark: 'quark', yoghurt: 'yogurt', skyr: 'skyr', kaas: 'cheese',
  mozzarella: 'mozzarella', feta: 'feta', boter: 'butter',
  brood: 'bread', volkoren: 'whole grain bread', cracker: 'cracker',
  havermout: 'oatmeal', musli: 'muesli', rijst: 'rice',
  pasta: 'pasta', spaghetti: 'spaghetti', couscous: 'couscous', quinoa: 'quinoa',
  pinda: 'peanut', pindakaas: 'peanut butter', amandel: 'almond',
  olijfolie: 'olive oil', mayonaise: 'mayonnaise', ketchup: 'ketchup',
  chocolade: 'chocolate', chips: 'chips', popcorn: 'popcorn',
  water: 'water', koffie: 'coffee', thee: 'tea', sap: 'juice',
};

// Transform USDA food → OFF-like product shape (so client treats both uniformly)
function usdaToOff(food) {
  const nutrients = food.foodNutrients || [];
  const findN = (id) => {
    const f = nutrients.find(n => n.nutrientId === id || (n.nutrient && n.nutrient.id === id));
    return f ? (f.value != null ? f.value : (f.amount || 0)) : 0;
  };
  let kcal = findN(1008);
  if (!kcal) {
    const kj = findN(1062);
    if (kj) kcal = kj / 4.184;
  }
  return {
    _src: 'usda',
    code: 'usda:' + food.fdcId,
    product_name: food.description || '',
    brands: food.brandOwner || food.brandName || '',
    nutriments: {
      'energy-kcal_100g': Math.round(kcal || 0),
      proteins_100g: Math.round((findN(1003) || 0) * 10) / 10,
      carbohydrates_100g: Math.round((findN(1005) || 0) * 10) / 10,
      fat_100g: Math.round((findN(1004) || 0) * 10) / 10,
    },
    dataType: food.dataType,
  };
}

// Normalize Search-a-licious hit: unwrap _source if Elasticsearch-style
function normSal(hit) {
  const p = hit && hit._source ? hit._source : hit;
  return { ...p, _src: 'off_sal' };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = (req.query.q || '').toString().trim();
  const lang = (req.query.lang || 'nl').toString().slice(0, 2);

  if (q.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  const startedAt = Date.now();

  // === All 4 sources, in parallel, server-side (no CORS issues) ===
  const sources = await Promise.allSettled([
    // 1) Search-a-licious (modern OFF)
    (async () => {
      const u = new URL('https://search.openfoodfacts.org/search');
      u.searchParams.append('q', q);
      u.searchParams.append('page_size', '15');
      u.searchParams.append('langs', lang);
      if (lang !== 'en') u.searchParams.append('langs', 'en');
      const r = await fetch(u.toString(), {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      });
      if (!r.ok) throw new Error(`SAL ${r.status}`);
      const d = await r.json();
      const items = d.hits || d.products || [];
      return items.map(normSal);
    })(),

    // 2) OFF v1 cgi (legacy full-text)
    (async () => {
      const u = new URL('https://world.openfoodfacts.org/cgi/search.pl');
      u.searchParams.set('search_terms', q);
      u.searchParams.set('search_simple', '1');
      u.searchParams.set('json', '1');
      u.searchParams.set('page_size', '15');
      u.searchParams.set('action', 'process');
      u.searchParams.set('sort_by', 'unique_scans_n');
      u.searchParams.set('lc', lang);
      const r = await fetch(u.toString(), {
        headers: { 'User-Agent': USER_AGENT },
      });
      if (!r.ok) throw new Error(`CGI ${r.status}`);
      const d = await r.json();
      return (d.products || []).map(p => ({ ...p, _src: 'off_cgi' }));
    })(),

    // 3) OFF v2 search
    (async () => {
      const u = new URL('https://world.openfoodfacts.org/api/v2/search');
      u.searchParams.set('search_terms', q);
      u.searchParams.set('page_size', '15');
      u.searchParams.set('fields', 'code,product_name,product_name_en,product_name_nl,generic_name,brands,image_front_small_url,image_small_url,image_url,nutriments,quantity');
      const r = await fetch(u.toString(), {
        headers: { 'User-Agent': USER_AGENT },
      });
      if (!r.ok) throw new Error(`V2 ${r.status}`);
      const d = await r.json();
      return (d.products || []).map(p => ({ ...p, _src: 'off_v2' }));
    })(),

    // 4) USDA FoodData Central
    (async () => {
      const qLow = q.toLowerCase();
      const enQ = NL_EN[qLow] || NL_EN[qLow.replace(/s$/, '')] || q;
      const u = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
      u.searchParams.set('query', enQ);
      u.searchParams.set('pageSize', '10');
      u.searchParams.set('dataType', 'Foundation,SR Legacy,Survey (FNDDS),Branded');
      u.searchParams.set('api_key', USDA_KEY);
      const r = await fetch(u.toString());
      if (!r.ok) throw new Error(`USDA ${r.status}`);
      const d = await r.json();
      return (d.foods || []).map(usdaToOff);
    })(),

    // 5) FatSecret Platform (NL branded coverage)
    (async () => {
      const token = await getFatSecretToken();
      if (!token) throw new Error('FS: no credentials');
      const u = new URL('https://platform.fatsecret.com/rest/server.api');
      u.searchParams.set('method', 'foods.search');
      u.searchParams.set('search_expression', q);
      u.searchParams.set('max_results', '15');
      u.searchParams.set('region', lang === 'nl' ? 'NL' : 'US');
      u.searchParams.set('language', lang);
      u.searchParams.set('format', 'json');
      const r = await fetch(u.toString(), { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error(`FS ${r.status}`);
      const d = await r.json();
      const foods = (d.foods && d.foods.food) || [];
      const arr = Array.isArray(foods) ? foods : [foods];
      return arr.map(fsToOff);
    })(),
  ]);

  const [salRes, cgiRes, v2Res, usdaRes, fsRes] = sources;
  const status = {
    sal:  salRes.status  === 'fulfilled' ? { count: salRes.value.length  } : { error: String(salRes.reason  && salRes.reason.message  || salRes.reason ) },
    cgi:  cgiRes.status  === 'fulfilled' ? { count: cgiRes.value.length  } : { error: String(cgiRes.reason  && cgiRes.reason.message  || cgiRes.reason ) },
    v2:   v2Res.status   === 'fulfilled' ? { count: v2Res.value.length   } : { error: String(v2Res.reason   && v2Res.reason.message   || v2Res.reason  ) },
    usda: usdaRes.status === 'fulfilled' ? { count: usdaRes.value.length } : { error: String(usdaRes.reason && usdaRes.reason.message || usdaRes.reason) },
    fs:   fsRes.status   === 'fulfilled' ? { count: fsRes.value.length   } : { error: String(fsRes.reason   && fsRes.reason.message   || fsRes.reason  ) },
  };

  // Merge all + dedupe by barcode code
  const all = [
    ...(salRes.status === 'fulfilled' ? salRes.value : []),
    ...(cgiRes.status === 'fulfilled' ? cgiRes.value : []),
    ...(v2Res.status === 'fulfilled' ? v2Res.value : []),
    ...(usdaRes.status === 'fulfilled' ? usdaRes.value : []),
    ...(fsRes.status === 'fulfilled' ? fsRes.value : []),
  ];
  const seen = new Set();
  const merged = [];
  for (const p of all) {
    const code = (p.code || '').toString();
    if (code && seen.has(code)) continue;
    if (code) seen.add(code);
    merged.push(p);
  }

  // Edge cache 1 hour — repeat queries instant
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  return res.status(200).json({
    q, lang,
    ms: Date.now() - startedAt,
    status,
    products: merged,
  });
}
