/* ═══════════════════════════════════════════════════════════════════════════
 * EXERCISE DETAIL — full-screen modal
 *
 * Shows everything we have about an exercise:
 *   - Hero VideoThumb (large)
 *   - Quick meta: primary muscle, secondary, equipment, movement type
 *   - Default sets / reps / rest / tempo
 *   - Execution / tips / mistakes sections (placeholder for now, content
 *     will be added per exercise in step 4)
 *
 * Used from: workouts.jsx (Library tab) + workout_runner.jsx (exercise card)
 * ═══════════════════════════════════════════════════════════════════════════ */

import React from 'react';
import { Icon, VideoThumb, Pill } from './shared';
import { useT, t } from './lib';
import { getExercise, formatRestTime } from './exercise_library';

export function ExerciseDetail({ exerciseId, onClose }) {
  const T = useT();
  const ex = getExercise(exerciseId);

  if (!ex) return null;

  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
  // Safe muscle-name lookup: use i18n if key exists, else capitalize raw value.
  // This handles secondary muscles like 'triceps', 'biceps', 'glutes' that
  // don't have a wr.mg.* key.
  const muscleName = m => {
    if (!m) return '—';
    const key = `wr.mg.${m}`;
    const translated = T(key);
    return translated === key ? cap(m) : translated;
  };

  const movementLabel = cap(ex.movementType);
  const equipmentLabel = cap(ex.equipment);
  const secondary = (ex.secondaryMuscles || []).map(muscleName).join(', ') || '—';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: t.bg, zIndex: 1000,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 2,
        background: t.bg, borderBottom: `1px solid ${t.border}`,
        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div onClick={onClose} style={{
          width: 36, height: 36, borderRadius: 10,
          background: t.card2, border: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: t.orange,
        }}>
          <Icon name="chev-left" size={20} color={t.orange} />
        </div>
        <div style={{
          flex: 1, fontSize: 16, fontWeight: 800, color: t.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {ex.name}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 14, paddingBottom: 80 }}>
        {/* Hero thumbnail */}
        <div style={{ marginBottom: 14 }}>
          <VideoThumb exercise={ex} size="lg" />
        </div>

        {/* Quick meta card */}
        <div style={{
          background: t.card, border: `1px solid ${t.border}`,
          borderRadius: 14, padding: 14, marginBottom: 14,
        }}>
          <MetaRow label={T('exdetail.primary')} value={muscleName(ex.primaryMuscle)} />
          <MetaRow label={T('exdetail.secondary')} value={secondary} />
          <MetaRow label={T('exdetail.movement')} value={movementLabel} />
          <MetaRow label={T('exdetail.equipment')} value={equipmentLabel} />
          <MetaRow label={T('exdetail.reps')} value={ex.defaultRepRange || '—'} />
          <MetaRow label={T('exdetail.rest')} value={formatRestTime(ex.defaultRestSec || 0)} last />
        </div>

        {/* Execution */}
        <Section title={T('exdetail.execution')}>
          {Array.isArray(ex.execution_steps) && ex.execution_steps.length > 0 ? (
            <ol style={{ margin: 0, paddingLeft: 18, color: t.text, fontSize: 14, lineHeight: 1.55 }}>
              {ex.execution_steps.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}
            </ol>
          ) : (
            <ComingSoon T={T} />
          )}
        </Section>

        {/* Tips */}
        <Section title={T('exdetail.tips')}>
          {Array.isArray(ex.pro_tips) && ex.pro_tips.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18, color: t.text, fontSize: 14, lineHeight: 1.55 }}>
              {ex.pro_tips.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}
            </ul>
          ) : (
            <ComingSoon T={T} />
          )}
        </Section>

        {/* Common mistakes */}
        <Section title={T('exdetail.mistakes')}>
          {Array.isArray(ex.common_mistakes) && ex.common_mistakes.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18, color: t.text, fontSize: 14, lineHeight: 1.55 }}>
              {ex.common_mistakes.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}
            </ul>
          ) : (
            <ComingSoon T={T} />
          )}
        </Section>
      </div>
    </div>
  );
}

function MetaRow({ label, value, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0',
      borderBottom: last ? 'none' : `1px solid ${t.border}`,
    }}>
      <div style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13, color: t.text, fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{
      background: t.card, border: `1px solid ${t.border}`,
      borderRadius: 14, padding: 14, marginBottom: 12,
    }}>
      <div style={{ fontSize: 13, color: t.muted, fontWeight: 700, marginBottom: 10, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ComingSoon({ T }) {
  return (
    <div style={{
      padding: '14px 12px',
      background: t.card2,
      border: `1px dashed ${t.border}`,
      borderRadius: 10,
      color: t.muted,
      fontSize: 13,
      lineHeight: 1.5,
      fontStyle: 'italic',
    }}>
      {T('exdetail.comingsoon')}
    </div>
  );
}
