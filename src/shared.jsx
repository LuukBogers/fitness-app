import { t, useT } from './lib';

/* ═══════════════════════════ ICONS (inline SVG) ═══════════════════════════ */
export const Icon = ({ name, size = 20, color = 'currentColor', stroke = 1.8 }) => {
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
export const Card = ({ children, style, onClick, glow }) => (
  <div onClick={onClick} style={{
    background: t.card, borderRadius: 20, padding: 18, marginBottom: 12,
    border: `1px solid ${t.border}`, cursor: onClick ? 'pointer' : 'default',
    boxShadow: glow || 'none', transition: 'all 0.2s', ...style,
  }}>{children}</div>
);

export const Label = ({ children, color, style }) => (
  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: color || t.muted, marginBottom: 8, ...style }}>{children}</div>
);

export const Btn = ({ children, onClick, variant = 'primary', accent = 'green', full, small, style }) => {
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

export const Toggle = ({ on, onChange, accent = 'green' }) => {
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

export const Ring = ({ value, max, color, label, size = 64 }) => {
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

export const Modal = ({ visible, onClose, title, children, accent = 'green' }) => {
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

export const ProgressBar = ({ value, max, color, height = 8 }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ background: t.card3, borderRadius: height/2, height, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: height/2, transition: 'width 0.5s ease-out' }} />
    </div>
  );
};

export const ScaleInput = ({ value, onChange, accent = 'green' }) => {
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

export const YesNo = ({ value, onChange, accent = 'green' }) => {
  const T = useT();
  const acc = accent === 'orange' ? t.orange : t.green;
  const opts = [{ v: 'Yes', l: T('common.yes') }, { v: 'No', l: T('common.no') }];
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {opts.map(opt => (
        <div key={opt.v} onClick={() => onChange(opt.v)} style={{
          flex: 1, padding: '12px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
          background: value === opt.v ? acc : t.card2,
          color: value === opt.v ? '#0A0A0B' : t.soft,
          fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
          border: `1px solid ${value === opt.v ? acc : t.border}`,
        }}>{opt.l}</div>
      ))}
    </div>
  );
};

export const Chip = ({ children, active, onClick, accent = 'green' }) => {
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

export const Field = ({ label, value, onChange, type = 'text', placeholder, unit }) => (
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

export const Select = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 12, color: t.soft, fontWeight: 600, marginBottom: 6 }}>{label}</div>
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: '100%', padding: '13px 14px', borderRadius: 12,
      border: `1px solid ${t.border}`, fontSize: 15, fontFamily: 'inherit',
      color: t.text, background: t.card2, boxSizing: 'border-box', outline: 'none',
      appearance: 'none', backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1.5L6 6.5L11 1.5' stroke='%2371717A' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>")`,
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36,
    }}>
      {options.map(opt => (
        typeof opt === 'string'
          ? <option key={opt} value={opt}>{opt}</option>
          : <option key={opt.v} value={opt.v}>{opt.l}</option>
      ))}
    </select>
  </div>
);
