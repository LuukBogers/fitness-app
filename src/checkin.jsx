import { useState, useEffect } from "react";
import { t, useApp, useT, todayKey, fmtKey } from './lib';
import { Btn, Modal, ScaleInput, YesNo } from './shared';
import { evaluateCoachTriggers, mergeNotifications } from './notifications';

/* ═══════════════════════════ CHECK-IN QUESTIONS ═══════════════════════════ */
// Labels worden runtime vertaald via T() — alleen ids/types/units zijn statisch.
const CHECKIN_Q = [
  { id: 'weight',   labelKey: 'checkin.q.weight',   type: 'number', unit: 'kg', ph: '82.3' },
  { id: 'sleep',    labelKey: 'checkin.q.sleep',    type: 'number', unit: 'h',  ph: '7.5' },
  { id: 'sleepQ',   labelKey: 'checkin.q.sleepq',   type: 'scale' },
  { id: 'water',    labelKey: 'checkin.q.water',    type: 'number', unit: 'L',  ph: '2.5' },
  { id: 'steps',    labelKey: 'checkin.q.steps',    type: 'number', unit: '',   ph: '8500' },
  { id: 'stress',   labelKey: 'checkin.q.stress',   type: 'scale' },
  { id: 'energy',   labelKey: 'checkin.q.energy',   type: 'scale' },
  { id: 'hunger',   labelKey: 'checkin.q.hunger',   type: 'scale' },
  { id: 'recovery', labelKey: 'checkin.q.recovery', type: 'scale' },
  { id: 'trained',  labelKey: 'checkin.q.trained',  type: 'yesno' },
  { id: 'trainQ',   labelKey: 'checkin.q.trainq',   type: 'scale', cond: 'trained' },
  { id: 'cardio',   labelKey: 'checkin.q.cardio',   type: 'yesno' },
  { id: 'caffeine', labelKey: 'checkin.q.caffeine', type: 'yesno' },
];

/* ═══════════════════════════ DAILY CHECK-IN ═══════════════════════════ */
export function CheckIn({ visible, onClose }) {
  const T = useT();
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
    if (answers.weight && !isNaN(parseFloat(answers.weight))) {
      const existingW = profile?.data?.weights || [];
      const todayW = existingW.find(w => w.date === tKey);
      const newW = todayW
        ? existingW.map(w => w.date === tKey ? { date: tKey, weight: parseFloat(answers.weight) } : w)
        : [...existingW, { date: tKey, weight: parseFloat(answers.weight) }];
      patch.weights = newW;
    }
    const yKey = (() => { const d = new Date(); d.setDate(d.getDate()-1); return fmtKey(d); })();
    const prevStreak = profile?.data?.streak || 0;
    const yChecked = !!currentCheckIns[yKey];
    patch.streak = yChecked ? prevStreak + 1 : 1;

    // Run coach evaluator on the merged data (use the new check-ins)
    const dataForEval = { ...(profile?.data || {}), ...patch };
    const fresh = evaluateCoachTriggers(dataForEval);
    if (fresh.length > 0) {
      patch.notifications = mergeNotifications(profile?.data?.notifications || [], fresh);
    }

    await saveProfileData(patch);
    onClose();
  };

  // Trained-conditional check: "Yes" in any language counts as positive
  const isTrained = trained === 'Yes' || trained === T('common.yes');

  return (
    <Modal visible={visible} onClose={onClose} title={T('checkin.title')}>
      <div style={{ fontSize: 13, color: t.soft, marginBottom: 20 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: t.greenBg, borderRadius: 8, color: t.green, fontWeight: 600 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: t.green }} />
          {T('checkin.savesto')}
        </span>
      </div>

      {CHECKIN_Q.map(q => {
        if (q.cond === 'trained' && !isTrained) return null;
        return (
          <div key={q.id} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, color: t.text, fontWeight: 600, marginBottom: 10 }}>{T(q.labelKey)}</div>
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

      <Btn full onClick={save} style={{ marginTop: 8 }}>{T('checkin.save')}</Btn>
    </Modal>
  );
}
