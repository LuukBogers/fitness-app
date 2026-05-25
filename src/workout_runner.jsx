import { useState, useEffect, useRef, useMemo } from "react";
import { t, useApp, useT, todayKey, newId } from './lib';
import { Icon, Card, Btn, Modal, Pill, LetterBadge, VideoThumb, ActionSheet } from './shared';
import { Toast } from './modals';
import { EXERCISE_LIBRARY, getExercise, formatRestTime, findLastSetFor } from './exercise_library';

/* ═══════════════════════════════════════════════════════════════════════════
 * WORKOUT RUNNER — premium gym-flow screen
 *
 * Reference: 9 user screenshots — Hevy-style layout with brown metadata pills,
 * letter labels A/B/C/D, green completed sets, BW checkbox, video thumbnails.
 *
 * Interaction rules (per workout-rest-timer-setflow.md):
 *  - Tap check → save w+r, completedAt=now, row turns green, rest timer auto-starts
 *  - Rest banner sticky top with countdown, skip/restart/+15/+30, beep+vibrate at 0
 *  - Close (X): if any sets logged → ActionSheet (Save / Delete / Cancel)
 *  - Save → persist to profile.data.inProgressWorkout (resumable next session)
 *  - + Add Set / + Add Exercise / Complete Workout
 * ═══════════════════════════════════════════════════════════════════════════ */

const DEFAULT_SET_COUNT = 3;

function makeFreshSet() {
  return { weight: '', reps: '', completedAt: null };
}

function makeExerciseEntry(exerciseId, planned, savedSets = null) {
  const ex = getExercise(exerciseId);
  const setCount = planned?.setCount || DEFAULT_SET_COUNT;
  const sets = savedSets && savedSets.length > 0
    ? savedSets.map(s => ({ weight: s.weight || '', reps: s.reps || '', completedAt: s.completedAt || null }))
    : Array.from({ length: setCount }, makeFreshSet);
  return {
    exerciseId,
    setCount: sets.length,
    repRange: planned?.repRange || ex?.defaultRepRange || '8-12',
    restSec: planned?.restSec || ex?.defaultRestSec || 120,
    tempo: planned?.tempo || ex?.defaultTempo || '',
    warmupSets: planned?.warmupSets || 0,
    warmupRepsMax: planned?.warmupRepsMax || 6,
    isBodyweight: planned?.isBodyweight || ex?.isBodyweight || false,
    bwEnabled: planned?.bwEnabled || false,
    sets,
  };
}

