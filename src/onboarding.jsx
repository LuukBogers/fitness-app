import { useState } from "react";
import { t } from './lib';
import { Icon, Label, Btn, Toggle, Chip, Field } from './shared';

/* ═══════════════════════════ ONBOARDING ═══════════════════════════ */
export function Onboarding({ onComplete }) {
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
