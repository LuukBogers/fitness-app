import { useState, useMemo, useRef, useEffect } from "react";
import { t, WEEK, useApp, useT, useLang, todayIdx, weekDates, todayKey, weekDayShort, fmtKey, newId } from './lib';
import { Icon, Card, Label, Btn, Chip, Modal, Field } from './shared';
import { Toast } from './modals';
import { EXERCISE_LIBRARY, getExercise, searchExercises, formatRestTime } from './exercise_library';
import { WorkoutRunner } from './workout_runner';

/* ═══════════════════════════ WORKOUTS ═══════════════════════════ */
export function Workouts({ autoStart = false, onConsumedAutoStart = () => {} }) {
  const T = useT();
  const { lang } = useLang();
  const { profile, saveProfileData } = useApp();
  const d = profile?.data || {};
  const workouts = Array.isArray(d.workouts) ? d.workouts : [];
  const workoutPlan = d.workoutPlan || {};
  const workoutLog = d.workoutLog || {};
  const workoutSessions = d.workoutSessions || {};

  const ti = todayIdx();
  const dates = weekDates();

  const [view, setView] = useState('today');
  const [showTpl, setShowTpl] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTpl, setEditingTpl] = useState(null);
  const [runnerTpl, setRunnerTpl] = useState(null);
  const [toast, setToast] = useState('');

  const todayName = WEEK[ti];
  const todayWorkoutName = workoutPlan[todayName];
  const todayTpl = todayWorkoutName ? workouts.find(w => w.name === todayWorkoutName) : null;
  const todayDone = workoutLog[todayKey()]?.completed || false;

  const flashToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400); };

  const startWorkout = (template) => setRunnerTpl(template);
  const quickStart = () => setRunnerTpl({ id: 'quick', name: T('wr.quickworkout'), exercises: [] });

  // Auto-start workout when triggered from Home
  useEffect(() => {
    if (autoStart) {
      if (todayTpl) startWorkout(todayTpl);
      else quickStart();
      onConsumedAutoStart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Label color={t.orange}>{T('wo.title')}</Label>
            <div style={{ fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>{T('wo.trainsmart')}</div>
          </div>
          <div onClick={() => { setEditingTpl(null); setShowBuilder(true); }} style={{ width: 40, height: 40, borderRadius: 12, background: t.orangeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.orangeBorder}`, cursor: 'pointer' }}>
            <Icon name="plus" size={20} color={t.orange} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <Chip active={view === 'today'} onClick={() => setView('today')} accent="orange">{T('wo.tab.today')}</Chip>
          <Chip active={view === 'templates'} onClick={() => setView('templates')} accent="orange">{T('wo.tab.templates')}</Chip>
          <Chip active={view === 'library'} onClick={() => setView('library')} accent="orange">{T('wo.tab.library')}</Chip>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {view === 'today' && (
          <>
            <Card style={{ padding: 18, background: todayDone ? t.greenBg : todayTpl ? `linear-gradient(135deg, ${t.card}, ${t.orangeBg})` : t.card, border: todayDone ? `1px solid ${t.greenBorder}` : todayTpl ? `1px solid ${t.orangeBorder}` : `1px solid ${t.border}` }}>
              <Label color={todayDone ? t.green : t.orange}>{T('common.today')}</Label>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>
                  {todayWorkoutName || T('wo.restday')}
                </div>
                {todayDone && <span style={{ fontSize: 11, color: t.green, fontWeight: 700, background: t.greenBg, padding: '3px 8px', borderRadius: 6 }}>✓ {T('common.done')}</span>}
              </div>
              <div style={{ fontSize: 12.5, color: t.soft, marginBottom: 14 }}>
                {todayTpl
                  ? T('wo.today.body', { count: (todayTpl.exercises || []).length })
                  : todayWorkoutName
                  ? T('wo.today.notpl', { name: todayWorkoutName })
                  : T('wo.today.rest')}
              </div>
              {todayTpl && !todayDone && (
                <Btn full accent="orange" onClick={() => startWorkout(todayTpl)}>
                  <Icon name="play" size={14} color="#0A0A0B" /> &nbsp;{T('wo.startworkout')}
                </Btn>
              )}
              {!todayTpl && (
                <Btn full variant="ghost" accent="orange" onClick={quickStart}>{T('wo.quickstart')}</Btn>
              )}
            </Card>

            <Label style={{ marginTop: 18 }}>{T('wo.weekview')}</Label>
            <div>
              {WEEK.map((day, i) => {
                const w = workoutPlan[day];
                const dt = new Date(); dt.setDate(dt.getDate() - ti + i);
                const dk = fmtKey(dt);
                const done = workoutLog[dk]?.completed || false;
                const isToday = i === ti;
                const session = workoutSessions[dk];
                const setCount = session ? (session.exercises || []).reduce((s, ex) => s + (ex.sets || []).length, 0) : 0;
                return (
                  <Card key={day} style={{ padding: 12, marginBottom: 6, background: isToday ? `linear-gradient(135deg, ${t.card}, ${t.orangeBg})` : t.card, border: isToday ? `1px solid ${t.orangeBorder}` : `1px solid ${t.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: done ? t.greenBg : w ? t.orangeBg : t.card2,
                        border: `1px solid ${done ? t.greenBorder : w ? t.orangeBorder : t.border}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ fontSize: 9, color: done ? t.green : w ? t.orange : t.muted, fontWeight: 700 }}>{weekDayShort(lang, i)}</div>
                        <div style={{ fontSize: 13, color: t.text, fontWeight: 700, marginTop: -1 }}>{dates[i]}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{w || T('wo.restday')}</div>
                        <div style={{ fontSize: 11, color: t.soft, marginTop: 2 }}>
                          {done && session
                            ? T('wo.day.sets', { count: setCount })
                            : done
                            ? T('wo.completed')
                            : w
                            ? T('wo.day.planned')
                            : T('wo.recovery')}
                        </div>
                      </div>
                      {done && <Icon name="check" size={14} color={t.green} stroke={3} />}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {view === 'templates' && (
          <>
            <Btn full variant="ghost" accent="orange" style={{ marginBottom: 14 }} onClick={() => { setEditingTpl(null); setShowBuilder(true); }}>
              + {T('wo.createtemplate')}
            </Btn>
            {workouts.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', borderRadius: 16, background: t.card, border: `1px dashed ${t.border}` }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🏋️</div>
                <div style={{ fontSize: 14, color: t.text, fontWeight: 600, marginBottom: 6 }}>{T('wo.notemplates')}</div>
                <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>{T('wo.notemplatesbody')}</div>
              </div>
            ) : workouts.map((w, i) => (
              <Card key={i} onClick={() => setShowTpl(i)} style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: t.orangeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.orangeBorder}` }}>
                      <Icon name="workout" size={18} color={t.orange} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{w.name}</div>
                      <div style={{ fontSize: 12, color: t.soft }}>{(w.exercises || []).length} {T('wo.exercises')}</div>
                    </div>
                  </div>
                  <Icon name="chevR" size={16} color={t.muted} />
                </div>
              </Card>
            ))}
          </>
        )}

        {view === 'library' && (
          <ExerciseLibraryScreen T={T} />
        )}
      </div>

      <Modal visible={showTpl !== null} onClose={() => setShowTpl(null)} title={showTpl !== null ? workouts[showTpl]?.name || '' : ''} accent="orange">
        {showTpl !== null && workouts[showTpl] && (
          <>
            {(workouts[showTpl].exercises || []).map((ex, i) => {
              const exId = typeof ex === 'string' ? null : ex.exerciseId;
              const exMeta = exId ? getExercise(exId) : null;
              const name = exMeta ? exMeta.name : (typeof ex === 'string' ? ex : T('wo.unknownexercise'));
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: i < (workouts[showTpl].exercises || []).length - 1 ? `1px solid ${t.border}` : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: t.orangeBg, color: t.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                  <div style={{ flex: 1, fontSize: 14, color: t.text }}>{name}</div>
                  {typeof ex !== 'string' && ex.setCount && (
                    <div style={{ fontSize: 11, color: t.muted }}>{ex.setCount}×{ex.repRange}</div>
                  )}
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <Btn full variant="outline" onClick={() => { setEditingTpl(workouts[showTpl]); setShowTpl(null); setShowBuilder(true); }}>{T('common.edit')}</Btn>
              <Btn full accent="orange" onClick={() => { const tpl = workouts[showTpl]; setShowTpl(null); startWorkout(tpl); }}>
                {T('wo.startworkout')}
              </Btn>
            </div>
          </>
        )}
      </Modal>

      <TemplateBuilderModal
        visible={showBuilder}
        editing={editingTpl}
        onClose={() => { setShowBuilder(false); setEditingTpl(null); }}
        onSave={async (tpl) => {
          let updated;
          if (editingTpl) {
            updated = workouts.map(w => w.id === editingTpl.id ? tpl : w);
          } else {
            updated = [...workouts, tpl];
          }
          await saveProfileData({ workouts: updated });
          setShowBuilder(false); setEditingTpl(null);
          flashToast(T('wo.tpl.saved'));
        }}
        T={T}
      />

      <WorkoutRunner
        visible={runnerTpl !== null}
        template={runnerTpl}
        onClose={() => setRunnerTpl(null)}
        onFinished={() => { flashToast(T('wo.session.saved')); }}
      />

      <Toast message={toast} visible={!!toast} />
    </div>
  );
}

/* ─────────────────────── Exercise Library tab ─────────────────────── */
function ExerciseLibraryScreen({ T }) {
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState('all');
  const list = useMemo(() => searchExercises(q, { muscle }), [q, muscle]);

  return (
    <>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder={T('wr.lib.search')}
        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: t.card2, border: `1px solid ${t.border}`, color: t.text, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10 }}
      />
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 4 }}>
        <Chip active={muscle === 'all'} onClick={() => setMuscle('all')} accent="orange">{T('wr.lib.all')}</Chip>
        {['chest','back','shoulders','arms','legs','core','cardio'].map(mg => (
          <Chip key={mg} active={muscle === mg} onClick={() => setMuscle(mg)} accent="orange">{T(`wr.mg.${mg}`)}</Chip>
        ))}
      </div>
      <div style={{ fontSize: 11, color: t.muted, marginBottom: 8 }}>
        {T('wo.lib.count', { count: list.length })}
      </div>
      {list.map(e => (
        <Card key={e.id} style={{ padding: 12, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LibThumb exercise={e} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>
                {T(`wr.mg.${e.primaryMuscle}`)} · {e.equipment} · {e.defaultRepRange} · {formatRestTime(e.defaultRestSec)}
              </div>
            </div>
          </div>
        </Card>
      ))}
      {list.length === 0 && (
        <div style={{ padding: 30, textAlign: 'center', color: t.muted, fontSize: 13 }}>
          {T('wr.lib.empty')}
        </div>
      )}
    </>
  );
}