export function WorkoutRunner({ visible, onClose, template, onFinished, resumeFrom = null }) {
  const T = useT();
  const { profile, saveProfileData } = useApp();
  const d = profile?.data || {};
  const workoutSessions = d.workoutSessions || {};

  // ── Session state ──────────────────────────────────────────────────────
  const [sessionExercises, setSessionExercises] = useState([]);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [restTimer, setRestTimer] = useState(null);
  const [showCloseSheet, setShowCloseSheet] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [actionsTarget, setActionsTarget] = useState(null);
  const [toast, setToast] = useState('');

  // Initialize / reset on open
  useEffect(() => {
    if (!visible) return;
    if (resumeFrom && Array.isArray(resumeFrom.sessionExercises)) {
      // Resuming a previously-saved in-progress workout
      setSessionExercises(resumeFrom.sessionExercises);
      setSessionStartedAt(resumeFrom.startedAt ? new Date(resumeFrom.startedAt).getTime() : Date.now());
    } else if (template && Array.isArray(template.exercises) && template.exercises.length > 0) {
      const normalized = template.exercises.map(ex => {
        if (typeof ex === 'string') {
          const lq = ex.toLowerCase();
          const match = EXERCISE_LIBRARY.find(e => e.name.toLowerCase() === lq)
                     || EXERCISE_LIBRARY.find(e => e.name.toLowerCase().includes(lq) || lq.includes(e.name.toLowerCase()));
          return makeExerciseEntry(match ? match.id : null, null);
        }
        return makeExerciseEntry(ex.exerciseId, ex);
      }).filter(e => e.exerciseId);
      setSessionExercises(normalized);
      setSessionStartedAt(Date.now());
    } else {
      setSessionExercises([]);
      setSessionStartedAt(Date.now());
    }
    setRestTimer(null);
    setShowCloseSheet(false);
    setShowFinishConfirm(false);
  }, [visible, template, resumeFrom]);

  // 1Hz tick
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [visible]);

  const sessionElapsed = sessionStartedAt ? Math.floor((nowTick - sessionStartedAt) / 1000) : 0;

  const restRemaining = (() => {
    if (!restTimer || !restTimer.startedAt) return 0;
    if (restTimer.paused) return restTimer.remainingAtPause || 0;
    const elapsedRest = Math.floor((nowTick - restTimer.startedAt) / 1000);
    return Math.max(0, restTimer.totalSec - elapsedRest);
  })();

  // End-of-rest cue
  const prevRemainingRef = useRef(restRemaining);
  useEffect(() => {
    if (!restTimer || restTimer.paused) { prevRemainingRef.current = restRemaining; return; }
    if (prevRemainingRef.current > 0 && restRemaining === 0) {
      try { if (navigator.vibrate) navigator.vibrate([180, 80, 180]); } catch {}
      try {
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
      } catch {}
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
      updateSet(exIdx, setIdx, { completedAt: null });
      return;
    }
    if (!s.weight && !s.reps && !ex.bwEnabled) {
      setToast(T('wr.set.needsdata'));
      setTimeout(() => setToast(''), 1800);
      return;
    }
    updateSet(exIdx, setIdx, { completedAt: new Date().toISOString() });
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

  const toggleBw = (exIdx) => {
    setSessionExercises(prev => prev.map((ex, i) =>
      i !== exIdx ? ex : { ...ex, bwEnabled: !ex.bwEnabled }
    ));
  };

  // ── Rest timer actions ─────────────────────────────────────────────────
  const skipRest = () => setRestTimer(null);
  const restartRest = () => setRestTimer(r => r ? { ...r, startedAt: Date.now(), paused: false } : null);
  const extendRest = (delta) => setRestTimer(r => {
    if (!r) return r;
    if (r.paused) return { ...r, remainingAtPause: (r.remainingAtPause || 0) + delta };
    return { ...r, startedAt: r.startedAt + delta * 1000 };
  });

  // ── Close flow ─────────────────────────────────────────────────────────
  const totalCompletedSets = sessionExercises.reduce((s, ex) =>
    s + ex.sets.filter(x => x.completedAt).length, 0);
  const totalPlannedSets = sessionExercises.reduce((s, ex) => s + ex.sets.length, 0);
  const hasAnyData = sessionExercises.some(ex => ex.sets.some(s => s.weight || s.reps || s.completedAt));

  const onTapClose = () => {
    if (hasAnyData) setShowCloseSheet(true);
    else onClose?.();
  };

  const closeSaveAsDraft = async () => {
    const draft = {
      id: newId(),
      templateId: template?.id || null,
      name: template?.name || T('wr.quickworkout'),
      startedAt: new Date(sessionStartedAt).toISOString(),
      savedAt: new Date().toISOString(),
      sessionExercises,
    };
    await saveProfileData({ inProgressWorkout: draft });
    setShowCloseSheet(false);
    onClose?.();
  };

  const closeDelete = async () => {
    // Clear any saved in-progress (we discarded it)
    if (d.inProgressWorkout) {
      await saveProfileData({ inProgressWorkout: null });
    }
    setShowCloseSheet(false);
    onClose?.();
  };

  // ── Finish workout ─────────────────────────────────────────────────────
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
    await saveProfileData({ workoutSessions: newSessions, workoutLog: newLog, inProgressWorkout: null });
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
        padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div onClick={onTapClose} style={{
          width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Icon name="chevL" size={22} color={t.orange} stroke={2.4} />
        </div>
        <div style={{ flex: 1, textAlign: 'center', overflow: 'hidden' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
            {template?.name || T('wr.quickworkout')}
          </div>
        </div>
        <div style={{
          padding: '6px 12px', borderRadius: 12, background: t.pill, border: `1px solid ${t.pillBorder}`,
          color: t.pillText, fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums',
          display: 'flex', alignItems: 'baseline', gap: 4,
        }}>
          <span>{formatRestTime(sessionElapsed)}</span>
          <span style={{ fontSize: 10, opacity: 0.7 }}>00</span>
        </div>
        <div style={{
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Icon name="rest" size={22} color={t.orange} stroke={2.2} />
        </div>
      </div>

      {/* ─── REST BANNER ──────────────────────────────────────────────────── */}
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

      {/* ─── BODY ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 140px' }}>
        {/* Section label */}
        <div style={{ fontSize: 16, fontWeight: 700, color: t.soft, padding: '4px 4px 10px', letterSpacing: '-0.01em' }}>
          {T('wr.section.workout')}
        </div>

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
                letter={String.fromCharCode(65 + exIdx)}
                workoutSessions={workoutSessions}
                onUpdateSet={updateSet}
                onToggleComplete={toggleSetComplete}
                onToggleBw={() => toggleBw(exIdx)}
                onAddSet={() => addSet(exIdx)}
                onRemoveSet={(setIdx) => removeSet(exIdx, setIdx)}
                onOpenActions={() => setActionsTarget(exIdx)}
                T={T}
              />
            ))}
            <Btn full variant="ghost" accent="orange" style={{ marginTop: 4, marginBottom: 14 }} onClick={() => setShowAddExercise(true)}>
              + {T('wr.addexercise')}
            </Btn>
          </>
        )}
      </div>

      {/* ─── COMPLETE WORKOUT (sticky bottom) ────────────────────────────── */}
      {sessionExercises.length > 0 && (
        <div style={{
          position: 'sticky', bottom: 0, zIndex: 4,
          padding: '14px 14px 16px', background: 'linear-gradient(to top, rgba(8,10,14,0.98) 70%, rgba(8,10,14,0))',
        }}>
          <Btn full accent="orange" onClick={() => hasUnchecked ? setShowFinishConfirm(true) : finishWorkout()} style={{ fontSize: 15, padding: '14px' }}>
            {T('wr.finish')}
          </Btn>
        </div>
      )}

      {/* ─── Close ActionSheet (Save/Delete/Cancel) ──────────────────────── */}
      <ActionSheet
        visible={showCloseSheet}
        onClose={() => setShowCloseSheet(false)}
        title={T('wr.close.title')}
        subtitle={T('wr.close.body')}
        actions={[
          { label: T('wr.close.save'),   color: 'orange', onPress: closeSaveAsDraft },
          { label: T('wr.close.delete'), color: 'red',    onPress: closeDelete },
          { label: T('common.cancel'),   color: 'orange', onPress: () => setShowCloseSheet(false) },
        ]}
      />

      {/* ─── Exercise actions ⋯ menu ─────────────────────────────────────── */}
      <Modal visible={actionsTarget !== null} onClose={() => setActionsTarget(null)} title={actionsTarget !== null ? getExercise(sessionExercises[actionsTarget]?.exerciseId)?.name || '' : ''} accent="orange">
        <Btn full variant="ghost" accent="orange" style={{ marginBottom: 8 }} onClick={() => { setToast(T('wr.swap.todo')); setTimeout(()=>setToast(''),1800); setActionsTarget(null); }}>{T('wr.action.swap')}</Btn>
        <Btn full variant="ghost" accent="orange" style={{ marginBottom: 8 }} onClick={() => { setToast(T('wr.history.todo')); setTimeout(()=>setToast(''),1800); setActionsTarget(null); }}>{T('wr.action.history')}</Btn>
        <Btn full variant="danger" style={{ marginBottom: 8 }} onClick={() => removeExercise(actionsTarget)}>{T('wr.action.delete')}</Btn>
        <Btn full variant="outline" onClick={() => setActionsTarget(null)}>{T('common.cancel')}</Btn>
      </Modal>

      {/* ─── Finish confirm ──────────────────────────────────────────────── */}
      <ActionSheet
        visible={showFinishConfirm}
        onClose={() => setShowFinishConfirm(false)}
        title={T('wr.finish.confirm')}
        subtitle={hasUnchecked
          ? T('wr.finish.body.unchecked', { done: totalCompletedSets, total: totalPlannedSets })
          : T('wr.finish.body')}
        actions={[
          { label: T('wr.finish.yes'), color: 'orange', onPress: finishWorkout },
          { label: T('wr.finish.no'),  color: 'muted',  onPress: () => setShowFinishConfirm(false) },
        ]}
      />

      {/* ─── Add exercise picker ─────────────────────────────────────────── */}
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

/* ─────────────────────── RestBanner ─────────────────────── */
function RestBanner({ remaining, total, paused, onSkip, onRestart, onExtend, T }) {
  const pct = total > 0 ? Math.min(100, (1 - remaining / total) * 100) : 100;
  const isOver = remaining === 0;
  return (
    <div style={{
      position: 'sticky', top: 64, zIndex: 4,
      margin: '10px 12px', padding: '12px 14px',
      borderRadius: 14,
      background: isOver ? 'rgba(52,199,89,0.18)' : 'rgba(255,59,92,0.14)',
      border: `1px solid ${isOver ? 'rgba(52,199,89,0.45)' : 'rgba(255,59,92,0.35)'}`,
      backdropFilter: 'blur(20px)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="rest" size={18} color={isOver ? '#34C759' : '#FF3B5C'} />
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: isOver ? '#34C759' : '#FF3B5C' }}>
          {isOver ? T('wr.rest.over') : T('wr.rest.label')}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 22, fontWeight: 800, color: t.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
          {formatRestTime(remaining)}
        </div>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: isOver ? '#34C759' : '#FF3B5C',
          transition: 'width 0.5s linear',
        }} />
      </div>
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
function ExerciseCard({ exEntry, exIdx, letter, workoutSessions, onUpdateSet, onToggleComplete, onToggleBw, onAddSet, onRemoveSet, onOpenActions, T }) {
  const exMeta = getExercise(exEntry.exerciseId);
  const lastSet = useMemo(() => findLastSetFor(exEntry.exerciseId, workoutSessions), [exEntry.exerciseId, workoutSessions]);

  if (!exMeta) {
    return (
      <Card style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: t.muted }}>{T('wr.exercise.missing')}</div>
      </Card>
    );
  }

  const totalSets = exEntry.sets.length;
  const restLabel = exEntry.restSec >= 60
    ? `${Math.floor(exEntry.restSec / 60)}m${exEntry.restSec % 60 ? ' ' + (exEntry.restSec % 60) + 's' : ''}`
    : `${exEntry.restSec}s`;

  return (
    <Card style={{ padding: 14, marginBottom: 14 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <VideoThumb exercise={exMeta} size="md" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, fontSize: 16, fontWeight: 800, color: t.text, lineHeight: 1.25, letterSpacing: '-0.01em' }}>
              {exMeta.name}
            </div>
            <div onClick={onOpenActions} style={{
              padding: '0 6px', color: t.soft, fontSize: 20, cursor: 'pointer',
              letterSpacing: '0.1em', lineHeight: 1,
            }}>⋯</div>
            <LetterBadge letter={letter} />
          </div>
          {/* Metadata pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            <Pill>{T('wr.pill.sets')}: {totalSets}</Pill>
            <Pill>{T('wr.pill.reps')}: {exEntry.repRange}</Pill>
            <Pill>{T('wr.pill.rest')}: {restLabel}</Pill>
            {exEntry.tempo && <Pill>{T('wr.pill.tempo')}: {exEntry.tempo}</Pill>}
          </div>
        </div>
      </div>

      {/* Warm-up sets hint */}
      {exEntry.warmupSets > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 2px 10px', borderTop: `1px solid ${t.border}`, marginTop: 4 }}>
          <div style={{ fontSize: 11.5, color: t.muted }}>
            {T('wr.warmupsets', { count: exEntry.warmupSets, max: exEntry.warmupRepsMax })}
          </div>
        </div>
      )}

      {/* BW toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, padding: '0 2px 8px' }}>
        <div onClick={onToggleBw} style={{
          width: 20, height: 20, borderRadius: 5,
          border: `1.5px solid ${exEntry.bwEnabled ? t.orange : t.border}`,
          background: exEntry.bwEnabled ? t.orange : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          {exEntry.bwEnabled && <Icon name="check" size={12} color="#FFF" stroke={3} />}
        </div>
        <div style={{ fontSize: 11.5, color: t.soft, fontWeight: 600 }}>BW</div>
      </div>

      {/* Set rows */}
      {exEntry.sets.map((s, setIdx) => {
        const isDone = !!s.completedAt;
        return (
          <div key={setIdx} style={{
            display: 'grid', gridTemplateColumns: '32px 1fr 1fr 44px 24px', gap: 8, alignItems: 'center',
            padding: '8px 4px', borderTop: setIdx > 0 ? `1px solid ${t.border}` : 'none',
            background: isDone ? t.setDoneBg : 'transparent',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: isDone ? t.setDone : t.soft, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
              {(setIdx + 1).toString().padStart(2, '0')}
            </div>
            <SetInput
              value={s.weight}
              onChange={v => onUpdateSet(exIdx, setIdx, { weight: v })}
              placeholder="kg"
              suffix="kg"
              disabled={isDone}
              done={isDone}
            />
            <SetInput
              value={s.reps}
              onChange={v => onUpdateSet(exIdx, setIdx, { reps: v })}
              placeholder="reps"
              suffix="reps"
              disabled={isDone}
              done={isDone}
            />
            <div onClick={() => onToggleComplete(exIdx, setIdx)} style={{
              width: 32, height: 32, margin: '0 auto', borderRadius: 16,
              background: isDone ? t.setDone : 'transparent',
              border: `1.5px solid ${isDone ? t.setDone : t.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <Icon name="check" size={isDone ? 16 : 13} color={isDone ? '#FFF' : t.muted} stroke={isDone ? 3 : 2} />
            </div>
            <div onClick={() => onRemoveSet(exIdx, setIdx)} style={{
              width: 22, height: 22, margin: '0 auto', borderRadius: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: t.muted, cursor: 'pointer', fontSize: 14, opacity: 0.5,
            }}>×</div>
          </div>
        );
      })}

      {/* Previous session hint (subtle, below sets) */}
      {lastSet && (
        <div style={{
          fontSize: 10.5, color: t.muted, marginTop: 8, padding: '4px 2px',
          fontStyle: 'italic',
        }}>
          {T('wr.lastsession', { weight: lastSet.weight, reps: lastSet.reps })}
        </div>
      )}

      {/* + Add Set (brown rounded button) */}
      <div onClick={onAddSet} style={{
        marginTop: 10, padding: '12px', textAlign: 'center', borderRadius: 12,
        background: t.pill, border: `1px solid ${t.pillBorder}`,
        color: t.pillText, fontSize: 13.5, fontWeight: 600,
        cursor: 'pointer',
      }}>
        + {T('wr.addset')}
      </div>
    </Card>
  );
}

function SetInput({ value, onChange, placeholder, suffix, disabled, done }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type="number" inputMode="decimal" placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%', padding: '9px 30px 9px 12px', borderRadius: 8,
          background: done ? 'rgba(52,199,89,0.06)' : t.card2,
          border: `1px solid ${done ? t.setDoneBorder : t.border}`,
          color: t.text, fontSize: 15, fontWeight: 600,
          fontFamily: 'inherit', boxSizing: 'border-box',
          textAlign: 'center',
        }}
      />
      {value && (
        <div style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          fontSize: 11, color: t.muted, pointerEvents: 'none', fontWeight: 500,
        }}>{suffix}</div>
      )}
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
      position: 'fixed', inset: 0, background: 'rgba(8,10,14,0.94)', zIndex: 200,
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
          autoFocus value={q} onChange={e => setQ(e.target.value)}
          placeholder={T('wr.lib.search')}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: t.card2, border: `1px solid ${t.border}`, color: t.text, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
          <FilterChip active={muscle === 'all'} onClick={() => setMuscle('all')}>{T('wr.lib.all')}</FilterChip>
          {['chest','back','shoulders','arms','legs','core','cardio'].map(mg => (
            <FilterChip key={mg} active={muscle === mg} onClick={() => setMuscle(mg)}>{T(`wr.mg.${mg}`)}</FilterChip>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 32px' }}>
        {list.map(e => (
          <div key={e.id} onClick={() => onPick(e.id)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 10, marginBottom: 8,
            background: t.card, borderRadius: 12, border: `1px solid ${t.border}`, cursor: 'pointer',
          }}>
            <VideoThumb exercise={e} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
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

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 12px', borderRadius: 18, whiteSpace: 'nowrap',
      background: active ? t.orangeBg : t.card2,
      border: `1px solid ${active ? t.orangeBorder : t.border}`,
      color: active ? t.orange : t.soft, fontSize: 12, fontWeight: 700,
      cursor: 'pointer', fontFamily: 'inherit',
    }}>{children}</button>
  );
}
