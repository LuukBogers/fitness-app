import { useState } from "react";
import { t, WEEK, useApp, useT, useLang, todayIdx, weekDates, todayKey, dayLabel, weekDayShort, fmtKey } from './lib';
import { Icon, Card, Label, ProgressBar, Ring, MacroRing } from './shared';
import { HomeBell, NotificationsModal, CheckinHistoryModal } from './notifications';
import {
  calculateLiveIdentity, tierFromScore, prPostWorkoutHeadline, totalLifetimeVolume,
  TIERS, PR_TYPES,
} from './pr';
import { getExercise } from './exercise_library';

/* ═══════════════════════════ HOME ═══════════════════════════ */
export function Home({ onOpenCheckIn, onStartTodayWorkout }) {
  const T = useT();
  const { lang } = useLang();
  const { profile, session } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const d = profile?.data || {};
  const userName = profile?.name || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'You';
  const calories = d.calories || 0;
  const protein = d.protein || 0;
  const carbs = d.carbs || 0;
  const fat = d.fat || 0;
  const streak = d.streak || 0;
  const weights = Array.isArray(d.weights) ? d.weights : [];
  const checkIns = d.checkIns || {};
  const meals = d.meals || {};
  const workoutPlan = d.workoutPlan || {};
  const workoutLog = d.workoutLog || {};

  const ti = todayIdx();
  const dates = weekDates();
  const tKey = todayKey();

  // Today's eaten totals
  const todayMeals = meals[tKey] || [];
  const eatenKcal = todayMeals.reduce((s, m) => s + (m.eaten ? (m.kcal || 0) : 0), 0);
  const eatenP = todayMeals.reduce((s, m) => s + (m.eaten ? (m.p || 0) : 0), 0);
  const eatenC = todayMeals.reduce((s, m) => s + (m.eaten ? (m.c || 0) : 0), 0);
  const eatenF = todayMeals.reduce((s, m) => s + (m.eaten ? (m.f || 0) : 0), 0);
  const remaining = Math.max(0, calories - eatenKcal);

  // Today's workout
  const todayDayName = WEEK[ti];
  const todayWorkout = workoutPlan[todayDayName] || null;
  const todayDone = workoutLog[tKey]?.completed || false;

  // "Your next workout" — if today is rest or done, look forward up to 7 days
  const findNextWorkout = () => {
    for (let offset = 0; offset < 7; offset++) {
      const i = (ti + offset) % 7;
      const w = workoutPlan[WEEK[i]];
      if (!w || w === 'Rest') continue;
      const dt = new Date(); dt.setDate(dt.getDate() + offset);
      const dk = fmtKey(dt);
      const done = workoutLog[dk]?.completed || false;
      if (offset === 0 && done) continue; // today's already done, look further
      return { name: w, dayIdx: i, offset, done };
    }
    return null;
  };
  const nextWorkout = findNextWorkout();
  const planDayCount = Object.values(workoutPlan).filter(v => v && v !== 'Rest').length;
  const userFullName = profile?.name || userName;
  const planLabel = planDayCount > 0 ? `${userFullName} — ${planDayCount} ${T('home.daysweek')}` : null;

  // Localize workout name for display
  const localizeWoName = (name) => {
    if (!name || name === 'Rest') return T('wo.restday');
    const key = `set.wo.${name.toLowerCase()}`;
    const tr = T(key);
    return tr && tr !== key ? tr : name;
  };

  // Check-in done check
  const checkedThisWeek = WEEK.map((_, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - ti + i);
    return !!checkIns[fmtKey(dt)];
  });

  // Weight graph: last 7 entries
  const wLog = weights.slice(-7);
  const hasWeights = wLog.length >= 2;
  let linePath = '', fillPath = '', pts = [], lastW = null, weightDelta = null;
  if (hasWeights) {
    const vals = wLog.map(w => w.weight);
    const minW = Math.min(...vals) - 0.3;
    const maxW = Math.max(...vals) + 0.3;
    const W = 100, H = 60;
    pts = vals.map((w, i) => ({
      x: (i / (vals.length - 1)) * W,
      y: H - ((w - minW) / (maxW - minW)) * H,
    }));
    linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    fillPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;
    lastW = vals[vals.length - 1];
    weightDelta = (lastW - vals[0]).toFixed(1);
  }

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 13, color: t.muted, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 2 }}>{dayLabel(lang)}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>{T('home.greeting')}, {userName}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <HomeBell onClick={() => setShowNotifs(true)} />
          <div style={{
            width: 42, height: 42, borderRadius: 13,
            background: `linear-gradient(135deg, ${t.green}, ${t.orange})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#0A0A0B', fontWeight: 800, fontSize: 15,
            boxShadow: `0 4px 12px rgba(0,0,0,0.4), ${t.innerHi}`,
          }}>{(userName[0] || 'U').toUpperCase()}</div>
        </div>
      </div>

      {/* Block 1: Daily Check-in */}
      <Card onClick={onOpenCheckIn} style={{
        background: `linear-gradient(135deg, ${t.card} 0%, ${t.card2} 100%)`,
        position: 'relative', overflow: 'hidden',
        boxShadow: `0 8px 28px rgba(0,0,0,0.45), 0 0 0 1px ${t.borderStrong} inset, ${t.innerHi}`,
      }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: `radial-gradient(circle, rgba(34,197,94,0.22), transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 120, height: 120, background: `radial-gradient(circle, rgba(139,233,255,0.08), transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative' }}>
          <Label color={t.green} style={{ marginBottom: 0 }}>{T('home.checkin')}</Label>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: t.orangeBg, padding: '4px 10px', borderRadius: 10, border: `1px solid ${t.orangeBorder}`, boxShadow: `0 0 14px rgba(249,115,22,0.25)` }}>
              <Icon name="fire" size={11} color={t.orange} />
              <span style={{ fontSize: 11, color: t.orange, fontWeight: 700 }}>{streak} {T('home.streak')}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between', marginBottom: 14, position: 'relative' }}>
          {WEEK.map((day, i) => {
            const isToday = i === ti;
            const done = checkedThisWeek[i];
            return (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 9, color: isToday ? t.green : t.muted, fontWeight: 700, letterSpacing: '0.05em' }}>{weekDayShort(lang, i)}</div>
                <div style={{
                  width: 34, height: 34, borderRadius: 17,
                  background: isToday ? t.metalGreen : done ? t.greenBg : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${isToday ? t.green : done ? t.greenBorder : t.border}`,
                  boxShadow: isToday
                    ? `0 0 18px rgba(34,197,94,0.55), ${t.innerHi}`
                    : done ? `0 0 8px rgba(34,197,94,0.15)` : 'inset 0 1px 1px rgba(0,0,0,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isToday ? '#0A0A0B' : done ? t.green : t.muted,
                  fontSize: 11.5, fontWeight: 800,
                }}>{done ? <Icon name="check" size={14} stroke={3} /> : dates[i]}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <div style={{ fontSize: 13, color: t.soft }}>{checkIns[tKey] ? T('home.checkindone') : T('home.fillcheckin')}</div>
          <Icon name="chevR" size={16} color={t.green} />
        </div>
      </Card>

      {/* Block 2: Macro rings */}
      <Card style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, position: 'relative' }}>
          {[
            { label: T('macros.protein'), color: t.protein, target: protein || 0, value: eatenP },
            { label: T('macros.carbs'),   color: t.carbs,   target: carbs   || 0, value: eatenC },
            { label: T('macros.fat'),     color: t.fat,     target: fat     || 0, value: eatenF },
          ].map(macro => {
            const noTarget = !macro.target;
            const ratio = noTarget ? 0 : macro.value / macro.target;
            const pct = Math.round(ratio * 100);
            const diff = Math.round(macro.value - macro.target);
            return (
              <div key={macro.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 10.5, color: macro.color, fontWeight: 700, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{macro.label}</div>
                <MacroRing percent={pct} color={macro.color} size={68} value={Math.round(macro.value)} noTarget={noTarget} />
                <div style={{ fontSize: 11, color: noTarget ? t.muted : (ratio > 1 ? t.warning : t.muted), fontWeight: 700, marginTop: 8 }}>
                  {noTarget
                    ? T('day.macros.eaten', { g: Math.round(macro.value) })
                    : ratio > 1
                      ? T('day.macros.over', { g: Math.abs(diff) })
                      : T('day.macros.left', { g: Math.max(0, -diff) })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Block 3: Today's workout status (static, not clickable) */}
      {(() => {
        const hasPlan = Object.keys(workoutPlan).length > 0;
        const isRest = !todayWorkout || todayWorkout === 'Rest';
        const displayName = !hasPlan
          ? null
          : isRest ? T('wo.restday') : localizeWoName(todayWorkout);
        const statusColor = todayDone ? t.green : (isRest ? t.muted : t.orange);
        const statusBg = todayDone ? 'rgba(52,199,89,0.10)' : (isRest ? t.glass : t.orangeBg);
        const statusBorder = todayDone ? 'rgba(52,199,89,0.30)' : (isRest ? t.border : t.orangeBorder);
        const statusText = !hasPlan
          ? T('home.planworkouts')
          : isRest
            ? T('home.recovery')
            : todayDone ? T('home.completed') : T('home.workout.todo');
        return (
          <Card style={{
            padding: 18, position: 'relative', overflow: 'hidden',
            background: statusBg, border: `1px solid ${statusBorder}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: todayDone ? 'rgba(52,199,89,0.18)' : (isRest ? t.glass : t.metalOrange),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${statusBorder}`, flexShrink: 0,
              }}>
                {todayDone ? (
                  <Icon name="check" size={22} color={t.green} stroke={3} />
                ) : isRest ? (
                  <Icon name="rest" size={22} color={t.muted} />
                ) : (
                  <Icon name="workout" size={22} color="#FFF" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: t.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {T('home.todaysworkout')}
                </div>
                {displayName && (
                  <div style={{ fontSize: 20, fontWeight: 800, color: t.text, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 4 }}>
                    {displayName}
                  </div>
                )}
                <div style={{ fontSize: 12.5, fontWeight: 700, color: statusColor }}>
                  {todayDone && '✓ '}{statusText}
                </div>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Block 4: Progression hub — Identity + Recent PRs + Lifetime volume */}
      <ProgressionHub data={d} T={T} />

      {/* Block 5: Weight Graph — clickable to open history */}
      <Card onClick={() => setShowHistory(true)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div>
            <Label>{T('home.weight')}</Label>
            {hasWeights ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>{lastW}</span>
                <span style={{ fontSize: 13, color: t.soft }}>kg</span>
                {weightDelta !== null && weightDelta !== '0.0' && (
                  <span style={{ fontSize: 12, color: parseFloat(weightDelta) < 0 ? t.green : t.orange, marginLeft: 6, fontWeight: 600 }}>{parseFloat(weightDelta) > 0 ? '+' : ''}{weightDelta} kg</span>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: t.muted, marginTop: 4 }}>{T('home.logweighfirst')}</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {hasWeights && <div style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{T('home.lastentries', { n: wLog.length })}</div>}
            <Icon name="chevR" size={14} color={t.muted} />
          </div>
        </div>

        {hasWeights ? (
          <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ width: '100%', height: 90 }}>
            <defs>
              <linearGradient id="wf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.green} stopOpacity="0.3" />
                <stop offset="100%" stopColor={t.green} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={fillPath} fill="url(#wf)" />
            <path d={linePath} fill="none" stroke={t.green} strokeWidth="1.5" strokeLinecap="round" />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 2 : 1.2} fill={t.green} />
            ))}
          </svg>
        ) : (
          <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: t.card2, border: `1px dashed ${t.border}` }}>
            <div style={{ fontSize: 12, color: t.muted }}>{T('home.graphhint')}</div>
          </div>
        )}
      </Card>

      <NotificationsModal visible={showNotifs} onClose={() => setShowNotifs(false)} />
      <CheckinHistoryModal visible={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
}
export function EXMAP_LEN(workouts, name) { const w = (workouts||[]).find(x => x.name === name); return w ? (w.exercises||[]).length : 4; }

/* ═══════════════════════════ PROGRESSION HUB ═══════════════════════════
 * Identity (tier + score) + Recent PRs + Lifetime volume — Home dashboard
 * card. Visual DNA: matte glass, editorial typography, calm motion. No
 * popups, no badges. Tap-target reserved for future Identity Screen modal.
 */

const TIER_KEY_MAP = {
  [TIERS.FOUNDATION]: { name: 'progress.tier.foundation', copy: 'progress.copy.foundation' },
  [TIERS.FORGED]:     { name: 'progress.tier.forged',     copy: 'progress.copy.forged' },
  [TIERS.DIALED]:     { name: 'progress.tier.dialed',     copy: 'progress.copy.dialed' },
  [TIERS.RELENTLESS]: { name: 'progress.tier.relentless', copy: 'progress.copy.relentless' },
};

const PR_KEY_MAP = {
  [PR_TYPES.HEAVIEST_WEIGHT]: 'pr.type.heaviest',
  [PR_TYPES.EST_1RM]:         'pr.type.est1rm',
  [PR_TYPES.BEST_VOLUME]:     'pr.type.volume',
};

function formatPRValue(prType, value) {
  if (prType === PR_TYPES.BEST_VOLUME) return `${Math.round(value).toLocaleString('en-US')} kg`;
  return `${Number(value).toFixed(1)} kg`;
}

function ProgressionHub({ data, T }) {
  const { tier, score } = calculateLiveIdentity(data);
  const tierKeys = TIER_KEY_MAP[tier] || TIER_KEY_MAP[TIERS.FOUNDATION];
  const exerciseStats = data.exerciseStats || {};
  const prEvents = Array.isArray(data.prEvents) ? data.prEvents : [];
  const lifetimeVol = totalLifetimeVolume(exerciseStats);

  // Recent PRs — newest first, max 3, dedupe same exercise+type same day.
  const recentPRs = [...prEvents]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 3);

  const hasAnyProgress = prEvents.length > 0 || lifetimeVol > 0;

  return (
    <Card style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
      {/* Soft top-light gradient — premium cinematic feel */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '120%', height: 110,
        background: `radial-gradient(ellipse at center top, rgba(77,139,250,0.10), transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Header row: section label */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 18, position: 'relative',
      }}>
        <Label style={{ marginBottom: 0 }}>{T('progress.your_progress')}</Label>
      </div>

      {/* Tier + score row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
        <TierRing score={score} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 24, fontWeight: 800, color: t.text,
            letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>
            {T(tierKeys.name)}
          </div>
          <div style={{
            fontSize: 12.5, color: t.soft, marginTop: 6, lineHeight: 1.45,
            fontWeight: 500, letterSpacing: '0.01em',
          }}>
            {T(tierKeys.copy)}
          </div>
        </div>
      </div>

      {/* Thin divider */}
      <div style={{
        height: 1, background: t.border, margin: '20px 0 16px', position: 'relative',
      }} />

      {/* Recent PRs section */}
      <div style={{ position: 'relative' }}>
        <Label style={{ marginBottom: 12 }}>{T('progress.recentprs')}</Label>

        {recentPRs.length > 0 ? (
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
            margin: '0 -4px', padding: '0 4px 4px',
            scrollbarWidth: 'none',
          }}>
            {recentPRs.map(pr => <PRMiniCard key={pr.id} pr={pr} T={T} />)}
          </div>
        ) : (
          <div style={{
            fontSize: 13, color: t.muted, lineHeight: 1.5, fontStyle: 'italic',
            padding: '6px 2px 4px',
          }}>
            {hasAnyProgress ? T('progress.no_prs') : T('progress.no_progress')}
          </div>
        )}
      </div>

      {/* Lifetime volume row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginTop: 18, paddingTop: 14, borderTop: `1px solid ${t.border}`,
        position: 'relative',
      }}>
        <div style={{
          fontSize: 11, color: t.muted, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {T('progress.lifetimevolume')}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{
            fontSize: 22, fontWeight: 800, color: t.text,
            letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
          }}>
            {lifetimeVol.toLocaleString('en-US')}
          </span>
          <span style={{ fontSize: 12, color: t.soft, fontWeight: 600 }}>kg</span>
        </div>
      </div>
    </Card>
  );
}

function TierRing({ score, size = 64 }) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const C = 2 * Math.PI * radius;
  const dash = (Math.min(Math.max(score, 0), 100) / 100) * C;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius}
          stroke="rgba(140,160,200,0.10)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={radius}
          stroke="url(#tierGrad)" strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${C}`} strokeLinecap="round" />
        <defs>
          <linearGradient id="tierGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6FA0FF" />
            <stop offset="100%" stopColor="#4D8BFA" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 18, fontWeight: 800, color: t.text,
          letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>
          {Math.round(score)}
        </div>
        <div style={{
          fontSize: 8, color: t.muted, fontWeight: 700, letterSpacing: '0.1em',
          marginTop: 2,
        }}>
          /100
        </div>
      </div>
    </div>
  );
}

function PRMiniCard({ pr, T }) {
  const exMeta = getExercise(pr.exerciseId);
  const exName = exMeta?.name || pr.exerciseId;
  return (
    <div style={{
      flexShrink: 0, minWidth: 130, maxWidth: 160,
      padding: '11px 12px 12px',
      borderRadius: 14,
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${t.border}`,
      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
    }}>
      <div style={{
        fontSize: 9, fontWeight: 800, color: t.soft,
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
      }}>
        {T(PR_KEY_MAP[pr.type] || 'pr.new')}
      </div>
      <div style={{
        fontSize: 18, fontWeight: 800, color: t.text,
        letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 4,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {formatPRValue(pr.type, pr.newValue)}
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
