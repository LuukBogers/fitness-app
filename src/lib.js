import { createClient } from "@supabase/supabase-js";
import { createContext, useContext } from "react";
import { TRANSLATIONS, detectLang } from "./i18n";

/* ═══════════════════════════ SUPABASE CONFIG ═══════════════════════════ */
const SUPABASE_URL = "https://apjcijsxspxxxrdgewll.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_DdRGzKxSs8Sd7S1s_epKIQ_HUOiklZ6";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { flowType: 'implicit', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: typeof window !== 'undefined' ? window.localStorage : undefined },
});

export const isConfigured = () =>
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR-PROJECT") &&
  SUPABASE_ANON_KEY.length > 40 &&
  !SUPABASE_ANON_KEY.includes("YOUR-ANON");

/* ═══════════════════════════ APP CONTEXT ═══════════════════════════ */
export const AppContext = createContext({});
export const useApp = () => useContext(AppContext);

/* ═══════════════════════════ LANGUAGE CONTEXT ═══════════════════════════ */
export const LangContext = createContext({ lang: 'en', setLang: () => {} });
export const useLang = () => useContext(LangContext);

/* useT() → returns translator function t(key, vars?)
 * - falls back to English if key missing in current language
 * - falls back to key itself if missing in English too
 * - replaces {placeholder} tokens with vars[placeholder]
 */
export const useT = () => {
  const { lang } = useLang();
  return (key, vars) => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    let str = dict[key] || TRANSLATIONS.en[key] || key;
    if (vars) {
      Object.keys(vars).forEach(k => {
        str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return str;
  };
};

// Stand-alone translator (no React hook) for places where useT can't be called
export const translate = (lang, key, vars) => {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let str = dict[key] || TRANSLATIONS.en[key] || key;
  if (vars) {
    Object.keys(vars).forEach(k => {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
    });
  }
  return str;
};

export { detectLang };

/* ═══════════════════════════ TOKENS ═══════════════════════════ */
export const t = {
  // Surfaces (Premium graphite/chrome)
  bg: '#0B0C0E', bg2: '#121417',
  card: '#17191D', card2: '#1A1C21', card3: '#22252A',
  // Borders & dividers (frosted glass)
  border: 'rgba(255,255,255,0.10)', borderStrong: 'rgba(255,255,255,0.18)',
  // Text
  text: '#F2F2F3', soft: '#A7A9AD', muted: '#6F7277', dim: '#4A4D52',
  // Brand accents (former green → silver/chrome, former orange → champagne)
  // Kept under same keys so existing UI flips palette in-place.
  orange: '#C8B18A', orangeBg: 'rgba(200,177,138,0.10)', orangeBorder: 'rgba(200,177,138,0.32)',
  green:  '#D8D8DA', greenBg:  'rgba(255,255,255,0.06)',  greenBorder:  'rgba(255,255,255,0.18)',
  // Premium accents (new, addressable directly)
  silver: '#D8D8DA', chrome: '#F5F5F6', champagne: '#C8B18A', graphite: '#3A3D42',
  // Macro chart colours — desaturated cool/warm tints, premium look
  protein: '#B8C5D6', carbs: '#D6C49B', fat: '#D6A799',
  // Status overlays (subtler than before)
  glow: '#E8EAEE',
  success: '#B8D6BE', warning: '#D6C49B', error: '#D6A799',
  // Metallic gradients (for primary CTAs / hero accents)
  metalGreen:  'linear-gradient(135deg, #F5F5F6 0%, #D8D8DA 40%, #9CA0A6 100%)', // silver/chrome
  metalOrange: 'linear-gradient(135deg, #E2CFA8 0%, #C8B18A 50%, #9C8761 100%)', // champagne
  metalSilver: 'linear-gradient(135deg, #F5F5F6 0%, #C8C9CC 50%, #828B99 100%)',
  // Surface effects
  glass:        'rgba(255,255,255,0.04)',
  glassHover:   'rgba(255,255,255,0.08)',
  glassPanel:   'linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025))',
  innerHi:      'inset 0 1px 0 0 rgba(255,255,255,0.08)',
  softShadow:   '0 12px 40px rgba(0,0,0,0.45)',
  cardShadow:   '0 24px 70px rgba(0,0,0,0.45), inset 0 1px 0 0 rgba(255,255,255,0.06)',
};

export const STATUS = {
  gray:   { bg: 'rgba(111,114,119,0.22)', dot: '#6F7277', label: '#A7A9AD' },
  green:  { bg: 'rgba(216,216,218,0.14)', dot: '#D8D8DA', label: '#D8D8DA' },
  yellow: { bg: 'rgba(200,177,138,0.16)', dot: '#C8B18A', label: '#D6C49B' },
  orange: { bg: 'rgba(200,177,138,0.20)', dot: '#C8B18A', label: '#D6A799' },
  red:    { bg: 'rgba(214,167,153,0.20)', dot: '#D6A799', label: '#D6A799' },
};

/* ═══════════════════════════ UI CONSTANTS ═══════════════════════════ */
export const WEEK = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
export const SLOTS = ['Breakfast','Snack after breakfast','Lunch','Snack after lunch','Dinner','Snack after dinner'];
export const SHELF_OPTS = [
  { v:'shelf', l:'🥫 Shelf stable' },
  { v:'refrigerated', l:'❄️ Refrigerated' },
  { v:'fresh', l:'🥬 Fresh' },
];
export const CAT_OPTS = ['Breakfast','Lunch','Dinner','Snack'];
export const STORE_OPTS = ['AH','Jumbo','Lidl','Aldi','Plus','Body&Fit','Other'];

// 15 universal portion building blocks. `name` is i18n key suffix → portion.<name>
// `g` is grams (solid) and `ml` is milliliters (liquid). For products without a custom
// portion, these are offered as a fallback in the bottom-sheet portion picker.
export const GLOBAL_PORTIONS = [
  { id: 'broodsmeer.boter',      g: 5   },
  { id: 'broodsmeer.pindakaas',  g: 15  },
  { id: 'eetlepel',              g: 15  },
  { id: 'plak.kaas',             g: 20  },
  { id: 'snee.brood',            g: 35  },
  { id: 'ons.vs',                g: 28  },
  { id: 'opscheplepel.klein',    g: 30  },
  { id: 'opscheplepel.groot',    g: 60  },
  { id: 'kopje.klein',           ml: 125 },
  { id: 'glas.klein',            ml: 150 },
  { id: 'glas.middel',           ml: 200 },
  { id: 'glas.normaal',          ml: 250 },
  { id: 'blikje.330',            ml: 330 },
  { id: 'pint',                  ml: 480 },
  { id: 'fles.500',              ml: 500 },
];

/* ═══════════════════════════ HELPERS ═══════════════════════════ */
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const todayKey = () => new Date().toISOString().slice(0, 10);
export const todayIdx = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };

export const weekDates = () => {
  const now = new Date();
  const ti = todayIdx();
  return WEEK.map((_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - ti + i);
    return d.getDate();
  });
};

