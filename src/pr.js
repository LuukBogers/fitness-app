/* ═══════════════════════════════════════════════════════════════════════════
 * PR / REWARDS / PROGRESSION / IDENTITY — Foundation Module
 *
 * Pure logic layer (no UI, no side effects). Wired into workout_runner.jsx,
 * home.jsx and progress screens in subsequent phases.
 *
 * Architecture decision: all state lives in profile.data JSONB (Supabase row),
 * not separate SQL tables. Keeps the app non-tech maintainable and aligns
 * with the existing single-table model.
 *
 * Data shapes (under profile.data):
 *   exerciseStats     { [exerciseId]: { est1RM, heaviestWeight, bestVolume,
 *                                       lifetimeVolume, totalSessions, updatedAt } }
 *   compoundStrength  { [canonicalKey]: { est1RM, bodyweight, strengthRatio,
 *                                         updatedAt } }
 *   prEvents          [ { id, workoutId, exerciseId, type, oldValue, newValue,
 *                         suspicious, surfacedInFlow, createdAt } ]
 *   identityState     { currentTier, tierScore, promotedAt, consistencyScore,
 *                       recoveryScore, adherenceScore, updatedAt }
 *   timeline          [ { id, type, title, subtitle, metadata, createdAt } ]
 *   weeklyReviews     [ { id, weekStart, summary, createdAt } ]
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Constants ─────────────────────────────────────────────────────────── */

export const PR_TYPES = {
  HEAVIEST_WEIGHT: 'HEAVIEST_WEIGHT',
  EST_1RM: 'EST_1RM',
  BEST_VOLUME: 'BEST_VOLUME',
};

export const TIERS = {
  FOUNDATION: 'foundation',
  FORGED: 'forged',
  DIALED: 'dialed',
  RELENTLESS: 'relentless',
};

export const TIER_ORDER = [TIERS.FOUNDATION, TIERS.FORGED, TIERS.DIALED, TIERS.RELENTLESS];

export const TIMELINE_TYPES = {
  CONSISTENCY_RECOVERY: 'CONSISTENCY_RECOVERY',
  STRENGTH_RECOMP: 'STRENGTH_RECOMP',
  DISCIPLINE_ADHERENCE: 'DISCIPLINE_ADHERENCE',
  RECOVERY_INTELLIGENCE: 'RECOVERY_INTELLIGENCE',
  LONG_TERM_CONSISTENCY: 'LONG_TERM_CONSISTENCY',
  FULL_CYCLE_COMPLETION: 'FULL_CYCLE_COMPLETION',
};

// Valid rep range for Epley estimation. Outside this range we skip PR detection
// (1-2 reps = ego liften, 13+ reps = formula breaks down for hypertrophy).
export const MIN_PR_REPS = 3;
export const MAX_PR_REPS = 12;

// Sanity check thresholds — flag PR-event but still save the set.
export const SANITY_1RM_JUMP_PCT = 0.12;      // 12% sudden jump → suspicious
export const SANITY_WEIGHT_BW_RATIO = 3.5;    // weight > 3.5× bodyweight → suspicious

/* ─── Canonical compound mapping ────────────────────────────────────────── */
/* The 7 lifts that determine strength-ratio tracking. Each canonical key maps
 * to one OR MORE library exerciseIds (variants that count as the same lift
 * for strength purposes). See blueprint §3 for which variants count.        */

export const CANONICAL_COMPOUNDS = {
  bench: {
    name: 'Bench Press',
    exerciseIds: ['bb_bench_press'],
    // Note: close-grip BB bench lives in arms/ — added once that id is known.
  },
  squat: {
    name: 'Back Squat',
    // Both high-bar and low-bar map here. bb_squat is a legacy duplicate of
    // bb_back_squat in the library and gets folded in for safety.
    exerciseIds: ['bb_back_squat', 'bb_squat', 'bb_full_squat'],
  },
  deadlift: {
    name: 'Deadlift',
    // Library has both `deadlift` (Conventional) and `bb_deadlift` (Barbell)
    // as duplicates of the same canonical lift.
    exerciseIds: ['deadlift', 'bb_deadlift'],
  },
  ohp: {
    name: 'Overhead Press',
    exerciseIds: ['ohp', 'stand_military_press', 'bb_shoulder_press'],
  },
  pullup: {
    name: 'Pull-up',
    // Strict bodyweight pullup + weighted variants (currently same id, weight
    // is logged on the set itself which is what strength tracking needs).
    exerciseIds: ['pullup'],
  },
  row: {
    name: 'Barbell Row',
    exerciseIds: ['bb_row', 'bent_over_bb_row'],
  },
  hip_thrust: {
    name: 'Hip Thrust',
    exerciseIds: ['hip_thrust'],
  },
};

