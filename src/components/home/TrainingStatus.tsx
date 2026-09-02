import { Flame } from 'lucide-react'
import {
  levelInfo,
  todaysFocus,
  trainedToday,
  type ProgressionState,
} from '../../core/progression/ProgressionEngine'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'

interface TrainingStatusProps {
  progression: ProgressionState
  streak: number
  disciplineScore: number
}

/**
 * The returning-user panel: session number, today's focus, streak and
 * level. Streak counts TRAINING days — a lesson or a review keeps it
 * alive, so nobody is pushed into taking a trade to protect a number.
 */
export function TrainingStatus({ progression, streak, disciplineScore }: TrainingStatusProps) {
  const level = levelInfo(progression.xp)
  const focus = todaysFocus()
  const startedToday = trainedToday(progression)
  const animatedXp = useAnimatedNumber(progression.xp)
  const animatedScore = useAnimatedNumber(disciplineScore)

  return (
    <section className="surface rounded-sm">
      <div className="grid gap-px bg-rule md:grid-cols-3">
        {/* Session + focus */}
        <div className="bg-panel-1 p-5">
          <p className="label">Session {String(progression.sessionCount).padStart(2, '0')}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
            {startedToday ? 'IN PROGRESS' : 'READY?'}
          </p>

          <div className="mt-4">
            <p className="label">Today&apos;s focus</p>
            <p className="mt-1 text-sm font-semibold text-instrument">{focus.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-dim">{focus.detail}</p>
          </div>
        </div>

        {/* Level + XP */}
        <div className="bg-panel-1 p-5">
          <p className="label">Level {String(level.level).padStart(2, '0')}</p>
          <p className="mt-2 text-lg font-bold uppercase tracking-tight text-ink">{level.title}</p>

          <div className="mt-4">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="tabular text-[11px] text-ink-dim">{Math.round(animatedXp)} XP</span>
              <span className="tabular text-[11px] text-ink-faint">
                {level.xpToNext === undefined ? 'MAX' : `${level.xpToNext} to next`}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden bg-panel-3">
              <div
                className="meter-fill h-full bg-xp"
                style={{ width: `${Math.max(2, level.progressPct)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-ink-faint">
              XP comes from lessons, reviews and rule-following — never from trade count.
            </p>
          </div>
        </div>

        {/* Streak + discipline */}
        <div className="bg-panel-1 p-5">
          <p className="label">Training streak</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-ink">
            <Flame
              className={`h-5 w-5 ${streak > 0 ? 'text-hold' : 'text-ink-faint'}`}
              aria-hidden
            />
            <span className="tabular">{streak}</span>
            <span className="text-sm font-medium text-ink-dim">
              {streak === 1 ? 'DAY' : 'DAYS'}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-ink-faint">
            {startedToday
              ? 'Today: training recorded'
              : 'Today: not started — any lesson or review counts'}
          </p>

          <div className="mt-4">
            <p className="label">Discipline score</p>
            <p
              className={`tabular mt-1 text-2xl font-bold ${
                disciplineScore >= 85 ? 'text-long' : disciplineScore >= 60 ? 'text-hold' : 'text-short'
              }`}
            >
              {Math.round(animatedScore)}
              <span className="ml-1 text-xs font-medium text-ink-faint">/ 100</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
