import { useState, useMemo, useRef, useEffect } from "react";
import { t, WEEK, useApp, useT, useLang, todayIdx, weekDates, todayKey, weekDayShort, fmtKey, newId } from './lib';
import { Icon, Card, Label, Btn, Chip, Modal, Field, Pill, LetterBadge, VideoThumb, ActionSheet } from './shared';
import { Toast } from './modals';
import { EXERCISE_LIBRARY, getExercise, searchExercises, formatRestTime } from './exercise_library';
import { generateMissingTemplates, countMissingTemplates } from './workout_generator';
import { WorkoutRunner } from './workout_runner';

// Canonical workout-plan values are English keys (Back/Chest/Legs/Upper/Cardio/Rest/etc.)
// Localize for display: 'Back' → "Rug" in NL. User-named templates pass through unchanged.
function localizeWorkoutName(name, T) {
  if (!name || name === 'Rest') return T('wo.restday');
  const key = `set.wo.${name.toLowerCase()}`;
  const translated = T(key);
  if (translated && translated !== key) return translated;
  return name; // user-named — show as-is
}

/* ═══════════════════════════ WORKOUTS ═══════════════════════════
 * Premium gym-flow overview matching reference screenshots:
 *   - Top header with template-set name + dropdown + calendar icon
 *   - Day-tabs (Rest day / Push / Pull / Legs / ...) — horizontal, underline-style
 *   - Selected day = template preview (Warm Up + Workout sections)
 *   - Sticky "Log This Workout" CTA at bottom
 *   - In-progress workout? → ActionSheet (Continue / Start new / Cancel)
 * ═══════════════════════════════════════════════════════════════ */

