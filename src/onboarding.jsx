import { useState } from "react";
import { t, useT, useLang, WEEK } from './lib';
import { LANGUAGES } from './i18n';
import { Icon, Label, Btn, Toggle, Chip, Field } from './shared';

/* ═══════════════════════════ ONBOARDING ═══════════════════════════ */
export function Onboarding({ onComplete }) {
  const T = useT();
  const { lang, setLang } = useLang();
  // Step map (8 + language):
  //  0 = language
  //  1 = personal (gender, age, h, w, activity, strength, cardio)
  //  2 = main goal
  //  3 = cut deepening (skipped if not Cutting)
  //  4 = numbers (BMR + maint + target + macros)
  //  5 = macro structure (same vs split)
  //  6 = training structure (fixed weekly schedule vs flexible)
  //  7 = daily check-in explainer
  //  8 = privacy / progress photos
  const [step, setStep] = useState(0);
  const [d, setD] = useState({
    gender: '', age: '', height: '', weight: '',
    activity: '', strength: '', cardio: '',
    goal: '', goalDetail: '', macroStructure: '',
    trainingStructure: 'fixed', // default to recommended
    weekSchedule: { Mon: 'Back', Tue: 'Chest', Wed: 'Rest', Thu: 'Legs', Fri: 'Rest', Sat: 'Upper', Sun: 'Rest' },
    notif: { weigh: true, checkin: true, photoSat: true, photoSun: true },
  });
  const up = (k, v) => setD(p => ({ ...p, [k]: v }));

  // Calculations — Mifflin-St Jeor with NEW activity multipliers + 5-goal deficit/surplus
  const age = parseInt(d.age) || 0;
  const h = parseInt(d.height) || 0;
  const w = parseFloat(d.weight) || 0;
  const hasData = !!(age && h && w);
  const bmr = !hasData ? 0 : (d.gender === 'female'
    ? Math.round(10 * w + 6.25 * h - 5 * age - 161)
    : Math.round(10 * w + 6.25 * h - 5 * age + 5));
  const mult = { Low: 1.4, Average: 1.55, High: 1.7, 'Very high': 1.8 }[d.activity] || 1.55;
  const maint = Math.round(bmr * mult);
  const deficit = d.goal === 'Cutting' ? -500
                : d.goal === 'Fat loss' ? -300
                : d.goal === 'Lean bulk' ? +200
                : d.goal === 'Bulk' ? +500
                : 0;
  const startCal = Math.max(1200, maint + deficit);
  const proteinG = Math.round(w * (d.goalDetail === 'Mini cut' ? 2.5 : d.goal === 'Cutting' ? 2.4 : 2.2));
  const fatG = Math.round(w * 0.7);
  const carbG = Math.max(0, Math.round((startCal - proteinG * 4 - fatG * 9) / 4));

  const showCutStep = d.goal === 'Cutting';
  const TOTAL = 9; // 0..8

  const next = () => {
    // Skip cut deepening if not Cutting
    if (step === 2 && !showCutStep) { setStep(4); return; }
    if (step === 8) { onComplete(d); return; }
    setStep(s => s + 1);
  };
  const back = () => {
    if (step === 4 && !showCutStep) { setStep(2); return; }
    if (step > 0) setStep(s => s - 1);
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>{T('lang.title')}</div>
          <div style={{ fontSize: 14, color: t.soft, marginBottom: 24, lineHeight: 1.5 }}>{T('lang.sub')}</div>
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

      case 1: return (
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>{T('onb.personal.title')}</div>
          <div style={{ fontSize: 14, color: t.soft, marginBottom: 24, lineHeight: 1.5 }}>{T('onb.personal.sub')}</div>

          <Label>{T('onb.gender')}</Label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {[['male', T('onb.gender.male')], ['female', T('onb.gender.female')]].map(([gv, gl]) => (
              <div key={gv} onClick={() => up('gender', gv)} style={{
                flex: 1, padding: '14px', borderRadius: 14, textAlign: 'center', cursor: 'pointer',
                background: d.gender === gv ? t.greenBg : t.card2,
                color: d.gender === gv ? t.green : t.text, fontWeight: 600, fontSize: 15,
                border: `1px solid ${d.gender === gv ? t.green : t.border}`,
              }}>{gl}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label={T('onb.age')} value={d.age} onChange={v => up('age', v)} type="number" placeholder="28" unit="yr" />
            <Field label={T('onb.height')} value={d.height} onChange={v => up('height', v)} type="number" placeholder="181" unit="cm" />
          </div>
          <Field label={T('onb.weight')} value={d.weight} onChange={v => up('weight', v)} type="number" placeholder="82.3" unit="kg" />

          <Label style={{ marginTop: 10 }}>{T('onb.activity')}</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {[['Low', T('onb.activity.low')], ['Average', T('onb.activity.average')], ['High', T('onb.activity.high')], ['Very high', T('onb.activity.veryhigh')]].map(([v, l]) => (
              <Chip key={v} active={d.activity === v} onClick={() => up('activity', v)}>
                <div style={{ padding: '4px 0' }}>{l}</div>
              </Chip>
            ))}
          </div>

          <Label>{T('onb.strength')}</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
            {['0–1','1–2','3–4','5–6'].map(opt => (
              <Chip key={opt} active={d.strength === opt} onClick={() => up('strength', opt)} accent="orange">
                <div style={{ padding: '4px 0', textAlign: 'center' }}>{opt}</div>
              </Chip>
            ))}
          </div>

          <Label>{T('onb.cardio')}</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {[['None', T('onb.cardio.none')], ['Light', T('onb.cardio.light')], ['Average', T('onb.cardio.average')], ['High', T('onb.cardio.high')]].map(([v, l]) => (
              <Chip key={v} active={d.cardio === v} onClick={() => up('cardio', v)} accent="orange">
                <div style={{ padding: '4px 0', textAlign: 'center' }}>{l}</div>
              </Chip>
            ))}
          </div>
        </div>
      );

      case 2: return (
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>{T('onb.goal.title')}</div>
          <div style={{ fontSize: 14, color: t.soft, marginBottom: 24, lineHeight: 1.5 }}>{T('onb.goal.sub')}</div>

          {[
            { v: 'Cutting',     emoji: '🔥', l: T('onb.goal.cutting'),  sub: T('onb.goal.cutting.sub') },
            { v: 'Fat loss',    emoji: '📉', l: T('onb.goal.fatloss'),  sub: T('onb.goal.fatloss.sub') },
            { v: 'Maintenance', emoji: '⚖️', l: T('onb.goal.maint'),    sub: T('onb.goal.maint.sub') },
            { v: 'Lean bulk',   emoji: '📈', l: T('onb.goal.leanbulk'), sub: T('onb.goal.leanbulk.sub') },
            { v: 'Bulk',        emoji: '💪', l: T('onb.goal.bulk'),     sub: T('onb.goal.bulk.sub') },
          ].map(opt => (
            <div key={opt.v} onClick={() => up('goal', opt.v)} style={{
              padding: 18, borderRadius: 16, cursor: 'pointer', marginBottom: 10,
              background: d.goal === opt.v ? t.greenBg : t.card2,
              border: `1px solid ${d.goal === opt.v ? t.green : t.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                <span style={{ fontSize: 18 }}>{opt.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: d.goal === opt.v ? t.green : t.text }}>{opt.l}</span>
              </div>
              <div style={{ fontSize: 13, color: t.soft, marginLeft: 28 }}>{opt.sub}</div>
            </div>
          ))}
        </div>
      );

      case 3: return showCutStep ? (
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>{T('onb.cut.title')}</div>
          <div style={{ fontSize: 14, color: t.soft, marginBottom: 24, lineHeight: 1.5 }}>{T('onb.cut.sub')}</div>

          {[
            { v: 'Cut → Reverse → Build', l: T('onb.cut.full'),   sub: T('onb.cut.full.sub') },
            { v: 'Cut only',              l: T('onb.cut.only'),   sub: T('onb.cut.only.sub') },
            { v: 'Mini cut',              l: T('onb.cut.mini'),   sub: T('onb.cut.mini.sub') },
            { v: 'Recomp / maintenance',  l: T('onb.cut.recomp'), sub: T('onb.cut.recomp.sub') },
          ].map(opt => (
            <div key={opt.v} onClick={() => up('goalDetail', opt.v)} style={{
              padding: 16, borderRadius: 16, cursor: 'pointer', marginBottom: 10,
              background: d.goalDetail === opt.v ? t.greenBg : t.card2,
              border: `1px solid ${d.goalDetail === opt.v ? t.green : t.border}`,
            }}>
              <div style={{ fontWeight: 700, color: d.goalDetail === opt.v ? t.green : t.text, marginBottom: 4 }}>{opt.l}</div>
              <div style={{ fontSize: 13, color: t.soft }}>{opt.sub}</div>
            </div>
          ))}
        </div>
      ) : null;

      case 4: return (
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>{T('onb.numbers.title')}</div>
          <div style={{ fontSize: 14, color: t.soft, marginBottom: 24, lineHeight: 1.5 }}>{T('onb.numbers.sub')}</div>

          <div style={{ background: t.card2, borderRadius: 18, padding: 18, border: `1px solid ${t.border}`, marginBottom: 14 }}>
            {[
              { l: T('onb.bmr'),       v: `${bmr} kcal` },
              { l: T('onb.maintkcal'), v: `${maint} kcal` },
              { l: T('onb.strategy'),  v: d.goalDetail || d.goal || '—' },
            ].map((r, i) => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 2 ? `1px solid ${t.border}` : 'none' }}>
                <div style={{ fontSize: 13, color: t.soft }}>{r.l}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{r.v}</div>
              </div>
            ))}
          </div>

          <div style={{ background: t.greenBg, borderRadius: 18, padding: 18, border: `1px solid ${t.greenBorder}`, marginBottom: 14 }}>
            <Label color={t.green}>{T('onb.startcal')}</Label>
            <div style={{ fontSize: 32, fontWeight: 800, color: t.green, letterSpacing: '-0.02em' }}>{startCal}<span style={{ fontSize: 16, color: t.soft, fontWeight: 500, marginLeft: 6 }}> {T('common.kcalday')}</span></div>
          </div>

          <Label>{T('onb.startmacros')}</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[[T('macros.protein'), proteinG, t.protein], [T('macros.carbs'), carbG, t.carbs], [T('macros.fat'), fatG, t.fat]].map(([n, v, c]) => (
              <div key={n} style={{ background: t.card2, borderRadius: 14, padding: 14, textAlign: 'center', border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: c, letterSpacing: '-0.02em' }}>{v}g</div>
                <div style={{ fontSize: 11, color: t.muted, fontWeight: 600, marginTop: 2 }}>{n}</div>
              </div>
            ))}
          </div>
        </div>
      );

      case 5: return (
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>{T('onb.macrostr.title')}</div>
          <div style={{ fontSize: 14, color: t.soft, marginBottom: 24, lineHeight: 1.5 }}>{T('onb.macrostr.sub')}</div>

          {[
            { v: 'same',  l: T('onb.macrostr.same'),  sub: T('onb.macrostr.same.sub') },
            { v: 'split', l: T('onb.macrostr.split'), sub: T('onb.macrostr.split.sub'), rec: true },
          ].map(o => (
            <div key={o.v} onClick={() => up('macroStructure', o.v)} style={{
              padding: 18, borderRadius: 16, cursor: 'pointer', marginBottom: 12,
              background: d.macroStructure === o.v ? t.greenBg : t.card2,
              border: `1px solid ${d.macroStructure === o.v ? t.green : t.border}`, position: 'relative',
            }}>
              {o.rec && (
                <div style={{ position: 'absolute', top: -8, right: 12, background: t.green, color: '#0A0A0B', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8, letterSpacing: '0.05em' }}>{T('common.recommended')}</div>
              )}
              <div style={{ fontWeight: 700, fontSize: 16, color: d.macroStructure === o.v ? t.green : t.text, marginBottom: 6 }}>{o.l}</div>
              <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.5 }}>{o.sub}</div>
            </div>
          ))}
        </div>
      );

      case 6: return (
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>{T('onb.training.title')}</div>
          <div style={{ fontSize: 14, color: t.soft, marginBottom: 24, lineHeight: 1.5 }}>{T('onb.training.sub')}</div>

          {[
            { v: 'fixed',    l: T('onb.training.fixed'),    sub: T('onb.training.fixed.sub'),    rec: true },
            { v: 'flexible', l: T('onb.training.flexible'), sub: T('onb.training.flexible.sub') },
          ].map(o => (
            <div key={o.v} onClick={() => up('trainingStructure', o.v)} style={{
              padding: 18, borderRadius: 16, cursor: 'pointer', marginBottom: 12,
              background: d.trainingStructure === o.v ? t.greenBg : t.card2,
              border: `1px solid ${d.trainingStructure === o.v ? t.green : t.border}`, position: 'relative',
            }}>
              {o.rec && (
                <div style={{ position: 'absolute', top: -8, right: 12, background: t.green, color: '#0A0A0B', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8, letterSpacing: '0.05em' }}>{T('common.recommended')}</div>
              )}
              <div style={{ fontWeight: 700, fontSize: 16, color: d.trainingStructure === o.v ? t.green : t.text, marginBottom: 6 }}>{o.l}</div>
              <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.5 }}>{o.sub}</div>
            </div>
          ))}

          {d.trainingStructure === 'fixed' && (
            <div style={{ marginTop: 18, padding: 14, background: t.card2, borderRadius: 14, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 11, color: t.muted, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>{T('onb.training.example')}</div>
              {WEEK.map(day => {
                const dayKey = `onb.day.${day}`;
                const v = d.weekSchedule?.[day] || 'Rest';
                return (
                  <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 13, color: t.soft }}>
                    <span>{T(dayKey)}</span>
                    <span style={{ color: v === 'Rest' ? t.muted : t.text, fontWeight: 600 }}>{v === 'Rest' ? T('common.rest') : v}</span>
                  </div>
                );
              })}
              <div style={{ fontSize: 11, color: t.muted, marginTop: 8 }}>{T('onb.training.adjustable')}</div>
            </div>
          )}
        </div>
      );

      case 7: return (
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>{T('onb.checkins.title')}</div>
          <div style={{ fontSize: 14, color: t.soft, marginBottom: 22, lineHeight: 1.5 }}>{T('onb.checkins.sub')}</div>

          <div style={{ background: t.card2, borderRadius: 16, padding: 16, border: `1px solid ${t.border}`, marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, color: t.soft, lineHeight: 1.6 }}>
              {T('onb.checkins.body')}
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 11, color: t.muted, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>{T('onb.checkins.includes')}</div>
              <div style={{ fontSize: 12.5, color: t.soft, lineHeight: 1.8 }}>
                {T('onb.checkins.list')}
              </div>
            </div>
          </div>

          <Label>{T('onb.notifications')}</Label>
          {[
            { k: 'weigh',    l: T('onb.notif.weigh'),    icon: '⚖️' },
            { k: 'checkin',  l: T('onb.notif.checkin'),  icon: '✅' },
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

      case 8: return (
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 6, letterSpacing: '-0.02em' }}>{T('onb.privacy.fullttitle')}</div>
          <div style={{ fontSize: 14, color: t.soft, marginBottom: 22, lineHeight: 1.5 }}>{T('onb.privacy.fullsub')}</div>

          <div style={{ background: t.greenBg, borderRadius: 16, padding: 18, border: `1px solid ${t.greenBorder}`, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <Icon name="shield" size={20} color={t.green} />
              <div style={{ fontSize: 14, color: t.green, fontWeight: 700 }}>{T('onb.privacy.title')}</div>
            </div>
            <div style={{ fontSize: 12.5, color: t.soft, lineHeight: 1.6 }}>{T('onb.privacy.body')}</div>
          </div>

          <Label>{T('onb.privacy.remind')}</Label>
          {[
            { k: 'photoSat', l: T('onb.notif.photoSat'), icon: '📷' },
            { k: 'photoSun', l: T('onb.notif.photoSun'), icon: '📷' },
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

  const pct = ((step + 1) / TOTAL) * 100;

  return (
    <div style={{ background: t.bg, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 20px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          {step > 0 ? (
            <div onClick={back} style={{ cursor: 'pointer', color: t.soft, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="chevL" size={18} /> <span style={{ fontSize: 14 }}>{T('common.back')}</span>
            </div>
          ) : <div style={{ width: 60 }} />}
          <div style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>{T('common.step')} {step + 1} {T('common.of')} {TOTAL}</div>
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
        <Btn full onClick={next}>{step === 8 ? T('onb.start') + ' →' : T('common.continue') + ' →'}</Btn>
      </div>
    </div>
  );
}