// Reverse lookup: exerciseId → canonicalKey (or null if not a tracked compound).
const _exerciseToCanonical = (() => {
  const map = {};
  for (const [key, cfg] of Object.entries(CANONICAL_COMPOUNDS)) {
    for (const id of cfg.exerciseIds) map[id] = key;
  }
  return map;
})();

export function getCanonicalCompound(exerciseId) {
  return _exerciseToCanonical[exerciseId] || null;
}

export function isCompoundExercise(exerciseId) {
  return _exerciseToCanonical[exerciseId] != null;
}

/* ─── Core formulas ─────────────────────────────────────────────────────── */

/** Epley 1RM estimator. Valid for reps 1-15; we cap PR-detection at MAX_PR_REPS. */
export function calculateEpley(weight, reps) {
  const w = Number(weight) || 0;
  const r = Number(reps) || 0;
  if (w <= 0 || r <= 0) return 0;
  return w * (1 + r / 30);
}

/** Returns true when reps are inside the PR-detection window. */
export function isValidPRRep(reps) {
  const r = Number(reps) || 0;
  return r >= MIN_PR_REPS && r <= MAX_PR_REPS;
}

/** Round to 1 decimal — used for display values to avoid 132.4729 KG. */
export function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

/* ─── Empty-state initializers ──────────────────────────────────────────── */
/* Used by callers to ensure profile.data has the right shape before reads.   */

export function emptyExerciseStats() {
  return {
    est1RM: 0,
    heaviestWeight: 0,
    bestVolume: 0,
    lifetimeVolume: 0,
    totalSessions: 0,
    updatedAt: null,
  };
}

export function emptyCompoundStrength() {
  return {
    est1RM: 0,
    bodyweight: 0,
    strengthRatio: 0,
    updatedAt: null,
  };
}

export function emptyIdentityState() {
  return {
    currentTier: TIERS.FOUNDATION,
    tierScore: 0,
    promotedAt: null,
    consistencyScore: 0,
    recoveryScore: 0,
    adherenceScore: 0,
    updatedAt: null,
  };
}

/** Returns a profile.data clone with all PR/identity shapes guaranteed. */
export function ensureProgressionShape(data) {
  const d = data ? { ...data } : {};
  if (!d.exerciseStats || typeof d.exerciseStats !== 'object') d.exerciseStats = {};
  if (!d.compoundStrength || typeof d.compoundStrength !== 'object') d.compoundStrength = {};
  if (!Array.isArray(d.prEvents)) d.prEvents = [];
  if (!d.identityState || typeof d.identityState !== 'object') d.identityState = emptyIdentityState();
  if (!Array.isArray(d.timeline)) d.timeline = [];
  if (!Array.isArray(d.weeklyReviews)) d.weeklyReviews = [];
  return d;
}

/* ─── Sanity checking ───────────────────────────────────────────────────── */

/**
 * Decides whether a set's 1RM estimate looks suspicious. Returns:
 *   { suspicious: false } or
 *   { suspicious: true, reason: '1RM_JUMP'|'ABSOLUTE_WEIGHT' }
 *
 * Note: never blocks the save — caller still persists the set. Used to mark
 * the PR-event with flagged_suspicious=true and skip in-flow celebration.
 */
