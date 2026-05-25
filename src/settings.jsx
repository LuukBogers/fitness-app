import { useState } from "react";
import { t, useApp, useT, useLang, WEEK } from './lib';
import { LANGUAGES } from './i18n';
import { Icon, Card, Label, Btn, Toggle, Modal, Field, Chip } from './shared';

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

  // --- per-page editable state, initialized from profile, updated on save ---
  const [notif, setNotif] = useState(d.notif || { weigh: true, checkin: true, photoSat: true, photoSun: false, weekChange: true, system: true });
  const [personal, setPersonal] = useState({
    gender: d.gender || '', age: d.age || '', height: d.height || '', weight: d.weight || '',
    activity: d.activity || '', strength: d.strength || '', cardio: d.cardio || '',
  });
  const [goalState, setGoalState] = useState({ goal: d.goal || '', goalDetail: d.goalDetail || '' });
  const [trainState, setTrainState] = useState({
    trainingStructure: d.trainingStructure || 'fixed',
    weekSchedule: d.weekSchedule || { Mon: 'Back', Tue: 'Chest', Wed: 'Rest', Thu: 'Legs', Fri: 'Rest', Sat: 'Upper', Sun: 'Rest' },
  });

  // --- MACROS: 2-of-3 logic, only auto-computes when user has touched 2 fields ---
  const planKcal = d.calories || 0;
  const [manual, setManual] = useState({ p: d.protein || 0, c: d.carbs || 0, f: d.fat || 0 });
  const [touched, setTouched] = useState([]); // last-touched fields, max 2

  // autoField = the un-touched field WHEN exactly 2 are touched. Otherwise null = no auto.
  const autoField = touched.length === 2 ? ['p','c','f'].find(k => !touched.includes(k)) : null;
  const computedAuto = (() => {
    if (!autoField) return 0;
    const other = ['p','c','f'].filter(k => k !== autoField);
    const usedKcal = other.reduce((s, k) => s + (manual[k] || 0) * (k === 'f' ? 9 : 4), 0);
    const remaining = Math.max(0, planKcal - usedKcal);
    return Math.round(remaining / (autoField === 'f' ? 9 : 4));
  })();

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
      return next.slice(-2);
    });
  };

  const flashToast = (msg) => { setShowSaveToast(msg); setTimeout(() => setShowSaveToast(''), 2000); };

  const saveManual = async () => {
    await saveProfileData({
      protein: displayMacros.p,
      carbs: displayMacros.c,
      fat: displayMacros.f,
      manualOverride: true,
    });
    flashToast(T('set.macros.saved'));
  };

  const returnToAuto = async () => {
    const ap = d.autoPlan;
    if (ap && ap.calories) {
      await saveProfileData({
        calories: ap.calories, protein: ap.protein, carbs: ap.carbs, fat: ap.fat,
        manualOverride: false,
      });
      setManual({ p: ap.protein, c: ap.carbs, f: ap.fat });
      setTouched([]);
      flashToast(T('set.macros.autorestored'));
    } else {
      restartOnboarding();
    }
    setShowConfirmAuto(false);
    setMacroMode('auto');
  };

  const startNewPlan = () => restartOnboarding();
  const macroMismatch = Math.abs((displayMacros.p * 4 + displayMacros.c * 4 + displayMacros.f * 9) - planKcal) > 25;

  // --- save handlers for the new sub-pages ---
  const savePersonal = async () => {
    await saveProfileData({
      gender: personal.gender, age: personal.age, height: personal.height, weight: personal.weight,
      activity: personal.activity, strength: personal.strength, cardio: personal.cardio,
    });
    flashToast(T('set.personal.saved'));
  };
  const saveGoal = async () => {
    if (!goalState.goal) return;
    await saveProfileData({ goal: goalState.goal, goalDetail: goalState.goal === 'Cutting' ? goalState.goalDetail : '' });
    flashToast(T('set.goal.saved'));
  };
  const saveTraining = async () => {
    await saveProfileData({ trainingStructure: trainState.trainingStructure, weekSchedule: trainState.weekSchedule });
    flashToast(T('set.training.saved'));
  };
  const saveNotif = async () => {
    await saveProfileData({ notif });
    flashToast(T('set.notif.saved'));
  };

  const userName = profile?.name || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'You';
  const userEmail = session?.user?.email || '';
  const userGoal = d.goal || '';
  const userGoalDetail = d.goalDetail || '';
  const userCalories = d.calories || 0;
  const currentLang = LANGUAGES.find(L => L.code === lang) || LANGUAGES[0];

  /* ─────────── MAIN ─────────── */
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
        { k: 'training', icon: 'workout', l: T('set.training'), sub: trainState.trainingStructure === 'fixed' ? T('set.training.sub') : T('onb.training.flexible'), accent: 'orange' },
        { k: 'macros', icon: 'flame', l: T('set.macros'), sub: userCalories ? `${userCalories} ${T('common.kcalday')}` : T('common.notset'), accent: 'green' },
        { k: 'notifications', icon: 'bell', l: T('set.notif'), sub: T('set.notif.sub', { enabled: Object.values(notif).filter(Boolean).length, total: Object.keys(notif).length }) },
        { k: 'language', icon: 'info', l: T('set.language'), sub: `${currentLang.flag} ${currentLang.name}` },
        { k: 'privacy', icon: 'shield', l: T('set.privacy'), sub: T('set.privacy.sub') },
      ].map(item => (
        <Card key={item.k} onClick={() => setSub(item.k)} style={{ padding: 14, cursor: 'pointer' }}>
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

      <Card onClick={() => setShowConfirmSignOut(true)} style={{ padding: 14, marginTop: 8, background: 'rgba(239,68,68,0.06)', border: `1px solid rgba(239,68,68,0.2)`, cursor: 'pointer' }}>
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
        <div style={{ fontSize: 14, color: t.soft, marginBottom: 18, lineHeight: 1.5 }}>{T('set.signout.body')}</div>
        <Btn full variant="danger" style={{ marginBottom: 8 }} onClick={() => { setShowConfirmSignOut(false); signOut(); }}>{T('set.signout.yes')}</Btn>
        <Btn full variant="outline" onClick={() => setShowConfirmSignOut(false)}>{T('common.cancel')}</Btn>
      </Modal>
      {showSaveToast && <SaveToast msg={showSaveToast} />}
    </div>
  );

  /* ─────────── BACK HEADER (shared) ─────────── */
  const Back = ({ title }) => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }} onClick={() => setSub('main')}>
        <Icon name="chevL" size={20} color={t.soft} />
        <Label style={{ marginBottom: 0 }}>{T('set.backtosettings')}</Label>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 18, letterSpacing: '-0.02em' }}>{title}</div>
    </>
  );

  /* ─────────── PERSONAL DATA ─────────── */
  if (sub === 'personal') return (
    <div style={{ padding: '20px 16px 100px' }}>
      <Back title={T('set.personal')} />

      <Label>{T('onb.gender')}</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[['male', T('onb.gender.male')], ['female', T('onb.gender.female')]].map(([gv, gl]) => (
          <div key={gv} onClick={() => setPersonal(p => ({ ...p, gender: gv }))} style={{
            padding: 14, textAlign: 'center', borderRadius: 12,
            background: personal.gender === gv ? t.greenBg : t.card2,
            color: personal.gender === gv ? t.green : t.text, fontWeight: 600, fontSize: 14,
            border: `1px solid ${personal.gender === gv ? t.green : t.border}`, cursor: 'pointer',
          }}>{gl}</div>
        ))}
      </div>

      <Field label={T('onb.age')} value={personal.age} onChange={v => setPersonal(p => ({ ...p, age: v }))} type="number" unit={T('onb.unit.years')} />
      <Field label={T('onb.height')} value={personal.height} onChange={v => setPersonal(p => ({ ...p, height: v }))} type="number" unit="cm" />
      <Field label={T('onb.weight')} value={personal.weight} onChange={v => setPersonal(p => ({ ...p, weight: v }))} type="number" unit="kg" />

      <Label style={{ marginTop: 10 }}>{T('onb.activity')}</Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {[['Low', T('onb.activity.low')], ['Average', T('onb.activity.average')], ['High', T('onb.activity.high')], ['Very high', T('onb.activity.veryhigh')]].map(([v, l]) => (
          <Chip key={v} active={personal.activity === v} onClick={() => setPersonal(p => ({ ...p, activity: v }))}>{l}</Chip>
        ))}
      </div>

      <Label>{T('onb.strength')}</Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {['0–1', '1–2', '3–4', '5–6'].map(opt => (
          <Chip key={opt} active={personal.strength === opt} onClick={() => setPersonal(p => ({ ...p, strength: opt }))} accent="orange">{opt}</Chip>
        ))}
      </div>

      <Label>{T('onb.cardio')}</Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {[['None', T('onb.cardio.none')], ['Light', T('onb.cardio.light')], ['Average', T('onb.cardio.average')], ['High', T('onb.cardio.high')]].map(([v, l]) => (
          <Chip key={v} active={personal.cardio === v} onClick={() => setPersonal(p => ({ ...p, cardio: v }))} accent="orange">{l}</Chip>
        ))}
      </div>

      <Btn full onClick={savePersonal}>{T('common.save')}</Btn>
      {showSaveToast && <SaveToast msg={showSaveToast} />}
    </div>
  );

  /* ─────────── GOAL ─────────── */
  if (sub === 'goal') return (
    <div style={{ padding: '20px 16px 100px' }}>
      <Back title={T('set.goal')} />

      {[
        { v: 'Cutting',     l: T('onb.goal.cutting'),  sub: T('onb.goal.cutting.sub') },
        { v: 'Fat loss',    l: T('onb.goal.fatloss'),  sub: T('onb.goal.fatloss.sub') },
        { v: 'Maintenance', l: T('onb.goal.maint'),    sub: T('onb.goal.maint.sub') },
        { v: 'Lean bulk',   l: T('onb.goal.leanbulk'), sub: T('onb.goal.leanbulk.sub') },
        { v: 'Bulk',        l: T('onb.goal.bulk'),     sub: T('onb.goal.bulk.sub') },
      ].map(opt => (
        <div key={opt.v} onClick={() => setGoalState(s => ({ ...s, goal: opt.v }))} style={{
          padding: 16, borderRadius: 14, cursor: 'pointer', marginBottom: 10,
          background: goalState.goal === opt.v ? t.greenBg : t.card2,
          border: `1px solid ${goalState.goal === opt.v ? t.green : t.border}`,
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: goalState.goal === opt.v ? t.green : t.text, marginBottom: 3 }}>{opt.l}</div>
          <div style={{ fontSize: 12.5, color: t.soft }}>{opt.sub}</div>
        </div>
      ))}

      {goalState.goal === 'Cutting' && (
        <>
          <Label style={{ marginTop: 16 }}>{T('onb.cut.title')}</Label>
          {[
            { v: 'Cut → Reverse → Build',  l: T('onb.cut.full'),   sub: T('onb.cut.full.sub') },
            { v: 'Cut only',               l: T('onb.cut.only'),   sub: T('onb.cut.only.sub') },
            { v: 'Mini cut',               l: T('onb.cut.mini'),   sub: T('onb.cut.mini.sub') },
            { v: 'Recomp / maintenance',   l: T('onb.cut.recomp'), sub: T('onb.cut.recomp.sub') },
          ].map(opt => (
            <div key={opt.v} onClick={() => setGoalState(s => ({ ...s, goalDetail: opt.v }))} style={{
              padding: 14, borderRadius: 12, cursor: 'pointer', marginBottom: 8,
              background: goalState.goalDetail === opt.v ? t.greenBg : t.card2,
              border: `1px solid ${goalState.goalDetail === opt.v ? t.green : t.border}`,
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: goalState.goalDetail === opt.v ? t.green : t.text, marginBottom: 2 }}>{opt.l}</div>
              <div style={{ fontSize: 12, color: t.soft }}>{opt.sub}</div>
            </div>
          ))}
        </>
      )}

      <Btn full style={{ marginTop: 18, opacity: goalState.goal ? 1 : 0.5 }} onClick={saveGoal}>{T('common.save')}</Btn>
      {showSaveToast && <SaveToast msg={showSaveToast} />}
    </div>
  );

  /* ─────────── TRAINING / REST STRUCTURE ─────────── */
  if (sub === 'training') {
    const WORKOUT_OPTS = [
      { v: 'Rest',   l: T('common.rest') },
      { v: 'Back',   l: T('set.wo.back') },
      { v: 'Chest',  l: T('set.wo.chest') },
      { v: 'Legs',   l: T('set.wo.legs') },
      { v: 'Upper',  l: T('set.wo.upper') },
      { v: 'Cardio', l: T('set.wo.cardio') },
    ];
    const setDay = (day, value) => setTrainState(s => ({ ...s, weekSchedule: { ...s.weekSchedule, [day]: value } }));

    return (
      <div style={{ padding: '20px 16px 100px' }}>
        <Back title={T('set.training')} />

        {[
          { v: 'fixed',    l: T('onb.training.fixed'),    sub: T('onb.training.fixed.sub') },
          { v: 'flexible', l: T('onb.training.flexible'), sub: T('onb.training.flexible.sub') },
        ].map(o => (
          <div key={o.v} onClick={() => setTrainState(s => ({ ...s, trainingStructure: o.v }))} style={{
            padding: 16, borderRadius: 14, cursor: 'pointer', marginBottom: 10,
            background: trainState.trainingStructure === o.v ? t.greenBg : t.card2,
            border: `1px solid ${trainState.trainingStructure === o.v ? t.green : t.border}`,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: trainState.trainingStructure === o.v ? t.green : t.text, marginBottom: 3 }}>{o.l}</div>
            <div style={{ fontSize: 12.5, color: t.soft, lineHeight: 1.5 }}>{o.sub}</div>
          </div>
        ))}

        {trainState.trainingStructure === 'fixed' && (
          <div style={{ marginTop: 12, padding: 14, background: t.card2, borderRadius: 14, border: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 11, color: t.muted, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>{T('set.training.weekschedule')}</div>
            {WEEK.map((day, idx) => {
              const dayKey = `onb.day.${day}`;
              const currentVal = trainState.weekSchedule[day] || 'Rest';
              return (
                <div key={day} style={{ paddingBottom: idx < WEEK.length - 1 ? 12 : 0, marginBottom: idx < WEEK.length - 1 ? 12 : 0, borderBottom: idx < WEEK.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 6 }}>{T(dayKey)}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {WORKOUT_OPTS.map(opt => (
                      <Chip key={opt.v} active={currentVal === opt.v} onClick={() => setDay(day, opt.v)} accent={opt.v === 'Rest' ? undefined : 'orange'}>{opt.l}</Chip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Btn full style={{ marginTop: 18 }} onClick={saveTraining}>{T('common.save')}</Btn>
        {showSaveToast && <SaveToast msg={showSaveToast} />}
      </div>
    );
  }

  /* ─────────── LANGUAGE PICKER ─────────── */
  if (sub === 'language') return (
    <div style={{ padding: '20px 16px 100px' }}>
      <Back title={T('set.language')} />
      <div style={{ fontSize: 13, color: t.soft, marginBottom: 22, marginTop: -10 }}>{T('lang.sub')}</div>

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
      <Back title={T('set.macros')} />

      <Card style={{ padding: 18, background: t.greenBg, border: `1px solid ${t.greenBorder}` }}>
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

      <Card onClick={startNewPlan} style={{ padding: 16, cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 3 }}>1. {T('set.macros.newplan')}</div>
            <div style={{ fontSize: 12.5, color: t.soft }}>{T('set.macros.newplan.sub')}</div>
          </div>
          <Icon name="chevR" size={16} color={t.muted} />
        </div>
      </Card>

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
              {touched.length < 2 ? T('set.macros.hint.touch2') : T('set.macros.adjust.hint')}
            </div>

            {touched.length > 0 && macroMismatch && (
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

      <Card onClick={() => setShowConfirmAuto(true)} style={{ padding: 16, background: t.glass, cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 3 }}>↻ {T('set.macros.auto.title')}</div>
            <div style={{ fontSize: 12, color: t.soft }}>{T('set.macros.auto.sub')}</div>
          </div>
          <Icon name="chevR" size={16} color={t.muted} />
        </div>
      </Card>

      <Modal visible={showConfirmAuto} onClose={() => setShowConfirmAuto(false)} title={T('set.macros.auto.title')}>
        <div style={{ fontSize: 14, color: t.soft, marginBottom: 18, lineHeight: 1.5 }}>{T('set.macros.auto.confirm')}</div>
        <Btn full style={{ marginBottom: 8 }} onClick={returnToAuto}>{T('common.yes')}</Btn>
        <Btn full variant="outline" onClick={() => setShowConfirmAuto(false)}>{T('common.cancel')}</Btn>
      </Modal>

      {showSaveToast && <SaveToast msg={showSaveToast} />}
    </div>
  );

  /* ─────────── NOTIFICATIONS ─────────── */
  if (sub === 'notifications') return (
    <div style={{ padding: '20px 16px 100px' }}>
      <Back title={T('set.notif')} />

      <Card>
        {[
          { k: 'weigh',      l: T('onb.notif.weigh'),    sub: '08:00', icon: '⚖️' },
          { k: 'checkin',    l: T('onb.notif.checkin'),  sub: '21:00', icon: '✅' },
          { k: 'photoSat',   l: T('onb.notif.photoSat'), sub: '20:00', icon: '📷' },
          { k: 'photoSun',   l: T('onb.notif.photoSun'), sub: '09:00', icon: '📷' },
          { k: 'weekChange', l: T('set.notif.weekchange'), sub: T('set.notif.weekchange.sub'), icon: '📅' },
          { k: 'system',     l: T('set.notif.system'),     sub: T('set.notif.system.sub'),     icon: '💬' },
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

      <Btn full style={{ marginTop: 18 }} onClick={saveNotif}>{T('common.save')}</Btn>
      {showSaveToast && <SaveToast msg={showSaveToast} />}
    </div>
  );

  /* ─────────── PRIVACY ─────────── */
  if (sub === 'privacy') return (
    <div style={{ padding: '20px 16px 100px' }}>
      <Back title={T('set.privacy')} />

      <div style={{ fontSize: 14, color: t.soft, lineHeight: 1.6, marginBottom: 18 }}>{T('set.privacy.intro')}</div>

      <Card style={{ padding: 16, marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 6 }}>{T('set.privacy.what.title')}</div>
        <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.6 }}>{T('set.privacy.what.body')}</div>
      </Card>

      <Card style={{ padding: 16, marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 6 }}>{T('set.privacy.share.title')}</div>
        <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.6 }}>{T('set.privacy.share.body')}</div>
      </Card>

      <Card style={{ padding: 16, marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 6 }}>{T('set.privacy.photos.title')}</div>
        <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.6 }}>{T('set.privacy.photos.body')}</div>
      </Card>

      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 6 }}>{T('set.privacy.delete.title')}</div>
        <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.6 }}>{T('set.privacy.delete.body')}</div>
      </Card>
    </div>
  );

  return null;
}

/* ─────────── Save toast (shared) ─────────── */
function SaveToast({ msg }) {
  return (
    <div style={{ position: 'fixed', bottom: 90, left: 16, right: 16, padding: 14, borderRadius: 14, background: t.green, color: '#0A0A0B', textAlign: 'center', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.45)', zIndex: 50 }}>
      {msg}
    </div>
  );
}
