/* ═══════════════════════════════════════════════════════════════════════════
 * EXERCISE LIBRARY
 *
 * Thin merger — actual exercise data lives in ./data/exercises/*.json,
 * split per primary muscle group for maintainability.
 *
 * Each entry shape:
 *   { id, name, primaryMuscle, secondaryMuscles, movementType, equipment,
 *     category, defaultRestSec, defaultRepRange, defaultTempo, isBodyweight,
 *     icon, instructions, source, license, video_url, thumbnail_url }
 *
 * Defaults follow the rest-timer policy: 180s for heavy compounds,
 * 120s default, 90s for isolation/small-muscle work.
 *
 * Total: 249 exercises across 7 muscle groups.
 * ═══════════════════════════════════════════════════════════════════════════ */

import chest from './data/exercises/chest.json';
import back from './data/exercises/back.json';
import shoulders from './data/exercises/shoulders.json';
import arms from './data/exercises/arms.json';
import legs from './data/exercises/legs.json';
import core from './data/exercises/core.json';
import cardio from './data/exercises/cardio.json';

// Categories shown in filter chips
export const MUSCLE_GROUPS = [
  { id: 'chest',     iconKey: 'mg_chest' },
  { id: 'back',      iconKey: 'mg_back' },
  { id: 'shoulders', iconKey: 'mg_shoulders' },
  { id: 'arms',      iconKey: 'mg_arms' },
  { id: 'legs',      iconKey: 'mg_legs' },
  { id: 'core',      iconKey: 'mg_core' },
  { id: 'cardio',    iconKey: 'mg_cardio' },
];

export const EQUIPMENT_TYPES = [
  'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'band', 'cardio',
];

export const MOVEMENT_TYPES = ['compound', 'isolation', 'cardio', 'stability'];

// Merged library — order: chest, back, shoulders, arms, legs, core, cardio
export const EXERCISE_LIBRARY = [
  ...chest,
  ...back,
  ...shoulders,
  ...arms,
  ...legs,
  ...core,
  ...cardio,
];

export function getExercise(id) {
  return EXERCISE_LIBRARY.find(e => e.id === id) || null;
}

// Lightweight search: name match + optional filters (muscle, equipment, movement).
export function searchExercises(query, filters = {}) {
  const q = (query || '').toLowerCase().trim();
  let list = EXERCISE_LIBRARY;
  if (filters.muscle && filters.muscle !== 'all') {
    list = list.filter(e => e.primaryMuscle === filters.muscle);
  }
  if (filters.equipment && filters.equipment !== 'all') {
    list = list.filter(e => e.equipment === filters.equipment);
  }
  if (filters.movement && filters.movement !== 'all') {
    list = list.filter(e => e.movementType === filters.movement);
  }
  if (q.length >= 1) {
    list = list.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.primaryMuscle.toLowerCase().includes(q) ||
      (e.secondaryMuscles || []).some(m => m.toLowerCase().includes(q))
    );
  }
  return list;
}

// Smart swap suggestions: same muscle + same movement type first, then same muscle only.
export function swapSuggestions(currentId, max = 6) {
  const cur = getExercise(currentId);
  if (!cur) return [];
  const sameMuscleAndMove = EXERCISE_LIBRARY.filter(e =>
    e.id !== currentId && e.primaryMuscle === cur.primaryMuscle && e.movementType === cur.movementType
  );
  const sameMuscleOnly = EXERCISE_LIBRARY.filter(e =>
    e.id !== currentId && e.primaryMuscle === cur.primaryMuscle && e.movementType !== cur.movementType
  );
  return [...sameMuscleAndMove, ...sameMuscleOnly].slice(0, max);
}

// Format rest time "120" → "2:00"
export function formatRestTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

// Compute total session volume = sum(weight × reps) for all completed sets
export function computeSessionVolume(session) {
  if (!session || !Array.isArray(session.exercises)) return 0;
  let total = 0;
  for (const ex of session.exercises) {
    for (const s of (ex.sets || [])) {
      if (s.completedAt && s.weight && s.reps) {
        total += Number(s.weight) * Number(s.reps);
      }
    }
  }
  return Math.round(total);
}

// Find last completed session for a specific exercise across all dates.
// Returns the most recent set entry: { weight, reps, date } or null.
export function findLastSetFor(exerciseId, workoutSessions) {
  if (!workoutSessions) return null;
  const dates = Object.keys(workoutSessions).sort().reverse();
  for (const date of dates) {
    const sess = workoutSessions[date];
    if (!sess || !Array.isArray(sess.exercises)) continue;
    const exEntry = sess.exercises.find(e => e.exerciseId === exerciseId);
    if (!exEntry) continue;
    const completedSets = (exEntry.sets || []).filter(s => s.completedAt && s.weight && s.reps);
    if (completedSets.length === 0) continue;
    const last = completedSets[completedSets.length - 1];
    return { weight: last.weight, reps: last.reps, date };
  }
  return null;
}
