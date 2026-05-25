/* ═══════════════════════════════════════════════════════════════════════════
 * EXERCISE LIBRARY
 *
 * Metadata-only library. ~70 essentials covering all major muscle groups.
 * No GIFs, no anatomy illustrations — placeholders only until premium video
 * production is done.
 *
 * Each entry has source + license fields so we can swap visuals later
 * without losing attribution. video_url + thumbnail_url stay null for now;
 * UI renders a styled placeholder (muscle-group icon + gradient).
 *
 * Defaults follow the rest-timer policy: 180s for heavy compounds,
 * 120s default, 90s for isolation/small-muscle work.
 * ═══════════════════════════════════════════════════════════════════════════ */

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

// Compact factory — keeps the list readable
function ex(id, name, muscle, equip, movement, restSec, repRange, opts = {}) {
  return {
    id,
    name,
    primaryMuscle: muscle,
    secondaryMuscles: opts.secondary || [],
    movementType: movement,
    equipment: equip,
    category: muscle,
    defaultRestSec: restSec,
    defaultRepRange: repRange,
    defaultTempo: opts.tempo || '2-0-2',
    isBodyweight: equip === 'bodyweight',
    icon: opts.icon || muscle,
    instructions: opts.instructions || [],
    // Asset metadata — track every visual we attach later
    source: opts.source || 'fitness-app-curated',
    license: opts.license || 'internal',
    video_url: null,        // populated when we have premium video assets
    thumbnail_url: null,    // populated when we have premium thumbnails
  };
}

