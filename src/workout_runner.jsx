import { useState, useEffect, useRef, useMemo } from "react";
import { t, useApp, useT, todayKey, newId } from './lib';
import { Icon, Card, Btn, Modal, Label, Chip } from './shared';
import { Toast } from './modals';
import { EXERCISE_LIBRARY, getExercise, formatRestTime, findLastSetFor } from './exercise_library';

/* ═══════════════════════════════════════════════════════════════════════════
 * WORKOUT RUNNER
 *
 * Hard interaction logic (per workout-rest-timer-setflow.md):
 *  - Tap check on a set: weight+reps locked in, set completedAt = now,
 *    rest timer starts automatically (2:00 default, per-exercise override).
 *  - Rest banner pinned at top, countdown visible, skip / restart / +15 / +30.
 *  - Beep + vibrate when timer hits 0 (browser-native, no service worker).
 *  - Per exercise: previous-session hint "50kg × 10 last time".
 *  - + Add Set inherits weight/reps suggestion from previous set in this session.
 *  - Finish: confirm if any set still unchecked. Save to workoutSessions[date].
 * ═══════════════════════════════════════════════════════════════════════════ */

// Default set count when starting a fresh exercise
const DEFAULT_SET_COUNT = 4;

function makeFreshSet() {
  return { weight: '', reps: '', completedAt: null };
}

function makeExerciseEntry(exerciseId, planned) {
  const ex = getExercise(exerciseId);
  const setCount = planned?.setCount || DEFAULT_SET_COUNT;
  return {
    exerciseId,
    setCount,
    repRange: planned?.repRange || ex?.defaultRepRange || '8-12',
    restSec: planned?.restSec || ex?.defaultRestSec || 120,
    sets: Array.from({ length: setCount }, makeFreshSet),
  };
}

