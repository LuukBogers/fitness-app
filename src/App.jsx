import { useState, useEffect, useRef, useContext, createContext } from "react";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════ SUPABASE CONFIG ═══════════════════════════ */
// 👉 REPLACE these 2 values with your Supabase project (dashboard → Settings → API)
const SUPABASE_URL = "https://apjcijsxspxxxrdgewll.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_DdRGzKxSs8Sd7S1s_epKIQ_HUOiklZ6";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: typeof window !== 'undefined' ? window.localStorage : undefined },
});
const isConfigured = () =>
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR-PROJECT") &&
  SUPABASE_ANON_KEY.length > 40 &&
  !SUPABASE_ANON_KEY.includes("YOUR-ANON");

const AppContext = createContext({});
const useApp = () => useContext(AppContext);

/* ═══════════════════════════ TOKENS ═══════════════════════════ */
const t = {
  bg: '#09090B', card: '#16161B', card2: '#1C1C22', card3: '#22222A',
  border: '#27272F', text: '#FAFAFA', soft: '#A1A1AA', muted: '#71717A', dim: '#52525B',
  orange: '#F97316', orangeBg: 'rgba(249,115,22,0.12)', orangeBorder: 'rgba(249,115,22,0.3)',
  green: '#22C55E', greenBg: 'rgba(34,197,94,0.12)', greenBorder: 'rgba(34,197,94,0.3)',
  protein: '#60A5FA', carbs: '#FACC15', fat: '#F87171',
};
const STATUS = {
  gray:   { bg: 'rgba(82,82,91,0.25)',   dot: '#52525B', label: '#A1A1AA' },
  green:  { bg: 'rgba(34,197,94,0.16)',  dot: '#22C55E', label: '#4ADE80' },
  yellow: { bg: 'rgba(250,204,21,0.16)', dot: '#FACC15', label: '#FDE047' },
  orange: { bg: 'rgba(249,115,22,0.16)', dot: '#F97316', label: '#FB923C' },
  red:    { bg: 'rgba(239,68,68,0.16)',  dot: '#EF4444', label: '#F87171' },
};

/* ═══════════════════════════ MOCK DATA ═══════════════════════════ */
const USER = { name: 'Luuk', age: 28, height: 181, weight: 82.3, goal: 'Cutting', goalDetail: 'Cut only', calories: 2200, protein: 197, carbs: 218, fat: 57, streak: 4 };
const WEEK = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DATES = [18,19,20,21,22,23,24];
const TODAY = 4; // Friday
const CHECKED = [true,true,true,true,true,false,false];
const DAY_STATUS = ['green','yellow','green','orange','green','gray','gray'];
const WORKOUT_PLAN = { Mon:'Back', Tue:'Chest', Wed:null, Thu:'Legs', Fri:null, Sat:'Upper', Sun:null };
const WORKOUT_DONE = { Mon:true, Tue:true, Wed:false, Thu:true, Fri:false, Sat:false, Sun:false };
const WEIGHTS = [82.8, 82.6, 82.5, 82.4, 82.6, 82.3, 82.1];
const TODAY_NUTR = { eaten: 1240, protein: 98, carbs: 130, fat: 28 };
const MEALS = [
  { slot: 'Breakfast', items: ['Oats 100g', 'Whey 30g'], kcal: 420, locked: true, eaten: true },
  { slot: 'Snack after breakfast', items: ['Greek yogurt 200g'], kcal: 140, locked: false, eaten: true },
  { slot: 'Lunch', items: ['Chicken 180g', 'Rice 150g', 'Broccoli 100g'], kcal: 580, locked: true, eaten: false },
  { slot: 'Snack after lunch', items: [], kcal: 0, locked: false, eaten: false },
  { slot: 'Dinner', items: ['Salmon 150g', 'Sweet potato 200g'], kcal: 480, locked: false, eaten: false },
  { slot: 'Snack after dinner', items: ['Cottage cheese 150g'], kcal: 160, locked: false, eaten: false },
];
const PRODUCTS = [
  { id: 1, name: 'Oat flakes', store: 'AH', kcal: 370, p: 13, f: 7, c: 63, shelf: 'shelf' },
  { id: 2, name: 'Chicken breast', store: 'Jumbo', kcal: 110, p: 23, f: 2, c: 0, shelf: 'fresh' },
  { id: 3, name: 'Whey protein', store: 'Body&Fit', kcal: 385, p: 78, f: 5, c: 7, shelf: 'shelf' },
  { id: 4, name: 'Greek yogurt 0%', store: 'AH', kcal: 60, p: 10, f: 0, c: 4, shelf: 'refrigerated' },
  { id: 5, name: 'Salmon fillet', store: 'Jumbo', kcal: 208, p: 20, f: 13, c: 0, shelf: 'fresh' },
  { id: 6, name: 'Sweet potato', store: 'AH', kcal: 86, p: 2, f: 0, c: 20, shelf: 'fresh' },
];
const RECIPES = [
  { id: 1, name: 'High Protein Oats', cat: 'Breakfast', kcal: 420, p: 38, c: 52, f: 8, prods: 2 },
  { id: 2, name: 'Chicken & Rice Bowl', cat: 'Lunch', kcal: 580, p: 48, c: 62, f: 9, prods: 4 },
  { id: 3, name: 'Salmon & Sweet Potato', cat: 'Dinner', kcal: 480, p: 35, c: 44, f: 14, prods: 3 },
  { id: 4, name: 'Cottage Cheese Snack', cat: 'Snack', kcal: 160, p: 22, c: 8, f: 4, prods: 2 },
];
const GROCERIES = {
  shelf:        [{ name:'Oat flakes', amt:'500g', store:'AH' }, { name:'Whey protein', amt:'210g', store:'Body&Fit' }, { name:'Basmati rice', amt:'500g', store:'AH' }],
  refrigerated: [{ name:'Greek yogurt 0%', amt:'600g', store:'AH' }, { name:'Cottage cheese', amt:'300g', store:'Jumbo' }],
  fresh:        [{ name:'Chicken breast', amt:'540g', store:'Jumbo' }, { name:'Salmon fillet', amt:'300g', store:'Jumbo' }, { name:'Broccoli', amt:'200g', store:'Jumbo' }, { name:'Sweet potato', amt:'400g', store:'AH' }],
};
const WORKOUTS = [
  { name: 'Back', exercises: ['Pull-ups 4×8', 'Barbell Row 4×6', 'Lat Pulldown 3×10', 'Cable Row 3×12'] },
  { name: 'Chest', exercises: ['Bench Press 4×8', 'Incline DB Press 3×10', 'Dips 3×12', 'Cable Fly 3×15'] },
  { name: 'Legs', exercises: ['Squat 4×6', 'Leg Press 4×10', 'Romanian DL 3×8', 'Leg Curl 3×12'] },
  { name: 'Upper', exercises: ['OHP 4×8', 'Pull-ups 3×8', 'Lateral Raise 3×15', 'Tricep Ext 3×12'] },
];
const CHECKIN_Q = [
  { id: 'weight', label: 'Body weight', type: 'number', unit: 'kg', ph: '82.3' },
  { id: 'sleep', label: 'Hours slept', type: 'number', unit: 'h', ph: '7.5' },
  { id: 'sleepQ', label: 'Sleep quality', type: 'scale' },
  { id: 'water', label: 'Water intake', type: 'number', unit: 'L', ph: '2.5' },
  { id: 'steps', label: 'Steps today', type: 'number', unit: '', ph: '8500' },
  { id: 'stress', label: 'Stress level', type: 'scale' },
  { id: 'energy', label: 'Energy level', type: 'scale' },
  { id: 'hunger', label: 'Hunger level', type: 'scale' },
  { id: 'recovery', label: 'Recovery / soreness', type: 'scale' },
  { id: 'trained', label: 'Did you train today?', type: 'yesno' },
  { id: 'trainQ', label: 'Training performance', type: 'scale', cond: 'trained' },
  { id: 'cardio', label: 'Did you do cardio?', type: 'yesno' },
  { id: 'caffeine', label: 'Caffeine after 14:00?', type: 'yesno' },
];

/* ═══════════════════════════ ICONS (inline SVG) ═══════════════════════════ */
const Icon = ({ name, size = 20, color = 'currentColor', stroke = 1.8 }) => {
  const paths = {
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    nutrition: <><path d="M12 2C9 5 6 8 6 12c0 3 2.5 6 6 6s6-3 6-6c0-4-3-7-6-10z"/><path d="M12 18v4"/></>,
    workout: <><rect x="4" y="9" width="3" height="6" rx="0.5"/><rect x="17" y="9" width="3" height="6" rx="0.5"/><line x1="7" y1="12" x2="17" y2="12"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    chevR: <polyline points="9 18 15 12 9 6"/>,
    chevL: <polyline points="15 18 9 12 15 6"/>,
    chevD: <polyline points="6 9 12 15 18 9"/>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    flame: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>,
    cart: <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    info: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    play: <polygon points="5 3 19 12 5 21 5 3"/>,
    rest: <><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></>,
    fire: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>,
    photo: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    cal: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    scan: <><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="7" y2="12"/><line x1="3" y1="12" x2="21" y2="12"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

/* ═══════════════════════════ SHARED COMPONENTS ═══════════════════════════ */
const Card = ({ children, style, onClick, glow }) => (
  <div onClick={onClick} style={{
    background: t.card, borderRadius: 20, padding: 18, marginBottom: 12,
    border: `1px solid ${t.border}`, cursor: onClick ? 'pointer' : 'default',
    boxShadow: glow || 'none', transition: 'all 0.2s', ...style,
  }}>{children}</div>
);

const Label = ({ children, color, style }) => (
  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: color || t.muted, marginBottom: 8, ...style }}>{children}</div>
);

const Btn = ({ children, onClick, variant = 'primary', accent = 'green', full, small, style }) => {
  const acc = accent === 'orange' ? t.orange : t.green;
  const accBg = accent === 'orange' ? t.orangeBg : t.greenBg;
  const vars = {
    primary: { background: acc, color: '#0A0A0B' },
    ghost: { background: accBg, color: acc, border: `1px solid ${accent === 'orange' ? t.orangeBorder : t.greenBorder}` },
    outline: { background: 'transparent', color: t.text, border: `1px solid ${t.border}` },
    danger: { background: 'rgba(239,68,68,0.15)', color: '#F87171', border: `1px solid rgba(239,68,68,0.3)` },
  };
  return (
    <button onClick={onClick} style={{
      ...vars[variant], borderRadius: 14, padding: small ? '9px 14px' : '14px 20px',
      fontSize: small ? 13 : 15, fontWeight: 600, cursor: 'pointer', width: full ? '100%' : undefined,
      border: vars[variant].border || 'none', fontFamily: 'inherit', transition: 'opacity 0.15s',
      ...style,
    }}>{children}</button>
  );
};

const Toggle = ({ on, onChange, accent = 'green' }) => {
  const acc = accent === 'orange' ? t.orange : t.green;
  return (
    <div onClick={() => onChange(!on)} style={{
      width: 44, height: 26, borderRadius: 13, background: on ? acc : '#3F3F46',
      position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2, width: 22, height: 22, borderRadius: 11,
        background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', transition: 'left 0.2s',
      }} />
    </div>
  );
};