export const EXERCISE_LIBRARY = [
  // ─── CHEST ─────────────────────────────────────────────────────────────
  ex('bb_bench_press',    'Barbell Bench Press',         'chest', 'barbell',  'compound',  180, '5-8',   { secondary: ['triceps', 'shoulders'] }),
  ex('bb_incline_bench',  'Incline Barbell Bench Press', 'chest', 'barbell',  'compound',  180, '6-10',  { secondary: ['shoulders', 'triceps'] }),
  ex('db_bench_press',    'Dumbbell Bench Press',        'chest', 'dumbbell', 'compound',  150, '8-12',  { secondary: ['triceps', 'shoulders'] }),
  ex('db_incline_press',  'Incline Dumbbell Press',      'chest', 'dumbbell', 'compound',  150, '8-12',  { secondary: ['shoulders'] }),
  ex('db_fly',            'Dumbbell Fly',                'chest', 'dumbbell', 'isolation', 90,  '10-15'),
  ex('cable_fly',         'Cable Fly',                   'chest', 'cable',    'isolation', 90,  '10-15'),
  ex('pec_deck',          'Pec Deck Machine',            'chest', 'machine',  'isolation', 90,  '10-15'),
  ex('machine_chest',     'Machine Chest Press',         'chest', 'machine',  'compound',  120, '8-12'),
  ex('pushup',            'Push-up',                     'chest', 'bodyweight','compound', 90,  '8-20', { secondary: ['triceps', 'core'] }),
  ex('dip',               'Chest Dip',                   'chest', 'bodyweight','compound', 120, '6-12', { secondary: ['triceps'] }),

  // ─── BACK ──────────────────────────────────────────────────────────────
  ex('deadlift',          'Conventional Deadlift',       'back',  'barbell',  'compound',  240, '3-6',   { secondary: ['legs', 'core'] }),
  ex('pullup',            'Pull-up',                     'back',  'bodyweight','compound', 150, '5-10',  { secondary: ['arms'] }),
  ex('chinup',            'Chin-up',                     'back',  'bodyweight','compound', 150, '5-10',  { secondary: ['arms'] }),
  ex('lat_pulldown',      'Lat Pulldown',                'back',  'cable',    'compound',  120, '8-12',  { secondary: ['arms'] }),
  ex('bb_row',            'Barbell Row',                 'back',  'barbell',  'compound',  150, '6-10',  { secondary: ['arms'] }),
  ex('tbar_row',          'T-Bar Row',                   'back',  'barbell',  'compound',  150, '8-12'),
  ex('db_row',            'Single-Arm Dumbbell Row',     'back',  'dumbbell', 'compound',  90,  '8-12'),
  ex('cable_row',         'Seated Cable Row',            'back',  'cable',    'compound',  120, '8-12'),
  ex('chest_supp_row',    'Chest-Supported Row',         'back',  'machine',  'compound',  120, '8-12'),
  ex('face_pull',         'Face Pull',                   'back',  'cable',    'isolation', 60,  '12-15'),
  ex('hyperextension',    'Back Hyperextension',         'back',  'bodyweight','isolation',60,  '10-15'),

  // ─── SHOULDERS ─────────────────────────────────────────────────────────
  ex('ohp',               'Overhead Press',              'shoulders','barbell','compound', 180, '5-8',  { secondary: ['triceps', 'core'] }),
  ex('db_shoulder_press', 'Seated Dumbbell Press',       'shoulders','dumbbell','compound',150, '8-12', { secondary: ['triceps'] }),
  ex('machine_shoulder',  'Machine Shoulder Press',      'shoulders','machine','compound', 120, '8-12'),
  ex('db_lateral',        'Dumbbell Lateral Raise',      'shoulders','dumbbell','isolation',60,  '10-15'),
  ex('cable_lateral',     'Cable Lateral Raise',         'shoulders','cable',  'isolation', 60,  '12-15'),
  ex('rear_delt_fly',     'Rear Delt Fly',               'shoulders','dumbbell','isolation',60,  '12-15'),
  ex('arnold_press',      'Arnold Press',                'shoulders','dumbbell','compound', 120, '8-12'),
  ex('bb_shrug',          'Barbell Shrug',               'shoulders','barbell','isolation', 90,  '8-12'),

  // ─── ARMS ──────────────────────────────────────────────────────────────
  ex('bb_curl',           'Barbell Curl',                'arms',  'barbell',  'isolation', 90,  '8-12'),
  ex('db_curl',           'Dumbbell Curl',               'arms',  'dumbbell', 'isolation', 90,  '8-12'),
  ex('hammer_curl',       'Hammer Curl',                 'arms',  'dumbbell', 'isolation', 90,  '8-12'),
  ex('preacher_curl',     'Preacher Curl',               'arms',  'barbell',  'isolation', 90,  '8-12'),
  ex('cable_curl',        'Cable Curl',                  'arms',  'cable',    'isolation', 90,  '10-12'),
  ex('tricep_pushdown',   'Tricep Pushdown',             'arms',  'cable',    'isolation', 90,  '10-15'),
  ex('skullcrusher',      'Skullcrusher',                'arms',  'barbell',  'isolation', 90,  '8-12'),
  ex('overhead_tricep',   'Overhead Tricep Extension',   'arms',  'dumbbell', 'isolation', 90,  '10-12'),
  ex('close_grip_bench',  'Close-Grip Bench Press',      'arms',  'barbell',  'compound',  150, '6-10', { secondary: ['chest'] }),
  ex('tricep_dip',        'Tricep Dip',                  'arms',  'bodyweight','compound', 120, '6-12'),

  // ─── LEGS ──────────────────────────────────────────────────────────────
  ex('bb_back_squat',     'Barbell Back Squat',          'legs',  'barbell',  'compound',  240, '5-8',  { secondary: ['core', 'glutes'] }),
  ex('bb_front_squat',    'Barbell Front Squat',         'legs',  'barbell',  'compound',  180, '5-8'),
  ex('leg_press',         'Leg Press',                   'legs',  'machine',  'compound',  150, '8-12'),
  ex('hack_squat',        'Hack Squat',                  'legs',  'machine',  'compound',  150, '8-12'),
  ex('rdl',               'Romanian Deadlift',           'legs',  'barbell',  'compound',  150, '6-10', { secondary: ['back'] }),
  ex('stiff_leg_dl',      'Stiff-Leg Deadlift',          'legs',  'barbell',  'compound',  150, '8-12'),
  ex('walking_lunge',     'Walking Lunge',               'legs',  'dumbbell', 'compound',  120, '10-12'),
  ex('bulgarian_split',   'Bulgarian Split Squat',       'legs',  'dumbbell', 'compound',  120, '8-12'),
  ex('leg_curl',          'Leg Curl',                    'legs',  'machine',  'isolation', 90,  '10-15'),
  ex('leg_extension',     'Leg Extension',               'legs',  'machine',  'isolation', 90,  '10-15'),
  ex('calf_raise',        'Standing Calf Raise',         'legs',  'machine',  'isolation', 60,  '10-15'),
  ex('hip_thrust',        'Barbell Hip Thrust',          'legs',  'barbell',  'compound',  120, '8-12', { secondary: ['glutes'] }),
  ex('glute_bridge',      'Glute Bridge',                'legs',  'bodyweight','isolation',60,  '12-15'),

  // ─── CORE ──────────────────────────────────────────────────────────────
  ex('plank',             'Plank',                       'core',  'bodyweight','stability',60,  '30-60s'),
  ex('side_plank',        'Side Plank',                  'core',  'bodyweight','stability',60,  '20-45s'),
  ex('hanging_leg_raise', 'Hanging Leg Raise',           'core',  'bodyweight','isolation', 90,  '8-15'),
  ex('cable_crunch',      'Cable Crunch',                'core',  'cable',    'isolation', 60,  '10-15'),
  ex('russian_twist',     'Russian Twist',               'core',  'bodyweight','isolation', 60,  '20-30'),
  ex('ab_wheel',          'Ab Wheel Rollout',            'core',  'bodyweight','isolation', 90,  '6-12'),
  ex('dead_bug',          'Dead Bug',                    'core',  'bodyweight','stability', 60,  '10-15'),
  ex('wood_chop',         'Cable Wood Chop',             'core',  'cable',    'isolation', 60,  '10-12'),

  // ─── CARDIO / CONDITIONING ─────────────────────────────────────────────
  ex('running',           'Running',                     'cardio','cardio',   'cardio',    0,   '20-45m', { tempo: '' }),
  ex('cycling',           'Cycling',                     'cardio','cardio',   'cardio',    0,   '30-60m', { tempo: '' }),
  ex('rowing_machine',    'Rowing Machine',              'cardio','cardio',   'cardio',    0,   '15-30m', { tempo: '' }),
  ex('elliptical',        'Elliptical',                  'cardio','cardio',   'cardio',    0,   '20-40m', { tempo: '' }),
  ex('jump_rope',         'Jump Rope',                   'cardio','cardio',   'cardio',    60,  '3-5min'),
  ex('stair_master',      'Stair Master',                'cardio','cardio',   'cardio',    0,   '15-30m', { tempo: '' }),
  ex('burpee',            'Burpee',                      'cardio','bodyweight','compound', 60,  '10-20'),
  ex('mountain_climber',  'Mountain Climber',            'cardio','bodyweight','cardio',   60,  '20-40s'),
  ex('battle_rope',       'Battle Ropes',                'cardio','cardio',   'cardio',    60,  '20-30s'),
  ex('kettlebell_swing',  'Kettlebell Swing',            'cardio','kettlebell','compound', 90,  '15-25', { secondary: ['legs', 'back'] }),
];

// ─── HELPERS ──────────────────────────────────────────────────────────────
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
    // Find last completed set in this exercise
    const completedSets = (exEntry.sets || []).filter(s => s.completedAt && s.weight && s.reps);
    if (completedSets.length === 0) continue;
    const last = completedSets[completedSets.length - 1];
    return { weight: last.weight, reps: last.reps, date };
  }
  return null;
}