function LibThumb({ exercise }) {
  const mgColor = {
    chest: '#FF3B5C', back: '#4D8BFA', shoulders: '#5EE3F5',
    arms: '#B8C2D6', legs: '#FF3B5C', core: '#4D8BFA', cardio: '#5EE3F5',
  }[exercise.primaryMuscle] || t.silver;
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
      background: `linear-gradient(135deg, ${mgColor}33, ${mgColor}11)`,
      border: `1px solid ${mgColor}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name="workout" size={18} color={mgColor} />
    </div>
  );
}

/* ─────────────────────── Template builder ─────────────────────── */
function TemplateBuilderModal({ visible, editing, onClose, onSave, T }) {
  const [name, setName] = useState('');
  const [picked, setPicked] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  const initFromEditing = (e) => {
    if (e) {
      setName(e.name || '');
      const exs = (e.exercises || []).map(x => {
        if (typeof x === 'string') {
          const m = EXERCISE_LIBRARY.find(em => em.name.toLowerCase() === x.toLowerCase());
          if (m) return { exerciseId: m.id, setCount: 4, repRange: m.defaultRepRange, restSec: m.defaultRestSec };
          return null;
        }
        return { exerciseId: x.exerciseId, setCount: x.setCount || 4, repRange: x.repRange || '8-12', restSec: x.restSec || 120 };
      }).filter(Boolean);
      setPicked(exs);
    } else {
      setName(''); setPicked([]);
    }
  };

  const visKey = visible + '|' + (editing?.id || 'new');
  const lastVisRef = useRef('');
  if (visible && visKey !== lastVisRef.current) {
    lastVisRef.current = visKey;
    initFromEditing(editing);
  }
  if (!visible && lastVisRef.current) {
    lastVisRef.current = '';
  }

  const pick = (exerciseId) => {
    const m = getExercise(exerciseId);
    setPicked(prev => [...prev, { exerciseId, setCount: 4, repRange: m?.defaultRepRange || '8-12', restSec: m?.defaultRestSec || 120 }]);
    setShowPicker(false);
  };
  const remove = (idx) => setPicked(prev => prev.filter((_, i) => i !== idx));
  const updatePicked = (idx, patch) => setPicked(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p));

  const save = () => {
    if (!name.trim() || picked.length === 0) return;
    const tpl = {
      id: editing?.id || newId(),
      name: name.trim(),
      exercises: picked,
    };
    onSave(tpl);
  };

  return (
    <>
      <Modal visible={visible && !showPicker} onClose={onClose} title={editing ? T('wo.tpl.edit') : T('wo.tpl.new')} accent="orange">
        <Field label={T('wo.tpl.name')}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={T('wo.tpl.nameph')}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: t.card2, border: `1px solid ${t.border}`, color: t.text, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </Field>

        <Label style={{ marginTop: 6 }}>{T('wo.tpl.exercises')}</Label>
        {picked.length === 0 ? (
          <div style={{ padding: 18, textAlign: 'center', color: t.muted, fontSize: 12, border: `1px dashed ${t.border}`, borderRadius: 10, marginBottom: 10 }}>
            {T('wo.tpl.noexs')}
          </div>
        ) : (
          <div style={{ marginBottom: 8 }}>
            {picked.map((p, i) => {
              const m = getExercise(p.exerciseId);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                  background: t.card2, border: `1px solid ${t.border}`, borderRadius: 10, marginBottom: 6,
                }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: t.orangeBg, color: t.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m?.name || '?'}</div>
                    <div style={{ fontSize: 10.5, color: t.muted, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <input type="number" inputMode="numeric" value={p.setCount}
                        onChange={e => updatePicked(i, { setCount: parseInt(e.target.value) || 1 })}
                        style={{ width: 30, padding: 2, background: 'transparent', border: 'none', color: t.text, fontSize: 10.5, fontFamily: 'inherit' }} />
                      ×
                      <input value={p.repRange}
                        onChange={e => updatePicked(i, { repRange: e.target.value })}
                        style={{ width: 48, padding: 2, background: 'transparent', border: 'none', color: t.text, fontSize: 10.5, fontFamily: 'inherit' }} />
                      ·
                      <input type="number" inputMode="numeric" value={p.restSec}
                        onChange={e => updatePicked(i, { restSec: parseInt(e.target.value) || 90 })}
                        style={{ width: 36, padding: 2, background: 'transparent', border: 'none', color: t.text, fontSize: 10.5, fontFamily: 'inherit' }} />s
                    </div>
                  </div>
                  <div onClick={() => remove(i)} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.muted, cursor: 'pointer', fontSize: 16 }}>×</div>
                </div>
              );
            })}
          </div>
        )}

        <Btn full variant="ghost" accent="orange" style={{ marginBottom: 14 }} onClick={() => setShowPicker(true)}>+ {T('wo.tpl.addexercise')}</Btn>

        <div style={{ display: 'flex', gap: 8 }}>
          <Btn full variant="outline" onClick={onClose}>{T('common.cancel')}</Btn>
          <Btn full accent="orange" onClick={save} style={{ opacity: (!name.trim() || picked.length === 0) ? 0.5 : 1 }}>{T('common.save')}</Btn>
        </div>
      </Modal>

      <TemplateExercisePicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onPick={pick}
        T={T}
      />
    </>
  );
}

function TemplateExercisePicker({ visible, onClose, onPick, T }) {
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState('all');
  const list = useMemo(() => {
    let l = EXERCISE_LIBRARY;
    if (muscle !== 'all') l = l.filter(e => e.primaryMuscle === muscle);
    const ql = q.toLowerCase().trim();
    if (ql) l = l.filter(e => e.name.toLowerCase().includes(ql));
    return l.slice(0, 60);
  }, [q, muscle]);
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(8,10,14,0.94)', zIndex: 300,
      display: 'flex', flexDirection: 'column', backdropFilter: 'blur(20px)',
    }}>
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${t.border}` }}>
        <div onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: t.card2, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="x" size={18} color={t.soft} />
        </div>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 800, color: t.text }}>{T('wo.tpl.pickexercise')}</div>
      </div>
      <div style={{ padding: '12px 16px 0' }}>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={T('wr.lib.search')}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: t.card2, border: `1px solid ${t.border}`, color: t.text, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
          <Chip active={muscle === 'all'} onClick={() => setMuscle('all')} accent="orange">{T('wr.lib.all')}</Chip>
          {['chest','back','shoulders','arms','legs','core','cardio'].map(mg => (
            <Chip key={mg} active={muscle === mg} onClick={() => setMuscle(mg)} accent="orange">{T(`wr.mg.${mg}`)}</Chip>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 32px' }}>
        {list.map(e => (
          <div key={e.id} onClick={() => onPick(e.id)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8,
            background: t.card, borderRadius: 12, border: `1px solid ${t.border}`, cursor: 'pointer',
          }}>
            <LibThumb exercise={e} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{e.name}</div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>
                {T(`wr.mg.${e.primaryMuscle}`)} · {e.equipment}
              </div>
            </div>
            <Icon name="chevR" size={14} color={t.muted} />
          </div>
        ))}
      </div>
    </div>
  );
}
