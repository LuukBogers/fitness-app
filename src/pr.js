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
