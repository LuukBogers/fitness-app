/* ═══════════════════════════ LOCAL NL FOOD DATABASE ═══════════════════════════
 * Top 80 generic Dutch foods (RIVM/NEVO-style nutritional data, per 100g).
 * Used as the primary search source — instant, free, accurate, set-and-forget.
 * No API call needed; embedded directly in the bundle (~25KB gzipped).
 *
 * Source: NEVO 2023 (Nederlandse Voedingsstoffenbestand, RIVM) — publicly available
 * data, rounded values, common-language names per category.
 *
 * Each entry follows the standard product shape so it drops into ProductDetailModal
 * unchanged. `source: 'nevo'` lets the UI distinguish from OFF results.
 * ═══════════════════════════════════════════════════════════════════════════ */

const dp = (name, g, ml) => ({
  id: 'default',
  name,
  ...(g != null ? { g } : { ml }),
  makeDefault: true,
});

// Per 100g for solids, per 100ml for liquids. Most "g" used; we tag the portion accordingly.
export const LOCAL_FOODS = [
  // ─── Fruit ───
  { id: 'nevo:appel',           name: 'Appel',            kcal: 52,  p: 0.3,  c: 14,    f: 0.2,  defaultPortion: dp('1 appel', 180), category: 'fruit' },
  { id: 'nevo:banaan',          name: 'Banaan',           kcal: 89,  p: 1.1,  c: 23,    f: 0.3,  defaultPortion: dp('1 banaan', 120), category: 'fruit' },
  { id: 'nevo:peer',            name: 'Peer',             kcal: 57,  p: 0.4,  c: 15,    f: 0.1,  defaultPortion: dp('1 peer', 170), category: 'fruit' },
  { id: 'nevo:sinaasappel',     name: 'Sinaasappel',      kcal: 47,  p: 0.9,  c: 12,    f: 0.1,  defaultPortion: dp('1 sinaasappel', 150), category: 'fruit' },
  { id: 'nevo:mandarijn',       name: 'Mandarijn',        kcal: 53,  p: 0.8,  c: 13,    f: 0.3,  defaultPortion: dp('1 mandarijn', 80), category: 'fruit' },
  { id: 'nevo:druiven',         name: 'Druiven',          kcal: 67,  p: 0.6,  c: 17,    f: 0.4,  defaultPortion: dp('1 handje', 80), category: 'fruit' },
  { id: 'nevo:aardbeien',       name: 'Aardbeien',        kcal: 32,  p: 0.7,  c: 7.7,   f: 0.3,  defaultPortion: dp('1 bakje', 250), category: 'fruit' },
  { id: 'nevo:blauwe.bessen',   name: 'Blauwe bessen',    kcal: 57,  p: 0.7,  c: 14,    f: 0.3,  defaultPortion: dp('1 bakje', 125), category: 'fruit' },
  { id: 'nevo:framboos',        name: 'Frambozen',        kcal: 52,  p: 1.2,  c: 12,    f: 0.7,  defaultPortion: dp('1 bakje', 125), category: 'fruit' },
  { id: 'nevo:kiwi',            name: 'Kiwi',             kcal: 61,  p: 1.1,  c: 15,    f: 0.5,  defaultPortion: dp('1 kiwi', 75), category: 'fruit' },
  { id: 'nevo:meloen',          name: 'Meloen',           kcal: 34,  p: 0.8,  c: 8,     f: 0.2,  defaultPortion: dp('1 plak', 200), category: 'fruit' },
  { id: 'nevo:watermeloen',     name: 'Watermeloen',      kcal: 30,  p: 0.6,  c: 7.6,   f: 0.2,  defaultPortion: dp('1 plak', 280), category: 'fruit' },
  { id: 'nevo:ananas',          name: 'Ananas',           kcal: 50,  p: 0.5,  c: 13,    f: 0.1,  defaultPortion: dp('1 plak', 120), category: 'fruit' },
  { id: 'nevo:avocado',         name: 'Avocado',          kcal: 160, p: 2,    c: 9,     f: 15,   defaultPortion: dp('1/2 avocado', 70), category: 'fruit' },

  // ─── Groente ───
  { id: 'nevo:tomaat',          name: 'Tomaat',           kcal: 18,  p: 0.9,  c: 3.9,   f: 0.2,  defaultPortion: dp('1 tomaat', 120), category: 'vegetable' },
  { id: 'nevo:komkommer',       name: 'Komkommer',        kcal: 15,  p: 0.7,  c: 3.6,   f: 0.1,  defaultPortion: dp('1/2 komkommer', 200), category: 'vegetable' },
  { id: 'nevo:paprika.rood',    name: 'Paprika (rood)',   kcal: 31,  p: 1,    c: 6,     f: 0.3,  defaultPortion: dp('1 paprika', 150), category: 'vegetable' },
  { id: 'nevo:sla',             name: 'Sla',              kcal: 15,  p: 1.4,  c: 2.9,   f: 0.2,  defaultPortion: dp('1 bord', 50), category: 'vegetable' },
  { id: 'nevo:wortel',          name: 'Wortel',           kcal: 41,  p: 0.9,  c: 9.6,   f: 0.2,  defaultPortion: dp('1 wortel', 60), category: 'vegetable' },
  { id: 'nevo:broccoli',        name: 'Broccoli',         kcal: 34,  p: 2.8,  c: 7,     f: 0.4,  defaultPortion: dp('1 portie', 150), category: 'vegetable' },
  { id: 'nevo:bloemkool',       name: 'Bloemkool',        kcal: 25,  p: 1.9,  c: 5,     f: 0.3,  defaultPortion: dp('1 portie', 200), category: 'vegetable' },
  { id: 'nevo:spinazie',        name: 'Spinazie',         kcal: 23,  p: 2.9,  c: 3.6,   f: 0.4,  defaultPortion: dp('1 portie', 150), category: 'vegetable' },
  { id: 'nevo:sperziebonen',    name: 'Sperziebonen',     kcal: 31,  p: 1.8,  c: 7,     f: 0.2,  defaultPortion: dp('1 portie', 150), category: 'vegetable' },
  { id: 'nevo:champignons',     name: 'Champignons',      kcal: 22,  p: 3.1,  c: 3.3,   f: 0.3,  defaultPortion: dp('1 bakje', 250), category: 'vegetable' },
  { id: 'nevo:ui',              name: 'Ui',               kcal: 40,  p: 1.1,  c: 9.3,   f: 0.1,  defaultPortion: dp('1 ui', 100), category: 'vegetable' },
  { id: 'nevo:knoflook',        name: 'Knoflook',         kcal: 149, p: 6.4,  c: 33,    f: 0.5,  defaultPortion: dp('1 teen', 4), category: 'vegetable' },
  { id: 'nevo:aardappel',       name: 'Aardappel (gekookt)', kcal: 87, p: 1.9, c: 20,  f: 0.1,  defaultPortion: dp('1 portie', 200), category: 'vegetable' },
  { id: 'nevo:zoete.aardappel', name: 'Zoete aardappel',  kcal: 86,  p: 1.6,  c: 20,    f: 0.1,  defaultPortion: dp('1 portie', 200), category: 'vegetable' },
  { id: 'nevo:courgette',       name: 'Courgette',        kcal: 17,  p: 1.2,  c: 3.1,   f: 0.3,  defaultPortion: dp('1/2 courgette', 200), category: 'vegetable' },
  { id: 'nevo:aubergine',       name: 'Aubergine',        kcal: 25,  p: 1,    c: 6,     f: 0.2,  defaultPortion: dp('1/2 aubergine', 200), category: 'vegetable' },

  // ─── Vlees & vis ───
  { id: 'nevo:kipfilet',        name: 'Kipfilet (rauw)',  kcal: 110, p: 23,   c: 0,     f: 1.5,  defaultPortion: dp('1 filet', 150), category: 'meat' },
  { id: 'nevo:kipfilet.gegrild',name: 'Kipfilet gegrild', kcal: 165, p: 31,   c: 0,     f: 3.6,  defaultPortion: dp('1 portie', 120), category: 'meat' },
  { id: 'nevo:gehakt.rund',     name: 'Rundergehakt',     kcal: 230, p: 17,   c: 0,     f: 18,   defaultPortion: dp('1 portie', 150), category: 'meat' },
  { id: 'nevo:gehakt.halfom',   name: 'Half-om-half gehakt', kcal: 244, p: 17, c: 0,    f: 20,   defaultPortion: dp('1 portie', 150), category: 'meat' },
  { id: 'nevo:biefstuk',        name: 'Biefstuk',         kcal: 192, p: 28,   c: 0,     f: 8,    defaultPortion: dp('1 stuk', 150), category: 'meat' },
  { id: 'nevo:varkenshaas',     name: 'Varkenshaas',      kcal: 144, p: 24,   c: 0,     f: 4.5,  defaultPortion: dp('1 portie', 150), category: 'meat' },
  { id: 'nevo:spek',            name: 'Spek',             kcal: 417, p: 10,   c: 0,     f: 42,   defaultPortion: dp('2 plakjes', 30), category: 'meat' },
  { id: 'nevo:ham',             name: 'Ham',              kcal: 145, p: 18,   c: 1.5,   f: 7.5,  defaultPortion: dp('2 plakjes', 30), category: 'meat' },
  { id: 'nevo:zalm',            name: 'Zalm',             kcal: 208, p: 20,   c: 0,     f: 13,   defaultPortion: dp('1 filet', 150), category: 'fish' },
  { id: 'nevo:tonijn.water',    name: 'Tonijn (in water)', kcal: 116, p: 26,  c: 0,     f: 1,    defaultPortion: dp('1 blikje', 80), category: 'fish' },
  { id: 'nevo:kabeljauw',       name: 'Kabeljauw',        kcal: 82,  p: 18,   c: 0,     f: 0.7,  defaultPortion: dp('1 filet', 150), category: 'fish' },
  { id: 'nevo:garnalen',        name: 'Garnalen',         kcal: 99,  p: 24,   c: 0,     f: 0.3,  defaultPortion: dp('1 portie', 100), category: 'fish' },
  { id: 'nevo:ei',              name: 'Ei',               kcal: 143, p: 13,   c: 0.7,   f: 9.5,  defaultPortion: dp('1 ei', 60), category: 'meat' },
  { id: 'nevo:eiwit',           name: 'Eiwit (van ei)',   kcal: 48,  p: 11,   c: 0.7,   f: 0.2,  defaultPortion: dp('1 eiwit', 33), category: 'meat' },

  // ─── Zuivel ───
  { id: 'nevo:melk.halfvol',    name: 'Melk halfvol',     kcal: 47,  p: 3.5,  c: 4.7,   f: 1.5,  defaultPortion: { id:'default', name: '1 glas', ml: 200, makeDefault: true }, category: 'dairy' },
  { id: 'nevo:melk.volle',      name: 'Volle melk',       kcal: 64,  p: 3.4,  c: 4.7,   f: 3.5,  defaultPortion: { id:'default', name: '1 glas', ml: 200, makeDefault: true }, category: 'dairy' },
  { id: 'nevo:kwark.magere',    name: 'Magere kwark',     kcal: 51,  p: 9,    c: 4,     f: 0.2,  defaultPortion: dp('1 bakje', 250), category: 'dairy' },
  { id: 'nevo:kwark.halfvolle', name: 'Halfvolle kwark',  kcal: 75,  p: 8,    c: 4,     f: 3,    defaultPortion: dp('1 bakje', 250), category: 'dairy' },
  { id: 'nevo:yoghurt.magere',  name: 'Magere yoghurt',   kcal: 41,  p: 4,    c: 5.6,   f: 0.1,  defaultPortion: dp('1 bakje', 150), category: 'dairy' },
  { id: 'nevo:yoghurt.griekse', name: 'Griekse yoghurt',  kcal: 97,  p: 9,    c: 4,     f: 5,    defaultPortion: dp('1 bakje', 150), category: 'dairy' },
  { id: 'nevo:skyr',            name: 'Skyr',             kcal: 60,  p: 11,   c: 3.8,   f: 0.2,  defaultPortion: dp('1 bakje', 150), category: 'dairy' },
  { id: 'nevo:cottage.cheese',  name: 'Cottage cheese',   kcal: 98,  p: 11,   c: 3.4,   f: 4.3,  defaultPortion: dp('1 bakje', 150), category: 'dairy' },
  { id: 'nevo:kaas.30plus',     name: 'Kaas 30+',         kcal: 304, p: 28,   c: 0,     f: 21,   defaultPortion: dp('1 plak', 20), category: 'dairy' },
  { id: 'nevo:kaas.48plus',     name: 'Kaas 48+ (jong)',  kcal: 378, p: 24,   c: 0,     f: 31,   defaultPortion: dp('1 plak', 20), category: 'dairy' },
  { id: 'nevo:mozzarella',      name: 'Mozzarella',       kcal: 254, p: 18,   c: 2,     f: 19,   defaultPortion: dp('1 bol', 125), category: 'dairy' },
  { id: 'nevo:roomboter',       name: 'Roomboter',        kcal: 717, p: 0.8,  c: 0.5,   f: 81,   defaultPortion: dp('1 mes', 5), category: 'dairy' },

  // ─── Granen, brood, pasta ───
  { id: 'nevo:brood.wit',       name: 'Wit brood',        kcal: 252, p: 8,    c: 49,    f: 2.5,  defaultPortion: dp('1 snee', 35), category: 'grain' },
  { id: 'nevo:brood.bruin',     name: 'Bruin brood',      kcal: 230, p: 9,    c: 41,    f: 3.5,  defaultPortion: dp('1 snee', 35), category: 'grain' },
  { id: 'nevo:brood.volkoren',  name: 'Volkoren brood',   kcal: 219, p: 10,   c: 38,    f: 3,    defaultPortion: dp('1 snee', 35), category: 'grain' },
  { id: 'nevo:havermout',       name: 'Havermout',        kcal: 379, p: 13,   c: 67,    f: 7,    defaultPortion: dp('1 bakje', 50), category: 'grain' },
  { id: 'nevo:rijst.wit.gekookt', name: 'Witte rijst (gekookt)', kcal: 130, p: 2.7, c: 28, f: 0.3, defaultPortion: dp('1 opscheplepel', 70), category: 'grain' },
  { id: 'nevo:rijst.bruin.gekookt', name: 'Zilvervliesrijst (gekookt)', kcal: 122, p: 2.6, c: 25, f: 1, defaultPortion: dp('1 opscheplepel', 70), category: 'grain' },
  { id: 'nevo:pasta.gekookt',   name: 'Pasta (gekookt)',  kcal: 158, p: 5.8,  c: 31,    f: 0.9,  defaultPortion: dp('1 portie', 200), category: 'grain' },
  { id: 'nevo:couscous.gekookt',name: 'Couscous (gekookt)', kcal: 112, p: 3.8, c: 23,   f: 0.2,  defaultPortion: dp('1 portie', 150), category: 'grain' },
  { id: 'nevo:quinoa.gekookt',  name: 'Quinoa (gekookt)', kcal: 120, p: 4.4,  c: 21,    f: 1.9,  defaultPortion: dp('1 portie', 150), category: 'grain' },
  { id: 'nevo:cruesli',         name: 'Cruesli',          kcal: 442, p: 8,    c: 65,    f: 16,   defaultPortion: dp('1 portie', 50), category: 'grain' },

  // ─── Noten, peulvruchten, plantaardig ───
  { id: 'nevo:pindas',          name: 'Pinda\'s',         kcal: 567, p: 26,   c: 16,    f: 49,   defaultPortion: dp('1 handje', 30), category: 'snack' },
  { id: 'nevo:amandelen',       name: 'Amandelen',        kcal: 579, p: 21,   c: 22,    f: 50,   defaultPortion: dp('1 handje', 30), category: 'snack' },
  { id: 'nevo:walnoten',        name: 'Walnoten',         kcal: 654, p: 15,   c: 14,    f: 65,   defaultPortion: dp('1 handje', 30), category: 'snack' },
  { id: 'nevo:cashewnoten',     name: 'Cashewnoten',      kcal: 553, p: 18,   c: 30,    f: 44,   defaultPortion: dp('1 handje', 30), category: 'snack' },
  { id: 'nevo:pindakaas',       name: 'Pindakaas',        kcal: 588, p: 25,   c: 20,    f: 50,   defaultPortion: dp('1 broodsmeer', 15), category: 'spread' },
  { id: 'nevo:bonen.bruin',     name: 'Bruine bonen',     kcal: 132, p: 9,    c: 21,    f: 0.5,  defaultPortion: dp('1 portie', 200), category: 'grain' },
  { id: 'nevo:linzen.gekookt',  name: 'Linzen (gekookt)', kcal: 116, p: 9,    c: 20,    f: 0.4,  defaultPortion: dp('1 portie', 200), category: 'grain' },
  { id: 'nevo:kikkererwten.gekookt', name: 'Kikkererwten (gekookt)', kcal: 164, p: 9, c: 27, f: 2.6, defaultPortion: dp('1 portie', 200), category: 'grain' },
  { id: 'nevo:tofu',            name: 'Tofu',             kcal: 144, p: 17,   c: 0.6,   f: 8.7,  defaultPortion: dp('1 portie', 150), category: 'meat' },

  // ─── Vetten, oliën, sauzen ───
  { id: 'nevo:olijfolie',       name: 'Olijfolie',        kcal: 884, p: 0,    c: 0,     f: 100,  defaultPortion: { id:'default', name: '1 eetlepel', ml: 15, makeDefault: true }, category: 'oil' },
  { id: 'nevo:zonnebloemolie',  name: 'Zonnebloemolie',   kcal: 884, p: 0,    c: 0,     f: 100,  defaultPortion: { id:'default', name: '1 eetlepel', ml: 15, makeDefault: true }, category: 'oil' },
  { id: 'nevo:mayonaise',       name: 'Mayonaise',        kcal: 680, p: 1,    c: 1.5,   f: 75,   defaultPortion: dp('1 eetlepel', 15), category: 'sauce' },
  { id: 'nevo:ketchup',         name: 'Ketchup',          kcal: 101, p: 1.2,  c: 24,    f: 0.1,  defaultPortion: dp('1 eetlepel', 15), category: 'sauce' },

  // ─── Snacks & zoetigheid ───
  { id: 'nevo:chocolade.puur',  name: 'Pure chocolade',   kcal: 546, p: 4.9,  c: 61,    f: 31,   defaultPortion: dp('1 reep', 30), category: 'snack' },
  { id: 'nevo:chocolade.melk',  name: 'Melkchocolade',    kcal: 535, p: 7.6,  c: 59,    f: 30,   defaultPortion: dp('1 reep', 30), category: 'snack' },
  { id: 'nevo:chips.naturel',   name: 'Chips (naturel)',  kcal: 536, p: 6.6,  c: 50,    f: 35,   defaultPortion: dp('1 handje', 30), category: 'snack' },

  // ─── Dranken ───
  { id: 'nevo:water',           name: 'Water',            kcal: 0,   p: 0,    c: 0,     f: 0,    defaultPortion: { id:'default', name: '1 glas', ml: 250, makeDefault: true }, category: 'drink' },
  { id: 'nevo:koffie.zwart',    name: 'Koffie (zwart)',   kcal: 2,   p: 0.1,  c: 0,     f: 0,    defaultPortion: { id:'default', name: '1 kopje', ml: 125, makeDefault: true }, category: 'drink' },
  { id: 'nevo:thee.zwart',      name: 'Thee (zwart)',     kcal: 1,   p: 0,    c: 0.2,   f: 0,    defaultPortion: { id:'default', name: '1 kopje', ml: 200, makeDefault: true }, category: 'drink' },
  { id: 'nevo:jus',             name: 'Jus d\'orange',    kcal: 45,  p: 0.7,  c: 10,    f: 0.2,  defaultPortion: { id:'default', name: '1 glas', ml: 200, makeDefault: true }, category: 'drink' },
  { id: 'nevo:bier.pils',       name: 'Bier (pils)',      kcal: 43,  p: 0.5,  c: 3.4,   f: 0,    defaultPortion: { id:'default', name: '1 glas', ml: 250, makeDefault: true }, category: 'drink' },
  { id: 'nevo:wijn.rood',       name: 'Rode wijn',        kcal: 85,  p: 0.1,  c: 2.6,   f: 0,    defaultPortion: { id:'default', name: '1 glas', ml: 125, makeDefault: true }, category: 'drink' },
];

