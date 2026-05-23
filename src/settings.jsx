import { useState } from "react";
import { t, useApp } from './lib';
import { Icon, Card, Label, Btn, Toggle, Modal, Field } from './shared';

/* ═══════════════════════════ SETTINGS ═══════════════════════════ */
export function Settings() {
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

  if (sub === 'main') return (
    <div style={{ padding: '20px 16px 100px' }}>
      <Label>Settings</Label>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginBottom: 20, letterSpacing: '-0.02em' }}>Account</div>

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
        { k: 'personal', icon: 'user', l: 'Personal data', sub: 'Age, height, weight, activity' },
        { k: 'goal', icon: 'target', l: 'Goal', sub: userGoal ? `${userGoal}${userGoalDetail ? ' · ' + userGoalDetail : ''}` : 'Not set' },
        { k: 'training', icon: 'workout', l: 'Training / rest structure', sub: 'Fixed schedule', accent: 'orange' },
        { k: 'macros', icon: 'flame', l: 'Adjust macros', sub: userCalories ? `${userCalories} kcal/day` : 'Not set yet', accent: 'green' },
        { k: 'notifications', icon: 'bell', l: 'Notifications', sub: `${Object.values(notif).filter(Boolean).length} of ${Object.keys(notif).length} enabled` },
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