export function checkSanity({ newEst1RM, currentEst1RM, weight, bodyweight }) {
  if (currentEst1RM > 0) {
    const jumpPct = (newEst1RM - currentEst1RM) / currentEst1RM;
    if (jumpPct > SANITY_1RM_JUMP_PCT) {
      return { suspicious: true, reason: '1RM_JUMP', delta: round1(jumpPct * 100) };
    }
  }
  const bw = Number(bodyweight) || 0;
  if (bw > 0 && weight > bw * SANITY_WEIGHT_BW_RATIO) {
    return { suspicious: true, reason: 'ABSOLUTE_WEIGHT' };
  }
  return { suspicious: false };
}

/* ─── PR detection ──────────────────────────────────────────────────────── */

/**
 * Detect a PR for a freshly-completed set. Priority order matches blueprint:
 *   HEAVIEST_WEIGHT > EST_1RM > BEST_VOLUME (max one detection per call).
 *
 * @param {Object} opts
 * @param {Object} opts.stats     current exerciseStats[exerciseId] (or emptyExerciseStats())
 * @param {Object} opts.set       { weight, reps }
 * @param {number} opts.sessionVolumeForExercise  cumulative weight×reps for this exercise in current workout
 * @returns {null | { type, oldValue, newValue }}
 */
export function detectPR({ stats, set, sessionVolumeForExercise }) {
  const weight = Number(set.weight) || 0;
  const reps = Number(set.reps) || 0;
  if (weight <= 0 || reps <= 0) return null;

  const s = stats || emptyExerciseStats();
  const est1RM = calculateEpley(weight, reps);

  // HEAVIEST_WEIGHT: any rep count counts. The set must be heavier than
  // anything ever logged for this exercise.
  if (weight > (s.heaviestWeight || 0)) {
    return {
      type: PR_TYPES.HEAVIEST_WEIGHT,
      oldValue: round1(s.heaviestWeight || 0),
      newValue: round1(weight),
    };
  }

  // EST_1RM: only valid for hypertrophy-range reps (3-12).
  if (isValidPRRep(reps) && est1RM > (s.est1RM || 0)) {
    return {
      type: PR_TYPES.EST_1RM,
      oldValue: round1(s.est1RM || 0),
      newValue: round1(est1RM),
    };
  }

  // BEST_VOLUME: cumulative session volume for this exercise beats best ever.
  if (sessionVolumeForExercise > (s.bestVolume || 0)) {
    return {
      type: PR_TYPES.BEST_VOLUME,
      oldValue: Math.round(s.bestVolume || 0),
      newValue: Math.round(sessionVolumeForExercise),
    };
  }

  return null;
}

/* ─── Stats updates (immutable) ─────────────────────────────────────────── */

/**
 * Return a new exerciseStats[id] object with set folded in. Does NOT touch
 * lifetimeVolume or totalSessions — those update at workout completion only.
 *
 * @param {Object} prev    current stats for this exercise
 * @param {Object} set     { weight, reps }
 * @param {number} sessionVolumeForExercise
 */
export function applySetToStats(prev, set, sessionVolumeForExercise) {
  const s = prev || emptyExerciseStats();
  const weight = Number(set.weight) || 0;
  const reps = Number(set.reps) || 0;
  if (weight <= 0 || reps <= 0) return s;

  const est1RM = isValidPRRep(reps) ? calculateEpley(weight, reps) : 0;
  const next = { ...s };

  if (weight > (next.heaviestWeight || 0)) next.heaviestWeight = round1(weight);
  if (est1RM > (next.est1RM || 0)) next.est1RM = round1(est1RM);
  if (sessionVolumeForExercise > (next.bestVolume || 0)) {
    next.bestVolume = Math.round(sessionVolumeForExercise);
  }
  next.updatedAt = new Date().toISOString();
  return next;
}

