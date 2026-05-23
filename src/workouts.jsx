import { useState } from "react";
import { t, WEEK, useApp, todayIdx, weekDates, todayKey, monthName, fmtKey } from './lib';
import { Icon, Card, Label, Btn, Chip, Modal } from './shared';
import { Toast } from './modals';
import { EXMAP_LEN } from './home';

/* ═══════════════════════════ WORKOUTS ═══════════════════════════ */
export function Workouts() {
  const { profile, saveProfileData } = useApp();
  const d = profile?.data || {};
  const workouts = Array.isArray(d.workouts) ? d.workouts : [];
  const workoutPlan = d.workoutPlan || {};
  const workoutLog = d.workoutLog || {};

  const ti = todayIdx();
  const dates = weekDates();
  const tKey = todayKey();

  const [view, setView] = useState('week');
  const [selectedDay, setSelectedDay] = useState(ti);
  const [mode, setMode] = useState('fixed');
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [showTpl, setShowTpl] = useState(null);
  const [toast, setToast] = useState('');

  const selDateKey = (() => { const dt = new Date(); dt.setDate(dt.getDate() - ti + selectedDay); return fmtKey(dt); })();
  const selDayName = WEEK[selectedDay];

  const toggleDone = async () => {
    const cur = workoutLog[selDateKey]?.completed || false;
    const wName = workoutPlan[selDayName];
    const newLog = { ...workoutLog, [selDateKey]: { workoutName: wName, completed: !cur } };
    await saveProfileData({ workoutLog: newLog });
    setShowDayDetail(false);
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Label color={t.orange}>Workouts</Label>
            <div style={{ fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>Train smart</div>
          </div>
          <div onClick={() => { setView('templates'); setToast('Tap + Create template to add a workout'); setTimeout(()=>setToast(''), 2400); }} style={{ width: 40, height: 40, borderRadius: 12, background: t.orangeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.orangeBorder}`, cursor: 'pointer' }}>
            <Icon name="plus" size={20} color={t.orange} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <Chip active={view === 'week'} onClick={() => setView('week')} accent="orange">Week</Chip>
          <Chip active={view === 'templates'} onClick={() => setView('templates')} accent="orange">Templates</Chip>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {view === 'week' && (
          <>
            <Card style={{ padding: 14 }}>
              <Label color={t.orange}>Planning mode</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div onClick={() => setMode('fixed')} style={{
                  flex: 1, padding: 12, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  background: mode === 'fixed' ? t.orangeBg : t.card2,
                  color: mode === 'fixed' ? t.orange : t.soft,
                  border: `1px solid ${mode === 'fixed' ? t.orange : t.border}`,
                  fontWeight: 600, fontSize: 13,
                }}>
                  <div>Fixed</div>
                  <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>auto train/rest macros</div>
                </div>
                <div onClick={() => setMode('flexible')} style={{
                  flex: 1, padding: 12, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  background: mode === 'flexible' ? t.orangeBg : t.card2,
                  color: mode === 'flexible' ? t.orange : t.soft,
                  border: `1px solid ${mode === 'flexible' ? t.orange : t.border}`,
                  fontWeight: 600, fontSize: 13,
                }}>
                  <div>Flexible</div>
                  <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>manual day type</div>
                </div>
              </div>
            </Card>

            {Object.keys(workoutPlan).length === 0 && workouts.length === 0 && (
              <div style={{ padding: 30, marginTop: 12, textAlign: 'center', borderRadius: 16, background: t.card, border: `1px dashed ${t.border}` }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>💪</div>
                <div style={{ fontSize: 14, color: t.text, fontWeight: 600, marginBottom: 6 }}>No workouts yet</div>
                <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>Go to Templates → Create template.<br/>Then assign workouts to days.</div>
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              {WEEK.map((day, i) => {
                const w = workoutPlan[day];
                const dt = new Date(); dt.setDate(dt.getDate() - ti + i);
                const dk = fmtKey(dt);
                const done = workoutLog[dk]?.completed || false;
                const isToday = i === ti;
                return (
                  <Card key={day} onClick={() => { setSelectedDay(i); setShowDayDetail(true); }}
                    style={{ padding: 14, marginBottom: 8, background: isToday ? `linear-gradient(135deg, ${t.card}, ${t.orangeBg})` : t.card, border: isToday ? `1px solid ${t.orangeBorder}` : `1px solid ${t.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: done ? t.greenBg : w ? t.orangeBg : t.card2,
                        border: `1px solid ${done ? t.greenBorder : w ? t.orangeBorder : t.border}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ fontSize: 9, color: done ? t.green : w ? t.orange : t.muted, fontWeight: 700 }}>{day.slice(0,3).toUpperCase()}</div>
                        <div style={{ fontSize: 14, color: t.text, fontWeight: 700, marginTop: -1 }}>{dates[i]}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{w || 'Rest day'}</div>
                          {done && <Icon name="check" size={14} color={t.green} stroke={3} />}
                          {isToday && <span style={{ fontSize: 9, color: t.orange, fontWeight: 700, background: t.orangeBg, padding: '2px 6px', borderRadius: 5, letterSpacing: '0.05em' }}>TODAY</span>}
                        </div>
                        <div style={{ fontSize: 12, color: t.soft, marginTop: 2 }}>
                          {done ? '✓ Completed' : w ? `${EXMAP_LEN(workouts, w)} exercises` : 'Recovery & mobility'}
                        </div>
                      </div>
                      <Icon name="chevR" size={16} color={t.muted} />
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {view === 'templates' && (
          <>
            <Btn full variant="ghost" accent="orange" style={{ marginBottom: 14 }} onClick={() => { setToast('Workout template builder — coming next iteration'); setTimeout(()=>setToast(''), 2400); }}>+ Create template</Btn>
            {workouts.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', borderRadius: 16, background: t.card, border: `1px dashed ${t.border}` }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🏋️</div>
                <div style={{ fontSize: 14, color: t.text, fontWeight: 600, marginBottom: 6 }}>No templates yet</div>
                <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>A template is a reusable workout<br/>(e.g. "Back", "Legs").</div>
              </div>
            ) : workouts.map((w, i) => (
              <Card key={i} onClick={() => setShowTpl(i)} style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: t.orangeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.orangeBorder}` }}>
                      <Icon name="workout" size={18} color={t.orange} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{w.name}</div>
                      <div style={{ fontSize: 12, color: t.soft }}>{(w.exercises||[]).length} exercises</div>
                    </div>
                  </div>
                  <Icon name="chevR" size={16} color={t.muted} />
                </div>
              </Card>
            ))}
          </>
        )}
      </div>

      <Modal visible={showDayDetail} onClose={() => setShowDayDetail(false)} title={`${selDayName}, ${dates[selectedDay]} ${monthName().slice(0,3)}`} accent="orange">
        {(() => {
          const w = workoutPlan[selDayName];
          const done = workoutLog[selDateKey]?.completed || false;
          return (
            <>
              <div style={{ background: t.card2, borderRadius: 14, padding: 14, marginBottom: 14, border: `1px solid ${t.border}` }}>
                <Label color={t.orange}>Workout</Label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: t.text }}>{w || 'Rest day'}</div>
                  {done && <span style={{ fontSize: 11, color: t.green, fontWeight: 700, background: t.greenBg, padding: '4px 10px', borderRadius: 8 }}>✓ DONE</span>}
                </div>
              </div>

              {w && workouts.find(x => x.name === w) && (
                <div style={{ marginBottom: 16 }}>
                  <Label>Exercises</Label>
                  {workouts.find(x => x.name === w).exercises.map((ex, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${t.border}` }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: t.orangeBg, color: t.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
                      <div style={{ fontSize: 14, color: t.text }}>{ex}</div>
                    </div>
                  ))}
                </div>
              )}

              {w && (
                <Btn full accent="orange" style={{ marginBottom: 8 }} onClick={toggleDone}>
                  {done ? 'Mark as not completed' : '✓ Mark as completed'}
                </Btn>
              )}
              {!w && (
                <Btn full variant="outline" onClick={() => setShowDayDetail(false)}>Close</Btn>
              )}
            </>
          );
        })()}
      </Modal>

      <Modal visible={showTpl !== null} onClose={() => setShowTpl(null)} title={showTpl !== null ? workouts[showTpl]?.name || '' : ''} accent="orange">
        {showTpl !== null && workouts[showTpl] && (
          <>
            {(workouts[showTpl].exercises||[]).map((ex, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: `1px solid ${t.border}` }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: t.orangeBg, color: t.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                <div style={{ fontSize: 14, color: t.text }}>{ex}</div>
              </div>
            ))}
          </>
        )}
      </Modal>

      <Toast message={toast} visible={!!toast} />
    </div>
  );
}
