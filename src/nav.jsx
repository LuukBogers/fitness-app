import { t } from './lib';
import { Icon } from './shared';

/* ═══════════════════════════ BOTTOM NAV ═══════════════════════════ */
export function BottomNav({ tab, setTab }) {
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