/**
 * Process a completed workout session into a stats diff + PR-event list.
 * Run at workout-complete time only (NOT realtime — realtime is for in-flow
 * detection via detectPR()).
 *
 * @param {Object} opts
 * @param {Object} opts.session    { id, exercises: [{ exerciseId, sets: [{weight, reps, completedAt}] }] }
 * @param {Object} opts.profileData  existing profile.data (already ensureProgressionShape'd)
 * @param {number} opts.bodyweight  current user bodyweight (for compound strength ratio)
 * @returns {Object} {
 *   exerciseStatsUpdates: { [id]: stats },
 *   compoundStrengthUpdates: { [canonicalKey]: { est1RM, bodyweight, strengthRatio, updatedAt } },
 *   prEvents: [...newEvents],
 *   sessionVolumeByExercise: { [id]: number },
 *   totalSessionVolume: number
 * }
 */
export function processWorkoutCompletion({ session, profileData, bodyweight }) {
  const out = {
    exerciseStatsUpdates: {},
    compoundStrengthUpdates: {},
    prEvents: [],
    sessionVolumeByExercise: {},
    totalSessionVolume: 0,
  };
  if (!session || !Array.isArray(session.exercises)) return out;

  const now = new Date().toISOString();
  const currentStats = (profileData && profileData.exerciseStats) || {};

  for (const ex of session.exercises) {
    const exId = ex.exerciseId;
    if (!exId) continue;
    const sets = (ex.sets || []).filter(s => s.completedAt && Number(s.weight) > 0 && Number(s.reps) > 0);
    if (sets.length === 0) continue;

    // Cumulative session volume for this exercise.
    const sessionVol = sets.reduce((acc, s) => acc + Number(s.weight) * Number(s.reps), 0);
    out.sessionVolumeByExercise[exId] = sessionVol;
    out.totalSessionVolume += sessionVol;

    // Start from current persistent stats, fold each set in chronologically.
    let next = { ...(currentStats[exId] || emptyExerciseStats()) };
    let runningExVol = 0;

    for (const set of sets) {
      runningExVol += Number(set.weight) * Number(set.reps);
      const pr = detectPR({
        stats: next,
        set,
        sessionVolumeForExercise: runningExVol,
      });
      if (pr) {
        // Sanity check (informational only — we still record the event).
        const sanity = checkSanity({
          newEst1RM: calculateEpley(set.weight, set.reps),
          currentEst1RM: next.est1RM || 0,
          weight: Number(set.weight),
          bodyweight,
        });
        out.prEvents.push({
          id: _newId(),
          workoutId: session.id || null,
          exerciseId: exId,
          type: pr.type,
          oldValue: pr.oldValue,
          newValue: pr.newValue,
          suspicious: !!sanity.suspicious,
          suspiciousReason: sanity.suspicious ? sanity.reason : null,
          surfacedInFlow: false,
          createdAt: now,
        });
      }
      next = applySetToStats(next, set, runningExVol);
    }

    // Lifetime aggregates update at completion.
    next.lifetimeVolume = Math.round((next.lifetimeVolume || 0) + sessionVol);
    next.totalSessions = (next.totalSessions || 0) + 1;
    next.updatedAt = now;

    out.exerciseStatsUpdates[exId] = next;

    // Compound strength ratio (only for the 7 tracked lifts).
    const canonicalKey = getCanonicalCompound(exId);
    if (canonicalKey && bodyweight > 0 && next.est1RM > 0) {
      const prevCompound = (profileData.compoundStrength || {})[canonicalKey];
      if (!prevCompound || next.est1RM > (prevCompound.est1RM || 0)) {
        out.compoundStrengthUpdates[canonicalKey] = {
          est1RM: round1(next.est1RM),
          bodyweight: round1(bodyweight),
          strengthRatio: round1(next.est1RM / bodyweight * 100) / 100,
          updatedAt: now,
        };
      }
    }
  }

  return out;
}

/* ─── Tier engine (weighted, gender-blind) ─────────────────────────────── */
/* Score formula from blueprint §4.5. Caps at 100, real max ≈ 95.8.          */

/**
 * @param {Object} metrics
 * @param {number} metrics.workoutsCompleted   total lifetime workouts
 * @param {number} metrics.weeksActive         distinct weeks with ≥1 workout
 * @param {number} metrics.adherencePct        0-100, plan-adherence avg
 * @param {number} metrics.recoveryCompliance  0-100, deload + rest-day discipline
 * @returns {number}  tier score 0-100
 */