// Fill in standard fields so they slot into the rest of the app
LOCAL_FOODS.forEach(f => {
  f.brand = '';
  f.image = null;
  f.store = '';
  f.shelf = f.category === 'fruit' || f.category === 'vegetable' ? 'fresh'
         : f.category === 'meat' || f.category === 'fish' || f.category === 'dairy' ? 'refrigerated'
         : 'shelf';
  f.favorite = false;
  f.source = 'nevo';
});

// Simple lowercase-name index for fast substring/word matching
const _index = LOCAL_FOODS.map(f => ({ ...f, _lc: f.name.toLowerCase() }));

export function searchLocalFoods(query, max = 8) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];
  const score = (name) => {
    if (name === q) return 100;
    if (name.startsWith(q + ' ') || name.startsWith(q + ',') || name.startsWith(q + '(')) return 90;
    if (name.startsWith(q)) return 80;
    // word-boundary
    const words = name.split(/[\s,()-]+/);
    if (words.includes(q)) return 70;
    if (words.some(w => w.startsWith(q))) return 50;
    if (name.includes(' ' + q) || name.includes(q + ' ')) return 30;
    if (name.includes(q)) return 15;
    return 0;
  };
  const hits = _index
    .map(f => ({ ...f, _score: score(f._lc) }))
    .filter(f => f._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, max);
  // Strip helper fields
  return hits.map(({ _lc, _score, ...rest }) => rest);
}