export function WorkoutRunner({ visible, onClose, template, onFinished }) {
  const T = useT();
  const { profile, saveProfileData } = useApp();
  const d = profile?.data || {};
  const workoutSessions = d.workoutSessions || {};

  // ── Session state ──────────────────────────────────────────────────────
  const [sessionExercises, setSessionExercises] = useState([]);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [restTimer, setRestTimer] = useState(null); // { exerciseIdx, setIdx, totalSec, startedAt, paused, remainingAtPause }
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [actionsTarget, setActionsTarget] = useState(null); // exerciseIdx for ⋯ menu
  const [toast, setToast] = useState('');
  const audioRef = useRef(null);

  // Initialize / reset on open
  useEffect(() => {
    if (!visible) return;
    if (template && Array.isArray(template.exercises) && template.exercises.length > 0) {
      // Template may have string-exercises (legacy) or structured. Normalize.
      const normalized = template.exercises.map(ex => {
        if (typeof ex === 'string') {
          // Legacy: try to find a matching library exercise by name (case-insensitive contains)
          const lq = ex.toLowerCase();
          const match = EXERCISE_LIBRARY.find(e => e.name.toLowerCase() === lq)
                     || EXERCISE_LIBRARY.find(e => e.name.toLowerCase().includes(lq) || lq.includes(e.name.toLowerCase()));
          return makeExerciseEntry(match ? match.id : null, null);
        }
        return makeExerciseEntry(ex.exerciseId, ex);
      }).filter(e => e.exerciseId); // drop unmatched legacy strings
      setSessionExercises(normalized);
    } else {
      setSessionExercises([]);
    }
    setSessionStartedAt(Date.now());
    setRestTimer(null);
  }, [visible, template]);

  // Heartbeat tick for live timers (1Hz is plenty for UI)
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [visible]);

  // Derived: session elapsed in seconds
  const sessionElapsed = sessionStartedAt
    ? Math.floor((nowTick - sessionStartedAt) / 1000)
    : 0;

  // Derived: rest timer remaining
  const restRemaining = (() => {
    if (!restTimer || !restTimer.startedAt) return 0;
    if (restTimer.paused) return restTimer.remainingAtPause || 0;
    const elapsedRest = Math.floor((nowTick - restTimer.startedAt) / 1000);
    return Math.max(0, restTimer.totalSec - elapsedRest);
  })();

  // Auto-trigger end-of-rest cue when remaining transitions to 0
  const prevRemainingRef = useRef(restRemaining);
  useEffect(() => {
    if (!restTimer || restTimer.paused) { prevRemainingRef.current = restRemaining; return; }
    if (prevRemainingRef.current > 0 && restRemaining === 0) {
      // Cue: beep + vibrate. Browser-native, no permission needed (vibrate may be a no-op on desktop).
      try {
        if (navigator.vibrate) navigator.vibrate([180, 80, 180]);
      } catch { /* no-op */ }
      try {
        // Soft synthesized beep — no audio asset needed
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          const ctx = new AC();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 880;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
          osc.start();
          osc.stop(ctx.currentTime + 0.6);
        }
      } catch { /* no-op */ }
      setToast(T('wr.rest.over'));
      setTimeout(() => setToast(''), 2500);
    }
    prevRemainingRef.current = restRemaining;
  }, [restRemaining, restTimer, T]);

  // ── Set actions ────────────────────────────────────────────────────────
  const updateSet = (exIdx, setIdx, patch) => {
    setSessionExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      const newSets = ex.sets.map((s, j) => j === setIdx ? { ...s, ...patch } : s);
      return { ...ex, sets: newSets };
    }));
  };

  const toggleSetComplete = (exIdx, setIdx) => {
    const ex = sessionExercises[exIdx];
    const s = ex.sets[setIdx];
    if (s.completedAt) {
      // Uncheck → clear completion (rest timer stays as-is)
      updateSet(exIdx, setIdx, { completedAt: null });
      return;
    }
    // Need at least one of weight or reps before completing (allow bodyweight too)
    if (!s.weight && !s.reps) {
      setToast(T('wr.set.needsdata'));
      setTimeout(() => setToast(''), 1800);
      return;
    }
    updateSet(exIdx, setIdx, { completedAt: new Date().toISOString() });
    // Auto-start rest timer
    setRestTimer({
      exerciseIdx: exIdx,
      setIdx,
      totalSec: ex.restSec || 120,
      startedAt: Date.now(),
      paused: false,
    });
  };

  const addSet = (exIdx) => {
    setSessionExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      // Suggest weight/reps from previous set in same exercise (the latest one with data)
      const last = [...ex.sets].reverse().find(s => s.weight || s.reps);
      const suggestion = last ? { weight: last.weight, reps: last.reps, completedAt: null } : makeFreshSet();
      return { ...ex, setCount: ex.setCount + 1, sets: [...ex.sets, suggestion] };
    }));
  };

  const removeSet = (exIdx, setIdx) => {
    setSessionExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      const newSets = ex.sets.filter((_, j) => j !== setIdx);
      return { ...ex, setCount: Math.max(0, ex.setCount - 1), sets: newSets };
    }));
  };

  const removeExercise = (exIdx) => {
    setSessionExercises(prev => prev.filter((_, i) => i !== exIdx));
    setActionsTarget(null);
  };

  const addExerciseFromLibrary = (exerciseId) => {
    setSessionExercises(prev => [...prev, makeExerciseEntry(exerciseId, null)]);
    setShowAddExercise(false);
  };

  // ── Rest timer actions ─────────────────────────────────────────────────
  const skipRest = () => setRestTimer(null);
  const restartRest = () => setRestTimer(r => r ? { ...r, startedAt: Date.now(), paused: false } : null);
  const extendRest = (delta) => setRestTimer(r => {
    if (!r) return r;
    if (r.paused) return { ...r, remainingAtPause: (r.remainingAtPause || 0) + delta };
    // Shift the startedAt backwards (negative delta) to effectively add time
    return { ...r, startedAt: r.startedAt + delta * 1000 };
  });

  // ── Finish workout ─────────────────────────────────────────────────────
  const totalCompletedSets = sessionExercises.reduce((s, ex) =>
    s + ex.sets.filter(x => x.completedAt).length, 0);
  const totalPlannedSets = sessionExercises.reduce((s, ex) => s + ex.sets.length, 0);
  const hasUnchecked = totalPlannedSets > totalCompletedSets;

  const finishWorkout = async () => {
    const dateKey = todayKey();
    const session = {
      id: newId(),
      templateId: template?.id || null,
      name: template?.name || T('wr.quickworkout'),
      startedAt: new Date(sessionStartedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      exercises: sessionExercises.map(ex => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets.filter(s => s.completedAt).map(s => ({
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
          completedAt: s.completedAt,
        })),
      })).filter(e => e.sets.length > 0),
    };
    const newSessions = { ...workoutSessions, [dateKey]: session };
    const newLog = { ...(d.workoutLog || {}), [dateKey]: { workoutName: template?.name || T('wr.quickworkout'), completed: true } };
    await saveProfileData({ workoutSessions: newSessions, workoutLog: newLog });
    setShowFinishConfirm(false);
    onFinished?.();
    onClose?.();
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: t.bg, color: t.text,
      display: 'flex', flexDirection: 'column', zIndex: 100,
      fontFamily: 'inherit',
    }}>
      {/* ─── HEADER (sticky) ─────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 5,
        background: t.bg, borderBottom: `1px solid ${t.border}`,
        padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div onClick={() => (hasUnchecked && sessionExercises.length > 0) ? setShowFinishConfirm(true) : onClose?.()} style={{
          width: 36, height: 36, borderRadius: 10, background: t.card2, border: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Icon name="x" size={18} color={t.soft} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: t.orange, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{T('wr.title')}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {template?.name || T('wr.quickworkout')}
          </div>
        </div>
        <div style={{
          padding: '6px 12px', borderRadius: 10, background: t.orangeBg, border: `1px solid ${t.orangeBorder}`,
          color: t.orange, fontWeight: 800, fontSize: 13, fontVariantNumeric: 'tabular-nums',
        }}>
          {formatRestTime(sessionElapsed)}
        </div>
      </div>

      {/* ─── REST BANNER (when timer active) ─────────────────────────────── */}
      {restTimer && (
        <RestBanner
          remaining={restRemaining}
          total={restTimer.totalSec}
          paused={restTimer.paused}
          onSkip={skipRest}
          onRestart={restartRest}
          onExtend={extendRest}
          T={T}
        />
      )}

      {/* ─── BODY (scroll) ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 120px' }}>
        {sessionExercises.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', borderRadius: 16, background: t.card, border: `1px dashed ${t.border}` }}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>🏋️</div>
            <div style={{ fontSize: 14, color: t.text, fontWeight: 600, marginBottom: 6 }}>{T('wr.empty.title')}</div>
            <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5, marginBottom: 16 }}>{T('wr.empty.body')}</div>
            <Btn small accent="orange" onClick={() => setShowAddExercise(true)}>+ {T('wr.addexercise')}</Btn>
          </div>
        ) : (
          <>
            {sessionExercises.map((exEntry, exIdx) => (
              <ExerciseCard
                key={exIdx + ':' + exEntry.exerciseId}
                exEntry={exEntry}
                exIdx={exIdx}
                workoutSessions={workoutSessions}
                onUpdateSet={updateSet}
                onToggleComplete={toggleSetComplete}
                onAddSet={() => addSet(exIdx)}
                onRemoveSet={(setIdx) => removeSet(exIdx, setIdx)}
                onOpenActions={() => setActionsTarget(exIdx)}
                T={T}
              />
            ))}
            <Btn full variant="outline" style={{ marginTop: 8 }} onClick={() => setShowAddExercise(true)}>
              + {T('wr.addexercise')}
            </Btn>
          </>
        )}
      </div>

      {/* ─── FINISH BUTTON (sticky bottom) ───────────────────────────────── */}
      {sessionExercises.length > 0 && (
        <div style={{
          position: 'sticky', bottom: 0, zIndex: 4,
          padding: '12px 16px', background: 'rgba(8,10,14,0.92)',
          backdropFilter: 'blur(20px)', borderTop: `1px solid ${t.border}`,
        }}>
          <Btn full accent="orange" onClick={() => hasUnchecked ? setShowFinishConfirm(true) : finishWorkout()}>
            {T('wr.finish')} ({totalCompletedSets}/{totalPlannedSets})
          </Btn>
        </div>
      )}

      {/* ─── Exercise actions menu ──────────────────────────────────────── */}
      <Modal visible={actionsTarget !== null} onClose={() => setActionsTarget(null)} title={actionsTarget !== null ? getExercise(sessionExercises[actionsTarget]?.exerciseId)?.name || '' : ''} accent="orange">
        <Btn full variant="ghost" accent="orange" style={{ marginBottom: 8 }} onClick={() => { setToast(T('wr.swap.todo')); setTimeout(()=>setToast(''),1800); setActionsTarget(null); }}>{T('wr.action.swap')}</Btn>
        <Btn full variant="ghost" accent="orange" style={{ marginBottom: 8 }} onClick={() => { setToast(T('wr.history.todo')); setTimeout(()=>setToast(''),1800); setActionsTarget(null); }}>{T('wr.action.history')}</Btn>
        <Btn full variant="danger" style={{ marginBottom: 8 }} onClick={() => removeExercise(actionsTarget)}>{T('wr.action.delete')}</Btn>
        <Btn full variant="outline" onClick={() => setActionsTarget(null)}>{T('common.cancel')}</Btn>
      </Modal>

      {/* ─── Finish confirm ──────────────────────────────────────────────── */}
      <Modal visible={showFinishConfirm} onClose={() => setShowFinishConfirm(false)} title={T('wr.finish.confirm')} accent="orange">
        <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.5, marginBottom: 16 }}>
          {hasUnchecked
            ? T('wr.finish.body.unchecked', { done: totalCompletedSets, total: totalPlannedSets })
            : T('wr.finish.body')}
        </div>
        <Btn full accent="orange" style={{ marginBottom: 8 }} onClick={finishWorkout}>{T('wr.finish.yes')}</Btn>
        <Btn full variant="outline" onClick={() => setShowFinishConfirm(false)}>{T('wr.finish.no')}</Btn>
      </Modal>

      {/* ─── Add exercise (full library picker) ──────────────────────────── */}
      <AddExerciseModal
        visible={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onPick={addExerciseFromLibrary}
        T={T}
      />

      <Toast message={toast} visible={!!toast} />
    </div>
  );
}

