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


  // ═══ EXTENDED LIBRARY (210 entries from free-exercise-db, CC0/public-domain) ═══

  // ─── CHEST (free-exercise-db, public domain) ─────────────────
  ex('alt_floor_press', 'Alternating Floor Press', 'chest', 'kettlebell', 'compound', 180, '8-12', { secondary: ['core', 'shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_bench_press_medium_grip', 'Barbell Bench Press - Medium Grip', 'chest', 'barbell', 'compound', 180, '8-12', { secondary: ['shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_incline_bench_press_medium_grip', 'Barbell Incline Bench Press - Medium Grip', 'chest', 'barbell', 'compound', 180, '8-12', { secondary: ['shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('cable_chest_press', 'Cable Chest Press', 'chest', 'cable', 'compound', 180, '8-12', { secondary: ['shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('decline_bb_bench_press', 'Decline Barbell Bench Press', 'chest', 'barbell', 'compound', 180, '8-12', { secondary: ['shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('decline_db_bench_press', 'Decline Dumbbell Bench Press', 'chest', 'dumbbell', 'compound', 180, '8-12', { secondary: ['shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('decline_db_flyes', 'Decline Dumbbell Flyes', 'chest', 'dumbbell', 'compound', 180, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('decline_smith_press', 'Decline Smith Press', 'chest', 'machine', 'compound', 180, '8-12', { secondary: ['shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('db_bench_press_with_neutral_grip', 'Dumbbell Bench Press with Neutral Grip', 'chest', 'dumbbell', 'compound', 180, '8-12', { secondary: ['shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('extended_range_sa_kb_floor_press', 'Extended Range One-Arm Kettlebell Floor Press', 'chest', 'kettlebell', 'compound', 180, '8-12', { secondary: ['shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('front_raise_and_pullover', 'Front Raise And Pullover', 'chest', 'barbell', 'compound', 180, '8-12', { secondary: ['back', 'shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('hammer_grip_incline_db_bench_press', 'Hammer Grip Incline DB Bench Press', 'chest', 'dumbbell', 'compound', 180, '8-12', { secondary: ['shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('incline_cable_chest_press', 'Incline Cable Chest Press', 'chest', 'cable', 'compound', 180, '8-12', { secondary: ['shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('incline_db_bench_with_palms_facing_in', 'Incline Dumbbell Bench With Palms Facing In', 'chest', 'dumbbell', 'compound', 180, '8-12', { secondary: ['shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('incline_db_flyes', 'Incline Dumbbell Flyes', 'chest', 'dumbbell', 'compound', 180, '8-12', { secondary: ['shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('incline_db_flyes_with_a_twist', 'Incline Dumbbell Flyes - With A Twist', 'chest', 'dumbbell', 'compound', 180, '8-12', { secondary: ['shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('incline_push_up', 'Incline Push-Up', 'chest', 'bodyweight', 'compound', 180, '8-12', { secondary: ['shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('incline_push_up_medium', 'Incline Push-Up Medium', 'chest', 'bodyweight', 'compound', 180, '8-12', { secondary: ['core', 'shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('incline_push_up_reverse_grip', 'Incline Push-Up Reverse Grip', 'chest', 'bodyweight', 'compound', 180, '8-12', { secondary: ['core', 'shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('incline_push_up_wide', 'Incline Push-Up Wide', 'chest', 'bodyweight', 'compound', 180, '8-12', { secondary: ['core', 'shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('isometric_chest_squeezes', 'Isometric Chest Squeezes', 'chest', 'bodyweight', 'compound', 180, '8-12', { secondary: ['shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('isometric_wipers', 'Isometric Wipers', 'chest', 'bodyweight', 'compound', 180, '8-12', { secondary: ['core', 'shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),

  // ─── BACK (free-exercise-db, public domain) ─────────────────
  ex('bent_over_bb_row', 'Bent Over Barbell Row', 'back', 'barbell', 'compound', 180, '8-12', { secondary: ['arms', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bent_over_sa_long_bar_row', 'Bent Over One-Arm Long Bar Row', 'back', 'barbell', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bent_over_two_db_row', 'Bent Over Two-Dumbbell Row', 'back', 'dumbbell', 'compound', 180, '8-12', { secondary: ['arms', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bent_over_two_db_row_with_palms_in', 'Bent Over Two-Dumbbell Row With Palms In', 'back', 'dumbbell', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('clean_shrug', 'Clean Shrug', 'back', 'barbell', 'compound', 180, '8-12', { secondary: ['arms', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('close_grip_front_lat_pulldown', 'Close-Grip Front Lat Pulldown', 'back', 'cable', 'compound', 180, '8-12', { secondary: ['arms', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('db_incline_row', 'Dumbbell Incline Row', 'back', 'dumbbell', 'compound', 180, '8-12', { secondary: ['arms', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('kneeling_high_pulley_row', 'Kneeling High Pulley Row', 'back', 'cable', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('kneeling_sa_high_pulley_row', 'Kneeling Single-Arm High Pulley Row', 'back', 'cable', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('leverage_high_row', 'Leverage High Row', 'back', 'machine', 'compound', 180, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('leverage_iso_row', 'Leverage Iso Row', 'back', 'machine', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('sa_db_row', 'One-Arm Dumbbell Row', 'back', 'dumbbell', 'compound', 180, '8-12', { secondary: ['arms', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('sa_long_bar_row', 'One-Arm Long Bar Row', 'back', 'barbell', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('sa_lat_pulldown', 'One Arm Lat Pulldown', 'back', 'cable', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('pullups', 'Pullups', 'back', 'bodyweight', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('seat_cable_rows', 'Seated Cable Rows', 'back', 'cable', 'compound', 180, '8-12', { secondary: ['arms', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('shotgun_row', 'Shotgun Row', 'back', 'cable', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('smith_machine_bent_over_row', 'Smith Machine Bent Over Row', 'back', 'machine', 'compound', 180, '8-12', { secondary: ['arms', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('smith_machine_upright_row', 'Smith Machine Upright Row', 'back', 'machine', 'compound', 180, '8-12', { secondary: ['arms', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('stand_db_upright_row', 'Standing Dumbbell Upright Row', 'back', 'dumbbell', 'compound', 180, '8-12', { secondary: ['arms', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('stiff_leg_bb_good_morning', 'Stiff Leg Barbell Good Morning', 'back', 'barbell', 'compound', 180, '8-12', { secondary: ['legs'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('straight_bar_bench_mid_rows', 'Straight Bar Bench Mid Rows', 'back', 'barbell', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('superman', 'Superman', 'back', 'bodyweight', 'compound', 180, '8-12', { secondary: ['legs'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('t_bar_row_with_handle', 'T-Bar Row with Handle', 'back', 'barbell', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('underhand_cable_pulldowns', 'Underhand Cable Pulldowns', 'back', 'cable', 'compound', 180, '8-12', { secondary: ['arms', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('v_bar_pullup', 'V-Bar Pullup', 'back', 'bodyweight', 'compound', 180, '8-12', { secondary: ['arms', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('wide_grip_lat_pulldown', 'Wide-Grip Lat Pulldown', 'back', 'cable', 'compound', 180, '8-12', { secondary: ['arms', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_deadlift', 'Barbell Deadlift', 'back', 'barbell', 'compound', 180, '8-12', { secondary: ['legs', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bent_arm_bb_pullover', 'Bent-Arm Barbell Pullover', 'back', 'barbell', 'compound', 180, '8-12', { secondary: ['chest', 'shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bent_over_two_arm_long_bar_row', 'Bent Over Two-Arm Long Bar Row', 'back', 'barbell', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),

  // ─── SHOULDERS (free-exercise-db, public domain) ─────────────────
  ex('alt_cable_shoulder_press', 'Alternating Cable Shoulder Press', 'shoulders', 'cable', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('anti_gravity_press', 'Anti-Gravity Press', 'shoulders', 'barbell', 'compound', 180, '8-12', { secondary: ['back', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_incline_shoulder_raise', 'Barbell Incline Shoulder Raise', 'shoulders', 'barbell', 'compound', 180, '8-12', { secondary: ['chest'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_rear_delt_row', 'Barbell Rear Delt Row', 'shoulders', 'barbell', 'compound', 180, '8-12', { secondary: ['arms', 'back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bradford_rocky_presses', 'Bradford/Rocky Presses', 'shoulders', 'barbell', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('cable_internal_rotation', 'Cable Internal Rotation', 'shoulders', 'cable', 'compound', 180, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('cable_rope_rear_delt_rows', 'Cable Rope Rear-Delt Rows', 'shoulders', 'cable', 'compound', 180, '8-12', { secondary: ['arms', 'back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('cable_shoulder_press', 'Cable Shoulder Press', 'shoulders', 'cable', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('db_raise', 'Dumbbell Raise', 'shoulders', 'dumbbell', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('kb_pirate_ships', 'Kettlebell Pirate Ships', 'shoulders', 'kettlebell', 'compound', 180, '8-12', { secondary: ['core'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('leverage_shoulder_press', 'Leverage Shoulder Press', 'shoulders', 'machine', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('low_pulley_row_to_neck', 'Low Pulley Row To Neck', 'shoulders', 'cable', 'compound', 180, '8-12', { secondary: ['arms', 'back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('machine_shoulder_military_press', 'Machine Shoulder (Military) Press', 'shoulders', 'machine', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('seat_cable_shoulder_press', 'Seated Cable Shoulder Press', 'shoulders', 'cable', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('smith_machine_sa_upright_row', 'Smith Machine One-Arm Upright Row', 'shoulders', 'machine', 'compound', 180, '8-12', { secondary: ['arms', 'back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('smith_machine_overhead_shoulder_press', 'Smith Machine Overhead Shoulder Press', 'shoulders', 'machine', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('stand_alt_db_press', 'Standing Alternating Dumbbell Press', 'shoulders', 'dumbbell', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('stand_bradford_press', 'Standing Bradford Press', 'shoulders', 'barbell', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('stand_db_press', 'Standing Dumbbell Press', 'shoulders', 'dumbbell', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('stand_military_press', 'Standing Military Press', 'shoulders', 'barbell', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('stand_palm_in_sa_db_press', 'Standing Palm-In One-Arm Dumbbell Press', 'shoulders', 'dumbbell', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('upright_bb_row', 'Upright Barbell Row', 'shoulders', 'barbell', 'compound', 180, '8-12', { secondary: ['back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('alt_kb_press', 'Alternating Kettlebell Press', 'shoulders', 'kettlebell', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('arnold_db_press', 'Arnold Dumbbell Press', 'shoulders', 'dumbbell', 'compound', 180, '8-12', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('back_flyes_with_bands', 'Back Flyes - With Bands', 'shoulders', 'band', 'compound', 180, '8-12', { secondary: ['back', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_shoulder_press', 'Barbell Shoulder Press', 'shoulders', 'barbell', 'compound', 180, '8-12', { secondary: ['chest', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('clean_and_press', 'Clean and Press', 'shoulders', 'barbell', 'compound', 180, '8-12', { secondary: ['core', 'legs', 'back', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('cuban_press', 'Cuban Press', 'shoulders', 'dumbbell', 'compound', 180, '8-12', { secondary: ['back'], source: 'free-exercise-db', license: 'public-domain' }),

  // ─── ARMS (free-exercise-db, public domain) ─────────────────
  ex('bench_dips', 'Bench Dips', 'arms', 'bodyweight', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('close_grip_bb_bench_press', 'Close-Grip Barbell Bench Press', 'arms', 'barbell', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('close_grip_db_press', 'Close-Grip Dumbbell Press', 'arms', 'dumbbell', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('dip_machine', 'Dip Machine', 'arms', 'machine', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('dips_triceps_version', 'Dips - Triceps Version', 'arms', 'bodyweight', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('incline_push_up_close_grip', 'Incline Push-Up Close-Grip', 'arms', 'bodyweight', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('jm_press', 'JM Press', 'arms', 'barbell', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('smith_machine_close_grip_bench_press', 'Smith Machine Close-Grip Bench Press', 'arms', 'machine', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bench_press_powerlifting', 'Bench Press - Powerlifting', 'arms', 'barbell', 'compound', 120, '8-12', { secondary: ['chest', 'back', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('board_press', 'Board Press', 'arms', 'barbell', 'compound', 120, '8-12', { secondary: ['chest', 'back', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bottoms_up_clean_from_the_hang_position', 'Bottoms-Up Clean From The Hang Position', 'arms', 'kettlebell', 'compound', 120, '8-12', { secondary: ['shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('close_grip_push_up_off_of_a_db', 'Close-Grip Push-Up off of a Dumbbell', 'arms', 'bodyweight', 'compound', 120, '8-12', { secondary: ['core', 'chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('decline_close_grip_bench_to_skull_crushe', 'Decline Close-Grip Bench To Skull Crusher', 'arms', 'barbell', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('drag_curl', 'Drag Curl', 'arms', 'barbell', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('db_floor_press', 'Dumbbell Floor Press', 'arms', 'dumbbell', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('floor_press', 'Floor Press', 'arms', 'barbell', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('floor_press_with_chains', 'Floor Press with Chains', 'arms', 'barbell', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('high_cable_curls', 'High Cable Curls', 'arms', 'cable', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('sa_floor_press', 'One Arm Floor Press', 'arms', 'barbell', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('pin_presses', 'Pin Presses', 'arms', 'barbell', 'compound', 120, '8-12', { secondary: ['chest', 'back', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('push_ups_close_triceps_position', 'Push-Ups - Close Triceps Position', 'arms', 'bodyweight', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('reverse_band_bench_press', 'Reverse Band Bench Press', 'arms', 'barbell', 'compound', 120, '8-12', { secondary: ['chest', 'back', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('reverse_triceps_bench_press', 'Reverse Triceps Bench Press', 'arms', 'barbell', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('alt_hammer_curl', 'Alternate Hammer Curl', 'arms', 'dumbbell', 'isolation', 60, '10-15', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('alt_incline_db_curl', 'Alternate Incline Dumbbell Curl', 'arms', 'dumbbell', 'isolation', 60, '10-15', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_curls_lying_against_an_incline', 'Barbell Curls Lying Against An Incline', 'arms', 'barbell', 'isolation', 60, '10-15', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('bench_press_with_chains', 'Bench Press with Chains', 'arms', 'barbell', 'compound', 120, '8-12', { secondary: ['chest', 'back', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('body_tricep_press', 'Body Tricep Press', 'arms', 'bodyweight', 'isolation', 60, '10-15', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('cable_hammer_curls_rope_attachment', 'Cable Hammer Curls - Rope Attachment', 'arms', 'cable', 'isolation', 60, '10-15', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('cable_incline_triceps_extension', 'Cable Incline Triceps Extension', 'arms', 'cable', 'isolation', 60, '10-15', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('cable_lying_triceps_extension', 'Cable Lying Triceps Extension', 'arms', 'cable', 'isolation', 60, '10-15', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('cable_sa_tricep_extension', 'Cable One Arm Tricep Extension', 'arms', 'cable', 'isolation', 60, '10-15', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('cable_preacher_curl', 'Cable Preacher Curl', 'arms', 'cable', 'isolation', 60, '10-15', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('cable_rope_overhead_triceps_extension', 'Cable Rope Overhead Triceps Extension', 'arms', 'cable', 'isolation', 60, '10-15', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('cable_wrist_curl', 'Cable Wrist Curl', 'arms', 'cable', 'isolation', 60, '10-15', { source: 'free-exercise-db', license: 'public-domain' }),

  // ─── LEGS (free-exercise-db, public domain) ─────────────────
  ex('bb_side_split_squat', 'Barbell Side Split Squat', 'legs', 'barbell', 'compound', 180, '6-10', { secondary: ['back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_squat', 'Barbell Squat', 'legs', 'barbell', 'compound', 180, '6-10', { secondary: ['back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_walking_lunge', 'Barbell Walking Lunge', 'legs', 'barbell', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('bodyweight_squat', 'Bodyweight Squat', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('cable_deadlifts', 'Cable Deadlifts', 'legs', 'cable', 'compound', 180, '6-10', { secondary: ['arms', 'back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('chair_squat', 'Chair Squat', 'legs', 'machine', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('clean_deadlift', 'Clean Deadlift', 'legs', 'barbell', 'compound', 180, '6-10', { secondary: ['arms', 'back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('double_leg_butt_kick', 'Double Leg Butt Kick', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('db_lunges', 'Dumbbell Lunges', 'legs', 'dumbbell', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('db_squat', 'Dumbbell Squat', 'legs', 'dumbbell', 'compound', 180, '6-10', { secondary: ['back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('fast_skipping', 'Fast Skipping', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('flutter_kicks', 'Flutter Kicks', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('glute_kickback', 'Glute Kickback', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('goblet_squat', 'Goblet Squat', 'legs', 'kettlebell', 'compound', 180, '6-10', { secondary: ['shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('inchworm', 'Inchworm', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('knee_circles', 'Knee Circles', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('knee_tuck_jump', 'Knee Tuck Jump', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('lateral_bound', 'Lateral Bound', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('leverage_deadlift', 'Leverage Deadlift', 'legs', 'machine', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('plie_db_squat', 'Plie Dumbbell Squat', 'legs', 'dumbbell', 'compound', 180, '6-10', { secondary: ['core'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('pull_through', 'Pull Through', 'legs', 'cable', 'compound', 180, '6-10', { secondary: ['back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('rocket_jump', 'Rocket Jump', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('scissors_jump', 'Scissors Jump', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('single_leg_butt_kick', 'Single Leg Butt Kick', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('smith_machine_squat', 'Smith Machine Squat', 'legs', 'machine', 'compound', 180, '6-10', { secondary: ['back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('smith_machine_stiff_legged_deadlift', 'Smith Machine Stiff-Legged Deadlift', 'legs', 'machine', 'compound', 180, '6-10', { secondary: ['back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('smith_single_leg_split_squat', 'Smith Single-Leg Split Squat', 'legs', 'machine', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('split_jump', 'Split Jump', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('split_squat_with_dbs', 'Split Squat with Dumbbells', 'legs', 'dumbbell', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('stand_long_jump', 'Standing Long Jump', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('star_jump', 'Star Jump', 'legs', 'bodyweight', 'compound', 180, '6-10', { secondary: ['shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('step_up_with_knee_raise', 'Step-up with Knee Raise', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('stiff_legged_db_deadlift', 'Stiff-Legged Dumbbell Deadlift', 'legs', 'dumbbell', 'compound', 180, '6-10', { secondary: ['back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('vertical_swing', 'Vertical Swing', 'legs', 'dumbbell', 'compound', 180, '6-10', { secondary: ['shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('alt_hang_clean', 'Alternating Hang Clean', 'legs', 'kettlebell', 'compound', 180, '6-10', { secondary: ['arms', 'back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('band_good_morning', 'Band Good Morning', 'legs', 'band', 'compound', 180, '6-10', { secondary: ['back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('band_good_morning_pull_through', 'Band Good Morning (Pull Through)', 'legs', 'band', 'compound', 180, '6-10', { secondary: ['back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_full_squat', 'Barbell Full Squat', 'legs', 'barbell', 'compound', 180, '6-10', { secondary: ['back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_glute_bridge', 'Barbell Glute Bridge', 'legs', 'barbell', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_hack_squat', 'Barbell Hack Squat', 'legs', 'barbell', 'compound', 180, '6-10', { secondary: ['arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_lunge', 'Barbell Lunge', 'legs', 'barbell', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_step_ups', 'Barbell Step Ups', 'legs', 'barbell', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('bench_jump', 'Bench Jump', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('box_squat', 'Box Squat', 'legs', 'barbell', 'compound', 180, '6-10', { secondary: ['back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('clean', 'Clean', 'legs', 'barbell', 'compound', 180, '6-10', { secondary: ['arms', 'back', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('clean_pull', 'Clean Pull', 'legs', 'barbell', 'compound', 180, '6-10', { secondary: ['arms', 'back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('clean_from_blocks', 'Clean from Blocks', 'legs', 'barbell', 'compound', 180, '6-10', { secondary: ['shoulders', 'back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('double_kb_alt_hang_clean', 'Double Kettlebell Alternating Hang Clean', 'legs', 'kettlebell', 'compound', 180, '6-10', { secondary: ['arms', 'back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('db_clean', 'Dumbbell Clean', 'legs', 'dumbbell', 'compound', 180, '6-10', { secondary: ['arms', 'back', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('db_rear_lunge', 'Dumbbell Rear Lunge', 'legs', 'dumbbell', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('db_squat_to_a_bench', 'Dumbbell Squat To A Bench', 'legs', 'dumbbell', 'compound', 180, '6-10', { secondary: ['back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('db_step_ups', 'Dumbbell Step Ups', 'legs', 'dumbbell', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('elevated_back_lunge', 'Elevated Back Lunge', 'legs', 'barbell', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('frankenstein_squat', 'Frankenstein Squat', 'legs', 'barbell', 'compound', 180, '6-10', { secondary: ['core'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('freehand_jump_squat', 'Freehand Jump Squat', 'legs', 'bodyweight', 'compound', 180, '6-10', { source: 'free-exercise-db', license: 'public-domain' }),

  // ─── CORE (free-exercise-db, public domain) ─────────────────
  ex('3_4_sit_up', '3/4 Sit-Up', 'core', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('air_bike', 'Air Bike', 'core', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('bent_knee_hip_raise', 'Bent-Knee Hip Raise', 'core', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('bottoms_up', 'Bottoms Up', 'core', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('butt_ups', 'Butt-Ups', 'core', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('cable_judo_flip', 'Cable Judo Flip', 'core', 'cable', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('cable_russian_twists', 'Cable Russian Twists', 'core', 'cable', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('cocoons', 'Cocoons', 'core', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('cross_body_crunch', 'Cross-Body Crunch', 'core', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('decline_oblique_crunch', 'Decline Oblique Crunch', 'core', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('decline_reverse_crunch', 'Decline Reverse Crunch', 'core', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('elbow_to_knee', 'Elbow to Knee', 'core', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('flat_bench_leg_pull_in', 'Flat Bench Leg Pull-In', 'core', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('jackknife_sit_up', 'Jackknife Sit-Up', 'core', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('landmine_180_s', 'Landmine 180\'s', 'core', 'barbell', 'compound', 120, '8-12', { secondary: ['legs', 'back', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('leg_pull_in', 'Leg Pull-In', 'core', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('pallof_press_with_rotation', 'Pallof Press With Rotation', 'core', 'cable', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('seat_flat_bench_leg_pull_in', 'Seated Flat Bench Leg Pull-In', 'core', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('side_jackknife', 'Side Jackknife', 'core', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('spell_caster', 'Spell Caster', 'core', 'dumbbell', 'compound', 120, '8-12', { secondary: ['legs', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('spider_crawl', 'Spider Crawl', 'core', 'bodyweight', 'compound', 120, '8-12', { secondary: ['chest', 'shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('stand_cable_lift', 'Standing Cable Lift', 'core', 'cable', 'compound', 120, '8-12', { secondary: ['shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('stand_cable_wood_chop', 'Standing Cable Wood Chop', 'core', 'cable', 'compound', 120, '8-12', { secondary: ['shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_ab_rollout', 'Barbell Ab Rollout', 'core', 'barbell', 'compound', 120, '8-12', { secondary: ['back', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_rollout_from_bench', 'Barbell Rollout from Bench', 'core', 'barbell', 'compound', 120, '8-12', { secondary: ['legs', 'back', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('gorilla_chin_crunch', 'Gorilla Chin/Crunch', 'core', 'bodyweight', 'compound', 120, '8-12', { secondary: ['arms', 'back'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('kb_pass_between_the_legs', 'Kettlebell Pass Between The Legs', 'core', 'kettlebell', 'compound', 120, '8-12', { secondary: ['legs', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('kb_windmill', 'Kettlebell Windmill', 'core', 'kettlebell', 'compound', 120, '8-12', { secondary: ['legs', 'shoulders', 'arms'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('alt_heel_touchers', 'Alternate Heel Touchers', 'core', 'bodyweight', 'isolation', 60, '12-20', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('bb_ab_rollout_on_knees', 'Barbell Ab Rollout - On Knees', 'core', 'barbell', 'compound', 120, '8-12', { secondary: ['back', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),

  // ─── CARDIO (free-exercise-db, public domain) ─────────────────
  ex('wind_sprints', 'Wind Sprints', 'cardio', 'bodyweight', 'compound', 120, '8-12', { source: 'free-exercise-db', license: 'public-domain' }),
  ex('db_seat_box_jump', 'Dumbbell Seated Box Jump', 'cardio', 'dumbbell', 'compound', 120, '8-12', { secondary: ['legs'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('lunge_sprint', 'Lunge Sprint', 'cardio', 'machine', 'compound', 120, '8-12', { secondary: ['legs'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('bench_sprint', 'Bench Sprint', 'cardio', 'machine', 'compound', 120, '8-12', { secondary: ['legs'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('box_jump_multiple_response', 'Box Jump (Multiple Response)', 'cardio', 'machine', 'compound', 120, '8-12', { secondary: ['legs'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('front_box_jump', 'Front Box Jump', 'cardio', 'machine', 'compound', 120, '8-12', { secondary: ['legs'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('lateral_box_jump', 'Lateral Box Jump', 'cardio', 'machine', 'compound', 120, '8-12', { secondary: ['legs'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('prowler_sprint', 'Prowler Sprint', 'cardio', 'machine', 'compound', 120, '8-12', { secondary: ['legs', 'chest', 'shoulders'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('side_hop_sprint', 'Side Hop-Sprint', 'cardio', 'machine', 'compound', 120, '8-12', { secondary: ['legs'], source: 'free-exercise-db', license: 'public-domain' }),
  ex('single_cone_sprint_drill', 'Single-Cone Sprint Drill', 'cardio', 'machine', 'isolation', 90, '10-15', { secondary: ['legs'], source: 'free-exercise-db', license: 'public-domain' }),
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
