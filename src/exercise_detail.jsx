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
import { useT, t, useApp } from './lib';
import { getExercise, formatRestTime } from './exercise_library';
import { PR_TYPES, est1RMHistory, getPREvents, emptyExerciseStats } from './pr';

export function ExerciseDetail({ exerciseId, onClose }) {
  const T = useT();
  const { profile } = useApp();
  const ex = getExercise(exerciseId);
  const data = profile?.data || {};
  const stats = (data.exerciseStats || {})[exerciseId] || emptyExerciseStats();
  const prEvents = Array.isArray(data.prEvents) ? data.prEvents : [];
  const history1RM = est1RMHistory(prEvents, exerciseId);
  const hasRecords = stats.totalSessions > 0;

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

        {/* PR records — only if user has logged sets for this exercise */}
        <RecordsCard
          stats={stats}
          history1RM={history1RM}
          hasRecords={hasRecords}
          T={T}
        />

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

/* ─────────────────────── Records card ─────────────────────── */

function RecordsCard({ stats, history1RM, hasRecords, T }) {
  return (
    <div style={{
      background: t.glassPanel,
      border: `1px solid ${t.borderStrong}`,
      borderRadius: 18,
      padding: 16, marginBottom: 14,
      backdropFilter: 'blur(18px) saturate(140%)',
      WebkitBackdropFilter: 'blur(18px) saturate(140%)',
      boxShadow: t.cardShadow,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '120%', height: 80,
        background: 'radial-gradient(ellipse at center top, rgba(77,139,250,0.10), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        fontSize: 10.5, fontWeight: 700, color: t.muted,
        letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12,
        position: 'relative',
      }}>
        {T('exdetail.your_records')}
      </div>

      {!hasRecords ? (
        <div style={{
          fontSize: 13, color: t.soft, fontStyle: 'italic',
          lineHeight: 1.5, padding: '6px 0', position: 'relative',
        }}>
          {T('exdetail.no_records')}
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
            marginBottom: 12, position: 'relative',
          }}>
            <RecordTile
              label={T('exdetail.est1rm')}
              value={stats.est1RM > 0 ? `${stats.est1RM.toFixed(1)} kg` : '—'}
              hero
            />
            <RecordTile
              label={T('exdetail.heaviest')}
              value={stats.heaviestWeight > 0 ? `${stats.heaviestWeight.toFixed(1)} kg` : '—'}
            />
            <RecordTile
              label={T('exdetail.bestvolume')}
              value={stats.bestVolume > 0 ? `${Math.round(stats.bestVolume).toLocaleString('en-US')} kg` : '—'}
            />
            <RecordTile
              label={T('exdetail.lifetimevolume')}
              value={stats.lifetimeVolume > 0 ? `${Math.round(stats.lifetimeVolume).toLocaleString('en-US')} kg` : '—'}
            />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 10, borderTop: `1px solid ${t.border}`, position: 'relative',
          }}>
            <span style={{
              fontSize: 11, color: t.muted, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              {T('exdetail.sessions')}
            </span>
            <span style={{
              fontSize: 14, color: t.text, fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {stats.totalSessions}
            </span>
          </div>

          {/* 1RM history sparkline */}
          {history1RM.length >= 2 && (
            <div style={{ marginTop: 14, position: 'relative' }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: t.muted,
                letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8,
              }}>
                {T('exdetail.history')}
              </div>
              <Sparkline points={history1RM} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RecordTile({ label, value, hero }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 12,
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${t.border}`,
      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
      position: 'relative',
    }}>
      <div style={{
        fontSize: 9.5, fontWeight: 800, color: t.muted,
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: hero ? 19 : 15, fontWeight: 800, color: t.text,
        letterSpacing: '-0.02em', lineHeight: 1.1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
    </div>
  );
}

function Sparkline({ points }) {
  if (!points || points.length < 2) return null;
  const W = 100, H = 36;
  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = points.map((p, i) => ({
    x: (i / (points.length - 1)) * W,
    y: H - ((p.value - min) / range) * (H - 4) - 2,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 56 }}>
      <defs>
        <linearGradient id="spkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6FA0FF" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#6FA0FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#spkFill)" />
      <path d={linePath} fill="none" stroke="#6FA0FF" strokeWidth="1.5" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 2 : 1.2} fill="#6FA0FF" />
      ))}
    </svg>
  );
}