// Map app lang code → BCP47 locale for Intl/toLocaleDateString
export const localeFromLang = (lang) => ({
  nl:'nl-NL', en:'en-US', de:'de-DE', fr:'fr-FR',
  es:'es-ES', it:'it-IT', pt:'pt-PT', pl:'pl-PL',
}[lang] || 'en-US');

export const monthName = (lang = 'en') => new Date().toLocaleDateString(localeFromLang(lang), { month: 'long' });
export const monthShort = (lang = 'en', date) => (date || new Date()).toLocaleDateString(localeFromLang(lang), { month: 'short' });
export const dayLabel = (lang = 'en') => {
  const loc = localeFromLang(lang);
  const now = new Date();
  return now.toLocaleDateString(loc, { weekday: 'long' }).toUpperCase() + ' · ' + now.getDate() + ' ' + now.toLocaleDateString(loc, { month: 'short' }).toUpperCase();
};
// Localized 3-letter weekday for day index (0=Mon..6=Sun) relative to today
export const weekDayShort = (lang = 'en', dayIdx = 0) => {
  const loc = localeFromLang(lang);
  const ti = todayIdx();
  const d = new Date(); d.setDate(d.getDate() - ti + dayIdx);
  return d.toLocaleDateString(loc, { weekday: 'short' }).toUpperCase();
};
// Convert SLOT internal key ('Snack after breakfast') → i18n key ('slot.Snack_after_breakfast')
export const slotKey = (slot) => 'slot.' + String(slot || '').replace(/\s/g, '_');
export const fmtKey = (date) => date.toISOString().slice(0, 10);

// Resize image via canvas → JPEG base64 (max 400px, ~30-60KB)
export const resizeImage = (file, maxSize = 400, quality = 0.78) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
      else if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = e.target.result;
  };
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// Default day status for week strip when no data yet
export const dayStatus = (dateKey, meals, target) => {
  const m = meals[dateKey];
  if (!m || !m.length) return 'gray';
  const eaten = m.reduce((s, x) => s + (x.eaten ? x.kcal : 0), 0);
  if (!target || !eaten) return 'gray';
  const ratio = eaten / target;
  if (ratio < 0.7) return 'orange';
  if (ratio < 0.9) return 'yellow';
  if (ratio <= 1.1) return 'green';
  if (ratio <= 1.25) return 'yellow';
  return 'red';
};
