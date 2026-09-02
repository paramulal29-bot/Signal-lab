import { beforeEach, describe, expect, it } from 'vitest'
import {
  awardXp,
  currentStreak,
  levelInfo,
  loadProgression,
  saveProgression,
  startSession,
  trainedToday,
  utcDay,
  XP_AWARDS,
  type ProgressionState,
} from './ProgressionEngine'

const DAY = 86_400_000
const NOW = Date.parse('2026-03-10T12:00:00Z')

function state(overrides: Partial<ProgressionState> = {}): ProgressionState {
  return {
    xp: 0,
    trainingDays: [],
    grantedAwardIds: [],
    sessionCount: 0,
    lastSessionDate: undefined,
    ...overrides,
  }
}

describe('levels', () => {
  it('starts at level 1', () => {
    expect(levelInfo(0).level).toBe(1)
  })

  it('advances with XP and reports progress toward the next level', () => {
    const info = levelInfo(400)
    expect(info.level).toBeGreaterThan(1)
    expect(info.xpToNext).toBeGreaterThan(0)
    expect(info.progressPct).toBeGreaterThan(0)
    expect(info.progressPct).toBeLessThanOrEqual(100)
  })

  it('caps at the final level without a next threshold', () => {
    const info = levelInfo(999_999)
    expect(info.level).toBe(10)
    expect(info.xpToNext).toBeUndefined()
    expect(info.progressPct).toBe(100)
  })
})

describe('XP awards', () => {
  it('grants XP for a training action', () => {
    const next = awardXp(state(), 'LESSON_COMPLETED', 'lesson-1', NOW)
    expect(next.xp).toBe(XP_AWARDS.LESSON_COMPLETED)
  })

  it('is idempotent — the same award never pays twice', () => {
    const once = awardXp(state(), 'LESSON_COMPLETED', 'lesson-1', NOW)
    const twice = awardXp(once, 'LESSON_COMPLETED', 'lesson-1', NOW)
    expect(twice.xp).toBe(once.xp)
    expect(twice).toBe(once)
  })

  it('records the day so training activity counts toward the streak', () => {
    const next = awardXp(state(), 'TRADE_REVIEWED', 'review-1', NOW)
    expect(next.trainingDays).toEqual([utcDay(NOW)])
  })

  it('has no award for placing trades or for virtual profit', () => {
    // The XP table is the whole reward surface; nothing in it can be
    // farmed by trading more or by winning.
    expect(Object.keys(XP_AWARDS).sort()).toEqual([
      'KNOWLEDGE_CHECK_PASSED',
      'LESSON_COMPLETED',
      'PATIENCE_HELD',
      'RULES_FOLLOWED',
      'TRADE_REVIEWED',
    ])
  })
})

describe('streaks', () => {
  it('is zero with no training days', () => {
    expect(currentStreak(state(), NOW)).toBe(0)
  })

  it('counts consecutive days back from today', () => {
    const days = [utcDay(NOW - 2 * DAY), utcDay(NOW - DAY), utcDay(NOW)]
    expect(currentStreak(state({ trainingDays: days }), NOW)).toBe(3)
  })

  it('survives until a full day is missed', () => {
    const days = [utcDay(NOW - 2 * DAY), utcDay(NOW - DAY)]
    expect(currentStreak(state({ trainingDays: days }), NOW)).toBe(2)
  })

  it('breaks after a missed day', () => {
    const days = [utcDay(NOW - 5 * DAY), utcDay(NOW - 4 * DAY)]
    expect(currentStreak(state({ trainingDays: days }), NOW)).toBe(0)
  })

  it('counts a lesson day even with no trades placed', () => {
    const learned = awardXp(state(), 'LESSON_COMPLETED', 'lesson-1', NOW)
    expect(currentStreak(learned, NOW)).toBe(1)
    expect(trainedToday(learned, NOW)).toBe(true)
  })
})

describe('sessions', () => {
  it('increments once per day', () => {
    const first = startSession(state(), NOW)
    const again = startSession(first, NOW + 3_600_000)
    expect(first.sessionCount).toBe(1)
    expect(again.sessionCount).toBe(1)
  })

  it('increments on a new day', () => {
    const first = startSession(state(), NOW)
    const nextDay = startSession(first, NOW + DAY)
    expect(nextDay.sessionCount).toBe(2)
  })

  it('awards no XP by itself — showing up is not an achievement', () => {
    expect(startSession(state(), NOW).xp).toBe(0)
  })
})

describe('persistence', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips through storage', () => {
    const saved = awardXp(state(), 'LESSON_COMPLETED', 'lesson-1', NOW)
    saveProgression(saved)
    expect(loadProgression().xp).toBe(saved.xp)
  })

  it('returns a usable empty state when nothing is stored', () => {
    expect(loadProgression().xp).toBe(0)
  })
})
