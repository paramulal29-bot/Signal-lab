/**
 * Training progression: XP, levels, streaks and sessions.
 *
 * What earns XP is a product decision, not a cosmetic one. This system
 * rewards LEARNING and DISCIPLINE:
 *
 *   - completing a lesson or the knowledge check
 *   - reviewing a completed trade
 *   - following the rules on a trade (correct sizing, entry in window)
 *   - waiting out a signal without chasing it after expiry
 *
 * It deliberately awards NOTHING for: number of trades placed, virtual
 * profit, time spent on the page, refreshing, or chasing expired
 * setups. A user cannot grind XP by overtrading — the only way up is to
 * train better, which is the message the whole product exists to send.
 */

const STORAGE_KEY = 'signallab.progression.v1'

export type XpReason =
  | 'LESSON_COMPLETED'
  | 'KNOWLEDGE_CHECK_PASSED'
  | 'TRADE_REVIEWED'
  | 'RULES_FOLLOWED'
  | 'PATIENCE_HELD'

export const XP_AWARDS: Record<XpReason, number> = {
  LESSON_COMPLETED: 40,
  KNOWLEDGE_CHECK_PASSED: 150,
  TRADE_REVIEWED: 60,
  RULES_FOLLOWED: 80,
  PATIENCE_HELD: 30,
}

export interface ProgressionState {
  xp: number
  /** ISO dates (UTC, yyyy-mm-dd) on which a training activity happened. */
  trainingDays: string[]
  /** Ids of one-off awards already granted, so XP can never be farmed twice. */
  grantedAwardIds: string[]
  sessionCount: number
  lastSessionDate: string | undefined
}

const EMPTY: ProgressionState = {
  xp: 0,
  trainingDays: [],
  grantedAwardIds: [],
  sessionCount: 0,
  lastSessionDate: undefined,
}

export const LEVELS = [
  'Market Basics',
  'Reading Candles',
  'Spot Trading',
  'Risk Management',
  'Signal Reading',
  'Position Sizing',
  'Practice Trading',
  'Discipline Trainee',
  'Strategy',
  'Consistency',
]

/** XP required to reach each level (index 0 = level 1). */
const LEVEL_THRESHOLDS = [0, 150, 350, 600, 900, 1_300, 1_800, 2_400, 3_100, 4_000]

export interface LevelInfo {
  level: number
  title: string
  xpIntoLevel: number
  xpForLevel: number
  progressPct: number
  xpToNext: number | undefined
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
  }

  const floor = LEVEL_THRESHOLDS[level - 1]
  const ceiling = LEVEL_THRESHOLDS[level]
  const isMax = ceiling === undefined

  return {
    level,
    title: LEVELS[level - 1] ?? LEVELS[LEVELS.length - 1],
    xpIntoLevel: xp - floor,
    xpForLevel: isMax ? 0 : ceiling - floor,
    progressPct: isMax ? 100 : ((xp - floor) / (ceiling - floor)) * 100,
    xpToNext: isMax ? undefined : ceiling - xp,
  }
}

export function utcDay(timestamp = Date.now()): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

export function loadProgression(): ProgressionState {
  if (typeof window === 'undefined' || !window.localStorage) return EMPTY
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<ProgressionState>) }
  } catch {
    return EMPTY
  }
}

export function saveProgression(state: ProgressionState): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Progress will not persist in this browser context.
  }
}

/**
 * Awards XP for a training action. `awardId` makes each award
 * idempotent — re-reviewing the same trade or re-opening a lesson does
 * not pay out twice.
 */
export function awardXp(
  state: ProgressionState,
  reason: XpReason,
  awardId: string,
  now = Date.now(),
): ProgressionState {
  if (state.grantedAwardIds.includes(awardId)) return state

  const day = utcDay(now)
  return {
    ...state,
    xp: state.xp + XP_AWARDS[reason],
    grantedAwardIds: [...state.grantedAwardIds, awardId],
    trainingDays: state.trainingDays.includes(day)
      ? state.trainingDays
      : [...state.trainingDays, day].sort(),
  }
}

/** Records that the user showed up and trained today. */
export function startSession(state: ProgressionState, now = Date.now()): ProgressionState {
  const day = utcDay(now)
  if (state.lastSessionDate === day) return state

  return {
    ...state,
    sessionCount: state.sessionCount + 1,
    lastSessionDate: day,
    trainingDays: state.trainingDays.includes(day)
      ? state.trainingDays
      : [...state.trainingDays, day].sort(),
  }
}

/**
 * Consecutive-day training streak, counted back from today (or
 * yesterday, so a streak is not lost until a full day is missed).
 *
 * Any legitimate training activity counts — a lesson, a review, a
 * practice session. Nothing here requires placing a trade, because
 * pressuring anyone to trade daily would be the opposite of the point.
 */
export function currentStreak(state: ProgressionState, now = Date.now()): number {
  if (state.trainingDays.length === 0) return 0

  const days = new Set(state.trainingDays)
  const dayMs = 86_400_000
  const today = utcDay(now)
  const yesterday = utcDay(now - dayMs)

  // A streak stays alive through today even before today's session.
  let cursor = days.has(today) ? now : days.has(yesterday) ? now - dayMs : undefined
  if (cursor === undefined) return 0

  let streak = 0
  while (days.has(utcDay(cursor))) {
    streak += 1
    cursor -= dayMs
  }
  return streak
}

export function trainedToday(state: ProgressionState, now = Date.now()): boolean {
  return state.trainingDays.includes(utcDay(now))
}

/**
 * The day's training focus. Rotates deterministically by date so it is
 * stable across reloads within a day, and is a coaching prompt only —
 * it never gates anything.
 */
const FOCUS_ROTATION = [
  { title: 'ENTRY DISCIPLINE', detail: 'Only enter inside the signal window. An expired setup is not a setup.' },
  { title: 'POSITION SIZING', detail: 'Let the distance to invalidation decide your size — not your confidence.' },
  { title: 'PATIENCE', detail: 'No valid setup is a valid outcome. The market does not owe you a trade.' },
  { title: 'RISK CONTROL', detail: 'Keep risk constant. One bad size can undo ten good decisions.' },
  { title: 'REVIEW QUALITY', detail: 'Review every closed trade, especially the ones that went your way.' },
]

export function todaysFocus(now = Date.now()): { title: string; detail: string } {
  const dayIndex = Math.floor(now / 86_400_000)
  return FOCUS_ROTATION[dayIndex % FOCUS_ROTATION.length]
}
