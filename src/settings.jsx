import { useState } from "react";
import { t, useApp, useT, useLang } from './lib';
import { LANGUAGES } from './i18n';
import { Icon, Card, Label, Btn, Toggle, Modal, Field } from './shared';

/* ═══════════════════════════ SETTINGS ═══════════════════════════ */
export function Settings() {
  const T = useT();
  const { lang, setLang } = useLang();
  const { session, profile, signOut } = useApp();
  const d = profile?.data || {};
  const [sub, setSub] = useState('main');
  const [macroMode, setMacroMode] = useState('auto');
  const [showConfirmAuto, setShowConfirmAuto] = useState(false);
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);
  const [notif, setNotif] = useState(d.notif || { weigh: true, checkin: true, photoSat: true, photoSun: false, weekChange: true, system: true });
  const [manual, setManual] = useState({ cal: d.calories || 0, p: d.protein || 0, c: d.carbs || 0, f: d.fat || 0 });
  const manualKcal = manual.p * 4 + manual.c * 4 + manual.f * 9;
  const macroMismatch = Math.abs(manualKcal - manual.cal) > 25;

  const userName = profile?.name || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'You';
  const userEmail = session?.user?.email || '';
  const userGoal = d.goal || '';
  const userGoalDetail = d.goalDetail || '';
  const userCalories = d.calories || 0;
  const currentLang = LANGUAGES.find(L => L.code === lang) || LANGUAGES[0];

  if (sub === 'main') return (
    <div style={{ padding: '20px 16px 100px' }}>
      <Label>{T('set.title')}</Label>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 20, letterSpacing: '-0.02em' }}>{T('set.account')}</div>

      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${t.green}, ${t.orange})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A0A0B', fontWeight: 800, fontSize: 20 }}>{(userName[0] || 'U').toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
            <div style={{ fontSize: 12, color: t.soft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
          </div>
        </div>
      </Card>

      {[
        { k: 'personal', icon: 'user', l: T('set.personal'), sub: T('set.personal.sub') },
        { k: 'goal', icon: 'target', l: T('set.goal'), sub: userGoal ? `${userGoal}${userGoalDetail ? ' · ' + userGoalDetail : ''}` : T('common.notset') },
        { k: 'training', icon: 'workout', l: T('set.training'), sub: T('set.training.sub'), accent: 'orange' },
        { k: 'macros', icon: 'flame', l: T('set.macros'), sub: userCalories ? `${userCalories} ${T('common.kcalday')}` : T('common.notset'), accent: 'green' },
        { k: 'notifications', icon: 'bell', l: T('set.notif'), sub: T('set.notif.sub', { enabled: Object.values(notif).filter(Boolean).length, total: Object.keys(notif).length }) },
        { k: 'language', icon: 'info', l: T('set.language'), sub: `${currentLang.flag} ${currentLang.name}` },
        { k: 'privacy', icon: 'shield', l: T('set.privacy'), sub: T('set.privacy.sub') },
      ].map(item => (
        <Card key={item.k} onClick={() => (item.k === 'macros' || item.k === 'notifications' || item.k === 'language') && setSub(item.k)} style={{ padding: 14 }}>
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
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F87171' }}>{T('set.signout')}</div>
            <div style={{ fontSize: 11.5, color: t.muted }}>{T('set.signout.sub')}</div>
          </div>
          <Icon name="chevR" size={15} color="#F87171" />
        </div>
      </Card>

      <div style={{ marginTop: 20, fontSize: 11, color: t.muted, textAlign: 'center' }}>v0.2 · Built for coaching</div>

      <Modal visible={showConfirmSignOut} onClose={() => setShowConfirmSignOut(false)} title={T('set.signout.confirm')}>
        <div style={{ fontSize: 14, color: t.soft, marginBottom: 18, lineHeight: 1.5 }}>
          {T('set.signout.body')}
        </div>
        <Btn full variant="danger" style={{ marginBottom: 8 }} onClick={() => { setShowConfirmSignOut(false); signOut(); }}>{T('set.signout.yes')}</Btn>
        <Btn full variant="outline" onClick={() => setShowConfirmSignOut(false)}>{T('common.cancel')}</Btn>
      </Modal>
    </div>
  );

  /* ─────────── LANGUAGE PICKER ─────────── */
  if (sub === 'language') return (
    <div style={{ padding: '20px 16px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }} onClick={() => setSub('main')}>
        <Icon name="chevL" size={20} color={t.soft} />
        <Label style={{ marginBottom: 0 }}>{T('set.backtosettings')}</Label>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>{T('set.language')}</div>
      <div style={{ fontSize: 13, color: t.soft, marginBottom: 22 }}>{T('lang.sub')}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {LANGUAGES.map(L => (
          <div key={L.code} onClick={() => setLang(L.code)} style={{
            padding: 16, borderRadius: 14, cursor: 'pointer',
            background: lang === L.code ? t.greenBg : t.card2,
            border: `1px solid ${lang === L.code ? t.green : t.border}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 24 }}>{L.flag}</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: lang === L.code ? t.green : t.text }}>{L.name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─────────── MACROS ─────────── */
  if (sub === 'macros') return (
    <div style={{ padding: '20px 16px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }} onClick={() => setSub('main')}>
        <Icon name="chevL" size={20} color={t.soft} />
        <Label style={{ marginBottom: 0 }}>{T('set.backtosettings')}</Label>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>{T('set.macros')}</div>

      <Card onClick={() => setMacroMode('new')} style={{ padding: 16, marginTop: 14 }}>
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
              <Field label={T('macros.protein')} value={manual.p} onChange={v => setManual(p => ({ ...p, p: parseInt(v) || 0 }))} type="number" unit="g" />
              <Field label={T('macros.carbs')} value={manual.c} onChange={v => setManual(p => ({ ...p, c: parseInt(v) || 0 }))} type="number" unit="g" />
              <Field label={T('macros.fat')} value={manual.f} onChange={v => setManual(p => ({ ...p, f: parseInt(v) || 0 }))} type="number" unit="g" />

              {macroMismatch && (
                <div style={{ background: 'rgba(250,204,21,0.1)', border: `1px solid rgba(250,204,21,0.3)`, borderRadius: 12, padding: 12, marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Icon name="info" size={14} color="#FACC15" />
                  <div style={{ fontSize: 12, color: '#FDE047', lineHeight: 1.5 }}>
                    Macros total <strong>{manualKcal} kcal</strong> vs target <strong>{manual.cal} kcal</strong>.
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
          This will recalculate from your current settings. Manual values replaced.
        </div>
        <Btn full style={{ marginBottom: 8 }} onClick={() => { setMacroMode('auto'); setShowConfirmAuto(false); }}>{T('common.yes')}</Btn>
        <Btn full variant="outline" onClick={() => setShowConfirmAuto(false)}>{T('common.cancel')}</Btn>
      </Modal>
    </div>
  );

  /* ─────────── NOTIFICATIONS ─────────── */
  if (sub === 'notifications') return (
    <div style={{ padding: '20px 16px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }} onClick={() => setSub('main')}>
        <Icon name="chevL" size={20} color={t.soft} />
        <Label style={{ marginBottom: 0 }}>{T('set.backtosettings')}</Label>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 24, letterSpacing: '-0.02em' }}>{T('set.notif')}</div>

      <Card>
        {[
          { k: 'weigh',      l: T('onb.notif.weigh'),    sub: '08:00', icon: '⚖️' },
          { k: 'checkin',    l: T('onb.notif.checkin'),  sub: '21:00', icon: '✅' },
          { k: 'photoSat',   l: T('onb.notif.photoSat'), sub: '20:00', icon: '📷' },
          { k: 'photoSun',   l: T('onb.notif.photoSun'), sub: '09:00', icon: '📷' },
          { k: 'weekChange', l: 'Week change',           sub: 'Training plan switches', icon: '📅' },
          { k: 'system',     l: 'System messages',       sub: 'Updates, tips', icon: '💬' },
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
