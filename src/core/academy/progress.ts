import { LESSONS, PASSING_SCORE } from './lessons'

const STORAGE_KEY = 'signallab.academy_progress.v1'

export interface AcademyProgress {
  completedLessonIds: string[]
  quizPassed: boolean
  bestQuizScore: number
  /** Levels 1-10 of the training progression that have been unlocked. */
  level: number
}

const EMPTY: AcademyProgress = {
  completedLessonIds: [],
  quizPassed: false,
  bestQuizScore: 0,
  level: 1,
}

export function loadProgress(): AcademyProgress {
  if (typeof window === 'undefined' || !window.localStorage) return EMPTY
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<AcademyProgress>) }
  } catch {
    return EMPTY
  }
}

export function saveProgress(progress: AcademyProgress): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Progress simply will not persist in this browser context.
  }
}

export function markLessonComplete(progress: AcademyProgress, lessonId: string): AcademyProgress {
  if (progress.completedLessonIds.includes(lessonId)) return progress
  const completedLessonIds = [...progress.completedLessonIds, lessonId]
  return { ...progress, completedLessonIds, level: levelFor(completedLessonIds, progress.quizPassed) }
}

export function recordQuizResult(progress: AcademyProgress, score: number): AcademyProgress {
  const quizPassed = progress.quizPassed || score >= PASSING_SCORE
  const bestQuizScore = Math.max(progress.bestQuizScore, score)
  return {
    ...progress,
    quizPassed,
    bestQuizScore,
    level: levelFor(progress.completedLessonIds, quizPassed),
  }
}

/** The Practice Arena stays locked until the knowledge check is passed. */
export function arenaUnlocked(progress: AcademyProgress): boolean {
  return progress.quizPassed
}

export function lessonsComplete(progress: AcademyProgress): boolean {
  return progress.completedLessonIds.length >= LESSONS.length
}

/**
 * Training level 1-10, earned through lessons and the knowledge check.
 * Progression rewards learning, never trading volume or virtual profit.
 */
function levelFor(completedLessonIds: string[], quizPassed: boolean): number {
  const lessonLevels = Math.min(7, Math.ceil((completedLessonIds.length / LESSONS.length) * 7))
  const base = Math.max(1, lessonLevels)
  return quizPassed ? Math.min(10, base + 1) : base
}

export const LEVEL_NAMES = [
  'Market Basics',
  'Reading Candles',
  'Spot Trading',
  'Risk Management',
  'Signal Reading',
  'Position Sizing',
  'Practice Trading',
  'Discipline',
  'Strategy',
  'Consistency',
]