const Ring = ({ value, max, color, label, size = 64 }) => {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={t.card3} strokeWidth={5} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{value}</div>
          <div style={{ fontSize: 9, color: t.muted }}>/{max}g</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: t.soft, fontWeight: 600 }}>{label}</div>
    </div>
  );
};

const Modal = ({ visible, onClose, title, children, accent = 'green' }) => {
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      zIndex: 100, display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 0.2s',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: t.card, borderRadius: '28px 28px 0 0', width: '100%',
        maxHeight: '92%', overflow: 'auto', padding: '20px 20px 32px',
        border: `1px solid ${t.border}`, borderBottom: 'none',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{ width: 40, height: 4, background: t.card3, borderRadius: 2, margin: '0 auto 18px' }} />
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: t.text }}>{title}</div>
            <div onClick={onClose} style={{ cursor: 'pointer', color: t.muted, padding: 4 }}><Icon name="x" size={18} /></div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

const ProgressBar = ({ value, max, color, height = 8 }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ background: t.card3, borderRadius: height/2, height, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: height/2, transition: 'width 0.5s ease-out' }} />
    </div>
  );
};

const ScaleInput = ({ value, onChange, accent = 'green' }) => {
  const acc = accent === 'orange' ? t.orange : t.green;
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <div key={n} onClick={() => onChange(n)} style={{
          flex: 1, height: 36, borderRadius: 10, cursor: 'pointer',
          background: value === n ? acc : t.card2,
          color: value === n ? '#0A0A0B' : t.soft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
          border: `1px solid ${value === n ? acc : t.border}`,
        }}>{n}</div>
      ))}
    </div>
  );
};

const YesNo = ({ value, onChange, accent = 'green' }) => {
  const acc = accent === 'orange' ? t.orange : t.green;
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {['Yes','No'].map(opt => (
        <div key={opt} onClick={() => onChange(opt)} style={{
          flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
          background: value === opt ? acc : t.card2,
          color: value === opt ? '#0A0A0B' : t.soft,
          fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
          border: `1px solid ${value === opt ? acc : t.border}`,
        }}>{opt}</div>
      ))}
    </div>
  );
};

const Chip = ({ children, active, onClick, accent = 'green' }) => {
  const acc = accent === 'orange' ? t.orange : t.green;
  const accBg = accent === 'orange' ? t.orangeBg : t.greenBg;
  return (
    <div onClick={onClick} style={{
      padding: '8px 14px', borderRadius: 12, cursor: 'pointer',
      background: active ? accBg : t.card2,
      color: active ? acc : t.soft,
      fontSize: 12.5, fontWeight: 600, transition: 'all 0.15s',
      border: `1px solid ${active ? acc : t.border}`, whiteSpace: 'nowrap',
    }}>{children}</div>
  );
};

const Field = ({ label, value, onChange, type = 'text', placeholder, unit }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 12, color: t.soft, fontWeight: 600, marginBottom: 6 }}>{label}</div>
    <div style={{ position: 'relative' }}>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={{
        width: '100%', padding: '13px 14px', paddingRight: unit ? 44 : 14, borderRadius: 12,
        border: `1px solid ${t.border}`, fontSize: 15, fontFamily: 'inherit',
        color: t.text, background: t.card2, boxSizing: 'border-box', outline: 'none',
      }} />
      {unit && <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: t.muted, fontSize: 13, fontWeight: 500 }}>{unit}</span>}
    </div>
  </div>
);

/* ═══════════════════════════ LOADING / CONFIG / AUTH SCREENS ═══════════════════════════ */
function LoadingScreen() {
  return (
    <div style={{ background: t.bg, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 18, border: `3px solid ${t.border}`, borderTopColor: t.green, animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 12, color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Loading</div>
    </div>
  );
}

function ConfigError() {
  return (
    <div style={{ background: t.bg, height: '100%', padding: '40px 24px', overflowY: 'auto' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: t.text, marginBottom: 8, letterSpacing: '-0.02em' }}>Setup needed</div>
      <div style={{ fontSize: 14, color: t.soft, marginBottom: 22, lineHeight: 1.5 }}>Connect your Supabase project to enable accounts, login and data persistence.</div>

      <Card style={{ background: t.greenBg, border: `1px solid ${t.greenBorder}`, padding: 16 }}>
        <Label color={t.green}>1 · Create Supabase project</Label>
        <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.5, marginBottom: 10 }}>Go to <span style={{ color: t.green, fontWeight: 600 }}>supabase.com</span> → "New project" (free).</div>
        <Label color={t.green}>2 · Copy URL + anon key</Label>
        <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.5, marginBottom: 10 }}>Dashboard → Settings → API → copy <strong>Project URL</strong> and <strong>anon public key</strong>.</div>
        <Label color={t.green}>3 · Paste into FitnessApp.jsx</Label>
        <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.5, marginBottom: 12 }}>Lines 5-6 — replace the placeholder values.</div>

        <div style={{ background: t.card2, borderRadius: 10, padding: 12, fontFamily: 'monospace', fontSize: 11.5, color: t.text, border: `1px solid ${t.border}`, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
{`const SUPABASE_URL = "https://abc...supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGc...";`}
        </div>
      </Card>

      <Card style={{ padding: 16 }}>
        <Label>4 · Run SQL schema</Label>
        <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.5, marginBottom: 10 }}>Dashboard → SQL Editor → paste the schema (see chat) → Run.</div>
        <Label>5 · Enable providers</Label>
        <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.5 }}>Authentication → Providers → enable Email + Google (OAuth setup steps in chat).</div>
      </Card>

      <div style={{ fontSize: 11, color: t.muted, textAlign: 'center', marginTop: 18, lineHeight: 1.6 }}>
        After saving the file, this screen will be replaced by the Welcome screen automatically.
      </div>
    </div>
  );
}

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

