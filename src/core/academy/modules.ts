import { LESSONS, type Lesson } from './lessons'

export type ModuleTier = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

export interface AcademyModule {
  id: string
  title: string
  tier: ModuleTier
  summary: string
  /** Lucide icon name, resolved in the UI. */
  icon: 'markets' | 'discipline' | 'signals' | 'simulation'
  lessonIds: string[]
}

/**
 * Lessons grouped into a browsable library. The Academy is optional —
 * nothing here gates the Practice Arena — so this is organized for
 * someone choosing what to learn, not marched through in order.
 */
export const MODULES: AcademyModule[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    tier: 'BEGINNER',
    summary: 'What the market is, and how to read what it is doing.',
    icon: 'markets',
    lessonIds: [
      'what-is-crypto',
      'what-is-bitcoin',
      'spot-trading',
      'buy-sell',
      'orders',
      'candlesticks',
      'volume',
      'trend',
    ],
  },
  {
    id: 'discipline',
    title: 'Trading Discipline',
    tier: 'INTERMEDIATE',
    summary: 'Entries, invalidation, sizing and risk — the controllable parts.',
    icon: 'discipline',
    lessonIds: ['entry', 'target', 'invalidation', 'position-size', 'risk'],
  },
  {
    id: 'signallab',
    title: 'SignalLab',
    tier: 'INTERMEDIATE',
    summary: 'How signals are generated, scored and expired.',
    icon: 'signals',
    lessonIds: ['how-signals-work', 'signal-strength'],
  },
  {
    id: 'simulation',
    title: 'Simulation',
    tier: 'ADVANCED',
    summary: 'How paper trading works here, and what it cannot tell you.',
    icon: 'simulation',
    lessonIds: ['paper-trading', 'paper-vs-real'],
  },
]

export function lessonsFor(module: AcademyModule): Lesson[] {
  return module.lessonIds
    .map((id) => LESSONS.find((lesson) => lesson.id === id))
    .filter((lesson): lesson is Lesson => lesson !== undefined)
}

/** Rough reading time — honest rather than flattering: ~40s per paragraph. */
export function estimatedMinutes(module: AcademyModule): number {
  const paragraphs = lessonsFor(module).reduce((total, lesson) => total + lesson.body.length, 0)
  return Math.max(1, Math.round((paragraphs * 40) / 60))
}

export function moduleProgress(
  module: AcademyModule,
  completedLessonIds: string[],
): { done: number; total: number; pct: number } {
  const total = module.lessonIds.length
  const done = module.lessonIds.filter((id) => completedLessonIds.includes(id)).length
  return { done, total, pct: total === 0 ? 0 : (done / total) * 100 }
}
