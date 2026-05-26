import { useState, useEffect, useRef, useMemo } from "react";
import { t, useApp, useT, todayKey, newId } from './lib';
import { Icon, Card, Btn, Modal, Pill, LetterBadge, VideoThumb, ActionSheet } from './shared';
import { Toast } from './modals';
import { EXERCISE_LIBRARY, getExercise, formatRestTime, findLastSetFor } from './exercise_library';
import { ExerciseDetail } from './exercise_detail';
import {
  ensureProgressionShape, detectPR, checkSanity, calculateEpley,
  processWorkoutCompletion, prPostWorkoutHeadline, PR_TYPES,
  generateTimelineEntries,
} from './pr';

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
  const [detailExId, setDetailExId] = useState(null);
  const [toast, setToast] = useState('');

  // ── PR / progression state (resets each workout) ──────────────────────
  const [inFlowPR, setInFlowPR] = useState(null);          // { exIdx, setIdx, type, newValue } | null
  const [inFlowPRShown, setInFlowPRShown] = useState(false); // one in-flow per workout
  const [pendingSanity, setPendingSanity] = useState(null); // { exIdx, setIdx, setData, reason, delta } | null
  const [postSummary, setPostSummary] = useState(null);     // { session, prEvents, totalVolume, durationSec, statsBefore } | null

  // Current bodyweight (for compound strength ratio + sanity weight check)
  const currentBodyweight = useMemo(() => {
    const arr = Array.isArray(d.weights) ? d.weights : [];
    if (arr.length > 0) return Number(arr[arr.length - 1].weight) || 0;
    return Number(d.weight) || 0;
  }, [d.weights, d.weight]);

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
    setInFlowPR(null);
    setInFlowPRShown(false);
    setPendingSanity(null);
    setPostSummary(null);
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

    // ── PR detection BEFORE persisting the set ──────────────────────────
    const exId = ex.exerciseId;
    const stats = (d.exerciseStats || {})[exId] || null;
    // Session volume for this exercise = already-completed sets + this new set
    const newSetVol = (Number(s.weight) || 0) * (Number(s.reps) || 0);
    const priorVol = ex.sets.reduce((sum, x, i) => {
      if (i === setIdx) return sum;
      if (!x.completedAt) return sum;
      return sum + (Number(x.weight) || 0) * (Number(x.reps) || 0);
    }, 0);
    const sessionVolForEx = priorVol + newSetVol;

    const pr = detectPR({ stats, set: s, sessionVolumeForExercise: sessionVolForEx });

    // ── Sanity check (only if PR detected — saves cycles) ───────────────
    if (pr) {
      const sanity = checkSanity({
        newEst1RM: calculateEpley(s.weight, s.reps),
        currentEst1RM: stats?.est1RM || 0,
        weight: Number(s.weight) || 0,
        bodyweight: currentBodyweight,
      });
      if (sanity.suspicious) {
        // Block persistence — wait for user confirmation. Set is NOT saved
        // yet (this aligns with blueprint: never auto-skip set, only PR).
        setPendingSanity({
          exIdx, setIdx,
          setData: s,
          reason: sanity.reason,
          delta: sanity.delta || 0,
        });
        return;
      }
    }

    // ── Persist set + start rest timer ─────────────────────────────────
    updateSet(exIdx, setIdx, { completedAt: new Date().toISOString() });
    setRestTimer({
      exerciseIdx: exIdx,
      setIdx,
      totalSec: ex.restSec || 120,
      startedAt: Date.now(),
      paused: false,
    });

    // ── In-flow PR moment (max 1 per workout) ──────────────────────────
    if (pr && !inFlowPRShown) {
      setInFlowPR({ exIdx, setIdx, type: pr.type, newValue: pr.newValue });
      setInFlowPRShown(true);
      try { if (navigator.vibrate) navigator.vibrate(60); } catch {}
      setTimeout(() => setInFlowPR(null), 2000);
    }
  };

  // Sanity prompt handlers
  const confirmSanity = () => {
    if (!pendingSanity) return;
    const { exIdx, setIdx, setData } = pendingSanity;
    const exNow = sessionExercises[exIdx];
    updateSet(exIdx, setIdx, { completedAt: new Date().toISOString() });
    setRestTimer({
      exerciseIdx: exIdx,
      setIdx,
      totalSec: exNow?.restSec || 120,
      startedAt: Date.now(),
      paused: false,
    });
    setPendingSanity(null);
    // Suspicious PRs are never surfaced in-flow (only post-workout).
  };

  const editSanity = () => setPendingSanity(null);

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
    setShowCloseSheet(true);
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

    // ── Run progression pipeline ────────────────────────────────────────
    const profileData = ensureProgressionShape(d);
    const result = processWorkoutCompletion({
      session,
      profileData,
      bodyweight: currentBodyweight,
    });

    const newExerciseStats   = { ...profileData.exerciseStats,   ...result.exerciseStatsUpdates };
    const newCompoundStrength = { ...profileData.compoundStrength, ...result.compoundStrengthUpdates };
    const newPrEvents = [...profileData.prEvents, ...result.prEvents];
    const newSessions = { ...workoutSessions, [dateKey]: session };
    const newLog = {
      ...(d.workoutLog || {}),
      [dateKey]: { workoutName: template?.name || T('wr.quickworkout'), completed: true },
    };

    // ── Generate identity-evidence timeline entries (idempotent) ────────
    // Run against the post-write snapshot so today's session is visible to
    // the long-term-consistency / strength-recomp triggers.
    const postWriteData = {
      ...profileData,
      exerciseStats: newExerciseStats,
      prEvents: newPrEvents,
      workoutSessions: newSessions,
      workoutLog: newLog,
    };
    const newTimelineEntries = generateTimelineEntries(postWriteData);
    const newTimeline = [...profileData.timeline, ...newTimelineEntries];

    await saveProfileData({
      exerciseStats: newExerciseStats,
      compoundStrength: newCompoundStrength,
      prEvents: newPrEvents,
      timeline: newTimeline,
      workoutSessions: newSessions,
      workoutLog: newLog,
      inProgressWorkout: null,
    });

    // Build summary data — modal blocks runner-close until user taps Continue.
    const durationSec = Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000));
    setPostSummary({
      session,
      prEvents: result.prEvents,
      totalVolume: result.totalSessionVolume,
      durationSec,
      exerciseCount: session.exercises.length,
    });
    setShowFinishConfirm(false);
  };

  const dismissSummary = () => {
    setPostSummary(null);
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
                onOpenDetail={() => setDetailExId(exEntry.exerciseId)}
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

      {/* In-flow PR moment — subtle floating banner */}
      <InFlowPRBanner pr={inFlowPR} T={T} />

      {/* Sanity-check prompt for suspicious PRs */}
      <ActionSheet
        visible={!!pendingSanity}
        onClose={editSanity}
        title={T('sanity.title')}
        subtitle={pendingSanity ? buildSanityBody(pendingSanity, T) : ''}
        actions={[
          { label: T('sanity.confirm'), color: 'orange', onPress: confirmSanity },
          { label: T('sanity.edit'),    color: 'muted',  onPress: editSanity },
        ]}
      />

      {/* Cinematic post-workout summary */}
      {postSummary && (
        <PostWorkoutSummary
          data={postSummary}
          T={T}
          onDismiss={dismissSummary}
        />
      )}

      {/* Exercise detail modal */}
      {detailExId && <ExerciseDetail exerciseId={detailExId} onClose={() => setDetailExId(null)} />}
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
function ExerciseCard({ exEntry, exIdx, letter, workoutSessions, onUpdateSet, onToggleComplete, onToggleBw, onAddSet, onRemoveSet, onOpenActions, onOpenDetail, T }) {
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
        <div onClick={onOpenDetail} style={{ cursor: 'pointer' }}>
          <VideoThumb exercise={exMeta} size="md" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div onClick={onOpenDetail} style={{ flex: 1, fontSize: 16, fontWeight: 800, color: t.text, lineHeight: 1.25, letterSpacing: '-0.01em', cursor: 'pointer' }}>
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

/* ═══════════════════════════ PR MOMENT — in-flow banner ═══════════════════════════
 * Subtle floating banner that fades in after a set-complete that triggered a
 * PR. Max one per workout. Blueprint DNA: calm motion, soft glow, no popup.
 */

const PR_TYPE_TO_KEY = {
  [PR_TYPES.HEAVIEST_WEIGHT]: 'pr.type.heaviest',
  [PR_TYPES.EST_1RM]:         'pr.type.est1rm',
  [PR_TYPES.BEST_VOLUME]:     'pr.type.volume',
};

function InFlowPRBanner({ pr, T }) {
  const visible = !!pr;
  return (
    <div style={{
      position: 'fixed', top: 76, left: 16, right: 16, zIndex: 50,
      pointerEvents: 'none',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-8px)',
      transition: 'opacity 380ms ease-out, transform 380ms ease-out',
    }}>
      <div style={{
        background: 'rgba(20, 24, 33, 0.86)',
        backdropFilter: 'blur(22px) saturate(160%)',
        WebkitBackdropFilter: 'blur(22px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 18, padding: '14px 18px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.55), inset 0 1px 0 0 rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: 4,
          background: '#4D8BFA',
          boxShadow: '0 0 14px #4D8BFA',
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 9.5, fontWeight: 800, color: '#6FA0FF',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            marginBottom: 3,
          }}>
            {T('pr.new')}
          </div>
          <div style={{
            fontSize: 13, color: t.text, fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {pr ? T(PR_TYPE_TO_KEY[pr.type] || 'pr.new') : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildSanityBody(sanity, T) {
  if (!sanity || !sanity.setData) return '';
  const w = Number(sanity.setData.weight) || 0;
  const r = Number(sanity.setData.reps) || 0;
  if (sanity.reason === '1RM_JUMP') {
    return T('sanity.body.jump', { delta: sanity.delta, weight: w, reps: r });
  }
  return T('sanity.body.weight', { weight: w, reps: r });
}

/* ═══════════════════════════ POST-WORKOUT SUMMARY ═══════════════════════════
 * Cinematic recap shown after Complete Workout. Visual DNA: dark matte glass,
 * editorial typography, slow reveal, 1 hero stat → identity sentence → metrics.
 */

const IDENTITY_KEYS = [
  'summary.identity.1', 'summary.identity.2',
  'summary.identity.3', 'summary.identity.4',
];

function pickIdentityKey(data) {
  // Deterministic — same workout always shows same sentence.
  const seed = (data?.session?.id || '').length + (data?.totalVolume || 0);
  return IDENTITY_KEYS[seed % IDENTITY_KEYS.length];
}

function pickHeroPR(prEvents) {
  if (!Array.isArray(prEvents) || prEvents.length === 0) return null;
  // Priority: 1RM > heaviest weight > volume
  return prEvents.find(p => p.type === PR_TYPES.EST_1RM)
      || prEvents.find(p => p.type === PR_TYPES.HEAVIEST_WEIGHT)
      || prEvents.find(p => p.type === PR_TYPES.BEST_VOLUME)
      || null;
}

function formatHero(hero) {
  if (!hero) return null;
  if (hero.type === PR_TYPES.BEST_VOLUME) {
    return { value: Math.round(hero.newValue).toLocaleString('en-US'), unit: 'kg' };
  }
  return { value: Number(hero.newValue).toFixed(1), unit: 'kg' };
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

function PostWorkoutSummary({ data, T, onDismiss }) {
  const { session, prEvents, totalVolume, durationSec, exerciseCount } = data;
  const heroPR = pickHeroPR(prEvents);
  const heroVal = formatHero(heroPR);
  const heroExName = heroPR ? (getExercise(heroPR.exerciseId)?.name || heroPR.exerciseId) : null;
  const heroLabelKey = heroPR ? PR_TYPE_TO_KEY[heroPR.type] : null;
  const identityKey = pickIdentityKey(data);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: t.bg,
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
      animation: 'pwsFadeIn 600ms ease-out',
    }}>
      {/* Inline keyframes for slow cinematic reveal */}
      <style>{`
        @keyframes pwsFadeIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes pwsRise {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Soft top-light gradient — cinematic depth */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 360,
        background: `radial-gradient(ellipse at center top, rgba(77,139,250,0.14), transparent 60%)`,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        padding: '28px 20px 8px', position: 'relative',
        animation: 'pwsRise 700ms ease-out 100ms backwards',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 800, color: t.soft,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          textAlign: 'center',
        }}>
          {T('summary.title')}
        </div>
      </div>

      {/* Hero stat */}
      <div style={{
        padding: '32px 24px 28px', position: 'relative',
        textAlign: 'center',
        animation: 'pwsRise 800ms ease-out 280ms backwards',
      }}>
        {heroVal ? (
          <>
            <div style={{
              fontSize: 64, fontWeight: 800, color: t.text,
              letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 12,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {heroVal.value}
              <span style={{ fontSize: 24, color: t.soft, marginLeft: 6, fontWeight: 700 }}>
                {heroVal.unit}
              </span>
            </div>
            <div style={{
              fontSize: 12, color: t.soft, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {T(heroLabelKey)} {heroExName ? `· ${heroExName}` : ''}
            </div>
          </>
        ) : (
          <>
            <div style={{
              fontSize: 64, fontWeight: 800, color: t.text,
              letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 12,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {Math.round(totalVolume).toLocaleString('en-US')}
              <span style={{ fontSize: 24, color: t.soft, marginLeft: 6, fontWeight: 700 }}>kg</span>
            </div>
            <div style={{
              fontSize: 12, color: t.soft, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {T('summary.volume')}
            </div>
          </>
        )}
      </div>

      {/* Identity sentence */}
      <div style={{
        padding: '4px 36px 32px', textAlign: 'center', position: 'relative',
        animation: 'pwsRise 800ms ease-out 480ms backwards',
      }}>
        <div style={{
          fontSize: 16, color: t.text, fontWeight: 500, lineHeight: 1.45,
          letterSpacing: '-0.01em', fontStyle: 'italic', opacity: 0.85,
        }}>
          {T(identityKey)}
        </div>
      </div>

      {/* Session metrics row */}
      <div style={{
        margin: '0 20px 24px', padding: '20px 0',
        borderTop: `1px solid ${t.border}`,
        borderBottom: `1px solid ${t.border}`,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        position: 'relative',
        animation: 'pwsRise 800ms ease-out 640ms backwards',
      }}>
        <SummaryMetric
          label={T('summary.volume')}
          value={Math.round(totalVolume).toLocaleString('en-US')}
          unit="kg"
        />
        <SummaryMetric
          label={T('summary.duration')}
          value={formatDuration(durationSec)}
        />
        <SummaryMetric
          label={T('summary.exercises')}
          value={String(exerciseCount)}
        />
      </div>

      {/* Personal bests grid */}
      {prEvents && prEvents.length > 0 && (
        <div style={{
          padding: '4px 20px 20px', position: 'relative',
          animation: 'pwsRise 800ms ease-out 780ms backwards',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: t.muted,
            letterSpacing: '0.10em', textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            {T('summary.prs_today')} · {prEvents.length}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {prEvents.map(pr => (
              <SummaryPRTile key={pr.id} pr={pr} T={T} />
            ))}
          </div>
        </div>
      )}

      {/* Spacer + continue button */}
      <div style={{ flex: 1, minHeight: 24 }} />
      <div style={{
        padding: '16px 20px 24px', position: 'sticky', bottom: 0,
        background: `linear-gradient(to top, ${t.bg} 60%, rgba(8,10,14,0))`,
        animation: 'pwsRise 800ms ease-out 920ms backwards',
      }}>
        <Btn full accent="orange" onClick={onDismiss} style={{ fontSize: 15, padding: '14px' }}>
          {T('summary.continue')}
        </Btn>
      </div>
    </div>
  );
}

function SummaryMetric({ label, value, unit }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 8px' }}>
      <div style={{
        fontSize: 10, fontWeight: 800, color: t.muted,
        letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
        <span style={{
          fontSize: 18, fontWeight: 800, color: t.text,
          letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
        }}>{value}</span>
        {unit && <span style={{ fontSize: 11, color: t.soft, fontWeight: 600 }}>{unit}</span>}
      </div>
    </div>
  );
}

function SummaryPRTile({ pr, T }) {
  const exMeta = getExercise(pr.exerciseId);
  const exName = exMeta?.name || pr.exerciseId;
  const value = pr.type === PR_TYPES.BEST_VOLUME
    ? `${Math.round(pr.newValue).toLocaleString('en-US')} kg`
    : `${Number(pr.newValue).toFixed(1)} kg`;
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 14,
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${t.border}`,
      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
    }}>
      <div style={{
        fontSize: 9, fontWeight: 800, color: t.soft,
        letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 5,
      }}>
        {T(PR_TYPE_TO_KEY[pr.type] || 'pr.new')}
      </div>
      <div style={{
        fontSize: 17, fontWeight: 800, color: t.text,
        letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 4,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 11, color: t.muted, lineHeight: 1.3,
        overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>
        {exName}
      </div>
    </div>
  );
}