export function calculateTierScore(metrics) {
  const wo = Math.min(40, Number(metrics.workoutsCompleted) || 0) * 0.35;       // max 14
  const we = Math.min(24, Number(metrics.weeksActive) || 0) * 1.2;              // max 28.8
  const ad = Math.min(100, Number(metrics.adherencePct) || 0) * 0.35;           // max 35
  const rc = Math.min(100, Number(metrics.recoveryCompliance) || 0) * 0.18;     // max 18
  return Math.min(100, round1(wo + we + ad + rc));
}

export function tierFromScore(score) {
  const s = Number(score) || 0;
  if (s >= 75) return TIERS.RELENTLESS;
  if (s >= 50) return TIERS.DIALED;
  if (s >= 25) return TIERS.FORGED;
  return TIERS.FOUNDATION;
}

/** Returns descent of tier subtitle copy for the Identity screen. */
export function tierCopy(tier) {
  switch (tier) {
    case TIERS.RELENTLESS: return 'Built through consistency and recovery.';
    case TIERS.DIALED:     return 'Precision. Control. Rhythm.';
    case TIERS.FORGED:     return 'Discipline is becoming visible.';
    case TIERS.FOUNDATION:
    default:               return 'First control over yourself.';
  }
}

/* ─── Live tier metrics (no persistence needed) ─────────────────────────── */

/**
 * Compute tier metrics from raw profile.data. Used by Home for live display
 * without needing the identityState write to have happened yet.
 *
 * Recovery compliance is hard-coded to 70 as a baseline until the recovery
 * tracking feature lands (blueprint §4.5 open issue, Day 8).
 */
export function calculateLiveTierMetrics(profileData) {
  const data = profileData || {};
  const sessions = data.workoutSessions || {};
  const log = data.workoutLog || {};
  const plan = data.workoutPlan || {};

  const sessionDates = Object.keys(sessions);
  const workoutsCompleted = sessionDates.length;

  // Unique ISO weeks (YYYY-Www) containing at least one session.
  const weekSet = new Set();
  for (const dateKey of sessionDates) {
    const d = new Date(dateKey);
    if (isNaN(d.getTime())) continue;
    weekSet.add(_isoWeekKey(d));
  }
  const weeksActive = weekSet.size;

  // Adherence: completed workouts in the last 28 days vs planned days × 4.
  const plannedDaysPerWeek = Object.values(plan).filter(v => v && v !== 'Rest').length;
  let adherencePct = 70; // baseline before plan exists
  if (plannedDaysPerWeek > 0) {
    const cutoff = Date.now() - 28 * 24 * 60 * 60 * 1000;
    let completed = 0;
    for (const dateKey in log) {
      const dt = new Date(dateKey);
      if (isNaN(dt.getTime()) || dt.getTime() < cutoff) continue;
      if (log[dateKey]?.completed) completed += 1;
    }
    const target = plannedDaysPerWeek * 4;
    adherencePct = Math.min(100, Math.round((completed / target) * 100));
  }

  const recoveryCompliance = 70; // placeholder until recovery tracking lands

  return { workoutsCompleted, weeksActive, adherencePct, recoveryCompliance };
}

/** Returns full identity snapshot { tier, score, metrics } for live use. */
export function calculateLiveIdentity(profileData) {
  const metrics = calculateLiveTierMetrics(profileData);
  const score = calculateTierScore(metrics);
  const tier = tierFromScore(score);
  return { tier, score, metrics };
}

