/* ═══════════════════════════════════════════════════════════════════════════
 * WORKOUT TEMPLATE GENERATOR
 *
 * Takes a workoutPlan ({ Mon: 'Rug', Tue: 'Benen', ... }) and generates
 * matching template objects with sensible exercise selection.
 *
 * Strategy:
 *  - Detect target muscle groups from template name (multilingual keyword map)
 *  - 1 group → 3 compounds + 3 isolations (= 5-6 exercises)
 *  - 2+ groups → 2 compounds first group + 1 compound + 1 isolation each other
 *  - Pull days (back) auto-include biceps (2 arm isolations)
 *  - Push days (chest) auto-include shoulders + triceps
 *  - Cap at 7 exercises per template (one-hour session limit)
 *  - Each picked exercise inherits defaultRepRange / defaultRestSec / defaultTempo
 *    from EXERCISE_LIBRARY so progressive-overload tracking starts correct.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { EXERCISE_LIBRARY } from './exercise_library';
import { newId } from './lib';

// Multilingual keyword → muscle groups. Order matters: priority muscle first.
// Lowercased exact-match preferred over substring contains.
const MUSCLE_KEYWORDS = {
  // ── Dutch ──────────────────────────────────────────────
  'rug':           { groups: ['back', 'arms'],                tag: 'pull' },
  'borst':         { groups: ['chest', 'shoulders', 'arms'],  tag: 'push' },
  'benen':         { groups: ['legs'],                        tag: 'legs' },
  'been':          { groups: ['legs'],                        tag: 'legs' },
  'schouders':     { groups: ['shoulders'],                   tag: 'shoulders' },
  'schouder':      { groups: ['shoulders'],                   tag: 'shoulders' },
  'armen':         { groups: ['arms'],                        tag: 'arms' },
  'arm':           { groups: ['arms'],                        tag: 'arms' },
  'bovenlichaam':  { groups: ['chest', 'back', 'shoulders', 'arms'], tag: 'upper' },
  'onderlichaam':  { groups: ['legs', 'core'],                tag: 'lower' },
  'buik':          { groups: ['core'],                        tag: 'core' },
  'core':          { groups: ['core'],                        tag: 'core' },
  'cardio':        { groups: ['cardio'],                      tag: 'cardio' },
  // ── English ────────────────────────────────────────────
  'back':          { groups: ['back', 'arms'],                tag: 'pull' },
  'pull':          { groups: ['back', 'arms'],                tag: 'pull' },
  'chest':         { groups: ['chest', 'shoulders', 'arms'],  tag: 'push' },
  'push':          { groups: ['chest', 'shoulders', 'arms'],  tag: 'push' },
  'legs':          { groups: ['legs'],                        tag: 'legs' },
  'leg':           { groups: ['legs'],                        tag: 'legs' },
  'shoulders':     { groups: ['shoulders'],                   tag: 'shoulders' },
  'shoulder':      { groups: ['shoulders'],                   tag: 'shoulders' },
  'arms':          { groups: ['arms'],                        tag: 'arms' },
  'upper':         { groups: ['chest', 'back', 'shoulders', 'arms'], tag: 'upper' },
  'lower':         { groups: ['legs', 'core'],                tag: 'lower' },
  'posterior':     { groups: ['back', 'legs'],                tag: 'posterior' },
  'anterior':      { groups: ['chest', 'shoulders'],          tag: 'anterior' },
  'full body':     { groups: ['chest', 'back', 'legs', 'shoulders'], tag: 'fullbody' },
  'fullbody':      { groups: ['chest', 'back', 'legs', 'shoulders'], tag: 'fullbody' },
  // ── Other languages (short keys that work cross-lang) ─
  'rücken':        { groups: ['back', 'arms'],                tag: 'pull' },
  'brust':         { groups: ['chest', 'shoulders', 'arms'],  tag: 'push' },
  'beine':         { groups: ['legs'],                        tag: 'legs' },
  'piernas':       { groups: ['legs'],                        tag: 'legs' },
  'pecho':         { groups: ['chest', 'shoulders', 'arms'],  tag: 'push' },
  'espalda':       { groups: ['back', 'arms'],                tag: 'pull' },
};

function detectGroups(name) {
  const lower = (name || '').toLowerCase().trim();
  if (!lower) return { groups: ['chest', 'back'], tag: 'fullbody' };
  // Exact match wins
  if (MUSCLE_KEYWORDS[lower]) return MUSCLE_KEYWORDS[lower];
  // Substring fallback (longest match first)
  const keys = Object.keys(MUSCLE_KEYWORDS).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (lower.includes(k)) return MUSCLE_KEYWORDS[k];
  }
  // Truly unknown → full-body default
  return { groups: ['chest', 'back', 'legs'], tag: 'fullbody' };
}

// Filter the library by muscle group + movement type, exclude already-picked
function libBy(muscle, movement, excludeIds) {
  return EXERCISE_LIBRARY.filter(e =>
    e.primaryMuscle === muscle && e.movementType === movement && !excludeIds.has(e.id)
  );
}

// Smart variety picker: prefer different equipment within the same muscle group
function pickWithVariety(candidates, count) {
  const picked = [];
  const seenEquip = new Set();
  // First pass: pick exercises with distinct equipment
  for (const c of candidates) {
    if (picked.length >= count) break;
    if (!seenEquip.has(c.equipment)) {
      picked.push(c);
      seenEquip.add(c.equipment);
    }
  }
  // Fill remaining slots
  for (const c of candidates) {
    if (picked.length >= count) break;
    if (!picked.includes(c)) picked.push(c);
  }
  return picked;
}

function buildExerciseEntry(libEntry) {
  return {
    exerciseId: libEntry.id,
    setCount: libEntry.movementType === 'compound' ? 3 : 3,
    repRange: libEntry.defaultRepRange,
    restSec: libEntry.defaultRestSec,
    tempo: libEntry.defaultTempo || '',
  };
}

// Public: build a template from one name
export function generateTemplateFromName(name) {
  const { groups, tag } = detectGroups(name);
  const pickedIds = new Set();
  const exercises = [];

  if (groups.length === 1) {
    // Single-muscle focus → 3 compounds + 3 isolations
    const main = groups[0];
    const compounds = pickWithVariety(libBy(main, 'compound', pickedIds), 3);
    compounds.forEach(e => { exercises.push(buildExerciseEntry(e)); pickedIds.add(e.id); });
    const isolations = pickWithVariety(libBy(main, 'isolation', pickedIds), 3);
    isolations.forEach(e => { exercises.push(buildExerciseEntry(e)); pickedIds.add(e.id); });
  } else {
    // Multi-muscle (push/pull/upper/etc.) → first group gets 2 compounds, others 1 compound + 1 isolation
    groups.forEach((g, idx) => {
      const compoundCount = idx === 0 ? 2 : 1;
      const compounds = pickWithVariety(libBy(g, 'compound', pickedIds), compoundCount);
      compounds.forEach(e => { exercises.push(buildExerciseEntry(e)); pickedIds.add(e.id); });
      const isolations = pickWithVariety(libBy(g, 'isolation', pickedIds), 1);
      isolations.forEach(e => { exercises.push(buildExerciseEntry(e)); pickedIds.add(e.id); });
    });
  }

  // Cap to 7 (one-hour session limit)
  return {
    name,
    exercises: exercises.slice(0, 7),
    _tag: tag, // internal — useful for warmup picking later
  };
}

// Public: generate ALL missing templates referenced by a workoutPlan
export function generateMissingTemplates(workoutPlan, existingTemplates = []) {
  const existingNames = new Set((existingTemplates || []).map(w => (w.name || '').toLowerCase()));
  const planNames = [...new Set(Object.values(workoutPlan || {}).filter(Boolean))];
  const missing = planNames.filter(n => !existingNames.has(n.toLowerCase()));
  const generated = [];
  for (const name of missing) {
    const tpl = generateTemplateFromName(name);
    if (tpl.exercises.length > 0) {
      generated.push({ id: newId(), name: tpl.name, exercises: tpl.exercises });
    }
  }
  return generated;
}

// Public: how many plan entries are missing a template?
export function countMissingTemplates(workoutPlan, existingTemplates = []) {
  const existingNames = new Set((existingTemplates || []).map(w => (w.name || '').toLowerCase()));
  const planNames = [...new Set(Object.values(workoutPlan || {}).filter(Boolean))];
  return planNames.filter(n => !existingNames.has(n.toLowerCase())).length;
}