function AuthFlow() {
  const [view, setView] = useState('welcome'); // welcome | email | otp
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const oauth = async (provider) => {
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) { setError(error.message); setLoading(false); }
    // else: browser redirects to Google
  };

  const sendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setView('otp');
  };

  const verifyCode = async () => {
    if (code.replace(/\D/g, '').length !== 6) { setError('Enter the 6-digit code from your email.'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error) { setError(error.message); setLoading(false); }
    // onAuthStateChange in App handles success
  };

  if (view === 'welcome') return (
    <div style={{ background: t.bg, height: '100%', display: 'flex', flexDirection: 'column', padding: '60px 24px 28px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, background: `radial-gradient(circle, ${t.greenBg}, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, right: -100, width: 300, height: 300, background: `radial-gradient(circle, ${t.orangeBg}, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <div style={{
          width: 76, height: 76, borderRadius: 22,
          background: `linear-gradient(135deg, ${t.green}, ${t.orange})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 16px 48px rgba(34,197,94,0.35), 0 8px 28px rgba(249,115,22,0.25)`,
          marginBottom: 28,
        }}>
          <Icon name="flame" size={38} color="#0A0A0B" stroke={2.2} />
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, color: t.text, letterSpacing: '-0.03em', marginBottom: 10 }}>Welcome</div>
        <div style={{ fontSize: 15, color: t.soft, textAlign: 'center', lineHeight: 1.5, maxWidth: 280 }}>Your structured coach for nutrition and training.</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
        <button onClick={() => oauth('google')} disabled={loading} style={{
          background: '#fff', color: '#1F1F1F', border: 'none', borderRadius: 14,
          padding: '14px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
        }}>
          <GoogleLogo /> Continue with Google
        </button>
        <button onClick={() => { setView('email'); setError(''); }} disabled={loading} style={{
          background: t.green, color: '#0A0A0B', border: 'none', borderRadius: 14,
          padding: '14px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
        }}>
          Continue with Email
        </button>

        {error && <div style={{ fontSize: 12, color: '#FCA5A5', textAlign: 'center', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 10 }}>{error}</div>}

        <div style={{ fontSize: 11, color: t.muted, textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
          🔒 Privacy-first. Your data stays yours.<br />
          By continuing you agree to our Terms.
        </div>
      </div>
    </div>
  );

  if (view === 'email') return (
    <div style={{ background: t.bg, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 20px 0' }}>
        <div onClick={() => { setView('welcome'); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.soft, cursor: 'pointer', padding: 4, marginLeft: -4 }}>
          <Icon name="chevL" size={20} /> <span style={{ fontSize: 14 }}>Back</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.02em', marginBottom: 8 }}>What's your email?</div>
        <div style={{ fontSize: 14, color: t.soft, marginBottom: 28, lineHeight: 1.5 }}>We'll send you a 6-digit code. No password needed.</div>

        <input
          type="email" inputMode="email" autoCapitalize="none" autoComplete="email"
          value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
          placeholder="you@example.com" autoFocus
          style={{ width: '100%', padding: '15px 16px', borderRadius: 14, border: `1px solid ${t.border}`, fontSize: 16, color: t.text, background: t.card2, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14 }}
        />
        {error && <div style={{ fontSize: 12.5, color: '#FCA5A5', padding: '10px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, marginBottom: 14 }}>{error}</div>}
      </div>

      <div style={{ padding: '16px 20px', borderTop: `1px solid ${t.border}` }}>
        <Btn full onClick={sendCode} style={{ opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Sending...' : 'Send code →'}
        </Btn>
      </div>
    </div>
  );

  // OTP view
  return (
    <div style={{ background: t.bg, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 20px 0' }}>
        <div onClick={() => { setView('email'); setError(''); setCode(''); }} style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.soft, cursor: 'pointer', padding: 4, marginLeft: -4 }}>
          <Icon name="chevL" size={20} /> <span style={{ fontSize: 14 }}>Back</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.02em', marginBottom: 8 }}>Check your email</div>
        <div style={{ fontSize: 14, color: t.soft, marginBottom: 6, lineHeight: 1.5 }}>We sent a 6-digit code to</div>
        <div style={{ fontSize: 14, color: t.green, fontWeight: 600, marginBottom: 28 }}>{email}</div>

        <input
          type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
          value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
          placeholder="000000" autoFocus
          style={{ width: '100%', padding: '18px 16px', borderRadius: 14, border: `1px solid ${t.border}`, fontSize: 28, color: t.text, background: t.card2, outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.4em', fontWeight: 700, marginBottom: 14 }}
        />
        {error && <div style={{ fontSize: 12.5, color: '#FCA5A5', padding: '10px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, marginBottom: 14 }}>{error}</div>}

        <div onClick={sendCode} style={{ fontSize: 13, color: t.green, fontWeight: 600, cursor: 'pointer', textAlign: 'center', padding: 8 }}>
          Didn't get it? Resend code
        </div>
      </div>

      <div style={{ padding: '16px 20px', borderTop: `1px solid ${t.border}` }}>
        <Btn full onClick={verifyCode} style={{ opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Verifying...' : 'Verify & continue →'}
        </Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════ ONBOARDING ═══════════════════════════ */
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState({
    gender: '', age: '', height: '', weight: '',
    activity: '', strength: '', cardio: '', goal: '', goalDetail: '', macroStructure: '',
    notif: { weigh: true, checkin: true, photoSat: true, photoSun: true },
  });
  const up = (k, v) => setD(p => ({ ...p, [k]: v }));

  const age = parseInt(d.age) || 28;
  const h = parseInt(d.height) || 181;
  const w = parseFloat(d.weight) || 82;
  const bmr = d.gender === 'female'
    ? Math.round(10 * w + 6.25 * h - 5 * age - 161)
    : Math.round(10 * w + 6.25 * h - 5 * age + 5);
  const mult = { Low: 1.2, Average: 1.375, High: 1.55, 'Very high': 1.725 }[d.activity] || 1.375;
  const maint = Math.round(bmr * mult);
  const deficit = d.goal === 'Cutting' ? 500 : d.goal === 'Fat loss' ? 300 : 0;
  const startCal = maint - deficit;
  const proteinG = Math.round(w * (d.goalDetail === 'Mini cut' ? 2.5 : d.goal === 'Cutting' ? 2.4 : 2.2));
  const fatG = Math.round(w * 0.7);
  const carbG = Math.max(0, Math.round((startCal - proteinG * 4 - fatG * 9) / 4));

  const showStep3 = d.goal === 'Cutting';
  const totalSteps = showStep3 ? 6 : 5;
  const displayStep = step >= 3 && !showStep3 ? step : step;

  const next = () => {
    if (step === 1 && !showStep3) { setStep(3); return; }
    if (step === 5) { onComplete(d); return; }
    setStep(s => s + 1);
  };
  const back = () => {
    if (step === 3 && !showStep3) { setStep(1); return; }
    if (step > 0) setStep(s => s - 1);
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>Personal details</div>
          <div style={{ fontSize: 14, color: t.soft, marginBottom: 24, lineHeight: 1.5 }}>The basics — so we can calculate your starting point.</div>
          
          <Label>Gender</Label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {['male','female'].map(g => (
              <div key={g} onClick={() => up('gender', g)} style={{
                flex: 1, padding: '14px', borderRadius: 14, textAlign: 'center', cursor: 'pointer',
                background: d.gender === g ? t.greenBg : t.card2,
                color: d.gender === g ? t.green : t.text, fontWeight: 600, fontSize: 15,
                border: `1px solid ${d.gender === g ? t.green : t.border}`, textTransform: 'capitalize',
              }}>{g}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Age" value={d.age} onChange={v => up('age', v)} type="number" placeholder="28" unit="yr" />
            <Field label="Height" value={d.height} onChange={v => up('height', v)} type="number" placeholder="181" unit="cm" />
          </div>
          <Field label="Weight" value={d.weight} onChange={v => up('weight', v)} type="number" placeholder="82.3" unit="kg" />

          <Label style={{ marginTop: 10 }}>Activity level</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {['Low','Average','High','Very high'].map(opt => (
              <Chip key={opt} active={d.activity === opt} onClick={() => up('activity', opt)}>
                <div style={{ padding: '4px 0' }}>{opt}</div>
              </Chip>
            ))}
          </div>

          <Label>Strength training / week</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
            {['0–1','1–2','3–4','5–6'].map(opt => (
              <Chip key={opt} active={d.strength === opt} onClick={() => up('strength', opt)} accent="orange">
                <div style={{ padding: '4px 0', textAlign: 'center' }}>{opt}</div>
              </Chip>
            ))}
          </div>

          <Label>Cardio / week</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {['None','Light','Average','High'].map(opt => (
              <Chip key={opt} active={d.cardio === opt} onClick={() => up('cardio', opt)} accent="orange">
                <div style={{ padding: '4px 0', textAlign: 'center' }}>{opt}</div>
              </Chip>
            ))}
          </div>
        </div>
      );

      case 1: return (
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>What's your goal?</div>
          <div style={{ fontSize: 14, color: t.soft, marginBottom: 24, lineHeight: 1.5 }}>Choose what describes what you're working toward.</div>
          
          {[
            { v: 'Cutting', emoji: '🔥', sub: 'Aggressive deficit. Maximize fat loss while preserving muscle.' },
            { v: 'Fat loss', emoji: '📉', sub: 'Moderate deficit. Sustainable, long-term approach.' },
            { v: 'Maintenance', emoji: '⚖️', sub: 'Eat at maintenance. Build habits or recover.' },
          ].map(opt => (
            <div key={opt.v} onClick={() => up('goal', opt.v)} style={{
              padding: 18, borderRadius: 16, cursor: 'pointer', marginBottom: 10,
              background: d.goal === opt.v ? t.greenBg : t.card2,
              border: `1px solid ${d.goal === opt.v ? t.green : t.border}`,
              transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                <span style={{ fontSize: 18 }}>{opt.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: d.goal === opt.v ? t.green : t.text }}>{opt.v}</span>
              </div>
              <div style={{ fontSize: 13, color: t.soft, marginLeft: 28 }}>{opt.sub}</div>
            </div>
          ))}
        </div>
      );

      case 2: return showStep3 ? (
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>Cut strategy</div>
          <div style={{ fontSize: 14, color: t.soft, marginBottom: 24, lineHeight: 1.5 }}>How do you want to approach this cut?</div>
          
          {[
            { v: 'Cut → Reverse → Build', sub: 'Full periodization. Cut, then reverse, then build muscle.' },
            { v: 'Cut only', sub: 'Cut to your target and reassess.' },
            { v: 'Mini cut', sub: 'Aggressive 4-6 week cut. Higher protein.' },
            { v: 'Recomp / maintenance', sub: 'Build muscle while staying lean.' },
          ].map(opt => (
            <div key={opt.v} onClick={() => up('goalDetail', opt.v)} style={{
              padding: 16, borderRadius: 16, cursor: 'pointer', marginBottom: 10,
              background: d.goalDetail === opt.v ? t.greenBg : t.card2,
              border: `1px solid ${d.goalDetail === opt.v ? t.green : t.border}`,
            }}>
              <div style={{ fontWeight: 700, color: d.goalDetail === opt.v ? t.green : t.text, marginBottom: 4 }}>{opt.v}</div>
              <div style={{ fontSize: 13, color: t.soft }}>{opt.sub}</div>
            </div>
          ))}
        </div>
      ) : null;

      case 3: return (
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>Your starting numbers</div>
          <div style={{ fontSize: 14, color: t.soft, marginBottom: 24, lineHeight: 1.5 }}>Calculated with the Mifflin-St Jeor formula.</div>
          
          <div style={{ background: t.card2, borderRadius: 18, padding: 18, border: `1px solid ${t.border}`, marginBottom: 14 }}>
            {[
              { l: 'BMR (base metabolic rate)', v: `${bmr} kcal` },
              { l: 'Maintenance calories', v: `${maint} kcal` },
              { l: 'Strategy', v: d.goalDetail || d.goal || '—' },
            ].map((r, i) => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 2 ? `1px solid ${t.border}` : 'none' }}>
                <div style={{ fontSize: 13, color: t.soft }}>{r.l}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{r.v}</div>
              </div>
            ))}
          </div>

          <div style={{ background: t.greenBg, borderRadius: 18, padding: 18, border: `1px solid ${t.greenBorder}`, marginBottom: 14 }}>
            <Label color={t.green}>Starting calories</Label>
            <div style={{ fontSize: 32, fontWeight: 800, color: t.green, letterSpacing: '-0.02em' }}>{startCal}<span style={{ fontSize: 16, color: t.soft, fontWeight: 500, marginLeft: 6 }}>kcal/day</span></div>
          </div>

          <Label>Starting macros</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[['Protein', proteinG, t.protein], ['Carbs', carbG, t.carbs], ['Fat', fatG, t.fat]].map(([n, v, c]) => (
              <div key={n} style={{ background: t.card2, borderRadius: 14, padding: 14, textAlign: 'center', border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: c, letterSpacing: '-0.02em' }}>{v}g</div>
                <div style={{ fontSize: 11, color: t.muted, fontWeight: 600, marginTop: 2 }}>{n}</div>
              </div>
            ))}
          </div>
        </div>
      );

      case 4: return (
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>Macro structure</div>
          <div style={{ fontSize: 14, color: t.soft, marginBottom: 24, lineHeight: 1.5 }}>How do you want to structure your week?</div>
          
          {[
            { v: 'same', t: 'Same every day', sub: 'Same calories and macros on training and rest days.' },
            { v: 'split', t: 'Train vs rest split', sub: 'More carbs on training days, lower calories on rest days. Protein and fats stay stable. Better for performance and fat loss.', rec: true },
          ].map(o => (
            <div key={o.v} onClick={() => up('macroStructure', o.v)} style={{
              padding: 18, borderRadius: 16, cursor: 'pointer', marginBottom: 12,
              background: d.macroStructure === o.v ? t.greenBg : t.card2,
              border: `1px solid ${d.macroStructure === o.v ? t.green : t.border}`, position: 'relative',
            }}>
              {o.rec && (
                <div style={{ position: 'absolute', top: -8, right: 12, background: t.green, color: '#0A0A0B', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8, letterSpacing: '0.05em' }}>RECOMMENDED</div>
              )}
              <div style={{ fontWeight: 700, fontSize: 16, color: d.macroStructure === o.v ? t.green : t.text, marginBottom: 6 }}>{o.t}</div>
              <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.5 }}>{o.sub}</div>
            </div>
          ))}
        </div>
      );

      case 5: return (
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>Check-ins & privacy</div>
          <div style={{ fontSize: 14, color: t.soft, marginBottom: 22, lineHeight: 1.5 }}>Daily check-ins keep you on track. Your data stays yours.</div>
          
          <div style={{ background: t.greenBg, borderRadius: 16, padding: 16, border: `1px solid ${t.greenBorder}`, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Icon name="shield" size={18} color={t.green} />
              <div>
                <div style={{ fontSize: 13, color: t.green, fontWeight: 700, marginBottom: 4 }}>Progress photos stay on your device</div>
                <div style={{ fontSize: 12.5, color: t.soft, lineHeight: 1.5 }}>
                  Progress photos help you track physical progress for yourself. You take and store them only on your own phone. The app never stores photos. Completely optional.
                </div>
              </div>
            </div>
          </div>

          <Label>Notifications</Label>
          {[
            { k: 'weigh', l: 'Morning weigh reminder', icon: '⚖️' },
            { k: 'checkin', l: '21:00 daily check-in reminder', icon: '✅' },
            { k: 'photoSat', l: 'Saturday progress photo', icon: '📷' },
            { k: 'photoSun', l: 'Sunday progress photo', icon: '📷' },
          ].map(n => (
            <div key={n.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 18 }}>{n.icon}</span>
                <span style={{ fontSize: 14, color: t.text }}>{n.l}</span>
              </div>
              <Toggle on={d.notif[n.k]} onChange={v => up('notif', { ...d.notif, [n.k]: v })} />
            </div>
          ))}
        </div>
      );

      default: return null;
    }
  };

  const pct = ((step + 1) / 6) * 100;

  return (
    <div style={{ background: t.bg, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 20px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          {step > 0 ? (
            <div onClick={back} style={{ cursor: 'pointer', color: t.soft, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="chevL" size={18} /> <span style={{ fontSize: 14 }}>Back</span>
            </div>
          ) : <div style={{ width: 60 }} />}
          <div style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>Step {step + 1} of 6</div>
          <div style={{ width: 60 }} />
        </div>
        <div style={{ background: t.card2, borderRadius: 4, height: 4 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${t.green}, ${t.orange})`, borderRadius: 4, transition: 'width 0.4s' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 24px' }}>
        {renderStep()}
      </div>

      <div style={{ padding: '16px 20px', borderTop: `1px solid ${t.border}`, background: t.bg }}>
        <Btn full onClick={next}>{step === 5 ? 'Start the app →' : 'Continue →'}</Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════ HOME ═══════════════════════════ */
function Home({ onOpenCheckIn }) {
  const remaining = USER.calories - TODAY_NUTR.eaten;
  const todayWorkout = WORKOUT_PLAN[WEEK[TODAY]];
  const todayDone = WORKOUT_DONE[WEEK[TODAY]];

  // Weight graph path
  const minW = Math.min(...WEIGHTS) - 0.3;
  const maxW = Math.max(...WEIGHTS) + 0.3;
  const W = 100, H = 60;
  const pts = WEIGHTS.map((w, i) => ({
    x: (i / (WEIGHTS.length - 1)) * W,
    y: H - ((w - minW) / (maxW - minW)) * H,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 13, color: t.muted, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 2 }}>FRIDAY · 22 MAY</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>Hi, {USER.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 12, background: t.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}`, cursor: 'pointer' }}>
            <Icon name="bell" size={18} color={t.soft} />
            <div style={{ position: 'absolute', top: 8, right: 9, width: 8, height: 8, background: t.orange, borderRadius: 4 }} />
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${t.green}, ${t.orange})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A0A0B', fontWeight: 800, fontSize: 15 }}>{USER.name[0]}</div>
        </div>
      </div>

      {/* Block 1: Daily Check-in */}
      <Card onClick={onOpenCheckIn} style={{ background: `linear-gradient(135deg, ${t.card}, ${t.card2})`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: `radial-gradient(circle, ${t.greenBg}, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative' }}>
          <Label color={t.green} style={{ marginBottom: 0 }}>Daily check-in</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: t.orangeBg, padding: '4px 10px', borderRadius: 10, border: `1px solid ${t.orangeBorder}` }}>
            <Icon name="fire" size={11} color={t.orange} />
            <span style={{ fontSize: 11, color: t.orange, fontWeight: 700 }}>{USER.streak} day streak</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between', marginBottom: 14, position: 'relative' }}>
          {WEEK.map((day, i) => {
            const isToday = i === TODAY;
            const done = CHECKED[i];
            return (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 9, color: isToday ? t.green : t.muted, fontWeight: 700, letterSpacing: '0.05em' }}>{day.toUpperCase()}</div>
                <div style={{
                  width: 34, height: 34, borderRadius: 17,
                  background: isToday ? t.green : done ? t.greenBg : t.card2,
                  border: `1.5px solid ${isToday ? t.green : done ? t.greenBorder : t.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isToday ? '#0A0A0B' : done ? t.green : t.muted,
                  fontSize: 11.5, fontWeight: 700,
                }}>{done ? <Icon name="check" size={14} stroke={3} /> : DATES[i]}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <div style={{ fontSize: 13, color: t.soft }}>Fill in today's check-in</div>
          <Icon name="chevR" size={16} color={t.green} />
        </div>
      </Card>

      {/* Block 2: Nutrition Status */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <Label color={t.green}>Nutrition today</Label>
            <div style={{ fontSize: 16, color: t.text }}>
              You can still eat <span style={{ fontWeight: 700, color: t.green }}>{remaining}</span> kcal
            </div>
          </div>
        </div>

        <ProgressBar value={TODAY_NUTR.eaten} max={USER.calories} color={t.green} height={10} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
          <span style={{ color: t.soft }}><span style={{ color: t.text, fontWeight: 700 }}>{TODAY_NUTR.eaten}</span> eaten</span>
          <span style={{ color: t.soft }}>target <span style={{ color: t.text, fontWeight: 700 }}>{USER.calories}</span></span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 20, paddingTop: 18, borderTop: `1px solid ${t.border}` }}>
          <Ring value={TODAY_NUTR.protein} max={USER.protein} color={t.protein} label="Protein" />
          <Ring value={TODAY_NUTR.carbs} max={USER.carbs} color={t.carbs} label="Carbs" />
          <Ring value={TODAY_NUTR.fat} max={USER.fat} color={t.fat} label="Fat" />
        </div>
      </Card>

      {/* Block 3: Workout Status */}
      <Card>
        <Label color={t.orange}>Today's workout</Label>
        {todayWorkout ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: todayDone ? t.greenBg : t.orangeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${todayDone ? t.greenBorder : t.orangeBorder}` }}>
                <Icon name={todayDone ? "check" : "workout"} size={22} color={todayDone ? t.green : t.orange} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: t.text }}>{todayWorkout}</div>
                <div style={{ fontSize: 12.5, color: t.soft }}>{todayDone ? '✓ Completed' : `${EXMAP_LEN(todayWorkout)} exercises`}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: t.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}` }}>
              <Icon name="rest" size={22} color={t.muted} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: t.text }}>Rest day</div>
              <div style={{ fontSize: 12.5, color: t.soft }}>Recovery & mobility</div>
            </div>
          </div>
        )}
      </Card>

      {/* Block 4: Weight Graph */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div>
            <Label>Weight</Label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>{WEIGHTS[WEIGHTS.length - 1]}</span>
              <span style={{ fontSize: 13, color: t.soft }}>kg</span>
              <span style={{ fontSize: 12, color: t.green, marginLeft: 6, fontWeight: 600 }}>−0.7 kg</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>Last 7 days</div>
        </div>
        
        <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ width: '100%', height: 90 }}>
          <defs>
            <linearGradient id="wf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={t.green} stopOpacity="0.3" />
              <stop offset="100%" stopColor={t.green} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill="url(#wf)" />
          <path d={linePath} fill="none" stroke={t.green} strokeWidth="1.5" strokeLinecap="round" />
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 2 : 1.2} fill={t.green} />
          ))}
        </svg>
      </Card>
    </div>
  );
}
function EXMAP_LEN(name) { const w = WORKOUTS.find(x => x.name === name); return w ? w.exercises.length : 4; }

/* ═══════════════════════════ DAILY CHECK-IN ═══════════════════════════ */
function CheckIn({ visible, onClose }) {
  const [answers, setAnswers] = useState({});
  const upd = (k, v) => setAnswers(p => ({ ...p, [k]: v }));
  const trained = answers.trained;

  return (
    <Modal visible={visible} onClose={onClose} title="Daily check-in">
      <div style={{ fontSize: 13, color: t.soft, marginBottom: 20 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: t.greenBg, borderRadius: 8, color: t.green, fontWeight: 600 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: t.green }} />
          Autosaving
        </span>
      </div>

      {CHECKIN_Q.map(q => {
        if (q.cond === 'trained' && trained !== 'Yes') return null;
        return (
          <div key={q.id} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, color: t.text, fontWeight: 600, marginBottom: 10 }}>{q.label}</div>
            {q.type === 'number' && (
              <div style={{ position: 'relative' }}>
                <input
                  type="number" placeholder={q.ph}
                  value={answers[q.id] || ''}
                  onChange={e => upd(q.id, e.target.value)}
                  style={{
                    width: '100%', padding: '13px 14px', paddingRight: q.unit ? 46 : 14,
                    borderRadius: 12, border: `1px solid ${t.border}`,
                    fontSize: 15, color: t.text, background: t.card2,
                    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
                  }}
                />
                {q.unit && <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: t.muted, fontSize: 13, fontWeight: 500 }}>{q.unit}</span>}
              </div>
            )}
            {q.type === 'scale' && <ScaleInput value={answers[q.id]} onChange={v => upd(q.id, v)} />}
            {q.type === 'yesno' && <YesNo value={answers[q.id]} onChange={v => upd(q.id, v)} />}
          </div>
        );
      })}

      <Btn full onClick={onClose} style={{ marginTop: 8 }}>Done</Btn>
    </Modal>
  );
}