function _isoWeekKey(date) {
  // Returns "YYYY-Www" ISO week key.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

/* ─── Aggregations for dashboards ───────────────────────────────────────── */

/**
 * Total lifetime volume across all exercises. Cheap O(n) over exerciseStats.
 */
export function totalLifetimeVolume(exerciseStats) {
  if (!exerciseStats) return 0;
  let total = 0;
  for (const id in exerciseStats) total += Number(exerciseStats[id].lifetimeVolume) || 0;
  return Math.round(total);
}

/**
 * Lifetime volume grouped by primary muscle. Requires the library getter.
 *
 * @param {Object} exerciseStats
 * @param {Function} getExerciseById   typically `getExercise` from exercise_library.js
 * @returns {Object} { chest: 12345, back: 67890, ... }
 */
export function lifetimeVolumeByMuscle(exerciseStats, getExerciseById) {
  const out = {};
  if (!exerciseStats || typeof getExerciseById !== 'function') return out;
  for (const id in exerciseStats) {
    const ex = getExerciseById(id);
    if (!ex) continue;
    const muscle = ex.primaryMuscle || 'other';
    out[muscle] = (out[muscle] || 0) + (Number(exerciseStats[id].lifetimeVolume) || 0);
  }
  for (const m in out) out[m] = Math.round(out[m]);
  return out;
}

/**
 * Filter PR events by exercise and/or type, newest first.
 */
export function getPREvents(prEvents, { exerciseId, type, limit } = {}) {
  if (!Array.isArray(prEvents)) return [];
  let list = prEvents;
  if (exerciseId) list = list.filter(e => e.exerciseId === exerciseId);
  if (type) list = list.filter(e => e.type === type);
  list = list.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  if (typeof limit === 'number') list = list.slice(0, limit);
  return list;
}

/**
 * 1RM trend points for a given exercise. Returns sorted ascending by date.
 * Used by the Exercise Detail line chart.
 */
export function est1RMHistory(prEvents, exerciseId) {
  if (!Array.isArray(prEvents)) return [];
  return prEvents
    .filter(e => e.exerciseId === exerciseId && e.type === PR_TYPES.EST_1RM)
    .map(e => ({ date: e.createdAt, value: e.newValue }))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}

/* ─── Identity Evidence Timeline triggers ───────────────────────────────── */
/* Three of six blueprint triggers implemented for MVP. Three deferred until
 * supporting features land: DISCIPLINE_ADHERENCE (needs nutrition adherence),
 * RECOVERY_INTELLIGENCE (needs deload tracking), FULL_CYCLE_COMPLETION (needs
 * program/cycle tracking). See blueprint §10 open issues.                    */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Inspect profile data and return new timeline entries that haven't been
 * generated yet. Idempotent — calling multiple times produces no duplicates
 * because each trigger type has a uniqueness key written to metadata.
 *
 * @param {Object} profileData  ensureProgressionShape'd profile.data
 * @returns {Array} new timeline entries (caller persists them)
 */
export function generateTimelineEntries(profileData) {
  const data = profileData || {};
  const sessions = data.workoutSessions || {};
  const existing = Array.isArray(data.timeline) ? data.timeline : [];
  const weights = Array.isArray(data.weights) ? data.weights : [];
  const exerciseStats = data.exerciseStats || {};

  const now = new Date().toISOString();
  const newEntries = [];

  const sessionKeys = Object.keys(sessions).sort();
  if (sessionKeys.length === 0) return newEntries;

  // Helper: has trigger type already fired (optionally for a specific key)
  const hasFired = (type, key) => existing.some(e =>
    e.type === type && (!key || (e.metadata && e.metadata.key === key))
  );

  // ─── Trigger 5: LONG_TERM_CONSISTENCY (12 unique weeks ever) ──────────
  if (!hasFired(TIMELINE_TYPES.LONG_TERM_CONSISTENCY)) {
    const weekSet = new Set();
    for (const k of sessionKeys) {
      const d = new Date(k);
      if (!isNaN(d.getTime())) weekSet.add(_isoWeekKey(d));
    }
    if (weekSet.size >= 12) {
      newEntries.push({
        id: _newId(),
        type: TIMELINE_TYPES.LONG_TERM_CONSISTENCY,
        titleKey: 'timeline.long_term_consistency.title',
        subtitleKey: 'timeline.long_term_consistency.subtitle',
        subtitleVars: { weeks: weekSet.size },
        metadata: { weeks: weekSet.size },
        createdAt: now,
      });
    }
  }

  // ─── Trigger 1: CONSISTENCY_RECOVERY (3 sessions after >7d gap) ──────
  // Walk through sessions chronologically. After every gap >7 days, count the
  // next 3 sessions within 7 days. If found → emit one entry per gap, keyed by
  // the gap's "return-date" so re-runs don't duplicate.
  if (sessionKeys.length >= 4) {
    for (let i = 1; i < sessionKeys.length; i++) {
      const prev = new Date(sessionKeys[i - 1]);
      const curr = new Date(sessionKeys[i]);
      if (isNaN(prev.getTime()) || isNaN(curr.getTime())) continue;
      const gapDays = (curr - prev) / MS_PER_DAY;
      if (gapDays <= 7) continue;
      // Count sessions in 7d window after return
      const windowEnd = curr.getTime() + 7 * MS_PER_DAY;
      let count = 0;
      for (let j = i; j < sessionKeys.length; j++) {
        const dt = new Date(sessionKeys[j]).getTime();
        if (dt > windowEnd) break;
        count += 1;
      }
      if (count >= 3) {
        const key = `return-${sessionKeys[i]}`;
        if (!hasFired(TIMELINE_TYPES.CONSISTENCY_RECOVERY, key)) {
          newEntries.push({
            id: _newId(),
            type: TIMELINE_TYPES.CONSISTENCY_RECOVERY,
            titleKey: 'timeline.consistency_recovery.title',
            subtitleKey: 'timeline.consistency_recovery.subtitle',
            subtitleVars: { sessions: count, days: Math.round(gapDays) },
            metadata: { key, gapDays: Math.round(gapDays), sessions: count },
            createdAt: now,
          });
        }
      }
    }
  }

  // ─── Trigger 2: STRENGTH_RECOMP (strength ↑ + bodyweight stable) ─────
  // Conditions over the last 28 days:
  //   - At least one est1RM PR was set (lifetimeVolume increase isn't enough)
  //   - Bodyweight range < 2.0 kg (stable)
  //   - At least 2 bodyweight readings in the window
  if (!hasFired(TIMELINE_TYPES.STRENGTH_RECOMP, _monthKey())) {
    const cutoff = Date.now() - 28 * MS_PER_DAY;
    const recentWeights = weights
      .map(w => ({ ts: new Date(w.date).getTime(), kg: Number(w.weight) || 0 }))
      .filter(w => !isNaN(w.ts) && w.ts >= cutoff);
    if (recentWeights.length >= 2) {
      const kgs = recentWeights.map(w => w.kg);
      const range = Math.max(...kgs) - Math.min(...kgs);
      if (range < 2.0) {
        // Look for an EST_1RM event in last 28 days
        const events = Array.isArray(data.prEvents) ? data.prEvents : [];
        const hadStrengthEvent = events.some(e =>
          e.type === PR_TYPES.EST_1RM &&
          new Date(e.createdAt).getTime() >= cutoff
        );
        if (hadStrengthEvent) {
          newEntries.push({
            id: _newId(),
            type: TIMELINE_TYPES.STRENGTH_RECOMP,
            titleKey: 'timeline.strength_recomp.title',
            subtitleKey: 'timeline.strength_recomp.subtitle',
            subtitleVars: {},
            metadata: {
              key: _monthKey(),
              bodyweightRange: round1(range),
              avgBodyweight: round1(kgs.reduce((s, k) => s + k, 0) / kgs.length),
            },
            createdAt: now,
          });
        }
      }
    }
  }

  return newEntries;
}

function _monthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
}

