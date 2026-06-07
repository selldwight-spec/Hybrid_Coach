import type { Equipment } from '@/types'

export interface Exercise {
  id: string
  name: string
  category: 'upper_push' | 'upper_pull' | 'lower' | 'core' | 'cardio' | 'full_body'
  movementPattern: string
  primaryMuscles: string[]
  equipment: Equipment[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  cue: string
}

export const EXERCISES: Exercise[] = [
  // ── Lower body ──────────────────────────────────────────────────────────
  { id: 'bb_squat', name: 'Barbell Back Squat', category: 'lower', movementPattern: 'squat', primaryMuscles: ['quads', 'glutes'], equipment: ['full_gym', 'home_full'], difficulty: 'intermediate', cue: 'Brace hard, chest up, knees track toes' },
  { id: 'bb_front_squat', name: 'Barbell Front Squat', category: 'lower', movementPattern: 'squat', primaryMuscles: ['quads', 'core'], equipment: ['full_gym', 'home_full'], difficulty: 'advanced', cue: 'Elbows high, stay upright through the descent' },
  { id: 'goblet_squat', name: 'Goblet Squat', category: 'lower', movementPattern: 'squat', primaryMuscles: ['quads', 'glutes'], equipment: ['full_gym', 'home_full', 'home_basic'], difficulty: 'beginner', cue: 'Hold weight at chest, sit between knees' },
  { id: 'bodyweight_squat', name: 'Bodyweight Squat', category: 'lower', movementPattern: 'squat', primaryMuscles: ['quads', 'glutes'], equipment: ['full_gym', 'home_full', 'home_basic', 'minimal'], difficulty: 'beginner', cue: 'Weight in heels, chest tall' },
  { id: 'split_squat', name: 'Bulgarian Split Squat', category: 'lower', movementPattern: 'squat', primaryMuscles: ['quads', 'glutes'], equipment: ['full_gym', 'home_full', 'home_basic', 'minimal'], difficulty: 'intermediate', cue: 'Front shin vertical, back knee drops straight down' },
  { id: 'leg_press', name: 'Leg Press', category: 'lower', movementPattern: 'squat', primaryMuscles: ['quads', 'glutes'], equipment: ['full_gym'], difficulty: 'beginner', cue: 'Feet shoulder-width, full range without lower back rounding' },
  { id: 'bb_deadlift', name: 'Barbell Deadlift', category: 'lower', movementPattern: 'hinge', primaryMuscles: ['hamstrings', 'glutes', 'back'], equipment: ['full_gym', 'home_full'], difficulty: 'intermediate', cue: 'Bar over mid-foot, hinge and push floor away' },
  { id: 'rdl', name: 'Romanian Deadlift', category: 'lower', movementPattern: 'hinge', primaryMuscles: ['hamstrings', 'glutes'], equipment: ['full_gym', 'home_full', 'home_basic'], difficulty: 'intermediate', cue: 'Soft knees, hinge until stretch felt in hamstrings' },
  { id: 'kb_swing', name: 'Kettlebell Swing', category: 'lower', movementPattern: 'hinge', primaryMuscles: ['glutes', 'hamstrings'], equipment: ['full_gym', 'home_full', 'home_basic'], difficulty: 'intermediate', cue: 'Hip hinge, not a squat — snap hips forward aggressively' },
  { id: 'hip_thrust', name: 'Hip Thrust', category: 'lower', movementPattern: 'hinge', primaryMuscles: ['glutes'], equipment: ['full_gym', 'home_full', 'home_basic'], difficulty: 'beginner', cue: 'Chin tucked, drive hips to full extension, squeeze at top' },
  { id: 'nordic_curl', name: 'Nordic Hamstring Curl', category: 'lower', movementPattern: 'hinge', primaryMuscles: ['hamstrings'], equipment: ['full_gym', 'home_full', 'home_basic', 'minimal'], difficulty: 'advanced', cue: 'Control the descent with hamstrings, use hands to catch' },
  { id: 'step_up', name: 'Step-Up', category: 'lower', movementPattern: 'squat', primaryMuscles: ['quads', 'glutes'], equipment: ['full_gym', 'home_full', 'home_basic', 'minimal'], difficulty: 'beginner', cue: 'Drive through heel of lead foot, avoid pushing off back foot' },
  { id: 'calf_raise', name: 'Calf Raise', category: 'lower', movementPattern: 'isolation', primaryMuscles: ['calves'], equipment: ['full_gym', 'home_full', 'home_basic', 'minimal'], difficulty: 'beginner', cue: 'Full range — pause at top and bottom' },

  // ── Upper push ───────────────────────────────────────────────────────────
  { id: 'bb_bench', name: 'Barbell Bench Press', category: 'upper_push', movementPattern: 'horizontal_push', primaryMuscles: ['chest', 'triceps', 'front delt'], equipment: ['full_gym', 'home_full'], difficulty: 'intermediate', cue: 'Retract scapula, slight arch, bar to lower chest' },
  { id: 'db_bench', name: 'Dumbbell Bench Press', category: 'upper_push', movementPattern: 'horizontal_push', primaryMuscles: ['chest', 'triceps'], equipment: ['full_gym', 'home_full', 'home_basic'], difficulty: 'beginner', cue: 'Elbows 45° from torso, full stretch at bottom' },
  { id: 'incline_db_press', name: 'Incline Dumbbell Press', category: 'upper_push', movementPattern: 'horizontal_push', primaryMuscles: ['upper chest', 'triceps'], equipment: ['full_gym', 'home_full', 'home_basic'], difficulty: 'intermediate', cue: '30–45° incline, press up and slightly back' },
  { id: 'push_up', name: 'Push-Up', category: 'upper_push', movementPattern: 'horizontal_push', primaryMuscles: ['chest', 'triceps', 'front delt'], equipment: ['full_gym', 'home_full', 'home_basic', 'minimal'], difficulty: 'beginner', cue: 'Hollow body, elbows 45°, chest to floor' },
  { id: 'ohp', name: 'Overhead Press', category: 'upper_push', movementPattern: 'vertical_push', primaryMuscles: ['delts', 'triceps'], equipment: ['full_gym', 'home_full'], difficulty: 'intermediate', cue: 'Bar under chin, press to lockout, shift hips forward slightly' },
  { id: 'db_shoulder_press', name: 'Dumbbell Shoulder Press', category: 'upper_push', movementPattern: 'vertical_push', primaryMuscles: ['delts', 'triceps'], equipment: ['full_gym', 'home_full', 'home_basic'], difficulty: 'beginner', cue: 'Neutral grip or pronated, press to full lockout' },
  { id: 'lateral_raise', name: 'Lateral Raise', category: 'upper_push', movementPattern: 'isolation', primaryMuscles: ['lateral delt'], equipment: ['full_gym', 'home_full', 'home_basic'], difficulty: 'beginner', cue: 'Slight forward lean, lead with elbows, control the descent' },
  { id: 'tricep_pushdown', name: 'Tricep Pushdown', category: 'upper_push', movementPattern: 'isolation', primaryMuscles: ['triceps'], equipment: ['full_gym'], difficulty: 'beginner', cue: 'Elbows tucked, extend to lockout, squeeze' },
  { id: 'dips', name: 'Dips', category: 'upper_push', movementPattern: 'vertical_push', primaryMuscles: ['chest', 'triceps'], equipment: ['full_gym', 'home_full', 'home_basic', 'minimal'], difficulty: 'intermediate', cue: 'Lean forward for chest focus, stay upright for tricep focus' },

  // ── Upper pull ───────────────────────────────────────────────────────────
  { id: 'pull_up', name: 'Pull-Up', category: 'upper_pull', movementPattern: 'vertical_pull', primaryMuscles: ['lats', 'biceps'], equipment: ['full_gym', 'home_full', 'home_basic', 'minimal'], difficulty: 'intermediate', cue: 'Dead hang start, drive elbows to pockets, chin over bar' },
  { id: 'chin_up', name: 'Chin-Up', category: 'upper_pull', movementPattern: 'vertical_pull', primaryMuscles: ['lats', 'biceps'], equipment: ['full_gym', 'home_full', 'home_basic', 'minimal'], difficulty: 'intermediate', cue: 'Supinated grip, tuck chin, squeeze biceps at top' },
  { id: 'lat_pulldown', name: 'Lat Pulldown', category: 'upper_pull', movementPattern: 'vertical_pull', primaryMuscles: ['lats'], equipment: ['full_gym'], difficulty: 'beginner', cue: 'Slight lean back, pull bar to upper chest, lead with elbows' },
  { id: 'bb_row', name: 'Barbell Row', category: 'upper_pull', movementPattern: 'horizontal_pull', primaryMuscles: ['lats', 'traps', 'rear delt'], equipment: ['full_gym', 'home_full'], difficulty: 'intermediate', cue: '45° torso, pull to lower rib cage, lead with elbows' },
  { id: 'db_row', name: 'Dumbbell Row', category: 'upper_pull', movementPattern: 'horizontal_pull', primaryMuscles: ['lats', 'traps'], equipment: ['full_gym', 'home_full', 'home_basic'], difficulty: 'beginner', cue: 'Support on bench, row to hip, full stretch at bottom' },
  { id: 'cable_row', name: 'Seated Cable Row', category: 'upper_pull', movementPattern: 'horizontal_pull', primaryMuscles: ['lats', 'rhomboids'], equipment: ['full_gym'], difficulty: 'beginner', cue: 'Neutral spine, pull handle to navel, squeeze shoulder blades' },
  { id: 'face_pull', name: 'Face Pull', category: 'upper_pull', movementPattern: 'horizontal_pull', primaryMuscles: ['rear delt', 'rotator cuff'], equipment: ['full_gym'], difficulty: 'beginner', cue: 'Pull to face, externally rotate, elbows high' },
  { id: 'band_pull_apart', name: 'Band Pull-Apart', category: 'upper_pull', movementPattern: 'horizontal_pull', primaryMuscles: ['rear delt', 'rhomboids'], equipment: ['full_gym', 'home_full', 'home_basic', 'minimal'], difficulty: 'beginner', cue: 'Arms straight, pull band to chest width, squeeze shoulder blades' },
  { id: 'bicep_curl', name: 'Bicep Curl', category: 'upper_pull', movementPattern: 'isolation', primaryMuscles: ['biceps'], equipment: ['full_gym', 'home_full', 'home_basic'], difficulty: 'beginner', cue: 'Elbows fixed at sides, supinate at top, full stretch at bottom' },

  // ── Core ─────────────────────────────────────────────────────────────────
  { id: 'plank', name: 'Plank', category: 'core', movementPattern: 'anti_extension', primaryMuscles: ['core'], equipment: ['full_gym', 'home_full', 'home_basic', 'minimal'], difficulty: 'beginner', cue: 'Squeeze glutes and abs, neutral spine, breathe' },
  { id: 'dead_bug', name: 'Dead Bug', category: 'core', movementPattern: 'anti_extension', primaryMuscles: ['core'], equipment: ['full_gym', 'home_full', 'home_basic', 'minimal'], difficulty: 'beginner', cue: 'Lower back pressed to floor throughout, slow controlled movement' },
  { id: 'ab_wheel', name: 'Ab Wheel Rollout', category: 'core', movementPattern: 'anti_extension', primaryMuscles: ['core'], equipment: ['full_gym', 'home_full', 'home_basic'], difficulty: 'advanced', cue: 'Brace hard before rolling, stop before lower back arches' },
  { id: 'pallof_press', name: 'Pallof Press', category: 'core', movementPattern: 'anti_rotation', primaryMuscles: ['core', 'obliques'], equipment: ['full_gym'], difficulty: 'intermediate', cue: 'Stand tall, press out and resist rotation, return slowly' },
  { id: 'hanging_knee_raise', name: 'Hanging Knee Raise', category: 'core', movementPattern: 'flexion', primaryMuscles: ['hip flexors', 'lower abs'], equipment: ['full_gym', 'home_full', 'home_basic', 'minimal'], difficulty: 'intermediate', cue: 'No swing, posterior pelvic tilt at top, lower controlled' },
]

// Build lookup by movement pattern for substitution
export const SUBSTITUTION_MAP: Record<string, Exercise[]> = EXERCISES.reduce(
  (acc, ex) => {
    if (!acc[ex.movementPattern]) acc[ex.movementPattern] = []
    acc[ex.movementPattern].push(ex)
    return acc
  },
  {} as Record<string, Exercise[]>,
)

export function getSubstitutes(exerciseId: string, userEquipment: Equipment): Exercise[] {
  const target = EXERCISES.find((e) => e.id === exerciseId)
  if (!target) return []
  return EXERCISES.filter(
    (e) =>
      e.id !== exerciseId &&
      e.movementPattern === target.movementPattern &&
      e.equipment.includes(userEquipment),
  )
}

export function searchExercises(query: string, equipment?: Equipment): Exercise[] {
  const q = query.toLowerCase()
  return EXERCISES.filter(
    (e) =>
      (e.name.toLowerCase().includes(q) ||
        e.primaryMuscles.some((m) => m.includes(q)) ||
        e.movementPattern.includes(q)) &&
      (!equipment || e.equipment.includes(equipment)),
  )
}