/* ─────────────────────── RestBanner (top countdown) ─────────────────────── */
function RestBanner({ remaining, total, paused, onSkip, onRestart, onExtend, T }) {
  const pct = total > 0 ? Math.min(100, (1 - remaining / total) * 100) : 100;
  const isOver = remaining === 0;
  return (
    <div style={{
      position: 'sticky', top: 64, zIndex: 4,
      margin: '10px 12px', padding: '12px 14px',
      borderRadius: 14,
      background: isOver ? 'rgba(255,59,92,0.18)' : 'rgba(77,139,250,0.14)',
      border: `1px solid ${isOver ? 'rgba(255,59,92,0.4)' : 'rgba(77,139,250,0.4)'}`,
      backdropFilter: 'blur(20px)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="rest" size={18} color={isOver ? '#FF3B5C' : '#4D8BFA'} />
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: isOver ? '#FF3B5C' : '#4D8BFA' }}>
          {isOver ? T('wr.rest.over') : T('wr.rest.label')}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 22, fontWeight: 800, color: t.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
          {formatRestTime(remaining)}
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: isOver ? '#FF3B5C' : '#4D8BFA',
          transition: 'width 0.5s linear',
        }} />
      </div>
      {/* Action row */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <SmallChip onClick={onSkip}>{T('wr.rest.skip')}</SmallChip>
        <SmallChip onClick={onRestart}>↻ {T('wr.rest.restart')}</SmallChip>
        <SmallChip onClick={() => onExtend(15)}>+15s</SmallChip>
        <SmallChip onClick={() => onExtend(30)}>+30s</SmallChip>
      </div>
    </div>
  );
}