/* ─── Weekly Review generator ───────────────────────────────────────────── */

/**
 * Compute a weekly review snapshot for the week containing `dateRef` (default
 * = current Monday). Returns null if no sessions or weights logged that week.
 *
 * Shape:
 *   { weekStart, sessionCount, totalVolume, prCount, topPR, bodyweightDelta,
 *     identitySentenceKey, headline }
 */
export function generateWeeklyReview(profileData, dateRef = new Date()) {
  const data = profileData || {};
  const sessions = data.workoutSessions || {};
  const prEvents = Array.isArray(data.prEvents) ? data.prEvents : [];
  const weights = Array.isArray(data.weights) ? data.weights : [];

  const monday = _mondayOf(dateRef);
  const sunday = new Date(monday.getTime() + 7 * MS_PER_DAY - 1);
  const inWeek = (isoStr) => {
    const t = new Date(isoStr).getTime();
    return !isNaN(t) && t >= monday.getTime() && t <= sunday.getTime();
  };

  const weekSessions = Object.entries(sessions).filter(([k]) => inWeek(k));
  const weekPRs = prEvents.filter(e => inWeek(e.createdAt));

  let totalVolume = 0;
  for (const [, sess] of weekSessions) {
    for (const ex of (sess.exercises || [])) {
      for (const s of (ex.sets || [])) {
        if (s.completedAt) totalVolume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
      }
    }
  }

  // Bodyweight delta over the week
  let bodyweightDelta = null;
  const weekWeights = weights
    .map(w => ({ ts: new Date(w.date).getTime(), kg: Number(w.weight) || 0 }))
    .filter(w => !isNaN(w.ts) && w.ts >= monday.getTime() && w.ts <= sunday.getTime());
  if (weekWeights.length >= 2) {
    bodyweightDelta = round1(weekWeights[weekWeights.length - 1].kg - weekWeights[0].kg);
  }

  // Pick top PR
  const topPR = weekPRs.find(p => p.type === PR_TYPES.EST_1RM)
             || weekPRs.find(p => p.type === PR_TYPES.HEAVIEST_WEIGHT)
             || weekPRs.find(p => p.type === PR_TYPES.BEST_VOLUME)
             || null;

  if (weekSessions.length === 0 && weekPRs.length === 0 && !bodyweightDelta) {
    return null;
  }

  // Headline picks based on data shape (no PR-spam — calm copy)
  let headline = 'A quiet week.';
  if (weekPRs.length > 0 && bodyweightDelta !== null && bodyweightDelta <= 0) {
    headline = 'Strength up while bodyweight held.';
  } else if (weekPRs.length > 0) {
    headline = `${weekPRs.length} personal best${weekPRs.length === 1 ? '' : 's'} this week.`;
  } else if (weekSessions.length >= 3) {
    headline = 'Consistency held.';
  } else if (weekSessions.length > 0) {
    headline = 'A step forward.';
  }

  return {
    weekStart: monday.toISOString().slice(0, 10),
    sessionCount: weekSessions.length,
    totalVolume: Math.round(totalVolume),
    prCount: weekPRs.length,
    topPR,
    bodyweightDelta,
    headline,
  };
}