export function Workouts({ autoStart = false, onConsumedAutoStart = () => {} }) {
  const T = useT();
  const { lang } = useLang();
  const { profile, saveProfileData } = useApp();
  const d = profile?.data || {};
  const workouts = Array.isArray(d.workouts) ? d.workouts : [];
  const workoutPlan = d.workoutPlan || {};
  const workoutLog = d.workoutLog || {};
  const workoutSessions = d.workoutSessions || {};
  const inProgress = d.inProgressWorkout || null;

  const ti = todayIdx();
  const dates = weekDates();

  const [view, setView] = useState('today');                  // today | templates | library
  const [selectedDayIdx, setSelectedDayIdx] = useState(ti);   // 0..6 (Mon..Sun)
  const [runnerTpl, setRunnerTpl] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [showResumeSheet, setShowResumeSheet] = useState(false);
  const [pendingStart, setPendingStart] = useState(null);     // template waiting to start once resume question is answered
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTpl, setEditingTpl] = useState(null);
  const [showTpl, setShowTpl] = useState(null);
  const [toast, setToast] = useState('');

  const flashToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400); };

  // ── Template auto-generator ──────────────────────────────────────────
  const missingCount = countMissingTemplates(workoutPlan, workouts);
  const handleGenerate = async () => {
    const generated = generateMissingTemplates(workoutPlan, workouts);
    if (generated.length === 0) {
      flashToast(T('wo.gen.nothing'));
      return;
    }
    await saveProfileData({ workouts: [...workouts, ...generated] });
    flashToast(T('wo.gen.success', { count: generated.length }));
  };

  // Selected-day template lookup
  const selectedDayName = WEEK[selectedDayIdx];
  const selectedWorkoutName = workoutPlan[selectedDayName];
  const selectedTpl = selectedWorkoutName ? workouts.find(w => w.name === selectedWorkoutName) : null;
  const selectedDateKey = (() => {
    const dt = new Date(); dt.setDate(dt.getDate() - ti + selectedDayIdx); return fmtKey(dt);
  })();
  const selectedDone = workoutLog[selectedDateKey]?.completed || false;

  // ── Start flow ───────────────────────────────────────────────────────
  const requestStartWorkout = (tpl) => {
    if (inProgress) {
      setPendingStart(tpl);
      setShowResumeSheet(true);
    } else {
      setRunnerTpl(tpl);
      setResumeData(null);
    }
  };

  const resumeInProgress = () => {
    setRunnerTpl({
      id: inProgress.id || 'resumed',
      name: inProgress.name,
      exercises: [],
    });
    setResumeData(inProgress);
    setPendingStart(null);
    setShowResumeSheet(false);
  };

  const startNewDropOld = async () => {
    await saveProfileData({ inProgressWorkout: null });
    if (pendingStart) {
      setRunnerTpl(pendingStart);
      setResumeData(null);
    }
    setPendingStart(null);
    setShowResumeSheet(false);
  };

  const quickStart = () => requestStartWorkout({ id: 'quick', name: T('wr.quickworkout'), exercises: [] });

  // Auto-start from Home tap
  useEffect(() => {
    if (autoStart) {
      requestStartWorkout(selectedTpl || { id: 'quick', name: T('wr.quickworkout'), exercises: [] });
      onConsumedAutoStart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* ─── HEADER ───────────────────────────────────────────────────── */}
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

      {/* ─── TODAY (day-tabs + template preview) ──────────────────────── */}
      {view === 'today' && (
        <>
          {/* Generator banner — appears when workoutPlan has names without matching templates */}
          {missingCount > 0 && (
            <div style={{ padding: '0 16px 12px' }}>
              <Card style={{
                padding: 14, background: t.metalOrange,
                border: `1px solid ${t.orangeBorder}`,
                boxShadow: `0 8px 24px rgba(255,59,92,0.22), ${t.innerHi}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#FFF', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 4 }}>
                  {T('wo.gen.banner.label')}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF', marginBottom: 4, lineHeight: 1.3 }}>
                  {T('wo.gen.banner.title', { count: missingCount })}
                </div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginBottom: 12, lineHeight: 1.4 }}>
                  {T('wo.gen.banner.body')}
                </div>
                <Btn full onClick={handleGenerate} style={{
                  background: '#FFF', color: '#FF3B5C', fontWeight: 800, padding: '12px',
                  boxShadow: 'none', border: 'none',
                }}>
                  ⚡ {T('wo.gen.banner.cta')}
                </Btn>
              </Card>
            </div>
          )}

          {/* In-progress banner */}
          {inProgress && (
            <div style={{ padding: '0 16px 12px' }}>
              <Card onClick={() => { setRunnerTpl({ id: inProgress.id, name: inProgress.name, exercises: [] }); setResumeData(inProgress); }} style={{
                padding: 12, background: t.orangeBg, border: `1px solid ${t.orangeBorder}`,
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: t.metalOrange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="play" size={16} color="#FFF" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.orange, letterSpacing: '0.04em' }}>{T('wo.inprogress.label')}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{inProgress.name}</div>
                </div>
                <Icon name="chevR" size={14} color={t.orange} />
              </Card>
            </div>
          )}

          {/* Day tabs strip */}
          {Object.keys(workoutPlan).length === 0 ? (
            /* No plan → empty state */
            <div style={{ padding: '0 16px' }}>
              <Card style={{ padding: 30, textAlign: 'center', border: `1px dashed ${t.border}` }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💪</div>
                <div style={{ fontSize: 14, color: t.text, fontWeight: 700, marginBottom: 6 }}>{T('wo.noplan.title')}</div>
                <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5, marginBottom: 16 }}>{T('wo.noplan.body')}</div>
                <Btn full accent="orange" onClick={quickStart}>{T('wo.quickstart')}</Btn>
              </Card>
            </div>
          ) : (() => {
            const todayName = WEEK[ti];
            const todayWorkoutName = workoutPlan[todayName];
            const todayTpl = todayWorkoutName ? workouts.find(w => w.name === todayWorkoutName) : null;
            const todayDoneKey = todayKey();
            const isDone = workoutLog[todayDoneKey]?.completed;

            // Rest day
            if (!todayWorkoutName || todayWorkoutName === 'Rest') {
              return (
                <div style={{ padding: '0 16px' }}>
                  <Card style={{ padding: 30, textAlign: 'center', border: `1px dashed ${t.border}` }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🛌</div>
                    <div style={{ fontSize: 15, color: t.text, fontWeight: 700, marginBottom: 6 }}>{T('wo.restday')}</div>
                    <div style={{ fontSize: 12.5, color: t.muted, lineHeight: 1.5 }}>{T('wo.today.rest')}</div>
                  </Card>
                </div>
              );
            }

            // Completed today
            if (isDone) {
              return (
                <div style={{ padding: '0 16px' }}>
                  <Card style={{ padding: 22, textAlign: 'center', background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.30)' }}>
                    <Icon name="check" size={32} color="#34C759" stroke={3} />
                    <div style={{ fontSize: 15, color: '#34C759', fontWeight: 800, marginTop: 8, marginBottom: 4 }}>{T('wo.day.completed')}</div>
                    <div style={{ fontSize: 13, color: t.text, fontWeight: 600 }}>{localizeWorkoutName(todayWorkoutName, T)}</div>
                  </Card>
                </div>
              );
            }

            // Active card — tap to start
            const exCount = todayTpl?.exercises?.length || 0;
            const subtitle = todayTpl
              ? `${exCount} ${T('wo.exercises')}`
              : T('wo.tap.create');
            return (
              <div style={{ padding: '0 16px' }}>
                <Card
                  onClick={() => {
                    if (todayTpl) { requestStartWorkout(todayTpl); return; }
                    // No template yet — generate one then start
                    (async () => {
                      const generated = generateMissingTemplates({ X: todayWorkoutName }, workouts);
                      if (generated.length === 0) { flashToast(T('wo.gen.nothing')); return; }
                      const newList = [...workouts, ...generated];
                      await saveProfileData({ workouts: newList });
                      const created = newList.find(w => w.name === todayWorkoutName);
                      if (created) requestStartWorkout(created);
                    })();
                  }}
                  style={{
                    padding: 22,
                    background: t.metalOrange,
                    border: `1px solid ${t.orangeBorder}`,
                    boxShadow: `0 8px 28px rgba(255,59,92,0.28), ${t.innerHi}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {T('wo.today.label')}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', letterSpacing: '-0.02em', marginBottom: 6, lineHeight: 1.1 }}>
                    {localizeWorkoutName(todayWorkoutName, T)}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 16 }}>
                    {subtitle}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px', borderRadius: 12,
                    background: '#FFF', color: '#FF3B5C',
                    fontWeight: 800, fontSize: 15,
                  }}>
                    <Icon name="play" size={16} color="#FF3B5C" />
                    {T('wo.startworkout')}
                  </div>
                </Card>
              </div>
            );
          })()}
        </>
      )}

      {/* ─── TEMPLATES ──────────────────────────────────────────────── */}
      {view === 'templates' && (
        <div style={{ padding: '0 16px' }}>
          {/* ── 7 fixed workout-type cards ───────────────────────────────── */}
          {['Push','Pull','Legs','Upper','Lower','Arms','Posterior'].map(typeName => {
            const existing = workouts.find(w => w.name === typeName);
            const exCount = existing?.exercises?.length || 0;
            const tplIdx = existing ? workouts.findIndex(w => w.id === existing.id) : -1;
            const handleTap = async () => {
              if (existing) { setShowTpl(tplIdx); return; }
              // Generate single-type template inline
              const generated = generateMissingTemplates({ X: typeName }, workouts);
              if (generated.length === 0) { flashToast(T('wo.gen.nothing')); return; }
              const newList = [...workouts, ...generated];
              await saveProfileData({ workouts: newList });
              const newIdx = newList.findIndex(w => w.name === typeName);
              if (newIdx >= 0) setShowTpl(newIdx);
            };
            return (
              <Card key={typeName} onClick={handleTap} style={{ padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: t.orangeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.orangeBorder}` }}>
                      <Icon name="workout" size={18} color={t.orange} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{localizeWorkoutName(typeName, T)}</div>
                      <div style={{ fontSize: 12, color: t.soft }}>
                        {exCount > 0 ? `${exCount} ${T('wo.exercises')}` : T('wo.tap.create')}
                      </div>
                    </div>
                  </div>
                  <Icon name="chevR" size={16} color={t.muted} />
                </div>
              </Card>
            );
          })}

          {/* ── Custom user-named templates (not matching the 7 types) ───── */}
          {workouts.filter(w => !['Push','Pull','Legs','Upper','Lower','Arms','Posterior'].includes(w.name)).map((w, i) => {
            const tplIdx = workouts.findIndex(x => x.id === w.id);
            return (
              <Card key={w.id || i} onClick={() => setShowTpl(tplIdx)} style={{ padding: 14, marginTop: i === 0 ? 16 : 10 }}>
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
            );
          })}
        </div>
      )}

      {/* ─── LIBRARY ─────────────────────────────────────────────────── */}
      {view === 'library' && (
        <div style={{ padding: '0 16px' }}>
          <ExerciseLibraryScreen T={T} />
        </div>
      )}

      {/* ─── Template detail (full view, edit, start) ──────────────── */}
      <Modal visible={showTpl !== null} onClose={() => setShowTpl(null)} title={showTpl !== null ? workouts[showTpl]?.name || '' : ''} accent="orange">
        {showTpl !== null && workouts[showTpl] && (
          <>
            {(workouts[showTpl].exercises || []).map((ex, i) => {
              const exId = typeof ex === 'string' ? null : ex.exerciseId;
              const exMeta = exId ? getExercise(exId) : null;
              const name = exMeta ? exMeta.name : (typeof ex === 'string' ? ex : T('wo.unknownexercise'));
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: i < (workouts[showTpl].exercises || []).length - 1 ? `1px solid ${t.border}` : 'none' }}>
                  <LetterBadge letter={String.fromCharCode(65 + i)} />
                  <div style={{ flex: 1, fontSize: 14, color: t.text, fontWeight: 600 }}>{name}</div>
                  {typeof ex !== 'string' && ex.setCount && (
                    <div style={{ fontSize: 11, color: t.muted }}>{ex.setCount}×{ex.repRange}</div>
                  )}
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <Btn full variant="outline" onClick={() => { setEditingTpl(workouts[showTpl]); setShowTpl(null); setShowBuilder(true); }}>{T('common.edit')}</Btn>
              <Btn full accent="orange" onClick={() => { const tpl = workouts[showTpl]; setShowTpl(null); requestStartWorkout(tpl); }}>{T('wo.startworkout')}</Btn>
            </div>
          </>
        )}
      </Modal>

      {/* ─── Template builder ───────────────────────────────────────── */}
      <TemplateBuilderModal
        visible={showBuilder}
        editing={editingTpl}
        onClose={() => { setShowBuilder(false); setEditingTpl(null); }}
        onSave={async (tpl) => {
          let updated;
          if (editingTpl) updated = workouts.map(w => w.id === editingTpl.id ? tpl : w);
          else updated = [...workouts, tpl];
          await saveProfileData({ workouts: updated });
          setShowBuilder(false); setEditingTpl(null);
          flashToast(T('wo.tpl.saved'));
        }}
        T={T}
      />

      {/* ─── Resume in-progress ActionSheet ─────────────────────────── */}
      <ActionSheet
        visible={showResumeSheet}
        onClose={() => { setShowResumeSheet(false); setPendingStart(null); }}
        title={T('wo.resume.title')}
        subtitle={inProgress ? T('wo.resume.body', { date: new Date(inProgress.savedAt || inProgress.startedAt).toLocaleDateString(lang || 'en', { day: 'numeric', month: 'short' }) }) : ''}
        actions={[
          { label: T('wo.resume.continue'), color: 'orange', onPress: resumeInProgress },
          { label: T('wo.resume.startnew'), color: 'orange', onPress: startNewDropOld },
          { label: T('common.cancel'),      color: 'orange', onPress: () => { setShowResumeSheet(false); setPendingStart(null); } },
        ]}
      />

      {/* ─── RUNNER ──────────────────────────────────────────────────── */}
      <WorkoutRunner
        visible={runnerTpl !== null}
        template={runnerTpl}
        resumeFrom={resumeData}
        onClose={() => { setRunnerTpl(null); setResumeData(null); }}
        onFinished={() => { flashToast(T('wo.session.saved')); }}
      />

      <Toast message={toast} visible={!!toast} />
    </div>
  );
}

/* ─────────────────────── TemplatePreview ─────────────────────── */
function TemplatePreview({ tpl, T }) {
  const exercises = tpl.exercises || [];
  const warmups = tpl.warmups || [];

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Warm Up section */}
      {warmups.length > 0 && (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.soft, padding: '4px 4px 10px', letterSpacing: '-0.01em' }}>
            {T('wo.section.warmup')}
          </div>
          <Card style={{ padding: 10, marginBottom: 14 }}>
            {warmups.map((w, i) => {
              const exId = typeof w === 'string' ? null : w.exerciseId;
              const exMeta = exId ? getExercise(exId) : null;
              return (
                <PreviewWarmupRow
                  key={i}
                  exercise={exMeta}
                  reps={typeof w === 'string' ? 10 : (w.reps || 10)}
                  letter={String.fromCharCode(65 + i)}
                  divider={i < warmups.length - 1}
                  T={T}
                />
              );
            })}
          </Card>
        </>
      )}

      {/* Workout section */}
      <div style={{ fontSize: 16, fontWeight: 700, color: t.soft, padding: '4px 4px 10px', letterSpacing: '-0.01em' }}>
        {T('wo.section.workout')}
      </div>
      {exercises.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', borderRadius: 16, background: t.card, border: `1px dashed ${t.border}` }}>
          <div style={{ fontSize: 13, color: t.muted }}>{T('wo.tpl.noexs')}</div>
        </div>
      ) : exercises.map((ex, i) => {
        const exId = typeof ex === 'string' ? null : ex.exerciseId;
        const exMeta = exId ? getExercise(exId) : null;
        if (!exMeta) return null;
        return (
          <PreviewExerciseCard
            key={i}
            exercise={exMeta}
            entry={typeof ex === 'string' ? { setCount: 3, repRange: exMeta.defaultRepRange, restSec: exMeta.defaultRestSec, tempo: exMeta.defaultTempo } : ex}
            letter={String.fromCharCode(65 + i)}
            T={T}
          />
        );
      })}
    </div>
  );
}

function PreviewWarmupRow({ exercise, reps, letter, divider, T }) {
  if (!exercise) return null;
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px' }}>
        <VideoThumb exercise={exercise} size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text, marginBottom: 4 }}>{exercise.name}</div>
          <Pill>{T('wr.pill.reps')}: {reps}</Pill>
        </div>
        <LetterBadge letter={letter} active={false} />
      </div>
      {divider && <div style={{ height: 1, background: t.border, margin: '0 4px' }} />}
    </>
  );
}

function PreviewExerciseCard({ exercise, entry, letter, T }) {
  const restLabel = entry.restSec >= 60
    ? `${Math.floor(entry.restSec / 60)}m${entry.restSec % 60 ? ' ' + (entry.restSec % 60) + 's' : ''}`
    : `${entry.restSec}s`;
  return (
    <Card style={{ padding: 12, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <VideoThumb exercise={exercise} size="md" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, fontSize: 16, fontWeight: 800, color: t.text, lineHeight: 1.25, letterSpacing: '-0.01em' }}>
              {exercise.name}
            </div>
            <LetterBadge letter={letter} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <Pill>{T('wr.pill.sets')}: {entry.setCount}</Pill>
            <Pill>{T('wr.pill.reps')}: {entry.repRange}</Pill>
            <Pill>{T('wr.pill.rest')}: {restLabel}</Pill>
            {entry.tempo && <Pill>{T('wr.pill.tempo')}: {entry.tempo}</Pill>}
          </div>
        </div>
      </div>
    </Card>
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
        value={q} onChange={e => setQ(e.target.value)}
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
        <Card key={e.id} style={{ padding: 10, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <VideoThumb exercise={e} size="sm" />
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
          if (m) return { exerciseId: m.id, setCount: 4, repRange: m.defaultRepRange, restSec: m.defaultRestSec, tempo: m.defaultTempo || '' };
          return null;
        }
        return { exerciseId: x.exerciseId, setCount: x.setCount || 4, repRange: x.repRange || '8-12', restSec: x.restSec || 120, tempo: x.tempo || '' };
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
  if (!visible && lastVisRef.current) lastVisRef.current = '';

  const pick = (exerciseId) => {
    const m = getExercise(exerciseId);
    setPicked(prev => [...prev, { exerciseId, setCount: 4, repRange: m?.defaultRepRange || '8-12', restSec: m?.defaultRestSec || 120, tempo: m?.defaultTempo || '' }]);
    setShowPicker(false);
  };
  const remove = (idx) => setPicked(prev => prev.filter((_, i) => i !== idx));
  const updatePicked = (idx, patch) => setPicked(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p));

  const save = () => {
    if (!name.trim() || picked.length === 0) return;
    onSave({
      id: editing?.id || newId(),
      name: name.trim(),
      exercises: picked,
    });
  };

  return (
    <>
      <Modal visible={visible && !showPicker} onClose={onClose} title={editing ? T('wo.tpl.edit') : T('wo.tpl.new')} accent="orange">
        <Field label={T('wo.tpl.name')}>
          <input
            value={name} onChange={e => setName(e.target.value)}
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
                  <LetterBadge letter={String.fromCharCode(65 + i)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m?.name || '?'}</div>
                    <div style={{ fontSize: 10.5, color: t.muted, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <input type="number" inputMode="numeric" value={p.setCount}
                        onChange={e => updatePicked(i, { setCount: parseInt(e.target.value) || 1 })}
                        style={{ width: 30, padding: 2, background: 'transparent', border: 'none', color: t.text, fontSize: 10.5, fontFamily: 'inherit' }} />
                      ×
                      <input value={p.repRange}
                        onChange={e => updatePicked(i, { repRange: e.target.value })}
                        style={{ width: 56, padding: 2, background: 'transparent', border: 'none', color: t.text, fontSize: 10.5, fontFamily: 'inherit' }} />
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
            display: 'flex', alignItems: 'center', gap: 12, padding: 10, marginBottom: 8,
            background: t.card, borderRadius: 12, border: `1px solid ${t.border}`, cursor: 'pointer',
          }}>
            <VideoThumb exercise={e} size="sm" />
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
