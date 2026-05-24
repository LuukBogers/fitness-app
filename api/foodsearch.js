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
  ]);

  const [salRes, cgiRes, v2Res, usdaRes] = sources;
  const status = {
    sal: salRes.status === 'fulfilled' ? { count: salRes.value.length } : { error: String(salRes.reason && salRes.reason.message || salRes.reason) },
    cgi: cgiRes.status === 'fulfilled' ? { count: cgiRes.value.length } : { error: String(cgiRes.reason && cgiRes.reason.message || cgiRes.reason) },
    v2:  v2Res.status === 'fulfilled'  ? { count: v2Res.value.length  } : { error: String(v2Res.reason && v2Res.reason.message  || v2Res.reason ) },
    usda: usdaRes.status === 'fulfilled' ? { count: usdaRes.value.length } : { error: String(usdaRes.reason && usdaRes.reason.message || usdaRes.reason) },
  };

  // Merge all + dedupe by barcode code
  const all = [
    ...(salRes.status === 'fulfilled' ? salRes.value : []),
    ...(cgiRes.status === 'fulfilled' ? cgiRes.value : []),
    ...(v2Res.status === 'fulfilled' ? v2Res.value : []),
    ...(usdaRes.status === 'fulfilled' ? usdaRes.value : []),
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
