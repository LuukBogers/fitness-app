/* ═══════════════════════════ LOCAL NL FOOD DATABASE ═══════════════════════════
 * NEVO-style Nederlandse voeding (RIVM publieke data), ~220 items, per 100g/100ml.
 * Embedded in bundle → 0ms search, no API call, set-and-forget.
 * Each entry slots into ProductDetailModal (`source: 'nevo'`).
 * ═══════════════════════════════════════════════════════════════════════════ */

const dp = (name, g) => ({ id: 'default', name, g, makeDefault: true });
const dpml = (name, ml) => ({ id: 'default', name, ml, makeDefault: true });

export const LOCAL_FOODS = [
  // ─── Fruit ───
  { id: 'nevo:appel',           name: 'Appel',            kcal: 52,  p: 0.3,  c: 14,    f: 0.2,  defaultPortion: dp('1 appel', 180), category: 'fruit' },
  { id: 'nevo:appel.elstar',    name: 'Appel Elstar',     kcal: 53,  p: 0.3,  c: 14,    f: 0.2,  defaultPortion: dp('1 appel', 180), category: 'fruit' },
  { id: 'nevo:appel.granny',    name: 'Appel Granny Smith', kcal: 48, p: 0.4, c: 12,    f: 0.2,  defaultPortion: dp('1 appel', 180), category: 'fruit' },
  { id: 'nevo:banaan',          name: 'Banaan',           kcal: 89,  p: 1.1,  c: 23,    f: 0.3,  defaultPortion: dp('1 banaan', 120), category: 'fruit' },
  { id: 'nevo:peer',            name: 'Peer',             kcal: 57,  p: 0.4,  c: 15,    f: 0.1,  defaultPortion: dp('1 peer', 170), category: 'fruit' },
  { id: 'nevo:sinaasappel',     name: 'Sinaasappel',      kcal: 47,  p: 0.9,  c: 12,    f: 0.1,  defaultPortion: dp('1 sinaasappel', 150), category: 'fruit' },
  { id: 'nevo:mandarijn',       name: 'Mandarijn',        kcal: 53,  p: 0.8,  c: 13,    f: 0.3,  defaultPortion: dp('1 mandarijn', 80), category: 'fruit' },
  { id: 'nevo:citroen',         name: 'Citroen',          kcal: 29,  p: 1.1,  c: 9,     f: 0.3,  defaultPortion: dp('1 citroen', 100), category: 'fruit' },
  { id: 'nevo:limoen',          name: 'Limoen',           kcal: 30,  p: 0.7,  c: 11,    f: 0.2,  defaultPortion: dp('1 limoen', 70), category: 'fruit' },
  { id: 'nevo:druiven',         name: 'Druiven',          kcal: 67,  p: 0.6,  c: 17,    f: 0.4,  defaultPortion: dp('1 handje', 80), category: 'fruit' },
  { id: 'nevo:aardbeien',       name: 'Aardbeien',        kcal: 32,  p: 0.7,  c: 7.7,   f: 0.3,  defaultPortion: dp('1 bakje', 250), category: 'fruit' },
  { id: 'nevo:blauwe.bessen',   name: 'Blauwe bessen',    kcal: 57,  p: 0.7,  c: 14,    f: 0.3,  defaultPortion: dp('1 bakje', 125), category: 'fruit' },
  { id: 'nevo:framboos',        name: 'Frambozen',        kcal: 52,  p: 1.2,  c: 12,    f: 0.7,  defaultPortion: dp('1 bakje', 125), category: 'fruit' },
  { id: 'nevo:braam',           name: 'Bramen',           kcal: 43,  p: 1.4,  c: 9.6,   f: 0.5,  defaultPortion: dp('1 bakje', 125), category: 'fruit' },
  { id: 'nevo:kers',            name: 'Kersen',           kcal: 63,  p: 1.1,  c: 16,    f: 0.2,  defaultPortion: dp('1 bakje', 200), category: 'fruit' },
  { id: 'nevo:kiwi',            name: 'Kiwi',             kcal: 61,  p: 1.1,  c: 15,    f: 0.5,  defaultPortion: dp('1 kiwi', 75), category: 'fruit' },
  { id: 'nevo:meloen',          name: 'Meloen',           kcal: 34,  p: 0.8,  c: 8,     f: 0.2,  defaultPortion: dp('1 plak', 200), category: 'fruit' },
  { id: 'nevo:watermeloen',     name: 'Watermeloen',      kcal: 30,  p: 0.6,  c: 7.6,   f: 0.2,  defaultPortion: dp('1 plak', 280), category: 'fruit' },
  { id: 'nevo:ananas',          name: 'Ananas',           kcal: 50,  p: 0.5,  c: 13,    f: 0.1,  defaultPortion: dp('1 plak', 120), category: 'fruit' },
  { id: 'nevo:mango',           name: 'Mango',            kcal: 60,  p: 0.8,  c: 15,    f: 0.4,  defaultPortion: dp('1/2 mango', 150), category: 'fruit' },
  { id: 'nevo:perzik',          name: 'Perzik',           kcal: 39,  p: 0.9,  c: 10,    f: 0.3,  defaultPortion: dp('1 perzik', 150), category: 'fruit' },
  { id: 'nevo:nectarine',       name: 'Nectarine',        kcal: 44,  p: 1.1,  c: 11,    f: 0.3,  defaultPortion: dp('1 nectarine', 140), category: 'fruit' },
  { id: 'nevo:abrikoos',        name: 'Abrikoos',         kcal: 48,  p: 1.4,  c: 11,    f: 0.4,  defaultPortion: dp('1 abrikoos', 35), category: 'fruit' },
  { id: 'nevo:pruim',           name: 'Pruim',            kcal: 46,  p: 0.7,  c: 11,    f: 0.3,  defaultPortion: dp('1 pruim', 65), category: 'fruit' },
  { id: 'nevo:avocado',         name: 'Avocado',          kcal: 160, p: 2,    c: 9,     f: 15,   defaultPortion: dp('1/2 avocado', 70), category: 'fruit' },
  { id: 'nevo:granaatappel',    name: 'Granaatappel',     kcal: 83,  p: 1.7,  c: 19,    f: 1.2,  defaultPortion: dp('1/2 granaatappel', 100), category: 'fruit' },
  { id: 'nevo:rozijnen',        name: 'Rozijnen',         kcal: 299, p: 3,    c: 79,    f: 0.5,  defaultPortion: dp('1 handje', 30), category: 'fruit' },
  { id: 'nevo:dadels',          name: 'Dadels',           kcal: 282, p: 2.5,  c: 75,    f: 0.4,  defaultPortion: dp('1 dadel', 8), category: 'fruit' },
  { id: 'nevo:vijgen',          name: 'Vijgen (gedroogd)', kcal: 249, p: 3.3, c: 64,    f: 0.9,  defaultPortion: dp('1 vijg', 20), category: 'fruit' },

  // ─── Groente ───
  { id: 'nevo:tomaat',          name: 'Tomaat',           kcal: 18,  p: 0.9,  c: 3.9,   f: 0.2,  defaultPortion: dp('1 tomaat', 120), category: 'vegetable' },
  { id: 'nevo:cherrytomaat',    name: 'Cherrytomaat',     kcal: 20,  p: 0.9,  c: 4.3,   f: 0.2,  defaultPortion: dp('1 handje', 100), category: 'vegetable' },
  { id: 'nevo:komkommer',       name: 'Komkommer',        kcal: 15,  p: 0.7,  c: 3.6,   f: 0.1,  defaultPortion: dp('1/2 komkommer', 200), category: 'vegetable' },
  { id: 'nevo:paprika.rood',    name: 'Paprika (rood)',   kcal: 31,  p: 1,    c: 6,     f: 0.3,  defaultPortion: dp('1 paprika', 150), category: 'vegetable' },
  { id: 'nevo:paprika.geel',    name: 'Paprika (geel)',   kcal: 27,  p: 1,    c: 6,     f: 0.2,  defaultPortion: dp('1 paprika', 150), category: 'vegetable' },
  { id: 'nevo:paprika.groen',   name: 'Paprika (groen)',  kcal: 20,  p: 0.9,  c: 4.6,   f: 0.2,  defaultPortion: dp('1 paprika', 150), category: 'vegetable' },
  { id: 'nevo:sla',             name: 'Sla',              kcal: 15,  p: 1.4,  c: 2.9,   f: 0.2,  defaultPortion: dp('1 bord', 50), category: 'vegetable' },
  { id: 'nevo:rucola',          name: 'Rucola',           kcal: 25,  p: 2.6,  c: 3.7,   f: 0.7,  defaultPortion: dp('1 portie', 40), category: 'vegetable' },
  { id: 'nevo:veldsla',         name: 'Veldsla',          kcal: 21,  p: 2,    c: 3.6,   f: 0.4,  defaultPortion: dp('1 portie', 40), category: 'vegetable' },
  { id: 'nevo:ijsbergsla',      name: 'IJsbergsla',       kcal: 14,  p: 0.9,  c: 3,     f: 0.1,  defaultPortion: dp('1 bord', 75), category: 'vegetable' },
  { id: 'nevo:wortel',          name: 'Wortel',           kcal: 41,  p: 0.9,  c: 9.6,   f: 0.2,  defaultPortion: dp('1 wortel', 60), category: 'vegetable' },
  { id: 'nevo:broccoli',        name: 'Broccoli',         kcal: 34,  p: 2.8,  c: 7,     f: 0.4,  defaultPortion: dp('1 portie', 150), category: 'vegetable' },
  { id: 'nevo:bloemkool',       name: 'Bloemkool',        kcal: 25,  p: 1.9,  c: 5,     f: 0.3,  defaultPortion: dp('1 portie', 200), category: 'vegetable' },
  { id: 'nevo:spinazie',        name: 'Spinazie',         kcal: 23,  p: 2.9,  c: 3.6,   f: 0.4,  defaultPortion: dp('1 portie', 150), category: 'vegetable' },
  { id: 'nevo:andijvie',        name: 'Andijvie',         kcal: 17,  p: 1.3,  c: 3.4,   f: 0.2,  defaultPortion: dp('1 portie', 150), category: 'vegetable' },
  { id: 'nevo:boerenkool',      name: 'Boerenkool',       kcal: 49,  p: 4.3,  c: 8.8,   f: 0.9,  defaultPortion: dp('1 portie', 150), category: 'vegetable' },
  { id: 'nevo:rode.kool',       name: 'Rode kool',        kcal: 31,  p: 1.4,  c: 7.4,   f: 0.2,  defaultPortion: dp('1 portie', 150), category: 'vegetable' },
  { id: 'nevo:witte.kool',      name: 'Witte kool',       kcal: 25,  p: 1.3,  c: 5.8,   f: 0.1,  defaultPortion: dp('1 portie', 150), category: 'vegetable' },
  { id: 'nevo:spruitjes',       name: 'Spruitjes',        kcal: 43,  p: 3.4,  c: 8.9,   f: 0.3,  defaultPortion: dp('1 portie', 150), category: 'vegetable' },
  { id: 'nevo:sperziebonen',    name: 'Sperziebonen',     kcal: 31,  p: 1.8,  c: 7,     f: 0.2,  defaultPortion: dp('1 portie', 150), category: 'vegetable' },
  { id: 'nevo:erwten',          name: 'Erwten',           kcal: 81,  p: 5.4,  c: 14,    f: 0.4,  defaultPortion: dp('1 portie', 150), category: 'vegetable' },
  { id: 'nevo:mais',            name: 'Mais',             kcal: 86,  p: 3.3,  c: 19,    f: 1.4,  defaultPortion: dp('1 portie', 100), category: 'vegetable' },
  { id: 'nevo:champignons',     name: 'Champignons',      kcal: 22,  p: 3.1,  c: 3.3,   f: 0.3,  defaultPortion: dp('1 bakje', 250), category: 'vegetable' },
  { id: 'nevo:ui',              name: 'Ui',               kcal: 40,  p: 1.1,  c: 9.3,   f: 0.1,  defaultPortion: dp('1 ui', 100), category: 'vegetable' },
  { id: 'nevo:rode.ui',         name: 'Rode ui',          kcal: 38,  p: 1,    c: 9,     f: 0.1,  defaultPortion: dp('1 ui', 100), category: 'vegetable' },
  { id: 'nevo:knoflook',        name: 'Knoflook',         kcal: 149, p: 6.4,  c: 33,    f: 0.5,  defaultPortion: dp('1 teen', 4), category: 'vegetable' },
  { id: 'nevo:prei',            name: 'Prei',             kcal: 61,  p: 1.5,  c: 14,    f: 0.3,  defaultPortion: dp('1 stengel', 100), category: 'vegetable' },
  { id: 'nevo:aardappel',       name: 'Aardappel (gekookt)', kcal: 87, p: 1.9, c: 20,  f: 0.1,  defaultPortion: dp('1 portie', 200), category: 'vegetable' },
  { id: 'nevo:aardappel.gebakken', name: 'Gebakken aardappel', kcal: 150, p: 2.5, c: 23, f: 5,  defaultPortion: dp('1 portie', 200), category: 'vegetable' },
  { id: 'nevo:friet',           name: 'Friet',            kcal: 312, p: 3.4,  c: 41,    f: 15,   defaultPortion: dp('1 portie', 150), category: 'vegetable' },
  { id: 'nevo:zoete.aardappel', name: 'Zoete aardappel',  kcal: 86,  p: 1.6,  c: 20,    f: 0.1,  defaultPortion: dp('1 portie', 200), category: 'vegetable' },
  { id: 'nevo:courgette',       name: 'Courgette',        kcal: 17,  p: 1.2,  c: 3.1,   f: 0.3,  defaultPortion: dp('1/2 courgette', 200), category: 'vegetable' },
  { id: 'nevo:aubergine',       name: 'Aubergine',        kcal: 25,  p: 1,    c: 6,     f: 0.2,  defaultPortion: dp('1/2 aubergine', 200), category: 'vegetable' },
  { id: 'nevo:pompoen',         name: 'Pompoen',          kcal: 26,  p: 1,    c: 6.5,   f: 0.1,  defaultPortion: dp('1 portie', 200), category: 'vegetable' },
  { id: 'nevo:radijs',          name: 'Radijs',           kcal: 16,  p: 0.7,  c: 3.4,   f: 0.1,  defaultPortion: dp('1 portie', 50), category: 'vegetable' },
  { id: 'nevo:bleekselderij',   name: 'Bleekselderij',    kcal: 16,  p: 0.7,  c: 3,     f: 0.2,  defaultPortion: dp('1 stengel', 40), category: 'vegetable' },
  { id: 'nevo:bietje',          name: 'Rode biet',        kcal: 43,  p: 1.6,  c: 9.6,   f: 0.2,  defaultPortion: dp('1 biet', 80), category: 'vegetable' },
  { id: 'nevo:asperges',        name: 'Asperges',         kcal: 20,  p: 2.2,  c: 3.9,   f: 0.1,  defaultPortion: dp('1 portie', 200), category: 'vegetable' },

  // ─── Vlees ───
  { id: 'nevo:kipfilet',        name: 'Kipfilet (rauw)',  kcal: 110, p: 23,   c: 0,     f: 1.5,  defaultPortion: dp('1 filet', 150), category: 'meat' },
  { id: 'nevo:kipfilet.gegrild',name: 'Kipfilet gegrild', kcal: 165, p: 31,   c: 0,     f: 3.6,  defaultPortion: dp('1 portie', 120), category: 'meat' },
  { id: 'nevo:kipfilet.gerookt',name: 'Gerookte kipfilet', kcal: 110, p: 24,  c: 0.5,   f: 1.5,  defaultPortion: dp('3 plakjes', 30), category: 'meat' },
  { id: 'nevo:kippendij',       name: 'Kippendij',        kcal: 175, p: 20,   c: 0,     f: 10,   defaultPortion: dp('1 portie', 150), category: 'meat' },
  { id: 'nevo:kalkoenfilet',    name: 'Kalkoenfilet',     kcal: 104, p: 22,   c: 0,     f: 1.6,  defaultPortion: dp('1 portie', 150), category: 'meat' },
  { id: 'nevo:gehakt.rund',     name: 'Rundergehakt',     kcal: 230, p: 17,   c: 0,     f: 18,   defaultPortion: dp('1 portie', 150), category: 'meat' },
  { id: 'nevo:gehakt.halfom',   name: 'Half-om-half gehakt', kcal: 244, p: 17, c: 0,    f: 20,   defaultPortion: dp('1 portie', 150), category: 'meat' },
  { id: 'nevo:gehakt.mager',    name: 'Mager rundergehakt', kcal: 137, p: 21, c: 0,     f: 5.5,  defaultPortion: dp('1 portie', 150), category: 'meat' },
  { id: 'nevo:biefstuk',        name: 'Biefstuk',         kcal: 192, p: 28,   c: 0,     f: 8,    defaultPortion: dp('1 stuk', 150), category: 'meat' },
  { id: 'nevo:entrecote',       name: 'Entrecote',        kcal: 252, p: 25,   c: 0,     f: 17,   defaultPortion: dp('1 stuk', 200), category: 'meat' },
  { id: 'nevo:rosbief',         name: 'Rosbief',          kcal: 137, p: 26,   c: 0,     f: 3.5,  defaultPortion: dp('3 plakjes', 30), category: 'meat' },
  { id: 'nevo:varkenshaas',     name: 'Varkenshaas',      kcal: 144, p: 24,   c: 0,     f: 4.5,  defaultPortion: dp('1 portie', 150), category: 'meat' },
  { id: 'nevo:varkenskotelet',  name: 'Varkenskotelet',   kcal: 231, p: 23,   c: 0,     f: 15,   defaultPortion: dp('1 stuk', 180), category: 'meat' },
  { id: 'nevo:spek',            name: 'Spek',             kcal: 417, p: 10,   c: 0,     f: 42,   defaultPortion: dp('2 plakjes', 30), category: 'meat' },
  { id: 'nevo:bacon',           name: 'Bacon',            kcal: 540, p: 12,   c: 1.4,   f: 53,   defaultPortion: dp('2 plakjes', 30), category: 'meat' },
  { id: 'nevo:ham',             name: 'Ham',              kcal: 145, p: 18,   c: 1.5,   f: 7.5,  defaultPortion: dp('2 plakjes', 30), category: 'meat' },
  { id: 'nevo:beenham',         name: 'Beenham',          kcal: 145, p: 20,   c: 0.5,   f: 7,    defaultPortion: dp('2 plakjes', 30), category: 'meat' },
  { id: 'nevo:hamburger',       name: 'Hamburger',        kcal: 280, p: 17,   c: 0,     f: 23,   defaultPortion: dp('1 burger', 120), category: 'meat' },
  { id: 'nevo:saucijs',         name: 'Saucijs',          kcal: 322, p: 14,   c: 4,     f: 28,   defaultPortion: dp('1 saucijs', 100), category: 'meat' },
  { id: 'nevo:salami',          name: 'Salami',           kcal: 378, p: 22,   c: 1,     f: 31,   defaultPortion: dp('3 plakjes', 20), category: 'meat' },
  { id: 'nevo:worst.boterham',  name: 'Boterhamworst',    kcal: 263, p: 13,   c: 1,     f: 23,   defaultPortion: dp('2 plakjes', 30), category: 'meat' },
  { id: 'nevo:rookworst',       name: 'Rookworst',        kcal: 320, p: 13,   c: 1,     f: 29,   defaultPortion: dp('1 portie', 100), category: 'meat' },

  // ─── Vis ───
  { id: 'nevo:zalm',            name: 'Zalm',             kcal: 208, p: 20,   c: 0,     f: 13,   defaultPortion: dp('1 filet', 150), category: 'fish' },
  { id: 'nevo:zalm.gerookt',    name: 'Gerookte zalm',    kcal: 117, p: 18,   c: 0,     f: 4.3,  defaultPortion: dp('1 portie', 75), category: 'fish' },
  { id: 'nevo:tonijn.water',    name: 'Tonijn (in water)', kcal: 116, p: 26,  c: 0,     f: 1,    defaultPortion: dp('1 blikje', 80), category: 'fish' },
  { id: 'nevo:tonijn.olie',     name: 'Tonijn (in olie)', kcal: 198, p: 26,   c: 0,     f: 10,   defaultPortion: dp('1 blikje', 80), category: 'fish' },
  { id: 'nevo:makreel',         name: 'Makreel',          kcal: 205, p: 19,   c: 0,     f: 14,   defaultPortion: dp('1 filet', 100), category: 'fish' },
  { id: 'nevo:haring',          name: 'Haring',           kcal: 217, p: 18,   c: 0,     f: 16,   defaultPortion: dp('1 haring', 100), category: 'fish' },
  { id: 'nevo:kabeljauw',       name: 'Kabeljauw',        kcal: 82,  p: 18,   c: 0,     f: 0.7,  defaultPortion: dp('1 filet', 150), category: 'fish' },
  { id: 'nevo:tilapia',         name: 'Tilapia',          kcal: 96,  p: 20,   c: 0,     f: 1.7,  defaultPortion: dp('1 filet', 150), category: 'fish' },
  { id: 'nevo:pangasius',       name: 'Pangasius',        kcal: 90,  p: 15,   c: 0,     f: 3,    defaultPortion: dp('1 filet', 150), category: 'fish' },
  { id: 'nevo:schol',           name: 'Schol',            kcal: 75,  p: 17,   c: 0,     f: 0.8,  defaultPortion: dp('1 filet', 150), category: 'fish' },
  { id: 'nevo:garnalen',        name: 'Garnalen',         kcal: 99,  p: 24,   c: 0,     f: 0.3,  defaultPortion: dp('1 portie', 100), category: 'fish' },
  { id: 'nevo:mosselen',        name: 'Mosselen',         kcal: 86,  p: 12,   c: 3.7,   f: 2.2,  defaultPortion: dp('1 portie', 200), category: 'fish' },
  { id: 'nevo:kibbeling',       name: 'Kibbeling',        kcal: 234, p: 14,   c: 18,    f: 13,   defaultPortion: dp('1 portie', 150), category: 'fish' },
  { id: 'nevo:vissticks',       name: 'Vissticks',        kcal: 200, p: 13,   c: 19,    f: 8.5,  defaultPortion: dp('3 stuks', 90), category: 'fish' },

  // ─── Eieren ───
  { id: 'nevo:ei',              name: 'Ei',               kcal: 143, p: 13,   c: 0.7,   f: 9.5,  defaultPortion: dp('1 ei', 60), category: 'meat' },
  { id: 'nevo:eiwit',           name: 'Eiwit (van ei)',   kcal: 48,  p: 11,   c: 0.7,   f: 0.2,  defaultPortion: dp('1 eiwit', 33), category: 'meat' },
  { id: 'nevo:eidooier',        name: 'Eidooier',         kcal: 322, p: 16,   c: 3.6,   f: 27,   defaultPortion: dp('1 dooier', 17), category: 'meat' },
  { id: 'nevo:ei.gebakken',     name: 'Spiegelei',        kcal: 196, p: 14,   c: 0.8,   f: 15,   defaultPortion: dp('1 ei', 65), category: 'meat' },
  { id: 'nevo:omelet',          name: 'Omelet (2 eieren)', kcal: 157, p: 11,  c: 0.8,   f: 12,   defaultPortion: dp('1 omelet', 130), category: 'meat' },

  // ─── Zuivel ───
  { id: 'nevo:melk.halfvol',    name: 'Melk halfvol',     kcal: 47,  p: 3.5,  c: 4.7,   f: 1.5,  defaultPortion: dpml('1 glas', 200), category: 'dairy' },
  { id: 'nevo:melk.volle',      name: 'Volle melk',       kcal: 64,  p: 3.4,  c: 4.7,   f: 3.5,  defaultPortion: dpml('1 glas', 200), category: 'dairy' },
  { id: 'nevo:melk.mager',      name: 'Magere melk',      kcal: 35,  p: 3.5,  c: 4.9,   f: 0.1,  defaultPortion: dpml('1 glas', 200), category: 'dairy' },
  { id: 'nevo:melk.lactosevrij',name: 'Lactosevrije melk',kcal: 47,  p: 3.5,  c: 4.7,   f: 1.5,  defaultPortion: dpml('1 glas', 200), category: 'dairy' },
  { id: 'nevo:karnemelk',       name: 'Karnemelk',        kcal: 37,  p: 3.4,  c: 4,     f: 0.8,  defaultPortion: dpml('1 glas', 200), category: 'dairy' },
  { id: 'nevo:sojamelk',        name: 'Sojamelk',         kcal: 39,  p: 3.5,  c: 1.2,   f: 2,    defaultPortion: dpml('1 glas', 200), category: 'dairy' },
  { id: 'nevo:havermelk',       name: 'Havermelk',        kcal: 47,  p: 1,    c: 8,     f: 1.5,  defaultPortion: dpml('1 glas', 200), category: 'dairy' },
  { id: 'nevo:amandelmelk',     name: 'Amandelmelk',      kcal: 24,  p: 0.5,  c: 3,     f: 1.1,  defaultPortion: dpml('1 glas', 200), category: 'dairy' },
  { id: 'nevo:kwark.magere',    name: 'Magere kwark',     kcal: 51,  p: 9,    c: 4,     f: 0.2,  defaultPortion: dp('1 bakje', 250), category: 'dairy' },
  { id: 'nevo:kwark.halfvolle', name: 'Halfvolle kwark',  kcal: 75,  p: 8,    c: 4,     f: 3,    defaultPortion: dp('1 bakje', 250), category: 'dairy' },
  { id: 'nevo:kwark.volle',     name: 'Volle kwark',      kcal: 117, p: 7.4,  c: 3.6,   f: 8.5,  defaultPortion: dp('1 bakje', 250), category: 'dairy' },
  { id: 'nevo:kwark.frans',     name: 'Franse kwark',     kcal: 70,  p: 7,    c: 4,     f: 3,    defaultPortion: dp('1 bakje', 250), category: 'dairy' },
  { id: 'nevo:yoghurt.magere',  name: 'Magere yoghurt',   kcal: 41,  p: 4,    c: 5.6,   f: 0.1,  defaultPortion: dp('1 bakje', 150), category: 'dairy' },
  { id: 'nevo:yoghurt.volle',   name: 'Volle yoghurt',    kcal: 62,  p: 3.5,  c: 4.7,   f: 3.3,  defaultPortion: dp('1 bakje', 150), category: 'dairy' },
  { id: 'nevo:yoghurt.griekse', name: 'Griekse yoghurt',  kcal: 97,  p: 9,    c: 4,     f: 5,    defaultPortion: dp('1 bakje', 150), category: 'dairy' },
  { id: 'nevo:skyr',            name: 'Skyr',             kcal: 60,  p: 11,   c: 3.8,   f: 0.2,  defaultPortion: dp('1 bakje', 150), category: 'dairy' },
  { id: 'nevo:cottage.cheese',  name: 'Cottage cheese',   kcal: 98,  p: 11,   c: 3.4,   f: 4.3,  defaultPortion: dp('1 bakje', 150), category: 'dairy' },
  { id: 'nevo:huttenkase',      name: 'Hüttenkäse',       kcal: 95,  p: 12,   c: 3.3,   f: 4,    defaultPortion: dp('1 bakje', 150), category: 'dairy' },
  { id: 'nevo:kaas.30plus',     name: 'Kaas 30+',         kcal: 304, p: 28,   c: 0,     f: 21,   defaultPortion: dp('1 plak', 20), category: 'dairy' },
  { id: 'nevo:kaas.48plus',     name: 'Kaas 48+ (jong)',  kcal: 378, p: 24,   c: 0,     f: 31,   defaultPortion: dp('1 plak', 20), category: 'dairy' },
  { id: 'nevo:kaas.belegen',    name: 'Kaas (belegen)',   kcal: 394, p: 26,   c: 0,     f: 32,   defaultPortion: dp('1 plak', 20), category: 'dairy' },
  { id: 'nevo:kaas.oud',        name: 'Oude kaas',        kcal: 406, p: 30,   c: 0,     f: 32,   defaultPortion: dp('1 plak', 20), category: 'dairy' },
  { id: 'nevo:mozzarella',      name: 'Mozzarella',       kcal: 254, p: 18,   c: 2,     f: 19,   defaultPortion: dp('1 bol', 125), category: 'dairy' },
  { id: 'nevo:feta',            name: 'Feta',             kcal: 264, p: 14,   c: 4,     f: 21,   defaultPortion: dp('1 portie', 40), category: 'dairy' },
  { id: 'nevo:parmezaan',       name: 'Parmezaan',        kcal: 431, p: 38,   c: 4,     f: 29,   defaultPortion: dp('1 eetlepel', 10), category: 'dairy' },
  { id: 'nevo:roomkaas',        name: 'Roomkaas',         kcal: 343, p: 6,    c: 4,     f: 34,   defaultPortion: dp('1 broodsmeer', 15), category: 'dairy' },
  { id: 'nevo:roomboter',       name: 'Roomboter',        kcal: 717, p: 0.8,  c: 0.5,   f: 81,   defaultPortion: dp('1 mes', 5), category: 'dairy' },
  { id: 'nevo:margarine',       name: 'Margarine',        kcal: 533, p: 0.5,  c: 0.5,   f: 60,   defaultPortion: dp('1 mes', 5), category: 'dairy' },
  { id: 'nevo:halvarine',       name: 'Halvarine',        kcal: 365, p: 0.5,  c: 0.5,   f: 40,   defaultPortion: dp('1 mes', 5), category: 'dairy' },
  { id: 'nevo:slagroom',        name: 'Slagroom',         kcal: 345, p: 2.4,  c: 3.3,   f: 35,   defaultPortion: dpml('1 eetlepel', 15), category: 'dairy' },
  { id: 'nevo:creme.fraiche',   name: 'Crème fraîche',    kcal: 300, p: 2.5,  c: 3,     f: 30,   defaultPortion: dp('1 eetlepel', 15), category: 'dairy' },

  // ─── Granen, brood, pasta ───
  { id: 'nevo:brood.wit',       name: 'Wit brood',        kcal: 252, p: 8,    c: 49,    f: 2.5,  defaultPortion: dp('1 snee', 35), category: 'grain' },
  { id: 'nevo:brood.bruin',     name: 'Bruin brood',      kcal: 230, p: 9,    c: 41,    f: 3.5,  defaultPortion: dp('1 snee', 35), category: 'grain' },
  { id: 'nevo:brood.volkoren',  name: 'Volkoren brood',   kcal: 219, p: 10,   c: 38,    f: 3,    defaultPortion: dp('1 snee', 35), category: 'grain' },
  { id: 'nevo:brood.rogge',     name: 'Roggebrood',       kcal: 200, p: 6,    c: 41,    f: 1.7,  defaultPortion: dp('1 snee', 35), category: 'grain' },
  { id: 'nevo:brood.meergranen',name: 'Meergranenbrood',  kcal: 240, p: 10,   c: 41,    f: 4,    defaultPortion: dp('1 snee', 35), category: 'grain' },
  { id: 'nevo:knackebrod',      name: 'Knäckebröd',       kcal: 354, p: 11,   c: 66,    f: 2.5,  defaultPortion: dp('1 cracker', 10), category: 'grain' },
  { id: 'nevo:beschuit',        name: 'Beschuit',         kcal: 408, p: 11,   c: 75,    f: 7,    defaultPortion: dp('1 beschuit', 9), category: 'grain' },
  { id: 'nevo:cracker',         name: 'Cracker',          kcal: 416, p: 9,    c: 72,    f: 9,    defaultPortion: dp('1 cracker', 10), category: 'grain' },
  { id: 'nevo:rijstwafel',      name: 'Rijstwafel',       kcal: 387, p: 8,    c: 82,    f: 3,    defaultPortion: dp('1 wafel', 10), category: 'grain' },
  { id: 'nevo:havermout',       name: 'Havermout',        kcal: 379, p: 13,   c: 67,    f: 7,    defaultPortion: dp('1 bakje', 50), category: 'grain' },
  { id: 'nevo:musli',           name: 'Muesli',           kcal: 367, p: 10,   c: 66,    f: 6,    defaultPortion: dp('1 portie', 50), category: 'grain' },
  { id: 'nevo:cruesli',         name: 'Cruesli',          kcal: 442, p: 8,    c: 65,    f: 16,   defaultPortion: dp('1 portie', 50), category: 'grain' },
  { id: 'nevo:cornflakes',      name: 'Cornflakes',       kcal: 378, p: 7.5,  c: 84,    f: 0.9,  defaultPortion: dp('1 portie', 30), category: 'grain' },
  { id: 'nevo:rijst.wit',       name: 'Witte rijst (gekookt)', kcal: 130, p: 2.7, c: 28, f: 0.3, defaultPortion: dp('1 opscheplepel', 70), category: 'grain' },
  { id: 'nevo:rijst.bruin',     name: 'Zilvervliesrijst (gekookt)', kcal: 122, p: 2.6, c: 25, f: 1, defaultPortion: dp('1 opscheplepel', 70), category: 'grain' },
  { id: 'nevo:rijst.basmati',   name: 'Basmati rijst (gekookt)', kcal: 121, p: 3, c: 25, f: 0.4, defaultPortion: dp('1 opscheplepel', 70), category: 'grain' },
  { id: 'nevo:pasta',           name: 'Pasta (gekookt)',  kcal: 158, p: 5.8,  c: 31,    f: 0.9,  defaultPortion: dp('1 portie', 200), category: 'grain' },
  { id: 'nevo:spaghetti',       name: 'Spaghetti (gekookt)', kcal: 158, p: 5.8, c: 31, f: 0.9, defaultPortion: dp('1 portie', 200), category: 'grain' },
  { id: 'nevo:pasta.volkoren',  name: 'Volkorenpasta (gekookt)', kcal: 124, p: 5, c: 26, f: 0.9, defaultPortion: dp('1 portie', 200), category: 'grain' },
  { id: 'nevo:couscous',        name: 'Couscous (gekookt)', kcal: 112, p: 3.8, c: 23,   f: 0.2,  defaultPortion: dp('1 portie', 150), category: 'grain' },
  { id: 'nevo:quinoa',          name: 'Quinoa (gekookt)', kcal: 120, p: 4.4,  c: 21,    f: 1.9,  defaultPortion: dp('1 portie', 150), category: 'grain' },
  { id: 'nevo:bulgur',          name: 'Bulgur (gekookt)', kcal: 83,  p: 3,    c: 19,    f: 0.2,  defaultPortion: dp('1 portie', 150), category: 'grain' },
  { id: 'nevo:tortilla',        name: 'Tortilla (tarwe)', kcal: 304, p: 8.7,  c: 50,    f: 8,    defaultPortion: dp('1 tortilla', 50), category: 'grain' },
  { id: 'nevo:pita',            name: 'Pitabroodje',      kcal: 275, p: 9,    c: 56,    f: 1.2,  defaultPortion: dp('1 pita', 60), category: 'grain' },
  { id: 'nevo:naan',            name: 'Naan',             kcal: 310, p: 9,    c: 50,    f: 8,    defaultPortion: dp('1 naan', 90), category: 'grain' },

  // ─── Peulvruchten, noten ───
  { id: 'nevo:pindas',          name: 'Pinda\'s',         kcal: 567, p: 26,   c: 16,    f: 49,   defaultPortion: dp('1 handje', 30), category: 'snack' },
  { id: 'nevo:amandelen',       name: 'Amandelen',        kcal: 579, p: 21,   c: 22,    f: 50,   defaultPortion: dp('1 handje', 30), category: 'snack' },
  { id: 'nevo:walnoten',        name: 'Walnoten',         kcal: 654, p: 15,   c: 14,    f: 65,   defaultPortion: dp('1 handje', 30), category: 'snack' },
  { id: 'nevo:cashewnoten',     name: 'Cashewnoten',      kcal: 553, p: 18,   c: 30,    f: 44,   defaultPortion: dp('1 handje', 30), category: 'snack' },
  { id: 'nevo:hazelnoten',      name: 'Hazelnoten',       kcal: 628, p: 15,   c: 17,    f: 61,   defaultPortion: dp('1 handje', 30), category: 'snack' },
  { id: 'nevo:macadamia',       name: 'Macadamia noten',  kcal: 718, p: 8,    c: 14,    f: 76,   defaultPortion: dp('1 handje', 30), category: 'snack' },
  { id: 'nevo:paranoten',       name: 'Paranoten',        kcal: 656, p: 14,   c: 12,    f: 67,   defaultPortion: dp('1 handje', 30), category: 'snack' },
  { id: 'nevo:pistachenoten',   name: 'Pistachenoten',    kcal: 562, p: 20,   c: 28,    f: 45,   defaultPortion: dp('1 handje', 30), category: 'snack' },
  { id: 'nevo:zonnebloempitten',name: 'Zonnebloempitten', kcal: 584, p: 21,   c: 20,    f: 51,   defaultPortion: dp('1 eetlepel', 10), category: 'snack' },
  { id: 'nevo:pompoenpitten',   name: 'Pompoenpitten',    kcal: 559, p: 30,   c: 11,    f: 49,   defaultPortion: dp('1 eetlepel', 10), category: 'snack' },
  { id: 'nevo:chiazaad',        name: 'Chiazaad',         kcal: 486, p: 17,   c: 42,    f: 31,   defaultPortion: dp('1 eetlepel', 12), category: 'snack' },
  { id: 'nevo:lijnzaad',        name: 'Lijnzaad',         kcal: 534, p: 18,   c: 29,    f: 42,   defaultPortion: dp('1 eetlepel', 10), category: 'snack' },
  { id: 'nevo:pindakaas',       name: 'Pindakaas',        kcal: 588, p: 25,   c: 20,    f: 50,   defaultPortion: dp('1 broodsmeer', 15), category: 'spread' },
  { id: 'nevo:amandelpasta',    name: 'Amandelpasta',     kcal: 614, p: 21,   c: 19,    f: 56,   defaultPortion: dp('1 broodsmeer', 15), category: 'spread' },
  { id: 'nevo:bonen.bruin',     name: 'Bruine bonen',     kcal: 132, p: 9,    c: 21,    f: 0.5,  defaultPortion: dp('1 portie', 200), category: 'grain' },
  { id: 'nevo:bonen.witte',     name: 'Witte bonen',      kcal: 139, p: 9,    c: 23,    f: 0.6,  defaultPortion: dp('1 portie', 200), category: 'grain' },
  { id: 'nevo:bonen.kidney',    name: 'Kidneybonen',      kcal: 127, p: 9,    c: 23,    f: 0.5,  defaultPortion: dp('1 portie', 200), category: 'grain' },
  { id: 'nevo:bonen.zwarte',    name: 'Zwarte bonen',     kcal: 132, p: 9,    c: 24,    f: 0.5,  defaultPortion: dp('1 portie', 200), category: 'grain' },
  { id: 'nevo:linzen',          name: 'Linzen (gekookt)', kcal: 116, p: 9,    c: 20,    f: 0.4,  defaultPortion: dp('1 portie', 200), category: 'grain' },
  { id: 'nevo:kikkererwten',    name: 'Kikkererwten (gekookt)', kcal: 164, p: 9, c: 27, f: 2.6, defaultPortion: dp('1 portie', 200), category: 'grain' },
  { id: 'nevo:tofu',            name: 'Tofu',             kcal: 144, p: 17,   c: 0.6,   f: 8.7,  defaultPortion: dp('1 portie', 150), category: 'meat' },
  { id: 'nevo:tempeh',          name: 'Tempeh',           kcal: 195, p: 19,   c: 9,     f: 11,   defaultPortion: dp('1 portie', 100), category: 'meat' },
  { id: 'nevo:seitan',          name: 'Seitan',           kcal: 121, p: 24,   c: 4,     f: 1.9,  defaultPortion: dp('1 portie', 100), category: 'meat' },
  { id: 'nevo:hummus',          name: 'Hummus',           kcal: 166, p: 8,    c: 14,    f: 10,   defaultPortion: dp('1 eetlepel', 15), category: 'spread' },

  // ─── Vetten, oliën, sauzen ───
  { id: 'nevo:olijfolie',       name: 'Olijfolie',        kcal: 884, p: 0,    c: 0,     f: 100,  defaultPortion: dpml('1 eetlepel', 15), category: 'oil' },
  { id: 'nevo:zonnebloemolie',  name: 'Zonnebloemolie',   kcal: 884, p: 0,    c: 0,     f: 100,  defaultPortion: dpml('1 eetlepel', 15), category: 'oil' },
  { id: 'nevo:kokosolie',       name: 'Kokosolie',        kcal: 862, p: 0,    c: 0,     f: 100,  defaultPortion: dpml('1 eetlepel', 15), category: 'oil' },
  { id: 'nevo:mayonaise',       name: 'Mayonaise',        kcal: 680, p: 1,    c: 1.5,   f: 75,   defaultPortion: dp('1 eetlepel', 15), category: 'sauce' },
  { id: 'nevo:fritessaus',      name: 'Fritessaus',       kcal: 470, p: 1,    c: 9,     f: 48,   defaultPortion: dp('1 eetlepel', 15), category: 'sauce' },
  { id: 'nevo:ketchup',         name: 'Ketchup',          kcal: 101, p: 1.2,  c: 24,    f: 0.1,  defaultPortion: dp('1 eetlepel', 15), category: 'sauce' },
  { id: 'nevo:mosterd',         name: 'Mosterd',          kcal: 80,  p: 5,    c: 6,     f: 4,    defaultPortion: dp('1 theelepel', 5), category: 'sauce' },
  { id: 'nevo:sojasaus',        name: 'Sojasaus',         kcal: 60,  p: 8,    c: 6,     f: 0,    defaultPortion: dp('1 eetlepel', 15), category: 'sauce' },
  { id: 'nevo:pesto',           name: 'Pesto',            kcal: 458, p: 7,    c: 6,     f: 45,   defaultPortion: dp('1 eetlepel', 15), category: 'sauce' },
  { id: 'nevo:tomatensaus',     name: 'Tomatensaus',      kcal: 67,  p: 1.6,  c: 8,     f: 3,    defaultPortion: dp('1 portie', 100), category: 'sauce' },
  { id: 'nevo:tzatziki',        name: 'Tzatziki',         kcal: 96,  p: 3,    c: 5,     f: 7,    defaultPortion: dp('1 eetlepel', 15), category: 'sauce' },

  // ─── Snacks, koekjes ───
  { id: 'nevo:chocolade.puur',  name: 'Pure chocolade',   kcal: 546, p: 4.9,  c: 61,    f: 31,   defaultPortion: dp('1 reep', 30), category: 'snack' },
  { id: 'nevo:chocolade.melk',  name: 'Melkchocolade',    kcal: 535, p: 7.6,  c: 59,    f: 30,   defaultPortion: dp('1 reep', 30), category: 'snack' },
  { id: 'nevo:chocolade.wit',   name: 'Witte chocolade',  kcal: 539, p: 5.9,  c: 59,    f: 32,   defaultPortion: dp('1 reep', 30), category: 'snack' },
  { id: 'nevo:chips.naturel',   name: 'Chips (naturel)',  kcal: 536, p: 6.6,  c: 50,    f: 35,   defaultPortion: dp('1 handje', 30), category: 'snack' },
  { id: 'nevo:chips.paprika',   name: 'Chips paprika',    kcal: 525, p: 6,    c: 53,    f: 33,   defaultPortion: dp('1 handje', 30), category: 'snack' },
  { id: 'nevo:popcorn',         name: 'Popcorn',          kcal: 387, p: 12,   c: 78,    f: 4,    defaultPortion: dp('1 handje', 25), category: 'snack' },
  { id: 'nevo:nootjes.zout',    name: 'Gezouten noten mix', kcal: 600, p: 17, c: 17,    f: 53,   defaultPortion: dp('1 handje', 30), category: 'snack' },
  { id: 'nevo:koek.gevuld',     name: 'Gevulde koek',     kcal: 405, p: 5.5,  c: 65,    f: 14,   defaultPortion: dp('1 koek', 50), category: 'snack' },
  { id: 'nevo:stroopwafel',     name: 'Stroopwafel',      kcal: 451, p: 4.5,  c: 65,    f: 19,   defaultPortion: dp('1 wafel', 35), category: 'snack' },
  { id: 'nevo:ontbijtkoek',     name: 'Ontbijtkoek',      kcal: 318, p: 5,    c: 71,    f: 1.5,  defaultPortion: dp('1 plak', 35), category: 'snack' },
  { id: 'nevo:speculaas',       name: 'Speculaas',        kcal: 477, p: 5,    c: 68,    f: 20,   defaultPortion: dp('1 koekje', 13), category: 'snack' },
  { id: 'nevo:eierkoek',        name: 'Eierkoek',         kcal: 358, p: 7,    c: 70,    f: 5.5,  defaultPortion: dp('1 koek', 40), category: 'snack' },
  { id: 'nevo:cake',            name: 'Cake',             kcal: 365, p: 5,    c: 50,    f: 16,   defaultPortion: dp('1 plak', 50), category: 'snack' },
  { id: 'nevo:ijs.vanille',     name: 'Vanille-ijs',      kcal: 207, p: 3.5,  c: 24,    f: 11,   defaultPortion: dpml('1 bol', 60), category: 'snack' },
  { id: 'nevo:snelle.jelle',    name: 'Snelle Jelle',     kcal: 350, p: 5,    c: 70,    f: 6,    defaultPortion: dp('1 koek', 60), category: 'snack' },
  { id: 'nevo:liga',            name: 'Liga koek',        kcal: 430, p: 7,    c: 65,    f: 15,   defaultPortion: dp('1 koek', 21), category: 'snack' },

  // ─── Sportvoeding ───
  { id: 'nevo:whey.shake',      name: 'Whey-eiwitshake',  kcal: 120, p: 24,   c: 3,     f: 1.5,  defaultPortion: dp('1 schep', 30), category: 'sport' },
  { id: 'nevo:caseine',         name: 'Caseïne shake',    kcal: 110, p: 24,   c: 2.5,   f: 1,    defaultPortion: dp('1 schep', 30), category: 'sport' },
  { id: 'nevo:eiwitreep',       name: 'Eiwitreep',        kcal: 380, p: 30,   c: 35,    f: 12,   defaultPortion: dp('1 reep', 60), category: 'sport' },
  { id: 'nevo:eiwitpannenkoek', name: 'Eiwitpannenkoek',  kcal: 230, p: 23,   c: 22,    f: 6,    defaultPortion: dp('1 pannenkoek', 100), category: 'sport' },
  { id: 'nevo:creatine',        name: 'Creatine monohydraat', kcal: 0, p: 0,  c: 0,     f: 0,    defaultPortion: dp('1 schep', 5), category: 'sport' },
  { id: 'nevo:bcaa',            name: 'BCAA',             kcal: 30,  p: 7,    c: 0,     f: 0,    defaultPortion: dp('1 schep', 8), category: 'sport' },

  // ─── Dranken ───
  { id: 'nevo:water',           name: 'Water',            kcal: 0,   p: 0,    c: 0,     f: 0,    defaultPortion: dpml('1 glas', 250), category: 'drink' },
  { id: 'nevo:koffie.zwart',    name: 'Koffie (zwart)',   kcal: 2,   p: 0.1,  c: 0,     f: 0,    defaultPortion: dpml('1 kopje', 125), category: 'drink' },
  { id: 'nevo:koffie.melk',     name: 'Koffie verkeerd',  kcal: 45,  p: 2.5,  c: 3.5,   f: 2,    defaultPortion: dpml('1 kopje', 200), category: 'drink' },
  { id: 'nevo:thee.zwart',      name: 'Thee (zwart)',     kcal: 1,   p: 0,    c: 0.2,   f: 0,    defaultPortion: dpml('1 kopje', 200), category: 'drink' },
  { id: 'nevo:thee.groen',      name: 'Groene thee',      kcal: 1,   p: 0,    c: 0,     f: 0,    defaultPortion: dpml('1 kopje', 200), category: 'drink' },
  { id: 'nevo:cola',            name: 'Cola',             kcal: 42,  p: 0,    c: 11,    f: 0,    defaultPortion: dpml('1 blikje', 330), category: 'drink' },
  { id: 'nevo:cola.zero',       name: 'Cola Zero / Light',kcal: 0.3, p: 0.1,  c: 0,     f: 0,    defaultPortion: dpml('1 blikje', 330), category: 'drink' },
  { id: 'nevo:fanta',           name: 'Fanta',            kcal: 43,  p: 0,    c: 11,    f: 0,    defaultPortion: dpml('1 blikje', 330), category: 'drink' },
  { id: 'nevo:sprite',          name: 'Sprite',           kcal: 39,  p: 0,    c: 9.7,   f: 0,    defaultPortion: dpml('1 blikje', 330), category: 'drink' },
  { id: 'nevo:redbull',         name: 'Red Bull',         kcal: 45,  p: 0,    c: 11,    f: 0,    defaultPortion: dpml('1 blikje', 250), category: 'drink' },
  { id: 'nevo:jus',             name: 'Jus d\'orange',    kcal: 45,  p: 0.7,  c: 10,    f: 0.2,  defaultPortion: dpml('1 glas', 200), category: 'drink' },
  { id: 'nevo:appelsap',        name: 'Appelsap',         kcal: 46,  p: 0.1,  c: 11,    f: 0.1,  defaultPortion: dpml('1 glas', 200), category: 'drink' },
  { id: 'nevo:multivruchten',   name: 'Multivruchtensap', kcal: 48,  p: 0.4,  c: 11,    f: 0.1,  defaultPortion: dpml('1 glas', 200), category: 'drink' },
  { id: 'nevo:smoothie.fruit',  name: 'Smoothie (fruit)', kcal: 60,  p: 0.7,  c: 13,    f: 0.3,  defaultPortion: dpml('1 glas', 250), category: 'drink' },
  { id: 'nevo:bier.pils',       name: 'Bier (pils)',      kcal: 43,  p: 0.5,  c: 3.4,   f: 0,    defaultPortion: dpml('1 glas', 250), category: 'drink' },
  { id: 'nevo:bier.speciaal',   name: 'Speciaalbier',     kcal: 55,  p: 0.5,  c: 5,     f: 0,    defaultPortion: dpml('1 glas', 250), category: 'drink' },
  { id: 'nevo:wijn.rood',       name: 'Rode wijn',        kcal: 85,  p: 0.1,  c: 2.6,   f: 0,    defaultPortion: dpml('1 glas', 125), category: 'drink' },
  { id: 'nevo:wijn.wit',        name: 'Witte wijn',       kcal: 82,  p: 0.1,  c: 2.6,   f: 0,    defaultPortion: dpml('1 glas', 125), category: 'drink' },
  { id: 'nevo:wodka',           name: 'Wodka',            kcal: 231, p: 0,    c: 0,     f: 0,    defaultPortion: dpml('1 shot', 35), category: 'drink' },

  // ─── Bereide gerechten ───
  { id: 'nevo:pizza.margherita',name: 'Pizza margherita', kcal: 265, p: 11,   c: 33,    f: 10,   defaultPortion: dp('1 pizza', 280), category: 'meal' },
  { id: 'nevo:pizza.salami',    name: 'Pizza salami',     kcal: 290, p: 12,   c: 30,    f: 13,   defaultPortion: dp('1 pizza', 320), category: 'meal' },
  { id: 'nevo:lasagne',         name: 'Lasagne',          kcal: 138, p: 8,    c: 13,    f: 6,    defaultPortion: dp('1 portie', 350), category: 'meal' },
  { id: 'nevo:nasi.goreng',     name: 'Nasi goreng',      kcal: 165, p: 6,    c: 23,    f: 5,    defaultPortion: dp('1 portie', 400), category: 'meal' },
  { id: 'nevo:bami.goreng',     name: 'Bami goreng',      kcal: 152, p: 6,    c: 21,    f: 5,    defaultPortion: dp('1 portie', 400), category: 'meal' },
  { id: 'nevo:soep.tomaten',    name: 'Tomatensoep',      kcal: 40,  p: 1.5,  c: 7,     f: 0.7,  defaultPortion: dp('1 kom', 250), category: 'meal' },
  { id: 'nevo:soep.kippen',     name: 'Kippensoep',       kcal: 35,  p: 2.5,  c: 4,     f: 1,    defaultPortion: dp('1 kom', 250), category: 'meal' },
  { id: 'nevo:stamppot',        name: 'Stamppot boerenkool', kcal: 130, p: 6, c: 13,    f: 6,    defaultPortion: dp('1 portie', 300), category: 'meal' },
  { id: 'nevo:erwtensoep',      name: 'Erwtensoep',       kcal: 90,  p: 7,    c: 11,    f: 2,    defaultPortion: dp('1 kom', 250), category: 'meal' },

  // ─── Spreads ───
  { id: 'nevo:hagelslag',       name: 'Hagelslag',        kcal: 489, p: 5.5,  c: 76,    f: 17,   defaultPortion: dp('1 broodsmeer', 12), category: 'spread' },
  { id: 'nevo:vlokken',         name: 'Chocoladevlokken', kcal: 470, p: 7,    c: 73,    f: 16,   defaultPortion: dp('1 broodsmeer', 12), category: 'spread' },
  { id: 'nevo:jam.aardbei',     name: 'Aardbeienjam',     kcal: 250, p: 0.4,  c: 62,    f: 0.1,  defaultPortion: dp('1 broodsmeer', 15), category: 'spread' },
  { id: 'nevo:appelstroop',     name: 'Appelstroop',      kcal: 280, p: 1,    c: 67,    f: 0.1,  defaultPortion: dp('1 broodsmeer', 15), category: 'spread' },
  { id: 'nevo:honing',          name: 'Honing',           kcal: 304, p: 0.3,  c: 82,    f: 0,    defaultPortion: dp('1 broodsmeer', 15), category: 'spread' },
  { id: 'nevo:nutella',         name: 'Hazelnootpasta',   kcal: 539, p: 6,    c: 58,    f: 31,   defaultPortion: dp('1 broodsmeer', 15), category: 'spread' },
];

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

