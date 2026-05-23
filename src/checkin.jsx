import { useState, useEffect } from "react";
import { t, useApp, todayKey, fmtKey } from './lib';
import { Btn, Modal, ScaleInput, YesNo } from './shared';

/* ═══════════════════════════ CHECK-IN QUESTIONS ═══════════════════════════ */
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

/* ═══════════════════════════ DAILY CHECK-IN ═══════════════════════════ */
export function CheckIn({ visible, onClose }) {
  const { profile, saveProfileData } = useApp();
  const tKey = todayKey();
  const existing = profile?.data?.checkIns?.[tKey] || {};
  const [answers, setAnswers] = useState(existing);
  const upd = (k, v) => setAnswers(p => ({ ...p, [k]: v }));
  const trained = answers.trained;

  useEffect(() => {
    if (visible) setAnswers(profile?.data?.checkIns?.[tKey] || {});
  }, [visible, profile, tKey]);

  const save = async () => {
    const currentCheckIns = profile?.data?.checkIns || {};
    const newCheckIns = { ...currentCheckIns, [tKey]: { ...answers, savedAt: new Date().toISOString() } };
    const patch = { checkIns: newCheckIns };
    // Also log weight to weights array if provided
    if (answers.weight && !isNaN(parseFloat(answers.weight))) {
      const existingW = profile?.data?.weights || [];
      const todayW = existingW.find(w => w.date === tKey);
      const newW = todayW
        ? existingW.map(w => w.date === tKey ? { date: tKey, weight: parseFloat(answers.weight) } : w)
        : [...existingW, { date: tKey, weight: parseFloat(answers.weight) }];
      patch.weights = newW;
    }
    // Streak: if check-in done yesterday → streak+1, else 1
    const yKey = (() => { const d = new Date(); d.setDate(d.getDate()-1); return fmtKey(d); })();
    const prevStreak = profile?.data?.streak || 0;
    const yChecked = !!currentCheckIns[yKey];
    patch.streak = yChecked ? prevStreak + 1 : 1;
    await saveProfileData(patch);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Daily check-in">
      <div style={{ fontSize: 13, color: t.soft, marginBottom: 20 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: t.greenBg, borderRadius: 8, color: t.green, fontWeight: 600 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: t.green }} />
          Saves to your account
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

      <Btn full onClick={save} style={{ marginTop: 8 }}>Save check-in</Btn>
    </Modal>
  );
}