function SmallChip({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '7px 8px', borderRadius: 9,
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
      color: t.text, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
      fontFamily: 'inherit', letterSpacing: '0.02em',
    }}>{children}</button>
  );
}

/* ─────────────────────── ExerciseCard ─────────────────────── */
function ExerciseCard({ exEntry, exIdx, workoutSessions, onUpdateSet, onToggleComplete, onAddSet, onRemoveSet, onOpenActions, T }) {
  const exMeta = getExercise(exEntry.exerciseId);
  const lastSet = useMemo(() => findLastSetFor(exEntry.exerciseId, workoutSessions), [exEntry.exerciseId, workoutSessions]);

  if (!exMeta) {
    return (
      <Card style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: t.muted }}>{T('wr.exercise.missing')}</div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 14, marginBottom: 12 }}>
      {/* Header row: thumbnail placeholder + name + ⋯ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <ExerciseThumb exercise={exMeta} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
            {exMeta.name}
          </div>
          <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>
            {T('wr.ex.target', { range: exEntry.repRange })} · {formatRestTime(exEntry.restSec)} {T('wr.ex.rest')}
          </div>
        </div>
        <div onClick={onOpenActions} style={{
          width: 32, height: 32, borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: t.soft, fontSize: 18, cursor: 'pointer',
          letterSpacing: '0.1em',
        }}>⋯</div>
      </div>

      {/* Previous session hint */}
      {lastSet && (
        <div style={{
          fontSize: 11, color: '#4D8BFA', marginBottom: 10,
          padding: '6px 10px', background: 'rgba(77,139,250,0.08)',
          border: '1px solid rgba(77,139,250,0.22)', borderRadius: 8,
        }}>
          {T('wr.lastsession', { weight: lastSet.weight, reps: lastSet.reps })}
        </div>
      )}

      {/* Sets header */}
      <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 44px 32px', gap: 8, alignItems: 'center', padding: '4px 4px 6px', fontSize: 10, color: t.muted, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        <div>{T('wr.set')}</div>
        <div>{T('wr.weight')}</div>
        <div>{T('wr.reps')}</div>
        <div style={{ textAlign: 'center' }}>{T('wr.done')}</div>
        <div></div>
      </div>

      {/* Set rows */}
      {exEntry.sets.map((s, setIdx) => {
        const isDone = !!s.completedAt;
        return (
          <div key={setIdx} style={{
            display: 'grid', gridTemplateColumns: '36px 1fr 1fr 44px 32px', gap: 8, alignItems: 'center',
            padding: '6px 4px', borderTop: setIdx > 0 ? `1px solid ${t.border}` : 'none',
            background: isDone ? 'rgba(77,139,250,0.06)' : 'transparent',
            borderRadius: isDone ? 8 : 0,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: isDone ? '#4D8BFA' : t.soft, textAlign: 'center' }}>{setIdx + 1}</div>
            <input
              type="number" inputMode="decimal" placeholder="kg"
              value={s.weight}
              onChange={e => onUpdateSet(exIdx, setIdx, { weight: e.target.value })}
              disabled={isDone}
              style={{
                padding: '9px 10px', borderRadius: 8,
                background: isDone ? 'rgba(255,255,255,0.04)' : t.card2,
                border: `1px solid ${t.border}`, color: t.text, fontSize: 14,
                fontFamily: 'inherit', boxSizing: 'border-box', width: '100%',
                opacity: isDone ? 0.7 : 1,
              }}
            />
            <input
              type="number" inputMode="numeric" placeholder="reps"
              value={s.reps}
              onChange={e => onUpdateSet(exIdx, setIdx, { reps: e.target.value })}
              disabled={isDone}
              style={{
                padding: '9px 10px', borderRadius: 8,
                background: isDone ? 'rgba(255,255,255,0.04)' : t.card2,
                border: `1px solid ${t.border}`, color: t.text, fontSize: 14,
                fontFamily: 'inherit', boxSizing: 'border-box', width: '100%',
                opacity: isDone ? 0.7 : 1,
              }}
            />
            <div onClick={() => onToggleComplete(exIdx, setIdx)} style={{
              width: 34, height: 34, margin: '0 auto', borderRadius: 9,
              background: isDone ? '#4D8BFA' : 'transparent',
              border: `2px solid ${isDone ? '#4D8BFA' : t.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {isDone && <Icon name="check" size={18} color="#0A0A0B" stroke={3} />}
            </div>
            <div onClick={() => onRemoveSet(exIdx, setIdx)} style={{
              width: 26, height: 26, margin: '0 auto', borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: t.muted, cursor: 'pointer', fontSize: 16,
            }}>×</div>
          </div>
        );
      })}

      {/* + Add Set */}
      <div onClick={onAddSet} style={{
        marginTop: 8, padding: '8px', textAlign: 'center', borderRadius: 8,
        border: `1px dashed ${t.border}`, color: t.soft, fontSize: 12, fontWeight: 600,
        cursor: 'pointer',
      }}>
        + {T('wr.addset')}
      </div>
    </Card>
  );
}

/* ─────────────────────── ExerciseThumb (placeholder) ─────────────────────── */
function ExerciseThumb({ exercise }) {
  // Future: render video_url / thumbnail_url if available
  // For now: muscle-group gradient + workout icon
  const mgColor = {
    chest: '#FF3B5C', back: '#4D8BFA', shoulders: '#5EE3F5',
    arms: '#B8C2D6', legs: '#FF3B5C', core: '#4D8BFA', cardio: '#5EE3F5',
  }[exercise.primaryMuscle] || t.silver;
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 11, flexShrink: 0,
      background: `linear-gradient(135deg, ${mgColor}33, ${mgColor}11)`,
      border: `1px solid ${mgColor}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name="workout" size={20} color={mgColor} />
    </div>
  );
}

/* ─────────────────────── AddExerciseModal ─────────────────────── */
function AddExerciseModal({ visible, onClose, onPick, T }) {
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState('all');
  const list = useMemo(() => {
    const ql = q.toLowerCase().trim();
    let l = EXERCISE_LIBRARY;
    if (muscle !== 'all') l = l.filter(e => e.primaryMuscle === muscle);
    if (ql) l = l.filter(e => e.name.toLowerCase().includes(ql));
    return l.slice(0, 60);
  }, [q, muscle]);
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(8,10,14,0.92)', zIndex: 200,
      display: 'flex', flexDirection: 'column', backdropFilter: 'blur(20px)',
    }}>
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${t.border}` }}>
        <div onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: t.card2, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="x" size={18} color={t.soft} />
        </div>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 800, color: t.text }}>{T('wr.lib.title')}</div>
      </div>
      <div style={{ padding: '12px 16px 0' }}>
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={T('wr.lib.search')}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: t.card2, border: `1px solid ${t.border}`, color: t.text, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
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
            <ExerciseThumb exercise={e} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{e.name}</div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>
                {T(`wr.mg.${e.primaryMuscle}`)} · {e.equipment} · {e.defaultRepRange}
              </div>
            </div>
            <Icon name="chevR" size={14} color={t.muted} />
          </div>
        ))}
        {list.length === 0 && (
          <div style={{ padding: 30, textAlign: 'center', color: t.muted, fontSize: 13 }}>
            {T('wr.lib.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