const _index = LOCAL_FOODS.map(f => ({ ...f, _lc: f.name.toLowerCase() }));

// NL → EN translation table for USDA fallback (top 80 generic Dutch food terms).
// Used in loglibrary.jsx when querying USDA FoodData Central (EN-only API).
export const NL_EN_FOOD = {
  appel: 'apple', banaan: 'banana', peer: 'pear', sinaasappel: 'orange', mandarijn: 'tangerine',
  citroen: 'lemon', limoen: 'lime', druiven: 'grapes', aardbei: 'strawberry', aardbeien: 'strawberry',
  bessen: 'berries', framboos: 'raspberry', framboze: 'raspberry', braam: 'blackberry', kers: 'cherry',
  kersen: 'cherry', kiwi: 'kiwi', meloen: 'melon', watermeloen: 'watermelon', ananas: 'pineapple',
  mango: 'mango', perzik: 'peach', nectarine: 'nectarine', abrikoos: 'apricot', pruim: 'plum',
  avocado: 'avocado', rozijn: 'raisin', dadel: 'date',
  tomaat: 'tomato', komkommer: 'cucumber', paprika: 'bell pepper', sla: 'lettuce', rucola: 'arugula',
  wortel: 'carrot', broccoli: 'broccoli', bloemkool: 'cauliflower', spinazie: 'spinach',
  boerenkool: 'kale', kool: 'cabbage', spruitje: 'brussels sprout', sperziebonen: 'green beans',
  erwten: 'peas', mais: 'corn', champignon: 'mushroom', ui: 'onion', knoflook: 'garlic',
  prei: 'leek', aardappel: 'potato', friet: 'french fries', courgette: 'zucchini',
  aubergine: 'eggplant', pompoen: 'pumpkin', radijs: 'radish', biet: 'beet', asperges: 'asparagus',
  kip: 'chicken', kipfilet: 'chicken breast', kalkoen: 'turkey', rund: 'beef', biefstuk: 'steak',
  gehakt: 'ground beef', varken: 'pork', spek: 'bacon', ham: 'ham', salami: 'salami',
  worst: 'sausage', zalm: 'salmon', tonijn: 'tuna', kabeljauw: 'cod', haring: 'herring',
  makreel: 'mackerel', garnaal: 'shrimp', garnalen: 'shrimp', mossel: 'mussel', ei: 'egg',
  melk: 'milk', kwark: 'quark', yoghurt: 'yogurt', skyr: 'skyr', kaas: 'cheese',
  mozzarella: 'mozzarella', feta: 'feta', parmezaan: 'parmesan', boter: 'butter', margarine: 'margarine',
  slagroom: 'whipped cream',
  brood: 'bread', volkoren: 'whole grain bread', cracker: 'cracker', rijstwafel: 'rice cake',
  havermout: 'oatmeal', musli: 'muesli', cornflakes: 'cornflakes', rijst: 'rice',
  pasta: 'pasta', spaghetti: 'spaghetti', couscous: 'couscous', quinoa: 'quinoa',
  pinda: "peanut", pindakaas: 'peanut butter', amandel: 'almond', walnoot: 'walnut',
  cashew: 'cashew', hazelnoot: 'hazelnut',
  olijfolie: 'olive oil', mayonaise: 'mayonnaise', ketchup: 'ketchup', mosterd: 'mustard',
  honing: 'honey', suiker: 'sugar',
  chocolade: 'chocolate', chips: 'chips', popcorn: 'popcorn', koek: 'cookie',
  water: 'water', koffie: 'coffee', thee: 'tea', cola: 'cola', bier: 'beer', wijn: 'wine',
  sap: 'juice', appelsap: 'apple juice',
  tofu: 'tofu', tempeh: 'tempeh', hummus: 'hummus',
};

export function searchLocalFoods(query, max = 8) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];
  const score = (name) => {
    if (name === q) return 100;
    if (name.startsWith(q + ' ') || name.startsWith(q + ',') || name.startsWith(q + '(')) return 90;
    if (name.startsWith(q)) return 80;
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
  return hits.map(({ _lc, _score, ...rest }) => rest);
}