function _mondayOf(date) {
  const d = new Date(date);
  const dayUtc = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (dayUtc - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/* ─── In-flow runtime helpers ───────────────────────────────────────────── */
/* These are stateless helpers — actual runtime state (inFlowPRShown,
 * currentWorkoutVolume) lives in the workout_runner component's local state. */

/**
 * Should we play the in-flow PR celebration for this detected PR?
 * Rules:
 *   - Max one in-flow per workout (caller tracks the flag).
 *   - Suspicious PRs are never surfaced in-flow (only post-workout).
 */
export function shouldSurfaceInFlow({ prDetected, inFlowAlreadyShown, suspicious }) {
  if (!prDetected) return false;
  if (inFlowAlreadyShown) return false;
  if (suspicious) return false;
  return true;
}

/**
 * Localizable copy for the in-flow PR label. Two tiers of intensity per
 * blueprint: in-flow = quiet, post-workout = cinematic. We expose both.
 */
export function prInFlowLabel(prType) {
  // Single string by design — visual hierarchy lives in the UI.
  return 'New Personal Best';
}

export function prPostWorkoutHeadline(prType) {
  switch (prType) {
    case PR_TYPES.HEAVIEST_WEIGHT: return 'Heaviest weight ever';
    case PR_TYPES.EST_1RM:         return 'New estimated 1RM';
    case PR_TYPES.BEST_VOLUME:     return 'Best session volume';
    default:                       return 'Personal best';
  }
}

/* ─── Internal ──────────────────────────────────────────────────────────── */

function _newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
