import { useState } from "react";
import { t, useApp, useT, useLang } from './lib';
import { LANGUAGES } from './i18n';
import { Icon, Card, Label, Btn, Toggle, Modal, Field } from './shared';

/* ═══════════════════════════ SETTINGS ═══════════════════════════ */
export function Settings() {
  const T = useT();
  const { lang, setLang } = useLang();
  const { session, profile, signOut, saveProfileData, restartOnboarding } = useApp();
  const d = profile?.data || {};
  const [sub, setSub] = useState('main');
  const [macroMode, setMacroMode] = useState('auto');
  const [showConfirmAuto, setShowConfirmAuto] = useState(false);
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState('');
  const [notif, setNotif] = useState(d.notif || { weigh: true, checkin: true, photoSat: true, photoSun: false, weekChange: true, system: true });

  // Manual macro state — calorie target is FIXED by plan; user fills 2 of 3 macros, 3rd is auto.
  // `lockedFields` tracks which 2 the user explicitly set (most recent two).
  const planKcal = d.calories || 0;
  const [manual, setManual] = useState({ p: d.protein || 0, c: d.carbs || 0, f: d.fat || 0 });
  const [touched, setTouched] = useState([]); // order of last-touched fields, max 2

  // Compute the auto-fill macro = the one NOT in touched (or fallback to protein)
  const autoField = ['p', 'c', 'f'].find(k => !touched.includes(k)) || 'p';
  // Calculate the auto value so total kcal == planKcal
  const computedAuto = (() => {
    const other = touched.length === 2 ? touched : ['p', 'c'].filter(k => k !== autoField);
    const usedKcal = other.reduce((s, k) => s + (manual[k] || 0) * (k === 'f' ? 9 : 4), 0);
    const remaining = Math.max(0, planKcal - usedKcal);
    return Math.round(remaining / (autoField === 'f' ? 9 : 4));
  })();

  // Display macros: touched values stay literal, auto-field shows computed
  const displayMacros = {
    p: autoField === 'p' ? computedAuto : (manual.p || 0),
    c: autoField === 'c' ? computedAuto : (manual.c || 0),
    f: autoField === 'f' ? computedAuto : (manual.f || 0),
  };

  const touchField = (field, val) => {
    const intVal = parseInt(val) || 0;
    setManual(p => ({ ...p, [field]: intVal }));
    setTouched(prev => {
      const next = prev.filter(k => k !== field);
      next.push(field);
      return next.slice(-2); // keep only most recent 2
    });
  };

  const saveManual = async () => {
    await saveProfileData({
      protein: displayMacros.p,
      carbs: displayMacros.c,
      fat: displayMacros.f,
      manualOverride: true,
    });
    setShowSaveToast(T('set.macros.saved'));
    setTimeout(() => setShowSaveToast(''), 2000);
  };

  const returnToAuto = async () => {
    // Restore the snapshot taken at last onboarding
    const ap = d.autoPlan;
    if (ap && ap.calories) {
      await saveProfileData({
        calories: ap.calories,
        protein: ap.protein,
        carbs: ap.carbs,
        fat: ap.fat,
        manualOverride: false,
      });
      setManual({ p: ap.protein, c: ap.carbs, f: ap.fat });
      setTouched([]);
      setShowSaveToast(T('set.macros.autorestored'));
      setTimeout(() => setShowSaveToast(''), 2000);
    } else {
      // No snapshot → re-run onboarding
      restartOnboarding();
    }
    setShowConfirmAuto(false);
    setMacroMode('auto');
  };

  const startNewPlan = () => {
    restartOnboarding();
  };

  const macroMismatch = Math.abs((displayMacros.p * 4 + displayMacros.c * 4 + displayMacros.f * 9) - planKcal) > 25;

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

      {/* Current target display */}
      <Card style={{ padding: 18, marginTop: 14, background: t.greenBg, border: `1px solid ${t.greenBorder}` }}>
        <div style={{ fontSize: 11.5, color: t.green, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{T('set.macros.currenttarget')}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>{planKcal || '—'}</span>
          <span style={{ fontSize: 13, color: t.muted }}>kcal/{T('common.dayshort')}</span>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: t.soft }}>
          <span><b style={{ color: t.protein }}>{d.protein || 0}g</b> P</span>
          <span><b style={{ color: t.carbs }}>{d.carbs || 0}g</b> C</span>
          <span><b style={{ color: t.fat }}>{d.fat || 0}g</b> F</span>
          {d.manualOverride && <span style={{ marginLeft: 'auto', fontSize: 10, color: t.champagne }}>● {T('set.macros.manual')}</span>}
        </div>
      </Card>

      {/* 1. New plan — restart onboarding */}
      <Card onClick={startNewPlan} style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 3 }}>1. {T('set.macros.newplan')}</div>
            <div style={{ fontSize: 12.5, color: t.soft }}>{T('set.macros.newplan.sub')}</div>
          </div>
          <Icon name="chevR" size={16} color={t.muted} />
        </div>
      </Card>

      {/* 2. Adjust manually */}
      <Card style={{ padding: 16, border: macroMode === 'manual' ? `1px solid ${t.greenBorder}` : `1px solid ${t.border}` }}>
        <div onClick={() => setMacroMode(m => m === 'manual' ? 'auto' : 'manual')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: macroMode === 'manual' ? 16 : 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 3 }}>2. {T('set.macros.adjust')}</div>
            <div style={{ fontSize: 12.5, color: t.soft }}>{T('set.macros.adjust.sub')}</div>
          </div>
          {macroMode === 'manual' ? <Icon name="chevD" size={16} color={t.green} /> : <Icon name="chevR" size={16} color={t.muted} />}
        </div>

        {macroMode === 'manual' && (
          <div style={{ paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 12, color: t.muted, marginBottom: 12, lineHeight: 1.5 }}>
              {T('set.macros.adjust.body', { kcal: planKcal })}
            </div>

            {/* Each macro field shows "auto" badge when it's the computed one */}
            <Field
              label={`${T('macros.protein')} ${autoField === 'p' ? '· ' + T('set.macros.auto') : ''}`}
              value={displayMacros.p}
              onChange={v => touchField('p', v)}
              type="number" unit="g"
            />
            <Field
              label={`${T('macros.carbs')} ${autoField === 'c' ? '· ' + T('set.macros.auto') : ''}`}
              value={displayMacros.c}
              onChange={v => touchField('c', v)}
              type="number" unit="g"
            />
            <Field
              label={`${T('macros.fat')} ${autoField === 'f' ? '· ' + T('set.macros.auto') : ''}`}
              value={displayMacros.f}
              onChange={v => touchField('f', v)}
              type="number" unit="g"
            />

            <div style={{ fontSize: 11.5, color: t.muted, marginBottom: 10, lineHeight: 1.5 }}>
              {T('set.macros.adjust.hint')}
            </div>

            {macroMismatch && (
              <div style={{ background: 'rgba(245,214,112,0.1)', border: `1px solid rgba(245,214,112,0.3)`, borderRadius: 12, padding: 12, marginBottom: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Icon name="info" size={14} color="#F5D670" />
                <div style={{ fontSize: 12, color: '#F5D670', lineHeight: 1.5 }}>
                  {T('set.macros.mismatch', { total: displayMacros.p * 4 + displayMacros.c * 4 + displayMacros.f * 9, target: planKcal })}
                </div>
              </div>
            )}

            <Btn full onClick={saveManual}>{T('common.save')}</Btn>
          </div>
        )}
      </Card>

      {/* 3. Return to automatic */}
      <Card onClick={() => setShowConfirmAuto(true)} style={{ padding: 16, background: t.glass }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 3 }}>↻ {T('set.macros.auto.title')}</div>
            <div style={{ fontSize: 12, color: t.soft }}>{T('set.macros.auto.sub')}</div>
          </div>
          <Icon name="chevR" size={16} color={t.muted} />
        </div>
      </Card>

      <Modal visible={showConfirmAuto} onClose={() => setShowConfirmAuto(false)} title={T('set.macros.auto.title')}>
        <div style={{ fontSize: 14, color: t.soft, marginBottom: 18, lineHeight: 1.5 }}>
          {T('set.macros.auto.confirm')}
        </div>
        <Btn full style={{ marginBottom: 8 }} onClick={returnToAuto}>{T('common.yes')}</Btn>
        <Btn full variant="outline" onClick={() => setShowConfirmAuto(false)}>{T('common.cancel')}</Btn>
      </Modal>

      {showSaveToast && (
        <div style={{ position: 'fixed', bottom: 90, left: 16, right: 16, padding: 14, borderRadius: 14, background: t.green, color: '#0A0A0B', textAlign: 'center', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.45)', zIndex: 50 }}>
          {showSaveToast}
        </div>
      )}
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
