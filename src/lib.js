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
  bg: '#09090B', card: '#16161B', card2: '#1C1C22', card3: '#22222A',
  border: '#27272F', text: '#FAFAFA', soft: '#A1A1AA', muted: '#71717A', dim: '#52525B',
  orange: '#F97316', orangeBg: 'rgba(249,115,22,0.12)', orangeBorder: 'rgba(249,115,22,0.3)',
  green: '#22C55E', greenBg: 'rgba(34,197,94,0.12)', greenBorder: 'rgba(34,197,94,0.3)',
  protein: '#60A5FA', carbs: '#FACC15', fat: '#F87171',
};

export const STATUS = {
  gray:   { bg: 'rgba(82,82,91,0.25)',   dot: '#52525B', label: '#A1A1AA' },
  green:  { bg: 'rgba(34,197,94,0.16)',  dot: '#22C55E', label: '#4ADE80' },
  yellow: { bg: 'rgba(250,204,21,0.16)', dot: '#FACC15', label: '#FDE047' },
  orange: { bg: 'rgba(249,115,22,0.16)', dot: '#F97316', label: '#FB923C' },
  red:    { bg: 'rgba(239,68,68,0.16)',  dot: '#EF4444', label: '#F87171' },
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

export const monthName = () => new Date().toLocaleDateString('en-US', { month: 'long' });
export const dayLabel = () => new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() + ' · ' + new Date().getDate() + ' ' + new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
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