/* ═══════════════════════════ BARCODE SCANNER ═══════════════════════════ */
// Loads ZXing-js dynamically (no npm install needed). Works iOS Safari + Android Chrome.
let _zxingPromise = null;
const loadZXing = () => {
  if (window.ZXingBrowser) return Promise.resolve(window.ZXingBrowser);
  if (_zxingPromise) return _zxingPromise;
  _zxingPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/@zxing/browser@0.1.5/umd/zxing-browser.min.js';
    s.async = true;
    s.onload = () => resolve(window.ZXingBrowser);
    s.onerror = () => { _zxingPromise = null; reject(new Error('Failed to load scanner library')); };
    document.head.appendChild(s);
  });
  return _zxingPromise;
};

function BarcodeScanner({ visible, onClose, onResult }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [status, setStatus] = useState('init'); // init | loading | scanning | denied | error
  const [errMsg, setErrMsg] = useState('');
  const [manual, setManual] = useState('');
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (!visible) {
      if (controlsRef.current) { try { controlsRef.current.stop(); } catch(e) {} controlsRef.current = null; }
      setStatus('init'); setErrMsg(''); setShowManual(false); setManual('');
      return;
    }

    let cancelled = false;
    const start = async () => {
      try {
        setStatus('loading');
        const ZX = await loadZXing();
        if (cancelled) return;
        setStatus('scanning');

        const reader = new ZX.BrowserMultiFormatReader();
        const constraints = { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } };

        const controls = await reader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, err, ctrls) => {
            if (cancelled) { ctrls?.stop(); return; }
            if (result) {
              const code = result.getText();
              try { navigator.vibrate?.(80); } catch(e) {}
              ctrls?.stop();
              controlsRef.current = null;
              onResult(code);
            }
          }
        );
        controlsRef.current = controls;
      } catch (e) {
        if (cancelled) return;
        if (e.name === 'NotAllowedError' || /permission/i.test(e.message)) setStatus('denied');
        else { setStatus('error'); setErrMsg(e.message || String(e)); }
      }
    };
    start();

    return () => {
      cancelled = true;
      if (controlsRef.current) { try { controlsRef.current.stop(); } catch(e) {} controlsRef.current = null; }
    };
  }, [visible, onResult]);

  if (!visible) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

      {/* Top bar */}
      <div style={{ position: 'relative', zIndex: 3, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg, rgba(0,0,0,0.65), transparent)' }}>
        <div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Scan barcode</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 }}>EAN · UPC · Code128</div>
        </div>
        <div onClick={onClose} style={{ width: 38, height: 38, borderRadius: 19, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)' }}>
          <Icon name="x" size={18} color="#fff" />
        </div>
      </div>

      {/* Viewfinder */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '78%', maxWidth: 300, height: 180, position: 'relative', zIndex: 2,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)', borderRadius: 16,
        }}>
          {/* Corner brackets */}
          {[
            { top: -2, left: -2, borderTop: `3px solid ${t.green}`, borderLeft: `3px solid ${t.green}`, borderTopLeftRadius: 14 },
            { top: -2, right: -2, borderTop: `3px solid ${t.green}`, borderRight: `3px solid ${t.green}`, borderTopRightRadius: 14 },
            { bottom: -2, left: -2, borderBottom: `3px solid ${t.green}`, borderLeft: `3px solid ${t.green}`, borderBottomLeftRadius: 14 },
            { bottom: -2, right: -2, borderBottom: `3px solid ${t.green}`, borderRight: `3px solid ${t.green}`, borderBottomRightRadius: 14 },
          ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 30, height: 30, ...s }} />)}
          {status === 'scanning' && (
            <div style={{ position: 'absolute', left: 8, right: 8, top: '50%', height: 2, background: `linear-gradient(90deg, transparent, ${t.green}, transparent)`, animation: 'scanline 2s ease-in-out infinite', boxShadow: `0 0 10px ${t.green}` }} />
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ position: 'relative', zIndex: 3, padding: '18px 18px 32px', background: 'linear-gradient(0deg, rgba(0,0,0,0.75), transparent)' }}>
        {status === 'loading' && (
          <div style={{ textAlign: 'center', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 16, height: 16, borderRadius: 8, border: `2px solid rgba(255,255,255,0.3)`, borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
            Loading scanner...
          </div>
        )}
        {status === 'scanning' && !showManual && (
          <>
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: 13, marginBottom: 14 }}>Point camera at the barcode</div>
            <div onClick={() => setShowManual(true)} style={{ textAlign: 'center', color: t.green, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '8px 14px' }}>
              Enter barcode manually
            </div>
          </>
        )}
        {showManual && (
          <div style={{ background: 'rgba(0,0,0,0.7)', borderRadius: 14, padding: 14, border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ color: '#fff', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>Enter barcode</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text" inputMode="numeric" value={manual} onChange={e => setManual(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 3017620422003" autoFocus
                style={{ flex: 1, padding: '11px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', fontSize: 14, color: '#fff', background: 'rgba(255,255,255,0.08)', outline: 'none', fontFamily: 'monospace' }}
              />
              <Btn small onClick={() => { if (manual.length >= 6) { onResult(manual); setShowManual(false); } }}>Go</Btn>
            </div>
          </div>
        )}
        {status === 'denied' && (
          <div style={{ textAlign: 'center', color: '#FCA5A5', fontSize: 13, padding: '12px 14px', background: 'rgba(239,68,68,0.2)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', lineHeight: 1.5 }}>
            Camera access denied. Enable camera in your browser/iOS settings, then reopen the scanner.
          </div>
        )}
        {status === 'error' && (
          <div style={{ textAlign: 'center', color: '#FCA5A5', fontSize: 13, padding: '12px 14px', background: 'rgba(239,68,68,0.15)', borderRadius: 12, lineHeight: 1.5 }}>
            {errMsg || 'Scanner error. Tap manual entry below.'}
            <div onClick={() => setShowManual(true)} style={{ color: '#fff', marginTop: 8, fontWeight: 600, cursor: 'pointer' }}>Enter manually →</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════ SCANNED PRODUCT MODAL ═══════════════════════════ */
// Looks up the barcode in Open Food Facts (free, no API key, ~3M products worldwide)
async function lookupBarcode(barcode) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,product_name_en,brands,image_front_url,image_url,nutriments,quantity`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  const p = data.product;
  const n = p.nutriments || {};
  let kcal = n['energy-kcal_100g'];
  if (kcal == null && n['energy_100g']) kcal = n['energy_100g'] / 4.184;
  return {
    barcode,
    name: p.product_name || p.product_name_en || 'Unknown product',
    brand: p.brands || '',
    image: p.image_front_url || p.image_url || null,
    quantity: p.quantity || '',
    kcal: Math.round(kcal || 0),
    protein: Math.round((n.proteins_100g || 0) * 10) / 10,
    carbs: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
    fat: Math.round((n.fat_100g || 0) * 10) / 10,
  };
}

function ScannedProductModal({ barcode, onClose, onSave }) {
  const visible = barcode !== null && barcode !== undefined;
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [grams, setGrams] = useState(100);

  useEffect(() => {
    if (!visible) { setProduct(null); setNotFound(false); setGrams(100); return; }
    let cancelled = false;
    setLoading(true); setNotFound(false); setProduct(null);
    lookupBarcode(barcode)
      .then(p => { if (cancelled) return; if (p) setProduct(p); else setNotFound(true); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [visible, barcode]);

  const tKcal = product ? Math.round((product.kcal * grams) / 100) : 0;
  const tP = product ? Math.round((product.protein * grams) / 10) / 10 : 0;
  const tC = product ? Math.round((product.carbs * grams) / 10) / 10 : 0;
  const tF = product ? Math.round((product.fat * grams) / 10) / 10 : 0;

  return (
    <Modal visible={visible} onClose={onClose} title={loading ? "Looking up..." : product ? "Product found" : "Not found"}>
      {loading && (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, border: `3px solid ${t.border}`, borderTopColor: t.green, margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ marginTop: 16, fontSize: 13, color: t.soft }}>Barcode</div>
          <div style={{ fontSize: 14, color: t.text, fontFamily: 'monospace', marginTop: 2 }}>{barcode}</div>
        </div>
      )}

      {notFound && !loading && (
        <>
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6 }}>Product not in database</div>
            <div style={{ fontSize: 12.5, color: t.soft }}>Barcode <span style={{ fontFamily: 'monospace', color: t.text }}>{barcode}</span> is unknown in Open Food Facts.</div>
          </div>
          <Btn full style={{ marginBottom: 8 }} onClick={() => { onSave({ barcode, manual: true, action: 'addManual' }); onClose(); }}>+ Add this product manually</Btn>
          <Btn full variant="outline" onClick={onClose}>Cancel</Btn>
        </>
      )}

      {product && !loading && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 18, padding: 14, background: t.card2, borderRadius: 16, border: `1px solid ${t.border}` }}>
            {product.image ? (
              <img src={product.image} alt="" style={{ width: 68, height: 68, borderRadius: 12, objectFit: 'cover', background: '#fff', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 68, height: 68, borderRadius: 12, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>📦</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, lineHeight: 1.3, marginBottom: 3, wordBreak: 'break-word' }}>{product.name}</div>
              {product.brand && <div style={{ fontSize: 12, color: t.soft, marginBottom: 4 }}>{product.brand}</div>}
              <div style={{ fontSize: 10, color: t.muted, fontFamily: 'monospace', display: 'inline-block', padding: '2px 6px', background: t.card3, borderRadius: 5 }}>{product.barcode}</div>
            </div>
          </div>

          {/* Per 100g */}
          <Label>Nutrition per 100g</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 18 }}>
            {[
              { l: 'kcal', v: product.kcal, c: t.green },
              { l: 'protein', v: product.protein + 'g', c: t.protein },
              { l: 'carbs', v: product.carbs + 'g', c: t.carbs },
              { l: 'fat', v: product.fat + 'g', c: t.fat },
            ].map(m => (
              <div key={m.l} style={{ background: t.card2, borderRadius: 10, padding: 10, textAlign: 'center', border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: m.c }}>{m.v}</div>
                <div style={{ fontSize: 9.5, color: t.muted, fontWeight: 700, marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{m.l}</div>
              </div>
            ))}
          </div>

          {/* Quantity */}
          <Label>How much did you eat?</Label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', marginBottom: 14 }}>
            <div onClick={() => setGrams(Math.max(0, grams - 10))} style={{ width: 44, background: t.card2, borderRadius: 12, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.text, fontSize: 18, fontWeight: 700 }}>−</div>
            <div style={{ flex: 1, position: 'relative' }}>
              <input type="number" inputMode="numeric" value={grams} onChange={e => setGrams(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '12px 14px', paddingRight: 50, borderRadius: 12, border: `1px solid ${t.border}`, fontSize: 16, color: t.text, background: t.card2, outline: 'none', fontFamily: 'inherit', textAlign: 'center', fontWeight: 700, boxSizing: 'border-box' }} />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: t.muted, fontSize: 13, fontWeight: 600 }}>g</span>
            </div>
            <div onClick={() => setGrams(grams + 10)} style={{ width: 44, background: t.card2, borderRadius: 12, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.text, fontSize: 18, fontWeight: 700 }}>+</div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {[50, 100, 150, 200].map(q => (
              <div key={q} onClick={() => setGrams(q)} style={{ flex: 1, padding: '8px', textAlign: 'center', borderRadius: 9, background: grams === q ? t.greenBg : t.card2, color: grams === q ? t.green : t.soft, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${grams === q ? t.greenBorder : t.border}` }}>{q}g</div>
            ))}
          </div>

          {/* Total */}
          <div style={{ background: t.greenBg, borderRadius: 16, padding: 16, marginBottom: 16, border: `1px solid ${t.greenBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <Label color={t.green} style={{ marginBottom: 0 }}>You'll log</Label>
              <div><span style={{ fontSize: 26, fontWeight: 800, color: t.green, letterSpacing: '-0.02em' }}>{tKcal}</span><span style={{ fontSize: 11, color: t.soft, marginLeft: 4 }}>kcal</span></div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12.5 }}>
              <span><span style={{ color: t.protein, fontWeight: 700 }}>{tP}g</span> <span style={{ color: t.muted }}>P</span></span>
              <span><span style={{ color: t.carbs, fontWeight: 700 }}>{tC}g</span> <span style={{ color: t.muted }}>C</span></span>
              <span><span style={{ color: t.fat, fontWeight: 700 }}>{tF}g</span> <span style={{ color: t.muted }}>F</span></span>
            </div>
          </div>

          <Btn full style={{ marginBottom: 8 }} onClick={() => { onSave({ ...product, grams, totalKcal: tKcal, totalP: tP, totalC: tC, totalF: tF, action: 'log' }); onClose(); }}>Log to today</Btn>
          <Btn full variant="ghost" onClick={() => { onSave({ ...product, action: 'save' }); onClose(); }}>+ Save to my products</Btn>
        </>
      )}
    </Modal>
  );
}

/* ═══════════════════════════ TOAST ═══════════════════════════ */
function Toast({ message, visible }) {
  if (!visible) return null;
  return (
    <div style={{ position: 'absolute', bottom: 90, left: 16, right: 16, zIndex: 400, background: t.card2, borderRadius: 14, padding: '12px 16px', border: `1px solid ${t.greenBorder}`, boxShadow: '0 8px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 10, animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div style={{ width: 24, height: 24, borderRadius: 12, background: t.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.greenBorder}` }}>
        <Icon name="check" size={14} color={t.green} stroke={3} />
      </div>
      <div style={{ fontSize: 13, color: t.text, fontWeight: 600 }}>{message}</div>
    </div>
  );
}

