import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { loadProgress } from '../core/academy/progress'
import { LESSONS } from '../core/academy/lessons'
import { deriveNextMove } from '../core/signals/lifecycle'
import { useArena } from '../hooks/useArena'
import { HeroTicker } from '../components/home/HeroTicker'
import { MarketPulse } from '../components/home/MarketPulse'
import { NextMove } from '../components/home/NextMove'
import { QuickAccess } from '../components/home/QuickAccess'
import { TrainingStatus } from '../components/home/TrainingStatus'
import { SignalStage } from '../components/signal/SignalStage'
import { SystemBar } from '../components/instrument/SystemBar'

export function HomePage() {
  const {
    snapshot,
    pulse,
    phase,
    now,
    latestSignal,
    nextAnalysisAt,
    progression,
    streak,
    discipline,
  } = useArena()

  const academyProgress = loadProgress()
  const academyIncomplete = academyProgress.completedLessonIds.length < LESSONS.length
  const nextMove = deriveNextMove({ phase, academyIncomplete })

  const btcPulse = pulse?.find((q) => q.symbol === snapshot.symbol)
  const utcClock = new Date(now).toISOString().slice(11, 19)

  return (
    <div>
      <HeroTicker snapshot={snapshot} changePct={btcPulse?.changePct24h} utcClock={utcClock} />

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {/* Primary action — practice is one click from the top of the page,
            with no course to complete first. */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/arena"
            className="btn flex items-center gap-2 border border-long/50 bg-long/15 px-6 py-3 text-sm font-bold tracking-[0.16em] text-long hover:bg-long/25"
          >
            <Zap className="h-4 w-4" aria-hidden />
            PRACTICE NOW
          </Link>
          <Link
            to="/academy"
            className="btn border border-rule-bright px-5 py-3 text-xs font-bold tracking-[0.14em] text-ink-dim hover:text-ink"
          >
            OPEN ACADEMY
          </Link>
          <p className="text-[11px] text-ink-faint">
            No course required. Learn by doing, or study first — your call.
          </p>
        </div>

        <SignalStage
          phase={phase}
          signal={latestSignal}
          nextAnalysisAt={nextAnalysisAt}
          ctaTo="/arena"
        />

        <NextMove move={nextMove} />

        <MarketPulse quotes={pulse} />

        <TrainingStatus
          progression={progression}
          streak={streak}
          disciplineScore={discipline.overall}
        />

        <QuickAccess />

        <SystemBar snapshot={snapshot} signal={latestSignal} sessionCount={progression.sessionCount} utcClock={utcClock} />
      </div>
    </div>
  )
}