/* ═══════════════════════════ NUTRITION ═══════════════════════════ */
function Nutrition() {
  const [sub, setSub] = useState('week'); // week | products | recipes | groceries | concepts
  const [selectedDay, setSelectedDay] = useState(TODAY);
  const [showMealOptions, setShowMealOptions] = useState(null);
  const [showLockedDeviate, setShowLockedDeviate] = useState(false);
  const [grocMode, setGrocMode] = useState('smart'); // smart | simple
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const [scannedToday, setScannedToday] = useState([]); // logged via scanner
  const [savedProducts, setSavedProducts] = useState([]); // saved to library via scanner
  const [toast, setToast] = useState('');

  const handleScanResult = (code) => { setShowScanner(false); setScannedCode(code); };
  const handleProductSave = (p) => {
    if (p.action === 'log') {
      setScannedToday(prev => [...prev, { ...p, time: new Date() }]);
      setToast(`Logged ${p.totalKcal} kcal · ${p.name}`);
    } else if (p.action === 'save') {
      setSavedProducts(prev => [...prev, p]);
      setToast(`Saved "${p.name}" to your products`);
    } else if (p.action === 'addManual') {
      setToast(`Add product manually with barcode ${p.barcode}`);
    }
    setScannedCode(null);
    setTimeout(() => setToast(''), 2800);
  };

  const tabs = [
    { k: 'week', l: 'Planning' },
    { k: 'recipes', l: 'Recipes' },
    { k: 'products', l: 'Products' },
    { k: 'groceries', l: 'Groceries' },
    { k: 'concepts', l: 'Concepts' },
  ];

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Label color={t.green}>Nutrition</Label>
            <div style={{ fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>This week</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div onClick={() => setShowScanner(true)} style={{ width: 40, height: 40, borderRadius: 12, background: t.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}`, cursor: 'pointer' }}>
              <Icon name="scan" size={18} color={t.text} />
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: t.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.greenBorder}`, cursor: 'pointer' }}>
              <Icon name="plus" size={20} color={t.green} />
            </div>
          </div>
        </div>
        
        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
          {tabs.map(tb => (
            <Chip key={tb.k} active={sub === tb.k} onClick={() => setSub(tb.k)}>
              <span style={{ padding: '2px 0' }}>{tb.l}</span>
            </Chip>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {sub === 'week' && (
          <>
            {/* Week strip with day status colors */}
            <Card style={{ padding: 14 }}>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
                {WEEK.map((day, i) => {
                  const sc = STATUS[DAY_STATUS[i]];
                  const isSel = i === selectedDay;
                  return (
                    <div key={day} onClick={() => setSelectedDay(i)} style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      padding: 8, borderRadius: 12, cursor: 'pointer',
                      background: isSel ? t.card3 : 'transparent',
                      border: `1px solid ${isSel ? t.border : 'transparent'}`,
                    }}>
                      <div style={{ fontSize: 9, color: t.muted, fontWeight: 700, letterSpacing: '0.05em' }}>{day.toUpperCase()}</div>
                      <div style={{ fontSize: 14, color: t.text, fontWeight: 700 }}>{DATES[i]}</div>
                      <div style={{ width: 24, height: 4, borderRadius: 2, background: sc.dot, opacity: DAY_STATUS[i] === 'gray' ? 0.4 : 1 }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.border}`, fontSize: 11, color: t.muted }}>
                <div>Target {USER.calories} kcal</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 10 }}>
                  {['green','yellow','orange','red'].map(s => (
                    <div key={s} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: STATUS[s].dot }} />
                      <span style={{ color: STATUS[s].label, textTransform: 'capitalize', fontWeight: 600 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 4px 12px' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: t.text }}>{WEEK[selectedDay]}, {DATES[selectedDay]} May</div>
              <div style={{ fontSize: 12, color: t.soft }}>{TODAY_NUTR.eaten} / {USER.calories} kcal</div>
            </div>

            {/* 6 meal slots */}
            {MEALS.map((m, i) => (
              <Card key={i} onClick={() => m.locked && !m.eaten ? setShowLockedDeviate(true) : setShowMealOptions(i)}
                style={{ padding: 14, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: m.eaten ? t.greenBg : m.locked ? t.orangeBg : t.card2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${m.eaten ? t.greenBorder : m.locked ? t.orangeBorder : t.border}`,
                    }}>
                      {m.eaten ? <Icon name="check" size={16} color={t.green} stroke={2.5} /> :
                       m.locked ? <Icon name="lock" size={14} color={t.orange} /> :
                       <Icon name="plus" size={16} color={t.muted} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{m.slot}</div>
                        {m.eaten && <span style={{ fontSize: 9, color: t.green, fontWeight: 700, background: t.greenBg, padding: '2px 6px', borderRadius: 5, letterSpacing: '0.05em' }}>EATEN</span>}
                      </div>
                      <div style={{ fontSize: 12, color: t.soft, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.items.length ? m.items.join(' · ') : 'No meal planned'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.kcal ? t.text : t.muted, marginLeft: 8 }}>{m.kcal || '—'}</div>
                </div>
              </Card>
            ))}
          </>
        )}

        {sub === 'recipes' && (
          <>
            <Btn full variant="ghost" style={{ marginBottom: 14 }}>+ Create recipe</Btn>
            {RECIPES.map(r => (
              <Card key={r.id} style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: t.muted, fontWeight: 600, letterSpacing: '0.05em', marginTop: 3 }}>{r.cat.toUpperCase()} · {r.prods} products</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: t.green }}>{r.kcal}<span style={{ fontSize: 10, color: t.muted, marginLeft: 2 }}>kcal</span></div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11.5 }}>
                  <span><span style={{ color: t.protein, fontWeight: 700 }}>{r.p}g</span> <span style={{ color: t.muted }}>P</span></span>
                  <span><span style={{ color: t.carbs, fontWeight: 700 }}>{r.c}g</span> <span style={{ color: t.muted }}>C</span></span>
                  <span><span style={{ color: t.fat, fontWeight: 700 }}>{r.f}g</span> <span style={{ color: t.muted }}>F</span></span>
                </div>
              </Card>
            ))}
          </>
        )}

        {sub === 'products' && (
          <>
            <Btn full variant="ghost" style={{ marginBottom: 14 }}>+ Add product</Btn>
            {PRODUCTS.map(p => (
              <Card key={p.id} style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{p.name}</div>
                      <span style={{ fontSize: 9, color: t.muted, fontWeight: 700, background: t.card2, padding: '2px 6px', borderRadius: 5, letterSpacing: '0.05em', border: `1px solid ${t.border}`, textTransform: 'uppercase' }}>{p.shelf}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: t.muted }}>per 100g · {p.store}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{p.kcal}<span style={{ fontSize: 10, color: t.muted, marginLeft: 2 }}>kcal</span></div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11.5, marginTop: 8 }}>
                  <span><span style={{ color: t.protein, fontWeight: 700 }}>{p.p}g</span> <span style={{ color: t.muted }}>P</span></span>
                  <span><span style={{ color: t.carbs, fontWeight: 700 }}>{p.c}g</span> <span style={{ color: t.muted }}>C</span></span>
                  <span><span style={{ color: t.fat, fontWeight: 700 }}>{p.f}g</span> <span style={{ color: t.muted }}>F</span></span>
                </div>
              </Card>
            ))}
          </>
        )}

        {sub === 'groceries' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Chip active={grocMode === 'simple'} onClick={() => setGrocMode('simple')}>Simple</Chip>
              <Chip active={grocMode === 'smart'} onClick={() => setGrocMode('smart')}>Smart (by shelf)</Chip>
            </div>
            {grocMode === 'smart' ? (
              <>
                {Object.entries(GROCERIES).map(([cat, items]) => (
                  <Card key={cat} style={{ padding: 14 }}>
                    <Label color={cat === 'fresh' ? t.green : cat === 'refrigerated' ? t.protein : t.muted}>
                      {cat === 'shelf' ? '🥫 Shelf stable' : cat === 'refrigerated' ? '❄️ Refrigerated' : '🥬 Fresh'}
                    </Label>
                    {items.map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < items.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 18, height: 18, borderRadius: 6, border: `1.5px solid ${t.border}` }} />
                          <div>
                            <div style={{ fontSize: 14, color: t.text }}>{it.name}</div>
                            <div style={{ fontSize: 11, color: t.muted }}>{it.store}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: t.soft }}>{it.amt}</div>
                      </div>
                    ))}
                  </Card>
                ))}
              </>
            ) : (
              <Card style={{ padding: 14 }}>
                {Object.values(GROCERIES).flat().map((it, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 6, border: `1.5px solid ${t.border}` }} />
                      <div>
                        <div style={{ fontSize: 14, color: t.text }}>{it.name}</div>
                        <div style={{ fontSize: 11, color: t.muted }}>{it.store}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.soft }}>{it.amt}</div>
                  </div>
                ))}
              </Card>
            )}
          </>
        )}

        {sub === 'concepts' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Btn small full variant="ghost">+ Day concept</Btn>
              <Btn small full variant="ghost">+ Week concept</Btn>
            </div>
            {[
              { name: 'Training day 2650', type: 'Day', kcal: 2650, last: '2 days ago' },
              { name: 'Rest day 2300', type: 'Day', kcal: 2300, last: '5 days ago' },
              { name: 'Week concept 1', type: 'Week', kcal: 'mixed', last: '1 week ago' },
            ].map((c, i) => (
              <Card key={i} style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{c.name}</div>
                      <span style={{ fontSize: 9, color: t.green, fontWeight: 700, background: t.greenBg, padding: '2px 6px', borderRadius: 5, letterSpacing: '0.05em' }}>{c.type.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: t.muted }}>{c.kcal} kcal · used {c.last}</div>
                  </div>
                  <Icon name="chevR" size={16} color={t.muted} />
                </div>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Meal options modal */}
      <Modal visible={showMealOptions !== null} onClose={() => setShowMealOptions(null)} title={showMealOptions !== null ? MEALS[showMealOptions].slot : ''}>
        <Btn full variant="ghost" style={{ marginBottom: 8 }}>Choose recipe</Btn>
        <Btn full variant="ghost" style={{ marginBottom: 8 }}>{showMealOptions !== null && MEALS[showMealOptions].locked ? '🔓 Unlock meal' : '🔒 Lock meal'}</Btn>
        <Btn full variant="ghost" style={{ marginBottom: 8 }}>{showMealOptions !== null && MEALS[showMealOptions].eaten ? 'Mark as not eaten' : 'Mark as eaten'}</Btn>
        <Btn full variant="outline">Change category</Btn>
      </Modal>

      {/* Locked deviation modal */}
      <Modal visible={showLockedDeviate} onClose={() => setShowLockedDeviate(false)} title="Deviating from plan">
        <div style={{ fontSize: 14, color: t.soft, marginBottom: 18, lineHeight: 1.5 }}>You are deviating from your planned meal. What would you like to do?</div>
        <Btn full style={{ marginBottom: 8 }} onClick={() => setShowLockedDeviate(false)}>Keep plan</Btn>
        <Btn full variant="outline" style={{ marginBottom: 8 }} onClick={() => setShowLockedDeviate(false)}>Remove plan</Btn>
        <Btn full variant="ghost" onClick={() => setShowLockedDeviate(false)}>Remind me later</Btn>
      </Modal>

      {/* Scanned today section — appears in week view when scans exist */}
      {sub === 'week' && scannedToday.length > 0 && (
        <div style={{ padding: '0 16px', marginTop: 18 }}>
          <Label color={t.green}>📷 Scanned today ({scannedToday.length})</Label>
          {scannedToday.map((it, i) => (
            <Card key={i} style={{ padding: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {it.image ? (
                  <img src={it.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', background: '#fff', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📦</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</div>
                  <div style={{ fontSize: 11, color: t.soft }}>{it.grams}g · {it.brand || 'no brand'}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.green, flexShrink: 0 }}>{it.totalKcal}<span style={{ fontSize: 10, color: t.muted, marginLeft: 2 }}>kcal</span></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Saved products section — shows in products sub-tab */}
      {sub === 'products' && savedProducts.length > 0 && (
        <div style={{ padding: '0 16px', marginTop: 18 }}>
          <Label color={t.green}>📷 Recently scanned ({savedProducts.length})</Label>
          {savedProducts.map((p, i) => (
            <Card key={i} style={{ padding: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {p.image ? (
                  <img src={p.image} alt="" style={{ width: 44, height: 44, borderRadius: 9, objectFit: 'cover', background: '#fff', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 9, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📦</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: t.muted, fontFamily: 'monospace' }}>{p.barcode}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text, flexShrink: 0 }}>{p.kcal}<span style={{ fontSize: 10, color: t.muted, marginLeft: 2 }}>kcal/100g</span></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Barcode scanner — full screen overlay */}
      <BarcodeScanner visible={showScanner} onClose={() => setShowScanner(false)} onResult={handleScanResult} />

      {/* Scanned product result */}
      <ScannedProductModal barcode={scannedCode} onClose={() => setScannedCode(null)} onSave={handleProductSave} />

      {/* Toast */}
      <Toast message={toast} visible={!!toast} />
    </div>
  );
}

/* ═══════════════════════════ WORKOUTS ═══════════════════════════ */
function Workouts() {
  const [view, setView] = useState('week'); // week | templates
  const [selectedDay, setSelectedDay] = useState(TODAY);
  const [mode, setMode] = useState('fixed'); // fixed | flexible
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [showTpl, setShowTpl] = useState(null);

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Label color={t.orange}>Workouts</Label>
            <div style={{ fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>Train smart</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: t.orangeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.orangeBorder}`, cursor: 'pointer' }}>
            <Icon name="plus" size={20} color={t.orange} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <Chip active={view === 'week'} onClick={() => setView('week')} accent="orange">Week</Chip>
          <Chip active={view === 'templates'} onClick={() => setView('templates')} accent="orange">Templates</Chip>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {view === 'week' && (
          <>
            {/* Planning mode */}
            <Card style={{ padding: 14 }}>
              <Label color={t.orange}>Planning mode</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div onClick={() => setMode('fixed')} style={{
                  flex: 1, padding: 12, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  background: mode === 'fixed' ? t.orangeBg : t.card2,
                  color: mode === 'fixed' ? t.orange : t.soft,
                  border: `1px solid ${mode === 'fixed' ? t.orange : t.border}`,
                  fontWeight: 600, fontSize: 13,
                }}>
                  <div>Fixed</div>
                  <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>auto train/rest macros</div>
                </div>
                <div onClick={() => setMode('flexible')} style={{
                  flex: 1, padding: 12, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  background: mode === 'flexible' ? t.orangeBg : t.card2,
                  color: mode === 'flexible' ? t.orange : t.soft,
                  border: `1px solid ${mode === 'flexible' ? t.orange : t.border}`,
                  fontWeight: 600, fontSize: 13,
                }}>
                  <div>Flexible</div>
                  <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>manual day type</div>
                </div>
              </div>
            </Card>

            {/* Week list */}
            <div style={{ marginTop: 12 }}>
              {WEEK.map((day, i) => {
                const w = WORKOUT_PLAN[day];
                const done = WORKOUT_DONE[day];
                const isToday = i === TODAY;
                return (
                  <Card key={day} onClick={() => { setSelectedDay(i); setShowDayDetail(true); }}
                    style={{ padding: 14, marginBottom: 8, background: isToday ? `linear-gradient(135deg, ${t.card}, ${t.orangeBg})` : t.card, border: isToday ? `1px solid ${t.orangeBorder}` : `1px solid ${t.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: done ? t.greenBg : w ? t.orangeBg : t.card2,
                        border: `1px solid ${done ? t.greenBorder : w ? t.orangeBorder : t.border}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ fontSize: 9, color: done ? t.green : w ? t.orange : t.muted, fontWeight: 700 }}>{day.slice(0,3).toUpperCase()}</div>
                        <div style={{ fontSize: 14, color: t.text, fontWeight: 700, marginTop: -1 }}>{DATES[i]}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{w || 'Rest day'}</div>
                          {done && <Icon name="check" size={14} color={t.green} stroke={3} />}
                          {isToday && <span style={{ fontSize: 9, color: t.orange, fontWeight: 700, background: t.orangeBg, padding: '2px 6px', borderRadius: 5, letterSpacing: '0.05em' }}>TODAY</span>}
                        </div>
                        <div style={{ fontSize: 12, color: t.soft, marginTop: 2 }}>
                          {done ? '✓ Completed' : w ? `${EXMAP_LEN(w)} exercises` : 'Recovery & mobility'}
                        </div>
                      </div>
                      <Icon name="chevR" size={16} color={t.muted} />
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {view === 'templates' && (
          <>
            <Btn full variant="ghost" accent="orange" style={{ marginBottom: 14 }}>+ Create template</Btn>
            {WORKOUTS.map((w, i) => (
              <Card key={i} onClick={() => setShowTpl(i)} style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: t.orangeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.orangeBorder}` }}>
                      <Icon name="workout" size={18} color={t.orange} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{w.name}</div>
                      <div style={{ fontSize: 12, color: t.soft }}>{w.exercises.length} exercises</div>
                    </div>
                  </div>
                  <Icon name="chevR" size={16} color={t.muted} />
                </div>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Day detail modal */}
      <Modal visible={showDayDetail} onClose={() => setShowDayDetail(false)} title={`${WEEK[selectedDay]}, ${DATES[selectedDay]} May`} accent="orange">
        {(() => {
          const w = WORKOUT_PLAN[WEEK[selectedDay]];
          const done = WORKOUT_DONE[WEEK[selectedDay]];
          return (
            <>
              <div style={{ background: t.card2, borderRadius: 14, padding: 14, marginBottom: 14, border: `1px solid ${t.border}` }}>
                <Label color={t.orange}>Today's workout</Label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: t.text }}>{w || 'Rest day'}</div>
                  {done && <span style={{ fontSize: 11, color: t.green, fontWeight: 700, background: t.greenBg, padding: '4px 10px', borderRadius: 8 }}>✓ DONE</span>}
                </div>
              </div>

              {w && WORKOUTS.find(x => x.name === w) && (
                <div style={{ marginBottom: 16 }}>
                  <Label>Exercises</Label>
                  {WORKOUTS.find(x => x.name === w).exercises.map((ex, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${t.border}` }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: t.orangeBg, color: t.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
                      <div style={{ fontSize: 14, color: t.text }}>{ex}</div>
                    </div>
                  ))}
                </div>
              )}

              <Btn full accent="orange" style={{ marginBottom: 8 }} onClick={() => setShowDayDetail(false)}>
                {done ? 'Mark as not completed' : '✓ Mark as completed'}
              </Btn>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn full variant="ghost" accent="orange" small>Change workout</Btn>
                <Btn full variant="outline" small>Set rest day</Btn>
              </div>
            </>
          );
        })()}
      </Modal>

      {/* Template detail */}
      <Modal visible={showTpl !== null} onClose={() => setShowTpl(null)} title={showTpl !== null ? WORKOUTS[showTpl].name : ''} accent="orange">
        {showTpl !== null && (
          <>
            {WORKOUTS[showTpl].exercises.map((ex, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: `1px solid ${t.border}` }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: t.orangeBg, color: t.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                <div style={{ fontSize: 14, color: t.text }}>{ex}</div>
              </div>
            ))}
            <Btn full variant="ghost" accent="orange" style={{ marginTop: 14 }}>Edit template</Btn>
          </>
        )}
      </Modal>
    </div>
  );
}

/* ═══════════════════════════ SETTINGS ═══════════════════════════ */
function Settings() {
  const { session, profile, signOut } = useApp();
  const [sub, setSub] = useState('main'); // main | macros | notifications | personal
  const [macroMode, setMacroMode] = useState('auto');
  const [showConfirmAuto, setShowConfirmAuto] = useState(false);
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);
  const [notif, setNotif] = useState({ weigh: true, checkin: true, photoSat: true, photoSun: false, weekChange: true, system: true });
  const [manual, setManual] = useState({ cal: 2200, p: 197, c: 218, f: 57 });
  const manualKcal = manual.p * 4 + manual.c * 4 + manual.f * 9;
  const macroMismatch = Math.abs(manualKcal - manual.cal) > 25;

  const userName = profile?.name || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'You';
  const userEmail = session?.user?.email || '';

  if (sub === 'main') return (
    <div style={{ padding: '20px 16px 100px' }}>
      <Label>Settings</Label>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 20, letterSpacing: '-0.02em' }}>Account</div>

      {/* Profile card */}
      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${t.green}, ${t.orange})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A0A0B', fontWeight: 800, fontSize: 20 }}>{(userName[0] || 'U').toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
            <div style={{ fontSize: 12, color: t.soft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail || `${USER.goal} · ${USER.calories} kcal/day`}</div>
          </div>
        </div>
      </Card>

      {[
        { k: 'personal', icon: 'user', l: 'Personal data', sub: 'Age, height, weight, activity' },
        { k: 'goal', icon: 'target', l: 'Goal', sub: `${USER.goal} · ${USER.goalDetail}` },
        { k: 'training', icon: 'workout', l: 'Training / rest structure', sub: 'Fixed schedule', accent: 'orange' },
        { k: 'macros', icon: 'flame', l: 'Adjust macros', sub: macroMode === 'auto' ? 'Auto mode' : 'Manual mode', accent: 'green' },
        { k: 'notifications', icon: 'bell', l: 'Notifications', sub: '4 of 6 enabled' },
        { k: 'privacy', icon: 'shield', l: 'Privacy', sub: 'Photos never stored' },
      ].map(item => (
        <Card key={item.k} onClick={() => (item.k === 'macros' || item.k === 'notifications') && setSub(item.k)} style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: item.accent === 'orange' ? t.orangeBg : item.accent === 'green' ? t.greenBg : t.card2,
              border: `1px solid ${item.accent === 'orange' ? t.orangeBorder : item.accent === 'green' ? t.greenBorder : t.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={item.icon} size={17} color={item.accent === 'orange' ? t.orange : item.accent === 'green' ? t.green : t.soft} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{item.l}</div>
              <div style={{ fontSize: 11.5, color: t.muted }}>{item.sub}</div>
            </div>
            <Icon name="chevR" size={15} color={t.muted} />
          </div>
        </Card>
      ))}

      <Card onClick={() => setShowConfirmSignOut(true)} style={{ padding: 14, marginTop: 8, background: 'rgba(239,68,68,0.06)', border: `1px solid rgba(239,68,68,0.2)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: 'rgba(239,68,68,0.12)', border: `1px solid rgba(239,68,68,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F87171' }}>Sign out</div>
            <div style={{ fontSize: 11.5, color: t.muted }}>You'll need to sign in again</div>
          </div>
          <Icon name="chevR" size={15} color="#F87171" />
        </div>
      </Card>

      <div style={{ marginTop: 20, fontSize: 11, color: t.muted, textAlign: 'center' }}>v0.1 · Built for coaching</div>

      <Modal visible={showConfirmSignOut} onClose={() => setShowConfirmSignOut(false)} title="Sign out?">
        <div style={{ fontSize: 14, color: t.soft, marginBottom: 18, lineHeight: 1.5 }}>
          Your data stays safe in the cloud. You can sign in again any time with the same email or Google account.
        </div>
        <Btn full variant="danger" style={{ marginBottom: 8 }} onClick={() => { setShowConfirmSignOut(false); signOut(); }}>Yes, sign out</Btn>
        <Btn full variant="outline" onClick={() => setShowConfirmSignOut(false)}>Cancel</Btn>
      </Modal>
    </div>
  );

  if (sub === 'macros') return (
    <div style={{ padding: '20px 16px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }} onClick={() => setSub('main')}>
        <Icon name="chevL" size={20} color={t.soft} />
        <Label style={{ marginBottom: 0 }}>Back to settings</Label>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>Adjust macros</div>

      <div style={{ background: t.greenBg, borderRadius: 14, padding: 12, marginBottom: 18, marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-start', border: `1px solid ${t.greenBorder}` }}>
        <Icon name="info" size={16} color={t.green} />
        <div style={{ fontSize: 12, color: t.soft, lineHeight: 1.5 }}>
          You can always return to your automatic plan calculation. <span style={{ color: t.green, fontWeight: 600 }}>Settings → Macros → Return to automatic</span>.
        </div>
      </div>

      <Card onClick={() => setMacroMode('new')} style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 3 }}>1. New plan</div>
            <div style={{ fontSize: 12.5, color: t.soft }}>Re-run onboarding calculation flow</div>
          </div>
          <Icon name="chevR" size={16} color={t.muted} />
        </div>
      </Card>

      <Card style={{ padding: 16, border: macroMode === 'manual' ? `1px solid ${t.greenBorder}` : `1px solid ${t.border}` }}>
        <div onClick={() => setMacroMode('manual')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: macroMode === 'manual' ? 16 : 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 3 }}>2. Adjust manually</div>
            <div style={{ fontSize: 12.5, color: t.soft }}>Full freedom · no protections</div>
          </div>
          {macroMode === 'manual' ? <Icon name="chevD" size={16} color={t.green} /> : <Icon name="chevR" size={16} color={t.muted} />}
        </div>

        {macroMode === 'manual' && (
          <>
            <div style={{ paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
              <Field label="Calories" value={manual.cal} onChange={v => setManual(p => ({ ...p, cal: parseInt(v) || 0 }))} type="number" unit="kcal" />
              <Field label="Protein" value={manual.p} onChange={v => setManual(p => ({ ...p, p: parseInt(v) || 0 }))} type="number" unit="g" />
              <Field label="Carbs" value={manual.c} onChange={v => setManual(p => ({ ...p, c: parseInt(v) || 0 }))} type="number" unit="g" />
              <Field label="Fat" value={manual.f} onChange={v => setManual(p => ({ ...p, f: parseInt(v) || 0 }))} type="number" unit="g" />

              {macroMismatch && (
                <div style={{ background: 'rgba(250,204,21,0.1)', border: `1px solid rgba(250,204,21,0.3)`, borderRadius: 12, padding: 12, marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Icon name="info" size={14} color="#FACC15" />
                  <div style={{ fontSize: 12, color: '#FDE047', lineHeight: 1.5 }}>
                    Your macros total <strong>{manualKcal} kcal</strong> but target is <strong>{manual.cal} kcal</strong>. That's fine — you have full freedom.
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      <Card onClick={() => setShowConfirmAuto(true)} style={{ padding: 16, background: t.greenBg, border: `1px solid ${t.greenBorder}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.green, marginBottom: 3 }}>↻ Return to automatic</div>
            <div style={{ fontSize: 12, color: t.soft }}>Recalculate from your 7-day weight avg</div>
          </div>
          <Icon name="chevR" size={16} color={t.green} />
        </div>
      </Card>

      <Modal visible={showConfirmAuto} onClose={() => setShowConfirmAuto(false)} title="Return to automatic?">
        <div style={{ fontSize: 14, color: t.soft, marginBottom: 18, lineHeight: 1.5 }}>
          This will restore your calories and macros based on your current goal, activity settings, and 7-day average body weight. Your manual values will be replaced.
        </div>
        <Btn full style={{ marginBottom: 8 }} onClick={() => { setMacroMode('auto'); setShowConfirmAuto(false); }}>Yes, switch to auto</Btn>
        <Btn full variant="outline" onClick={() => setShowConfirmAuto(false)}>Cancel</Btn>
      </Modal>
    </div>
  );

  if (sub === 'notifications') return (
    <div style={{ padding: '20px 16px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }} onClick={() => setSub('main')}>
        <Icon name="chevL" size={20} color={t.soft} />
        <Label style={{ marginBottom: 0 }}>Back to settings</Label>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 24, letterSpacing: '-0.02em' }}>Notifications</div>

      <Card>
        {[
          { k: 'weigh', l: 'Morning weigh reminder', sub: '08:00', icon: '⚖️' },
          { k: 'checkin', l: 'Daily check-in reminder', sub: '21:00', icon: '✅' },
          { k: 'photoSat', l: 'Saturday progress photo', sub: '20:00 · "Tomorrow is your progress moment"', icon: '📷' },
          { k: 'photoSun', l: 'Sunday progress photo', sub: '09:00 · "Remember your progress photos"', icon: '📷' },
          { k: 'weekChange', l: 'Next week changes', sub: 'When training plan switches', icon: '📅' },
          { k: 'system', l: 'Other system messages', sub: 'Updates, tips', icon: '💬' },
        ].map((n, i, arr) => (
          <div key={n.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : 'none' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
              <span style={{ fontSize: 22 }}>{n.icon}</span>
              <div>
                <div style={{ fontSize: 14, color: t.text, fontWeight: 600 }}>{n.l}</div>
                <div style={{ fontSize: 11.5, color: t.muted, marginTop: 2 }}>{n.sub}</div>
              </div>
            </div>
            <Toggle on={notif[n.k]} onChange={v => setNotif(p => ({ ...p, [n.k]: v }))} />
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ═══════════════════════════ BOTTOM NAV ═══════════════════════════ */
function BottomNav({ tab, setTab }) {
  const tabs = [
    { k: 'home', l: 'Home', icon: 'home' },
    { k: 'nutrition', l: 'Nutrition', icon: 'nutrition', accent: 'green' },
    { k: 'workouts', l: 'Workouts', icon: 'workout', accent: 'orange' },
    { k: 'settings', l: 'Settings', icon: 'settings' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'rgba(11,11,14,0.92)', backdropFilter: 'blur(20px)',
      borderTop: `1px solid ${t.border}`,
      padding: '10px 6px 22px', display: 'flex', justifyContent: 'space-around',
    }}>
      {tabs.map(tb => {
        const active = tab === tb.k;
        const acc = tb.accent === 'orange' ? t.orange : tb.accent === 'green' ? t.green : t.text;
        return (
          <div key={tb.k} onClick={() => setTab(tb.k)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '6px 14px', borderRadius: 12, cursor: 'pointer',
            background: active && tb.accent ? (tb.accent === 'orange' ? t.orangeBg : t.greenBg) : 'transparent',
            transition: 'all 0.2s',
          }}>
            <Icon name={tb.icon} size={22} color={active ? acc : t.muted} stroke={active ? 2 : 1.6} />
            <div style={{ fontSize: 10, color: active ? acc : t.muted, fontWeight: 700, letterSpacing: '0.03em' }}>{tb.l}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════ MAIN APP ═══════════════════════════ */
export default function App() {
  const [phase, setPhase] = useState('loading'); // loading | config | auth | onboarding | main
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('home');
  const [showCheckIn, setShowCheckIn] = useState(false);

  // Load font + animations
  useEffect(() => {
    // Browser tab title + favicon (🔥 flame as SVG, no external file needed)
    document.title = 'Fitness app';
    let favicon = document.querySelector("link[rel='icon']");
    if (!favicon) { favicon = document.createElement('link'); favicon.rel = 'icon'; document.head.appendChild(favicon); }
    favicon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%94%A5%3C/text%3E%3C/svg%3E";

    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      @keyframes scanline { 0%, 100% { transform: translateY(-70px); opacity: 0.4 } 50% { transform: translateY(70px); opacity: 1 } }
      @keyframes spin { to { transform: rotate(360deg) } }
      @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
      ::-webkit-scrollbar { display: none }
      input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      input[type=number] { -moz-appearance: textfield; }
      button:disabled { cursor: not-allowed }
    `;
    document.head.appendChild(styleEl);
    return () => { try { document.head.removeChild(link); document.head.removeChild(styleEl); } catch(e) {} };
  }, []);

  // Session bootstrap + listener
  useEffect(() => {
    if (!isConfigured()) { setPhase('config'); return; }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setPhase('auth');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      if (!sess) { setProfile(null); setPhase('auth'); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load profile when session is available
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) console.error('Profile load error:', error);

      if (!data || !data.onboarded) {
        setProfile(data || null);
        setPhase('onboarding');
      } else {
        setProfile(data);
        setPhase('main');
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  const completeOnboarding = async (onboardingData) => {
    const update = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || (session.user.email?.split('@')[0]) || 'You',
      data: onboardingData,
      onboarded: true,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('profiles').upsert(update);
    if (error) { console.error(error); alert('Save failed: ' + error.message); return; }
    setProfile(update);
    setPhase('main');
  };

  const saveProfileData = async (patch) => {
    if (!session || !profile) return;
    const merged = { ...(profile.data || {}), ...patch };
    const { error } = await supabase
      .from('profiles')
      .update({ data: merged, updated_at: new Date().toISOString() })
      .eq('id', session.user.id);
    if (error) { console.error(error); return; }
    setProfile(p => ({ ...p, data: merged }));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setTab('home');
  };

  const phoneStyle = {
    width: '100%', maxWidth: 430, height: '100vh', maxHeight: 920,
    margin: '0 auto', background: t.bg, color: t.text,
    fontFamily: '"DM Sans", -apple-system, system-ui, sans-serif',
    position: 'relative', overflow: 'hidden',
    boxShadow: '0 0 80px rgba(0,0,0,0.5)',
    display: 'flex', flexDirection: 'column',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: `radial-gradient(circle at 20% 20%, rgba(34,197,94,0.06), transparent 50%), radial-gradient(circle at 80% 80%, rgba(249,115,22,0.06), transparent 50%)`,
    }}>
      <div style={phoneStyle}>
        <AppContext.Provider value={{ session, profile, signOut, saveProfileData }}>
          {phase === 'loading' && <LoadingScreen />}
          {phase === 'config' && <ConfigError />}
          {phase === 'auth' && <AuthFlow />}
          {phase === 'onboarding' && <Onboarding onComplete={completeOnboarding} />}
          {phase === 'main' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                {tab === 'home' && <Home onOpenCheckIn={() => setShowCheckIn(true)} />}
                {tab === 'nutrition' && <Nutrition />}
                {tab === 'workouts' && <Workouts />}
                {tab === 'settings' && <Settings />}
              </div>
              <BottomNav tab={tab} setTab={setTab} />
              <CheckIn visible={showCheckIn} onClose={() => setShowCheckIn(false)} />
            </>
          )}
        </AppContext.Provider>
      </div>
    </div>
  );
}
